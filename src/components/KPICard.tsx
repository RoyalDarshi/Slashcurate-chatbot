import React from "react";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useTheme } from "../ThemeContext";

interface KPICardProps {
  title: string;
  value: string | number | null;
  change?: string | number;
  icon?: React.ReactNode;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, icon }) => {
  const { theme } = useTheme();

  const formattedValue =
    value === null || value === undefined
      ? "—"
      : typeof value === "number"
      ? value.toLocaleString()
      : value;

  const changeNum = typeof change === "number" ? change : parseFloat(change || "0");
  const isPositiveChange = changeNum >= 0;
  const hasChange = change !== undefined && change !== null && change !== "" && !isNaN(changeNum);

  const displayChange = hasChange
    ? `${isPositiveChange ? "+" : ""}${changeNum.toFixed(1)}%`
    : "";

  return (
    <div
      className="p-6 rounded-3xl transition-all duration-300 h-full flex flex-col justify-between"
      style={{
        backgroundColor: theme.mode === 'light' ? '#F8FAFC' : 'rgba(255, 255, 255, 0.02)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-xs font-semibold uppercase tracking-wider truncate"
          style={{ color: theme.colors.textSecondary }}
        >
          {title}
        </h3>
        {icon ? (
          <div
            className="flex items-center justify-center p-1.5 rounded-lg"
            style={{
              color: theme.colors.accent,
              backgroundColor: `${theme.colors.accent}15`,
            }}
          >
            {icon}
          </div>
        ) : (
          <div
            className="flex items-center justify-center p-1.5 rounded-lg"
            style={{
              color: theme.colors.accent,
              backgroundColor: `${theme.colors.accent}15`,
            }}
          >
            <Activity size={16} />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-1 gap-2 flex-wrap">
        <p
          className="text-2xl font-bold tracking-tight"
          style={{ color: theme.colors.text }}
        >
          {formattedValue}
        </p>

        {hasChange && (
          <div className="flex items-center gap-1">
            {isPositiveChange ? (
              <TrendingUp size={14} style={{ color: theme.colors.success }} />
            ) : (
              <TrendingDown size={14} style={{ color: theme.colors.error }} />
            )}
            <span
              className="text-xs font-semibold"
              style={{
                color: isPositiveChange ? theme.colors.success : theme.colors.error,
              }}
            >
              {displayChange}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;
