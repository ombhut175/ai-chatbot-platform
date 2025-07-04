import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createDataSourceService } from '@/lib/services/dataSource'
import { TableName } from '@/helpers/string_const/tables'
import { DataSourceStatus, DataSourceType } from '@/helpers/string_const/dataSource'
import { inngest } from '@/lib/inngest/client'

// Validation constants
const MAX_QUESTION_LENGTH = 1000
const MAX_ANSWER_LENGTH = 10000

export async function POST(request: NextRequest) {
  console.log('🚀 Q&A Pairs API called')
  
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

    // Parse request body
    const { question, answer } = await request.json()
    
    if (!question || !answer) {
      console.error('❌ Missing question or answer')
      return NextResponse.json(
        { error: 'Both question and answer are required' },
        { status: 400 }
      )
    }

    console.log('📝 Q&A pair received:', { question: question.substring(0, 50) + '...', answer: answer.substring(0, 50) + '...' })

    // Validate input lengths
    if (typeof question !== 'string' || question.trim().length === 0 || question.length > MAX_QUESTION_LENGTH) {
      console.error('❌ Invalid question')
      return NextResponse.json(
        { error: `Question must be between 1 and ${MAX_QUESTION_LENGTH} characters` },
        { status: 400 }
      )
    }

    if (typeof answer !== 'string' || answer.trim().length === 0 || answer.length > MAX_ANSWER_LENGTH) {
      console.error('❌ Invalid answer')
      return NextResponse.json(
        { error: `Answer must be between 1 and ${MAX_ANSWER_LENGTH} characters` },
        { status: 400 }
      )
    }

    console.log('✅ Q&A validation passed')

    // Format the Q&A content
    const qaContent = `Question: ${question.trim()}\n\nAnswer: ${answer.trim()}`
    const qaTitle = `Q&A: ${question.trim().substring(0, 50)}${question.trim().length > 50 ? '...' : ''}`

    // Create database record
    console.log('💾 Creating database record...')
    const dataSourceResult = await dataSourceService.createDataSource({
      name: qaTitle,
      type: DataSourceType.TXT,
      size: Buffer.byteLength(qaContent, 'utf8'),
      storage_path: 'qa-pair', // No file storage for Q&A pairs
      company_id: userProfile.company_id,
      status: DataSourceStatus.PROCESSING
    })

    if (!dataSourceResult.success) {
      console.error('❌ Database creation failed:', dataSourceResult.error)
      return NextResponse.json(
        { error: dataSourceResult.error || 'Failed to create database record' },
        { status: 500 }
      )
    }

    const dataSource = dataSourceResult.data!
    console.log('✅ Database record created:', dataSource.id)

    // Send event to Inngest for background processing
    console.log('🎯 Sending event to Inngest for background processing...')
    try {
      await inngest.send({
        name: 'qa/process',
        data: {
          dataSourceId: dataSource.id,
          companyId: userProfile.company_id,
          question: question.trim(),
          answer: answer.trim(),
          content: qaContent,
          type: 'qa'
        }
      })
      console.log('✅ Inngest event sent successfully')
    } catch (inngestError) {
      console.error('❌ Failed to send Inngest event:', inngestError)
      
      // Update database status to error
      await dataSourceService.updateDataSource(dataSource.id, { status: DataSourceStatus.ERROR })
      
      return NextResponse.json(
        { error: 'Failed to start background processing' },
        { status: 500 }
      )
    }

    // Return immediate response
    console.log('🎉 Q&A pair created successfully, processing in background')
    return NextResponse.json({
      success: true,
      data: {
        id: dataSource.id,
        name: dataSource.name,
        type: dataSource.type,
        size: dataSource.size,
        status: dataSource.status,
        created_at: dataSource.uploadedAt,
        question: question.trim(),
        answer: answer.trim(),
        message: 'Q&A pair created successfully and is being processed in the background'
      }
    })

  } catch (error) {
    console.error('❌ Unexpected error in Q&A pairs API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 