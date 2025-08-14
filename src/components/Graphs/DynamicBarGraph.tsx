import React, { useState, useEffect, useRef, useCallback } from "react";
import * as echarts from "echarts";
import ReactECharts from "echarts-for-react";
import { BarChart3, TrendingUp, Download } from "lucide-react";
import { useTheme } from "../../ThemeContext"; // Corrected import path
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

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number = 1): string => {
  hex = hex.replace("#", "");
  const r = parseInt(
    hex.length === 3 ? hex.slice(0, 1).repeat(2) : hex.slice(0, 2),
    16
  );
  const g = parseInt(
    hex.length === 3 ? hex.slice(1, 2).repeat(2) : hex.slice(2, 4),
    16
  );
  const b = parseInt(
    hex.length === 3 ? hex.slice(2, 3).repeat(2) : hex.slice(4, 6),
    16
  );
  return `rgba(${r},${g},${b},${alpha})`;
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
    const [showResolutionOptions, setShowResolutionOptions] = useState(false);

    const [graphData, setGraphData] = useState<any[]>([]);
    const [xKey, setXKey] = useState<string | null>(null);
    const [yKeys, setYKeys] = useState<string[]>([]);

    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Function to handle graph download
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
              // Make sure all SVG elements are properly rendered
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
      const keys = Object.keys(sample[0]);

      // ✅ Priority check for branch_name
      if (
        keys.includes("branch_name") &&
        !excludeFn("branch_name") &&
        new Set(sample.map((row) => row["branch_name"]).filter(Boolean)).size >
          1
      ) {
        return "branch_name";
      }

      const scores: Record<string, number> = {};

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

    const xTickRotation = graphData.length > 8 ? 45 : 0; // Positive for ECharts
    console.log("Rendering graph with", { xKey, yKeys, graphData });

    // Define ECharts option
    const option = {
      animationDuration: 1200,
      animationEasing: "cubicOut",
      grid: {
        left: "3%",
        right: "4%",
        bottom: graphData.length > 8 ? "20%" : "10%",
        top: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: graphData.map((d) => {
          const value = d[xKey];
          return value.length > 14
            ? value.slice(0, 12) + "…"
            : formatKey(value);
        }),
        axisTick: { show: false },
        axisLine: {
          lineStyle: {
            color: `${theme.colors.accent}4D`,
            width: 2,
          },
        },
        axisLabel: {
          rotate: xTickRotation,
          align: xTickRotation > 0 ? "right" : "center",
          fontSize: 13,
          fontWeight: theme.typography.weight.medium,
          fontFamily: theme.typography.fontFamily,
          color: theme.colors.textSecondary,
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        axisTick: { show: false },
        axisLine: {
          lineStyle: {
            color: `${theme.colors.accent}4D`,
            width: 2,
          },
        },
        axisLabel: {
          fontSize: 13,
          fontWeight: theme.typography.weight.medium,
          fontFamily: theme.typography.fontFamily,
          color: theme.colors.textSecondary,
        },
        splitLine: {
          lineStyle: {
            type: "dashed",
            color: `${theme.colors.accent}33`,
            opacity: 0.8,
          },
        },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
          shadowStyle: {
            color: `${theme.colors.accent}1A`,
            borderColor: `${theme.colors.accent}4D`,
            borderWidth: 2,
          },
        },
        backgroundColor: "transparent",
        borderWidth: 0,
        padding: 0,
        extraCssText: `box-shadow: none;`,
        formatter: (params: any) => {
          if (!params || params.length === 0) return "";
          const label = formatKey(params[0].axisValue);
          const accentColor = params[0].color || theme.colors.accent;
          let html = `
            <div style="
              padding: ${theme.spacing.lg};
              background: ${theme.colors.surface};
              backdrop-filter: blur(20px) saturate(180%);
              -webkit-backdrop-filter: blur(20px) saturate(180%);
              color: ${theme.colors.text};
              font-size: 14px;
              border-radius: ${theme.borderRadius.large};
              box-shadow: ${theme.shadow.lg};
              border: 1px solid ${theme.colors.border};
              font-family: ${theme.typography.fontFamily};
              min-width: 200px;
              max-width: 280px;
              position: relative;
              overflow: hidden;
            ">
              <div style="
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: ${theme.gradients.primary};
              "></div>
              <div style="
                margin-bottom: ${theme.spacing.md};
                font-weight: ${theme.typography.weight.bold};
                color: ${theme.colors.text};
                font-size: 16px;
                display: flex;
                align-items: center;
                gap: ${theme.spacing.sm};
              ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${theme.colors.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                </svg>
                ${label}
              </div>
          `;
          params.forEach((entry: any, index: number) => {
            if (entry.value <= 0) return;
            html += `
              <div style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: ${
                  index < params.length - 1 ? theme.spacing.md : 0
                };
                padding: ${theme.spacing.md};
                border-radius: ${theme.borderRadius.default};
                background: ${entry.color}15;
                border: 1px solid ${entry.color}30;
                transition: all 0.2s ease;
              ">
                <div style="display: flex; align-items: center;">
                  <div style="
                    width: 14px;
                    height: 14px;
                    background: ${entry.color};
                    border-radius: 50%;
                    margin-right: ${theme.spacing.md};
                    box-shadow: ${theme.shadow.sm};
                    border: 2px solid ${theme.colors.surface};
                  "></div>
                  <span style="
                    font-weight: ${theme.typography.weight.medium};
                    font-size: 14px;
                  ">${formatKey(entry.seriesName)}</span>
                </div>
                <span style="
                  font-weight: ${theme.typography.weight.bold};
                  color: ${theme.colors.text};
                  font-size: 15px;
                  background: ${theme.gradients.primary};
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  background-clip: text;
                ">${entry.value.toLocaleString()}</span>
              </div>
            `;
          });
          html += `</div>`;
          return html;
        },
      },
      series: yKeys.map((key, keyIndex) => ({
        name: formatKey(key),
        type: "bar",
        stack: "a",
        data: graphData.map((d) => (Number(d[key]) > 0 ? Number(d[key]) : 0)),
        barCategoryGap: "25%",
        barGap: "6%",
        itemStyle: (params: any) => {
          const { dataIndex } = params;
          const payload = graphData[dataIndex];
          const topMostKey = [...yKeys]
            .reverse()
            .find((k) => Number(payload[k]) > 0);
          const isTopBar = key === topMostKey;
          const solidColor =
            theme.colors.barColors[keyIndex % theme.colors.barColors.length];
          const radius = 8; // Fixed radius for simplicity
          return {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: hexToRgba(solidColor, 1) },
              { offset: 1, color: hexToRgba(solidColor, 0.7) },
            ]),
            borderColor: theme.colors.surfaceGlass,
            borderWidth: 1,
            barBorderRadius: isTopBar ? [radius, radius, 0, 0] : [0, 0, 0, 0],
          };
        },
      })),
    };

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
                  ref={dropdownRef} // ✅ HERE
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
              <ReactECharts
                option={option}
                style={{ height: "100%", width: "100%" }}
                notMerge={true}
                lazyUpdate={true}
              />
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
