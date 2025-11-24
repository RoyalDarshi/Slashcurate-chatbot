import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Snowflake as RadarChartIconLucide,
  TrendingUp,
  Download,
} from "lucide-react"; // Using Snowflake for Radar
import { useTheme } from "../../ThemeContext";
import html2canvas from "html2canvas";

interface ModernRadarGraphProps {
  data: any[];
  groupBy: string | null;
  setGroupBy: React.Dispatch<React.SetStateAction<string | null>>;
  aggregate: "sum" | "count" | "avg" | "min" | "max";
  setAggregate: React.Dispatch<React.SetStateAction<"sum" | "count" | "avg" | "min" | "max">>;
  valueKey: string | null; // This will act as the value to display on the radius axis
  setValueKey: React.Dispatch<React.SetStateAction<string | null>>;
}

const DynamicRadarGraph: React.FC<ModernRadarGraphProps> = React.memo(
  ({
    data,
    groupBy, // This will be used for the categories on the polar angle axis
    aggregate, // Aggregate applies to the values
    setAggregate,
    setGroupBy,
    setValueKey,
    valueKey, // The single numeric value to plot for each category
  }) => {
    const { theme } = useTheme();
    const [isAnimating, setIsAnimating] = useState(false);
    const [showResolutionOptions, setShowResolutionOptions] = useState(false);

    const [graphData, setGraphData] = useState<any[]>([]);
    const [angleKey, setAngleKey] = useState<string | null>(null); // Corresponds to groupBy
    const [radiusKey, setRadiusKey] = useState<string | null>(null); // Corresponds to valueKey

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
          link.download = `radar_graph_${resolution}.png`;
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

    useEffect(() => {
      if (!data || data.length === 0) {
        setGraphData([]);
        setAngleKey(null);
        setRadiusKey(null);
        setIsAnimating(false);
      }
    }, [data]);

    useEffect(() => {
      if (dataKeys.length > 0) {
        // For Radar, groupBy maps to PolarAngleAxis and valueKey maps to PolarRadiusAxis
        if (!groupBy && validCategoricalKeys.length > 0) {
          setGroupBy(validCategoricalKeys[0]);
        } else if (groupBy && !validCategoricalKeys.includes(groupBy)) {
          setGroupBy(null); // Clear if current groupBy is not valid categorical
        }

        if (aggregate === "sum" && !valueKey && validNumericKeys.length > 0) {
          setValueKey(validNumericKeys[0]);
        } else if (aggregate === "count" && !valueKey) {
          // No specific valueKey needed for count, but we need *a* numeric key for the axis
          setValueKey(validNumericKeys.length > 0 ? validNumericKeys[0] : null);
        } else if (valueKey && !validNumericKeys.includes(valueKey)) {
          setValueKey(null); // Clear if current valueKey is not valid numeric
        }

        if (groupBy) setAngleKey(groupBy);
        if (valueKey) setRadiusKey(valueKey);
      } else {
        setGroupBy(null);
        setValueKey(null);
        setAngleKey(null);
        setRadiusKey(null);
      }
    }, [
      data,
      dataKeys,
      validCategoricalKeys,
      validNumericKeys,
      groupBy,
      valueKey,
      aggregate,
    ]);

    function transformDynamicData(
      rawData: any[],
      selectedGroupBy: string | null, // Becomes angleKey
      selectedAggregate: "sum" | "count",
      selectedValueKey: string | null // Becomes radiusKey
    ) {
      if (
        !rawData ||
        rawData.length === 0 ||
        !selectedGroupBy ||
        (selectedAggregate === "sum" && !selectedValueKey)
      ) {
        return { data: [], angleKey: "", radiusKey: "" };
      }

      const groupByToUse = selectedGroupBy;
      const valueKeyToUse = selectedValueKey;

      const aggregatedData: { [key: string]: any } = {};

      rawData.forEach((row) => {
        const group = row[groupByToUse];
        if (group === undefined || group === null) return;

        if (!aggregatedData[group]) {
          aggregatedData[group] = { [groupByToUse]: group };
        }

        if (selectedAggregate === "count") {
          aggregatedData[group].count = (aggregatedData[group].count || 0) + 1;
        } else if (selectedAggregate === "sum" && valueKeyToUse) {
          const value = parseFloat(row[valueKeyToUse]);
          if (!isNaN(value)) {
            aggregatedData[group][valueKeyToUse] =
              (aggregatedData[group][valueKeyToUse] || 0) + value;
          }
        }
      });

      const finalData = Object.values(aggregatedData);
      const currentRadiusKey =
        selectedAggregate === "count" ? "count" : valueKeyToUse;

      return {
        data: finalData,
        angleKey: groupByToUse,
        radiusKey: currentRadiusKey,
      };
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
            angleKey: newAngleKey,
            radiusKey: newRadiusKey,
          } = transformDynamicData(data, groupBy, aggregate, valueKey);

          if (!processedData.length || !newAngleKey || !newRadiusKey) {
            setGraphData([]);
            setAngleKey(null);
            setRadiusKey(null);
            setIsAnimating(false);
            return;
          }

          setGraphData(processedData);
          setAngleKey(newAngleKey);
          setRadiusKey(newRadiusKey);
          setIsAnimating(false);
        } catch (error) {
          console.error("Data processing error:", error);
          setGraphData([]);
          setAngleKey(null);
          setRadiusKey(null);
          setIsAnimating(false);
        }
      } else {
        setGraphData([]);
        setAngleKey(null);
        setRadiusKey(null);
        setIsAnimating(false);
      }
    }, [data, groupBy, aggregate, valueKey]);

    const ModernTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const accentColor = theme.colors.accent; // Using accent color for scatter
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
            {payload
  .filter((entry: any) => entry?.value !== 0)
  .map((entry: any, index: number) => (
              <div
                key={`item-${index}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom:
                    index < payload.length - 1 ? theme.spacing.md : 0,
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.default,
                  background: `${entry.color || accentColor}15`,
                  border: `1px solid ${entry.color || accentColor}30`,
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      background: entry.color || accentColor,
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

    if (!angleKey || !radiusKey || !graphData.length) {
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
            <RadarChartIconLucide size={48} color="white" />
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

    const valueDomain = [
      0,
      Math.max(...graphData.map((d) => d[radiusKey] || 0)),
    ];

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
                height: "calc(100vh - 265px)",
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
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  data={graphData}
                >
                  <PolarGrid stroke={`${theme.colors.accent}33`} />
                  <PolarAngleAxis
                    dataKey={angleKey}
                    tickFormatter={formatKey}
                    style={{
                      fontSize: "13px",
                      fontWeight: theme.typography.weight.medium,
                      fontFamily: theme.typography.fontFamily,
                      fill: theme.colors.textSecondary,
                    }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={valueDomain}
                    tickFormatter={(value) => value.toLocaleString()}
                    style={{
                      fontSize: "13px",
                      fontWeight: theme.typography.weight.medium,
                      fontFamily: theme.typography.fontFamily,
                      fill: theme.colors.textSecondary,
                    }}
                  />
                  <Tooltip content={<ModernTooltip />} />
                  <Radar
                    name={formatKey(radiusKey)}
                    dataKey={radiusKey}
                    stroke={theme.colors.accent}
                    fill={theme.colors.accent}
                    fillOpacity={0.6}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />
                </RadarChart>
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

export default DynamicRadarGraph;
