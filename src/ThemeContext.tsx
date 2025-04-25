import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { themes } from "./theme"; // Import from your themes file
import { Theme } from "./types"; // Import the Theme type

// Define font size mapping
const fontSizeMap = {
  small: "0.875rem",
  medium: "1rem",
  large: "1.125rem",
} as const;

// Type for font size keys to ensure type safety
type FontSize = keyof typeof fontSizeMap;

// Updated context interface
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (themeName: "light" | "dark") => void;
  chatFontSize: FontSize;
  setChatFontSize: (size: FontSize) => void;
  chatFontSizeValue: string;
}

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: themes.light,
  toggleTheme: () => {},
  setTheme: () => {},
  chatFontSize: "medium",
  setChatFontSize: () => {},
  chatFontSizeValue: fontSizeMap.medium,
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Theme state
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(() => {
    try {
      return localStorage.getItem("theme") === "dark" ? "dark" : "light";
    } catch (e) {
      console.warn(
        "Failed to access local storage for theme, defaulting to light",
        e
      );
      return "light";
    }
  });

  // Chat font size state
  const [chatFontSize, setChatFontSize] = useState<FontSize>(() => {
    try {
      const storedSize = localStorage.getItem("chatFontSize");
      return storedSize && storedSize in fontSizeMap
        ? (storedSize as FontSize)
        : "medium";
    } catch (e) {
      console.warn(
        "Failed to access local storage for font size, defaulting to medium",
        e
      );
      return "medium";
    }
  });

  // Apply theme class to body
  useEffect(() => {
    document.body.className = currentTheme;
  }, [currentTheme]);

  // Persist chat font size to local storage
  useEffect(() => {
    try {
      localStorage.setItem("chatFontSize", chatFontSize);
    } catch (e) {
      console.warn("Failed to save chat font size to local storage", e);
    }
  }, [chatFontSize]);

  // Theme functions
  const toggleTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setCurrentTheme(newTheme);
    try {
      localStorage.setItem("theme", newTheme);
    } catch (e) {
      console.warn("Failed to save theme to local storage", e);
    }
  };

  const setTheme = (themeName: "light" | "dark") => {
    setCurrentTheme(themeName);
    try {
      localStorage.setItem("theme", themeName);
    } catch (e) {
      console.warn("Failed to save theme to local storage", e);
    }
  };

  // Compute values
  const theme = themes[currentTheme];
  const chatFontSizeValue = fontSizeMap[chatFontSize];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        chatFontSize,
        setChatFontSize,
        chatFontSizeValue,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
