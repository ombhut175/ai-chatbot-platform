import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiKeyService } from '@/lib/services/apiKey'
import { createChatbotService } from '@/lib/services/chatbot'
import { TableName } from '@/helpers/string_const/tables'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const { chatbotId } = await params
  console.log('🔑 Get API keys for chatbot:', chatbotId)
  
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

    // Verify the chatbot belongs to the user's company
    const chatbotService = createChatbotService(supabase)
    const chatbotResult = await chatbotService.getChatbotById(chatbotId)
    
    if (!chatbotResult.success || !chatbotResult.data) {
      return NextResponse.json(
        { error: 'Chatbot not found' },
        { status: 404 }
      )
    }

    if (chatbotResult.data.company_id !== userProfile.company_id) {
      return NextResponse.json(
        { error: 'Unauthorized access to chatbot' },
        { status: 403 }
      )
    }

    // Get API keys for the chatbot
    const apiKeyService = createApiKeyService(supabase)
    const result = await apiKeyService.getApiKeysByChatbot(chatbotId)
    
    if (!result.success) {
      console.error('❌ Failed to fetch API keys:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to fetch API keys' },
        { status: 500 }
      )
    }

    console.log('✅ Fetched API keys successfully')
    
    return NextResponse.json({
      success: true,
      data: result.data || []
    })
  } catch (error) {
    console.error('❌ Unexpected error in get API keys:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const { chatbotId } = await params
  console.log('🔑 Create API key for chatbot:', chatbotId)
  
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

    // Verify the chatbot belongs to the user's company
    const chatbotService = createChatbotService(supabase)
    const chatbotResult = await chatbotService.getChatbotById(chatbotId)
    
    if (!chatbotResult.success || !chatbotResult.data) {
      return NextResponse.json(
        { error: 'Chatbot not found' },
        { status: 404 }
      )
    }

    if (chatbotResult.data.company_id !== userProfile.company_id) {
      return NextResponse.json(
        { error: 'Unauthorized access to chatbot' },
        { status: 403 }
      )
    }

    // Create new API key
    const apiKeyService = createApiKeyService(supabase)
    const result = await apiKeyService.createApiKey(chatbotId)
    
    if (!result.success || !result.data) {
      console.error('❌ Failed to create API key:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to create API key' },
        { status: 500 }
      )
    }

    console.log('✅ API key created successfully')
    
    return NextResponse.json({
      success: true,
      data: result.data
    })
  } catch (error) {
    console.error('❌ Unexpected error in create API key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
