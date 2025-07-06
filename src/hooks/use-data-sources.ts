import useSWR, { mutate } from 'swr'
import { useCallback } from 'react'
import { dataSourceService } from '@/lib/services/dataSource'
import { useAppStore, useAuthStore } from '@/lib/store'
import { apiRequest } from '@/helpers/request'
import { DataSourceStatus } from '@/helpers/string_const/dataSource'
import type { DataSource } from '@/lib/types'
import { toast } from '@/hooks/use-toast'

/**
 * Hook to fetch data sources for the current user's company
 */
export function useDataSources() {
  const { userProfile } = useAuthStore()
  const companyId = userProfile?.company_id

  const { data, error, isLoading, mutate: mutateSources } = useSWR(
    companyId ? `/api/data-sources/${companyId}` : null,
    () => companyId ? dataSourceService.getDataSourcesByCompany(companyId) : null,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      // Refresh every 5 seconds to catch background processing updates
      refreshInterval: 5000,
      // Keep previous data while revalidating
      keepPreviousData: true,
    }
  )

  return {
    dataSources: data?.success ? data.data : [],
    isLoading,
    error: data?.success === false ? data.error : error,
    mutate: mutateSources,
  }
}

/**
 * Hook to upload files with Inngest background processing
 */
export function useFileUpload() {
  const { userProfile } = useAuthStore()
  const { setUploading, addDataSource } = useAppStore()

  const uploadFile = useCallback(async (file: File): Promise<{ success: boolean; data?: DataSource; error?: string }> => {
    if (!userProfile?.company_id) {
      return { success: false, error: 'User not associated with a company' }
    }

    try {
      console.log('🚀 Starting file upload:', file.name)
      setUploading(true)

      const formData = new FormData()
      formData.append('file', file)

      console.log('📤 Sending file to server...')
      const result = await apiRequest.post<DataSource>('/api/upload', formData)

      if (result) {
        console.log('✅ File uploaded successfully:', result)
        
        // Add to store immediately for optimistic updates
        addDataSource(result)
        
        // Show success toast
        toast({
          title: "File uploaded successfully",
          description: `${file.name} is being processed in the background. You'll see status updates automatically.`,
        })
        
        // Force immediate revalidation of the data sources list
        await mutate(`/api/data-sources/${userProfile.company_id}`, undefined, {
          revalidate: true,
          populateCache: false,
        })

        console.log('🎉 Upload process completed successfully')
        return { success: true, data: result }
      }

      return { success: false, error: 'Upload failed' }
    } catch (error: any) {
      console.error('❌ File upload error:', error)
      
      const errorMessage = error.message || 'Upload failed'
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      })

      return { success: false, error: errorMessage }
    } finally {
      setUploading(false)
    }
  }, [userProfile?.company_id, setUploading, addDataSource])

  return {
    uploadFile,
    isUploading: useAppStore(state => state.uploading),
  }
}

/**
 * Hook to delete a data source
 */
export function useDeleteDataSource() {
  const { userProfile } = useAuthStore()
  const { removeDataSource } = useAppStore()

  const deleteDataSource = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!userProfile?.company_id) {
      return { success: false, error: 'User not associated with a company' }
    }

    try {
      console.log('🗑️ Deleting data source:', id)
      
      // Optimistic update - remove from store immediately
      removeDataSource(id)

      const result = await dataSourceService.deleteDataSource(id)
      
      if (result.success) {
        console.log('✅ Data source deleted successfully')
        
        // Show success toast
        toast({
          title: "Data source deleted",
          description: "The data source has been removed successfully.",
        })
        
        // Revalidate the data sources list
        mutate(`/api/data-sources/${userProfile.company_id}`)
        
        return { success: true }
      }

      // If deletion failed, re-fetch to restore the item
      mutate(`/api/data-sources/${userProfile.company_id}`)
      
      toast({
        title: "Delete failed",
        description: result.error || "Failed to delete data source",
        variant: "destructive",
      })

      return result
    } catch (error: any) {
      console.error('❌ Delete data source error:', error)
      
      // Restore the item by re-fetching
      mutate(`/api/data-sources/${userProfile.company_id}`)
      
      const errorMessage = error.message || 'Delete failed'
      
      toast({
        title: "Delete failed",
        description: errorMessage,
        variant: "destructive",
      })

      return { success: false, error: errorMessage }
    }
  }, [userProfile?.company_id, removeDataSource])

  return { deleteDataSource }
}

/**
 * Hook to update a data source
 */
export function useUpdateDataSource() {
  const { userProfile } = useAuthStore()
  const { updateDataSource: updateInStore } = useAppStore()

  const updateDataSource = useCallback(async (
    id: string, 
    updates: { name?: string; status?: DataSourceStatus }
  ): Promise<{ success: boolean; data?: DataSource; error?: string }> => {
    if (!userProfile?.company_id) {
      return { success: false, error: 'User not associated with a company' }
    }

    try {
      console.log('📝 Updating data source:', id, updates)
      
      const result = await dataSourceService.updateDataSource(id, updates)
      
      if (result.success && result.data) {
        console.log('✅ Data source updated successfully')
        
        // Update in store immediately for optimistic updates
        updateInStore(id, result.data)
        
        // Revalidate the data sources list
        mutate(`/api/data-sources/${userProfile.company_id}`)
        
        return result
      }

      return result
    } catch (error: any) {
      console.error('❌ Update data source error:', error)
      return { success: false, error: error.message || 'Update failed' }
    }
  }, [userProfile?.company_id, updateInStore])

  return { updateDataSource }
}

/**
 * Hook to scrape URLs and create data sources
 */
export function useUrlScraping() {
  const { userProfile } = useAuthStore()
  const { addDataSource } = useAppStore()

  const scrapeUrl = useCallback(async (url: string): Promise<{ success: boolean; data?: DataSource; error?: string }> => {
    if (!userProfile?.company_id) {
      return { success: false, error: 'User not associated with a company' }
    }

    try {
      console.log('🕷️ Starting URL scraping:', url)

      const result = await apiRequest.post<DataSource>('/api/scrape-url', { url })

      if (result) {
        console.log('✅ URL scraped successfully:', result)
        
        // Add to store immediately for optimistic updates
        addDataSource(result)
        
        // Show success toast
        toast({
          title: "URL scraped successfully",
          description: `Content from ${url} is being processed in the background.`,
        })
        
        // Revalidate the data sources list to catch any updates
        mutate(`/api/data-sources/${userProfile.company_id}`)

        console.log('🎉 URL scraping process completed successfully')
        return { success: true, data: result }
      }

      return { success: false, error: 'URL scraping failed' }
    } catch (error: any) {
      console.error('❌ URL scraping error:', error)
      
      const errorMessage = error.message || 'URL scraping failed'
      
      toast({
        title: "URL scraping failed",
        description: errorMessage,
        variant: "destructive",
      })

      return { success: false, error: errorMessage }
    }
  }, [userProfile?.company_id, addDataSource])

  return { scrapeUrl }
}

/**
 * Hook to create Q&A pairs and add them as data sources
 */
export function useQaPairs() {
  const { userProfile } = useAuthStore()
  const { addDataSource } = useAppStore()

  const createQaPair = useCallback(async (question: string, answer: string): Promise<{ success: boolean; data?: DataSource; error?: string }> => {
    if (!userProfile?.company_id) {
      return { success: false, error: 'User not associated with a company' }
    }

    try {
      console.log('📝 Creating Q&A pair:', { question: question.substring(0, 50) + '...' })

      const result = await apiRequest.post<DataSource>('/api/qa-pairs', { question, answer })

      if (result) {
        console.log('✅ Q&A pair created successfully:', result)
        
        // Add to store immediately for optimistic updates
        addDataSource(result)
        
        // Show success toast
        toast({
          title: "Q&A pair created successfully",
          description: "Your question and answer pair is being processed in the background.",
        })
        
        // Revalidate the data sources list to catch any updates
        mutate(`/api/data-sources/${userProfile.company_id}`)

        console.log('🎉 Q&A pair creation completed successfully')
        return { success: true, data: result }
      }

      return { success: false, error: 'Q&A pair creation failed' }
    } catch (error: any) {
      console.error('❌ Q&A pair creation error:', error)
      
      const errorMessage = error.message || 'Q&A pair creation failed'
      
      toast({
        title: "Q&A pair creation failed",
        description: errorMessage,
        variant: "destructive",
      })

      return { success: false, error: errorMessage }
    }
  }, [userProfile?.company_id, addDataSource])

  return { createQaPair }
}

/**
 * Hook to get data sources count
 */
export function useDataSourcesCount() {
  const { userProfile } = useAuthStore()
  const companyId = userProfile?.company_id

  const { data, error, isLoading } = useSWR(
    companyId ? `/api/data-sources-count/${companyId}` : null,
    () => companyId ? dataSourceService.getDataSourcesCount(companyId) : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // Cache for 30 seconds
    }
  )

  return {
    count: data?.success ? data.count : 0,
    isLoading,
    error: data?.success === false ? data.error : error,
  }
} 