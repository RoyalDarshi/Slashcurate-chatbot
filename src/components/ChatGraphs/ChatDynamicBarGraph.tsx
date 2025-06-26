import React, { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BarChart3, TrendingUp } from "lucide-react";
import { useTheme } from "../../ThemeContext";

interface DynamicBarGraphProps {
  data: any[];
  isValidGraph: (validData: boolean) => void;
}

// Modern Bar Shape with rounded top bars and gradients
const ModernBarShape = (props: any) => {
  const { theme } = useTheme();
  const {
    x,
    y,
    width,
    height,
    dataKey,
    payload,
    yKeys,
    index: groupIndex,
    keyIndex,
  } = props;

  const radius = Math.min(6, width / 3);
  const value = Number(payload[dataKey]);
  const topMostKey = [...yKeys]
    .reverse()
    .find((key) => Number(payload[key]) > 0);
  const isTopBar = dataKey === topMostKey;
  const colorIndex = keyIndex % theme.colors.barColors.length;
  const solidColor = theme.colors.barColors[colorIndex];
  const gradientId = `gradient-${groupIndex}-${keyIndex}`;

  if (value <= 0) return null;

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
            <stop offset="0%" stopColor={solidColor} stopOpacity="1" />
            <stop offset="100%" stopColor={solidColor} stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <path
          d={pathData}
          fill={`url(#${gradientId})`}
          stroke={theme.colors.surfaceGlass}
          strokeWidth="1"
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
            <stop offset="0%" stopColor={solidColor} stopOpacity="1" />
            <stop offset="100%" stopColor={solidColor} stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={`url(#${gradientId})`}
          stroke={theme.colors.surfaceGlass}
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

// Modern Tooltip with glassmorphism
const ModernTooltip = ({ active, payload, label, theme }: any) => {
  if (active && payload && payload.length) {
    const accentColor = payload[0]?.color || theme.colors.accent;
    return (
      <div
        style={{
          padding: theme.spacing.lg,
          background: theme.colors.surface,
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          color: theme.colors.text,
          fontSize: "14px",
          borderRadius: theme.borderRadius.large,
          boxShadow: theme.shadow.lg,
          border: `1px solid ${theme.colors.border}`,
          fontFamily: theme.typography.fontFamily,
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
            background: theme.gradients.primary,
          }}
        />
        <div
          style={{
            marginBottom: theme.spacing.md,
            fontWeight: theme.typography.weight.bold,
            color: theme.colors.text,
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            gap: theme.spacing.sm,
          }}
        >
          <TrendingUp size={16} style={{ color: theme.colors.accent }} />
          {formatKey(label)}
        </div>
        {payload.map((entry: any, index: number) => (
          <div
            key={`item-${index}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: index < payload.length - 1 ? theme.spacing.md : 0,
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.default,
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
                  marginRight: theme.spacing.md,
                  boxShadow: theme.shadow.sm,
                  border: `2px solid ${theme.colors.surface}`,
                }}
              />
              <span
                style={{
                  fontWeight: theme.typography.weight.medium,
                  fontSize: "14px",
                }}
              >
                {formatKey(entry.name)}
              </span>
            </div>
            <span
              style={{
                fontWeight: theme.typography.weight.bold,
                color: theme.colors.text,
                fontSize: "15px",
                background: theme.gradients.primary,
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

function formatKey(key: any): string {
  if (key === null || key === undefined) return "";
  const stringKey = String(key);
  return stringKey
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

const DynamicBarGraph: React.FC<DynamicBarGraphProps> = React.memo(
  ({ data, isValidGraph }) => {
    const { theme } = useTheme();
    const [graphData, setGraphData] = useState<any[]>([]);
    const [xKey, setXKey] = useState<string | null>(null);
    const [yKeys, setYKeys] = useState<string[]>([]);
    const [isValidGraphData, setIsValidGraphData] = useState<boolean>(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<HTMLDivElement>(null);
    const [showResolutionOptions, setShowResolutionOptions] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close resolution options on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          showResolutionOptions &&
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setShowResolutionOptions(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [showResolutionOptions]);

    // Resize observer for container
    useEffect(() => {
      if (!containerRef.current) return;

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect) {
            // Update dimensions if needed
          }
        }
      });

      observer.observe(containerRef.current);
      return () => {
        if (containerRef.current) observer.unobserve(containerRef.current);
      };
    }, []);

    function transformDynamicData(rawData: any[]) {
      if (!rawData || rawData.length === 0) {
        return { data: [], keys: [], indexBy: "" };
      }

      const sample = rawData[0];
      const keys = Object.keys(sample);

      const numericKeys = keys.filter((k) => {
        const val = sample[k];
        return val !== null && val !== "" && !isNaN(Number(val));
      });

      if (numericKeys.length === 0) {
        setIsValidGraphData(false);
        return { data: [], keys: [], indexBy: "" };
      }

      const valueKey = numericKeys[0];

      let stringKeys = keys.filter(
        (k) => typeof sample[k] === "string" && k !== valueKey
      );

      if (stringKeys.length === 0) {
        rawData = rawData.map((item, idx) => ({
          ...item,
          label: `Item ${idx + 1}`,
        }));
        stringKeys = ["label"];
      }

      const groupKey = stringKeys.length > 1 ? stringKeys[1] : null;
      const indexByKey = stringKeys.find((k) => k !== groupKey);

      if (!indexByKey) {
        setIsValidGraphData(false);
        return { data: [], keys: [], indexBy: "" };
      }

      if (!groupKey) {
        return {
          data: rawData.map((row) => ({
            [indexByKey]: row[indexByKey],
            value: Number(row[valueKey]),
          })),
          keys: ["value"],
          indexBy: indexByKey,
        };
      }

      const allGroupValues = [...new Set(rawData.map((row) => row[groupKey]))];

      const grouped = rawData.reduce((acc, row) => {
        const label = row[indexByKey];
        const group = row[groupKey];
        const value = Number(row[valueKey]);

        if (!acc[label]) {
          acc[label] = { [indexByKey]: label };
          allGroupValues.forEach((type) => (acc[label][type] = 0));
        }

        acc[label][group] += value;
        return acc;
      }, {});

      return {
        data: Object.values(grouped),
        keys: allGroupValues,
        indexBy: indexByKey,
      };
    }

    useEffect(() => {
      const processApiData = (dataset: any[]) => {
        try {
          const {
            data: processedData,
            keys: processedKeys,
            indexBy,
          } = transformDynamicData(dataset);

          if (!processedData.length || !indexBy || !processedKeys.length) {
            setIsValidGraphData(false);
            return;
          }

          const hasValidNumericData = processedData.some((item) =>
            processedKeys.some((key) => !isNaN(Number(item[key])))
          );

          if (!hasValidNumericData) {
            setIsValidGraphData(false);
            return;
          }

          setXKey(indexBy);
          setYKeys(processedKeys);
          setGraphData(processedData);
          setIsValidGraphData(true);
        } catch (error) {
          console.error("Data processing error:", error);
          setIsValidGraphData(false);
        }
      };

      processApiData(data);
    }, [data]);

    useEffect(() => {
      isValidGraph(isValidGraphData);
    }, [isValidGraphData, isValidGraph]);

    if (!isValidGraphData || !xKey || yKeys.length === 0) {
      return (
        <div
          className="flex flex-col items-center justify-center h-full p-12"
          style={{
            background: theme.colors.surface,
            backdropFilter: "blur(20px)",
            boxShadow: theme.shadow.lg,
            borderRadius: theme.borderRadius.large,
            minHeight: "300px",
          }}
        >
          <div
            style={{
              width: "100px",
              height: "100px",
              background: theme.gradients.primary,
              borderRadius: "50%",
              margin: "0 auto 32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: theme.shadow.md,
            }}
          >
            <BarChart3 size={48} color="white" />
          </div>
          <h3
            style={{
              color: theme.colors.text,
              fontSize: "28px",
              fontWeight: theme.typography.weight.bold,
              margin: "0 0 16px 0",
              textAlign: "center",
              fontFamily: theme.typography.fontFamily,
              background: theme.gradients.primary,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            No Data Visualization
          </h3>
          <p
            style={{
              color: theme.colors.textSecondary,
              fontSize: "18px",
            }}
          >
            Insufficient Generate a valid dataset to create stunning
            visualizations
          </p>
        </div>
      );
    }

    const xTickRotation = graphData.length > 8 ? -45 : 0;
    const xTickAnchor = graphData.length > 8 ? "end" : "middle";

    return (
      <div
        className="flex flex-col"
        style={{
          background: theme.colors.surface,
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          overflow: "hidden",
          transition: "all 0.4s ease",
        }}
      >
        <div ref={containerRef} style={{ height: "65vh", width: "100%" }}>
          <div
            ref={graphRef}
            style={{
              height: "100%",
              width: "100%",
              position: "relative",
              transition: "all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graphData} barCategoryGap="5%" barGap={6}>
                <defs>
                  <linearGradient
                    id="gridGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor={`${theme.colors.accent}1A`} />
                    <stop offset="50%" stopColor={`${theme.colors.accent}0D`} />
                    <stop
                      offset="100%"
                      stopColor={`${theme.colors.accent}1A`}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 6"
                  vertical={false}
                  stroke={`${theme.colors.accent}33`}
                  opacity={0.8}
                />
                <XAxis
                  dataKey={xKey}
                  tickLine={false}
                  axisLine={{
                    stroke: `${theme.colors.accent}4D`,
                    strokeWidth: 2,
                  }}
                  angle={xTickRotation}
                  textAnchor={xTickAnchor}
                  height={xTickRotation === -45 ? 100 : 60}
                  style={{
                    fontSize: "13px",
                    fontWeight: theme.typography.weight.medium,
                    fontFamily: theme.typography.fontFamily,
                    fill: theme.colors.textSecondary,
                  }}
                  tickFormatter={(value) =>
                    value.length > 14
                      ? value.slice(0, 12) + "…"
                      : formatKey(value)
                  }
                />
                <YAxis
                  tickLine={false}
                  axisLine={{
                    stroke: `${theme.colors.accent}4D`,
                    strokeWidth: 2,
                  }}
                  style={{
                    fontSize: "13px",
                    fontWeight: theme.typography.weight.medium,
                    fontFamily: theme.typography.fontFamily,
                    fill: theme.colors.textSecondary,
                  }}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  cursor={{
                    fill: `${theme.colors.accent}1A`,
                    stroke: `${theme.colors.accent}4D`,
                    strokeWidth: 2,
                    radius: 8,
                  }}
                  content={<ModernTooltip theme={theme} />}
                />
                <Legend
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  wrapperStyle={{
                    fontSize: "13px",
                    fontFamily: theme.typography.fontFamily,
                    fontWeight: theme.typography.weight.medium,
                    color: theme.colors.text,
                  }}
                  iconType="circle"
                  iconSize={14}
                  formatter={(value) => formatKey(value)}
                  // onMouseEnter={(e) => {
                  //   // Optional: Add hover effect
                  //   const legendItems = document.querySelectorAll(
                  //     `.recharts-legend-item`
                  //   );
                  //   legendItems.forEach((item) => {
                  //     if (item.getAttribute("data-key") === e.dataKey) {
                  //       item.setAttribute(
                  //         "style",
                  //         `opacity: 1; transform: scale(1.1); transition: all 0.2s ease;`
                  //       );
                  //     }
                  //   });
                  // }}
                  // onMouseLeave={() => {
                  //   const legendItems = document.querySelectorAll(
                  //     `.recharts-legend-item`
                  //   );
                  //   legendItems.forEach((item) => {
                  //     item.setAttribute(
                  //       "style",
                  //       `opacity: 0.85; transform: scale(1); transition: all 0.2s ease;`
                  //     );
                  //   });
                  // }}
                />
                {yKeys.map((key, keyIndex) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="a"
                    fill={
                      theme.colors.barColors[
                        keyIndex % theme.colors.barColors.length
                      ]
                    }
                    shape={(props) => (
                      <ModernBarShape
                        {...props}
                        yKeys={yKeys}
                        dataKey={key}
                        keyIndex={keyIndex}
                      />
                    )}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    animationBegin={keyIndex * 150}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.data === nextProps.data &&
      prevProps.isValidGraph === nextProps.isValidGraph
    );
  }
);

export default DynamicBarGraph;
