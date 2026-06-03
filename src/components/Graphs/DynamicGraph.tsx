import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import {
  AreaChart as AreaChartIcon,
  BarChart3,
  Download,
  Filter as FunnelIcon,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Radar as RadarIcon,
  ScatterChart as ScatterChartIcon,
  Sparkles,
} from "lucide-react";
import html2canvas from "html2canvas";
import { useTheme } from "../../ThemeContext";
import { useSmartChart } from "../../hooks/useSmartChart";
import {
  formatKey,
  type SmartAggregation,
  type SmartChartType,
} from "../../utils/smartChart";

interface DynamicGraphProps {
  data: unknown[];
  graphType: string;
  groupBy: string | null;
  setGroupBy: React.Dispatch<React.SetStateAction<string | null>>;
  aggregate: SmartAggregation | null;
  setAggregate: React.Dispatch<React.SetStateAction<SmartAggregation>>;
  valueKey: string | null;
  setValueKey: React.Dispatch<React.SetStateAction<string | null>>;
  isVertical?: boolean;
}

const getIcon = (chartType: SmartChartType) => {
  switch (chartType) {
    case "line":
      return <LineChartIcon size={32} className="text-indigo-500" />;
    case "pie":
      return <PieChartIcon size={32} className="text-indigo-500" />;
    case "scatter":
      return <ScatterChartIcon size={32} className="text-indigo-500" />;
    case "radar":
      return <RadarIcon size={32} className="text-indigo-500" />;
    case "funnel":
      return <FunnelIcon size={32} className="text-indigo-500" />;
    case "area":
      return <AreaChartIcon size={32} className="text-indigo-500" />;
    case "treemap":
      return <PieChartIcon size={32} className="text-indigo-500" />;
    case "bar":
    default:
      return <BarChart3 size={32} className="text-indigo-500" />;
  }
};

const DynamicGraph: React.FC<DynamicGraphProps> = React.memo(
  ({
    data,
    graphType,
    groupBy,
    setGroupBy,
    aggregate,
    setAggregate,
    valueKey,
    setValueKey,
    isVertical = true,
  }) => {
    const { theme } = useTheme();
    const [showResolutionOptions, setShowResolutionOptions] = useState(false);
    const [showInsights, setShowInsights] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const insightsRef = useRef<HTMLDivElement>(null);
    const echartsRef = useRef<any>(null);

    const smartOverrides = useMemo(
      () => ({
        chartType: graphType,
        groupBy,
        valueKey,
        aggregate,
        orientation: isVertical ? "vertical" : "horizontal",
      }),
      [aggregate, graphType, groupBy, isVertical, valueKey],
    );

    const { config, option } = useSmartChart(data, smartOverrides);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const resizeObserver = new ResizeObserver(() => {
        if (echartsRef.current) {
          const chartInstance = echartsRef.current.getEchartsInstance();
          chartInstance?.resize();
        }
      });
      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
      if (!groupBy && config.groupBy) setGroupBy(config.groupBy);
      if (!valueKey && config.valueKey && config.aggregation !== "count") {
        setValueKey(config.valueKey);
      }
      if (!aggregate && config.aggregation) {
        setAggregate(config.aggregation);
      }
    }, [
      aggregate,
      config.aggregation,
      config.groupBy,
      config.valueKey,
      groupBy,
      setAggregate,
      setGroupBy,
      setValueKey,
      valueKey,
    ]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          showResolutionOptions &&
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setShowResolutionOptions(false);
        }
        if (
          showInsights &&
          insightsRef.current &&
          !insightsRef.current.contains(event.target as Node)
        ) {
          setShowInsights(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [showResolutionOptions, showInsights]);

    const handleDownloadGraph = async (resolution: "low" | "high") => {
      if (!containerRef.current) return;
      try {
        const scale = resolution === "high" ? 2 : 1;
        const canvas = await html2canvas(containerRef.current, {
          scale,
          useCORS: true,
          logging: false,
          backgroundColor: theme.colors.surface,
        });
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = `${config.chartType}_graph_${resolution}.png`;
        link.click();
      } catch (error) {
        console.error("Error downloading graph:", error);
      } finally {
        setShowResolutionOptions(false);
      }
    };

    if (config.emptyState.isEmpty) {
      return (
        <div
          className="flex flex-col items-center justify-center h-full p-8 text-center bg-transparent animate-fade-up"
          style={{ minHeight: 320 }}
        >
          <div
            className="mb-4 flex items-center justify-center border"
            style={{
              width: 64,
              height: 64,
              background: `${theme.colors.accent}08`,
              borderColor: `${theme.colors.accent}20`,
              borderRadius: "50%",
            }}
          >
            {getIcon(config.chartType)}
          </div>
          <h3
            className="mb-1 text-base font-semibold tracking-tight"
            style={{ color: theme.colors.text }}
          >
            {config.emptyState.title}
          </h3>
          <p
            className="max-w-md text-xs font-semibold leading-relaxed"
            style={{ color: theme.colors.textSecondary }}
          >
            {config.emptyState.message}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {config.emptyState.suggestions.map((suggestion) => (
              <span
                key={suggestion}
                className="px-2.5 py-1 text-xs font-semibold border"
                style={{
                  color: theme.colors.textSecondary,
                  borderColor: theme.colors.border,
                  background: theme.colors.background,
                  borderRadius: theme.borderRadius.pill,
                }}
              >
                {suggestion}
              </span>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div
        className="flex h-full flex-grow flex-col relative bg-transparent"
        style={{ overflow: "visible" }}
      >
        <div className="flex items-center justify-end gap-1.5 mb-2 relative z-10 w-full shrink-0 px-1">
          <div className="relative flex-shrink-0" ref={insightsRef}>
            <button
              onClick={() => {
                setShowInsights((value) => !value);
                setShowResolutionOptions(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border rounded-lg transition-colors shadow-xs"
              style={{
                backgroundColor: showInsights
                  ? `${theme.colors.accent}12`
                  : theme.colors.surface,
                color: theme.colors.accent,
                borderColor: showInsights
                  ? `${theme.colors.accent}30`
                  : theme.colors.border,
              }}
            >
              <Sparkles size={14} />
              <span>Insights</span>
            </button>

            {showInsights && config.insights.length > 0 && (
              <div
                className="absolute right-0 top-full z-50 mt-1 flex w-[360px] flex-col gap-3 p-4 shadow-xl border"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.borderRadius.large,
                }}
              >
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Summary Overview
                </div>
                {config.insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium leading-relaxed"
                    style={{
                      background:
                        insight.tone === "negative"
                          ? "rgba(239, 68, 68, 0.05)"
                          : insight.tone === "positive"
                            ? "rgba(16, 185, 129, 0.05)"
                            : theme.colors.background,
                      borderLeft: `3px solid ${insight.tone === "negative" ? theme.colors.error : insight.tone === "positive" ? theme.colors.success : theme.colors.accent}`,
                      color: theme.colors.text,
                    }}
                  >
                    <strong className="font-semibold">{insight.label}:</strong>{" "}
                    {insight.value}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative flex-shrink-0" ref={dropdownRef}>
            <button
              onClick={() => {
                setShowResolutionOptions((value) => !value);
                setShowInsights(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold border rounded-lg transition-colors shadow-xs"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.textSecondary,
                borderColor: theme.colors.border,
              }}
            >
              <Download size={14} />
              <span>Export</span>
            </button>

            {showResolutionOptions && (
              <div
                ref={dropdownRef}
                className="absolute right-0 z-10 mt-1 py-1 shadow-lg border rounded-lg overflow-hidden animate-fade-up"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  minWidth: 130,
                }}
              >
                {["low", "high"].map((res) => (
                  <button
                    key={res}
                    onClick={() => handleDownloadGraph(res as any)}
                    className="w-full px-3 py-1.5 text-left text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ color: theme.colors.text }}
                  >
                    {res === "low" ? "Standard Image" : "High Quality Render"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 w-full" ref={containerRef}>
          <ReactECharts
            ref={echartsRef}
            option={option}
            style={{ height: "100%", width: "100%" }}
            notMerge
            lazyUpdate
          />
        </div>
      </div>
    );
  },
);

export { formatKey };
export default DynamicGraph;
