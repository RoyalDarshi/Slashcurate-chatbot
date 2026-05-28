import axios, { AxiosError } from "axios";
import { API_URL, CHATBOT_API_URL } from "../config";

// Unified helper to clear tokens and force a redirect on 401
const handleUnauthorized = () => {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("adminToken");
  localStorage.removeItem("uid");
  localStorage.removeItem("allowedToCreateConnection");
  localStorage.removeItem("allowedToCreatePublicConnection");
  
  if (window.location.pathname !== "/") {
    window.location.href = "/";
  }
};

const createApiClient = (baseURL: string) => {
  const client = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
  });

  // Request Interceptor: Inject Token into Body for POST/PUT if required
  client.interceptors.request.use((config) => {
    const isAdmin = config.headers["X-Is-Admin"] === "true";
    const token = sessionStorage.getItem(isAdmin ? "adminToken" : "token");
    
    // Cleanup custom header before sending
    if (config.headers["X-Is-Admin"]) {
      delete config.headers["X-Is-Admin"];
    }

    // Backend expects token in the body for almost all protected routes
    if (token && config.data && typeof config.data === "object") {
      if (!("token" in config.data)) {
        config.data.token = token;
      }
    }

    // We can also add it as a Bearer token just in case future backend routes rely on headers
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  });

  // Response Interceptor: Global Error Handling
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Handle Unauthorized (401) globally
      if (error.response?.status === 401) {
        // Skip redirecting if the failing request is actually a login attempt
        const isLoginRequest = error.config?.url?.includes("/login");
        const isValidateRequest = error.config?.url?.includes("/validate-token");
        
        if (!isLoginRequest && !isValidateRequest) {
          handleUnauthorized();
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient(API_URL);
export const chatbotApiClient = createApiClient(CHATBOT_API_URL);
