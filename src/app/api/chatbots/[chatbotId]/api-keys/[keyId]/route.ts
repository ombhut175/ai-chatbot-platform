import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiKeyService } from '@/lib/services/apiKey'
import { createChatbotService } from '@/lib/services/chatbot'
import { TableName } from '@/helpers/string_const/tables'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; keyId: string }> }
) {
  const { chatbotId, keyId } = await params
  console.log('🔑 Revoke API key:', keyId, 'for chatbot:', chatbotId)
  
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

    // Verify the API key belongs to this chatbot
    const { data: apiKey } = await supabase
      .from(TableName.API_KEYS)
      .select('chatbot_id')
      .eq('id', keyId)
      .single()

    if (!apiKey || apiKey.chatbot_id !== chatbotId) {
      return NextResponse.json(
        { error: 'API key not found or does not belong to this chatbot' },
        { status: 404 }
      )
    }

    // Revoke the API key
    const apiKeyService = createApiKeyService(supabase)
    const result = await apiKeyService.revokeApiKey(keyId)
    
    if (!result.success) {
      console.error('❌ Failed to revoke API key:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to revoke API key' },
        { status: 500 }
      )
    }

    console.log('✅ API key revoked successfully')
    
    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully'
    }, { status: 200 })
  } catch (error) {
    console.error('❌ Unexpected error in revoke API key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
