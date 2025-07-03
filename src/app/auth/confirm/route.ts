import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  if (token_hash && type) {
    const supabase = createClient()

    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })
    
    if (!error) {
      // Redirect to the dashboard or specified next URL
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Redirect to an error page with an error code in the URL
  return NextResponse.redirect(new URL('/login?error=Could not confirm account', request.url))
} 