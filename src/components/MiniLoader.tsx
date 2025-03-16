// MiniLoader.tsx
import React from "react";
import { useTheme } from "../ThemeContext";

const MiniLoader = () => {
  const { theme } = useTheme();

  return (
    <div className="relative w-4 h-4 flex items-center justify-center">
      <div
        className="absolute w-4 h-4 rounded-full animate-[spin_1s_linear_infinite]"
        style={{
          border: `2px solid ${theme.colors.text}20`,
          borderTop: `2px solid ${theme.colors.accent}`,
        }}
      ></div>
    </div>
  );
};

export default MiniLoader;
