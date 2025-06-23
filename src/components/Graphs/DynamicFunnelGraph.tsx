import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FunnelChart,
  Funnel,
  LabelList,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  List as FunnelChartIconLucide,
  TrendingUp,
  Download,
} from "lucide-react"; // Using List icon for Funnel
import { useTheme } from "../../ThemeContext";
import html2canvas from "html2canvas";

interface ModernFunnelGraphProps {
  data: any[];
  groupBy: string | null; // This will be the "name" or stage
  setGroupBy: React.Dispatch<React.SetStateAction<string | null>>;
  aggregate: "sum" | "count";
  setAggregate: React.Dispatch<React.SetStateAction<"sum" | "count">>;
  valueKey: string | null; // This will be the "value" for the stage
  setValueKey: React.Dispatch<React.SetStateAction<string | null>>;
}

const DynamicFunnelGraph: React.FC<ModernFunnelGraphProps> = React.memo(
  ({
    data,
    groupBy, // Stage name
    aggregate,
    setAggregate,
    setGroupBy,
    setValueKey,
    valueKey, // Value for the stage
  }) => {
    const { theme } = useTheme();
    const [isAnimating, setIsAnimating] = useState(false);
    const [showResolutionOptions, setShowResolutionOptions] = useState(false);

    const [graphData, setGraphData] = useState<any[]>([]);
    // These keys will always be "name" and "value" after transformation
    const [nameKey, setNameKey] = useState<string | null>("name");
    const [valueDataKey, setValueDataKey] = useState<string | null>("value");

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
          link.download = `funnel_graph_${resolution}.png`;
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
        lowerKey === "name" ||
        lowerKey.length < 3
      );
    };

    const validCategoricalKeys = dataKeys.filter(
      (key) => !isKeyExcluded(key) && !numericKeys.includes(key)
    );
    const validNumericKeys = numericKeys.filter((key) => !isKeyExcluded(key));

    // Effect for initial setup of groupBy and valueKey based on data
    useEffect(() => {
      if (!data || data.length === 0) {
        setGroupBy(null);
        setValueKey(null);
        return;
      }

      // Auto-detect groupBy if not already set or invalid
      if (!groupBy || !validCategoricalKeys.includes(groupBy)) {
        setGroupBy(
          validCategoricalKeys.length > 0 ? validCategoricalKeys[0] : null
        );
      }

      // Auto-detect valueKey if not already set or invalid for sum, or set to null for count
      if (aggregate === "sum") {
        if (!valueKey || !validNumericKeys.includes(valueKey)) {
          setValueKey(validNumericKeys.length > 0 ? validNumericKeys[0] : null);
        }
      } else {
        // aggregate === "count"
        setValueKey(null); // valueKey is not directly used for count
      }
    }, [
      data,
      aggregate,
      validCategoricalKeys,
      validNumericKeys,
      groupBy,
      valueKey,
      setGroupBy,
      setValueKey,
    ]);

    // Data transformation function for Funnel Chart
    const transformDynamicData = useCallback(
      (
        rawData: any[],
        selectedGroupBy: string | null, // The key for the stage name
        selectedAggregate: "sum" | "count",
        selectedValueKey: string | null // The key for the value to sum
      ) => {
        if (
          !rawData ||
          rawData.length === 0 ||
          !selectedGroupBy ||
          (selectedAggregate === "sum" && !selectedValueKey)
        ) {
          return [];
        }

        const aggregatedData: {
          [key: string]: { name: string; value: number };
        } = {};

        rawData.forEach((row) => {
          const group = row[selectedGroupBy];
          if (group === undefined || group === null) return;

          if (!aggregatedData[group]) {
            aggregatedData[group] = { name: formatKey(group), value: 0 };
          }

          if (selectedAggregate === "count") {
            aggregatedData[group].value =
              (aggregatedData[group].value || 0) + 1;
          } else if (selectedAggregate === "sum" && selectedValueKey) {
            const value = parseFloat(row[selectedValueKey]);
            if (!isNaN(value)) {
              aggregatedData[group].value =
                (aggregatedData[group].value || 0) + value;
            }
          }
        });

        // Convert aggregated object to array and sort by value descending for funnel effect
        const finalData = Object.values(aggregatedData).sort(
          (a, b) => b.value - a.value
        );

        return finalData;
      },
      [formatKey]
    ); // Depend on formatKey

    // Effect to process data when dependencies change
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

          // Ensure processedData has valid numeric values for the funnel
          const hasValidFunnelData = processedData.some(
            (item) =>
              item.hasOwnProperty("value") &&
              typeof item.value === "number" &&
              !isNaN(item.value)
          );

          if (!processedData.length || !hasValidFunnelData) {
            setGraphData([]);
            setIsAnimating(false);
            return;
          }

          setGraphData(processedData);
          setNameKey("name"); // Reconfirm internal Recharts keys
          setValueDataKey("value"); // Reconfirm internal Recharts keys
          setIsAnimating(false);
        } catch (error) {
          console.error("Data processing error:", error);
          setGraphData([]);
          setNameKey(null);
          setValueDataKey(null);
          setIsAnimating(false);
        }
      } else {
        setGraphData([]);
        setNameKey(null);
        setValueDataKey(null);
        setIsAnimating(false);
      }
    }, [data, groupBy, aggregate, valueKey, transformDynamicData]);

    const ModernTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const accentColor = payload[0]?.fill || theme.colors.accent;
        const dataPoint = payload[0].payload; // The actual data object for this funnel slice

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
                background: accentColor, // Use funnel slice color
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
              <TrendingUp size={16} style={{ color: accentColor }} />
              {/* Use dataPoint.name for the label, as that's what we mapped it to */}
              {formatKey(dataPoint.name)}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: theme.spacing.md,
                borderRadius: theme.borderRadius.default,
                background: `${accentColor}15`,
                border: `1px solid ${accentColor}30`,
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    background: accentColor,
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
                  Value
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
                {dataPoint.value.toLocaleString()}
              </span>
            </div>
          </div>
        );
      }
      return null;
    };

    if (!nameKey || !valueDataKey || !graphData.length) {
      return (
        <div
          className="flex flex-col items-center justify-center h-full p-12"
          style={{
            background: theme.colors.surface,
            backdropFilter: "blur(20px)",
            boxShadow: theme.shadow.lg,
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
            <FunnelChartIconLucide size={48} color="white" />
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
            background: theme.colors.surface,
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            overflow: "hidden",
            transition: "all 0.4s ease",
          }}
        >
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

          {/* Chart Container */}
          <div className="flex-1" ref={containerRef}>
            <div
              ref={graphRef}
              style={{
                height: "60vh",
                width: "100%",
                minHeight: "300px",
                flex: 1,
                position: "relative",
                opacity: isAnimating ? 0.7 : 1,
                transform: isAnimating ? "scale(0.98)" : "scale(1)",
                transition: "all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <Tooltip content={<ModernTooltip />} />
                  <Funnel
                    dataKey={valueDataKey || ""} // This should be "value"
                    nameKey={nameKey || ""} // This should be "name"
                    data={graphData}
                    isAnimationActive={true}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    fill={theme.colors.accent} // Default fill
                    strokeWidth={0} // No stroke for a cleaner look
                  >
                    {graphData.map((entry, index) => (
                      <Funnel
                        key={`funnel-slice-${index}`} // Unique key for each slice
                        data={[entry]} // Render each entry as a separate funnel slice for individual styling
                        dataKey={valueDataKey || ""} // This should be "value"
                        nameKey={nameKey || ""} // This should be "name"
                        fill={
                          theme.colors.barColors[
                            index % theme.colors.barColors.length
                          ]
                        }
                        isAnimationActive={false} // Animation handled by parent Funnel
                      >
                        <LabelList
                          dataKey={nameKey || ""}
                          position="right"
                          fill={theme.colors.text}
                          style={{
                            fontSize: "14px",
                            fontWeight: theme.typography.weight.bold,
                            fontFamily: theme.typography.fontFamily,
                          }}
                          formatter={(value: string) => formatKey(value)}
                        />
                        <LabelList
                          dataKey={valueDataKey || ""}
                          position="inside"
                          fill="#ffffff" // White text for values inside the funnel
                          style={{
                            fontSize: "14px",
                            fontWeight: theme.typography.weight.bold,
                            fontFamily: theme.typography.fontFamily,
                          }}
                          formatter={(value: number) => value.toLocaleString()}
                        />
                      </Funnel>
                    ))}
                  </Funnel>
                </FunnelChart>
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

export default DynamicFunnelGraph;
