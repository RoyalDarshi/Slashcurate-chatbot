export interface Theme {
  colors: {
    background: string;
    text: string;
    accent: string;
    success?: string;
    error?: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
  };
  borderRadius: {
    default?: string;
  };
}

export const themes: Record<"light" | "dark", Theme> = {
  light: {
    colors: {
      background: "#f9f9f9", // Very light grey
      text: "#333333", // Dark grey
      accent: "#8B5CF6", // Purple/Violet Tones
      success: "#22C55E", // Green
      error: "#EF4444", // Red
    },
    spacing: {
      xs: "0.25rem", // 4px
      sm: "0.5rem", // 8px
      md: "1rem", // 16px
      lg: "1.5rem", // 24px
    },
    borderRadius: {
      default: "0.25rem", // 4px
    },
  },
  dark: {
    colors: {
      background: "#121212", // Dark grey
      text: "#f0f0f0", // Light grey
      accent: "#A78BFA", // Purple/Violet Tones
      success: "#22C55E", // Green
      error: "#EF4444", // Red
    },
    spacing: {
      xs: "0.25rem", // 4px
      sm: "0.5rem", // 8px
      md: "1rem", // 16px
      lg: "1.5rem", // 24px
    },
    borderRadius: {
      default: "0.25rem", // 4px
    },
  },
};
