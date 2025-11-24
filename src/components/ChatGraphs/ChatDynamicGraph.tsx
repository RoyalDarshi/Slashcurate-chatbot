// ChatDynamicGraph.tsx
import React, { useState, useEffect, useRef } from "react";
import * as echarts from "echarts";
import ReactECharts from "echarts-for-react";
import { BarChart3 } from "lucide-react";
import { useTheme } from "../../ThemeContext";

interface DynamicGraphProps {
  data: any[];
  isValidGraph: (validData: boolean) => void;
  chartType:
  | "bar"
  | "line"
  | "pie"
  | "area"
  | "scatter"
  | "radar"
  | "funnel"
  | "treemap";
  groupBy: string | null;
  aggregate: "sum" | "count" | "avg" | "min" | "max" | null;
  valueKey: string | null;
  isVertical?: boolean;
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

export function formatKey(key: any): string {
  if (key === null || key === undefined) return "";
  const stringKey = String(key);
  return stringKey
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

const DynamicGraph: React.FC<DynamicGraphProps> = React.memo(
  ({
    data,
    isValidGraph,
    chartType,
    groupBy,
    aggregate,
    valueKey,
    isVertical: propIsVertical = true,
  }) => {
    const { theme } = useTheme();
    const [graphData, setGraphData] = useState<any[]>([]);
    const [xKey, setXKey] = useState<string | null>(null);
    const [yKeys, setYKeys] = useState<string[]>([]);
    const [isValidGraphData, setIsValidGraphData] = useState<boolean>(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const isVertical = chartType === "bar" ? propIsVertical : true;

    // Resize observer for container
    useEffect(() => {
      if (!containerRef.current) return;

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect) {
            // Update dimensions if needed
          }
        }
      });

      observer.observe(containerRef.current);
      return () => {
        if (containerRef.current) observer.unobserve(containerRef.current);
      };
    }, []);

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

      if (!effectiveValueKey) {
        setIsValidGraphData(false);
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

      console.log(
        "transformDynamicData - indexByKey:",
        indexByKey,
        "effectiveGroupBy:",
        effectiveGroupBy
      );

      if (!indexByKey) {
        setIsValidGraphData(false);
        return { data: [], keys: [], indexBy: "" };
      }

      if (
        chartType === "pie" ||
        chartType === "funnel" ||
        chartType === "treemap"
      ) {
        const grouped = rawData.reduce((acc, row) => {
          const group = row[indexByKey];
          const value = Number(row[effectiveValueKey]);

          if (!acc[group]) {
            acc[group] = { [indexByKey]: group, value: 0, count: 0 };
          }

          if (aggregate === "count") {
            acc[group].count += 1;
            acc[group].value = acc[group].count;
          } else if (aggregate === "avg") {
            acc[group].value += value;
            acc[group].count += 1;
            acc[group].value = acc[group].count
              ? acc[group].value / acc[group].count
              : 0;
          } else if (aggregate === "min") {
            acc[group].value = acc[group].value
              ? Math.min(acc[group].value, value)
              : value;
          } else if (aggregate === "max") {
            acc[group].value = acc[group].value
              ? Math.max(acc[group].value, value)
              : value;
          } else {
            acc[group].value += value; // Default to sum
          }

          return acc;
        }, {});

        const transformedData = Object.values(grouped);
        return {
          data: transformedData,
          keys: ["value"],
          indexBy: indexByKey,
        };
      } else if (chartType === "radar") {
        // Radar charts require multiple numeric keys as indicators
        const indicatorKeys =
          numericKeys.length >= 2 ? numericKeys : [effectiveValueKey];
        const grouped = rawData.reduce((acc, row) => {
          const label = row[indexByKey];
          if (!acc[label]) {
            acc[label] = { [indexByKey]: label, values: {}, count: {} };
            indicatorKeys.forEach((key) => {
              acc[label].values[key] = 0;
              acc[label].count[key] = 0;
            });
          }

          indicatorKeys.forEach((key) => {
            const value = Number(row[key]) || 0;
            if (aggregate === "count") {
              acc[label].values[key] += 1;
            } else if (aggregate === "avg") {
              acc[label].values[key] += value;
              acc[label].count[key] += 1;
            } else if (aggregate === "min") {
              acc[label].values[key] = acc[label].values[key]
                ? Math.min(acc[label].values[key], value)
                : value;
            } else if (aggregate === "max") {
              acc[label].values[key] = acc[label].values[key]
                ? Math.max(acc[label].values[key], value)
                : value;
            } else {
              acc[label].values[key] += value; // Default to sum
            }
          });

          return acc;
        }, {});

        const finalData = Object.values(grouped).map((item: any) => {
          const newItem = { ...item };
          if (aggregate === "avg") {
            indicatorKeys.forEach((key) => {
              newItem.values[key] = newItem.count[key]
                ? newItem.values[key] / newItem.count[key]
                : 0;
            });
            delete newItem.count;
          } else {
            delete newItem.count;
          }
          return newItem;
        });

        return {
          data: finalData,
          keys: indicatorKeys,
          indexBy: indexByKey,
        };
      }

      // For bar, line, area, and scatter charts
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

    useEffect(() => {
      const processApiData = (dataset: any[]) => {
        try {
          const {
            data: processedData,
            keys: processedKeys,
            indexBy,
          } = transformDynamicData(dataset);

          // For radar charts, require at least one data point and one key
          const isRadarValid =
            chartType === "radar"
              ? processedData.length > 0 && processedKeys.length >= 1
              : true;

          if (
            !processedData.length ||
            !indexBy ||
            !processedKeys.length ||
            !isRadarValid
          ) {
            setIsValidGraphData(false);
            return;
          }

          const hasValidNumericData = processedData.some((item) =>
            processedKeys.some((key) => {
              const value =
                chartType === "radar" ? item.values[key] : item[key];
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
    }, [data, chartType, groupBy, aggregate, valueKey]);

    useEffect(() => {
      isValidGraph(isValidGraphData);
    }, [isValidGraphData, isValidGraph]);

    if (!isValidGraphData || !xKey || yKeys.length === 0) {
      return (
        <div
          className="flex flex-col items-center justify-center h-full p-12"
          style={{
            background: theme.colors.surface,
            backdropFilter: "blur(20px)",
            borderRadius: theme.borderRadius.large,
            minHeight: "300px",
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
            }}
          >
            Insufficient data to create visualizations
          </p>
        </div>
      );
    }

    const xTickRotation = isVertical && graphData.length > 8 ? 45 : 0;
    const yTickRotation = !isVertical && graphData.length > 8 ? 45 : 0;

    const getOption = () => {
      const legendCountThreshold = 5;
      const showLegend =
        chartType === "pie" || chartType === "funnel" || chartType === "treemap"
          ? graphData.length <= legendCountThreshold
          : yKeys.length <= legendCountThreshold;

      const baseOption = {
        animation: false,
        // ✅ Set the global color palette from the theme
        color: theme.colors.barColors,
        tooltip: {
          trigger: chartType === "area" ? "axis" : "item",
          confine: true,
          axisPointer: {
            type:
              chartType === "line" || chartType === "area" ? "line" : "shadow",
            shadowStyle:
              chartType !== "line" &&
                chartType !== "area" &&
                chartType !== "scatter"
                ? {
                  color: `${theme.colors.accent}1A`,
                  borderColor: `${theme.colors.accent}4D`,
                  borderWidth: 2,
                }
                : undefined,
            lineStyle:
              chartType === "line" || chartType === "area"
                ? {
                  color: `${theme.colors.accent}4D`,
                  width: 2,
                }
                : undefined,
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
              chartType === "radar"
                ? payload[0].name
                : isVertical
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
              let value;

              if (chartType === "radar") {
                // For radar, we want to show all indicators with their values
                if (Array.isArray(entry.value)) {
                  // Display all indicators for this radar series
                  entry.value.forEach((val: any, idx: number) => {
                    const indicatorName = yKeys[idx] || `Indicator ${idx + 1}`;
                    const indicatorValue = !isNaN(Number(val)) && val !== null && val !== undefined ? Number(val) : 0;

                    html += `
                      <div style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: ${idx < entry.value.length - 1 || index < payload.length - 1 ? theme.spacing.md : 0};
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
                          ">${formatKey(indicatorName)}</span>
                        </div>
                        <span style="
                          font-weight: ${theme.typography.weight.bold};
                          color: ${theme.colors.text};
                          font-size: 15px;
                          background: ${theme.gradients.primary};
                          -webkit-background-clip: text;
                          -webkit-text-fill-color: transparent;
                          background-clip: text;
                        ">${indicatorValue.toLocaleString()}</span>
                      </div>
                    `;
                  });
                  return; // Skip the regular entry rendering below
                }
              } else {
                value = entry.value;
              }

              // Ensure value is a valid number
              if (value === null || value === undefined || isNaN(Number(value))) {
                value = 0;
              }
              html += `
                <div style="
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  margin-bottom: ${index < payload.length - 1 ? theme.spacing.md : 0
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
            bottom: "1%",
            textStyle: {
              fontSize: 12,
              fontFamily: theme.typography.fontFamily,
              fontWeight: theme.typography.weight.medium,
              color: theme.colors.text,
            },
            icon: "circle",
            itemWidth: 12,
            itemHeight: 12,
            itemGap: 16,
            formatter: (name: string) => formatKey(name),
          }
          : { show: false },
      };

      if (
        chartType === "pie" ||
        chartType === "funnel" ||
        chartType === "treemap"
      ) {
        const seriesConfig =
          chartType === "pie"
            ? {
              name: "Pie",
              type: "pie",
              radius: ["42%", "70%"],
              center: ["50%", "50%"],
              label: {
                show: true,
                formatter: "{b}: {d}%",
                fontSize: 12,
                fontWeight: theme.typography.weight.medium,
                fontFamily: theme.typography.fontFamily,
                color: theme.colors.textSecondary,
              },
              labelLine: { show: true, length: 10, length2: 8 },
            }
            : chartType === "funnel"
              ? {
                name: "Funnel",
                type: "funnel",
                left: "5%",
                top: "5%",
                bottom: showLegend ? "15%" : "5%",
                width: "90%",
                min: 0,
                max: Math.max(...graphData.map((d) => d.value)),
                minSize: "0%",
                maxSize: "100%",
                sort: "descending",
                gap: 2,
                label: {
                  show: true,
                  position: "inside",
                  formatter: "{b}",
                  fontSize: 12,
                  fontWeight: theme.typography.weight.medium,
                  fontFamily: theme.typography.fontFamily,
                  color: "#fff",
                },
              }
              : {
                name: "Treemap",
                type: "treemap",
                left: "1%",
                top: "1%",
                right: "1%",
                bottom: showLegend ? "12%" : "1%",
                leafDepth: 1,
                levels: [
                  {
                    itemStyle: {
                      borderColor: theme.colors.surface,
                      borderWidth: 2,
                      gapWidth: 2,
                    },
                  },
                ],
                label: {
                  show: true,
                  formatter: "{b}: {c}",
                  fontSize: 12,
                  fontWeight: theme.typography.weight.medium,
                  fontFamily: theme.typography.fontFamily,
                  color: "#ffffff",
                },
              };

        return {
          ...baseOption,
          grid: undefined,
          xAxis: undefined,
          yAxis: undefined,
          series: [
            {
              ...seriesConfig,
              // ✅ Removed explicit itemStyle color, it will now inherit from the global palette
              data: graphData.map((d) => ({
                value: d.value,
                name: formatKey(d[xKey]),
              })),
            },
          ],
        };
      } else if (chartType === "radar") {
        const maxValues = yKeys.map((key) => {
          return Math.max(
            ...graphData.map((d) =>
              Number(d.values && d.values[key] ? d.values[key] : 0)
            ),
            1 // Ensure minimum max value
          );
        });
        const maxValue = Math.max(...maxValues, 10); // Minimum max for visibility

        return {
          ...baseOption,
          grid: undefined,
          xAxis: undefined,
          yAxis: undefined,
          radar: {
            center: ["50%", "50%"],
            radius: "65%",
            indicator: yKeys.map((key) => ({
              name: formatKey(key),
              max: maxValue,
            })),
            axisName: {
              color: theme.colors.textSecondary,
              fontSize: 12,
              fontWeight: theme.typography.weight.medium,
              fontFamily: theme.typography.fontFamily,
            },
            splitArea: {
              show: true,
              areaStyle: {
                color: [`${theme.colors.accent}10`, `${theme.colors.accent}05`],
              },
            },
            splitLine: {
              lineStyle: {
                color: `${theme.colors.accent}33`,
              },
            },
          },
          series: [
            {
              type: "radar",
              data: graphData.map((d) => ({
                value: yKeys.map((key) => {
                  const val = d.values && d.values[key] ? d.values[key] : 0;
                  return !isNaN(Number(val)) && val !== null && val !== undefined ? Number(val) : 0;
                }),
                name: formatKey(d[xKey]),
              })),
              symbolSize: 8,
              lineStyle: {
                width: 2,
              },
              areaStyle: {
                opacity: 0.2,
              },
            },
          ],
        };
      }

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
          fontSize: 12,
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
          rotate: yTickRotation,
          align: yTickRotation > 0 ? "right" : "center",
          fontSize: 12,
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
          left: "1%",
          right: "1%",
          bottom: showLegend ? "12%" : "3%",
          top: "2%",
          containLabel: true,
        },
        xAxis: chartType !== "scatter" ? xAxisConfig : {
          type: "category",
          data: graphData.map((d) => {
            const value = d[xKey];
            const formattedValue = formatKey(value);
            return formattedValue.length > 14
              ? formattedValue.slice(0, 12) + "…"
              : formattedValue;
          }),
          axisTick: { show: false },
          axisLine: {
            lineStyle: {
              color: `${theme.colors.accent}4D`,
              width: 2,
            },
          },
          axisLabel: {
            rotate: graphData.length > 8 ? 45 : 0,
            align: graphData.length > 8 ? "right" : "center",
            fontSize: 12,
            fontWeight: theme.typography.weight.medium,
            fontFamily: theme.typography.fontFamily,
            color: theme.colors.textSecondary,
          },
          splitLine: { show: false },
        },
        yAxis: chartType !== "scatter" ? yAxisConfig : {
          type: "value",
          axisTick: { show: false },
          axisLine: {
            lineStyle: {
              color: `${theme.colors.accent}4D`,
              width: 2,
            },
          },
          axisLabel: {
            fontSize: 12,
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
        series: yKeys.map((key, keyIndex) => {
          const barCount = graphData.length;
          const isFewBars = chartType === "bar" && barCount <= 3;

          const seriesBase = {
            name: formatKey(key),
            type: chartType === "area" ? "line" : chartType,
            stack:
              chartType === "bar" || chartType === "area" ? "a" : undefined,
            data: graphData.map((d) => {
              const val = d[key];
              const numVal = !isNaN(Number(val)) && val !== null && val !== undefined ? Number(val) : 0;
              return numVal > 0 ? numVal : 0;
            }),

            barCategoryGap:
              chartType === "bar" ? (isFewBars ? "40%" : "10%") : undefined,
            barGap:
              chartType === "bar" ? (isFewBars ? "20%" : "6%") : undefined,
            barWidth:
              chartType === "bar"
                ? barCount === 1
                  ? 60
                  : barCount === 2
                    ? 60
                    : barCount === 3
                      ? 50
                      : undefined
                : undefined,

            symbolSize:
              chartType === "line" || chartType === "scatter" ? 8 : undefined,
            emphasis: {
              disabled: true,
              scale: false,
            },
            areaStyle:
              chartType === "area"
                ? {
                  opacity: 0.3,
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    {
                      offset: 0,
                      color: hexToRgba(
                        theme.colors.barColors[
                        keyIndex % theme.colors.barColors.length
                        ],
                        0.7
                      ),
                    },
                    {
                      offset: 1,
                      color: hexToRgba(
                        theme.colors.barColors[
                        keyIndex % theme.colors.barColors.length
                        ],
                        0.1
                      ),
                    },
                  ]),
                }
                : undefined,
            lineStyle:
              chartType === "line" || chartType === "area"
                ? {
                  width: 2,
                }
                : undefined,
            itemStyle:
              chartType === "line" ||
                chartType === "area" ||
                chartType === "scatter"
                ? // ✅ Removed explicit color for markers, it will inherit from the global palette
                {}
                : (params: any) => {
                  if (chartType !== "bar") return {};
                  // ✅ Updated to use the color provided by ECharts in the params object
                  const { dataIndex, color } = params;
                  const payload = graphData[dataIndex];
                  const topMostKey = [...yKeys]
                    .reverse()
                    .find((k) => Number(payload[k]) > 0);
                  const isTopBar = key === topMostKey;
                  const solidColor = color; // Use the ECharts-assigned color
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
        <div ref={containerRef} style={{ height: "65vh", width: "100%" }}>
          <div
            style={{
              height: "100%",
              width: "100%",
              position: "relative",
              transition: "all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
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
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.data === nextProps.data &&
      prevProps.isValidGraph === nextProps.isValidGraph &&
      prevProps.chartType === nextProps.chartType &&
      prevProps.groupBy === nextProps.groupBy &&
      prevProps.aggregate === nextProps.aggregate &&
      prevProps.valueKey === nextProps.valueKey &&
      prevProps.isVertical === nextProps.isVertical
    );
  }
);

export default DynamicGraph;
