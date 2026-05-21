export type SmartTableRow = Record<string, unknown>;

export type SmartTableColumnType =
  | "numeric"
  | "currency"
  | "percentage"
  | "date"
  | "datetime"
  | "month"
  | "year"
  | "quarter"
  | "boolean"
  | "categorical"
  | "identifier"
  | "email"
  | "phone"
  | "url"
  | "image"
  | "status"
  | "json"
  | "text";

export type SmartTableAlignment = "left" | "center" | "right";
export type SmartTableFilterType =
  | "text"
  | "numberRange"
  | "dateRange"
  | "multiSelect"
  | "boolean"
  | "none";
export type SmartTableAggregation = "sum" | "avg" | "min" | "max" | "count";
export type SmartTablePerformanceMode = "standard" | "paginated" | "virtualized";

export interface SmartTableNumberFormat {
  locale: string;
  style: "number" | "currency" | "percentage";
  currency?: string;
  currencySymbol?: string;
  precision: number;
  compact: boolean;
}

export interface SmartTableDateFormat {
  locale: string;
  granularity: "date" | "datetime" | "month" | "year" | "quarter";
}

export interface SmartTableColumnStats {
  nonEmptyCount: number;
  nullCount: number;
  uniqueCount: number;
  numericRatio: number;
  dateRatio: number;
  booleanRatio: number;
  averageLength: number;
  min?: number;
  max?: number;
  mean?: number;
  standardDeviation?: number;
  missingPercent: number;
  duplicateCount: number;
  sampleValues: unknown[];
  uniqueValues: string[];
}

export interface SmartTableColumn {
  key: string;
  label: string;
  type: SmartTableColumnType;
  alignment: SmartTableAlignment;
  width: number;
  minWidth: number;
  maxWidth: number;
  sortable: boolean;
  filterType: SmartTableFilterType;
  hiddenByDefault: boolean;
  isTechnical: boolean;
  isMetric: boolean;
  canSummarize: boolean;
  numberFormat?: SmartTableNumberFormat;
  dateFormat?: SmartTableDateFormat;
  stats: SmartTableColumnStats;
}

export interface SmartTableColumnFilter {
  type: SmartTableFilterType;
  value?: string;
  min?: number | null;
  max?: number | null;
  start?: string;
  end?: string;
  values?: string[];
  booleanValue?: boolean | null;
}

export interface SmartTableSort {
  key: string;
  desc: boolean;
}

export interface SmartTableSummary {
  key: string;
  label: string;
  aggregation: SmartTableAggregation;
  rawValue: number;
  value: string;
}

export interface SmartTableInsight {
  kind: "highest" | "lowest" | "missing" | "duplicates" | "outlier" | "trend";
  label: string;
  value: string;
  tone: "positive" | "negative" | "neutral" | "warning";
}

export interface SmartTableResponsiveConfig {
  collapseColumnsBelow: number;
  compactBelow: number;
  horizontalScroll: boolean;
  stickyFirstColumn: boolean;
}

export interface SmartTablePerformanceConfig {
  mode: SmartTablePerformanceMode;
  rowCount: number;
  pageSize: number;
  virtualizationThreshold: number;
  paginationThreshold: number;
  estimatedRowHeight: number;
  overscan: number;
}

export interface SmartTableExportConfig {
  fileBaseName: string;
  includeSummaries: boolean;
  preserveFormatting: boolean;
}

export interface SmartTablePivotConfig {
  enabled: boolean;
  groupBy: string | null;
  metric: string | null;
  aggregation: SmartTableAggregation;
  groupByOptions: string[];
  metricOptions: string[];
}

export interface SmartTableConfig {
  rawRows: SmartTableRow[];
  rows: SmartTableRow[];
  columns: SmartTableColumn[];
  defaultVisibleColumnKeys: string[];
  defaultSort: SmartTableSort | null;
  filterConfig: Record<string, SmartTableFilterType>;
  summaries: SmartTableSummary[];
  visibilityRules: {
    hiddenTechnicalColumns: string[];
    recommendedColumns: string[];
  };
  responsive: SmartTableResponsiveConfig;
  performance: SmartTablePerformanceConfig;
  exportConfig: SmartTableExportConfig;
  pivot: SmartTablePivotConfig;
  insights: SmartTableInsight[];
}

export interface SmartCellRenderModel {
  displayValue: string;
  rawValue: unknown;
  kind:
    | "text"
    | "number"
    | "badge"
    | "link"
    | "image"
    | "json"
    | "empty";
  href?: string;
  imageUrl?: string;
  badgeTone?: "positive" | "negative" | "neutral" | "warning" | "info";
  title: string;
  heatPercent?: number;
  progressPercent?: number;
  isAnomaly?: boolean;
  isPositive?: boolean;
  isNegative?: boolean;
}

export interface SmartTableOptions {
  fileBaseName?: string;
  hiddenColumns?: string[];
  visibleColumns?: string[];
  pivot?: Partial<SmartTablePivotConfig>;
}
