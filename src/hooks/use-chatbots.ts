import useSWR, { mutate } from 'swr'
import { useCallback } from 'react'
import { chatbotService } from '@/lib/services/chatbot'
import type { Chatbot, CreateChatbotData, UpdateChatbotData } from '@/lib/services/chatbot'
import { useAuthStore } from '@/lib/store'
import { apiRequest } from '@/helpers/request'
import { ChatbotType, ChatbotPersonality } from '@/helpers/string_const/chatbot'
import { toast } from '@/hooks/use-toast'

/**
 * Hook to fetch chatbots for the current user's company
 */
export function useChatbots() {
  const { userProfile } = useAuthStore()
  const companyId = userProfile?.company_id

  const { data, error, isLoading, mutate: mutateChatbots } = useSWR(
    companyId ? `/api/chatbots` : null,
    async () => {
      if (!companyId) return null
      
      const result = await apiRequest.get<Chatbot[]>('/api/chatbots')
      return result
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      refreshInterval: 0, // Don't auto-refresh chatbots as they change less frequently
    }
  )

  return {
    chatbots: data || [],
    isLoading,
    error,
    mutate: mutateChatbots,
  }
}

/**
 * Hook to create a new chatbot
 */
export function useCreateChatbot() {
  const { userProfile } = useAuthStore()

  const createChatbot = useCallback(async (
    chatbotData: {
      name: string
      description: string
      type: ChatbotType
      welcome_message?: string
      personality?: ChatbotPersonality
      theme?: any
      data_source_ids?: string[]
    }
  ): Promise<{ success: boolean; data?: Chatbot; error?: string }> => {
    if (!userProfile?.company_id) {
      return { success: false, error: 'User not associated with a company' }
    }

    try {
      console.log('🤖 Creating chatbot:', chatbotData.name)

      const result = await apiRequest.post<Chatbot>('/api/chatbots', {
        ...chatbotData,
        company_id: userProfile.company_id
      })

      if (result) {
        console.log('✅ Chatbot created successfully:', result)
        
        // Show success toast
        toast({
          title: "Chatbot created successfully",
          description: `${chatbotData.name} has been created${chatbotData.data_source_ids?.length ? ' and is being trained in the background' : ''}.`,
        })
        
        // Revalidate the chatbots list
        mutate('/api/chatbots')

        console.log('🎉 Chatbot creation process completed successfully')
        return { success: true, data: result }
      }

      return { success: false, error: 'Failed to create chatbot' }
    } catch (error: any) {
      console.error('❌ Chatbot creation error:', error)
      
      const errorMessage = error.message || 'Failed to create chatbot'
      
      toast({
        title: "Chatbot creation failed",
        description: errorMessage,
        variant: "destructive",
      })

      return { success: false, error: errorMessage }
    }
  }, [userProfile?.company_id])

  return { createChatbot }
}

/**
 * Hook to update an existing chatbot
 */
export function useUpdateChatbot() {
  const { userProfile } = useAuthStore()

  const updateChatbot = useCallback(async (
    chatbotId: string,
    updates: UpdateChatbotData & { data_source_ids?: string[] }
  ): Promise<{ success: boolean; data?: Chatbot; error?: string }> => {
    if (!userProfile?.company_id) {
      return { success: false, error: 'User not associated with a company' }
    }

    try {
      console.log('📝 Updating chatbot:', chatbotId, updates)

      const result = await apiRequest.put<Chatbot>(`/api/chatbots/${chatbotId}`, updates)

      if (result) {
        console.log('✅ Chatbot updated successfully:', result)
        
        toast({
          title: "Chatbot updated",
          description: "The chatbot has been updated successfully.",
        })
        
        // Revalidate the chatbots list
        mutate('/api/chatbots')

        return { success: true, data: result }
      }

      return { success: false, error: 'Failed to update chatbot' }
    } catch (error: any) {
      console.error('❌ Chatbot update error:', error)
      
      const errorMessage = error.message || 'Failed to update chatbot'
      
      toast({
        title: "Update failed",
        description: errorMessage,
        variant: "destructive",
      })

      return { success: false, error: errorMessage }
    }
  }, [userProfile?.company_id])

  return { updateChatbot }
}

/**
 * Hook to delete a chatbot
 */
export function useDeleteChatbot() {
  const { userProfile } = useAuthStore()

  const deleteChatbot = useCallback(async (chatbotId: string): Promise<{ success: boolean; error?: string }> => {
    if (!userProfile?.company_id) {
      return { success: false, error: 'User not associated with a company' }
    }

    try {
      console.log('🗑️ Deleting chatbot:', chatbotId)

      await apiRequest.delete(`/api/chatbots/${chatbotId}`)
      
      console.log('✅ Chatbot deleted successfully')
      
      toast({
        title: "Chatbot deleted",
        description: "The chatbot has been deleted successfully.",
      })
      
      // Revalidate the chatbots list
      mutate('/api/chatbots')
      
      return { success: true }
    } catch (error: any) {
      console.error('❌ Delete chatbot error:', error)
      
      const errorMessage = error.message || 'Delete failed'
      
      toast({
        title: "Delete failed",
        description: errorMessage,
        variant: "destructive",
      })

      return { success: false, error: errorMessage }
    }
  }, [userProfile?.company_id])

  return { deleteChatbot }
}

/**
 * Hook to get a single chatbot by ID
 */
export function useChatbot(chatbotId: string) {
  const { userProfile } = useAuthStore()

  const { data, error, isLoading, mutate: mutateChatbot } = useSWR(
    userProfile?.company_id && chatbotId ? `/api/chatbots/${chatbotId}` : null,
    async () => {
      const result = await apiRequest.get<Chatbot>(`/api/chatbots/${chatbotId}`)
      return result
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  )

  return {
    chatbot: data,
    isLoading,
    error,
    mutate: mutateChatbot,
  }
}

/**
 * Hook to toggle chatbot active status
 */
export function useToggleChatbotStatus() {
  const { updateChatbot } = useUpdateChatbot()

  const toggleStatus = useCallback(async (chatbotId: string, currentStatus: boolean): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await updateChatbot(chatbotId, { is_active: !currentStatus })
      
      if (result.success) {
        toast({
          title: `Chatbot ${!currentStatus ? 'activated' : 'deactivated'}`,
          description: `The chatbot is now ${!currentStatus ? 'active' : 'inactive'}.`,
        })
      }
      
      return result
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to toggle chatbot status'
      
      toast({
        title: "Status change failed",
        description: errorMessage,
        variant: "destructive",
      })

      return { success: false, error: errorMessage }
    }
  }, [updateChatbot])

  return { toggleStatus }
}

/**
 * Hook to get chatbots count for analytics
 */
export function useChatbotsCount() {
  const { userProfile } = useAuthStore()
  const companyId = userProfile?.company_id

  const { data, error, isLoading } = useSWR(
    companyId ? `chatbots-count-${companyId}` : null,
    () => companyId ? chatbotService.getChatbotsCount(companyId) : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Refresh every 30 seconds for analytics
    }
  )

  return {
    count: data?.success ? data.count : 0,
    isLoading,
    error: data?.success === false ? data.error : error,
  }
} 