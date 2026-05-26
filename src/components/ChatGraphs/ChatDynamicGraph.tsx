import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import { BarChart3, Sparkles } from "lucide-react";
import { useTheme } from "../../ThemeContext";
import { useSmartChart } from "../../hooks/useSmartChart";
import {
  formatKey,
  type SmartAggregation,
  type SmartChartType,
} from "../../utils/smartChart";

interface DynamicGraphProps {
  data: unknown[];
  isValidGraph: (validData: boolean) => void;
  chartType: SmartChartType;
  groupBy: string | null;
  aggregate: SmartAggregation | null;
  valueKey: string | null;
  isVertical?: boolean;
}

const DynamicGraph: React.FC<DynamicGraphProps> = React.memo(
  ({
    data,
    isValidGraph,
    chartType,
    groupBy,
    aggregate,
    valueKey,
    isVertical = true,
  }) => {
    const { theme } = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);

    const smartOverrides = useMemo(
      () => ({
        chartType,
        groupBy,
        valueKey,
        aggregate,
        orientation: isVertical ? "vertical" : "horizontal",
      }),
      [aggregate, chartType, groupBy, isVertical, valueKey],
    );

    const { config, option } = useSmartChart(data, smartOverrides);
    
    const [showInsights, setShowInsights] = useState(false);
    const insightsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          insightsRef.current &&
          !insightsRef.current.contains(event.target as Node)
        ) {
          setShowInsights(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    useEffect(() => {
      isValidGraph(Array.isArray(data) && data.length > 0);
    }, [data, isValidGraph]);

    if (config.emptyState.isEmpty) {
      return (
        <div
          className="flex flex-col items-center justify-center p-8 text-center border border-dashed animate-fade-up"
          style={{
            background: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.large,
            minHeight: 320,
          }}
        >
          <div
            className="mb-4 flex items-center justify-center border"
            style={{
              width: 64,
              height: 64,
              background: `${theme.colors.accent}08`,
              borderColor: `${theme.colors.accent}20`,
              borderRadius: "50%",
              boxShadow: "0 2px 8px rgba(2, 6, 23, 0.02)",
            }}
          >
            <BarChart3 size={24} style={{ color: theme.colors.accent }} />
          </div>
          <h3
            className="mb-1 text-base font-semibold tracking-tight"
            style={{ color: theme.colors.text }}
          >
            {config.emptyState.title}
          </h3>
          <p
            className="max-w-md text-xs font-medium leading-relaxed"
            style={{ color: theme.colors.textSecondary }}
          >
            {config.emptyState.message}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
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
        className="flex w-full flex-col animate-fade-in relative"
        style={{
          overflow: "visible",
          transition: theme.transition.default,
        }}
      >
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
          <div className="relative flex-shrink-0" ref={insightsRef}>
            <button
              onClick={() => {
                setShowInsights((value) => !value);
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
                className="absolute left-0 top-full z-50 mt-1 flex w-[360px] flex-col gap-3 p-4 shadow-xl border"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.borderRadius.large,
                }}
              >
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  AI Summary Overview
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
                    <strong className="font-semibold">{insight.label}:</strong> {insight.value}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          ref={containerRef}
          style={{
            height: config.responsive.height,
            minHeight: config.responsive.minHeight,
            width: "100%",
          }}
        >
          <ReactECharts
            option={option}
            style={{ height: "100%", width: "100%" }}
            notMerge
            lazyUpdate
          />
        </div>
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.data === nextProps.data &&
    prevProps.isValidGraph === nextProps.isValidGraph &&
    prevProps.chartType === nextProps.chartType &&
    prevProps.groupBy === nextProps.groupBy &&
    prevProps.aggregate === nextProps.aggregate &&
    prevProps.valueKey === nextProps.valueKey &&
    prevProps.isVertical === nextProps.isVertical,
);

export { formatKey };
export default DynamicGraph;
