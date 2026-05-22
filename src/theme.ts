import { Theme } from "./types";

export const themes: Record<"light" | "dark", Theme> = {
  light: {
    mode: "light",
    colors: {
      // CHANGED: Shifted from #F9FAFB (98% brightness) to #F0F2F5 (96% brightness + slight blue-gray)
      // This absorbs more light and reduces the "glare" on monitors.
      background: "#F8FAFC", // Slate 50 - clean neutral surface (Level 0)
      surface: "#FFFFFF", // Level 1 main content
      text: "#0F172A", // Slate 900
      textSecondary: "#475569", // Slate 600
      accent: "#4F46E5", // Deeper Indigo
      accentHover: "#4338CA", // Darker Indigo
      success: "#10B981", // Emerald 500
      error: "#EF4444",
      warning: "#F59E0B",

      // CHANGED: Slightly darker border to define edges without needing brightness
      border: "rgba(15, 23, 42, 0.06)",

      bubbleUser: "#EEF2FF", // Indigo 50
      bubbleBot: "#FFFFFF",
      bubbleUserText: "#0F172A",
      bubbleBotText: "#0F172A",

      // CHANGED: Darker hover to be visible against the new background
      hover: "rgba(15, 23, 42, 0.04)",

      disabled: "#E5E7EB",
      disabledText: "#9CA3AF",
      barColors: [
        "#4F46E5", // Indigo 600
        "#0EA5E9", // Sky 500
        "#10B981", // Emerald 500
        "#F59E0B", // Amber 500
        "#EF4444", // Red 500
        "#8B5CF6", // Violet 500
        "#EC4899", // Pink 500
        "#14B8A6", // Teal 500
      ],
      // CHANGED: Reduced opacity slightly to prevent "foggy" look on darker bg
      surfaceGlass: "rgba(255, 255, 255, 0.7)",
    },
    // ... spacing, typography, etc. remain the same
    spacing: {
      xxs: "0.125rem", // 2px
      xs: "0.25rem", // 4px
      sm: "0.5rem", // 8px
      md: "1rem", // 16px
      lg: "1.5rem", // 24px
      xl: "2rem", // 32px
      "2xl": "3rem", // 48px
      "3xl": "4rem", // 64px
    },
    typography: {
      fontFamily:
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      size: {
        xs: "0.8125rem", // 13px (dense tables/metadata)
        sm: "0.875rem", // 14px (secondary text/labels)
        base: "0.9375rem", // 15px (Main reading text for spaciousness)
        lg: "1.25rem", // 20px (H2)
        xl: "1.5rem", // 24px (H1)
      },
      weight: {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
    },
    borderRadius: {
      none: "0",
      default: "0.5rem", // Increased from 0.375 to 0.5 for a softer feel
      large: "1rem",
      pill: "9999px",
    },
    shadow: {
      none: "none",
      // CHANGED: Slightly stronger shadows to lift the white cards off the gray background
      xs: "0 1px 2px 0 rgba(15, 23, 42, 0.03)",
      sm: "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)",
      md: "0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.03)", // Softer app level shadow
      lg: "0 10px 15px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.03)",
      xl: "0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)",
    },
    transition: {
      default: "all 0.15s ease-out", // Snappier micro-interactions
      layout: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)", // Fluid layout shifts
    },
    gradients: {
      primary: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
      // CHANGED: Matched gradient to new background
      surface: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
      glass:
        "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%)",
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
      xxs: "0.125rem",
      xs: "0.25rem",
      sm: "0.5rem",
      md: "1rem",
      lg: "1.5rem",
      xl: "2rem",
      "2xl": "3rem",
      "3xl": "4rem",
    },
    typography: {
      fontFamily:
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      size: {
        xs: "0.8125rem",
        sm: "0.875rem",
        base: "0.9375rem",
        lg: "1.25rem",
        xl: "1.5rem",
      },
      weight: {
        normal: "400",
        medium: "500",
        semibold: "600",
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
      sm: "0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)",
      md: "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)",
      lg: "0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 4px 6px -4px rgba(0, 0, 0, 0.6)",
      xl: "0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.7)",
    },
    transition: {
      default: "all 0.15s ease-out",
      layout: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    },
    gradients: {
      primary: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
      surface: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
      glass:
        "linear-gradient(135deg, rgba(30,41,59,0.8) 0%, rgba(30,41,59,0.4) 100%)",
    },
  },
};
