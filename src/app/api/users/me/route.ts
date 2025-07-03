import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user profile with company information
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select(`
        *,
        companies (
          id,
          name,
          created_at
        )
      `)
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    // Combine Supabase auth user with profile data
    const userData = {
      id: user.id,
      email: user.email,
      name: userProfile?.name,
      role: userProfile?.role || 'visitor',
      company: userProfile?.companies,
      created_at: userProfile?.created_at,
      // Add any other needed fields from auth user
      email_confirmed_at: user.email_confirmed_at,
      last_sign_in_at: user.last_sign_in_at,
    }

    return NextResponse.json({
      success: true,
      user: userData,
    })
  } catch (error) {
    console.error('Error in /api/users/me:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 