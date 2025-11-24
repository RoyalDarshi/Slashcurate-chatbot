import { useMemo } from "react";
import * as echarts from "echarts";
import { useTheme } from "../ThemeContext";

interface UseGraphOptionsProps {
    graphData: any[];
    xKey: string | null;
    yKeys: string[];
    chartType: string;
    isVertical?: boolean;
}

export const useGraphOptions = ({
    graphData,
    xKey,
    yKeys,
    chartType,
    isVertical = true,
}: UseGraphOptionsProps) => {
    const { theme } = useTheme();

    // Helper to format keys for display
    const formatKey = (key: any): string => {
        if (key === null || key === undefined) return "";
        const stringKey = String(key);
        return stringKey
            .replace(/_/g, " ")
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase())
            .trim();
    };

    // Helper to convert hex to rgba
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

    const option = useMemo(() => {
        if (!graphData.length || !xKey) return {};

        const xTickRotation = isVertical && graphData.length > 8 ? 45 : 0;
        const yTickRotation = !isVertical && graphData.length > 8 ? 45 : 0;

        const showLegend =
            chartType === "pie" || chartType === "funnel" || chartType === "treemap"
                ? graphData.length <= 5
                : yKeys.length <= 5;

        const baseOption = {
            animation: false, // Disable animation for smoother tooltips
            color: theme.colors.barColors,
            tooltip: {
                trigger: chartType === "bar" || chartType === "line" || chartType === "area" ? "axis" : "item",
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

        // Chart Type Specific Configurations
        if (["pie", "funnel", "treemap"].includes(chartType)) {
            const seriesConfig =
                chartType === "pie"
                    ? {
                        name: "Pie",
                        type: "pie",
                        radius: ["42%", "70%"],
                        center: ["50%", "50%"],
                        itemStyle: {
                            borderRadius: 10,
                            borderColor: theme.colors.surface,
                            borderWidth: 2,
                        },
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
                series: [
                    {
                        ...seriesConfig,
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
            const maxValue = Math.max(...maxValues, 10);

            return {
                ...baseOption,
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
                series: graphData.map((d) => ({
                    type: "radar",
                    data: [
                        {
                            value: yKeys.map((key) => {
                                const val = d.values && d.values[key] ? d.values[key] : 0;
                                return !isNaN(Number(val)) && val !== null && val !== undefined ? Number(val) : 0;
                            }),
                            name: formatKey(d[xKey]),
                        },
                    ],
                    symbolSize: 8,
                    lineStyle: {
                        width: 2,
                    },
                    areaStyle: {
                        opacity: 0.2,
                    },
                })),
            };
        }

        // Standard Axis-Based Charts (Bar, Line, Area, Scatter)
        const xAxisConfig = {
            type: isVertical && chartType !== 'scatter' ? "category" : "value",
            data: isVertical && chartType !== 'scatter'
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
            // Override tooltip trigger for axis charts
            tooltip: {
                ...baseOption.tooltip,
                trigger: 'axis',
            },
            grid: {
                left: "1%",
                right: "1%",
                bottom: showLegend ? "12%" : "3%",
                top: "2%",
                containLabel: true,
            },
            xAxis: xAxisConfig,
            yAxis: yAxisConfig,
            series: yKeys.map((key, index) => {
                const color = theme.colors.barColors[index % theme.colors.barColors.length];

                const commonSeries = {
                    name: formatKey(key),
                    data: graphData.map((d) => {
                        const val = d[key];
                        const numVal = !isNaN(Number(val)) && val !== null && val !== undefined ? Number(val) : 0;
                        return numVal || 0;
                    }),
                    color: color,
                };

                if (chartType === "bar") {
                    return {
                        ...commonSeries,
                        type: "bar",
                        stack: "total", // Enable stacking
                        barMaxWidth: 60,
                        itemStyle: {
                            borderRadius: yKeys.length > 1 ? undefined : [4, 4, 0, 0], // Remove border radius for stacked bars
                            // Gradient effect
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: hexToRgba(color, 1) },
                                { offset: 1, color: hexToRgba(color, 0.7) },
                            ]),
                        }
                    };
                } else if (chartType === "line" || chartType === "area") {
                    return {
                        ...commonSeries,
                        type: "line",
                        smooth: true,
                        symbolSize: 8,
                        lineStyle: { width: 3 },
                        areaStyle: chartType === "area" ? {
                            opacity: 0.3,
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: hexToRgba(color, 0.5) },
                                { offset: 1, color: hexToRgba(color, 0.0) },
                            ]),
                        } : undefined,
                    };
                } else if (chartType === "scatter") {
                    return {
                        ...commonSeries,
                        type: "scatter",
                        symbolSize: 12,
                        data: graphData.map((d) => {
                            const xVal = d[xKey];
                            const yVal = d[key];
                            const xNum = !isNaN(Number(xVal)) && xVal !== null && xVal !== undefined ? Number(xVal) : 0;
                            const yNum = !isNaN(Number(yVal)) && yVal !== null && yVal !== undefined ? Number(yVal) : 0;
                            return [xNum, yNum];
                        }),
                        itemStyle: {
                            shadowBlur: 10,
                            shadowColor: hexToRgba(color, 0.5),
                        }
                    };
                }
                return commonSeries;
            }),
        };
    }, [graphData, xKey, yKeys, chartType, isVertical, theme]);

    return option;
};
