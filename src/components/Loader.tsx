import React from "react";
import { useTheme } from "../ThemeContext";
import { Database } from "lucide-react";
import "./Loader.css";

const Loader = ({ text }: { text: string }) => {
  const { theme } = useTheme();

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999] backdrop-blur-xl animate-fade-in"
      style={{
        backgroundColor: theme.mode === 'dark' ? 'rgba(9, 13, 22, 0.65)' : 'rgba(250, 250, 250, 0.65)',
      }}
    >
      <div 
        className="p-8 rounded-3xl border shadow-floating flex flex-col items-center max-w-sm w-full mx-4 animate-fade-up"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          boxShadow: theme.mode === 'dark' 
            ? '0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)' 
            : '0 20px 40px -15px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        }}
      >
        {/* Animated Visual Loader */}
        <div className="relative w-16 h-16 mb-5 flex items-center justify-center">
          {/* Glowing background ring */}
          <div 
            className="absolute inset-0 rounded-full animate-ping opacity-15"
            style={{ backgroundColor: theme.colors.accent }}
          />
          {/* Rotating gradient ring */}
          <div 
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              border: '3px solid transparent',
              borderTopColor: theme.colors.accent,
              borderRightColor: theme.colors.accent,
              borderRadius: '50%',
            }}
          />
          {/* Inner brand circle with database icon */}
          <div 
            className="absolute inset-2 rounded-full flex items-center justify-center"
            style={{ 
              backgroundColor: `${theme.colors.accent}08`,
            }}
          >
            <Database 
              className="h-6 w-6 animate-pulse" 
              style={{ color: theme.colors.accent }}
            />
          </div>
        </div>

        {/* Text Details */}
        <h3 
          className="text-sm font-extrabold tracking-tight text-center mb-1.5"
          style={{ color: theme.colors.text }}
        >
          {text || "Processing Request"}
        </h3>
        
        <p 
          className="text-[10px] font-semibold text-center opacity-85 animate-pulse tracking-wide"
          style={{ color: theme.colors.textSecondary }}
        >
          Running diagnostic queries...
        </p>

        {/* Progress Bar with Shimmer */}
        <div className="w-full bg-black/5 dark:bg-white/5 h-1 rounded-full mt-5 overflow-hidden relative">
          <div 
            className="animate-shimmer"
            style={{
              background: `linear-gradient(90deg, transparent, ${theme.colors.accent}, transparent)`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Loader;