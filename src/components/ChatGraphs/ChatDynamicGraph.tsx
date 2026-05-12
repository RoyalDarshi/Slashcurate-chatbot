import React, { useEffect, useMemo, useRef } from "react";
import ReactECharts from "echarts-for-react";
import { BarChart3 } from "lucide-react";
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
      [aggregate, chartType, groupBy, isVertical, valueKey]
    );

    const { config, option } = useSmartChart(data, smartOverrides);

    useEffect(() => {
      isValidGraph(Array.isArray(data) && data.length > 0);
    }, [data, isValidGraph]);

    if (config.emptyState.isEmpty) {
      return (
        <div
          className="flex flex-col items-center justify-center p-8 text-center"
          style={{
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.large,
            minHeight: 340,
          }}
        >
          <div
            className="mb-5 flex items-center justify-center"
            style={{
              width: 82,
              height: 82,
              background: theme.gradients.primary,
              borderRadius: "50%",
              boxShadow: theme.shadow.md,
            }}
          >
            <BarChart3 size={42} color="white" />
          </div>
          <h3
            className="mb-2 text-xl font-bold"
            style={{ color: theme.colors.text }}
          >
            {config.emptyState.title}
          </h3>
          <p className="max-w-md" style={{ color: theme.colors.textSecondary }}>
            {config.emptyState.message}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {config.emptyState.suggestions.map((suggestion) => (
              <span
                key={suggestion}
                className="px-3 py-1 text-xs"
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
        className="flex w-full flex-col"
        style={{
          background: theme.colors.surface,
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          overflow: "hidden",
          transition: theme.transition.default,
        }}
      >
        {config.insights.length > 0 && (
          <div className="flex flex-wrap gap-2 px-2 pb-2">
            {config.insights.slice(0, 3).map((insight) => (
              <span
                key={`${insight.kind}-${insight.label}`}
                className="max-w-[240px] truncate px-3 py-1 text-xs font-medium"
                title={`${insight.label}: ${insight.value}`}
                style={{
                  color:
                    insight.tone === "negative"
                      ? theme.colors.error
                      : insight.tone === "positive"
                        ? theme.colors.success
                        : theme.colors.textSecondary,
                  background: `${theme.colors.accent}12`,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.pill,
                }}
              >
                {insight.label}: {insight.value}
              </span>
            ))}
          </div>
        )}

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
    prevProps.isVertical === nextProps.isVertical
);

export { formatKey };
export default DynamicGraph;
