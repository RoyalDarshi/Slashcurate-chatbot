import React, { useState, useEffect, useRef } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { useTheme } from "../../ThemeContext";
import { BarChart3, TrendingUp } from "lucide-react";

interface DynamicBarGraphProps {
  data: any[];
  isValidGraph: (validData: boolean) => void;
}

const CustomTooltip = ({ id, value, color, indexValue, theme }: any) => {
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
        {indexValue}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: theme.spacing.md,
          borderRadius: theme.borderRadius.default,
          background: `${color}15`,
          border: `1px solid ${color}30`,
          transition: "all 0.2s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: "14px",
              height: "14px",
              background: color,
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
            {formatKey(id.toString())}
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
          {value.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

function formatKey(key: string): string {
  return key
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
        throw new Error("No numeric value key found in dataset.");
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
        throw new Error("Could not determine indexBy (x-axis) key.");
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
              textAlign: "center",
              margin: 0,
              fontFamily: theme.typography.fontFamily,
              lineHeight: 1.6,
            }}
          >
            Insufficient numeric data for visualization.
          </p>
        </div>
      );
    }

    const xGridValues = graphData.map((item) => item[xKey]);
    const yValues = graphData.flatMap((item) =>
      yKeys.map((key) => Number(item[key]))
    );
    const minY = 0;
    const maxY = Math.ceil(Math.max(...yValues) * 1.1);
    const step = Math.max(1, Math.round((maxY - minY) / 5));
    const yGridValues = Array.from(
      { length: Math.ceil((maxY - minY) / step) + 1 },
      (_, i) => minY + i * step
    );

    const minBarWidth = 20;
    const groupPadding = 10;
    const totalGroups = graphData.length;
    const totalMinWidth = totalGroups * minBarWidth + (totalGroups - 1) * groupPadding;
    const calculatedMinWidth = totalMinWidth + 100;
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
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          transition: "all 0.4s ease",
        }}
      >
        <div
          style={{
            height: "450px",
            width: "100%",
            minWidth: `${calculatedMinWidth}px`,
            padding: "16px",
          }}
        >
          <ResponsiveBar
            data={graphData}
            keys={yKeys}
            indexBy={xKey}
            margin={{ top: 20, right: 20, bottom: bottomMargin, left: 80 }}
            padding={0.1}
            valueScale={{ type: "linear" }}
            indexScale={{ type: "band", round: true }}
            groupMode={"stacked"}
            colors={theme.colors.barColors}
            borderRadius={4}
            borderWidth={0}
            defs={[
              {
                id: "barGradient",
                type: "linearGradient",
                colors: [
                  { offset: 0, color: "inherit", opacity: 1 },
                  { offset: 100, color: "inherit", opacity: 0.7 },
                ],
              },
            ]}
            fill={[{ match: "*", id: "barGradient" }]}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 8,
              tickRotation: xGridValues.length > 8 ? -45 : 0,
              legendPosition: "middle",
              legendOffset: 50,
              truncateTickAt: 0,
              renderTick: (tick) => {
                return (
                  <g transform={`translate(${tick.x},${tick.y})`}>
                    <line y2="6" stroke={theme.colors.border} />
                    <text
                      textAnchor={xGridValues.length > 8 ? "end" : "middle"}
                      dominantBaseline="text-before-edge"
                      transform={
                        xGridValues.length > 8
                          ? "rotate(-45) translate(-10,0)"
                          : ""
                      }
                      style={{
                        fontSize: "12px",
                        fill: theme.colors.textSecondary,
                        fontWeight: theme.typography.weight.medium,
                        fontFamily: theme.typography.fontFamily,
                      }}
                    >
                      {tick.value}
                    </text>
                  </g>
                );
              },
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 8,
              tickRotation: 0,
              legendPosition: "middle",
              legendOffset: -56,
              truncateTickAt: 0,
              tickValues: yGridValues,
              renderTick: (tick) => {
                return (
                  <g transform={`translate(${tick.x},${tick.y})`}>
                    <line x2="-6" stroke={theme.colors.border} />
                    <text
                      textAnchor="end"
                      dominantBaseline="middle"
                      style={{
                        fontSize: "12px",
                        fill: theme.colors.textSecondary,
                        fontWeight: theme.typography.weight.medium,
                        fontFamily: theme.typography.fontFamily,
                      }}
                    >
                      {tick.value}
                    </text>
                  </g>
                );
              },
            }}
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
                itemsSpacing: 18,
                itemWidth: 110,
                itemHeight: -12,
                itemDirection: "left-to-right",
                itemOpacity: 0.85,
                symbolSize: 14,
                symbolShape: "circle",
                symbolBorderWidth: 0,
                effects: [
                  {
                    on: "hover",
                    style: {
                      itemOpacity: 1,
                      symbolSize: 16,
                    },
                  },
                ],
                itemTextColor: theme.colors.text,
              },
            ]}
            tooltip={({ id, value, color, indexValue }) => (
              <CustomTooltip
                id={id}
                value={value}
                color={color}
                indexValue={indexValue}
                theme={theme}
              />
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
                    fontWeight: theme.typography.weight.medium,
                  },
                },
                legend: {
                  text: {
                    fill: theme.colors.textSecondary,
                    fontSize: 14,
                    fontWeight: theme.typography.weight.medium,
                  },
                },
              },
              grid: {
                line: {
                  stroke: `${theme.colors.border}40`,
                  strokeWidth: 1,
                  strokeDasharray: "5 5",
                },
              },
              legends: {
                text: {
                  fill: theme.colors.text,
                  fontSize: 13,
                  fontFamily: theme.typography.fontFamily,
                  fontWeight: theme.typography.weight.medium,
                },
              },
              tooltip: {
                container: {
                  background: theme.colors.surface,
                  color: theme.colors.text,
                  fontSize: 13,
                  fontFamily: theme.typography.fontFamily,
                  borderRadius: theme.borderRadius.default,
                  boxShadow: `0 4px 20px ${theme.colors.text}15`,
                  padding: "14px 18px",
                },
              },
            }}
            animate={true}
            motionConfig={{
              mass: 1,
              tension: 180,
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