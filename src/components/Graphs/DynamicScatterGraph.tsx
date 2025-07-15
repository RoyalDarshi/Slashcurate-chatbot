import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ScatterChart as ScatterChartIconLucide,
  TrendingUp,
  Download,
} from "lucide-react";
import { useTheme } from "../../ThemeContext";
import html2canvas from "html2canvas";

interface ModernScatterGraphProps {
  data: any[];
  groupBy: string | null;
  setGroupBy: React.Dispatch<React.SetStateAction<string | null>>;
  aggregate: "sum" | "count";
  setAggregate: React.Dispatch<React.SetStateAction<"sum" | "count">>;
  valueKey: string | null;
  setValueKey: React.Dispatch<React.SetStateAction<string | null>>;
}

const DynamicScatterGraph: React.FC<ModernScatterGraphProps> = React.memo(
  ({
    data,
    groupBy,
    aggregate,
    setAggregate,
    setGroupBy,
    setValueKey,
    valueKey,
  }) => {
    const { theme } = useTheme();
    const [isAnimating, setIsAnimating] = useState(false);
    const [showResolutionOptions, setShowResolutionOptions] = useState(false);

    const [graphData, setGraphData] = useState<any[]>([] || data);
    const [xKey, setXKey] = useState<string | null>(null);
    const [yKey, setYKey] = useState<string | null>(null); // Only one y-key for scatter

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
          link.download = `scatter_graph_${resolution}.png`;
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

    const validValueKeys = numericKeys.filter((key) => !isKeyExcluded(key));

    const autoDetectBestNumericKeys = (
      rows: any[],
      excludeFn: (key: string) => boolean
    ): string[] => {
      if (!rows.length) return [];
      const keys = Object.keys(rows[0]);
      const numeric = keys.filter(
        (key) =>
          !excludeFn(key) &&
          rows.every(
            (row) =>
              typeof row[key] === "number" ||
              row[key] === null ||
              row[key] === undefined
          )
      );
      return numeric;
    };

    useEffect(() => {
      if (!data || data.length === 0) {
        setGraphData([]);
        setXKey(null);
        setYKey(null);
        setIsAnimating(false);
      }
    }, [data]);

    useEffect(() => {
      if (dataKeys.length > 0) {
        const numericOptions = autoDetectBestNumericKeys(data, isKeyExcluded);
        if (numericOptions.length >= 2) {
          if (!xKey || !numericOptions.includes(xKey)) {
            setXKey(numericOptions[0]);
          }
          if (!yKey || !numericOptions.includes(yKey)) {
            setYKey(numericOptions[1]);
          }
        } else {
          setXKey(null);
          setYKey(null);
        }
      } else {
        setXKey(null);
        setYKey(null);
      }
    }, [data, dataKeys, numericKeys]);

    // Scatter plots typically don't use 'aggregate' or 'groupBy' in the same way
    // as bar/line charts, so we'll simplify the data transformation here.
    // The component will just use the raw data directly, assuming xKey and yKey
    // represent direct numerical values.
    useEffect(() => {
      if (data && data.length > 0 && xKey && yKey) {
        setGraphData(data); // For scatter, often raw data is sufficient with correct X/Y mappings
        setIsAnimating(false);
      } else {
        setGraphData([]);
        setIsAnimating(false);
      }
    }, [data, xKey, yKey]);

    const numericOptions = autoDetectBestNumericKeys(data, isKeyExcluded);

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
              {label ? formatKey(label) : "Data Point"}
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

    if (!xKey || !yKey || !graphData.length) {
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
            <ScatterChartIconLucide size={48} color="white" />
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
            Please select two numeric data points to create a scatter plot.
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
                <ScatterChart
                  margin={{
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 6"
                    stroke={`${theme.colors.accent}33`}
                    opacity={0.8}
                  />
                  <XAxis
                    type="number"
                    dataKey={xKey}
                    name={formatKey(xKey)}
                    tickLine={false}
                    axisLine={{
                      stroke: `${theme.colors.accent}4D`,
                      strokeWidth: 2,
                    }}
                    style={{
                      fontSize: "13px",
                      fontWeight: theme.typography.weight.medium,
                      fontFamily: theme.typography.fontFamily,
                      fill: theme.colors.textSecondary,
                    }}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <YAxis
                    type="number"
                    dataKey={yKey}
                    name={formatKey(yKey)}
                    tickLine={false}
                    axisLine={{
                      stroke: `${theme.colors.accent}4D`,
                      strokeWidth: 2,
                    }}
                    style={{
                      fontSize: "13px",
                      fontWeight: theme.typography.weight.medium,
                      fontFamily: theme.typography.fontFamily,
                      fill: theme.colors.textSecondary,
                    }}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 6" }}
                    content={<ModernTooltip />}
                  />
                  <Scatter
                    name="Data"
                    data={graphData}
                    fill={theme.colors.accent}
                    opacity={0.7}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default DynamicScatterGraph;
