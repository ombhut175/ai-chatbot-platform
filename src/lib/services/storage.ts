import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { Supabase } from '@/helpers/string_const/supabase'
import { SupabaseClient } from '@supabase/supabase-js'

export class StorageService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createBrowserClient()
  }

  /**
   * Upload a file to the data-sources bucket
   */
  async uploadFile(
    file: File | ArrayBuffer,
    path: string,
    contentType?: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(Supabase.BUCKETS.DATA_SOURCES)
        .upload(path, file, {
          contentType: contentType,
          duplex: 'half'
        })

      if (error) {
        console.error('Storage upload error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Storage upload exception:', error)
      return { success: false, error: 'Failed to upload file' }
    }
  }

  /**
   * Delete a file from the data-sources bucket
   */
  async deleteFile(path: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.storage
        .from(Supabase.BUCKETS.DATA_SOURCES)
        .remove([path])

      if (error) {
        console.error('Storage delete error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Storage delete exception:', error)
      return { success: false, error: 'Failed to delete file' }
    }
  }

  /**
   * Get a signed URL for a file
   */
  async getSignedUrl(
    path: string,
    expiresIn: number = 3600
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(Supabase.BUCKETS.DATA_SOURCES)
        .createSignedUrl(path, expiresIn)

      if (error) {
        console.error('Storage signed URL error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, url: data?.signedUrl }
    } catch (error) {
      console.error('Storage signed URL exception:', error)
      return { success: false, error: 'Failed to get signed URL' }
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(path: string): { success: boolean; url?: string; error?: string } {
    try {
      const { data } = this.supabase.storage
        .from(Supabase.BUCKETS.DATA_SOURCES)
        .getPublicUrl(path)

      if (!data?.publicUrl) {
        return { success: false, error: 'Failed to get public URL' }
      }

      return { success: true, url: data.publicUrl }
    } catch (error) {
      console.error('Storage public URL exception:', error)
      return { success: false, error: 'Failed to get public URL' }
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(
    path: string = '',
    limit: number = 100
  ): Promise<{ success: boolean; files?: any[]; error?: string }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(Supabase.BUCKETS.DATA_SOURCES)
        .list(path, {
          limit,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) {
        console.error('Storage list error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, files: data }
    } catch (error) {
      console.error('Storage list exception:', error)
      return { success: false, error: 'Failed to list files' }
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(path: string): Promise<{ success: boolean; exists?: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(Supabase.BUCKETS.DATA_SOURCES)
        .list(path.split('/').slice(0, -1).join('/'), {
          search: path.split('/').pop()
        })

      if (error) {
        console.error('Storage file exists error:', error)
        return { success: false, error: error.message }
      }

      const exists = data && data.length > 0
      return { success: true, exists }
    } catch (error) {
      console.error('Storage file exists exception:', error)
      return { success: false, error: 'Failed to check file existence' }
    }
  }
}

export const storageService = new StorageService()

/**
 * Create a StorageService instance with a specific Supabase client
 * Useful for server-side operations with authentication context
 */
export function createStorageService(supabaseClient: SupabaseClient): StorageService {
  return new StorageService(supabaseClient)
} 