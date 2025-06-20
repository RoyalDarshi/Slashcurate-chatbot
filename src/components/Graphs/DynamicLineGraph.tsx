import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  LineChart as LineChartIconLucide,
  TrendingUp,
  Download,
} from "lucide-react"; // Renamed LineChart for clarity
import { useTheme } from "../../ThemeContext"; // Corrected import path

import html2canvas from "html2canvas";

interface ModernLineGraphProps {
  data: any[];
  groupBy: string | null;
  setGroupBy: React.Dispatch<React.SetStateAction<string | null>>;
  aggregate: "sum" | "count";
  setAggregate: React.Dispatch<React.SetStateAction<"sum" | "count">>;
  valueKey: string | null;
  setValueKey: React.Dispatch<React.SetStateAction<string | null>>;
}

const DynamicLineGraph: React.FC<ModernLineGraphProps> = React.memo(
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
    const [showResolutionOptions, setShowResolutionOptions] = useState(false);

    const [graphData, setGraphData] = useState<any[]>([]);
    const [xKey, setXKey] = useState<string | null>(null);
    const [yKeys, setYKeys] = useState<string[]>([]);

    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Function to handle graph download
    const handleDownloadGraph = async (resolution: "low" | "high") => {
      if (containerRef.current) {
        try {
          const scale = resolution === "high" ? 2 : 1;
          const canvas = await html2canvas(containerRef.current, {
            scale,
            useCORS: true,
            logging: false,
            backgroundColor: theme.colors.surface,
            onclone: (document, element) => {
              const svgElements = element.querySelectorAll("svg");
              svgElements.forEach((svg) => {
                svg.setAttribute(
                  "width",
                  svg.getBoundingClientRect().width.toString()
                );
                svg.setAttribute(
                  "height",
                  svg.getBoundingClientRect().height.toString()
                );
              });
            },
          });
          const image = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = image;
          link.download = `line_graph_${resolution}.png`;
          link.click();
        } catch (error) {
          console.error("Error downloading graph:", error);
        }
      }
      setShowResolutionOptions(false);
    };

    // Close resolution options when clicking outside
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
        // Use the color of the first line in the payload for the accent/border
        const accentColor = payload[0]?.stroke || theme.colors.accent;
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
                  background: `${entry.stroke}15`, // Use stroke color for background
                  border: `1px solid ${entry.stroke}30`, // Use stroke color for border
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      background: entry.stroke,
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
      return (
        <div
          className="flex flex-col items-center justify-center h-full p-12"
          style={{
            background: theme.colors.surface, // Use surface from theme
            backdropFilter: "blur(20px)",
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
            <LineChartIconLucide size={48} color="white" />
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

    return (
      <div>
        <div
          className="flex flex-col"
          style={{
            background: theme.colors.surface, // Use surface from theme
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
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
            {/* Control panel is managed by DashboardView, keeping this empty */}
          </div>

          {/* Export Button */}
          <div className="flex justify-end mb-2">
            <div className="relative">
              <button
                onClick={() => setShowResolutionOptions(!showResolutionOptions)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg rounded-t-none rounded-br-none text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: `${theme.colors.accent}1A`,
                  color: theme.colors.accent,
                  border: `1px solid ${theme.colors.accent}33`,
                }}
                title="Export Graph"
              >
                <Download size={16} />
                <span>Export</span>
              </button>

              {showResolutionOptions && (
                <div
                  ref={dropdownRef}
                  className="absolute right-0 mt-1 py-1 rounded-lg shadow-lg z-10"
                  style={{
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                    minWidth: "120px",
                  }}
                >
                  <button
                    onClick={() => handleDownloadGraph("low")}
                    className="w-full text-left px-3 py-1.5 text-sm hover:opacity-80 transition-opacity"
                    style={{ color: theme.colors.text }}
                  >
                    Standard Quality
                  </button>
                  <button
                    onClick={() => handleDownloadGraph("high")}
                    className="w-full text-left px-3 py-1.5 text-sm hover:opacity-80 transition-opacity"
                    style={{ color: theme.colors.text }}
                  >
                    High Quality
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Chart Container */}
          <div className="flex-1" ref={containerRef}>
            <div
              ref={graphRef}
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
                <LineChart data={graphData}>
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
                  {/* <Legend content={<CustomLegend />} /> // Removed legend to match bar graph */}
                  {yKeys.map((key, index) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      // Use theme.colors.barColors for stroke consistency
                      stroke={
                        theme.colors.barColors[
                          index % theme.colors.barColors.length
                        ]
                      }
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      animationDuration={1200}
                      animationEasing="ease-out"
                      animationBegin={index * 150}
                    />
                  ))}
                </LineChart>
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

export default DynamicLineGraph;
