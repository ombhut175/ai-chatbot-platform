import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'
import { createApiKeyService } from '@/lib/services/apiKey'
import { createChatService } from '@/lib/services/chat'
import { TableName } from '@/helpers/string_const/tables'

export async function POST(request: NextRequest) {
  console.log('🤖 Public Chat API called')
  
  try {
    // Extract API key from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header. Expected format: Bearer YOUR_API_KEY' },
        { status: 401 }
      )
    }

    const apiKey = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    // Parse request body
    const body = await request.json()
    const { message, sessionId } = body

    // Validate request body
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Create public Supabase client for API key validation
    const publicSupabase = await createPublicClient()
    const apiKeyService = createApiKeyService(publicSupabase)
    
    // Validate API key
    const keyValidation = await apiKeyService.validateApiKey(apiKey)
    if (!keyValidation.success || !keyValidation.data) {
      console.error('❌ Invalid API key')
      return NextResponse.json(
        { error: 'Invalid or inactive API key' },
        { status: 401 }
      )
    }

    const { chatbot_id: chatbotId } = keyValidation.data
    console.log('✅ API key validated for chatbot:', chatbotId)

    // Get chatbot configuration
    const { data: chatbot, error: chatbotError } = await publicSupabase
      .from(TableName.CHATBOTS)
      .select('*')
      .eq('id', chatbotId)
      .eq('is_active', true)
      .single()

    if (chatbotError || !chatbot) {
      console.error('❌ Chatbot not found or inactive:', chatbotError)
      return NextResponse.json(
        { error: 'Chatbot not found or inactive' },
        { status: 404 }
      )
    }

    // Create or use existing session
    const finalSessionId = sessionId || `api_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Check if session exists or create new one
    let chatSession
    if (sessionId) {
      const { data: existingSession } = await publicSupabase
        .from(TableName.CHAT_SESSIONS)
        .select('*')
        .eq('session_id', sessionId)
        .eq('chatbot_id', chatbotId)
        .single()
      
      chatSession = existingSession
    }

    if (!chatSession) {
      // Create new session
      const { data: newSession, error: sessionError } = await publicSupabase
        .from(TableName.CHAT_SESSIONS)
        .insert({
          chatbot_id: chatbotId,
          session_id: finalSessionId,
          user_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
          user_agent: request.headers.get('user-agent') || null,
          // Note: user_id is null for API access (not tied to a specific user)
        })
        .select()
        .single()

      if (sessionError) {
        console.error('❌ Failed to create chat session:', sessionError)
        return NextResponse.json(
          { error: 'Failed to create chat session' },
          { status: 500 }
        )
      }

      chatSession = newSession
    }

    // Use the chat service to process the message
    const chatService = createChatService(publicSupabase)
    const startTime = Date.now()

    // Get AI response
    const chatResult = await chatService.processMessage({
      message,
      chatbotId,
      sessionId: chatSession.id,
      chatbotConfig: {
        personality: chatbot.personality,
        welcome_message: chatbot.welcome_message,
        name: chatbot.name,
        pinecone_namespace: chatbot.pinecone_namespace
      }
    })

    if (!chatResult.success || !chatResult.data) {
      console.error('❌ Failed to process message:', chatResult.error)
      return NextResponse.json(
        { error: chatResult.error || 'Failed to process message' },
        { status: 500 }
      )
    }

    const responseTime = Date.now() - startTime

    // Save messages to database
    const { error: messageError } = await publicSupabase
      .from(TableName.CHAT_MESSAGES)
      .insert([
        {
          session_id: chatSession.id,
          chatbot_id: chatbotId,
          message: message,
          message_type: 'user',
          created_at: new Date().toISOString()
        },
        {
          session_id: chatSession.id,
          chatbot_id: chatbotId,
          message: chatResult.data.response,
          message_type: 'assistant',
          response_time_ms: responseTime,
          created_at: new Date().toISOString()
        }
      ])

    if (messageError) {
      console.error('⚠️ Failed to save messages:', messageError)
      // Don't fail the request if message saving fails
    }

    console.log('✅ Public chat API response sent successfully')

    return NextResponse.json({
      success: true,
      data: {
        response: chatResult.data.response,
        sessionId: finalSessionId,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Unexpected error in public chat API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Options endpoint for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
