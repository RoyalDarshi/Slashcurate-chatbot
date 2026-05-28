import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";

/**
 * Extracts a unified error message from various API error structures
 */
export const getErrorMessage = (error: unknown, fallbackMessage = "An unexpected error occurred."): string => {
  if (axios.isAxiosError(error)) {
    // Try to extract standard API message structure
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    // Network or timeout errors
    if (error.code === 'ECONNABORTED') {
      return "Request timed out. Please try again.";
    }
    if (error.message) {
      return error.message;
    }
  } else if (error instanceof Error) {
    return error.message;
  }
  
  return fallbackMessage;
};

/**
 * Handles the error by extracting the message and showing a toast notification.
 */
export const handleApiError = (error: unknown, customFallback?: string, theme: "light" | "dark" = "light") => {
  const message = getErrorMessage(error, customFallback);
  console.error("API Error:", error);
  toast.error(message, { theme });
  return message;
};
