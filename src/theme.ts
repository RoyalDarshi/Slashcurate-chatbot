import { Theme } from "./types";

export const themes: Record<"light" | "dark", Theme> = {
  light: {
    mode: "light",
    colors: {
      // CHANGED: Shifted from #F9FAFB (98% brightness) to #F0F2F5 (96% brightness + slight blue-gray)
      // This absorbs more light and reduces the "glare" on monitors.
      background: "#F0F2F5",

      surface: "#FFFFFF", // Keep pure white, it now pops better against the darker background
      text: "#111827",
      textSecondary: "#4B5563",
      accent: "#6366F1",
      accentHover: "#4F46E5",
      success: "#22C55E",
      error: "#EF4444",
      warning: "#F59E0B",

      // CHANGED: Slightly darker border to define edges without needing brightness
      border: "#E2E8F0",

      bubbleUser: "#E0F2FE",

      // CHANGED: Since background is now gray, Bot Bubble becomes White to stand out clean.
      // Old gray on gray looks muddy; white on gray looks crisp.
      bubbleBot: "#FFFFFF",

      bubbleUserText: "#111827",
      bubbleBotText: "#111827",

      // CHANGED: Darker hover to be visible against the new background
      hover: "#E5E7EB",

      disabled: "#E5E7EB",
      disabledText: "#9CA3AF",
      barColors: [
        "#6366F1",
        "#06B6D4",
        "#10B981",
        "#F59E0B",
        "#EF4444",
        "#8B5CF6",
        "#EC4899",
        "#14B8A6",
      ],
      // CHANGED: Reduced opacity slightly to prevent "foggy" look on darker bg
      surfaceGlass: "rgba(255, 255, 255, 0.7)",
    },
    // ... spacing, typography, etc. remain the same
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
        xs: "0.75rem",
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
      // CHANGED: Slightly stronger shadows to lift the white cards off the gray background
      xs: "0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)",
      md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)",
      lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)",
      xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
    },
    transition: {
      default: "all 0.2s ease-in-out",
    },
    gradients: {
      primary: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
      // CHANGED: Matched gradient to new background
      surface: "linear-gradient(135deg, #FFFFFF 0%, #F0F2F5 100%)",
      glass:
        "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.5) 100%)",
    },
  },

  // Dark mode kept exactly as you had it
  dark: {
    mode: "dark",
    colors: {
      background: "#0F172A",
      surface: "#1E293B",
      text: "#F3F4F6",
      textSecondary: "#9CA3AF",
      accent: "#6366F1",
      accentHover: "#4F46E5",
      success: "#22C55E",
      error: "#EF4444",
      warning: "#F59E0B",
      border: "#334155",
      bubbleUser: "#1E40AF",
      bubbleBot: "#334155",
      bubbleUserText: "#F3F4F6",
      bubbleBotText: "#F3F4F6",
      hover: "#334155",
      disabled: "#475569",
      disabledText: "#6B7280",
      barColors: [
        "#818CF8",
        "#22D3EE",
        "#34D399",
        "#FBBF24",
        "#F87171",
        "#A78BFA",
        "#F472B6",
        "#2DD4BF",
      ],
      surfaceGlass: "rgba(30, 41, 59, 0.6)",
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
        xs: "0.75rem",
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
      default: "all 0.2s ease-in-out",
    },
    gradients: {
      primary: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
      surface: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
      glass:
        "linear-gradient(135deg, rgba(30,41,59,0.8) 0%, rgba(30,41,59,0.4) 100%)",
    },
  },
};