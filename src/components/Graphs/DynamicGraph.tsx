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
      return <LineChartIcon size={46} color="white" />;
    case "pie":
      return <PieChartIcon size={46} color="white" />;
    case "scatter":
      return <ScatterChartIcon size={46} color="white" />;
    case "radar":
      return <RadarIcon size={46} color="white" />;
    case "funnel":
      return <FunnelIcon size={46} color="white" />;
    case "area":
      return <AreaChartIcon size={46} color="white" />;
    case "treemap":
      return <PieChartIcon size={46} color="white" />;
    case "bar":
    default:
      return <BarChart3 size={46} color="white" />;
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

      return () => {
        resizeObserver.disconnect();
      };
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
          className="flex flex-col items-center justify-center h-full p-8 text-center"
          style={{
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.large,
            minHeight: 320,
          }}
        >
          <div
            className="mb-6 flex items-center justify-center"
            style={{
              width: 92,
              height: 92,
              background: theme.gradients.primary,
              borderRadius: "50%",
              boxShadow: theme.shadow.md,
            }}
          >
            {getIcon(config.chartType)}
          </div>
          <h3
            className="mb-2 text-2xl font-bold"
            style={{ color: theme.colors.text }}
          >
            {config.emptyState.title}
          </h3>
          <p className="max-w-lg" style={{ color: theme.colors.textSecondary }}>
            {config.emptyState.message}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {config.emptyState.suggestions.map((suggestion) => (
              <span
                key={suggestion}
                className="px-3 py-1 text-sm"
                style={{
                  color: theme.colors.textSecondary,
                  border: `1px solid ${theme.colors.border}`,
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
        className="flex h-full flex-col relative"
        style={{
          background: theme.colors.surface,
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          overflow: "hidden",
          transition: theme.transition.default,
        }}
      >
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <div className="relative flex-shrink-0" ref={insightsRef}>
            <button
              onClick={() => {
                setShowInsights((value) => !value);
                setShowResolutionOptions(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: showInsights
                  ? `${theme.colors.accent}1A`
                  : "transparent",
                color: theme.colors.accent,
                border: `1px solid ${showInsights ? theme.colors.accent + "33" : "transparent"}`,
                borderRadius: theme.borderRadius.default,
              }}
              title="AI Insights"
            >
              <Sparkles size={16} />
              <span>Insights</span>
            </button>

            {showInsights && config.insights.length > 0 && (
              <div
                className="absolute right-0 top-full z-50 mt-1 flex w-80 flex-col gap-2 p-3 shadow-2xl"
                style={{
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.large,
                }}
              >
                <div
                  className="mb-1 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: theme.colors.textSecondary }}
                >
                  AI Summary
                </div>
                {config.insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="rounded px-3 py-2 text-sm"
                    style={{
                      background:
                        insight.tone === "negative"
                          ? `${theme.colors.error}10`
                          : insight.tone === "positive"
                            ? `${theme.colors.success}10`
                            : theme.colors.background,
                      borderLeft: `3px solid ${insight.tone === "negative" ? theme.colors.error : insight.tone === "positive" ? theme.colors.success : theme.colors.accent}`,
                      color: theme.colors.text,
                    }}
                  >
                    <strong>{insight.label}:</strong> {insight.value}
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
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-85"
              style={{
                backgroundColor: "transparent",
                color: theme.colors.textSecondary,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.default,
              }}
              title="Export graph"
            >
              <Download size={16} />
              <span>Export</span>
            </button>

            {showResolutionOptions && (
              <div
                ref={dropdownRef}
                className="absolute right-0 z-10 mt-1 py-1 shadow-lg"
                style={{
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.default,
                  minWidth: 140,
                }}
              >
                <button
                  onClick={() => handleDownloadGraph("low")}
                  className="w-full px-3 py-1.5 text-left text-sm hover:opacity-80"
                  style={{ color: theme.colors.text }}
                >
                  Standard Quality
                </button>
                <button
                  onClick={() => handleDownloadGraph("high")}
                  className="w-full px-3 py-1.5 text-left text-sm hover:opacity-80"
                  style={{ color: theme.colors.text }}
                >
                  High Quality
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0" ref={containerRef}>
          <ReactECharts
            ref={echartsRef}
            option={option}
            style={{
              height: "100%",
              width: "100%",
            }}
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
