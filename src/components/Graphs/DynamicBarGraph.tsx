import React, { useState, useEffect, useRef } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { useTheme } from "../../ThemeContext";

interface DynamicBarGraphProps {
  data: any[];
  isValidGraph: (validData: boolean) => void;
}

const DynamicBarGraph: React.FC<DynamicBarGraphProps> = React.memo(
  ({ data, isValidGraph }) => {
    const { theme } = useTheme();
    const [graphData, setGraphData] = useState<any[]>([]);
    const [xKey, setXKey] = useState<string | null>(null);
    const [yKeys, setYKeys] = useState<string[]>([]);
    const [isValidGraphData, setIsValidGraphData] = useState<boolean>(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(600);

    useEffect(() => {
      if (!containerRef.current) return;

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect) {
            setContainerWidth(entry.contentRect.width);
          }
        }
      });

      observer.observe(containerRef.current);

      return () => {
        if (containerRef.current) observer.unobserve(containerRef.current);
      };
    }, []);

    // Data transformation function
    function transformDynamicData(rawData) {
      if (!rawData || rawData.length === 0) {
        return { data: [], keys: [], indexBy: "" };
      }

      const sample = rawData[0];
      const keys = Object.keys(sample);

      // Step 1: Find potential numeric value keys (real numbers or numeric strings)
      const numericKeys = keys.filter((k) => {
        const val = sample[k];
        return val !== null && val !== "" && !isNaN(Number(val));
      });

      if (numericKeys.length === 0) {
        throw new Error("No numeric value key found in dataset.");
      }

      const valueKey = numericKeys[0]; // Pick the first numeric key

      // Step 2: Pick a group key (optional)
      const stringKeys = keys.filter(
        (k) => typeof sample[k] === "string" && k !== valueKey
      );
      const groupKey = stringKeys.length > 1 ? stringKeys[1] : null;

      // Step 3: Pick the index key (x-axis) as a string field not used as value or group
      const indexByKey = stringKeys.find((k) => k !== groupKey);
      if (!indexByKey) {
        throw new Error("Could not determine indexBy (x-axis) key.");
      }

      // CASE 1: No group key (simple bar chart)
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

      // CASE 2: Grouped or stacked bar chart
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

          // Validate that yKeys contain numeric data
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
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.large,
            border: `1px solid ${theme.colors.border}`,
            padding: theme.spacing.lg,
            width: "100%",
            boxShadow: `0 8px 24px ${theme.colors.text}08`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "300px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.colors.textSecondary}
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginBottom: theme.spacing.sm }}
            >
              <path d="M3 3v18h18" />
              <path d="M18 12H8" />
              <path d="M18 8h-5" />
              <path d="M18 16h-3" />
            </svg>
            <p
              style={{
                color: theme.colors.textSecondary,
                fontSize: "1rem",
                fontWeight: 500,
                margin: 0,
              }}
            >
              Insufficient numeric data for visualization
            </p>
          </div>
        </div>
      );
    }

    // Modern color palette with complementary colors
    const modernColors = [
      "#3b82f6", // blue
      "#10b981", // emerald
      "#8b5cf6", // violet
      "#f97316", // orange
      "#ec4899", // pink
      "#14b8a6", // teal
      "#f59e0b", // amber
      "#6366f1", // indigo
    ];

    // Dynamic grid values
    const xGridValues = graphData.map((item) => item[xKey]);
    const yValues = graphData.flatMap((item) =>
      yKeys.map((key) => Number(item[key]))
    );
    const minY = 0;
    const maxY = Math.ceil(Math.max(...yValues) * 1.1); // Add 10% headroom
    const step = Math.max(1, Math.round((maxY - minY) / 5));
    const yGridValues = Array.from(
      { length: Math.ceil((maxY - minY) / step) + 1 },
      (_, i) => minY + i * step
    );

    // Dynamically calculate graph width
    const barWidth = 24;
    const groupPadding = 12;
    const totalBarsPerGroup = yKeys.length;
    const totalGroups = graphData.length;

    const calculatedWidth = 1000;

    // Clamp between containerWidth and calculatedWidth
    const graphWidth = Math.max(containerWidth, calculatedWidth);

    const bottomMargin = yKeys.length > 3 ? 100 : 80;

    return (
      <div
        ref={containerRef}
        style={{
          width: "100%",
          overflowX: "auto",
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.large,
          scrollbarWidth: "thin",
          scrollbarColor: `${theme.colors.textSecondary}40 transparent`,
        }}
      >
        <div
          style={{ height: "450px", width: `${graphWidth}px`, padding: "16px" }}
        >
          <ResponsiveBar
            data={graphData}
            keys={yKeys}
            indexBy={xKey}
            margin={{ top: 50, right: 140, bottom: bottomMargin, left: 70 }}
            padding={0.3}
            valueScale={{ type: "linear" }}
            indexScale={{ type: "band", round: true }}
            groupMode={"stacked"}
            colors={modernColors}
            borderRadius={0}
            borderWidth={0}
            defs={[
              {
                id: "gradient",
                type: "linearGradient",
                colors: [
                  { offset: 0, color: "inherit", opacity: 0.8 },
                  { offset: 100, color: "inherit", opacity: 1 },
                ],
              },
            ]}
            fill={[{ match: "*", id: "gradient" }]}
            axisTop={null}
            axisRight={null}
            gridXValues={
              xGridValues.length > 10
                ? xGridValues.filter((_, i) => i % 2 === 0)
                : xGridValues
            }
            gridYValues={yGridValues}
            enableLabel={false}
            labelSkipWidth={12}
            labelSkipHeight={12}
            legends={[
              {
                dataFrom: "keys",
                anchor: "bottom",
                direction: "row",
                justify: false,
                translateX: 0,
                translateY: yKeys.length > 3 ? 80 : 60,
                itemsSpacing: 16,
                itemWidth: 100,
                itemHeight: -11,
                itemDirection: "left-to-right",
                itemOpacity: 0.85,
                symbolSize: 12,
                symbolShape: "circle",
                symbolBorderWidth: 0,
                effects: [
                  {
                    on: "hover",
                    style: {
                      itemOpacity: 1,
                      symbolSize: 14,
                    },
                  },
                ],
                itemTextColor: theme.colors.text,
              },
            ]}
            tooltip={({ id, value, color, indexValue }) => (
              <div
                style={{
                  padding: "12px 16px",
                  background: theme.colors.surface,
                  color: theme.colors.text,
                  fontSize: "14px",
                  borderRadius: "8px",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                <div
                  style={{
                    marginBottom: "8px",
                    fontWeight: 600,
                    color: theme.colors.textSecondary,
                    fontSize: "12px",
                  }}
                >
                  {indexValue}
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      backgroundColor: color,
                      borderRadius: "4px",
                      marginRight: "8px",
                    }}
                  />
                  <span style={{ fontWeight: 500 }}>
                    {formatKey(id.toString())}:{" "}
                  </span>
                  <span style={{ marginLeft: "4px", fontWeight: 600 }}>
                    {value}
                  </span>
                </div>
              </div>
            )}
            theme={{
              background: "transparent",
              textColor: theme.colors.text,
              fontSize: 12,
              fontFamily: theme.typography.fontFamily,
              axis: {
                domain: {
                  line: {
                    stroke: theme.colors.border,
                    strokeWidth: 1,
                  },
                },
                ticks: {
                  line: {
                    stroke: theme.colors.border,
                    strokeWidth: 1,
                  },
                  text: {
                    fill: theme.colors.textSecondary,
                    fontSize: 12,
                    fontFamily: theme.typography.fontFamily,
                    fontWeight: 500,
                  },
                },
              },
              grid: {
                line: {
                  stroke: `${theme.colors.border}60`,
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                },
              },
              legends: {
                text: {
                  fill: theme.colors.text,
                  fontSize: 13,
                  fontFamily: theme.typography.fontFamily,
                  fontWeight: 500,
                },
              },
              tooltip: {
                container: {
                  background: theme.colors.surface,
                  color: theme.colors.text,
                  fontSize: 13,
                  fontFamily: theme.typography.fontFamily,
                  borderRadius: "8px",
                  boxShadow: `0 4px 20px ${theme.colors.text}15`,
                  padding: "12px 16px",
                },
              },
            }}
            animate={true}
            motionConfig={{
              mass: 1,
              tension: 170,
              friction: 26,
              clamp: false,
              precision: 0.01,
              velocity: 0,
            }}
            role="application"
            ariaLabel={`Bar chart showing ${formatKey(xKey)} vs values`}
          />
        </div>
      </div>
    );
  }
);

// Helper function to format keys for display
function formatKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

const areEqual = (
  prevProps: DynamicBarGraphProps,
  nextProps: DynamicBarGraphProps
) => {
  return (
    prevProps.data === nextProps.data &&
    prevProps.isValidGraph === nextProps.isValidGraph
  );
};

export default React.memo(DynamicBarGraph, areEqual);
