import { createClient } from '@/lib/supabase/client'
import { TableName } from '@/helpers/string_const/tables'
import { DataSourceType, DataSourceStatus } from '@/helpers/string_const/dataSource'
import type { DataSource } from '@/lib/types'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface CreateDataSourceData {
  name: string
  type: DataSourceType
  size: number
  storage_path: string
  company_id: string
  status?: DataSourceStatus
  pinecone_namespace?: string
}

export interface UpdateDataSourceData {
  name?: string
  status?: DataSourceStatus
  pinecone_namespace?: string
}

export class DataSourceService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  /**
   * Get all data sources for a company
   */
  async getDataSourcesByCompany(companyId: string): Promise<{ success: boolean; data?: DataSource[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from(TableName.DATA_SOURCES)
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching data sources:', error)
        return { success: false, error: error.message }
      }

      // Transform the data to match our DataSource type
      const transformedData: DataSource[] = data.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        size: item.size,
        status: item.status,
        uploadedAt: item.created_at,
        companyId: item.company_id,
      }))

      return { success: true, data: transformedData }
    } catch (error) {
      console.error('Error in getDataSourcesByCompany:', error)
      return { success: false, error: 'Failed to fetch data sources' }
    }
  }

  /**
   * Get a single data source by ID
   */
  async getDataSourceById(id: string): Promise<{ success: boolean; data?: DataSource; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from(TableName.DATA_SOURCES)
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching data source:', error)
        return { success: false, error: error.message }
      }

      // Transform the data to match our DataSource type
      const transformedData: DataSource = {
        id: data.id,
        name: data.name,
        type: data.type,
        size: data.size,
        status: data.status,
        uploadedAt: data.created_at,
        companyId: data.company_id,
      }

      return { success: true, data: transformedData }
    } catch (error) {
      console.error('Error in getDataSourceById:', error)
      return { success: false, error: 'Failed to fetch data source' }
    }
  }

  /**
   * Create a new data source
   */
  async createDataSource(dataSourceData: CreateDataSourceData): Promise<{ success: boolean; data?: DataSource; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from(TableName.DATA_SOURCES)
        .insert({
          name: dataSourceData.name,
          type: dataSourceData.type,
          size: dataSourceData.size,
          status: dataSourceData.status || DataSourceStatus.PROCESSING,
          storage_path: dataSourceData.storage_path,
          pinecone_namespace: dataSourceData.pinecone_namespace,
          company_id: dataSourceData.company_id,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating data source:', error)
        return { success: false, error: error.message }
      }

      // Transform the data to match our DataSource type
      const transformedData: DataSource = {
        id: data.id,
        name: data.name,
        type: data.type,
        size: data.size,
        status: data.status,
        uploadedAt: data.created_at,
        companyId: data.company_id,
      }

      return { success: true, data: transformedData }
    } catch (error) {
      console.error('Error in createDataSource:', error)
      return { success: false, error: 'Failed to create data source' }
    }
  }

  /**
   * Update a data source
   */
  async updateDataSource(id: string, updates: UpdateDataSourceData): Promise<{ success: boolean; data?: DataSource; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from(TableName.DATA_SOURCES)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating data source:', error)
        return { success: false, error: error.message }
      }

      // Transform the data to match our DataSource type
      const transformedData: DataSource = {
        id: data.id,
        name: data.name,
        type: data.type,
        size: data.size,
        status: data.status,
        uploadedAt: data.created_at,
        companyId: data.company_id,
      }

      return { success: true, data: transformedData }
    } catch (error) {
      console.error('Error in updateDataSource:', error)
      return { success: false, error: 'Failed to update data source' }
    }
  }

  /**
   * Delete a data source
   */
  async deleteDataSource(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from(TableName.DATA_SOURCES)
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting data source:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in deleteDataSource:', error)
      return { success: false, error: 'Failed to delete data source' }
    }
  }

  /**
   * Get data sources with specific status
   */
  async getDataSourcesByStatus(
    companyId: string, 
    status: DataSourceStatus
  ): Promise<{ success: boolean; data?: DataSource[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from(TableName.DATA_SOURCES)
        .select('*')
        .eq('company_id', companyId)
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching data sources by status:', error)
        return { success: false, error: error.message }
      }

      // Transform the data to match our DataSource type
      const transformedData: DataSource[] = data.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        size: item.size,
        status: item.status,
        uploadedAt: item.created_at,
        companyId: item.company_id,
      }))

      return { success: true, data: transformedData }
    } catch (error) {
      console.error('Error in getDataSourcesByStatus:', error)
      return { success: false, error: 'Failed to fetch data sources by status' }
    }
  }

  /**
   * Get count of data sources for a company
   */
  async getDataSourcesCount(companyId: string): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const { count, error } = await this.supabase
        .from(TableName.DATA_SOURCES)
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)

      if (error) {
        console.error('Error getting data sources count:', error)
        return { success: false, error: error.message }
      }

      return { success: true, count: count || 0 }
    } catch (error) {
      console.error('Error in getDataSourcesCount:', error)
      return { success: false, error: 'Failed to get data sources count' }
    }
  }
}

// Create a default instance for client-side usage
export const dataSourceService = new DataSourceService()

// Helper function to create a service with server client
export const createDataSourceService = (supabaseClient: SupabaseClient) => {
  return new DataSourceService(supabaseClient)
} 