import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createStorageService } from '@/lib/services/storage'
import { createDataSourceService } from '@/lib/services/dataSource'
import { TableName } from '@/helpers/string_const/tables'
import { DataSourceStatus } from '@/helpers/string_const/dataSource'
import { inngest } from '@/lib/inngest/client'

// Validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/json',
  'text/plain'
]

const TYPE_TO_EXTENSION: Record<string, string> = {
  'application/pdf': 'pdf',
  'text/csv': 'csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/json': 'json',
  'text/plain': 'txt'
}

export async function POST(request: NextRequest) {
  console.log('🚀 Upload API called')
  
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Create dataSource service with server client
    const dataSourceService = createDataSourceService(supabase)
    
    if (authError || !user) {
      console.error('❌ Authentication error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.email)

    // Get user profile to find company_id
    const { data: userProfile } = await supabase
      .from(TableName.USERS)
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userProfile?.company_id) {
      console.error('❌ User has no company_id')
      return NextResponse.json(
        { error: 'User not associated with a company' },
        { status: 400 }
      )
    }

    console.log('✅ Company ID found:', userProfile.company_id)

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.error('❌ No file provided')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('📁 File received:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      console.error('❌ File too large:', file.size)
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error('❌ Invalid file type:', file.type)
      return NextResponse.json(
        { error: 'File type not supported. Please upload PDF, CSV, XLSX, DOCX, JSON, or TXT files.' },
        { status: 400 }
      )
    }

    console.log('✅ File validation passed')

    // Get file extension
    const fileExtension = TYPE_TO_EXTENSION[file.type]
    if (!fileExtension) {
      console.error('❌ Could not determine file extension for type:', file.type)
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      )
    }

    // Upload to Supabase Storage
    console.log('📤 Uploading to Supabase storage...')
    
    // Create file path with company folder structure: company_id/timestamp_filename.ext
    const timestamp = new Date().getTime()
    const fileName = `${timestamp}_${file.name}`
    const filePath = `${userProfile.company_id}/${fileName}`
    
    const uploadResult = await createStorageService(supabase).uploadFile(file, filePath, file.type)
    
    if (!uploadResult.success) {
      console.error('❌ Storage upload failed:', uploadResult.error)
      return NextResponse.json(
        { error: uploadResult.error || 'Failed to upload file' },
        { status: 500 }
      )
    }

    console.log('✅ File uploaded to storage:', uploadResult.data?.path)

    // Create database record
    console.log('💾 Creating database record...')
    const dataSourceResult = await dataSourceService.createDataSource({
      name: file.name,
      type: fileExtension as any,
      size: file.size,
      storage_path: uploadResult.data!.path,
      company_id: userProfile.company_id,
      status: DataSourceStatus.PROCESSING
    })

    if (!dataSourceResult.success) {
      console.error('❌ Database creation failed:', dataSourceResult.error)
      
      // Clean up uploaded file
      await createStorageService(supabase).deleteFile(uploadResult.data!.path)
      
      return NextResponse.json(
        { error: dataSourceResult.error || 'Failed to create database record' },
        { status: 500 }
      )
    }

    const dataSource = dataSourceResult.data!
    console.log('✅ Database record created:', dataSource.id)

    // Send event to Inngest for background processing
    console.log('🎯 Sending event to Inngest for background processing...')
    console.log('📊 Inngest environment:', {
      NODE_ENV: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
      hasEventKey: !!process.env.INNGEST_EVENT_KEY,
      hasSigningKey: !!process.env.INNGEST_SIGNING_KEY,
      integrationMode: process.env.VERCEL ? 'Vercel Integration' : 'Manual Configuration'
    })
    
    try {
      const eventId = await inngest.send({
        name: 'file/process',
        data: {
          dataSourceId: dataSource.id,
          companyId: userProfile.company_id,
          fileName: file.name,
          fileType: fileExtension,
          storagePath: uploadResult.data!.path
        }
      })
      console.log('✅ Inngest event sent successfully, event ID:', eventId)
    } catch (inngestError) {
      console.error('❌ Failed to send Inngest event:', inngestError)
      console.error('📊 Error details:', {
        name: inngestError instanceof Error ? inngestError.name : 'Unknown',
        message: inngestError instanceof Error ? inngestError.message : String(inngestError),
        stack: inngestError instanceof Error ? inngestError.stack : undefined
      })
      
             // Update database status to error
       await dataSourceService.updateDataSource(dataSource.id, { status: DataSourceStatus.ERROR })
      
      return NextResponse.json(
        { error: 'Failed to start background processing' },
        { status: 500 }
      )
    }

    // Return immediate response
    console.log('🎉 Upload completed successfully, processing in background')
    return NextResponse.json({
      success: true,
      data: {
        id: dataSource.id,
        name: dataSource.name,
        type: dataSource.type,
        size: dataSource.size,
        status: dataSource.status,
                 created_at: dataSource.uploadedAt,
        message: 'File uploaded successfully and is being processed in the background'
      }
    })

  } catch (error) {
    console.error('❌ Unexpected error in upload API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 