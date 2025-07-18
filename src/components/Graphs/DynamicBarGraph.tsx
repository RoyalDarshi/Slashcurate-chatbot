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
  graphKey?: string;
  data: any[];
  groupBy: string | null;
  setGroupBy: React.Dispatch<React.SetStateAction<string | null>>;
  aggregate: "sum" | "count" | "avg" | "min" | "max";
  setAggregate: React.Dispatch<
    React.SetStateAction<"sum" | "count" | "avg" | "min" | "max">
  >;
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
    graphKey,
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
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
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
    const numericKeys = dataKeys.filter((key) =>
      data.some((item) => {
        const val = item[key];
        return (
          typeof val === "number" ||
          (typeof val === "string" && !isNaN(parseFloat(val)))
        );
      })
    );

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
    }, [
      data,
      dataKeys,
      numericKeys,
      groupBy,
      setGroupBy,
      setValueKey,
      valueKey,
    ]);

    useEffect(() => {
      if (aggregate !== "count") {
        if (!valueKey || !validValueKeys.includes(valueKey)) {
          setValueKey(validValueKeys.length > 0 ? validValueKeys[0] : null);
        }
      } else {
        setValueKey(null);
      }
    }, [aggregate, validValueKeys, valueKey, setValueKey]);

    function transformDynamicData(
      rawData: any[],
      selectedGroupBy: string | null,
      selectedAggregate: "sum" | "count" | "avg" | "min" | "max",
      selectedValueKey: string | null
    ) {
      if (!rawData || rawData.length === 0) {
        return { data: [], keys: [], indexBy: "" };
      }

      const sample = rawData[0];
      const keys = Object.keys(sample);

      // Find numeric keys
      const numericKeys = keys.filter((k) => {
        const val = sample[k];
        return val !== null && val !== "" && !isNaN(Number(val));
      });

      const effectiveValueKey =
        selectedValueKey && numericKeys.includes(selectedValueKey)
          ? selectedValueKey
          : numericKeys[0];

      if (!effectiveValueKey && selectedAggregate !== "count") {
        return { data: [], keys: [], indexBy: "" };
      }

      // Find string keys for grouping and stacking
      let stringKeys = keys.filter(
        (k) => typeof sample[k] === "string" && k !== effectiveValueKey
      );

      if (stringKeys.length === 0) {
        rawData = rawData.map((item, idx) => ({
          ...item,
          label: `Item ${idx + 1}`,
        }));
        stringKeys = ["label"];
      }

      // Determine indexByKey and stackByKey (mimicking ChatDynamicGraph.tsx logic)
      let indexByKey: string;
      let stackByKey: string | null;

      if (selectedGroupBy && stringKeys.includes(selectedGroupBy)) {
        indexByKey = selectedGroupBy;
        stackByKey = stringKeys.find((k) => k !== selectedGroupBy) || null;
      } else if (stringKeys.includes("branch_name")) {
        indexByKey = "branch_name";
        stackByKey = stringKeys.find((k) => k !== "branch_name") || null;
      } else {
        indexByKey = stringKeys[0];
        stackByKey = stringKeys.length > 1 ? stringKeys[1] : null;
      }

      if (!indexByKey) {
        return { data: [], keys: [], indexBy: "" };
      }

      // Get unique stack values
      const allStackValues = stackByKey
        ? [...new Set(rawData.map((row) => row[stackByKey]))].filter(
            (v) => v !== undefined && v !== null
          )
        : ["value"];

      // Group and aggregate data
      const grouped = rawData.reduce((acc, row) => {
        const label = row[indexByKey];
        const stack = stackByKey ? row[stackByKey] : "value";
        const value =
          selectedAggregate === "count"
            ? 1
            : Number(row[effectiveValueKey] || 0);

        if (!acc[label]) {
          acc[label] = { [indexByKey]: label };
          allStackValues.forEach((type) => (acc[label][type] = 0));
        }

        if (selectedAggregate === "count") {
          acc[label][stack] = (acc[label][stack] || 0) + 1;
        } else if (selectedAggregate === "avg") {
          acc[label][stack] = (acc[label][stack] || 0) + value;
          acc[label][`${stack}_count`] =
            (acc[label][`${stack}_count`] || 0) + 1;
        } else if (selectedAggregate === "min") {
          acc[label][stack] =
            acc[label][stack] !== undefined
              ? Math.min(acc[label][stack], value)
              : value;
        } else if (selectedAggregate === "max") {
          acc[label][stack] =
            acc[label][stack] !== undefined
              ? Math.max(acc[label][stack], value)
              : value;
        } else {
          // sum
          acc[label][stack] = (acc[label][stack] || 0) + value;
        }

        return acc;
      }, {});

      // Finalize data (handle averages)
      const finalData = Object.values(grouped).map((item: any) => {
        const newItem = { ...item };
        if (selectedAggregate === "avg") {
          allStackValues.forEach((stack) => {
            const count = newItem[`${stack}_count`] || 1;
            newItem[stack] = newItem[stack] / count;
            delete newItem[`${stack}_count`];
          });
        }
        return newItem;
      });

      return {
        data: finalData,
        keys: allStackValues,
        indexBy: indexByKey,
      };
    }

    useEffect(() => {
      if (data && data.length > 0 && groupBy) {
        setIsAnimating(true);
        try {
          const {
            data: processedData,
            keys: processedKeys,
            indexBy,
          } = transformDynamicData(data, groupBy, aggregate, valueKey);
          setGraphData([...processedData]);
          setXKey(indexBy);
          setYKeys(processedKeys);
          setTimeout(() => setIsAnimating(false), 300);
        } catch (error) {
          console.error("Data processing error:", error);
          setGraphData([]);
          setXKey(null);
          setYKeys([]);
          setTimeout(() => setIsAnimating(false), 300);
        }
      } else {
        setGraphData([]);
        setXKey(null);
        setYKeys([]);
        setIsAnimating(false);
      }
    }, [data, groupBy, aggregate, valueKey]);

    const ModernTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
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
              <ResponsiveContainer key={graphKey} width="100%" height="100%">
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
                      />
                      <stop
                        offset="50%"
                        stopColor={`${theme.colors.accent}0D`}
                      />
                      <stop
                        offset="100%"
                        stopColor={`${theme.colors.accent}1A`}
                      />
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
                      isAnimationActive={true}
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