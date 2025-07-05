import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import { TableName } from '@/helpers/string_const/tables'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  console.log('🤖 Get chatbot details API called:', id)
  
  try {
    // First, try to get the chatbot with public client to check its type
    const publicSupabase = await createPublicClient()
    
    // Get basic chatbot info to determine type
    const { data: chatbotInfo, error: infoError } = await publicSupabase
      .from(TableName.CHATBOTS)
      .select('id, type, company_id')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (infoError || !chatbotInfo) {
      console.error('❌ Chatbot not found or inactive:', infoError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Chatbot not found or inactive' 
        },
        { status: 404 }
      )
    }

    // Handle based on chatbot type
    if (chatbotInfo.type === 'public') {
      // Public chatbot - no authentication required
      console.log('✅ Public chatbot access')
      
      const { data: chatbot, error } = await publicSupabase
        .from(TableName.CHATBOTS)
        .select('id, name, description, welcome_message, theme, type')
        .eq('id', id)
        .single()

      if (error) {
        console.error('❌ Failed to fetch public chatbot:', error)
        return NextResponse.json(
          { 
            success: false,
            error: 'Failed to fetch chatbot' 
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: chatbot
      })
      
    } else if (chatbotInfo.type === 'internal') {
      // Internal chatbot - requires authentication
      console.log('🔐 Internal chatbot - checking authentication')
      
      const authSupabase = await createClient()
      const { data: { user }, error: authError } = await authSupabase.auth.getUser()
      
      if (authError || !user) {
        console.error('❌ Authentication required for internal chatbot')
        return NextResponse.json(
          { 
            success: false,
            error: 'Authentication required for internal chatbots' 
          },
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
          { 
            success: false,
            error: 'User profile not found' 
          },
          { status: 404 }
        )
      }

      // Verify user belongs to the same company
      if (userProfile.company_id !== chatbotInfo.company_id) {
        console.error('❌ User not authorized to access this chatbot')
        return NextResponse.json(
          { 
            success: false,
            error: 'Not authorized to access this chatbot' 
          },
          { status: 403 }
        )
      }

      // Check if user is NOT a visitor (allow employee, admin, and owner)
      if (userProfile.role === 'visitor') {
        console.error('❌ Visitors cannot access internal chatbots:', userProfile.role)
        return NextResponse.json(
          { 
            success: false,
            error: 'Internal chatbots are restricted to company staff only' 
          },
          { status: 403 }
        )
      }

      // Fetch internal chatbot details
      const { data: chatbot, error } = await authSupabase
        .from(TableName.CHATBOTS)
        .select('id, name, description, welcome_message, theme, type, company_id')
        .eq('id', id)
        .single()

      if (error) {
        console.error('❌ Failed to fetch internal chatbot:', error)
        return NextResponse.json(
          { 
            success: false,
            error: 'Failed to fetch chatbot' 
          },
          { status: 500 }
        )
      }

      console.log('✅ Internal chatbot fetched successfully')
      
      return NextResponse.json({
        success: true,
        data: chatbot
      })
    }

    // Unknown chatbot type
    return NextResponse.json(
      { 
        success: false,
        error: 'Invalid chatbot type' 
      },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('❌ Unexpected error in get chatbot details:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
