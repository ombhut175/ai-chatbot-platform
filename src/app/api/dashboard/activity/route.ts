import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TableName } from '@/helpers/string_const/tables'

export async function GET(request: NextRequest) {
  console.log('📱 Get dashboard activity API called')
  
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

    // Fetch recent activities in parallel
    const [
      recentChatbots,
      recentDataSources,
      recentIntegrations,
      recentMessages
    ] = await Promise.all([
      // Recent chatbots created
      supabase
        .from(TableName.CHATBOTS)
        .select('id, name, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5),

      // Recent data sources uploaded
      supabase
        .from(TableName.DATA_SOURCES)
        .select('id, name, created_at, status')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5),

      // Recent integrations
      supabase
        .from(TableName.INTEGRATIONS)
        .select(`
          id, 
          type, 
          created_at,
          chatbots!inner(name, company_id)
        `)
        .eq('chatbots.company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(3),

      // Get today's message count for activity
      supabase
        .from(TableName.CHAT_MESSAGES)
        .select(`
          created_at,
          chatbots!inner(company_id)
        `, { count: 'exact', head: true })
        .eq('chatbots.company_id', companyId)
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
    ])

    // Build activity timeline
    const activities = []

    // Add chatbot activities
    if (recentChatbots.data) {
      recentChatbots.data.forEach(chatbot => {
        activities.push({
          id: `chatbot-${chatbot.id}`,
          action: "New chatbot created",
          description: `${chatbot.name} was created`,
          time: formatTimeAgo(chatbot.created_at),
          type: "success",
          icon: "Bot",
          timestamp: new Date(chatbot.created_at).getTime()
        })
      })
    }

    // Add data source activities
    if (recentDataSources.data) {
      recentDataSources.data.forEach(dataSource => {
        const status = dataSource.status === 'ready' ? 'processed' : 
                     dataSource.status === 'processing' ? 'is being processed' : 'failed to process'
        activities.push({
          id: `datasource-${dataSource.id}`,
          action: "Data source uploaded",
          description: `${dataSource.name} was ${status}`,
          time: formatTimeAgo(dataSource.created_at),
          type: dataSource.status === 'ready' ? "success" : 
                dataSource.status === 'processing' ? "info" : "error",
          icon: "Upload",
          timestamp: new Date(dataSource.created_at).getTime()
        })
      })
    }

    // Add integration activities
    if (recentIntegrations.data) {
      recentIntegrations.data.forEach(integration => {
        const typeName = integration.type === 'widget' ? 'Website widget' :
                        integration.type === 'iframe' ? 'iFrame' : 'API integration'
        activities.push({
          id: `integration-${integration.id}`,
          action: "Integration activated",
          description: `${typeName} was embedded for ${integration.chatbots.name}`,
          time: formatTimeAgo(integration.created_at),
          type: "success",
          icon: "Zap",
          timestamp: new Date(integration.created_at).getTime()
        })
      })
    }

    // Add messages activity if any today
    if (recentMessages.count && recentMessages.count > 0) {
      activities.push({
        id: "messages-today",
        action: "User messages received",
        description: `${recentMessages.count} new messages from customers`,
        time: "Today",
        type: "info",
        icon: "Users",
        timestamp: new Date().getTime()
      })
    }

    // Sort activities by timestamp (most recent first) and limit to 10
    const sortedActivities = activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
      .map(({ timestamp, ...activity }) => activity) // Remove timestamp from final result

    console.log('✅ Dashboard activity fetched successfully:', sortedActivities.length, 'activities')
    
    return NextResponse.json({
      success: true,
      data: sortedActivities
    })
  } catch (error) {
    console.error('❌ Unexpected error in dashboard activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else {
    const weeks = Math.floor(diffInSeconds / 604800)
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  }
}
