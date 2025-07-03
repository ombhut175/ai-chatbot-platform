import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { companyName } = body

    if (!companyName || typeof companyName !== 'string') {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    // Start a transaction-like operation
    // First, create the company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert([{ name: companyName.trim() }])
      .select()
      .single()

    if (companyError) {
      console.error('Error creating company:', companyError)
      return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
    }

    // Update the user with company_id and role 'owner'
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        company_id: company.id,
        role: 'owner',
      })
      .eq('id', user.id)

    if (userUpdateError) {
      console.error('Error updating user:', userUpdateError)
      // If user update fails, we should ideally rollback the company creation
      // For now, we'll log the error but continue
      return NextResponse.json({ error: 'Failed to assign user to company' }, { status: 500 })
    }

    // Get the updated user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*, companies(*)')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      company,
      user: userProfile,
    })
  } catch (error) {
    console.error('Error in create-with-owner:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 