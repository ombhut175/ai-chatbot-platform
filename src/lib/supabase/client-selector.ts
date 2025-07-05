import { createClient } from './server'
import { createPublicClient } from './public'

/**
 * Get the appropriate Supabase client based on the context
 * @param requiresAuth - Whether authentication is required
 * @returns Supabase client instance
 */
export async function getSupabaseClient(requiresAuth: boolean = true) {
  if (requiresAuth) {
    // Use authenticated client for internal operations
    return await createClient()
  } else {
    // Use public client for public chatbot operations
    return await createPublicClient()
  }
}

/**
 * Determine if a chatbot type requires authentication
 * @param chatbotType - The type of chatbot ('public' or 'internal')
 * @returns Whether authentication is required
 */
export function requiresAuthentication(chatbotType: 'public' | 'internal'): boolean {
  return chatbotType === 'internal'
}
