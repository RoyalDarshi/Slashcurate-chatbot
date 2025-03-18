// Tooltip.tsx
import React from "react";
import { useTheme } from "../ThemeContext";

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const { theme } = useTheme();

  return (
    <div className="relative inline-block">
      {children}
      <span
        className="absolute z-10 hidden group-hover:block px-2 py-1 text-xs font-medium rounded-md shadow-md transition-all duration-200 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
        style={{
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
          border: `1px solid ${theme.colors.accent}`,
          borderRadius: theme.borderRadius.default,
          boxShadow: theme.shadow.sm,
        }}
      >
        {text}
      </span>
    </div>
  );
};

export default Tooltip;
