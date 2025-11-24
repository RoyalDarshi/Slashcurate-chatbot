import React, { useState, useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { BarChart3, Download } from "lucide-react";
import { useTheme } from "../../ThemeContext";
import html2canvas from "html2canvas";

interface ModernBarGraphProps {
  data: any[];
  groupBy: string | null;
  setGroupBy: React.Dispatch<React.SetStateAction<string | null>>;
  aggregate: "sum" | "count" | "avg" | "min" | "max";
  setAggregate: React.Dispatch<React.SetStateAction<"sum" | "count" | "avg" | "min" | "max">>;
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

// Helper function to format keys
export function formatKey(key: any): string {
  if (key === null || key === undefined) return "";
  const stringKey = String(key);
  return stringKey
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

const DynamicBarGraph: React.FC<ModernBarGraphProps> = React.memo(
  ({
    data,
    groupBy,
    aggregate,
    valueKey,
  }) => {
    const { theme } = useTheme();
    const [showResolutionOptions, setShowResolutionOptions] = useState(false);
    const [graphData, setGraphData] = useState<any[]>([]);
    const [xKey, setXKey] = useState<string | null>(null);
    const [yKeys, setYKeys] = useState<string[]>([]);
    const [isValidGraphData, setIsValidGraphData] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const isVertical = true; // Bar graphs are always vertical

    // Transform data logic (from ChatDynamicGraph)
    function transformDynamicData(rawData: any[]) {
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
        valueKey && numericKeys.includes(valueKey) ? valueKey : numericKeys[0];

      if (!effectiveValueKey && aggregate !== "count") {
        return { data: [], keys: [], indexBy: "" };
      }

      // Find string keys for grouping and indexing
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

      // Use groupBy as indexByKey if valid, else default to first string key
      let indexByKey: string;
      let effectiveGroupBy: string | null | undefined = null;

      if (groupBy && stringKeys.includes(groupBy)) {
        indexByKey = groupBy;
        effectiveGroupBy = stringKeys.find((k) => k !== indexByKey) || null;
      } else if (stringKeys.includes("branch_name")) {
        indexByKey = "branch_name";
        effectiveGroupBy = stringKeys.find((k) => k !== "branch_name") || null;
      } else {
        indexByKey = stringKeys[0];
        effectiveGroupBy =
          stringKeys.length > 1
            ? stringKeys.find((k) => k !== indexByKey)
            : null;
      }

      if (!indexByKey) {
        return { data: [], keys: [], indexBy: "" };
      }

      // For bar charts, handle stacking
      const allGroupValues = effectiveGroupBy
        ? [...new Set(rawData.map((row) => row[effectiveGroupBy]))]
        : ["value"];

      const grouped = rawData.reduce((acc, row) => {
        const label = row[indexByKey];
        const group = effectiveGroupBy ? row[effectiveGroupBy] : "value";
        const value = Number(row[effectiveValueKey]);

        if (!acc[label]) {
          acc[label] = { [indexByKey]: label };
          allGroupValues.forEach((type) => (acc[label][type] = 0));
        }

        if (aggregate === "count") {
          acc[label][group] += 1;
        } else if (aggregate === "avg") {
          acc[label][group] += value;
          acc[label][`${group}_count`] =
            (acc[label][`${group}_count`] || 0) + 1;
        } else if (aggregate === "min") {
          acc[label][group] = acc[label][group]
            ? Math.min(acc[label][group], value)
            : value;
        } else if (aggregate === "max") {
          acc[label][group] = acc[label][group]
            ? Math.max(acc[label][group], value)
            : value;
        } else {
          acc[label][group] += value; // Default to sum
        }

        return acc;
      }, {});

      const finalData = Object.values(grouped).map((item: any) => {
        const newItem = { ...item };
        if (aggregate === "avg") {
          allGroupValues.forEach((group) => {
            const count = item[`${group}_count`] || 1;
            newItem[group] = item[group] / count;
            delete newItem[`${group}_count`];
          });
        }
        return newItem;
      });

      return {
        data: finalData,
        keys: allGroupValues,
        indexBy: indexByKey,
      };
    }

    // Process data when inputs change
    useEffect(() => {
      const processApiData = (dataset: any[]) => {
        try {
          const {
            data: processedData,
            keys: processedKeys,
            indexBy,
          } = transformDynamicData(dataset);

          if (
            !processedData.length ||
            !indexBy ||
            !processedKeys.length
          ) {
            setIsValidGraphData(false);
            return;
          }

          const hasValidNumericData = processedData.some((item) =>
            processedKeys.some((key) => {
              const value = item[key];
              return !isNaN(Number(value)) && Number(value) !== 0;
            })
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
    }, [data, groupBy, aggregate, valueKey]);

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

    if (!isValidGraphData || !xKey || yKeys.length === 0) {
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

    // Automatic axis label rotation based on data count
    const xTickRotation = isVertical && graphData.length > 8 ? 45 : 0;

    // Get chart options (from ChatDynamicGraph)
    const getOption = () => {
      const legendCountThreshold = 5;
      const showLegend = yKeys.length <= legendCountThreshold;

      const baseOption = {
        animation: false,
        color: theme.colors.barColors,
        tooltip: {
          trigger: "item",
          confine: true,
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
            if (!params) return "";
            let payload = Array.isArray(params) ? params : [params];
            payload = payload.filter(
              (p: any) => p.value !== 0 && p.value !== undefined
            );
            if (payload.length === 0) return "";

            const label = formatKey(
              isVertical
                ? payload[0].axisValue
                : payload[0].name || payload[0].axisValue
            );

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

            payload.forEach((entry: any, index: number) => {
              const value = entry.value;
              html += `
                <div style="
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  margin-bottom: ${index < payload.length - 1 ? theme.spacing.md : 0};
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
                  ">${Number(value).toLocaleString()}</span>
                </div>
              `;
            });
            html += `</div>`;
            return html;
          },
        },
        legend: showLegend
          ? {
            orient: "horizontal",
            left: "center",
            bottom: 0,
            textStyle: {
              fontSize: 13,
              fontFamily: theme.typography.fontFamily,
              fontWeight: theme.typography.weight.medium,
              color: theme.colors.text,
            },
            icon: "circle",
            itemWidth: 14,
            itemHeight: 14,
            formatter: (name: string) => formatKey(name),
          }
          : { show: false },
      };

      const xAxisConfig = {
        type: isVertical ? "category" : "value",
        data: isVertical
          ? graphData.map((d) => {
            const value = d[xKey];
            const formattedValue = formatKey(value);
            return formattedValue.length > 14
              ? formattedValue.slice(0, 12) + "…"
              : formattedValue;
          })
          : undefined,
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
      };

      const yAxisConfig = {
        type: isVertical ? "value" : "category",
        data: !isVertical
          ? graphData.map((d) => {
            const value = d[xKey];
            const formattedValue = formatKey(value);
            return formattedValue.length > 14
              ? formattedValue.slice(0, 12) + "…"
              : formattedValue;
          })
          : undefined,
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
      };

      return {
        ...baseOption,
        grid: {
          left: "3%",
          right: "4%",
          bottom: showLegend ? 30 : 10,
          top: "3%",
          containLabel: true,
        },
        xAxis: xAxisConfig,
        yAxis: yAxisConfig,
        series: yKeys.map((key) => {
          const barCount = graphData.length;
          const isFewBars = barCount <= 3;

          const seriesBase = {
            name: formatKey(key),
            type: "bar",
            stack: "a", // Enable stacking
            data: graphData.map((d) => (Number(d[key]) > 0 ? Number(d[key]) : 0)),
            barCategoryGap: isFewBars ? "40%" : "10%",
            barGap: isFewBars ? "20%" : "6%",
            barWidth:
              barCount === 1
                ? 60
                : barCount === 2
                  ? 60
                  : barCount === 3
                    ? 50
                    : undefined,
            emphasis: {
              disabled: true,
              scale: false,
            },
            itemStyle: (params: any) => {
              const { dataIndex, color } = params;
              const payload = graphData[dataIndex];
              const topMostKey = [...yKeys]
                .reverse()
                .find((k) => Number(payload[k]) > 0);
              const isTopBar = key === topMostKey;
              const solidColor = color;
              const radius = 6;
              return {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: hexToRgba(solidColor, 1) },
                  { offset: 1, color: hexToRgba(solidColor, 0.7) },
                ]),
                borderColor: theme.colors.surfaceGlass,
                borderWidth: 1,
                borderRadius: isVertical
                  ? isTopBar
                    ? [radius, radius, 0, 0]
                    : [0, 0, 0, 0]
                  : isTopBar
                    ? [0, radius, radius, 0]
                    : [0, 0, 0, 0],
              };
            },
          };
          return seriesBase;
        }),
      };
    };

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
          {/* Header managed by DashboardView */}
          <div
            style={{
              background: theme.gradients.glass,
              backdropFilter: "blur(20px)",
              borderBottom: `1px solid ${theme.colors.border}`,
            }}
          ></div>

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
              style={{
                height: "calc(100vh - 265px)",
                width: "100%",
                minHeight: "300px",
                flex: 1,
                position: "relative",
              }}
            >
              <ReactECharts
                option={getOption()}
                style={{ height: "100%", width: "100%" }}
                notMerge={true}
                lazyUpdate={true}
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.data === nextProps.data &&
      prevProps.groupBy === nextProps.groupBy &&
      prevProps.aggregate === nextProps.aggregate &&
      prevProps.valueKey === nextProps.valueKey
    );
  }
);

export default DynamicBarGraph;
