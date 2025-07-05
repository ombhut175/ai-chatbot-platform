import { useState, useEffect, useCallback } from 'react'
import { ApiKeyListItem } from '@/lib/services/apiKey'

export function useApiKeys(chatbotId: string | null) {
  const [apiKeys, setApiKeys] = useState<ApiKeyListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch API keys
  const fetchApiKeys = useCallback(async () => {
    if (!chatbotId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/api-keys`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch API keys')
      }

      setApiKeys(data.data || [])
    } catch (err) {
      console.error('Error fetching API keys:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch API keys')
    } finally {
      setIsLoading(false)
    }
  }, [chatbotId])

  // Create new API key
  const createApiKey = useCallback(async () => {
    if (!chatbotId) return null

    setError(null)

    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create API key')
      }

      // Refresh the list after creating
      await fetchApiKeys()

      return data.data.api_key
    } catch (err) {
      console.error('Error creating API key:', err)
      setError(err instanceof Error ? err.message : 'Failed to create API key')
      return null
    }
  }, [chatbotId, fetchApiKeys])

  // Revoke API key
  const revokeApiKey = useCallback(async (keyId: string) => {
    if (!chatbotId) return false

    setError(null)

    try {
      // Optimistically update the state immediately
      setApiKeys(prevKeys => 
        prevKeys.map(key => 
          key.id === keyId ? { ...key, is_active: false } : key
        )
      )

      const response = await fetch(`/api/chatbots/${chatbotId}/api-keys/${keyId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        // Revert the optimistic update on error
        setApiKeys(prevKeys => 
          prevKeys.map(key => 
            key.id === keyId ? { ...key, is_active: true } : key
          )
        )
        const data = await response.json()
        throw new Error(data.error || 'Failed to revoke API key')
      }

      // Refresh the list to ensure consistency
      await fetchApiKeys()

      return true
    } catch (err) {
      console.error('Error revoking API key:', err)
      setError(err instanceof Error ? err.message : 'Failed to revoke API key')
      return false
    }
  }, [chatbotId, fetchApiKeys])

  // Fetch API keys on mount and when chatbotId changes
  useEffect(() => {
    if (chatbotId) {
      fetchApiKeys()
    }
  }, [chatbotId, fetchApiKeys])

  return {
    apiKeys,
    isLoading,
    error,
    createApiKey,
    revokeApiKey,
    refetch: fetchApiKeys,
  }
}
