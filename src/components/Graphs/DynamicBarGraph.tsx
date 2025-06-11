import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3, TrendingUp, Settings, Zap } from "lucide-react";

// Ultra-modern design system with glassmorphism and advanced gradients
const modernTheme = {
  colors: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    surface: "rgba(255, 255, 255, 0.95)",
    surfaceGlass: "rgba(255, 255, 255, 0.1)",
    surfaceHover: "rgba(255, 255, 255, 0.15)",
    text: "#1a202c",
    textSecondary: "#4a5568",
    textMuted: "#718096",
    border: "rgba(255, 255, 255, 0.2)",
    borderSoft: "rgba(226, 232, 240, 0.3)",
    primary: "#6366f1",
    primaryLight: "#818cf8",
    accent: "#f59e0b",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
  },
  gradients: {
    primary: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    secondary: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
    accent: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
    surface:
      "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)",
    glass:
      "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
  },
  borderRadius: {
    xl: "20px",
    lg: "16px",
    md: "12px",
    sm: "8px",
    xs: "6px",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    xxl: "48px",
  },
  typography: {
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  shadows: {
    soft: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    medium:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    large:
      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    glow: "0 0 20px rgba(99, 102, 241, 0.3)",
    glowHover: "0 0 30px rgba(99, 102, 241, 0.4)",
  },
  animations: {
    spring: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },
};

// Modern vibrant color palette with gradients
const modernColors = [
  {
    solid: "#6366f1",
    gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  },
  {
    solid: "#06b6d4",
    gradient: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
  },
  {
    solid: "#10b981",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  },
  {
    solid: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
  },
  {
    solid: "#ef4444",
    gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
  },
  {
    solid: "#8b5cf6",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
  },
  {
    solid: "#ec4899",
    gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
  },
  {
    solid: "#14b8a6",
    gradient: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
  },
];

interface ModernBarGraphProps {
  data: any[];
  isValidGraph: (validData: boolean) => void;
}

// Ultra-modern Custom Bar Shape with advanced gradients and animations
const ModernBarShape = (props: any) => {
  const { x, y, width, height, fill, dataKey, payload, yKeys, index } = props;
  const radius = Math.min(8, width / 3);
  const value = Number(payload[dataKey]);

  const topMostKey = [...yKeys]
    .reverse()
    .find((key) => Number(payload[key]) > 0);

  const isTopBar = dataKey === topMostKey;
  const colorIndex = yKeys.indexOf(dataKey) % modernColors.length;
  const colorConfig = modernColors[colorIndex];

  if (value <= 0) return null;

  const gradientId = `gradient-${dataKey}-${index}`;

  if (isTopBar) {
    const pathData = `M ${x}, ${y + radius}
                      A ${radius}, ${radius}, 0, 0, 1, ${x + radius}, ${y}
                      L ${x + width - radius}, ${y}
                      A ${radius}, ${radius}, 0, 0, 1, ${x + width}, ${
      y + radius
    }
                      L ${x + width}, ${y + height}
                      L ${x}, ${y + height}
                      Z`;

    return (
      <g>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colorConfig.solid} stopOpacity="1" />
            <stop
              offset="100%"
              stopColor={colorConfig.solid}
              stopOpacity="0.7"
            />
          </linearGradient>
          <filter id={`glow-${gradientId}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d={pathData}
          fill={`url(#${gradientId})`}
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="1"
          filter={`url(#glow-${gradientId})`}
          style={{
            transition: "all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
            transformOrigin: "center bottom",
          }}
        />
      </g>
    );
  } else {
    return (
      <g>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colorConfig.solid} stopOpacity="1" />
            <stop
              offset="100%"
              stopColor={colorConfig.solid}
              stopOpacity="0.7"
            />
          </linearGradient>
        </defs>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={`url(#${gradientId})`}
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="1"
          style={{
            transition: "all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
            transformOrigin: "center bottom",
          }}
        />
      </g>
    );
  }
};

const ModernBarGraph: React.FC<ModernBarGraphProps> = React.memo(
  ({ data, isValidGraph }) => {
    const [groupBy, setGroupBy] = useState<string | null>(null);
    const [aggregate, setAggregate] = useState<"sum" | "count">("sum");
    const [valueKey, setValueKey] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const [graphData, setGraphData] = useState<any[]>([]);
    const [xKey, setXKey] = useState<string | null>(null);
    const [yKeys, setYKeys] = useState<string[]>([]);
    const [isValidGraphData, setIsValidGraphData] = useState<boolean>(true);
    const containerRef = useRef<HTMLDivElement>(null);

    const formatKey = useCallback((key: any): string => {
      if (key === null || key === undefined) return "";
      const stringKey = String(key);
      return stringKey
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
    }, []);

    const dataKeys = data.length > 0 ? Object.keys(data[0]) : [];

    const numericKeys = dataKeys.filter((key) => {
      if (data.length === 0) return false;
      return data.some((item) => {
        const val = item[key];
        return (
          typeof val === "number" ||
          (typeof val === "string" && !isNaN(parseFloat(val)))
        );
      });
    });

    const isKeyExcluded = (key: string) => {
      const lowerKey = key.toLowerCase();
      return (
        /(id|code|number)$/.test(lowerKey) ||
        lowerKey.includes("date") ||
        lowerKey.includes("email") ||
        lowerKey.includes("address") ||
        lowerKey === "first_name" ||
        lowerKey === "last_name"
      );
    };

    const validValueKeys = numericKeys.filter((key) => !isKeyExcluded(key));

    useEffect(() => {
      if (dataKeys.length > 0) {
        if (!groupBy || !dataKeys.includes(groupBy)) {
          setGroupBy(dataKeys[0]);
        }
        if (
          numericKeys.length > 0 &&
          (!valueKey || !numericKeys.includes(valueKey))
        ) {
          setValueKey(numericKeys[0]);
        } else if (numericKeys.length === 0) {
          setValueKey(null);
        }
      } else {
        setGroupBy(null);
        setValueKey(null);
      }
    }, [data, dataKeys, numericKeys]);

    useEffect(() => {
      if (aggregate === "sum") {
        if (!valueKey || !validValueKeys.includes(valueKey)) {
          setValueKey(validValueKeys.length > 0 ? validValueKeys[0] : null);
        }
      } else if (aggregate === "count") {
        setValueKey(null);
      }
    }, [aggregate, validValueKeys, valueKey]);

    function transformDynamicData(
      rawData: any[],
      selectedGroupBy: string | null,
      selectedAggregate: "sum" | "count",
      selectedValueKey: string | null
    ) {
      if (
        !rawData ||
        rawData.length === 0 ||
        !selectedGroupBy ||
        (selectedAggregate === "sum" && !selectedValueKey)
      ) {
        return { data: [], keys: [], indexBy: "" };
      }

      const valueKeyToUse = selectedValueKey;
      const groupByToUse = selectedGroupBy;

      if (selectedAggregate === "sum" && !valueKeyToUse) {
        console.warn("Aggregate is 'sum' but no valid valueKey is selected.");
        return { data: [], keys: [], indexBy: "" };
      }

      const uniqueGroupValues = [
        ...new Set(rawData.map((row) => row[groupByToUse])),
      ];

      if (selectedAggregate === "count") {
        const groupCounts = rawData.reduce((acc, row) => {
          const group = row[groupByToUse];
          acc[group] = (acc[group] || 0) + 1;
          return acc;
        }, {});

        return {
          data: Object.keys(groupCounts).map((group) => ({
            [groupByToUse]: group,
            count: groupCounts[group],
          })),
          keys: ["count"],
          indexBy: groupByToUse,
        };
      } else if (selectedAggregate === "sum" && valueKeyToUse) {
        const groupedSums = rawData.reduce((acc, row) => {
          const group = row[groupByToUse];
          const value = parseFloat(row[valueKeyToUse]);

          if (isNaN(value)) {
            console.warn(
              `Non-numeric value found for ${valueKeyToUse}: ${row[valueKeyToUse]}. Treating as 0.`
            );
          }

          if (!acc[group]) {
            acc[group] = { [groupByToUse]: group };
            uniqueGroupValues.forEach((gVal) => (acc[group][gVal] = 0));
          }
          acc[group][group] += isNaN(value) ? 0 : value;
          return acc;
        }, {});

        return {
          data: Object.values(groupedSums),
          keys: uniqueGroupValues,
          indexBy: groupByToUse,
        };
      }
      return { data: [], keys: [], indexBy: "" };
    }

    useEffect(() => {
      if (
        groupBy &&
        (aggregate === "count" || (aggregate === "sum" && valueKey))
      ) {
        setIsAnimating(true);
        try {
          const {
            data: processedData,
            keys: processedKeys,
            indexBy,
          } = transformDynamicData(data, groupBy, aggregate, valueKey);

          if (!processedData.length || !indexBy || processedKeys.length === 0) {
            setIsValidGraphData(false);
            setGraphData([]);
            setXKey(null);
            setYKeys([]);
            return;
          }

          const hasValidNumericData = processedData.some((item) =>
            processedKeys.some(
              (key) => item.hasOwnProperty(key) && !isNaN(Number(item[key]))
            )
          );

          if (!hasValidNumericData) {
            setIsValidGraphData(false);
            setGraphData([]);
            setXKey(null);
            setYKeys([]);
            return;
          }

          setTimeout(() => {
            setXKey(indexBy);
            setYKeys(processedKeys);
            setGraphData(processedData);
            setIsValidGraphData(true);
            setIsAnimating(false);
          }, 300);
        } catch (error) {
          console.error("Data processing error:", error);
          setIsValidGraphData(false);
          setGraphData([]);
          setXKey(null);
          setYKeys([]);
          setIsAnimating(false);
        }
      } else {
        setIsValidGraphData(false);
        setGraphData([]);
        setXKey(null);
        setYKeys([]);
      }
    }, [data, groupBy, aggregate, valueKey]);

    useEffect(() => {
      isValidGraph(isValidGraphData);
    }, [isValidGraphData, isValidGraph]);

    // Ultra-modern Custom Tooltip with glassmorphism
    const ModernTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div
            style={{
              padding: modernTheme.spacing.lg,
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              color: modernTheme.colors.text,
              fontSize: "14px",
              borderRadius: modernTheme.borderRadius.lg,
              boxShadow: modernTheme.shadows.large,
              border: `1px solid ${modernTheme.colors.border}`,
              fontFamily: modernTheme.typography.fontFamily,
              minWidth: "200px",
              maxWidth: "280px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: modernTheme.gradients.primary,
              }}
            />
            <div
              style={{
                marginBottom: modernTheme.spacing.md,
                fontWeight: 700,
                color: modernTheme.colors.text,
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                gap: modernTheme.spacing.sm,
              }}
            >
              <TrendingUp
                size={16}
                style={{ color: modernTheme.colors.primary }}
              />
              {formatKey(label)}
            </div>
            {payload.map((entry: any, index: number) => (
              <div
                key={`item-${index}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom:
                    index < payload.length - 1 ? modernTheme.spacing.md : 0,
                  padding: modernTheme.spacing.md,
                  borderRadius: modernTheme.borderRadius.sm,
                  background: `${entry.color}15`,
                  border: `1px solid ${entry.color}30`,
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      background: entry.color,
                      borderRadius: "50%",
                      marginRight: modernTheme.spacing.md,
                      boxShadow: `0 0 10px ${entry.color}60`,
                      border: "2px solid rgba(255, 255, 255, 0.8)",
                    }}
                  />
                  <span style={{ fontWeight: 600, fontSize: "14px" }}>
                    {formatKey(entry.name)}
                  </span>
                </div>
                <span
                  style={{
                    fontWeight: 700,
                    color: modernTheme.colors.text,
                    fontSize: "15px",
                    background: modernTheme.gradients.primary,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {entry.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        );
      }
      return null;
    };

    if (!isValidGraphData || !xKey || yKeys.length === 0 || !graphData.length) {
      return (
        <div
          className="flex flex-col items-center justify-center h-full p-12"
          style={{
            background: modernTheme.gradients.surface,
            backdropFilter: "blur(20px)",
            borderRadius: modernTheme.borderRadius.xl,
            border: `1px solid ${modernTheme.colors.border}`,
            boxShadow: modernTheme.shadows.large,
          }}
        >
          <div
            style={{
              width: "100px",
              height: "100px",
              background: modernTheme.gradients.primary,
              borderRadius: "50%",
              margin: "0 auto 32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: modernTheme.shadows.glow,
              // animation: "pulse 2s infinite",
            }}
          >
            <BarChart3 size={48} color="white" />
          </div>
          <h3
            style={{
              color: modernTheme.colors.text,
              fontSize: "28px",
              fontWeight: 700,
              margin: "0 0 16px 0",
              textAlign: "center",
              fontFamily: modernTheme.typography.fontFamily,
              background: modernTheme.gradients.primary,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            No Data Visualization
          </h3>
          <p
            style={{
              color: modernTheme.colors.textSecondary,
              fontSize: "18px",
              textAlign: "center",
              margin: 0,
              fontFamily: modernTheme.typography.fontFamily,
              lineHeight: 1.6,
            }}
          >
            Configure your data grouping and aggregation settings to create
            stunning visualizations
          </p>
        </div>
      );
    }

    const xTickRotation = graphData.length > 8 ? -45 : 0;
    const xTickAnchor = graphData.length > 8 ? "end" : "middle";

    return (
      <div>
        <div
          className="flex flex-col"
          style={{
            borderRadius: modernTheme.borderRadius.xl,
            background: modernTheme.gradients.surface,
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: `1px solid ${modernTheme.colors.border}`,
            // boxShadow: modernTheme.shadows.large,
            overflow: "hidden",
            transition: "all 0.4s ease",
          }}
        >
          {/* Ultra-modern Header */}
          <div
            style={{
              background: modernTheme.gradients.glass,
              backdropFilter: "blur(20px)",
              borderBottom: `1px solid ${modernTheme.colors.border}`,
            }}
          >
            {/* Enhanced Control Panel */}
            <div className="flex flex-wrap p-2 gap-3 items-center">
              <div className="flex items-center gap-1">
                {/* <Settings
                  size={18}
                  style={{ color: modernTheme.colors.primary }}
                /> */}
                <label
                  htmlFor="groupBy"
                  className="font-semibold text-sm"
                  style={{ color: modernTheme.colors.text }}
                >
                  Group By:
                </label>
                <select
                  id="groupBy"
                  className="px-2 py-2 w-28 text-sm border-0 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                  style={{
                    background: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(10px)",
                    color: modernTheme.colors.text,
                    fontFamily: modernTheme.typography.fontFamily,
                    fontWeight: 600,
                    minWidth: "140px",
                    boxShadow: modernTheme.shadows.soft,
                  }}
                  value={groupBy || ""}
                  onChange={(e) => setGroupBy(e.target.value)}
                >
                  {dataKeys.length > 0 ? (
                    dataKeys
                      .filter((key) => !isKeyExcluded(key))
                      .map((key) => (
                        <option key={key} value={key}>
                          {formatKey(key)}
                        </option>
                      ))
                  ) : (
                    <option value="">No keys available</option>
                  )}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <label
                  htmlFor="aggregate"
                  className="font-semibold text-sm"
                  style={{ color: modernTheme.colors.text }}
                >
                  Aggregate:
                </label>
                <select
                  id="aggregate"
                  className="px-2 py-2 text-sm border-0 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                  style={{
                    background: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(10px)",
                    color: modernTheme.colors.text,
                    fontFamily: modernTheme.typography.fontFamily,
                    fontWeight: 600,
                    minWidth: "120px",
                    boxShadow: modernTheme.shadows.soft,
                  }}
                  value={aggregate}
                  onChange={(e) =>
                    setAggregate(e.target.value as "sum" | "count")
                  }
                >
                  {validValueKeys.length > 0 && (
                    <option value="sum">Sum</option>
                  )}
                  <option value="count">Count</option>
                </select>
              </div>

              {aggregate === "sum" && validValueKeys.length > 0 && (
                <div className="flex items-center gap-1">
                  <label
                    htmlFor="valueKey"
                    className="font-semibold text-sm"
                    style={{ color: modernTheme.colors.text }}
                  >
                    Value Key:
                  </label>
                  <select
                    id="valueKey"
                    className="px-2 py-2 w-28 text-sm border-0 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                    style={{
                      background: "rgba(255, 255, 255, 0.9)",
                      backdropFilter: "blur(10px)",
                      color: modernTheme.colors.text,
                      fontFamily: modernTheme.typography.fontFamily,
                      fontWeight: 600,
                      minWidth: "140px",
                      boxShadow: modernTheme.shadows.soft,
                    }}
                    value={valueKey || ""}
                    onChange={(e) => setValueKey(e.target.value)}
                  >
                    {validValueKeys.map((key) => (
                      <option key={key} value={key}>
                        {formatKey(key)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Chart Container */}
          <div className="flex-1">
            <div
              ref={containerRef}
              style={{
                height: "350px",
                width: "100%",
                position: "relative",
                opacity: isAnimating ? 0.7 : 1,
                transform: isAnimating ? "scale(0.98)" : "scale(1)",
                transition: "all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={graphData}
                  // margin={{
                  //   top: 30,
                  //   right: 40,
                  //   left: 30,
                  //   bottom: xTickRotation === -45 ? 100 : 60,
                  // }}
                  barCategoryGap="25%"
                  barGap={6}
                >
                  <defs>
                    <linearGradient
                      id="gridGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="rgba(99, 102, 241, 0.1)" />
                      <stop offset="50%" stopColor="rgba(99, 102, 241, 0.05)" />
                      <stop offset="100%" stopColor="rgba(99, 102, 241, 0.1)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 6"
                    vertical={false}
                    stroke="rgba(99, 102, 241, 0.2)"
                    opacity={0.8}
                  />
                  <XAxis
                    dataKey={xKey}
                    tickLine={false}
                    axisLine={{
                      stroke: "rgba(99, 102, 241, 0.3)",
                      strokeWidth: 2,
                    }}
                    angle={xTickRotation}
                    textAnchor={xTickAnchor}
                    height={xTickRotation === -45 ? 100 : 60}
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      fontFamily: modernTheme.typography.fontFamily,
                      fill: modernTheme.colors.textSecondary,
                    }}
                    tickFormatter={formatKey}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={{
                      stroke: "rgba(99, 102, 241, 0.3)",
                      strokeWidth: 2,
                    }}
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      fontFamily: modernTheme.typography.fontFamily,
                      fill: modernTheme.colors.textSecondary,
                    }}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    cursor={{
                      fill: "rgba(99, 102, 241, 0.1)",
                      stroke: "rgba(99, 102, 241, 0.3)",
                      strokeWidth: 2,
                      radius: 8,
                    }}
                    content={<ModernTooltip />}
                  />
                  {yKeys.map((key, index) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      stackId="a"
                      fill={modernColors[index % modernColors.length].solid}
                      shape={(props) => (
                        <ModernBarShape
                          {...props}
                          yKeys={yKeys}
                          dataKey={key}
                          index={index}
                        />
                      )}
                      animationDuration={1200}
                      animationEasing="ease-out"
                      animationBegin={index * 150}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes pulse {
            0%,
            100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
        `}</style>
      </div>
    );
  }
);

export default ModernBarGraph;
