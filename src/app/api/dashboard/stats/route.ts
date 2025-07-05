import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TableName } from '@/helpers/string_const/tables'

export async function GET(request: NextRequest) {
  console.log('📊 Get dashboard stats API called')
  
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

    const companyId = userProfile.company_id
    console.log('✅ Company ID found:', companyId)

    // Get current date for today's stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Fetch all stats in parallel
    const [
      chatbotsResult,
      dataSourcesResult,
      messagesTodayResult,
      activeChatsResult
    ] = await Promise.all([
      // Total chatbots for company
      supabase
        .from(TableName.CHATBOTS)
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId),

      // Total data sources for company  
      supabase
        .from(TableName.DATA_SOURCES)
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId),

      // Messages today across all company chatbots
      supabase
        .from(TableName.CHAT_MESSAGES)
        .select(`
          *,
          chatbots!inner(company_id)
        `, { count: 'exact', head: true })
        .eq('chatbots.company_id', companyId)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString()),

      // Active chat sessions (sessions that haven't ended)
      supabase
        .from(TableName.CHAT_SESSIONS)
        .select(`
          *,
          chatbots!inner(company_id)
        `, { count: 'exact', head: true })
        .eq('chatbots.company_id', companyId)
        .is('ended_at', null)
    ])

    // Check for errors
    if (chatbotsResult.error) {
      console.error('❌ Error fetching chatbots count:', chatbotsResult.error)
    }
    if (dataSourcesResult.error) {
      console.error('❌ Error fetching data sources count:', dataSourcesResult.error)
    }
    if (messagesTodayResult.error) {
      console.error('❌ Error fetching messages today:', messagesTodayResult.error)
    }
    if (activeChatsResult.error) {
      console.error('❌ Error fetching active chats:', activeChatsResult.error)
    }

    // Prepare stats object
    const stats = {
      totalChatbots: chatbotsResult.count || 0,
      totalDataSources: dataSourcesResult.count || 0,
      messagesToday: messagesTodayResult.count || 0,
      activeChats: activeChatsResult.count || 0
    }

    console.log('✅ Dashboard stats fetched successfully:', stats)
    
    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('❌ Unexpected error in dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
