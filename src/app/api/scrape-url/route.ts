import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createDataSourceService } from '@/lib/services/dataSource'
import { TableName } from '@/helpers/string_const/tables'
import { DataSourceStatus, DataSourceType } from '@/helpers/string_const/dataSource'
import { inngest } from '@/lib/inngest/client'
import axios from 'axios'
import * as cheerio from 'cheerio'

// Validation constants
const MAX_URL_LENGTH = 2048
const MAX_CONTENT_SIZE = 5 * 1024 * 1024 // 5MB content limit
const TIMEOUT = 30000 // 30 seconds

export async function POST(request: NextRequest) {
  console.log('🚀 URL Scraping API called')
  
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
    const { url } = await request.json()
    
    if (!url) {
      console.error('❌ No URL provided')
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      )
    }

    console.log('🌐 URL received:', url)

    // Validate URL
    if (typeof url !== 'string' || url.length > MAX_URL_LENGTH) {
      console.error('❌ Invalid URL:', url)
      return NextResponse.json(
        { error: 'Invalid URL format or URL too long' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      console.error('❌ Invalid URL format:', url)
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    console.log('✅ URL validation passed')

    // Scrape the URL
    console.log('🕷️ Scraping URL content...')
    let scrapedContent: string
    let title: string
    
    try {
      const response = await axios.get(url, {
        timeout: TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        maxContentLength: MAX_CONTENT_SIZE,
        maxBodyLength: MAX_CONTENT_SIZE
      })

      const $ = cheerio.load(response.data)
      
      // Extract title
      title = $('title').first().text().trim() || new URL(url).hostname
      
      // Remove unwanted elements
      $('script, style, nav, header, footer, aside, .advertisement, .ads, .social-share').remove()
      
      // Extract main content - prioritize main content areas
      let content = ''
      const mainSelectors = ['main', 'article', '.content', '.post-content', '.entry-content', '#content']
      
      for (const selector of mainSelectors) {
        const mainContent = $(selector).first()
        if (mainContent.length && mainContent.text().trim().length > content.length) {
          content = mainContent.text().trim()
        }
      }
      
      // Fallback to body if no main content found
      if (!content) {
        content = $('body').text().trim()
      }
      
      // Clean up whitespace
      scrapedContent = content
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim()

      if (!scrapedContent) {
        throw new Error('No content could be extracted from the URL')
      }

      console.log('✅ Content scraped successfully, length:', scrapedContent.length)
      
    } catch (error: any) {
      console.error('❌ Failed to scrape URL:', error.message)
      return NextResponse.json(
        { error: `Failed to scrape URL: ${error.message}` },
        { status: 400 }
      )
    }

    // Create database record
    console.log('💾 Creating database record...')
    const dataSourceResult = await dataSourceService.createDataSource({
      name: title,
      type: DataSourceType.TXT,
      size: Buffer.byteLength(scrapedContent, 'utf8'),
      storage_path: url, // Store the original URL in storage_path
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
        name: 'url/process',
        data: {
          dataSourceId: dataSource.id,
          companyId: userProfile.company_id,
          url: url,
          title: title,
          content: scrapedContent,
          type: 'url'
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
    console.log('🎉 URL scraping completed successfully, processing in background')
    return NextResponse.json({
      success: true,
      data: {
        id: dataSource.id,
        name: dataSource.name,
        type: dataSource.type,
        size: dataSource.size,
        status: dataSource.status,
        created_at: dataSource.uploadedAt,
        url: url,
        message: 'URL content scraped successfully and is being processed in the background'
      }
    })

  } catch (error) {
    console.error('❌ Unexpected error in URL scraping API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 