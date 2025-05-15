import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { themes } from "./theme"; // Import from your themes file
import { Theme } from "./types"; // Import the Theme type


// Updated context interface
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (themeName: "light" | "dark") => void;
}

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: themes.light,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Theme state
  // Updated theme state initialization
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(() => {
    try {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme === "dark" || storedTheme === "light") {
        return storedTheme;
      }
      // If no stored theme, check system preference
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      return systemDark ? "dark" : "light";
    } catch (e) {
      console.warn(
        "Failed to access storage or match media, defaulting to system preference",
        e
      );
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      return systemDark ? "dark" : "light";
    }
  });

  // Apply theme class to body
  useEffect(() => {
    document.body.className = currentTheme;
  }, [currentTheme]);

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

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
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
