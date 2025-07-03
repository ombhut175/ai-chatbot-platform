import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Sign out the user
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Error signing out:', error)
      return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Signed out successfully' })
  } catch (error) {
    console.error('Error in logout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 