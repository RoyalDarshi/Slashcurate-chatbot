import { detectSmartTableColumns } from "./fieldDetection";
import { formatSmartNumber, toFiniteNumber } from "./formatting";
import { generateSummaries } from "./summaries";
import { getSmartVirtualizationConfig } from "./virtualization";
import type {
  SmartTableAggregation,
  SmartTableColumn,
  SmartTableConfig,
  SmartTableInsight,
  SmartTableOptions,
  SmartTableRow,
} from "./types";

const TECHNICAL_KEY_PATTERN =
  /(password|token|hash|secret|salt|internal|metadata|_raw|etag|uuid|guid)/i;

const normalizeRows = (data: unknown): SmartTableRow[] => {
  const rows = Array.isArray(data) ? data : data === undefined || data === null ? [] : [data];
  return rows.map((row, index) => {
    if (row !== null && typeof row === "object" && !Array.isArray(row)) {
      return row as SmartTableRow;
    }
    return { value: row, row_number: index + 1 };
  });
};

const aggregateValues = (
  values: number[],
  aggregation: SmartTableAggregation
): number => {
  if (aggregation === "count") return values.length;
  if (values.length === 0) return 0;
  if (aggregation === "avg") {
    return values.reduce((total, value) => total + value, 0) / values.length;
  }
  if (aggregation === "min") return Math.min(...values);
  if (aggregation === "max") return Math.max(...values);
  return values.reduce((total, value) => total + value, 0);
};

export const buildSmartPivotData = (
  rows: SmartTableRow[],
  groupBy: string | null,
  metric: string | null,
  aggregation: SmartTableAggregation
): SmartTableRow[] => {
  if (!groupBy || !metric) return rows;
  const grouped = new Map<string, { label: unknown; values: number[]; count: number }>();

  rows.forEach((row) => {
    const rawGroup = row[groupBy] ?? "Unknown";
    const key = String(rawGroup);
    const existing = grouped.get(key) ?? { label: rawGroup, values: [], count: 0 };
    const numericValue = toFiniteNumber(row[metric]);
    if (numericValue !== null) existing.values.push(numericValue);
    existing.count += 1;
    grouped.set(key, existing);
  });

  return Array.from(grouped.entries()).map(([, group]) => ({
    [groupBy]: group.label,
    [`${aggregation}_${metric}`]: aggregateValues(group.values, aggregation),
    record_count: group.count,
  }));
};

const getDefaultSort = (columns: SmartTableColumn[]) => {
  const dateColumn = columns.find((column) =>
    ["date", "datetime", "month", "year", "quarter"].includes(column.type)
  );
  const metricColumn = columns.find((column) => column.isMetric);
  if (metricColumn) return { key: metricColumn.key, desc: true };
  if (dateColumn) return { key: dateColumn.key, desc: true };
  return columns[0] ? { key: columns[0].key, desc: false } : null;
};

const getDefaultVisibleColumns = (
  columns: SmartTableColumn[],
  options: SmartTableOptions
): string[] => {
  const explicitVisible = new Set(options.visibleColumns ?? []);
  const explicitHidden = new Set(options.hiddenColumns ?? []);

  return columns
    .filter((column) => {
      if (explicitVisible.has(column.key)) return true;
      if (explicitHidden.has(column.key)) return false;
      return !column.hiddenByDefault;
    })
    .slice(0, 14)
    .map((column) => column.key);
};

const createInsights = (
  rows: SmartTableRow[],
  columns: SmartTableColumn[]
): SmartTableInsight[] => {
  const insights: SmartTableInsight[] = [];
  const metricColumn = columns.find((column) => column.isMetric);

  if (metricColumn?.numberFormat) {
    const ranked = rows
      .map((row) => ({
        row,
        value: toFiniteNumber(row[metricColumn.key]),
      }))
      .filter((item): item is { row: SmartTableRow; value: number } => item.value !== null)
      .sort((a, b) => b.value - a.value);
    const labelColumn = columns.find(
      (column) => !column.isMetric && !column.isTechnical && column.type !== "identifier"
    );

    if (ranked[0]) {
      const label = labelColumn ? String(ranked[0].row[labelColumn.key] ?? "Record") : "Record";
      insights.push({
        kind: "highest",
        label: `Highest ${metricColumn.label}`,
        value: `${label}: ${formatSmartNumber(ranked[0].value, metricColumn.numberFormat)}`,
        tone: "positive",
      });
    }
    if (ranked.length > 1) {
      const low = ranked[ranked.length - 1];
      const label = labelColumn ? String(low.row[labelColumn.key] ?? "Record") : "Record";
      insights.push({
        kind: "lowest",
        label: `Lowest ${metricColumn.label}`,
        value: `${label}: ${formatSmartNumber(low.value, metricColumn.numberFormat)}`,
        tone: "neutral",
      });
    }

    const outliers = ranked.filter((item) => {
      const deviation = metricColumn.stats.standardDeviation;
      const mean = metricColumn.stats.mean;
      return (
        deviation !== undefined &&
        mean !== undefined &&
        deviation > 0 &&
        Math.abs(item.value - mean) > deviation * 2
      );
    });
    if (outliers.length) {
      insights.push({
        kind: "outlier",
        label: "Outliers",
        value: `${outliers.length} unusual ${metricColumn.label} values detected`,
        tone: "warning",
      });
    }
  }

  const missingColumn = [...columns]
    .filter((column) => column.stats.missingPercent > 0)
    .sort((a, b) => b.stats.missingPercent - a.stats.missingPercent)[0];
  if (missingColumn) {
    insights.push({
      kind: "missing",
      label: "Missing data",
      value: `${missingColumn.stats.missingPercent.toFixed(1)}% missing in ${missingColumn.label}`,
      tone: missingColumn.stats.missingPercent > 10 ? "warning" : "neutral",
    });
  }

  const duplicateColumn = [...columns]
    .filter((column) => column.stats.duplicateCount > 0 && !column.isMetric)
    .sort((a, b) => b.stats.duplicateCount - a.stats.duplicateCount)[0];
  if (duplicateColumn) {
    insights.push({
      kind: "duplicates",
      label: "Duplicates",
      value: `${duplicateColumn.stats.duplicateCount} duplicate values in ${duplicateColumn.label}`,
      tone: "neutral",
    });
  }

  return insights.slice(0, 5);
};

export const getSmartTableConfig = (
  data: unknown,
  options: SmartTableOptions = {}
): SmartTableConfig => {
  const sourceRows = normalizeRows(data);
  const sourceColumns = detectSmartTableColumns(sourceRows);
  const groupByOptions = sourceColumns
    .filter((column) => !column.isMetric && !column.isTechnical)
    .map((column) => column.key);
  const metricOptions = sourceColumns
    .filter((column) => column.isMetric)
    .map((column) => column.key);
  const pivotOptions = options.pivot;
  const pivotEnabled = Boolean(pivotOptions?.enabled && pivotOptions.groupBy && pivotOptions.metric);
  const rows = pivotEnabled
    ? buildSmartPivotData(
        sourceRows,
        pivotOptions?.groupBy ?? null,
        pivotOptions?.metric ?? null,
        pivotOptions?.aggregation ?? "sum"
      )
    : sourceRows;
  const columns = detectSmartTableColumns(rows);
  const defaultVisibleColumnKeys = getDefaultVisibleColumns(columns, options);
  const hiddenTechnicalColumns = columns
    .filter((column) => column.hiddenByDefault || TECHNICAL_KEY_PATTERN.test(column.key))
    .map((column) => column.key);

  return {
    rawRows: sourceRows,
    rows,
    columns,
    defaultVisibleColumnKeys,
    defaultSort: getDefaultSort(columns),
    filterConfig: columns.reduce<Record<string, SmartTableColumn["filterType"]>>(
      (acc, column) => {
        acc[column.key] = column.filterType;
        return acc;
      },
      {}
    ),
    summaries: generateSummaries(rows, columns),
    visibilityRules: {
      hiddenTechnicalColumns,
      recommendedColumns: defaultVisibleColumnKeys,
    },
    responsive: {
      collapseColumnsBelow: 768,
      compactBelow: 540,
      horizontalScroll: columns.length > 6,
      stickyFirstColumn: rows.length > 20 && defaultVisibleColumnKeys.length > 3,
    },
    performance: getSmartVirtualizationConfig(rows.length),
    exportConfig: {
      fileBaseName: options.fileBaseName ?? `smart_table_${new Date().toISOString().slice(0, 10)}`,
      includeSummaries: true,
      preserveFormatting: true,
    },
    pivot: {
      enabled: pivotEnabled,
      groupBy: pivotOptions?.groupBy ?? groupByOptions[0] ?? null,
      metric: pivotOptions?.metric ?? metricOptions[0] ?? null,
      aggregation: pivotOptions?.aggregation ?? "sum",
      groupByOptions,
      metricOptions,
    },
    insights: createInsights(rows, columns),
  };
};

export type {
  SmartCellRenderModel,
  SmartTableAggregation,
  SmartTableColumn,
  SmartTableColumnFilter,
  SmartTableColumnType,
  SmartTableConfig,
  SmartTableInsight,
  SmartTableOptions,
  SmartTableRow,
  SmartTableSort,
  SmartTableSummary,
} from "./types";
