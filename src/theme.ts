import { Theme } from "./types";

export const themes: Record<"light" | "dark", Theme> = {
  light: {
    mode: "light",
    colors: {
      background: "#F9FAFB", // Soft gray-white for clean backdrop
      surface: "#FFFFFF", // Pure white for cards and elements
      text: "#111827", // Deep gray for high readability
      textSecondary: "#4B5563", // Muted gray for secondary info
      accent: "#6366F1", // Indigo blue for modern, trustworthy accents
      accentHover: "#4F46E5", // Darker indigo for hover states
      success: "#22C55E", // Vibrant green for positive feedback
      error: "#EF4444", // Bold red for errors
      warning: "#F59E0B", // Amber for warnings
      border: "#E5E7EB", // Light gray borders
      bubbleUser: "#E0F2FE", // Light blue for user bubbles (calm and distinct)
      bubbleBot: "#F3F4F6", // Soft gray for bot bubbles
      bubbleUserText: "#111827",
      bubbleBotText: "#111827",
      hover: "#F3F4F6", // Subtle hover gray
      disabled: "#E5E7EB",
      disabledText: "#9CA3AF",
      barColors: [
        "#6366F1", // Indigo
        "#06B6D4", // Cyan
        "#10B981", // Green
        "#F59E0B", // Amber
        "#EF4444", // Red
        "#8B5CF6", // Violet
        "#EC4899", // Pink
        "#14B8A6", // Teal
      ],
      surfaceGlass: "rgba(255, 255, 255, 0.6)", // Slightly more opaque for better visibility
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
        xs: "0.75rem", // Increased xs for better readability
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
      default: "0.375rem", // Slightly softer default radius
      large: "0.75rem",
      pill: "9999px",
    },
    shadow: {
      none: "none",
      xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
      md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
      lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
      xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    },
    transition: {
      default: "all 0.2s ease-in-out",
    },
    gradients: {
      primary: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", // Indigo gradient
      surface: "linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)",
      glass:
        "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%)", // Enhanced glass effect
    },
  },

  dark: {
    mode: "dark",
    colors: {
      background: "#0F172A", // Deeper slate for immersive dark mode
      surface: "#1E293B", // Dark slate for surfaces
      text: "#F3F4F6", // Light gray for text
      textSecondary: "#9CA3AF", // Muted gray for secondary
      accent: "#6366F1", // Same indigo for consistency across modes
      accentHover: "#4F46E5", // Darker indigo hover
      success: "#22C55E",
      error: "#EF4444",
      warning: "#F59E0B",
      border: "#334155", // Subtle dark borders
      bubbleUser: "#1E40AF", // Deep blue for user bubbles (distinct and vibrant)
      bubbleBot: "#334155", // Dark gray for bot bubbles
      bubbleUserText: "#F3F4F6",
      bubbleBotText: "#F3F4F6",
      hover: "#334155",
      disabled: "#475569",
      disabledText: "#6B7280",
      barColors: [
        "#818CF8", // Lighter indigo for better dark visibility
        "#22D3EE", // Brighter cyan
        "#34D399", // Brighter green
        "#FBBF24", // Brighter amber
        "#F87171", // Brighter red
        "#A78BFA", // Brighter violet
        "#F472B6", // Brighter pink
        "#2DD4BF", // Brighter teal
      ],
      surfaceGlass: "rgba(30, 41, 59, 0.6)", // Adjusted for dark
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
        xs: "0.75rem", // Consistent with light
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
      large: "0.75rem",
      pill: "9999px",
    },
    shadow: {
      none: "none",
      xs: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
      sm: "0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)",
      md: "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)",
      lg: "0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 4px 6px -4px rgba(0, 0, 0, 0.6)",
      xl: "0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.7)",
    },
    transition: {
      default: "all 0.2s ease-in-out", // Matched to light for consistency
    },
    gradients: {
      primary: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
      surface: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
      glass:
        "linear-gradient(135deg, rgba(30,41,59,0.8) 0%, rgba(30,41,59,0.4) 100%)",
    },
  },
};
