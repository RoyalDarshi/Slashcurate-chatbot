import { Theme } from "./types";

export const themes: Record<"light" | "dark", Theme> = {
  light: {
    colors: {
      background: "#F9FAFB", // Light gray background
      surface: "#FFFFFF", // White chat surface
      text: "#1F2937", // Dark gray text
      textSecondary: "#6B7280", // Medium gray text
      accent: "#8B5CF6", // Purple accent
      accentHover: "#7C3AED", // Darker purple for hover
      success: "#10B981", // Green success
      error: "#EF4444", // Red error
      warning: "#F59E0B", // Amber warning
      border: "#E5E7EB", // Light gray border
      bubbleUser: "#EDE9FE", // Soft purple user bubble
      bubbleBot: "#F3F4F6", // Light gray bot bubble
      bubbleUserText: "#1F2937", // Same as primary text
      bubbleBotText: "#1F2937", // Same as primary text
      hover: "#E5E7EB", // Light gray hover
      disabled: "#D1D5DB", // Gray disabled background
      disabledText: "#9CA3AF", // Lighter gray disabled text
    },
    spacing: {
      xs: "0.25rem", // 4px
      sm: "0.5rem", // 8px
      md: "1rem", // 16px
      lg: "1.5rem", // 24px
      xl: "2rem", // 32px
    },
    typography: {
      fontFamily:
        "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      size: {
        sm: "0.875rem", // 14px
        base: "1rem", // 16px
        lg: "1.25rem", // 20px
      },
      weight: {
        normal: "400",
        medium: "500",
        bold: "700",
      },
    },
    borderRadius: {
      none: "0",
      default: "0.375rem", // 6px
      large: "1rem", // 16px
      pill: "9999px", // Fully rounded
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
      background: "#111827", // Dark gray background
      surface: "#1E293B", // Slightly lighter gray surface
      text: "#F9FAFB", // White text
      textSecondary: "#9CA3AF", // Light gray secondary text
      accent: "#8B5CF6", // Purple accent (consistent with light)
      accentHover: "#A78BFA", // Lighter purple for hover
      success: "#10B981", // Green success
      error: "#EF4444", // Red error
      warning: "#F59E0B", // Amber warning
      border: "#374151", // Darker gray border
      bubbleUser: "#4C1D95", // Dark purple user bubble
      bubbleBot: "#334155", // Slate gray bot bubble
      bubbleUserText: "#F9FAFB", // White user text
      bubbleBotText: "#F9FAFB", // White bot text
      hover: "#374151", // Dark gray hover
      disabled: "#4B5563", // Darker gray disabled background
      disabledText: "#6B7280", // Gray disabled text
    },
    spacing: {
      xs: "0.25rem", // 4px
      sm: "0.5rem", // 8px
      md: "1rem", // 16px
      lg: "1.5rem", // 24px
      xl: "2rem", // 32px
    },
    typography: {
      fontFamily:
        "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      size: {
        sm: "0.875rem", // 14px
        base: "1rem", // 16px
        lg: "1.25rem", // 20px
      },
      weight: {
        normal: "400",
        medium: "500",
        bold: "700",
      },
    },
    borderRadius: {
      none: "0",
      default: "0.375rem", // 6px
      large: "1rem", // 16px
      pill: "9999px", // Fully rounded
    },
    shadow: {
      none: "none",
      sm: "0 1px 2px 0 rgba(0, 0, 0, 0.5)",
      md: "0 4px 6px -1px rgba(0, 0, 0, 0.6)",
      lg: "0 10px 15px -3px rgba(0, 0, 0, 0.7)",
    },
    transition: {
      default: "all 0.2s ease-in-out",
    },
  },
};
