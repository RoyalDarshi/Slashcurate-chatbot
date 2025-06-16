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
import { BarChart3, TrendingUp } from "lucide-react";
import { useTheme } from "../../ThemeContext"; // Corrected import path

interface ModernBarGraphProps {
  data: any[];
  groupBy: string | null;
  setGroupBy: React.Dispatch<React.SetStateAction<string | null>>;
  aggregate: "sum" | "count";
  setAggregate: React.Dispatch<React.SetStateAction<"sum" | "count">>;
  valueKey: string | null;
  setValueKey: React.Dispatch<React.SetStateAction<string | null>>;
}

// Ultra-modern Custom Bar Shape with advanced gradients and animations
const ModernBarShape = (props: any) => {
  const { theme } = useTheme(); // Use theme from context
  const {
    x,
    y,
    width,
    height,
    dataKey,
    payload,
    yKeys,
    index: groupIndex, // Renamed to avoid conflict
    keyIndex,
  } = props;
  const radius = Math.min(8, width / 3);
  const value = Number(payload[dataKey]);

  const topMostKey = [...yKeys]
    .reverse()
    .find((key) => Number(payload[key]) > 0);

  const isTopBar = dataKey === topMostKey;
  const colorIndex = keyIndex % theme.colors.barColors.length;
  const solidColor = theme.colors.barColors[colorIndex];

  // FIX: Use unique ID based on groupIndex AND keyIndex
  const gradientId = `gradient-${groupIndex}-${keyIndex}`;

  if (value <= 0) return null;

  // Define a simple gradient for the bars as `theme.gradients` might not have specific bar gradients
  const barGradient = `linear-gradient(135deg, ${solidColor} 0%, ${solidColor}cc 100%)`; // Added opacity to the end color

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
          stroke={theme.colors.surfaceGlass} // Using surfaceGlass from theme
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
          stroke={theme.colors.surfaceGlass} // Using surfaceGlass from theme
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

const DynamicBarGraph: React.FC<ModernBarGraphProps> = React.memo(
  ({
    data,
    groupBy,
    aggregate,
    setAggregate,
    setGroupBy,
    setValueKey,
    valueKey,
  }) => {
    const { theme } = useTheme(); // Use theme from context
    const [isAnimating, setIsAnimating] = useState(false);

    const [graphData, setGraphData] = useState<any[]>([]);
    const [xKey, setXKey] = useState<string | null>(null);
    const [yKeys, setYKeys] = useState<string[]>([]);

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
        lowerKey === "last_name" ||
        lowerKey === "name" || // NEW: skip generic 'name'
        lowerKey.length < 3 // NEW: avoid too-short keys
      );
    };

    const validValueKeys = numericKeys.filter((key) => !isKeyExcluded(key));

    const autoDetectBestGroupBy = (
      rows: any[],
      excludeFn: (key: string) => boolean
    ): string | null => {
      if (!rows.length) return null;

      const sampleSize = Math.min(100, rows.length);
      const sample = rows.slice(0, sampleSize);
      const scores: Record<string, number> = {};

      const keys = Object.keys(sample[0]);

      keys.forEach((key) => {
        if (excludeFn(key)) return;

        const values = sample.map((row) => row[key]).filter(Boolean);
        const uniqueCount = new Set(values).size;

        // Skip if mostly unique or mostly same
        if (uniqueCount <= 1 || uniqueCount > sampleSize * 0.6) return;

        const nullCount =
          values.length < sampleSize ? sampleSize - values.length : 0;
        const nullPenalty = nullCount / sampleSize;

        scores[key] = 1 / (uniqueCount + nullPenalty * 10); // lower uniqueCount is better
      });

      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      return sorted.length ? sorted[0][0] : null;
    };

    // New useEffect to handle empty data immediately
    useEffect(() => {
      if (!data || data.length === 0) {
        setGraphData([]);
        setXKey(null);
        setYKeys([]);
        setIsAnimating(false); // Ensure animation state is off
      }
    }, [data]);

    useEffect(() => {
      if (dataKeys.length > 0) {
        const bestGroupBy = autoDetectBestGroupBy(data, isKeyExcluded);
        if (!groupBy) {
          setGroupBy(
            bestGroupBy || dataKeys.find((key) => !isKeyExcluded(key)) || null
          );
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
        data &&
        data.length > 0 &&
        groupBy &&
        (aggregate === "count" || (aggregate === "sum" && valueKey))
      ) {
        try {
          const {
            data: processedData,
            keys: processedKeys,
            indexBy,
          } = transformDynamicData(data, groupBy, aggregate, valueKey);

          const hasValidNumericData = processedData.some((item) =>
            processedKeys.some(
              (key) =>
                item.hasOwnProperty(key) &&
                typeof item[key] === "number" &&
                !isNaN(item[key])
            )
          );

          if (!processedData.length || !indexBy || !hasValidNumericData) {
            setGraphData([]);
            setXKey(null);
            setYKeys([]);
            setIsAnimating(false);
            return;
          }

          setGraphData(processedData);
          setXKey(indexBy);
          setYKeys(processedKeys);
          setIsAnimating(false);
        } catch (error) {
          console.error("Data processing error:", error);
          setGraphData([]);
          setXKey(null);
          setYKeys([]);
          setIsAnimating(false);
        }
      } else {
        setGraphData([]);
        setXKey(null);
        setYKeys([]);
        setIsAnimating(false);
      }
    }, [data, groupBy, aggregate, valueKey]);

    const groupByOptions = dataKeys.filter((key) => !isKeyExcluded(key));

    // Ultra-modern Custom Tooltip with glassmorphism
    const ModernTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        // Use the color of the first bar in the payload for the accent/border
        const accentColor = payload[0]?.color || theme.colors.accent;
        return (
          <div
            style={{
              padding: theme.spacing.lg,
              background: theme.colors.surface, // Use surface from theme
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              color: theme.colors.text,
              fontSize: "14px",
              borderRadius: theme.borderRadius.large, // Use large from theme
              boxShadow: theme.shadow.lg, // Use lg from theme
              border: `1px solid ${theme.colors.border}`, // Use border from theme
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
                background: theme.gradients.primary, // Use primary gradient from theme
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
              <TrendingUp
                size={16}
                style={{ color: theme.colors.accent }} // Use accent from theme
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
                    index < payload.length - 1 ? theme.spacing.md : 0,
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.default, // Use default from theme
                  background: `${entry.color}15`, // Keep opacity suffix
                  border: `1px solid ${entry.color}30`, // Keep opacity suffix
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
                      boxShadow: theme.shadow.sm, // Use sm from theme
                      border: `2px solid ${theme.colors.surface}`, // Use surface from theme
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
                    background: theme.gradients.primary, // Use primary gradient from theme
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

    if (!xKey || yKeys.length === 0 || !graphData.length) {
      console.log("No valid data for rendering");
      return (
        <div
          className="flex flex-col items-center justify-center h-full p-12"
          style={{
            background: theme.colors.surface, // Use surface from theme
            backdropFilter: "blur(20px)",
            // border: `1px solid ${theme.colors.border}`, // Use border from theme
            boxShadow: theme.shadow.lg, // Use lg from theme
          }}
        >
          <div
            style={{
              width: "100px",
              height: "100px",
              background: theme.gradients.primary, // Use primary gradient from theme
              borderRadius: "50%",
              margin: "0 auto 32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: theme.shadow.md, // Use md from theme
            }}
          >
            <BarChart3 size={48} color="white" />
          </div>
          <h3
            style={{
              color: theme.colors.text, // Use text from theme
              fontSize: "28px",
              fontWeight: theme.typography.weight.bold,
              margin: "0 0 16px 0",
              textAlign: "center",
              fontFamily: theme.typography.fontFamily,
              background: theme.gradients.primary, // Use primary gradient from theme
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            No Data Visualization
          </h3>
          <p
            style={{
              color: theme.colors.textSecondary, // Use textSecondary from theme
              fontSize: "18px",
              textAlign: "center",
              margin: 0,
              fontFamily: theme.typography.fontFamily,
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
    console.log("Rendering graph with", { xKey, yKeys, graphData });
    return (
      <div>
        <div
          className="flex flex-col"
          style={{
            // borderRadius: theme.borderRadius.large, // Use large from theme
            background: theme.colors.surface, // Use surface from theme
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            // border: `1px solid ${theme.colors.border}`, // Use border from theme
            overflow: "hidden",
            transition: "all 0.4s ease",
          }}
        >
          {/* Ultra-modern Header */}
          <div
            style={{
              background: theme.gradients.glass, // Use glass gradient from theme
              backdropFilter: "blur(20px)",
              borderBottom: `1px solid ${theme.colors.border}`, // Use border from theme
            }}
          >
            {/* Enhanced Control Panel */}
            {/* Keeping the control panel commented out as it was in the original file,
                but updating styles to use theme for future use if uncommented */}
            {/* <div className="flex flex-wrap p-2 gap-3 items-center">
              <div className="flex items-center gap-1">
                 <Settings
                  size={18}
                  style={{ color: theme.colors.accent }}
                />
                <label
                  htmlFor="groupBy"
                  className="font-semibold text-sm"
                  style={{ color: theme.colors.text }}
                >
                  Group By:
                </label>
                <select
                  id="groupBy"
                  className="px-2 py-2 w-28 text-sm border-0 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                  style={{
                    background: theme.colors.surface,
                    backdropFilter: "blur(10px)",
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamily,
                    fontWeight: theme.typography.weight.medium,
                    minWidth: "140px",
                    boxShadow: theme.shadow.sm,
                  }}
                  value={groupBy || ""}
                  onChange={(e) => {
                    const newGroupBy = e.target.value;
                    setGroupBy(newGroupBy);
                  }}
                >
                  {groupByOptions.length > 0 ? (
                    groupByOptions.map((key) => (
                      <option key={key} value={key}>
                        {formatKey(key)}
                      </option>
                    ))
                  ) : (
                    <option value="">No suitable groupBy options</option>
                  )}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <label
                  htmlFor="aggregate"
                  className="font-semibold text-sm"
                  style={{ color: theme.colors.text }}
                >
                  Aggregate:
                </label>
                <select
                  id="aggregate"
                  className="px-2 py-2 text-sm border-0 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                  style={{
                    background: theme.colors.surface,
                    backdropFilter: "blur(10px)",
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamily,
                    fontWeight: theme.typography.weight.medium,
                    minWidth: "120px",
                    boxShadow: theme.shadow.sm,
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
                    style={{ color: theme.colors.text }}
                  >
                    Value Key:
                  </label>
                  <select
                    id="valueKey"
                    className="px-2 py-2 w-28 text-sm border-0 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                    style={{
                      background: theme.colors.surface,
                      backdropFilter: "blur(10px)",
                      color: theme.colors.text,
                      fontFamily: theme.typography.fontFamily,
                      fontWeight: theme.typography.weight.medium,
                      minWidth: "140px",
                      boxShadow: theme.shadow.sm,
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
            </div> */}
          </div>

          {/* Enhanced Chart Container */}
          <div className="flex-1">
            <div
              ref={containerRef}
              style={{
                height: "60vh",
                width: "100%",
                minHeight: "300px", // ✅ minimum visible height
                flex: 1,
                position: "relative",
                opacity: isAnimating ? 0.7 : 1,
                transform: isAnimating ? "scale(0.98)" : "scale(1)",
                transition: "all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graphData} barCategoryGap="25%" barGap={6}>
                  <defs>
                    <linearGradient
                      id="gridGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop
                        offset="0%"
                        stopColor={`${theme.colors.accent}1A`}
                      />{" "}
                      {/* Accent with opacity */}
                      <stop
                        offset="50%"
                        stopColor={`${theme.colors.accent}0D`}
                      />{" "}
                      {/* Accent with more opacity */}
                      <stop
                        offset="100%"
                        stopColor={`${theme.colors.accent}1A`}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 6"
                    vertical={false}
                    stroke={`${theme.colors.accent}33`} // Accent with opacity
                    opacity={0.8}
                  />
                  <XAxis
                    dataKey={xKey}
                    tickLine={false}
                    axisLine={{
                      stroke: `${theme.colors.accent}4D`, // Accent with opacity
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
                      stroke: `${theme.colors.accent}4D`, // Accent with opacity
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
                      fill: `${theme.colors.accent}1A`, // Accent with opacity
                      stroke: `${theme.colors.accent}4D`, // Accent with opacity
                      strokeWidth: 2,
                      radius: 8,
                    }}
                    content={<ModernTooltip />}
                  />
                  {yKeys.map(
                    (
                      key,
                      keyIndex // Added keyIndex
                    ) => (
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
                            keyIndex={keyIndex} // Pass keyIndex to shape
                          />
                        )}
                        animationDuration={1200}
                        animationEasing="ease-out"
                        animationBegin={keyIndex * 150}
                      />
                    )
                  )}
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

export default DynamicBarGraph;
