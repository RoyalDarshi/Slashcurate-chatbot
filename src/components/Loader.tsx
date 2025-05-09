import React from "react";
import { useTheme } from "../ThemeContext";

const Loader = ({ text }: { text: string }) => {
  const { theme } = useTheme();

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-opacity-60 backdrop-blur-md z-50"
      style={{
        backgroundColor: `${theme.colors.text}40`,
      }}
    >
      <div className="relative w-20 h-20 flex items-center justify-center">
        {/* Outer Ring */}
        <div
          className="absolute w-16 h-16 rounded-full animate-[spin_1.2s_linear_infinite]"
          style={{
            border: `3px solid ${theme.colors.textSecondary}30`,
            borderTop: `3px solid ${theme.colors.accent}`,
          }}
        ></div>
        {/* Inner Ring */}
        <div
          className="absolute w-10 h-10 rounded-full animate-[spin_0.8s_linear_infinite_reverse]"
          style={{
            border: `2px solid ${theme.colors.accent}80`,
            borderBottom: `2px solid ${theme.colors.textSecondary}30`,
          }}
        ></div>
        {/* Center Pulse */}
        <div
          className="w-4 h-4 rounded-full animate-[pulse_1.5s_ease-in-out_infinite]"
          style={{
            backgroundColor: theme.colors.accent,
            boxShadow: `0 0 10px ${theme.colors.accent}80`,
          }}
        ></div>
      </div>
      {text && (
        <p
          className="mt-6 text-base font-medium tracking-wide animate-pulse"
          style={{ color: theme.colors.text }}
        >
          {text}
        </p>
      )}
    </div>
  );
};

export default Loader;