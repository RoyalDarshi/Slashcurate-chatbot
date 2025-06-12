import { Theme } from "./types";

export const themes: Record<"light" | "dark", Theme> = {
  light: {
    colors: {
      background: "#F9FAFB",
      surface: "#FFFFFF",
      text: "#2D3748",
      textSecondary: "#6B7280",
      accent: "#A05AFF", // Vibrant Purple
      accentHover: "#9E58FF", // Neon Purple
      success: "#1BCFB4", // Aqua Green
      error: "#FE9496", // Coral Pink
      warning: "#FFD66B", // Soft Yellow
      border: "#E5E7EB",
      bubbleUser: "#EDE9FE", // Light Purple Bubble
      bubbleBot: "#F0F4F8", // Soft gray-blue
      bubbleUserText: "#2D3748",
      bubbleBotText: "#2D3748",
      hover: "#F3F4F6",
      disabled: "#E5E7EB",
      disabledText: "#9CA3AF",
    },
    spacing: {
      xs: "0.25rem",
      sm: "0.5rem",
      md: "1rem",
      lg: "1.5rem",
      xl: "2rem",
    },
    typography: {
      fontFamily:
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      size: {
        xs: "0.25rem",
        sm: "0.875rem",
        base: "1rem",
        lg: "1.25rem",
      },
      weight: {
        normal: "400",
        medium: "500",
        bold: "700",
      },
    },
    borderRadius: {
      none: "0",
      default: "0.5rem",
      large: "1rem",
      pill: "9999px",
    },
    shadow: {
      none: "none",
      xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      sm: "0 2px 4px 0 rgba(0, 0, 0, 0.06)",
      md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      xl: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
    },
    transition: {
      default: "all 0.2s ease-in-out",
    },
  },

  dark: {
    colors: {
      background: "#111827",
      surface: "#1F2937",
      text: "#F9FAFB",
      textSecondary: "#D1D5DB",
      accent: "#9E58FF", // Neon Purple
      accentHover: "#A05AFF", // Vibrant Purple
      success: "#1BCFB4", // Aqua Green
      error: "#FE9496", // Coral Pink
      warning: "#FFD66B", // Light yellow
      border: "#374151",
      bubbleUser: "#4BCEEB", // Bright Sky Blue
      bubbleBot: "#2D3748", // Deep Gray
      bubbleUserText: "#F9FAFB",
      bubbleBotText: "#F9FAFB",
      hover: "#374151",
      disabled: "#4B5563",
      disabledText: "#9CA3AF",
    },
    spacing: {
      xs: "0.25rem",
      sm: "0.5rem",
      md: "1rem",
      lg: "1.5rem",
      xl: "2rem",
    },
    typography: {
      fontFamily:
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      size: {
        xs: "0.25rem",
        sm: "0.875rem",
        base: "1rem",
        lg: "1.25rem",
      },
      weight: {
        normal: "400",
        medium: "500",
        bold: "700",
      },
    },
    borderRadius: {
      none: "0",
      default: "0.5rem",
      large: "1rem",
      pill: "9999px",
    },
    shadow: {
      none: "none",
      xs: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
      sm: "0 2px 4px 0 rgba(0, 0, 0, 0.4)",
      md: "0 4px 6px -1px rgba(0, 0, 0, 0.5)",
      lg: "0 10px 15px -3px rgba(0, 0, 0, 0.6)",
      xl: "0 20px 25px -5px rgba(0, 0, 0, 0.7)",
    },
    transition: {
      default: "all 0.3s ease-in-out",
    },
  },
};
