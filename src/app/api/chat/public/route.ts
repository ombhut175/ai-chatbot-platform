import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pineconeService } from '@/lib/services/pinecone'
import { geminiService } from '@/lib/services/gemini'
import { TableName } from '@/helpers/string_const/tables'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  console.log('💬 Public chat API called')
  
  try {
    const body = await request.json()
    const { message, chatbotId, sessionId } = body

    // Validate required fields
    if (!message || !chatbotId) {
      console.error('❌ Missing required fields')
      return NextResponse.json(
        { error: 'Message and chatbotId are required' },
        { status: 400 }
      )
    }

    console.log('📝 Chat request:', {
      chatbotId,
      sessionId,
      messageLength: message.length
    })

    // Get chatbot details from Supabase
    const supabase = await createClient()
    const { data: chatbot, error: chatbotError } = await supabase
      .from(TableName.CHATBOTS)
      .select('*, company_id')
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

    console.log('✅ Chatbot found:', chatbot.name)
    console.log('📍 Pinecone namespace:', chatbot.pinecone_namespace)

    // Create or get session
    let currentSessionId = sessionId
    if (!currentSessionId) {
      // Create new session - generate a unique session_id string
      currentSessionId = uuidv4()
      const { error: sessionError } = await supabase
        .from(TableName.CHAT_SESSIONS)
        .insert({
          chatbot_id: chatbotId,
          session_id: currentSessionId,
          user_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        })

      if (sessionError) {
        console.error('❌ Failed to create session:', sessionError)
      }
    }

    // Store user message
    const { error: userMessageError } = await supabase
      .from(TableName.CHAT_MESSAGES)
      .insert({
        session_id: currentSessionId,
        chatbot_id: chatbotId,
        message_type: 'user',
        message: message
      })

    if (userMessageError) {
      console.error('⚠️ Failed to store user message:', userMessageError)
    }

    // Convert user message to embeddings
    console.log('🔍 Creating embeddings for user query...')
    const embeddingResult = await pineconeService.createEmbeddings(message)
    
    if (!embeddingResult.success || !embeddingResult.embeddings) {
      console.error('❌ Failed to create embeddings:', embeddingResult.error)
      return NextResponse.json(
        { error: 'Failed to process your message' },
        { status: 500 }
      )
    }

    console.log('✅ Embeddings created successfully')

    // Check if chatbot has a pinecone namespace
    if (!chatbot.pinecone_namespace) {
      console.error('❌ Chatbot has no pinecone namespace')
      return NextResponse.json(
        { error: 'Chatbot is not properly configured' },
        { status: 500 }
      )
    }

    // Search for relevant context in Pinecone using chatbot's namespace
    const namespace = chatbot.pinecone_namespace
    console.log(`🔍 Searching in Pinecone namespace: ${namespace}`)
    
    // Search for similar content in the chatbot's namespace
    console.log('🔍 Searching for:', message)
    console.log('🎯 Using embeddings dimensions:', embeddingResult.embeddings?.length)
    
    const searchResult = await pineconeService.searchSimilar(
      message,
      namespace,
      10, // Get top 10 most relevant chunks
      undefined // No filter needed as namespace is specific to chatbot
    )

    if (!searchResult.success) {
      console.error('❌ Pinecone search failed:', searchResult.error)
      return NextResponse.json(
        { error: 'Failed to search knowledge base' },
        { status: 500 }
      )
    }

    console.log(`✅ Found ${searchResult.results?.length || 0} relevant chunks`)
    
    // Log search results for debugging
    if (searchResult.results && searchResult.results.length > 0) {
      console.log('📊 Top 3 results:')
      searchResult.results.slice(0, 3).forEach((result, index) => {
        console.log(`  ${index + 1}. Score: ${result.score}, Text preview: ${result.metadata?.text?.substring(0, 100)}...`)
      })
    } else {
      console.log('⚠️ No results found in namespace. Checking namespace content...')
      
      // Try to get all vectors from namespace for debugging
      const allVectors = await pineconeService.getAllVectorsFromNamespace(namespace)
      console.log(`📋 Total vectors in namespace: ${allVectors.results?.length || 0}`)
    }

    // Extract context from search results
    const context = searchResult.results
      ?.map(result => result.metadata?.text || '')
      .filter(text => text.length > 0)
      .join('\n\n')
      || 'No specific context found for this query.'

    console.log('📄 Context length:', context.length)

    // Generate response using Gemini
    console.log('🤖 Generating AI response...')
    
    // Create system prompt based on chatbot personality
    const systemPrompt = getSystemPrompt(chatbot.personality, chatbot.name, chatbot.description)
    
    const geminiResult = await geminiService.generateChatResponse({
      message,
      context,
      systemPrompt
    })

    if (!geminiResult.success || !geminiResult.response) {
      console.error('❌ Gemini generation failed:', geminiResult.error)
      return NextResponse.json(
        { error: 'Failed to generate response' },
        { status: 500 }
      )
    }

    console.log('✅ AI response generated successfully')

    // Store assistant message
    const { error: assistantMessageError } = await supabase
      .from(TableName.CHAT_MESSAGES)
      .insert({
        session_id: currentSessionId,
        chatbot_id: chatbotId,
        message_type: 'assistant',
        response: geminiResult.response
      })

    if (assistantMessageError) {
      console.error('⚠️ Failed to store assistant message:', assistantMessageError)
    }

    // Return response
    return NextResponse.json({
      success: true,
      data: {
        message: geminiResult.response,
        sessionId: currentSessionId,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Unexpected error in public chat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get chat history
export async function GET(request: NextRequest) {
  console.log('📜 Get chat history API called')
  
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const chatbotId = searchParams.get('chatbotId')

    if (!sessionId || !chatbotId) {
      return NextResponse.json(
        { error: 'SessionId and chatbotId are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Get chat messages
    const { data: messages, error } = await supabase
      .from(TableName.CHAT_MESSAGES)
      .select('*')
      .eq('session_id', sessionId)
      .eq('chatbot_id', chatbotId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('❌ Failed to fetch messages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch chat history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: messages || []
    })

  } catch (error) {
    console.error('❌ Unexpected error in get chat history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate system prompt based on personality
function getSystemPrompt(personality: string, chatbotName: string, description: string | null): string {
  const basePrompt = `You are ${chatbotName}. ${description || ''}`
  
  switch (personality) {
    case 'professional':
      return `${basePrompt} You communicate in a professional and business-like manner. Be concise, accurate, and formal in your responses.`
    
    case 'friendly':
      return `${basePrompt} You are warm, approachable, and friendly. Use a conversational tone and show empathy in your responses.`
    
    case 'casual':
      return `${basePrompt} You communicate in a relaxed, casual manner. Use everyday language and be personable in your responses.`
    
    case 'technical':
      return `${basePrompt} You provide detailed technical explanations. Be precise, use technical terminology when appropriate, and provide comprehensive answers.`
    
    case 'formal':
      return `${basePrompt} You maintain a highly formal and respectful tone. Use proper language and etiquette in all responses.`
    
    default:
      return `${basePrompt} You are a helpful assistant. Answer questions accurately and helpfully based on the provided context.`
  }
}
