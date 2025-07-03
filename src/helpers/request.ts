import { apiClient } from '@/lib/api/apiClient';
import { HTTP_STATUS, API_MESSAGES } from '@/helpers/string_const/http';

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

// Generic request methods
export const apiRequest = {
  // GET request
  get: async <T>(url: string): Promise<T> => {
    const response = await apiClient.get<T>(url);
    return handleResponse(response, false); // Don't show toast for GET requests
  },

  // POST request
  post: async <T, D = any>(url: string, data?: D, showSuccessToast = true): Promise<T> => {
    const response = await apiClient.post<T>(url, data);
    return handleResponse(response, showSuccessToast);
  },

  // PUT request
  put: async <T, D = any>(url: string, data?: D, showSuccessToast = true): Promise<T> => {
    const response = await apiClient.put<T>(url, data);
    return handleResponse(response, showSuccessToast);
  },

  // PATCH request
  patch: async <T, D = any>(url: string, data?: D, showSuccessToast = true): Promise<T> => {
    const response = await apiClient.patch<T>(url, data);
    return handleResponse(response, showSuccessToast);
  },

  // DELETE request
  delete: async <T>(url: string, showSuccessToast = true): Promise<T> => {
    const response = await apiClient.delete<T>(url);
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
