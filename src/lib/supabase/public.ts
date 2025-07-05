import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createPublicClient() {
  // Create a client without requiring authentication
  // This is used for public chatbot endpoints that don't need user auth
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Return empty array for public access - no auth cookies needed
          return []
        },
        setAll() {
          // No-op for public access - we don't set any cookies
        },
      },
    }
  )
}
