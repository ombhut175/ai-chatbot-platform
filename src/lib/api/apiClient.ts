import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log("API Request:", {
      url: config.url,
      method: config.method,
      data: config.data,
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