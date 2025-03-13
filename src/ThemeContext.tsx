// ThemeContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { Theme, themes } from "./theme"; // Adjust the path to your theme.ts

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  themeKey: "dark" | "light"; // Expose themeKey for UI feedback
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [themeKey, setThemeKey] = useState<"dark" | "light">(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme && (savedTheme === "dark" || savedTheme === "light")) {
      return savedTheme;
    }
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });

  useEffect(() => {
    // Persist theme choice to localStorage
    localStorage.setItem("theme", themeKey);
    // Update document class for Tailwind dark mode (optional)
    if (themeKey === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [themeKey]);

  const toggleTheme = () => {
    setThemeKey((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider
      value={{ theme: themes[themeKey], toggleTheme, themeKey }}
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
