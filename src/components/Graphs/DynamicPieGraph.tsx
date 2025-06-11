import React, { useState, useEffect, useRef, useCallback } from "react";
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer,Cell } from "recharts";

// Modern glassmorphism theme (same as DynamicBarGraph.tsx)
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

const modernColors = [
  "#5B9BD5",
  "#FFA726",
  "#EF5350",
  "#4DB6AC",
  "#66BB6A",
  "#FFEE58",
  "#BA68C8",
  "#FF8A80",
  "#8D6E63",
  "#BDBDBD",
];

interface DynamicPieGraphProps {
  data: any[];
  isValidGraph: (validData: boolean) => void;
}

const DynamicPieGraph: React.FC<DynamicPieGraphProps> = React.memo(
  ({ data, isValidGraph }) => {
    const [graphData, setGraphData] = useState<any[]>([]);
    const [isValidGraphData, setIsValidGraphData] = useState<boolean>(true);
    const containerRef = useRef<HTMLDivElement>(null);

    const formatKey = useCallback((key: string): string => {
      return key
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
    }, []);

    function transformDynamicData(rawData) {
      if (!rawData || rawData.length === 0) {
        return [];
      }

      const sample = rawData[0];
      const keys = Object.keys(sample);
      const excludedSuffixes = ["id", "code", "number"];

      const isExcluded = (key: string) =>
        excludedSuffixes.some((suffix) => key.toLowerCase().endsWith(suffix));

      const numericKeys = keys.filter((k) => {
        const val = sample[k];
        return (
          val !== null && val !== "" && !isNaN(Number(val)) && !isExcluded(k)
        );
      });

      if (numericKeys.length === 0) {
        throw new Error("No numeric value key found in dataset.");
      }

      const valueKey = numericKeys[0];
      let nameKey = keys.find(
        (k) => typeof sample[k] === "string" && k !== valueKey && !isExcluded(k)
      );

      if (!nameKey) {
        rawData = rawData.map((item, idx) => ({
          ...item,
          label: `Item ${idx + 1}`,
        }));
        nameKey = "label";
      }

      return rawData
        .map((row) => ({
          name: row[nameKey],
          value: Number(row[valueKey]),
        }))
        .filter((item) => item.value > 0); // Pie charts require positive values
    }

    useEffect(() => {
      const processApiData = (dataset: any[]) => {
        try {
          const processedData = transformDynamicData(dataset);

          if (
            !processedData.length ||
            processedData.every((item) => item.value <= 0)
          ) {
            setIsValidGraphData(false);
            return;
          }

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

    const CustomTooltip = ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const entry = payload[0];
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
              {entry.payload.name}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
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
              <span style={{ fontWeight: 600, flex: 1 }}>Value</span>
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
          </div>
        );
      }
      return null;
    };

    const CustomLegend = ({ payload }: any) => {
      return (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
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

    if (!isValidGraphData || graphData.length === 0) {
      return (
        <div>
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
              color: theme.colors.text,
              fontSize: "24px",
              fontWeight: 700,
              margin: "0 0 12px 0",
              textAlign: "center",
              fontFamily: theme.typography.fontFamily,
            }}
          >
            No Graph Available
          </h3>
          <p
            style={{
              color: theme.colors.textSecondary,
              fontSize: "16px",
              textAlign: "center",
              margin: 0,
              fontFamily: theme.typography.fontFamily,
            }}
          >
            Insufficient numeric data for visualization
          </p>
        </div>
      );
    }

    return (
      <div
        style={{
          borderRadius: theme.borderRadius.large,
          fontFamily: theme.typography.fontFamily,
          overflow: "hidden",
        }}
      >
        <div
          ref={containerRef}
          style={{
            height: "400px",
            width: "52vw",
            position: "relative",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={graphData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"
                // label={({ name, percent }) =>
                //   `${formatKey(name)} (${(percent * 100).toFixed(1)}%)`
                // }
                labelLine={false}
                animationDuration={1200}
                animationEasing="ease-out"
              >
                {graphData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={modernColors[index % modernColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }
);

export default DynamicPieGraph;
