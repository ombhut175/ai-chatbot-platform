import axios from "axios";

// For Next.js API routes, we should use relative paths or the same domain
// Only use a different base URL if explicitly configured for external API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds timeout for file uploads
});

// Add request interceptor for debugging and FormData handling
apiClient.interceptors.request.use(
  (config) => {
    // If we're sending FormData, remove the Content-Type header
    // to let the browser set it automatically with the correct boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    console.log("API Request:", {
      url: config.url,
      method: config.method,
      data: config.data instanceof FormData ? 'FormData' : config.data,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log("API Response:", {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    return response;
  },
  (error: any) => {
    // Allow callers to suppress global toast notifications
    if (error.config?.suppressToast) {
      return Promise.reject(error);
    }

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const errorMessage = error.response.data?.message || "An error occurred";
      console.error("API Error:", errorMessage, error.response.data);
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received:", error.request);
      return Promise.reject(new Error("No response received from server"));
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Request setup error:", error.message);
      return Promise.reject(error);
    }
  }
); 