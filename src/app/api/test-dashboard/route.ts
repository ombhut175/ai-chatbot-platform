import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TableName } from '@/helpers/string_const/tables'

export async function GET(request: NextRequest) {
  console.log('🧪 Test dashboard API called')
  
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Authentication error:', authError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized',
          details: authError?.message 
        },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.email)

    // Get user profile to find company_id
    const { data: userProfile, error: profileError } = await supabase
      .from(TableName.USERS)
      .select('id, email, name, company_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('❌ Profile error:', profileError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Profile not found',
          details: profileError.message 
        },
        { status: 404 }
      )
    }

    console.log('✅ User profile found:', {
      id: userProfile.id,
      email: userProfile.email,
      company_id: userProfile.company_id
    })

    if (!userProfile?.company_id) {
      return NextResponse.json(
        { 
          success: false,
          error: 'User not associated with a company',
          userProfile 
        },
        { status: 400 }
      )
    }

    // Test basic table access
    const tableTests = await Promise.all([
      supabase
        .from(TableName.CHATBOTS)
        .select('*', { count: 'exact', head: true })
        .eq('company_id', userProfile.company_id),
      
      supabase
        .from(TableName.DATA_SOURCES)
        .select('*', { count: 'exact', head: true })
        .eq('company_id', userProfile.company_id)
    ])

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      profile: userProfile,
      tableAccess: {
        chatbots: {
          count: tableTests[0].count || 0,
          error: tableTests[0].error?.message || null
        },
        dataSources: {
          count: tableTests[1].count || 0,
          error: tableTests[1].error?.message || null
        }
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Unexpected error in test dashboard:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
