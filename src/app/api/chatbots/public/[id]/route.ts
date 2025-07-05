import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TableName } from '@/helpers/string_const/tables'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🤖 Get public chatbot by ID API called:', params.id)
  
  try {
    // Create a service role client for public access
    const supabase = await createClient()
    
    // Fetch the chatbot - only active public chatbots
    const { data: chatbot, error } = await supabase
      .from(TableName.CHATBOTS)
      .select('id, name, description, welcome_message, theme, type')
      .eq('id', params.id)
      .eq('is_active', true)
      .single()

    if (error || !chatbot) {
      console.error('❌ Chatbot not found or inactive:', error)
      return NextResponse.json(
        { 
          success: false,
          error: 'Chatbot not found or inactive' 
        },
        { status: 404 }
      )
    }

    console.log('✅ Fetched public chatbot successfully:', params.id)
    
    return NextResponse.json({
      success: true,
      data: chatbot
    })
  } catch (error) {
    console.error('❌ Unexpected error in get public chatbot:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
