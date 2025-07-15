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
import { BarChart3, TrendingUp, Download } from "lucide-react";
import { useTheme } from "../../ThemeContext";
import html2canvas from "html2canvas";

interface ModernBarGraphProps {
  data: any[];
  groupBy: string | null;
  setGroupBy: React.Dispatch<React.SetStateAction<string | null>>;
  aggregate: "sum" | "count";
  setAggregate: React.Dispatch<React.SetStateAction<"sum" | "count">>;
  valueKey: string | null;
  setValueKey: React.Dispatch<React.SetStateAction<string | null>>;
}

const ModernBarShape = (props: any) => {
  const { theme } = useTheme();
  const {
    x,
    y,
    width,
    height,
    dataKey,
    payload,
    yKeys,
    index: groupIndex,
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

  const gradientId = `gradient-${groupIndex}-${keyIndex}`;

  if (value <= 0) return null;

  const barGradient = `linear-gradient(135deg, ${solidColor} 0%, ${solidColor}cc 100%)`;

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
          stroke={theme.colors.surfaceGlass}
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
          stroke={theme.colors.surfaceGlass}
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
    const { theme } = useTheme();
    const [isAnimating, setIsAnimating] = useState(false);
    const [showResolutionOptions, setShowResolutionOptions] = useState(false);

    const [graphData, setGraphData] = useState<any[]>([]);
    const [xKey, setXKey] = useState<string | null>(null);
    const [yKeys, setYKeys] = useState<string[]>([]);

    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleDownloadGraph = async (resolution: "low" | "high") => {
      console.log("Resolution:", resolution);
      console.log("Container Ref:", containerRef.current);
      if (containerRef.current) {
        try {
          console.log("Inside handleDownloadGraph");
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
          link.download = `bar_graph_${resolution}.png`;
          link.click();
        } catch (error) {
          console.error("Error downloading graph:", error);
        }
      }
      setShowResolutionOptions(false);
    };

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

        if (uniqueCount <= 1 || uniqueCount > sampleSize * 0.6) return;

        const nullCount =
          values.length < sampleSize ? sampleSize - values.length : 0;
        const nullPenalty = nullCount / sampleSize;

        scores[key] = 1 / (uniqueCount + nullPenalty * 10);
      });

      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      return sorted.length ? sorted[0][0] : null;
    };

    useEffect(() => {
      if (!data || data.length === 0) {
        setGraphData([]);
        setXKey(null);
        setYKeys([]);
        setIsAnimating(false);
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

      // Detect an additional string key for stacking (similar to effectiveGroupBy in ChatDynamicGraph)
      const stringKeys = Object.keys(rawData[0] || {}).filter(
        (k) =>
          typeof rawData[0][k] === "string" &&
          k !== selectedGroupBy &&
          !isKeyExcluded(k)
      );
      const stackBy = stringKeys.length > 0 ? stringKeys[0] : null;

      if (selectedAggregate === "sum" && stackBy) {
        // Stacked bar logic
        const uniqueStackValues = [
          ...new Set(rawData.map((row) => row[stackBy])),
        ];

        const groupedData = rawData.reduce((acc, row) => {
          const group = row[groupByToUse];
          const stack = row[stackBy];
          const value = parseFloat(row[valueKeyToUse]) || 0;

          if (!acc[group]) {
            acc[group] = { [groupByToUse]: group };
            uniqueStackValues.forEach((sVal) => (acc[group][sVal] = 0));
          }

          acc[group][stack] += value;

          return acc;
        }, {});

        return {
          data: Object.values(groupedData),
          keys: uniqueStackValues,
          indexBy: groupByToUse,
        };
      } else {
        // Single series logic (for "count" or when no stackBy is available)
        const groupedData = rawData.reduce((acc, row) => {
          const group = row[groupByToUse];
          const value = selectedAggregate === "sum" ? parseFloat(row[valueKeyToUse]) || 0 : 1;

          if (!acc[group]) {
            acc[group] = { [groupByToUse]: group, value: 0 };
          }

          acc[group].value += value;

          return acc;
        }, {});

        return {
          data: Object.values(groupedData),
          keys: ["value"],
          indexBy: groupByToUse,
        };
      }
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

    const ModernTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const accentColor = payload[0]?.color || theme.colors.accent;
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
                    background: `${entry.color}15`,
                    border: `1px solid ${entry.color}30`,
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

    if (!xKey || yKeys.length === 0 || !graphData.length) {
      console.log("No valid data for rendering");
      return (
        <div
          className="flex flex-col items-center justify-center h-full p-12"
          style={{
            background: theme.colors.surface,
            backdropFilter: "blur(20px)",
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
            background: theme.colors.surface,
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            overflow: "hidden",
            transition: "all 0.4s ease",
          }}
        >
          <div
            style={{
              background: theme.gradients.glass,
              backdropFilter: "blur(20px)",
              borderBottom: `1px solid ${theme.colors.border}`,
            }}
          >
          </div>

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
                <BarChart data={graphData} barCategoryGap="25%" barGap={6}>
                  <defs>
                    <linearGradient
                      id="gridGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor={`${theme.colors.accent}1A`} />
                      <stop offset="50%" stopColor={`${theme.colors.accent}0D`} />
                      <stop offset="100%" stopColor={`${theme.colors.accent}1A`} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 6"
                    vertical={false}
                    stroke={`${theme.colors.accent}33`}
                    opacity={0.8}
                  />
                  <XAxis
                    dataKey={xKey}
                    tickLine={false}
                    axisLine={{
                      stroke: `${theme.colors.accent}4D`,
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
                      stroke: `${theme.colors.accent}4D`,
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
                      fill: `${theme.colors.accent}1A`,
                      stroke: `${theme.colors.accent}4D`,
                      strokeWidth: 2,
                      radius: 8,
                    }}
                    content={<ModernTooltip />}
                  />
                  {yKeys.map((key, keyIndex) => (
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
                          keyIndex={keyIndex}
                        />
                      )}
                      animationDuration={1200}
                      animationEasing="ease-out"
                      animationBegin={keyIndex * 150}
                    />
                  ))}
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