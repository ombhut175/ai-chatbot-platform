import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createChatbotService } from '@/lib/services/chatbot'
import { TableName } from '@/helpers/string_const/tables'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  console.log('🤖 Get chatbot by ID API called:', id)
  
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

    // Create chatbot service with server client
    const chatbotService = createChatbotService(supabase)
    
    // Fetch the chatbot
    const result = await chatbotService.getChatbotById(id)
    
    if (!result.success) {
      console.error('❌ Failed to fetch chatbot:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to fetch chatbot' },
        { status: 500 }
      )
    }

    if (!result.data) {
      return NextResponse.json(
        { error: 'Chatbot not found' },
        { status: 404 }
      )
    }

    // Verify the chatbot belongs to the user's company
    if (result.data.company_id !== userProfile.company_id) {
      return NextResponse.json(
        { error: 'Unauthorized access to chatbot' },
        { status: 403 }
      )
    }

    // Get associated data sources
    const dataSourcesResult = await chatbotService.getChatbotDataSources(id)
    
    const chatbotWithDataSources = {
      ...result.data,
      dataSources: dataSourcesResult.success ? dataSourcesResult.data : []
    }

    console.log('✅ Fetched chatbot successfully:', id)
    
    return NextResponse.json({
      success: true,
      data: chatbotWithDataSources
    })
  } catch (error) {
    console.error('❌ Unexpected error in get chatbot:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  console.log('🤖 Update chatbot API called:', id)
  
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

    // Parse request body
    const body = await request.json()

    // Create chatbot service with server client
    const chatbotService = createChatbotService(supabase)
    
    // First verify the chatbot exists and belongs to the user's company
    const existingResult = await chatbotService.getChatbotById(id)
    
    if (!existingResult.success || !existingResult.data) {
      return NextResponse.json(
        { error: 'Chatbot not found' },
        { status: 404 }
      )
    }

    if (existingResult.data.company_id !== userProfile.company_id) {
      return NextResponse.json(
        { error: 'Unauthorized access to chatbot' },
        { status: 403 }
      )
    }

    console.log('📝 Updating chatbot:', id, body)

    // Update the chatbot
    const result = await chatbotService.updateChatbot(id, {
      name: body.name,
      description: body.description,
      type: body.type,
      welcome_message: body.welcome_message,
      personality: body.personality,
      theme: body.theme,
      is_active: body.is_active
    })

    if (!result.success || !result.data) {
      console.error('❌ Failed to update chatbot:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to update chatbot' },
        { status: 500 }
      )
    }

    // Handle data source updates if provided
    if (body.data_source_ids !== undefined) {
      // Remove all existing associations
      await chatbotService.removeDataSourceAssociations(id)
      
      // Add new associations if any
      if (body.data_source_ids.length > 0) {
        await chatbotService.associateDataSources(id, body.data_source_ids)
      }
    }

    console.log('✅ Chatbot updated successfully:', id)
    
    return NextResponse.json({
      success: true,
      data: result.data
    })
  } catch (error) {
    console.error('❌ Unexpected error in update chatbot:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  console.log('🤖 Delete chatbot API called:', id)
  
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

    // Create chatbot service with server client
    const chatbotService = createChatbotService(supabase)
    
    // First verify the chatbot exists and belongs to the user's company
    const existingResult = await chatbotService.getChatbotById(id)
    
    if (!existingResult.success || !existingResult.data) {
      return NextResponse.json(
        { error: 'Chatbot not found' },
        { status: 404 }
      )
    }

    if (existingResult.data.company_id !== userProfile.company_id) {
      return NextResponse.json(
        { error: 'Unauthorized access to chatbot' },
        { status: 403 }
      )
    }

    console.log('🗑️ Deleting chatbot:', id)

    // Delete all associations first
    await chatbotService.removeDataSourceAssociations(id)

    // Delete the chatbot
    const result = await chatbotService.deleteChatbot(id)

    if (!result.success) {
      console.error('❌ Failed to delete chatbot:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to delete chatbot' },
        { status: 500 }
      )
    }

    console.log('✅ Chatbot deleted successfully:', id)
    
    return NextResponse.json({
      success: true,
      message: 'Chatbot deleted successfully'
    })
  } catch (error) {
    console.error('❌ Unexpected error in delete chatbot:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 