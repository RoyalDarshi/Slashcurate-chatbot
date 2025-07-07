import React, { useState, useEffect, useRef, useCallback } from "react";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  PieChart as PieChartIconLucide,
  TrendingUp,
  Download,
} from "lucide-react"; // Renamed PieChart for clarity
import { useTheme } from "../../ThemeContext"; // Corrected import path
import html2canvas from "html2canvas";

interface ModernPieGraphProps {
  data: any[];
  groupBy: string | null;
  setGroupBy: React.Dispatch<React.SetStateAction<string | null>>;
  aggregate: "sum" | "count";
  setAggregate: React.Dispatch<React.SetStateAction<"sum" | "count">>;
  valueKey: string | null;
  setValueKey: React.Dispatch<React.SetStateAction<string | null>>;
}

const DynamicPieGraph: React.FC<ModernPieGraphProps> = React.memo(
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
          link.download = `pie_graph_${resolution}.png`;
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
        return [];
      }

      const valueKeyToUse = selectedValueKey;
      const groupByToUse = selectedGroupBy;

      if (selectedAggregate === "sum" && !valueKeyToUse) {
        console.warn("Aggregate is 'sum' but no valid valueKey is selected.");
        return [];
      }

      const aggregatedData: { [key: string]: number } = {};

      rawData.forEach((row) => {
        const group = row[groupByToUse];
        let value = 0;

        if (selectedAggregate === "count") {
          value = 1;
        } else if (selectedAggregate === "sum" && valueKeyToUse) {
          const numValue = parseFloat(row[valueKeyToUse]);
          value = isNaN(numValue) ? 0 : numValue;
        }

        aggregatedData[group] = (aggregatedData[group] || 0) + value;
      });

      return Object.keys(aggregatedData)
        .map((name) => ({
          name,
          value: aggregatedData[name],
        }))
        .filter((item) => item.value > 0); // Pie charts typically only show positive values
    }

    useEffect(() => {
      if (
        data &&
        data.length > 0 &&
        groupBy &&
        (aggregate === "count" || (aggregate === "sum" && valueKey))
      ) {
        try {
          const processedData = transformDynamicData(
            data,
            groupBy,
            aggregate,
            valueKey
          );

          const hasValidNumericData = processedData.some(
            (item) => typeof item.value === "number" && !isNaN(item.value)
          );

          if (!processedData.length || !hasValidNumericData) {
            setGraphData([]);
            setIsAnimating(false);
            return;
          }

          setGraphData(processedData);
          setIsAnimating(false);
        } catch (error) {
          console.error("Data processing error:", error);
          setGraphData([]);
          setIsAnimating(false);
        }
      } else {
        setGraphData([]);
        setIsAnimating(false);
      }
    }, [data, groupBy, aggregate, valueKey]);

    // Ultra-modern Custom Tooltip with glassmorphism
    const ModernTooltip = ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const entry = payload[0];
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
              {formatKey(entry.name)}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
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
                  Value
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
                {entry.value.toLocaleString()} (
                {(entry.percent * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        );
      }
      return null;
    };

    if (!graphData.length) {
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
            <PieChartIconLucide size={48} color="white" />
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
                height: "calc(100vh - 265px)",
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
                <PieChart>
                  <Pie
                    data={graphData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    // fill="#8884d8" // Removed direct fill
                    label={({ name, percent }) =>
                      `${formatKey(name)} (${(percent * 100).toFixed(1)}%)`
                    }
                    labelLine={true} // Enabled label line
                    animationDuration={1200}
                    animationEasing="ease-out"
                  >
                    {graphData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          theme.colors.barColors[
                            index % theme.colors.barColors.length
                          ]
                        } // Use theme colors
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ModernTooltip />} />
                  {/* <Legend content={<CustomLegend />} /> // Removed Legend component */}
                </PieChart>
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

export default DynamicPieGraph;
