import { Theme } from "./types";

export const themes: Record<"light" | "dark", Theme> = {
  light: {
    colors: {
      background: "#F9F9FB", // Soft, light off-white with a hint of blue
      surface: "#FFFFFF",
      text: "#2D3748",
      textSecondary: "#4B5563",
      accent: "#6B46C1",
      accentHover: "#5B3A9E",
      success: "#059669",
      error: "#C53030",
      warning: "#D97706",
      border: "#D1D5DB",
      bubbleUser: "#E9D8FD",
      bubbleBot: "#E2E8F0",
      bubbleUserText: "#2D3748",
      bubbleBotText: "#2D3748",
      hover: "#E2E8F0",
      disabled: "#E2E8F0",
      disabledText: "#A0AEC0",
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
        "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
      default: "0.375rem",
      large: "1rem",
      pill: "9999px",
    },
    shadow: {
      none: "none",
      sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    },
    transition: {
      default: "all 0.2s ease-in-out",
    },
  },
  dark: {
    colors: {
      background: "#0F172A",
      surface: "#1E2A44",
      text: "#F8FAFC",
      textSecondary: "#A0B3D6",
      accent: "#7C3AED",
      accentHover: "#9F67FF",
      success: "#10B981",
      error: "#F87171",
      warning: "#FBBF24",
      border: "#2D3B55",
      bubbleUser: "#5B21B6",
      bubbleBot: "#2A3448",
      bubbleUserText: "#F8FAFC",
      bubbleBotText: "#F8FAFC",
      hover: "#2D3B55",
      disabled: "#4B5E7A",
      disabledText: "#7A8BA8",
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
        "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      size: {
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
      default: "0.375rem",
      large: "1rem",
      pill: "9999px",
    },
    shadow: {
      none: "none",
      sm: "0 2px 4px 0 rgba(0, 0, 0, 0.6)",
      md: "0 6px 10px -1px rgba(0, 0, 0, 0.7)",
      lg: "0 12px 18px -3px rgba(0, 0, 0, 0.8)",
    },
    transition: {
      default: "all 0.3s ease-in-out",
    },
  },
};
