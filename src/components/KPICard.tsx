import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change: string;
  icon: React.ReactNode; // Re-introduced icon prop
  theme: any; // Replace with your actual theme type
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  icon, // Re-introduced icon from destructuring
  theme,
}) => {
  const formattedValue =
    typeof value === "number" ? value.toLocaleString() : value;

  const isPositiveChange = parseFloat(change) >= 0;

  return (
    <div
      // Increased padding (p-4), added a slightly more pronounced shadow, and subtle transition
      className={`p-2 rounded-xl shadow-lg transition-all duration-300 h-full
        ${theme.mode === "dark" ? "bg-slate-800" : "bg-white"}
      `}
    >
      {/* Container for icon and title */}
      <div >
        {/* Icon with appropriate sizing and margin */}
        {/* <div className="mr-3 text-indigo-500">{icon}</div> */}
        <h3
          className={`text-sm text-center font-medium uppercase tracking-wider
            ${theme.mode === "dark" ? "text-slate-400" : "text-slate-500"}
          `}
        >
          {title}
        </h3>
      </div>

      {/* Value display - made larger and bolder */}
      <p
        className={`text-3xl font-extrabold text-center
          ${theme.mode === "dark" ? "text-slate-100" : "text-slate-800"}
        `}
      >
        {formattedValue}
      </p>

      {/* Change display - re-introduced and styled */}
      {/* <div className="flex items-center">
        {isPositiveChange ? (
          <TrendingUp size={20} className="text-green-500 mr-1" />
        ) : (
          <TrendingDown size={20} className="text-red-500 mr-1" />
        )}
        <span
          className={`text-sm font-semibold
            ${isPositiveChange ? "text-green-500" : "text-red-500"}
          `}
        >
          {change}
        </span>
      </div> */}
    </div>
  );
};

export default KPICard;
