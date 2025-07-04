import { apiClient } from '@/lib/api/apiClient';
import { HTTP_STATUS, API_MESSAGES } from '@/helpers/string_const/http';
import type { AxiosRequestConfig } from 'axios';

// Extend AxiosRequestConfig to include our custom suppressToast flag
export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  suppressToast?: boolean;
}

// Re-export for convenience
export type { AxiosRequestConfig };

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: any) => {
    // Allow callers to suppress global toast notifications (e.g., silent health checks)
    if (error.config?.suppressToast) {
      return Promise.reject(error)
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject(error)
    }

    // Handle specific status codes
    const status = error.response.status
    if (status >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    }

    return Promise.reject(error)
  }
);

// Generic response handler
const handleResponse = <T>(response: any, showSuccessToast = true): T => {
  const { status, data } = response;
  
  // Check if response status is successful
  if (status < HTTP_STATUS.OK || status >= 300) {
    throw new Error(`Request failed with status ${status}`);
  }

  // Show success message if it's not a GET request and has a message
  if (showSuccessToast && response.config.method !== 'get') {
    const responseData = data as any;
    if (responseData?.message) {
    }
  }

  // Extract the nested data property from the backend response structure
  // Backend returns: {statusCode, success, message, data: actualData}
  // We need to return just the actualData
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data;
  }
  
  // Fallback: return the data as-is if it doesn't have the expected structure
  return data;
};

/**
 * Generic request methods with support for custom Axios configuration
 * 
 * All methods support two call signatures for backward compatibility:
 * 1. Original: method(url, data?, showSuccessToast?, axiosConfig?)
 * 2. New: method(url, data?, axiosConfig?)
 * 
 * When using the new signature with axiosConfig, you can:
 * - Pass custom headers: { headers: { 'X-Custom-Header': 'value' } }
 * - Suppress toast notifications: { suppressToast: true }
 * - Set any other Axios request options
 * 
 * Example usage:
 * ```typescript
 * // With custom headers
 * await apiRequest.post('/api/endpoint', data, {
 *   headers: { 'X-API-Key': 'secret' },
 *   suppressToast: true
 * });
 * 
 * // Old signature still works
 * await apiRequest.post('/api/endpoint', data, true);
 * ```
 */
export const apiRequest = {
  // GET request
  get: async <T>(url: string, axiosConfig?: CustomAxiosRequestConfig): Promise<T> => {
    const response = await apiClient.get<T>(url, axiosConfig);
    return handleResponse(response, false); // Don't show toast for GET requests
  },

  // POST request - supports both old signature and new with axiosConfig
  post: async <T, D = any>(
    url: string, 
    data?: D, 
    showSuccessToastOrConfig?: boolean | CustomAxiosRequestConfig,
    axiosConfig?: CustomAxiosRequestConfig
  ): Promise<T> => {
    // Handle backward compatibility
    let showSuccessToast = true;
    let config: CustomAxiosRequestConfig | undefined;
    
    if (typeof showSuccessToastOrConfig === 'boolean') {
      // Old signature: post(url, data, showSuccessToast, axiosConfig)
      showSuccessToast = showSuccessToastOrConfig;
      config = axiosConfig;
    } else if (showSuccessToastOrConfig && typeof showSuccessToastOrConfig === 'object') {
      // New signature: post(url, data, axiosConfig)
      config = showSuccessToastOrConfig;
      // Check if suppressToast is in the config to maintain toast behavior
      showSuccessToast = !config.suppressToast;
    }
    
    const response = await apiClient.post<T>(url, data, config);
    return handleResponse(response, showSuccessToast);
  },

  // POST request with custom config (for external APIs like Hugging Face)
  postWithConfig: async <T, D = any>(url: string, data?: D, config?: any): Promise<T> => {
    const response = await apiClient.post<T>(url, data, config);
    // For external APIs, don't use our standard response handler
    // Return the raw response data instead
    return response.data;
  },

  // PUT request - supports both old signature and new with axiosConfig
  put: async <T, D = any>(
    url: string, 
    data?: D, 
    showSuccessToastOrConfig?: boolean | CustomAxiosRequestConfig,
    axiosConfig?: CustomAxiosRequestConfig
  ): Promise<T> => {
    // Handle backward compatibility
    let showSuccessToast = true;
    let config: CustomAxiosRequestConfig | undefined;
    
    if (typeof showSuccessToastOrConfig === 'boolean') {
      // Old signature: put(url, data, showSuccessToast, axiosConfig)
      showSuccessToast = showSuccessToastOrConfig;
      config = axiosConfig;
    } else if (showSuccessToastOrConfig && typeof showSuccessToastOrConfig === 'object') {
      // New signature: put(url, data, axiosConfig)
      config = showSuccessToastOrConfig;
      // Check if suppressToast is in the config to maintain toast behavior
      showSuccessToast = !config.suppressToast;
    }
    
    const response = await apiClient.put<T>(url, data, config);
    return handleResponse(response, showSuccessToast);
  },

  // PATCH request - supports both old signature and new with axiosConfig
  patch: async <T, D = any>(
    url: string, 
    data?: D, 
    showSuccessToastOrConfig?: boolean | CustomAxiosRequestConfig,
    axiosConfig?: CustomAxiosRequestConfig
  ): Promise<T> => {
    // Handle backward compatibility
    let showSuccessToast = true;
    let config: CustomAxiosRequestConfig | undefined;
    
    if (typeof showSuccessToastOrConfig === 'boolean') {
      // Old signature: patch(url, data, showSuccessToast, axiosConfig)
      showSuccessToast = showSuccessToastOrConfig;
      config = axiosConfig;
    } else if (showSuccessToastOrConfig && typeof showSuccessToastOrConfig === 'object') {
      // New signature: patch(url, data, axiosConfig)
      config = showSuccessToastOrConfig;
      // Check if suppressToast is in the config to maintain toast behavior
      showSuccessToast = !config.suppressToast;
    }
    
    const response = await apiClient.patch<T>(url, data, config);
    return handleResponse(response, showSuccessToast);
  },

  // DELETE request - supports both old signature and new with axiosConfig
  delete: async <T>(
    url: string, 
    showSuccessToastOrConfig?: boolean | CustomAxiosRequestConfig,
    axiosConfig?: CustomAxiosRequestConfig
  ): Promise<T> => {
    // Handle backward compatibility
    let showSuccessToast = true;
    let config: CustomAxiosRequestConfig | undefined;
    
    if (typeof showSuccessToastOrConfig === 'boolean') {
      // Old signature: delete(url, showSuccessToast, axiosConfig)
      showSuccessToast = showSuccessToastOrConfig;
      config = axiosConfig;
    } else if (showSuccessToastOrConfig && typeof showSuccessToastOrConfig === 'object') {
      // New signature: delete(url, axiosConfig)
      config = showSuccessToastOrConfig;
      // Check if suppressToast is in the config to maintain toast behavior
      showSuccessToast = !config.suppressToast;
    }
    
    const response = await apiClient.delete<T>(url, config);
    return handleResponse(response, showSuccessToast);
  },
};

// Export axios instance for custom usage if needed
export { apiClient };

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}
