import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createChatbotService } from '@/lib/services/chatbot'
import { TableName } from '@/helpers/string_const/tables'
import { ChatbotType, ChatbotPersonality } from '@/helpers/string_const/chatbot'
import { inngest } from '@/lib/inngest/client'

export async function GET(request: NextRequest) {
  console.log('🤖 Get chatbots API called')
  
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
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

    // Create chatbot service with server client
    const chatbotService = createChatbotService(supabase)
    
    // Fetch chatbots for the company
    const result = await chatbotService.getChatbotsByCompany(userProfile.company_id)
    
    if (!result.success) {
      console.error('❌ Failed to fetch chatbots:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to fetch chatbots' },
        { status: 500 }
      )
    }

    console.log('✅ Fetched chatbots successfully:', result.data?.length || 0)
    
    return NextResponse.json({
      success: true,
      data: result.data || []
    })
  } catch (error) {
    console.error('❌ Unexpected error in get chatbots:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  console.log('🤖 Create chatbot API called')
  
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
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
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.description) {
      console.error('❌ Missing required fields')
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      )
    }

    console.log('📝 Creating chatbot:', {
      name: body.name,
      type: body.type || ChatbotType.PUBLIC,
      personality: body.personality || ChatbotPersonality.PROFESSIONAL,
      dataSourcesCount: body.data_source_ids?.length || 0
    })

    // Create chatbot service with server client
    const chatbotService = createChatbotService(supabase)
    
    // Generate unique namespace for this chatbot
    const pineconeNamespace = `chatbot_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    // Create the chatbot
    const result = await chatbotService.createChatbot({
      name: body.name,
      description: body.description,
      type: body.type || ChatbotType.PUBLIC,
      welcome_message: body.welcome_message || 'Hello! How can I help you today?',
      personality: body.personality || ChatbotPersonality.PROFESSIONAL,
      theme: body.theme || {
        primaryColor: "#3B82F6",
        backgroundColor: "#FFFFFF", 
        textColor: "#1F2937",
      },
      company_id: userProfile.company_id,
      pinecone_namespace: pineconeNamespace,
      data_source_ids: body.data_source_ids || []
    })

    if (!result.success || !result.data) {
      console.error('❌ Failed to create chatbot:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to create chatbot' },
        { status: 500 }
      )
    }

    const chatbot = result.data
    console.log('✅ Chatbot created successfully:', chatbot.id)

    // If data sources are provided, trigger training process
    if (body.data_source_ids && body.data_source_ids.length > 0) {
      console.log('🎯 Sending event to Inngest for chatbot training...')
      try {
        await inngest.send({
          name: 'chatbot/train',
          data: {
            chatbotId: chatbot.id,
            companyId: userProfile.company_id,
            dataSourceIds: body.data_source_ids,
            chatbotName: chatbot.name
          }
        })
        console.log('✅ Inngest training event sent successfully')
      } catch (inngestError) {
        console.error('❌ Failed to send Inngest training event:', inngestError)
        // Don't fail the chatbot creation, just log the error
        console.warn('Chatbot created but training may need to be triggered manually')
      }
    }

    console.log('🎉 Chatbot creation completed successfully')
    return NextResponse.json({
      success: true,
      data: chatbot
    })
  } catch (error) {
    console.error('❌ Unexpected error in create chatbot:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 