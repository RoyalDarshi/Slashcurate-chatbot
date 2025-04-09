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

    useEffect(() => {
      const processApiData = (data: { [key: string]: any }[]) => {
        console.log("Actual data:", data);
        try {
          if (!data || data.length === 0) {
            setIsValidGraphData(false);
            return;
          }

          const firstItem = data[0];
          const keys = Object.keys(firstItem);
          let localXKey = ""; // Use local variable for safe access
          let foundBranchId = false;

          if (keys.includes("branch_id")) {
            localXKey = "branch_id";
            foundBranchId = true;
          } else if (keys.includes("customer_id")) {
            localXKey = "customer_id";
            foundBranchId = true;
          }

          // Identify numeric keys
          const numericKeys = keys.filter((key) => {
            if (foundBranchId && key === "branch_id") return false;
            const value = firstItem[key];
            return (
              typeof value === "number" ||
              (!isNaN(Number(value)) && value !== null && value !== "")
            );
          });

          if (numericKeys.length === 0) {
            setIsValidGraphData(false);
            return;
          }

          // If no branch_id or customer_id, fallback to the first numeric key as xKey
          if (!foundBranchId) {
            localXKey = numericKeys[0];
          }

          setXKey(localXKey); // Set state once determined

          // Exclude IDs, codes, and phone numbers from yKeys
          const filteredNumericKeys = numericKeys.filter(
            (key) =>
              !key.toLowerCase().endsWith("id") &&
              !key.toLowerCase().endsWith("code") &&
              !key.toLowerCase().endsWith("number") &&
              key.toLowerCase() !== "phone_number" &&
              key.toLowerCase() !== "role" &&
              key.toLowerCase() !== "otp"
          );

          setYKeys(filteredNumericKeys);

          // Aggregate data by xKey
          const groupedData: {
            [key: string]: { [key: string]: number | string };
          } = {};

          data.forEach((item) => {
            const groupKey = item[localXKey];
            if (!groupKey) return;

            if (!groupedData[groupKey]) {
              groupedData[groupKey] = { [localXKey]: groupKey };
              filteredNumericKeys.forEach((yKey) => {
                groupedData[groupKey][yKey] = 0;
              });
            }

            filteredNumericKeys.forEach((yKey) => {
              const value = Number(item[yKey]);
              if (!isNaN(value)) {
                groupedData[groupKey][yKey] =
                  (groupedData[groupKey][yKey] as number) + value;
              }
            });
          });

          const aggregatedData = Object.values(groupedData);
          setGraphData(aggregatedData);
          console.log("Aggregated data:", aggregatedData);
          setIsValidGraphData(filteredNumericKeys.length > 0);
        } catch (error) {
          console.error("Error processing data:", error);
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
            borderRadius: theme.borderRadius.default,
            border: `1px solid ${theme.colors.border}`,
            padding: theme.spacing.md,
            width: "100%",
            boxShadow: `0 2px 8px ${theme.colors.text}10`,
          }}
        >
          <p
            style={{
              color: theme.colors.textSecondary,
              textAlign: "center",
              marginTop: theme.spacing.sm,
              fontSize: "1rem",
              fontWeight: 400,
            }}
          >
            Insufficient numeric data for graph visualization
          </p>
        </div>
      );
    }

    const stunningColors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEEAD",
      "#D4A5A5",
      "#9B59B6",
    ];

    // Dynamic grid values
    const xGridValues = graphData.map((item) => item[xKey]);
    const yValues = graphData.flatMap((item) =>
      yKeys.map((key) => Number(item[key]))
    );
    const minY = 0;
    const maxY = Math.ceil(Math.max(...yValues));
    const step = Math.max(1, Math.round((maxY - minY) / 5));
    const yGridValues = Array.from(
      { length: Math.ceil((maxY - minY) / step) + 1 },
      (_, i) => minY + i * step
    );

    // Dynamically calculate graph width
    const barWidth = 30;
    const groupPadding = 10;
    const totalBarsPerGroup = yKeys.length;
    const totalGroups = graphData.length;

    const calculatedWidth =
      totalGroups * (totalBarsPerGroup * barWidth + groupPadding);

    // Clamp between containerWidth and calculatedWidth
    const graphWidth = Math.max(containerWidth, calculatedWidth);

    const bottomMargin = 80;

    return (
      <div
        ref={containerRef}
        className="scrollbar-thin"
        style={{
          width: "100%",
          overflowX: "auto",
          scrollbarColor: `${theme.colors.textSecondary} ${theme.colors.surface}`,
        }}
      >
        <div style={{ height: "400px", width: `${graphWidth}px` }}>
          <ResponsiveBar
            data={graphData}
            keys={yKeys}
            indexBy={xKey}
            margin={{ top: 50, right: 140, bottom: bottomMargin, left: 70 }}
            padding={0.5} // Increased padding for better spacing
            valueScale={{ type: "linear" }}
            indexScale={{ type: "band", round: true }}
            groupMode="grouped"
            colors={stunningColors}
            borderRadius={4}
            borderWidth={0.5}
            borderColor={{
              from: "color",
              modifiers: [["darker", 0.3]],
            }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 8,
              tickRotation: graphData.length > 10 ? 45 : 0,
              legend: xKey,
              legendPosition: "middle",
              legendOffset: 40,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 8,
              tickRotation: 0,
              legend: "Value",
              legendPosition: "middle",
              legendOffset: -50,
              tickValues: yGridValues,
            }}
            gridXValues={xGridValues}
            gridYValues={yGridValues}
            enableLabel={false}
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor={{
              from: "color",
              modifiers: [["darker", 2]],
            }}
            legends={[
              {
                dataFrom: "keys",
                anchor: "bottom",
                direction: "row",
                justify: false,
                translateX: 0,
                translateY: 70,
                itemsSpacing: 4,
                itemWidth: 100,
                itemHeight: 20,
                itemDirection: "left-to-right",
                itemOpacity: 0.85,
                symbolSize: 14,
                symbolShape: "circle",
                effects: [
                  {
                    on: "hover",
                    style: {
                      itemOpacity: 1,
                      itemTextColor: theme.colors.accent,
                    },
                  },
                ],
              },
            ]}
            theme={{
              background: "transparent",
              axis: {
                ticks: {
                  line: {
                    stroke: theme.colors.textSecondary,
                    strokeWidth: 1,
                  },
                  text: {
                    fill: theme.colors.textSecondary,
                    fontSize: 12,
                    fontFamily: theme.typography.fontFamily,
                    fontWeight: 400,
                  },
                },
                legend: {
                  text: {
                    fill: theme.colors.text,
                    fontSize: 14,
                    fontFamily: theme.typography.fontFamily,
                    fontWeight: 500,
                  },
                },
              },
              grid: {
                line: {
                  stroke: theme.colors.textSecondary,
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                  opacity: 0.6,
                },
              },
              labels: {
                text: {
                  fill: theme.colors.text,
                  fontSize: 12,
                  fontFamily: theme.typography.fontFamily,
                  fontWeight: 500,
                },
              },
              legends: {
                text: {
                  fill: theme.colors.text,
                  fontSize: 12,
                  fontFamily: theme.typography.fontFamily,
                  fontWeight: 400,
                },
              },
              tooltip: {
                container: {
                  background: theme.colors.surface,
                  color: theme.colors.text,
                  fontSize: 12,
                  borderRadius: "6px",
                  boxShadow: `0 2px 8px ${theme.colors.text}20`,
                  padding: "8px 12px",
                },
              },
            }}
            animate={true}
            motionConfig="gentle"
          />
        </div>
      </div>
    );
  }
);

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
