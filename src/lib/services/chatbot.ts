import { createClient } from '@/lib/supabase/client'
import { TableName } from '@/helpers/string_const/tables'
import { ChatbotType, ChatbotPersonality } from '@/helpers/string_const/chatbot'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface Chatbot {
  id: string
  name: string
  description: string | null
  type: ChatbotType
  welcome_message: string | null
  personality: ChatbotPersonality
  theme: any | null
  is_active: boolean
  status: 'processing' | 'ready' | 'error'
  company_id: string
  pinecone_namespace: string | null
  created_at: string
  updated_at: string
}

export interface CreateChatbotData {
  name: string
  description?: string
  type: ChatbotType
  welcome_message?: string
  personality?: ChatbotPersonality
  theme?: any
  company_id: string
  pinecone_namespace?: string
  data_source_ids?: string[]
}

export interface UpdateChatbotData {
  name?: string
  description?: string
  type?: ChatbotType
  welcome_message?: string
  personality?: ChatbotPersonality
  theme?: any
  is_active?: boolean
  status?: 'processing' | 'ready' | 'error'
}

export class ChatbotService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  /**
   * Get all chatbots for a company with data source counts
   */
  async getChatbotsByCompany(companyId: string): Promise<{ success: boolean; data?: (Chatbot & { dataSourceCount?: number })[]; error?: string }> {
    try {
      // Fetch chatbots with data source counts
      const { data, error } = await this.supabase
        .from(TableName.CHATBOTS)
        .select(`
          *,
          chatbot_data_sources!inner(count)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching chatbots with data source count failed, fetching without count:', error)
        
        // Fallback: Fetch chatbots without data source count
        const { data: fallbackData, error: fallbackError } = await this.supabase
          .from(TableName.CHATBOTS)
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })

        if (fallbackError) {
          console.error('Error fetching chatbots (fallback):', fallbackError)
          return { success: false, error: fallbackError.message }
        }

        // Add data source counts manually for each chatbot
        const chatbotsWithCounts = await Promise.all(
          (fallbackData || []).map(async (chatbot) => {
            const { count } = await this.supabase
              .from(TableName.CHATBOT_DATA_SOURCES)
              .select('*', { count: 'exact', head: true })
              .eq('chatbot_id', chatbot.id)

            return {
              ...chatbot,
              dataSourceCount: count || 0
            }
          })
        )

        return { success: true, data: chatbotsWithCounts }
      }

      // Process data to include data source counts
      const chatbotsWithCounts = (data || []).map(chatbot => ({
        ...chatbot,
        dataSourceCount: chatbot.chatbot_data_sources?.length || 0
      }))

      // Remove the join data from response
      const cleanedData = chatbotsWithCounts.map(({ chatbot_data_sources, ...chatbot }) => chatbot)

      return { success: true, data: cleanedData }
    } catch (error) {
      console.error('Error in getChatbotsByCompany:', error)
      return { success: false, error: 'Failed to fetch chatbots' }
    }
  }

  /**
   * Get a single chatbot by ID
   */
  async getChatbotById(id: string): Promise<{ success: boolean; data?: Chatbot; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from(TableName.CHATBOTS)
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching chatbot:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error in getChatbotById:', error)
      return { success: false, error: 'Failed to fetch chatbot' }
    }
  }

  /**
   * Create a new chatbot
   */
  async createChatbot(chatbotData: CreateChatbotData): Promise<{ success: boolean; data?: Chatbot; error?: string }> {
    try {
      // Start a transaction to create chatbot and associate data sources
      const { data: chatbot, error: chatbotError } = await this.supabase
        .from(TableName.CHATBOTS)
        .insert({
          name: chatbotData.name,
          description: chatbotData.description || null,
          type: chatbotData.type,
          welcome_message: chatbotData.welcome_message || 'Hello! How can I help you today?',
          personality: chatbotData.personality || ChatbotPersonality.PROFESSIONAL,
          theme: chatbotData.theme || {
            primaryColor: "#3B82F6",
            backgroundColor: "#FFFFFF",
            textColor: "#1F2937",
          },
          is_active: true,
          status: (chatbotData.data_source_ids && chatbotData.data_source_ids.length > 0) ? 'processing' : 'ready',
          company_id: chatbotData.company_id,
          pinecone_namespace: chatbotData.pinecone_namespace || null,
        })
        .select()
        .single()

      if (chatbotError) {
        console.error('Error creating chatbot:', chatbotError)
        return { success: false, error: chatbotError.message }
      }

      // Associate data sources if provided
      if (chatbotData.data_source_ids && chatbotData.data_source_ids.length > 0) {
        const associationResult = await this.associateDataSources(chatbot.id, chatbotData.data_source_ids)
        if (!associationResult.success) {
          console.warn('Chatbot created but failed to associate data sources:', associationResult.error)
        }
      }

      return { success: true, data: chatbot }
    } catch (error) {
      console.error('Error in createChatbot:', error)
      return { success: false, error: 'Failed to create chatbot' }
    }
  }

  /**
   * Update a chatbot
   */
  async updateChatbot(id: string, updates: UpdateChatbotData): Promise<{ success: boolean; data?: Chatbot; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from(TableName.CHATBOTS)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating chatbot:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error in updateChatbot:', error)
      return { success: false, error: 'Failed to update chatbot' }
    }
  }

  /**
   * Delete a chatbot
   */
  async deleteChatbot(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from(TableName.CHATBOTS)
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting chatbot:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in deleteChatbot:', error)
      return { success: false, error: 'Failed to delete chatbot' }
    }
  }

  /**
   * Associate data sources with a chatbot
   */
  async associateDataSources(chatbotId: string, dataSourceIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const associations = dataSourceIds.map(dataSourceId => ({
        chatbot_id: chatbotId,
        data_source_id: dataSourceId
      }))

      const { error } = await this.supabase
        .from(TableName.CHATBOT_DATA_SOURCES)
        .insert(associations)

      if (error) {
        console.error('Error associating data sources:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in associateDataSources:', error)
      return { success: false, error: 'Failed to associate data sources' }
    }
  }

  /**
   * Remove data source associations from a chatbot
   */
  async removeDataSourceAssociations(chatbotId: string, dataSourceIds?: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      let query = this.supabase
        .from(TableName.CHATBOT_DATA_SOURCES)
        .delete()
        .eq('chatbot_id', chatbotId)

      if (dataSourceIds && dataSourceIds.length > 0) {
        query = query.in('data_source_id', dataSourceIds)
      }

      const { error } = await query

      if (error) {
        console.error('Error removing data source associations:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in removeDataSourceAssociations:', error)
      return { success: false, error: 'Failed to remove data source associations' }
    }
  }

  /**
   * Get data sources associated with a chatbot
   */
  async getChatbotDataSources(chatbotId: string): Promise<{ success: boolean; data?: string[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from(TableName.CHATBOT_DATA_SOURCES)
        .select('data_source_id')
        .eq('chatbot_id', chatbotId)

      if (error) {
        console.error('Error fetching chatbot data sources:', error)
        return { success: false, error: error.message }
      }

      const dataSourceIds = data.map(item => item.data_source_id)
      return { success: true, data: dataSourceIds }
    } catch (error) {
      console.error('Error in getChatbotDataSources:', error)
      return { success: false, error: 'Failed to fetch chatbot data sources' }
    }
  }

  /**
   * Get chatbots count for a company
   */
  async getChatbotsCount(companyId: string): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const { count, error } = await this.supabase
        .from(TableName.CHATBOTS)
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)

      if (error) {
        console.error('Error getting chatbots count:', error)
        return { success: false, error: error.message }
      }

      return { success: true, count: count || 0 }
    } catch (error) {
      console.error('Error in getChatbotsCount:', error)
      return { success: false, error: 'Failed to get chatbots count' }
    }
  }
}

export const chatbotService = new ChatbotService()

export const createChatbotService = (supabaseClient: SupabaseClient) => {
  return new ChatbotService(supabaseClient)
} 