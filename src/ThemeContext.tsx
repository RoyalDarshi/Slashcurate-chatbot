import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { themes } from "./theme"; // Import from your themes file
import { Theme } from "./types"; // Import the Theme type

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (themeName: "light" | "dark") => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: themes.light, // Default to light theme
  toggleTheme: () => {}, // No-op function as default
  setTheme: () => {}, // No-op function as default
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(
    localStorage.getItem("theme") === "dark" ? "dark" : "light"
  );

  useEffect(() => {
    // Apply theme class to the body element
    document.body.className = currentTheme;
  }, [currentTheme]);

  const toggleTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setCurrentTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const setTheme = (themeName: "light" | "dark") => {
    setCurrentTheme(themeName);
    localStorage.setItem("theme", themeName);
  };

  const theme = themes[currentTheme];

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  return useContext(ThemeContext);
};
