import { Theme } from "./types";

export const themes: Record<"light" | "dark", Theme> = {
  light: {
    mode: "light",
    colors: {
      // Soft matte slate canvas background that absorbs screen reflection glare
      background: "#FAFAFA",
      // Highly contrasted elevated workspace surface containers
      surface: "#FFFFFF",
      // Deep obsidian charcoal text ink for perfect effortless legibility
      text: "#111827",
      // Refined dark slate secondary labels for fast hierarchy scanning
      textSecondary: "#4B5563",
      accent: "#4F46E5",
      accentHover: "#4338CA",
      success: "#10B981",
      error: "#EF4444",
      warning: "#F59E0B",

      // Crisp microscopic borders defining panel dimensions cleanly
      border: "rgba(0, 0, 0, 0.06)",

      bubbleUser: "#F3F4F6",
      bubbleBot: "#FFFFFF",
      bubbleUserText: "#111827",
      bubbleBotText: "#111827",

      hover: "rgba(0, 0, 0, 0.03)",
      disabled: "#E5E7EB",
      disabledText: "#9CA3AF",
      barColors: [
        "#4F46E5",
        "#0EA5E9",
        "#10B981",
        "#F59E0B",
        "#EF4444",
        "#8B5CF6",
        "#EC4899",
        "#14B8A6",
      ],
      // Translucent, anti-glare glass wrapper properties
      surfaceGlass: "rgba(255, 255, 255, 0.75)",
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
      default: "0.75rem", // Softened for cohesive floating card visual footprints
      large: "1.25rem", // Premium island corners
      pill: "9999px",
    },
    shadow: {
      none: "none",
      // Wide ambient drop spreads that separate floating cards cleanly from the slate base
      xs: "0 1px 2px 0 rgba(15, 23, 42, 0.01)",
      sm: "0 2px 8px 0 rgba(15, 23, 42, 0.02)",
      md: "0 12px 24px -4px rgba(15, 23, 42, 0.03), 0 4px 12px -2px rgba(15, 23, 42, 0.01)",
      lg: "0 20px 32px -6px rgba(15, 23, 42, 0.04), 0 8px 16px -4px rgba(15, 23, 42, 0.01)",
      xl: "0 32px 50px -12px rgba(15, 23, 42, 0.06)",
    },
    transition: {
      default: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      layout: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
    },
    gradients: {
      primary: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
      surface: "linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%)",
      glass:
        "linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.4) 100%)",
    },
  },

  dark: {
    mode: "dark",
    colors: {
      background: "#090D16",
      surface: "#131C2E",
      text: "#F8FAFC",
      textSecondary: "#94A3B8",
      accent: "#6366F1",
      accentHover: "#4F46E5",
      success: "#22C55E",
      error: "#EF4444",
      warning: "#F59E0B",
      border: "rgba(255, 255, 255, 0.03)",
      bubbleUser: "#1E3A8A",
      bubbleBot: "rgba(30, 41, 59, 0.4)",
      bubbleUserText: "#F8FAFC",
      bubbleBotText: "#F8FAFC",
      hover: "rgba(255, 255, 255, 0.03)",
      disabled: "#1E293B",
      disabledText: "#475569",
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
      surfaceGlass: "rgba(19, 28, 46, 0.45)",
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
      weight: { normal: "400", medium: "500", semibold: "600", bold: "700" },
    },
    borderRadius: {
      none: "0",
      default: "0.75rem",
      large: "1.25rem",
      pill: "9999px",
    },
    shadow: {
      none: "none",
      xs: "0 1px 2px 0 rgba(0, 0, 0, 0.2)",
      sm: "0 4px 12px 0 rgba(0, 0, 0, 0.15)",
      md: "0 12px 24px -4px rgba(0, 0, 0, 0.25)",
      lg: "0 24px 38px -6px rgba(0, 0, 0, 0.3)",
      xl: "0 40px 64px -12px rgba(0, 0, 0, 0.4)",
    },
    transition: {
      default: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      layout: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
    },
    gradients: {
      primary: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
      surface: "linear-gradient(135deg, #131C2E 0%, #090D16 100%)",
      glass:
        "linear-gradient(135deg, rgba(19,28,46,0.7) 0%, rgba(9,13,22,0.3) 100%)",
    },
  },
};
