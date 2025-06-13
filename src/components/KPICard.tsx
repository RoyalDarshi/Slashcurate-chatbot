import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTheme } from "../ThemeContext"; // Import useTheme hook

interface KPICardProps {
  title: string;
  value: string | number;
  change: string;
  icon: React.ReactNode;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, icon }) => {
  const { theme } = useTheme(); // Use the useTheme hook to access the theme

  const formattedValue =
    typeof value === "number" ? value.toLocaleString() : value;

  const isPositiveChange = parseFloat(change) >= 0;

  return (
    <div
      // Increased padding (p-4), added a slightly more pronounced shadow, and subtle transition
      className={`p-4 rounded-xl shadow-lg transition-all duration-300 h-full`}
      style={{ backgroundColor: theme.colors.surface }}
    >
      {/* Container for icon and title */}
      <div className="flex items-center justify-center mb-2">
        {" "}
        {/* Centered content */}
        {/* Icon with appropriate sizing and margin */}
        {/* {icon && (
          <div
            className={`mr-${theme.spacing.sm}`}
            style={{ color: theme.colors.accent }}
          >
            {icon}
          </div>
        )}{" "} */}
        {/* Render icon if provided */}
        <h3
          className={`text-${theme.typography.size.sm} text-center font-${theme.typography.weight.medium} uppercase tracking-wider`}
          style={{ color: theme.colors.textSecondary }}
        >
          {title}
        </h3>
      </div>

      {/* Value display - made larger and bolder */}
      <p
        className={`text-3xl font-${theme.typography.weight.bold} text-center`}
        style={{ color: theme.colors.text }}
      >
        {formattedValue}
      </p>

      {/* Change display - re-introduced and styled */}
      {/* <div
        className={`flex items-center justify-center mt-${theme.spacing.xs}`}
      >
        {isPositiveChange ? (
          <TrendingUp
            size={20}
            style={{ color: theme.colors.success }}
            className={`mr-${theme.spacing.xs}`}
          />
        ) : (
          <TrendingDown
            size={20}
            style={{ color: theme.colors.error }}
            className={`mr-${theme.spacing.xs}`}
          />
        )}
        <span
          className={`text-${theme.typography.size.sm} font-${theme.typography.weight.semibold}`}
          style={{
            color: isPositiveChange ? theme.colors.success : theme.colors.error,
          }}
        >
          {change}
        </span>
      </div> */}
    </div>
  );
};

export default KPICard;
