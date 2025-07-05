import { createClient } from '@/lib/supabase/client'
import { TableName } from '@/helpers/string_const/tables'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface ApiKey {
  id: string
  chatbot_id: string
  api_key: string
  is_active: boolean
  created_at: string
  last_used_at: string | null
}

export interface ApiKeyListItem {
  id: string
  key_preview: string
  created_at: string
  last_used_at: string | null
  is_active: boolean
}

export class ApiKeyService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  /**
   * Generate a cryptographically secure API key
   */
  private generateApiKey(): string {
    // Generate a random string with prefix 'sk_' (secret key)
    const randomBytes = new Uint8Array(32)
    crypto.getRandomValues(randomBytes)
    const randomString = Array.from(randomBytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')
    return `sk_${randomString}`
  }

  /**
   * Create a preview of the API key (first 7 and last 4 characters)
   */
  private createKeyPreview(apiKey: string): string {
    if (!apiKey || typeof apiKey !== 'string') {
      console.warn('Invalid API key provided for preview:', apiKey)
      return 'sk_invalid'
    }
    if (apiKey.length <= 15) return apiKey // Don't preview if key is too short
    return `${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}`
  }

  /**
   * Get all API keys for a chatbot (with preview only)
   */
  async getApiKeysByChatbot(chatbotId: string): Promise<{ success: boolean; data?: ApiKeyListItem[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from(TableName.API_KEYS)
        .select('*')
        .eq('chatbot_id', chatbotId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching API keys:', error)
        return { success: false, error: error.message }
      }

      // Transform data to include only key preview
      const transformedData: ApiKeyListItem[] = (data || [])
        .filter(item => item && item.id && item.api_key) // Filter out invalid items
        .map(item => ({
          id: item.id,
          key_preview: this.createKeyPreview(item.api_key),
          created_at: item.created_at || new Date().toISOString(),
          last_used_at: item.last_used_at,
          is_active: Boolean(item.is_active)
        }))

      return { success: true, data: transformedData }
    } catch (error) {
      console.error('Error in getApiKeysByChatbot:', error)
      return { success: false, error: 'Failed to fetch API keys' }
    }
  }

  /**
   * Create a new API key for a chatbot
   */
  async createApiKey(chatbotId: string): Promise<{ success: boolean; data?: { api_key: string }; error?: string }> {
    try {
      const newApiKey = this.generateApiKey()

      const { data, error } = await this.supabase
        .from(TableName.API_KEYS)
        .insert({
          chatbot_id: chatbotId,
          api_key: newApiKey,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating API key:', error)
        return { success: false, error: error.message }
      }

      // Return the full API key - this is the only time it's returned
      return { success: true, data: { api_key: newApiKey } }
    } catch (error) {
      console.error('Error in createApiKey:', error)
      return { success: false, error: 'Failed to create API key' }
    }
  }

  /**
   * Revoke an API key (set is_active to false)
   */
  async revokeApiKey(keyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from(TableName.API_KEYS)
        .update({ is_active: false })
        .eq('id', keyId)

      if (error) {
        console.error('Error revoking API key:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in revokeApiKey:', error)
      return { success: false, error: 'Failed to revoke API key' }
    }
  }

  /**
   * Validate an API key and get associated chatbot
   */
  async validateApiKey(apiKey: string): Promise<{ success: boolean; data?: { chatbot_id: string; key_id: string }; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from(TableName.API_KEYS)
        .select('id, chatbot_id')
        .eq('api_key', apiKey)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        return { success: false, error: 'Invalid or inactive API key' }
      }

      // Update last_used_at timestamp asynchronously
      this.updateLastUsed(data.id).catch(err => 
        console.error('Failed to update last_used_at:', err)
      )

      return { 
        success: true, 
        data: { 
          chatbot_id: data.chatbot_id,
          key_id: data.id 
        } 
      }
    } catch (error) {
      console.error('Error in validateApiKey:', error)
      return { success: false, error: 'Failed to validate API key' }
    }
  }

  /**
   * Update last_used_at timestamp for an API key
   */
  private async updateLastUsed(keyId: string): Promise<void> {
    await this.supabase
      .from(TableName.API_KEYS)
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyId)
  }

  /**
   * Delete an API key permanently
   */
  async deleteApiKey(keyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from(TableName.API_KEYS)
        .delete()
        .eq('id', keyId)

      if (error) {
        console.error('Error deleting API key:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in deleteApiKey:', error)
      return { success: false, error: 'Failed to delete API key' }
    }
  }
}

// Create default instance for client-side usage
export const apiKeyService = new ApiKeyService()

// Helper function to create a service with server client
export const createApiKeyService = (supabaseClient: SupabaseClient) => {
  return new ApiKeyService(supabaseClient)
}
