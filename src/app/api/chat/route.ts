import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import { pineconeService } from '@/lib/services/pinecone'
import { geminiService } from '@/lib/services/gemini'
import { TableName } from '@/helpers/string_const/tables'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  console.log('💬 Unified chat API called')
  
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

    // First, determine chatbot type using public client
    const publicSupabase = await createPublicClient()
    const { data: chatbotInfo, error: infoError } = await publicSupabase
      .from(TableName.CHATBOTS)
      .select('id, type, company_id, is_active')
      .eq('id', chatbotId)
      .single()

    if (infoError || !chatbotInfo || !chatbotInfo.is_active) {
      console.error('❌ Chatbot not found or inactive:', infoError)
      return NextResponse.json(
        { error: 'Chatbot not found or inactive' },
        { status: 404 }
      )
    }

    // Handle based on chatbot type
    let supabase: any
    let userId: string | null = null
    let userCompanyId: string | null = null

    if (chatbotInfo.type === 'internal') {
      // Internal chatbot requires authentication
      console.log('🔐 Internal chatbot - verifying authentication')
      
      const authSupabase = await createClient()
      const { data: { user }, error: authError } = await authSupabase.auth.getUser()
      
      if (authError || !user) {
        console.error('❌ Authentication required for internal chatbot')
        return NextResponse.json(
          { error: 'Authentication required for internal chatbots' },
          { status: 401 }
        )
      }

      // Get user profile to verify company access
      const { data: userProfile, error: profileError } = await authSupabase
        .from(TableName.USERS)
        .select('company_id, role')
        .eq('id', user.id)
        .single()

      if (profileError || !userProfile) {
        console.error('❌ Failed to get user profile:', profileError)
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        )
      }

      // Verify user belongs to the same company
      if (userProfile.company_id !== chatbotInfo.company_id) {
        console.error('❌ User not authorized to access this chatbot')
        return NextResponse.json(
          { error: 'Not authorized to access this chatbot' },
          { status: 403 }
        )
      }

      // Check if user is NOT a visitor (allow employee, admin, and owner)
      if (userProfile.role === 'visitor') {
        console.error('❌ Visitors cannot access internal chatbots:', userProfile.role)
        return NextResponse.json(
          { error: 'Internal chatbots are restricted to company staff only' },
          { status: 403 }
        )
      }

      supabase = authSupabase
      userId = user.id
      userCompanyId = userProfile.company_id
      console.log('✅ User authenticated for internal chatbot:', user.email)
      
    } else {
      // Public chatbot - no authentication required
      supabase = publicSupabase
      console.log('✅ Public chatbot access')
    }

    // Fetch full chatbot details
    const { data: chatbot, error: chatbotError } = await supabase
      .from(TableName.CHATBOTS)
      .select('*')
      .eq('id', chatbotId)
      .single()

    if (chatbotError || !chatbot) {
      console.error('❌ Failed to fetch chatbot details:', chatbotError)
      return NextResponse.json(
        { error: 'Failed to fetch chatbot details' },
        { status: 500 }
      )
    }

    console.log('✅ Chatbot found:', chatbot.name)
    console.log('📍 Pinecone namespace:', chatbot.pinecone_namespace)

    // Create or get session
    let currentSessionId = sessionId
    if (!currentSessionId) {
      currentSessionId = uuidv4()
      const sessionData: any = {
        chatbot_id: chatbotId,
        session_id: currentSessionId,
        user_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }

      // Add user_id for internal chatbot sessions
      if (chatbot.type === 'internal' && userId) {
        sessionData.user_id = userId
      }

      const { error: sessionError } = await supabase
        .from(TableName.CHAT_SESSIONS)
        .insert(sessionData)

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

    // Search for relevant context in Pinecone
    const namespace = chatbot.pinecone_namespace
    console.log(`🔍 Searching in Pinecone namespace: ${namespace}`)
    
    const searchResult = await pineconeService.searchSimilarWithEmbeddings(
      embeddingResult.embeddings,
      namespace,
      40, // Get top 40 most relevant chunks
      undefined
    )

    if (!searchResult.success) {
      console.error('❌ Pinecone search failed:', searchResult.error)
      return NextResponse.json(
        { error: 'Failed to search knowledge base' },
        { status: 500 }
      )
    }

    console.log(`✅ Found ${searchResult.results?.length || 0} relevant chunks`)

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
    console.error('❌ Unexpected error in unified chat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get chat history - handles both public and internal
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

    // First, check chatbot type
    const publicSupabase = await createPublicClient()
    const { data: chatbotInfo, error: infoError } = await publicSupabase
      .from(TableName.CHATBOTS)
      .select('type, company_id')
      .eq('id', chatbotId)
      .single()

    if (infoError || !chatbotInfo) {
      console.error('❌ Chatbot not found:', infoError)
      return NextResponse.json(
        { error: 'Chatbot not found' },
        { status: 404 }
      )
    }

    let supabase: any

    if (chatbotInfo.type === 'internal') {
      // Internal chatbot - verify authentication
      const authSupabase = await createClient()
      const { data: { user }, error: authError } = await authSupabase.auth.getUser()
      
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Verify user has access to this chatbot's company
      const { data: userProfile } = await authSupabase
        .from(TableName.USERS)
        .select('company_id, role')
        .eq('id', user.id)
        .single()

      if (!userProfile || userProfile.company_id !== chatbotInfo.company_id) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }

      supabase = authSupabase
    } else {
      // Public chatbot
      supabase = publicSupabase
    }

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
  const roleAndGoal = `You are ${chatbotName}, an AI assistant. ${description ? `Your designated role is: "${description}".` : ''}`;

  const coreInstructions = `
**Your Core Directives:**

1.  **Primary Rule:** Your responses MUST be based *exclusively* on the information provided in the "CONTEXT" section of the prompt. Do not access or use any external knowledge, data from previous training, or information from outside the given CONTEXT.
2.  **Handling Missing Information:** If the user's question cannot be answered using the provided CONTEXT, you must respond with one of the following phrases: "I'm sorry, I don't have the information needed to answer that question." or "I can't find the answer to your question in the information I have." DO NOT attempt to guess or invent an answer.
3.  **Identity and Persona:** You must consistently maintain the persona of ${chatbotName}. Do not reveal that you are an AI, a language model, or a chatbot.
4.  **Brevity:** Provide concise and direct answers. Avoid unnecessary conversational filler unless your persona explicitly requires it.
5.  **Contextual Awareness:** The user is asking a question. Your task is to find the answer in the CONTEXT. The user's message is the question.
  `;

  let personalityInstructions = '';

  switch (personality) {
    case 'professional':
      personalityInstructions = `
**Persona Instructions: Professional**
- **Tone:** Maintain a formal, objective, and business-like tone.
- **Language:** Use precise, professional language. Avoid slang, contractions, and overly casual expressions.
- **Interaction Style:** Be direct and efficient. Your goal is to deliver information clearly and accurately.
- **Example:** Instead of "Hey! I think...", say "Based on the provided context...".
      `;
      break;
    
    case 'friendly':
      personalityInstructions = `
**Persona Instructions: Friendly**
- **Tone:** Be warm, approachable, and empathetic.
- **Language:** Use a conversational, positive, and encouraging tone. Contractions (e.g., "you're", "it's") are appropriate.
- **Interaction Style:** Engage the user in a welcoming manner. Make them feel supported and understood.
- **Example:** "Hi there! I'd be happy to help with that. Looking at the information, it seems that...".
      `;
      break;
    
    case 'casual':
      personalityInstructions = `
**Persona Instructions: Casual**
- **Tone:** Be relaxed, informal, and easy-going.
- **Language:** Use everyday language. A conversational and less structured style is preferred.
- **Interaction Style:** Be relatable and personable.
- **Example:** "Hey, so about your question... It looks like...".
      `;
      break;
    
    case 'technical':
      personalityInstructions = `
**Persona Instructions: Technical Expert**
- **Tone:** Be precise, authoritative, and informative.
- **Language:** Use correct technical terminology. When explaining complex topics, break them down for clarity. Use formatting like lists or bullet points to structure your response.
- **Interaction Style:** Your goal is to provide comprehensive and accurate technical explanations.
- **Example:** "The system's architecture is composed of three primary layers: The presentation layer, the business logic layer, and the data access layer. Let's examine each one.".
      `;
      break;
    
    case 'formal':
      personalityInstructions = `
**Persona Instructions: Formal**
- **Tone:** Maintain a highly formal, respectful, and polite tone.
- **Language:** Use sophisticated vocabulary and impeccable grammar. Avoid all contractions and colloquialisms.
- **Interaction Style:** Adhere to the highest standards of professional decorum.
- **Example:** "Greetings. In reference to your inquiry, the provided documentation indicates that...".
      `;
      break;
    
    default:
      personalityInstructions = `
**Persona Instructions: Helpful Assistant**
- **Tone:** Be neutral, helpful, and direct.
- **Language:** Use clear, simple, and easy-to-understand language.
- **Interaction Style:** Answer the user's questions directly using the provided context without extra conversational fluff.
      `;
  }

  return `${roleAndGoal}\n\n${coreInstructions}\n${personalityInstructions}`;
}
