import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Modern glassmorphism theme with vibrant gradients
const theme = {
  colors: {
    surface: "rgba(255, 255, 255, 0.95)",
    surfaceGlass: "rgba(255, 255, 255, 0.1)",
    text: "#1a1a2e",
    textSecondary: "#64748b",
    border: "rgba(148, 163, 184, 0.2)",
    primary: "#6366f1",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    accent: "#f472b6",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    cardBg: "rgba(255, 255, 255, 0.08)",
    cardBorder: "rgba(255, 255, 255, 0.18)",
  },
  gradients: {
    primary: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    secondary: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    success: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    warning: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    accent: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  },
  borderRadius: {
    large: "20px",
    medium: "12px",
    small: "8px",
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
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  shadows: {
    soft: "0 4px 20px rgba(0, 0, 0, 0.08)",
    medium: "0 8px 30px rgba(0, 0, 0, 0.12)",
    strong: "0 20px 60px rgba(0, 0, 0, 0.15)",
    glow: "0 0 40px rgba(99, 102, 241, 0.3)",
  },
};

interface DynamicBarGraphProps {
  data: any[];
  isValidGraph: (validData: boolean) => void;
}

// Enhanced Custom Bar Shape with gradient fills and glow effects
const CustomBarShape = (props: any) => {
  const { x, y, width, height, fill, dataKey, yKeys, index } = props;

  const isTopBar =
    yKeys && yKeys.length > 0 && dataKey === yKeys[yKeys.length - 1];
  const radius = 8;

  // Create gradient definitions
  const gradientId = `gradient-${dataKey}-${index || 0}`;

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
            <stop offset="0%" stopColor={fill} stopOpacity="1" />
            <stop offset="100%" stopColor={fill} stopOpacity="0.7" />
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
          fill={fill}
          style={{
            transition: "all 0.3s ease",
          }}
        />
      </g>
    );
  } else {
    return (
      <g>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={fill} stopOpacity="0.9" />
            <stop offset="100%" stopColor={fill} stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          style={{
            transition: "all 0.3s ease",
          }}
        />
      </g>
    );
  }
};

const DynamicBarGraph: React.FC<DynamicBarGraphProps> = React.memo(
  ({ data, isValidGraph }) => {
    const [graphData, setGraphData] = useState<any[]>([]);
    const [xKey, setXKey] = useState<string | null>(null);
    const [yKeys, setYKeys] = useState<string[]>([]);
    const [isValidGraphData, setIsValidGraphData] = useState<boolean>(true);
    const [isLoaded, setIsLoaded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Stunning modern color palette with gradients
    // const modernColors = [
    //   "#6366f1", // Indigo
    //   "#ec4899", // Pink
    //   "#10b981", // Emerald
    //   "#f59e0b", // Amber
    //   "#8b5cf6", // Violet
    //   "#06b6d4", // Cyan
    //   "#ef4444", // Red
    //   "#3b82f6", // Blue
    //   "#84cc16", // Lime
    //   "#f97316", // Orange
    // ];
    const modernColors = [
      "#4E79A7",
      "#F28E2B",
      "#E15759",
      "#76B7B2",
      "#59A14F",
      "#EDC949",
    ];

    const formatKey = useCallback((key: string): string => {
      return key
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
    }, []);

    const transformDynamicData = useCallback((rawData: any[]) => {
      if (!rawData || rawData.length === 0) {
        return { data: [], keys: [], indexBy: "" };
      }

      const sample = rawData[0];
      const allKeys = Object.keys(sample);

      let indexByKey: string | null = null;
      for (const key of allKeys) {
        if (typeof sample[key] === "string" && isNaN(Number(sample[key]))) {
          indexByKey = key;
          break;
        }
      }

      if (!indexByKey) {
        indexByKey =
          allKeys.find((key) => typeof sample[key] === "string") || allKeys[0];
        if (!indexByKey) {
          throw new Error(
            "Could not determine indexBy (x-axis) key. No string keys found."
          );
        }
      }

      const numericKeysForStacking = allKeys.filter((key) => {
        return key !== indexByKey && !isNaN(Number(sample[key]));
      });

      if (numericKeysForStacking.length === 0) {
        throw new Error("No numeric keys found for stacking.");
      }

      const processedData = rawData.map((row) => {
        const newRow: { [key: string]: any } = {
          [indexByKey!]: row[indexByKey!],
        };
        numericKeysForStacking.forEach((key) => {
          newRow[key] = Number(row[key]);
        });
        return newRow;
      });

      return {
        data: processedData,
        keys: numericKeysForStacking,
        indexBy: indexByKey,
      };
    }, []);

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

          // Trigger loading animation
          setTimeout(() => setIsLoaded(true), 100);
        } catch (error) {
          console.error("Data processing error:", error);
          setIsValidGraphData(false);
        }
      };

      processApiData(data);
    }, [data, transformDynamicData]);

    useEffect(() => {
      isValidGraph(isValidGraphData);
    }, [isValidGraphData, isValidGraph]);

    // Enhanced Custom Tooltip with glassmorphism
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div
            style={{
              padding: theme.spacing.lg,
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              color: theme.colors.text,
              fontSize: "14px",
              borderRadius: theme.borderRadius.medium,
              boxShadow: theme.shadows.medium,
              border: `1px solid ${theme.colors.cardBorder}`,
              fontFamily: theme.typography.fontFamily,
              minWidth: "200px",
              animation: "tooltipFadeIn 0.2s ease-out",
            }}
          >
            <style>
              {`
                @keyframes tooltipFadeIn {
                  from { opacity: 0; transform: translateY(-10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}
            </style>
            <div
              style={{
                marginBottom: theme.spacing.md,
                fontWeight: 700,
                color: theme.colors.text,
                fontSize: "16px",
                borderBottom: `2px solid ${theme.colors.primary}`,
                paddingBottom: theme.spacing.sm,
              }}
            >
              {label}
            </div>
            {payload.map((entry: any, index: number) => (
              <div
                key={`item-${index}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: theme.spacing.sm,
                  padding: theme.spacing.sm,
                  borderRadius: theme.borderRadius.small,
                  background: "rgba(99, 102, 241, 0.05)",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    background: `linear-gradient(135deg, ${entry.color}, ${entry.color}dd)`,
                    borderRadius: "50%",
                    marginRight: theme.spacing.md,
                    boxShadow: `0 2px 8px ${entry.color}40`,
                  }}
                />
                <span style={{ fontWeight: 600, flex: 1 }}>
                  {formatKey(entry.name)}
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    color: theme.colors.primary,
                    fontSize: "15px",
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

    // Enhanced Custom Legend with modern styling
    const CustomLegend = ({ payload }: any) => {
      return (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            position: "absolute",
            bottom: theme.spacing.md,
            left: theme.spacing.md,
            right: theme.spacing.md,
            zIndex: 10,
          }}
        >
          {payload.map((entry: any, index: number) => (
            <div
              key={`legend-item-${index}`}
              style={{
                display: "flex",
                alignItems: "center",
                margin: theme.spacing.sm,
                color: theme.colors.text,
                fontSize: "12px",
                fontFamily: theme.typography.fontFamily,
                fontWeight: 600,
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  background: `linear-gradient(135deg, ${entry.color}, ${entry.color}dd)`,
                  borderRadius: "50%",
                  marginRight: theme.spacing.sm,
                  boxShadow: `0 2px 6px ${entry.color}40`,
                }}
              />
              {formatKey(entry.value)}
            </div>
          ))}
        </div>
      );
    };

    if (!isValidGraphData || !xKey || yKeys.length === 0) {
      return (
        <div
          style={{
            background: theme.colors.background,
            minHeight: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: theme.borderRadius.large,
            padding: theme.spacing.xxl,
          }}
        >
          <div
            style={{
              background: theme.colors.cardBg,
              backdropFilter: "blur(20px)",
              border: `1px solid ${theme.colors.cardBorder}`,
              borderRadius: theme.borderRadius.medium,
              padding: theme.spacing.xxl,
              textAlign: "center",
              boxShadow: theme.shadows.medium,
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                background: theme.gradients.primary,
                borderRadius: "50%",
                margin: "0 auto 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.7,
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3v18h18" />
                <path d="M18 12H8" />
                <path d="M18 8h-5" />
                <path d="M18 16h-3" />
              </svg>
            </div>
            <h3
              style={{
                color: "white",
                fontSize: "24px",
                fontWeight: 700,
                margin: "0 0 12px 0",
                fontFamily: theme.typography.fontFamily,
              }}
            >
              No Data Available
            </h3>
            <p
              style={{
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: "16px",
                margin: 0,
                fontFamily: theme.typography.fontFamily,
              }}
            >
              Insufficient numeric data for visualization
            </p>
          </div>
        </div>
      );
    }

    const xTickRotation = graphData.length > 8 ? -45 : 0;
    const xTickAnchor = graphData.length > 8 ? "end" : "middle";

    return (
      <div
        style={{
          borderRadius: theme.borderRadius.large,
          fontFamily: theme.typography.fontFamily,
          // transform: isLoaded ? "translateY(0)" : "translateY(20px)",
          // transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
        }}
      >
        <div
          ref={containerRef}
          style={{
            background: theme.colors.cardBg,
            backdropFilter: "blur(20px)",
            border: `1px solid ${theme.colors.cardBorder}`,
            borderRadius: theme.borderRadius.medium,
            boxShadow: theme.shadows.strong,
            height: "455px",
            width: "42vw",
            position: "relative",
          }}
        >
          <div
            style={{
              height: "100%",
              width: "100%",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={graphData}
                // margin={{
                //   top: 20,
                //   right: 20,
                //   // left: 20,
                //   // bottom: xTickRotation === -45 ? 80 : 50,
                // }}
                barCategoryGap="15%"
                barGap={1}
              >
                <defs>
                  <linearGradient
                    id="gridGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                    <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  // stroke="url(#gridGradient)"
                  vertical={false}
                  opacity={0.7}
                />
                <XAxis
                  dataKey={xKey}
                  tickLine={false}
                  axisLine={{ strokeWidth: 2 }}
                  angle={xTickRotation}
                  textAnchor={xTickAnchor}
                  height={xTickRotation === -45 ? 140 : 80}
                  style={{
                    // fill: "rgba(255,255,255,0.9)",
                    fontSize: "13px",
                    fontWeight: 600,
                    fontFamily: theme.typography.fontFamily,
                  }}
                  tickFormatter={formatKey}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ strokeWidth: 2 }}
                  style={{
                    // fill: "rgba(255,255,255,0.9)",
                    fontSize: "13px",
                    fontWeight: 600,
                    fontFamily: theme.typography.fontFamily,
                  }}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  cursor={{
                    fill: "rgba(255,255,255,0.1)",
                    stroke: "rgba(255,255,255,0.2)",
                    strokeWidth: 2,
                  }}
                  content={<CustomTooltip />}
                />
                <Legend content={<CustomLegend />} />
                {yKeys.map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="a"
                    fill={modernColors[index % modernColors.length]}
                    shape={<CustomBarShape yKeys={yKeys} />}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    animationBegin={index * 100}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }
);

export default DynamicBarGraph;
