import React from "react";
import { useTheme } from "../ThemeContext";

interface SkeletonLoaderProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: "text" | "rectangular" | "circular";
  animation?: "pulse" | "wave";
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = "100%",
  height = "1rem",
  className = "",
  variant = "text",
  animation = "pulse",
}) => {
  const { theme } = useTheme();

  const baseClasses = `
    ${animation === "pulse" ? "animate-pulse" : "animate-shimmer"}
    ${variant === "circular" ? "rounded-full" : variant === "text" ? "rounded" : "rounded-md"}
    ${className}
  `;

  const shimmerStyle = animation === "wave" ? {
    backgroundImage: `linear-gradient(
      90deg,
      ${theme.colors.border}20 0%,
      ${theme.colors.border}40 50%,
      ${theme.colors.border}20 100%
    )`,
    backgroundSize: "200% 100%",
    animation: "shimmer 2s infinite",
  } : {};

  return (
    <div
      className={baseClasses}
      style={{
        width,
        height,
        backgroundColor: `${theme.colors.border}20`,
        ...shimmerStyle,
      }}
    />
  );
};

export default SkeletonLoader;