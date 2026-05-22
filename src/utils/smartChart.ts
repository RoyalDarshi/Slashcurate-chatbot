import * as echarts from "echarts";
import type { EChartsOption } from "echarts";
import type { Theme } from "../types";

export type SmartChartType =
  | "bar"
  | "line"
  | "pie"
  | "area"
  | "scatter"
  | "radar"
  | "funnel"
  | "treemap";

export type SmartAggregation = "sum" | "count" | "avg" | "min" | "max";
export type SmartOrientation = "vertical" | "horizontal";
export type SmartFieldKind =
  | "numeric"
  | "categorical"
  | "temporal"
  | "boolean"
  | "identifier"
  | "unknown";

export interface SmartChartOverrides {
  chartType?: SmartChartType | string | null;
  groupBy?: string | null;
  valueKey?: string | null;
  aggregate?: SmartAggregation | null;
  orientation?: SmartOrientation | boolean | null;
  topN?: number;
  enableTopN?: boolean;
  forceAutoChartType?: boolean;
}

export interface SmartFieldAnalysis {
  key: string;
  kind: SmartFieldKind;
  uniqueCount: number;
  nonEmptyCount: number;
  numericCount: number;
  temporalCount: number;
  averageLength: number;
  isIdentifier: boolean;
  isTemporalName: boolean;
  isMetricName: boolean;
  samples: unknown[];
}

export interface SmartNumberFormat {
  locale: string;
  style: "number" | "currency" | "percent";
  currency?: string;
  currencySymbol?: string;
  precision: number;
  useIndianCompact: boolean;
  valueKey?: string | null;
}

export interface SmartInsight {
  kind: "top" | "low" | "trend" | "outlier" | "share";
  label: string;
  value: string;
  tone: "positive" | "negative" | "neutral" | "warning";
}

export interface SmartEmptyState {
  isEmpty: boolean;
  title: string;
  message: string;
  suggestions: string[];
}

export interface SmartProcessedDatum {
  name: string;
  rawName: unknown;
  total: number;
  value: number;
  values: Record<string, number>;
  sourceRows: number;
  percent: number;
  sortValue?: number;
  x?: number;
  y?: number;
  children?: SmartProcessedDatum[];
}

export interface SmartChartConfig {
  rawRows: Record<string, unknown>[];
  chartType: SmartChartType;
  autoChartType: SmartChartType;
  requestedChartType: SmartChartType | null;
  orientation: SmartOrientation;
  aggregation: SmartAggregation;
  groupBy: string | null;
  valueKey: string | null;
  secondaryGroupBy: string | null;
  xAxisKey: string | null;
  yAxisKey: string | null;
  metricKeys: string[];
  seriesKeys: string[];
  groupByOptions: string[];
  valueKeyOptions: string[];
  fieldAnalysis: SmartFieldAnalysis[];
  processedData: SmartProcessedDatum[];
  treemapData: SmartProcessedDatum[];
  radarIndicators: { name: string; max: number }[];
  sorting: {
    enabled: boolean;
    direction: "asc" | "desc";
    by: "value" | "time" | "none";
  };
  topN: {
    enabled: boolean;
    threshold: number;
    applied: boolean;
    othersCount: number;
  };
  numberFormat: SmartNumberFormat;
  responsive: {
    minHeight: number;
    height: number;
    maxHeight: number;
    categoryCount: number;
    isDense: boolean;
  };
  label: {
    show: boolean;
    rotate: number;
    maxLength: number;
    hideOverlap: boolean;
  };
  axis: {
    xLabelRotate: number;
    yLabelRotate: number;
    truncateLength: number;
    gridLeft: number;
    gridRight: number;
    gridTop: number;
    gridBottom: number;
    dataZoom: boolean;
  };
  tooltip: {
    trigger: "axis" | "item";
    showPercent: boolean;
    showInsights: boolean;
  };
  insights: SmartInsight[];
  emptyState: SmartEmptyState;
}

type AggregateCell = {
  sum: number;
  count: number;
  min: number | null;
  max: number | null;
};

const VALID_CHART_TYPES: SmartChartType[] = [
  "bar",
  "line",
  "pie",
  "area",
  "scatter",
  "radar",
  "funnel",
  "treemap",
];

const DEFAULT_PALETTE = [
  "#2563EB",
  "#0891B2",
  "#059669",
  "#D97706",
  "#DC2626",
  "#7C3AED",
  "#DB2777",
  "#0D9488",
  "#4F46E5",
  "#65A30D",
];

const TIME_FIELD_PATTERN =
  /(date|month|year|time|day|week|quarter|period|created_at|updated_at|timestamp)/i;
const STAGE_FIELD_PATTERN =
  /(stage|step|status|funnel|pipeline|phase|milestone|level)/i;
const HIERARCHY_FIELD_PATTERN =
  /(parent|child|category|subcategory|segment|department|division|region|zone|branch|path|level)/i;
const MONEY_FIELD_PATTERN =
  /(sales|revenue|profit|amount|price|cost|expense|income|earning|turnover|gmv|value|balance|payment|invoice|salary|budget)/i;
const AVERAGE_FIELD_PATTERN =
  /(rating|score|average|avg|satisfaction|nps|rate|ratio|percent|percentage|margin|conversion|growth|yield)/i;
const COUNT_FIELD_PATTERN =
  /(users?|customers?|orders?|items?|records?|tickets?|sessions?|visits?|transactions?|employees?|invoices?|leads?|accounts?)$/i;
const METRIC_FIELD_PATTERN =
  /(sales|revenue|profit|amount|price|cost|expense|income|total|count|qty|quantity|score|rating|rate|percent|value|orders?|users?|items?)/i;

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

export const formatKey = (key: unknown): string => {
  if (key === null || key === undefined) return "";
  return String(key)
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\s+/g, " ")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

export const truncateLabel = (value: unknown, maxLength: number): string => {
  const label = formatKey(value);
  if (label.length <= maxLength) return label;
  return `${label.slice(0, Math.max(1, maxLength - 1))}...`;
};

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizeRows = (data: unknown[]): Record<string, unknown>[] =>
  data
    .filter((row): row is Record<string, unknown> => {
      return row !== null && typeof row === "object" && !Array.isArray(row);
    })
    .map((row) => row);

const normalizeChartType = (
  chartType?: SmartChartType | string | null,
): SmartChartType | null => {
  if (!chartType) return null;
  return VALID_CHART_TYPES.includes(chartType as SmartChartType)
    ? (chartType as SmartChartType)
    : null;
};

const normalizeOrientation = (
  orientation?: SmartOrientation | boolean | null,
): SmartOrientation | null => {
  if (orientation === true) return "vertical";
  if (orientation === false) return "horizontal";
  if (orientation === "vertical" || orientation === "horizontal") {
    return orientation;
  }
  return null;
};

const isPresent = (value: unknown): boolean =>
  value !== null && value !== undefined && String(value).trim() !== "";

export const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  let multiplier = 1;
  if (/(cr|crore)s?$/.test(lower)) multiplier = 10_000_000;
  else if (/(l|lac|lakh)s?$/.test(lower)) multiplier = 100_000;
  else if (/k$/.test(lower)) multiplier = 1_000;
  else if (/m$/.test(lower)) multiplier = 1_000_000;
  else if (/b$/.test(lower)) multiplier = 1_000_000_000;

  const cleaned = lower
    .replace(/(crores?|cr|lakhs?|lacs?|l|k|m|b)$/i, "")
    .replace(/[₹$€£,\s%]/g, "")
    .replace(/rs\.?/gi, "");

  if (!cleaned || cleaned === "-" || cleaned === ".") return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed * multiplier : null;
};

const isTimeFieldName = (key: string): boolean => TIME_FIELD_PATTERN.test(key);

const isIdentifierKey = (
  key: string,
  uniqueCount: number,
  rowCount: number,
): boolean => {
  const lower = key.toLowerCase();
  if (
    /(id|uuid|guid|code|number|no|phone|mobile|email|address|pin|postal)$/i.test(
      lower,
    )
  ) {
    return true;
  }
  if (
    lower.includes("password") ||
    lower.includes("token") ||
    lower.includes("hash")
  ) {
    return true;
  }
  return (
    rowCount > 20 &&
    uniqueCount > rowCount * 0.9 &&
    !METRIC_FIELD_PATTERN.test(key)
  );
};

export const parseDateValue = (value: unknown, key = ""): number | null => {
  const lowerKey = key.toLowerCase();

  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) ? time : null;
  }

  if (typeof value === "number" && /year/.test(lowerKey)) {
    if (value >= 1900 && value <= 2200) {
      return new Date(value, 0, 1).getTime();
    }
  }

  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  const lower = text.toLowerCase();

  if (/^\d{4}$/.test(text) && /year/.test(lowerKey)) {
    return new Date(Number(text), 0, 1).getTime();
  }

  const quarter = text.match(/^(\d{4})[-\s]?q([1-4])$/i);
  if (quarter) {
    return new Date(
      Number(quarter[1]),
      (Number(quarter[2]) - 1) * 3,
      1,
    ).getTime();
  }

  const yearMonth = text.match(/^(\d{4})[-/](\d{1,2})$/);
  if (yearMonth) {
    return new Date(
      Number(yearMonth[1]),
      Number(yearMonth[2]) - 1,
      1,
    ).getTime();
  }

  const monthOnly = MONTH_INDEX[lower];
  if (monthOnly !== undefined && /month/.test(lowerKey)) {
    return new Date(2000, monthOnly, 1).getTime();
  }

  const monthYear = text.match(
    /^(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)[a-z]*[\s,-]+(\d{4})$/i,
  );
  if (monthYear) {
    const month = MONTH_INDEX[monthYear[1].toLowerCase()];
    return new Date(Number(monthYear[2]), month, 1).getTime();
  }

  if (!isTimeFieldName(key) && !/[-/:T]/.test(text)) return null;

  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? parsed : null;
};

const getAllKeys = (rows: Record<string, unknown>[]): string[] => {
  const keys = new Set<string>();
  rows.slice(0, 100).forEach((row) => {
    Object.keys(row).forEach((key) => keys.add(key));
  });
  return Array.from(keys);
};

export const analyzeSmartFields = (
  rows: Record<string, unknown>[],
): SmartFieldAnalysis[] => {
  const sample = rows.slice(0, Math.min(rows.length, 250));
  const rowCount = Math.max(sample.length, 1);

  return getAllKeys(sample).map((key) => {
    const values = sample.map((row) => row[key]).filter(isPresent);
    const uniqueValues = new Set(values.map((value) => String(value))).size;
    const numericValues = values
      .map(toFiniteNumber)
      .filter((value): value is number => value !== null);
    const temporalValues = values
      .map((value) => parseDateValue(value, key))
      .filter((value): value is number => value !== null);
    const stringValues = values.map((value) => String(value));
    const averageLength =
      stringValues.reduce((total, value) => total + value.length, 0) /
      Math.max(stringValues.length, 1);

    const nonEmptyCount = values.length;
    const numericRatio = numericValues.length / Math.max(nonEmptyCount, 1);
    const temporalRatio = temporalValues.length / Math.max(nonEmptyCount, 1);
    const temporalName = isTimeFieldName(key);
    const identifier = isIdentifierKey(key, uniqueValues, rowCount);
    const metricName = METRIC_FIELD_PATTERN.test(key);
    const booleanCount = values.filter(
      (value) => typeof value === "boolean",
    ).length;

    let kind: SmartFieldKind = "unknown";
    if (identifier) {
      kind = "identifier";
    } else if (
      temporalName &&
      (temporalRatio >= 0.45 || /year|month|quarter|period/i.test(key))
    ) {
      kind = "temporal";
    } else if (temporalRatio >= 0.75 && numericRatio < 0.75) {
      kind = "temporal";
    } else if (numericRatio >= 0.7) {
      kind = "numeric";
    } else if (booleanCount / Math.max(nonEmptyCount, 1) >= 0.7) {
      kind = "boolean";
    } else if (uniqueValues > 0) {
      kind = "categorical";
    }

    return {
      key,
      kind,
      uniqueCount: uniqueValues,
      nonEmptyCount,
      numericCount: numericValues.length,
      temporalCount: temporalValues.length,
      averageLength,
      isIdentifier: identifier,
      isTemporalName: temporalName,
      isMetricName: metricName,
      samples: values.slice(0, 5),
    };
  });
};

const getField = (
  fields: SmartFieldAnalysis[],
  key?: string | null,
): SmartFieldAnalysis | null =>
  key ? (fields.find((field) => field.key === key) ?? null) : null;

const chooseGroupField = (
  rows: Record<string, unknown>[],
  fields: SmartFieldAnalysis[],
  override?: string | null,
): SmartFieldAnalysis | null => {
  const overrideField = getField(fields, override);
  if (overrideField && !overrideField.isIdentifier) return overrideField;

  const temporal = fields.find((field) => field.kind === "temporal");
  const numericFieldExists = fields.some((field) => field.kind === "numeric");
  if (temporal && numericFieldExists) return temporal;

  const candidates = fields.filter((field) => {
    if (field.isIdentifier || field.kind === "numeric") return false;
    return field.uniqueCount > 1;
  });

  const scored = candidates
    .map((field) => {
      const lower = field.key.toLowerCase();
      const cardinality = field.uniqueCount;
      const cardinalityScore =
        cardinality <= 12 ? 32 - cardinality : Math.max(4, 28 - cardinality);
      const keywordScore =
        /(branch|city|state|region|zone|category|segment|department|product|status|stage|type|name)/i.test(
          lower,
        )
          ? 20
          : 0;
      const highUniquePenalty =
        rows.length > 20 && cardinality > rows.length * 0.75 ? 30 : 0;
      return {
        field,
        score: cardinalityScore + keywordScore - highUniquePenalty,
      };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.field ?? null;
};

const chooseValueField = (
  fields: SmartFieldAnalysis[],
  groupField: SmartFieldAnalysis | null,
  override?: string | null,
): SmartFieldAnalysis | null => {
  const overrideField = getField(fields, override);
  if (overrideField?.kind === "numeric") return overrideField;

  const candidates = fields.filter((field) => {
    if (field.key === groupField?.key) return false;
    if (field.kind !== "numeric") return false;
    return !field.isIdentifier && !field.isTemporalName;
  });

  const scored = candidates
    .map((field) => {
      const lower = field.key.toLowerCase();
      let score = 10;
      if (MONEY_FIELD_PATTERN.test(lower)) score += 35;
      if (AVERAGE_FIELD_PATTERN.test(lower)) score += 25;
      if (/total|qty|quantity|count|value/i.test(lower)) score += 20;
      if (/age|rank|year|month|day/i.test(lower)) score -= 15;
      return { field, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.field ?? null;
};

const chooseSecondaryGroupField = (
  fields: SmartFieldAnalysis[],
  primary: SmartFieldAnalysis | null,
  chartType: SmartChartType,
): SmartFieldAnalysis | null => {
  if (!["bar", "line", "area", "treemap"].includes(chartType)) return null;

  return (
    fields.find((field) => {
      if (field.key === primary?.key || field.isIdentifier) return false;
      if (!["categorical", "boolean"].includes(field.kind)) return false;
      if (field.uniqueCount < 2 || field.uniqueCount > 8) return false;
      return true;
    }) ?? null
  );
};

const hasHierarchy = (fields: SmartFieldAnalysis[]): boolean => {
  const hierarchyFields = fields.filter(
    (field) =>
      !field.isIdentifier &&
      ["categorical", "boolean"].includes(field.kind) &&
      HIERARCHY_FIELD_PATTERN.test(field.key),
  );
  return hierarchyFields.length >= 2;
};

const detectAutoChartType = (
  rows: Record<string, unknown>[],
  fields: SmartFieldAnalysis[],
  groupField: SmartFieldAnalysis | null,
  valueField: SmartFieldAnalysis | null,
): SmartChartType => {
  if (rows.length === 0) return "bar";

  const numericFields = fields.filter(
    (field) => field.kind === "numeric" && !field.isIdentifier,
  );
  const categoricalFields = fields.filter(
    (field) =>
      ["categorical", "boolean"].includes(field.kind) && !field.isIdentifier,
  );
  const timeField = fields.find((field) => field.kind === "temporal");
  const stageField = fields.find(
    (field) =>
      ["categorical", "boolean"].includes(field.kind) &&
      STAGE_FIELD_PATTERN.test(field.key),
  );

  if (stageField && valueField) return "funnel";
  if (timeField && numericFields.length > 0) return "line";
  if (hasHierarchy(fields) && valueField) return "treemap";
  if (numericFields.length === 2 && categoricalFields.length === 0) {
    return "scatter";
  }
  if (numericFields.length >= 2 && !groupField) return "scatter";

  if (groupField && valueField) {
    const positiveValues = rows
      .map((row) => toFiniteNumber(row[valueField.key]))
      .filter((value): value is number => value !== null);
    const canShowPie =
      groupField.kind !== "temporal" &&
      groupField.uniqueCount > 1 &&
      groupField.uniqueCount <= 6 &&
      positiveValues.every((value) => value >= 0);
    if (canShowPie) return "pie";
    return "bar";
  }

  return numericFields.length >= 2 ? "scatter" : "bar";
};

const detectAggregation = (
  valueField: SmartFieldAnalysis | null,
  override?: SmartAggregation | null,
): SmartAggregation => {
  if (override) return override;
  if (!valueField) return "count";

  const key = valueField.key.toLowerCase();
  if (AVERAGE_FIELD_PATTERN.test(key)) return "avg";
  if (COUNT_FIELD_PATTERN.test(key) && !MONEY_FIELD_PATTERN.test(key)) {
    return "count";
  }
  if (MONEY_FIELD_PATTERN.test(key)) return "sum";
  return "sum";
};

const createCell = (): AggregateCell => ({
  sum: 0,
  count: 0,
  min: null,
  max: null,
});

const addToCell = (
  cell: AggregateCell,
  value: number | null,
  aggregation: SmartAggregation,
) => {
  if (aggregation === "count") {
    cell.sum += 1;
    cell.count += 1;
    cell.min = cell.min === null ? 1 : Math.min(cell.min, 1);
    cell.max = cell.max === null ? 1 : Math.max(cell.max, 1);
    return;
  }

  if (value === null) return;
  cell.sum += value;
  cell.count += 1;
  cell.min = cell.min === null ? value : Math.min(cell.min, value);
  cell.max = cell.max === null ? value : Math.max(cell.max, value);
};

const finalizeCell = (
  cell: AggregateCell | undefined,
  aggregation: SmartAggregation,
): number => {
  if (!cell) return 0;
  if (aggregation === "count") return cell.count;
  if (aggregation === "avg") return cell.count ? cell.sum / cell.count : 0;
  if (aggregation === "min") return cell.min ?? 0;
  if (aggregation === "max") return cell.max ?? 0;
  return cell.sum;
};

const getGroupLabel = (
  rawValue: unknown,
  field: SmartFieldAnalysis | null,
  fallback: string,
): string => {
  if (!isPresent(rawValue)) return "Unknown";
  const parsedDate =
    field?.kind === "temporal" ? parseDateValue(rawValue, field.key) : null;
  if (parsedDate !== null) {
    const date = new Date(parsedDate);
    const lower = field?.key.toLowerCase() ?? "";
    if (/year/.test(lower) && !/month|date|day/.test(lower)) {
      return String(date.getFullYear());
    }
    if (/month|quarter|period/.test(lower) && !/date|day/.test(lower)) {
      return new Intl.DateTimeFormat("en-IN", {
        month: "short",
        year:
          parsedDate === new Date(2000, date.getMonth(), 1).getTime()
            ? undefined
            : "numeric",
      }).format(date);
    }
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }
  const label = formatKey(rawValue);
  return label || fallback;
};

const getGroupSortValue = (
  rawValue: unknown,
  field: SmartFieldAnalysis | null,
): number | undefined => {
  if (field?.kind !== "temporal") return undefined;
  return parseDateValue(rawValue, field.key) ?? undefined;
};

const aggregateRows = (
  rows: Record<string, unknown>[],
  groupField: SmartFieldAnalysis | null,
  valueField: SmartFieldAnalysis | null,
  secondaryField: SmartFieldAnalysis | null,
  aggregation: SmartAggregation,
): { data: SmartProcessedDatum[]; seriesKeys: string[] } => {
  const groupMap = new Map<
    string,
    {
      rawName: unknown;
      sourceRows: number;
      sortValue?: number;
      cells: Map<string, AggregateCell>;
    }
  >();
  const seriesKeySet = new Set<string>();

  rows.forEach((row, index) => {
    const rawGroup = groupField ? row[groupField.key] : `Item ${index + 1}`;
    const groupName = getGroupLabel(rawGroup, groupField, `Item ${index + 1}`);
    const seriesKey = secondaryField
      ? getGroupLabel(row[secondaryField.key], secondaryField, "Value")
      : "value";
    seriesKeySet.add(seriesKey);

    if (!groupMap.has(groupName)) {
      groupMap.set(groupName, {
        rawName: rawGroup,
        sourceRows: 0,
        sortValue: getGroupSortValue(rawGroup, groupField),
        cells: new Map<string, AggregateCell>(),
      });
    }

    const group = groupMap.get(groupName);
    if (!group) return;
    group.sourceRows += 1;
    const cell = group.cells.get(seriesKey) ?? createCell();
    addToCell(
      cell,
      valueField ? toFiniteNumber(row[valueField.key]) : null,
      aggregation,
    );
    group.cells.set(seriesKey, cell);
  });

  const seriesKeys = Array.from(seriesKeySet).slice(0, 8);
  const data = Array.from(groupMap.entries()).map(([name, group]) => {
    const values = seriesKeys.reduce<Record<string, number>>((acc, key) => {
      acc[key] = finalizeCell(group.cells.get(key), aggregation);
      return acc;
    }, {});
    const total = Object.values(values).reduce((sum, value) => sum + value, 0);
    return {
      name,
      rawName: group.rawName,
      total,
      value: total,
      values,
      sourceRows: group.sourceRows,
      percent: 0,
      sortValue: group.sortValue,
    };
  });

  return { data, seriesKeys: seriesKeys.length ? seriesKeys : ["value"] };
};

const buildTreemapRows = (
  rows: Record<string, unknown>[],
  groupField: SmartFieldAnalysis | null,
  valueField: SmartFieldAnalysis | null,
  secondaryField: SmartFieldAnalysis | null,
  aggregation: SmartAggregation,
): SmartProcessedDatum[] => {
  if (!secondaryField) {
    return aggregateRows(rows, groupField, valueField, null, aggregation).data;
  }

  const parentMap = new Map<
    string,
    {
      rawName: unknown;
      rows: Record<string, unknown>[];
    }
  >();

  rows.forEach((row, index) => {
    const rawGroup = groupField ? row[groupField.key] : `Group ${index + 1}`;
    const parentName = getGroupLabel(
      rawGroup,
      groupField,
      `Group ${index + 1}`,
    );
    const existing = parentMap.get(parentName) ?? {
      rawName: rawGroup,
      rows: [],
    };
    existing.rows.push(row);
    parentMap.set(parentName, existing);
  });

  return Array.from(parentMap.entries()).map(([name, parent]) => {
    const children = aggregateRows(
      parent.rows,
      secondaryField,
      valueField,
      null,
      aggregation,
    ).data.sort((a, b) => b.total - a.total);
    const total = children.reduce((sum, child) => sum + child.total, 0);
    return {
      name,
      rawName: parent.rawName,
      total,
      value: total,
      values: { value: total },
      sourceRows: parent.rows.length,
      percent: 0,
      children,
    };
  });
};

const buildScatterRows = (
  rows: Record<string, unknown>[],
  fields: SmartFieldAnalysis[],
  groupField: SmartFieldAnalysis | null,
  valueField: SmartFieldAnalysis | null,
): {
  data: SmartProcessedDatum[];
  xAxisKey: string | null;
  yAxisKey: string | null;
} => {
  const numericFields = fields.filter(
    (field) => field.kind === "numeric" && !field.isIdentifier,
  );
  const xField =
    groupField?.kind === "numeric" ? groupField : (numericFields[0] ?? null);
  const yField =
    valueField?.kind === "numeric" && valueField.key !== xField?.key
      ? valueField
      : (numericFields.find((field) => field.key !== xField?.key) ?? null);
  const labelField =
    fields.find(
      (field) =>
        ["categorical", "boolean"].includes(field.kind) && !field.isIdentifier,
    ) ?? null;

  if (!xField || !yField) {
    return {
      data: [],
      xAxisKey: xField?.key ?? null,
      yAxisKey: yField?.key ?? null,
    };
  }

  const data = rows
    .map((row, index) => {
      const x = toFiniteNumber(row[xField.key]);
      const y = toFiniteNumber(row[yField.key]);
      if (x === null || y === null) return null;
      const name = labelField
        ? getGroupLabel(row[labelField.key], labelField, `Point ${index + 1}`)
        : `Point ${index + 1}`;
      return {
        name,
        rawName: name,
        total: y,
        value: y,
        values: { [yField.key]: y },
        sourceRows: 1,
        percent: 0,
        x,
        y,
      };
    })
    .filter((datum): datum is SmartProcessedDatum => datum !== null);

  return { data, xAxisKey: xField.key, yAxisKey: yField.key };
};

const buildRadarRows = (
  rows: Record<string, unknown>[],
  fields: SmartFieldAnalysis[],
  groupField: SmartFieldAnalysis | null,
  aggregation: SmartAggregation,
): { data: SmartProcessedDatum[]; metricKeys: string[] } => {
  const metricKeys = fields
    .filter((field) => field.kind === "numeric" && !field.isIdentifier)
    .slice(0, 6)
    .map((field) => field.key);

  const { data } = aggregateRows(
    rows,
    groupField,
    null,
    null,
    aggregation === "count" ? "count" : "sum",
  );

  const groupMap = new Map<string, Map<string, AggregateCell>>();
  rows.forEach((row, index) => {
    const rawGroup = groupField ? row[groupField.key] : `Item ${index + 1}`;
    const groupName = getGroupLabel(rawGroup, groupField, `Item ${index + 1}`);
    const cells = groupMap.get(groupName) ?? new Map<string, AggregateCell>();
    metricKeys.forEach((metricKey) => {
      const cell = cells.get(metricKey) ?? createCell();
      addToCell(cell, toFiniteNumber(row[metricKey]), aggregation);
      cells.set(metricKey, cell);
    });
    groupMap.set(groupName, cells);
  });

  return {
    metricKeys,
    data: data.map((datum) => {
      const cells = groupMap.get(datum.name);
      const values = metricKeys.reduce<Record<string, number>>((acc, key) => {
        acc[key] = finalizeCell(cells?.get(key), aggregation);
        return acc;
      }, {});
      const total = Object.values(values).reduce(
        (sum, value) => sum + value,
        0,
      );
      return { ...datum, value: total, total, values };
    }),
  };
};

const applySortingAndTopN = (
  data: SmartProcessedDatum[],
  chartType: SmartChartType,
  groupField: SmartFieldAnalysis | null,
  seriesKeys: string[],
  topNThreshold: number,
  topNEnabled: boolean,
): {
  data: SmartProcessedDatum[];
  sorting: SmartChartConfig["sorting"];
  topN: SmartChartConfig["topN"];
} => {
  const isTemporal = groupField?.kind === "temporal";
  const shouldSortByValue =
    ["bar", "pie", "funnel", "treemap"].includes(chartType) && !isTemporal;

  let sorted = [...data];
  const sorting: SmartChartConfig["sorting"] = shouldSortByValue
    ? { enabled: true, direction: "desc", by: "value" }
    : isTemporal
      ? { enabled: true, direction: "asc", by: "time" }
      : { enabled: false, direction: "desc", by: "none" };

  if (shouldSortByValue) sorted.sort((a, b) => b.total - a.total);
  if (isTemporal)
    sorted.sort((a, b) => (a.sortValue ?? 0) - (b.sortValue ?? 0));

  const topNApplies =
    topNEnabled &&
    ["bar", "pie", "funnel", "treemap"].includes(chartType) &&
    !isTemporal &&
    sorted.length > topNThreshold;

  const topN = {
    enabled: topNEnabled,
    threshold: topNThreshold,
    applied: topNApplies,
    othersCount: topNApplies ? sorted.length - topNThreshold : 0,
  };

  if (!topNApplies) return { data: sorted, sorting, topN };

  const visible = sorted.slice(0, topNThreshold);
  const rest = sorted.slice(topNThreshold);
  const values = seriesKeys.reduce<Record<string, number>>((acc, key) => {
    acc[key] = rest.reduce((sum, datum) => sum + (datum.values[key] ?? 0), 0);
    return acc;
  }, {});
  const total = Object.values(values).reduce((sum, value) => sum + value, 0);

  return {
    data: [
      ...visible,
      {
        name: "Others",
        rawName: "Others",
        total,
        value: total,
        values,
        sourceRows: rest.reduce((sum, datum) => sum + datum.sourceRows, 0),
        percent: 0,
      },
    ],
    sorting,
    topN,
  };
};

const applyPercentages = (
  data: SmartProcessedDatum[],
): SmartProcessedDatum[] => {
  const grandTotal = data.reduce(
    (sum, datum) => sum + Math.abs(datum.total),
    0,
  );
  return data.map((datum) => ({
    ...datum,
    percent: grandTotal ? (Math.abs(datum.total) / grandTotal) * 100 : 0,
    children: datum.children ? applyPercentages(datum.children) : undefined,
  }));
};

const detectPrecision = (values: number[]): number => {
  const finiteValues = values.filter(Number.isFinite);
  if (finiteValues.length === 0) return 0;
  if (finiteValues.every((value) => Number.isInteger(value))) return 0;
  const maxAbs = Math.max(...finiteValues.map((value) => Math.abs(value)));
  if (maxAbs < 10) return 2;
  if (maxAbs < 100) return 1;
  return 0;
};

const detectNumberFormat = (
  valueKey: string | null,
  values: number[],
): SmartNumberFormat => {
  const key = valueKey ?? "";
  const lower = key.toLowerCase();
  const isPercent =
    AVERAGE_FIELD_PATTERN.test(lower) &&
    /(percent|rate|ratio|margin|growth|conversion)/i.test(lower);
  const isCurrency =
    MONEY_FIELD_PATTERN.test(lower) &&
    !/(qty|quantity|count|orders?|users?|items?)$/i.test(lower);

  return {
    locale: "en-IN",
    style: isPercent ? "percent" : isCurrency ? "currency" : "number",
    currency: isCurrency ? "INR" : undefined,
    currencySymbol: isCurrency ? "₹" : undefined,
    precision: detectPrecision(values),
    useIndianCompact: true,
    valueKey,
  };
};

const trimTrailingZeroes = (value: string): string =>
  value.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");

export const formatSmartNumber = (
  value: unknown,
  format: SmartNumberFormat,
): string => {
  const numericValue = toFiniteNumber(value) ?? 0;
  const sign = numericValue < 0 ? "-" : "";
  const abs = Math.abs(numericValue);

  if (format.style === "percent") {
    const percentValue = abs <= 1 ? abs * 100 : abs;
    const body = trimTrailingZeroes(
      percentValue.toFixed(Math.min(2, Math.max(1, format.precision))),
    );
    return `${sign}${body}%`;
  }

  const precision = format.precision;
  let body: string;
  if (format.useIndianCompact && abs >= 10_000_000) {
    body = `${trimTrailingZeroes((abs / 10_000_000).toFixed(1))}Cr`;
  } else if (format.useIndianCompact && abs >= 100_000) {
    body = `${trimTrailingZeroes((abs / 100_000).toFixed(1))}L`;
  } else {
    body = new Intl.NumberFormat(format.locale, {
      maximumFractionDigits: precision,
      minimumFractionDigits: 0,
    }).format(abs);
  }

  return `${sign}${format.currencySymbol ?? ""}${body}`;
};

const getInsights = (
  data: SmartProcessedDatum[],
  groupBy: string | null,
  valueKey: string | null,
  groupField: SmartFieldAnalysis | null,
  numberFormat: SmartNumberFormat,
): SmartInsight[] => {
  if (data.length === 0) return [];

  const metricLabel = formatKey(valueKey ?? "Value");
  const groupLabel = formatKey(groupBy ?? "Category");
  const sortedByValue = [...data].sort((a, b) => b.total - a.total);
  const top = sortedByValue[0];
  const lowest = sortedByValue[sortedByValue.length - 1];
  const insights: SmartInsight[] = [];

  insights.push({
    kind: "top",
    label: `Top ${groupLabel}`,
    value: `${top.name} (${formatSmartNumber(top.total, numberFormat)})`,
    tone: top.total >= 0 ? "positive" : "negative",
  });

  if (data.length > 1 && lowest.name !== top.name) {
    insights.push({
      kind: "low",
      label: `Lowest ${groupLabel}`,
      value: `${lowest.name} (${formatSmartNumber(lowest.total, numberFormat)})`,
      tone: "neutral",
    });
  }

  const grandTotal = data.reduce(
    (sum, datum) => sum + Math.abs(datum.total),
    0,
  );
  if (grandTotal > 0) {
    insights.push({
      kind: "share",
      label: "Top contribution",
      value: `${top.name} contributes ${trimTrailingZeroes(top.percent.toFixed(1))}%`,
      tone: "neutral",
    });
  }

  if (groupField?.kind === "temporal" && data.length >= 2) {
    const first = data[0];
    const last = data[data.length - 1];
    const change =
      first.total === 0
        ? 0
        : ((last.total - first.total) / Math.abs(first.total)) * 100;
    const direction =
      change > 0 ? "increased" : change < 0 ? "declined" : "remained flat";
    insights.push({
      kind: "trend",
      label: `${metricLabel} trend`,
      value:
        change === 0
          ? `${metricLabel} remained flat`
          : `${metricLabel} ${direction} ${trimTrailingZeroes(Math.abs(change).toFixed(1))}%`,
      tone: change > 0 ? "positive" : change < 0 ? "negative" : "neutral",
    });
  }

  if (data.length >= 5) {
    const mean =
      data.reduce((sum, datum) => sum + datum.total, 0) / data.length;
    const variance =
      data.reduce((sum, datum) => sum + Math.pow(datum.total - mean, 2), 0) /
      data.length;
    const deviation = Math.sqrt(variance);
    const outlier = sortedByValue.find(
      (datum) => deviation > 0 && datum.total > mean + deviation * 2,
    );
    if (outlier) {
      insights.push({
        kind: "outlier",
        label: "Outlier",
        value: `${outlier.name} is unusually high`,
        tone: "warning",
      });
    }
  }

  return insights.slice(0, 4);
};

const getEmptyState = (
  rows: Record<string, unknown>[],
  processedData: SmartProcessedDatum[],
  fields: SmartFieldAnalysis[],
  chartType: SmartChartType,
): SmartEmptyState => {
  if (rows.length === 0) {
    return {
      isEmpty: true,
      title: "No data to visualize",
      message: "The response did not return rows that can be plotted.",
      suggestions: [
        "Switch to table view",
        "Ask for a grouped or numeric result",
      ],
    };
  }

  if (fields.length === 0) {
    return {
      isEmpty: true,
      title: "No fields detected",
      message: "The rows do not contain named fields for a chart.",
      suggestions: [
        "Switch to table view",
        "Ask for columns with labels and values",
      ],
    };
  }

  if (processedData.length === 0) {
    const chartName = formatKey(chartType);
    return {
      isEmpty: true,
      title: `${chartName} cannot be generated`,
      message:
        "This dataset does not have the field combination required for the selected chart.",
      suggestions: [
        "Switch to table view",
        "Choose a category and numeric value",
        "Try the automatic chart type",
      ],
    };
  }

  return {
    isEmpty: false,
    title: "",
    message: "",
    suggestions: [],
  };
};

const getResponsiveSettings = (
  data: SmartProcessedDatum[],
  orientation: SmartOrientation,
) => {
  const categoryCount = data.length;
  const isDense = categoryCount > 10;
  const height =
    orientation === "horizontal"
      ? Math.min(380, Math.max(200, categoryCount * 28 + 100))
      : Math.min(380, Math.max(200, categoryCount > 12 ? 360 : 280));

  return {
    minHeight: 200,
    height,
    maxHeight: 380,
    categoryCount,
    isDense,
  };
};

export const getSmartChartConfig = (
  data: unknown[],
  overrides: SmartChartOverrides = {},
): SmartChartConfig => {
  const rawRows = normalizeRows(Array.isArray(data) ? data : []);
  const fields = analyzeSmartFields(rawRows);
  const requestedChartType = normalizeChartType(overrides.chartType);
  const groupField = chooseGroupField(rawRows, fields, overrides.groupBy);
  const valueField = chooseValueField(fields, groupField, overrides.valueKey);
  const autoChartType = detectAutoChartType(
    rawRows,
    fields,
    groupField,
    valueField,
  );
  const chartType =
    requestedChartType && !overrides.forceAutoChartType
      ? requestedChartType
      : autoChartType;
  const aggregation = detectAggregation(valueField, overrides.aggregate);
  const secondaryField = chooseSecondaryGroupField(
    fields,
    groupField,
    chartType,
  );
  const topNThreshold = overrides.topN ?? 10;
  const topNEnabled = overrides.enableTopN ?? true;

  let processedData: SmartProcessedDatum[] = [];
  let seriesKeys: string[] = ["value"];
  let xAxisKey: string | null = groupField?.key ?? null;
  let yAxisKey: string | null = valueField?.key ?? null;
  let metricKeys: string[] = valueField ? [valueField.key] : [];
  let treemapData: SmartProcessedDatum[] = [];
  let radarIndicators: { name: string; max: number }[] = [];

  if (chartType === "scatter") {
    const scatter = buildScatterRows(rawRows, fields, groupField, valueField);
    processedData = scatter.data;
    xAxisKey = scatter.xAxisKey;
    yAxisKey = scatter.yAxisKey;
    seriesKeys = yAxisKey ? [yAxisKey] : [];
    metricKeys = yAxisKey ? [yAxisKey] : [];
  } else if (chartType === "radar") {
    const radar = buildRadarRows(rawRows, fields, groupField, aggregation);
    processedData = radar.data;
    seriesKeys = radar.metricKeys;
    metricKeys = radar.metricKeys;
    const maxValue = Math.max(
      1,
      ...processedData.flatMap((datum) =>
        radar.metricKeys.map((key) => Math.abs(datum.values[key] ?? 0)),
      ),
    );
    radarIndicators = radar.metricKeys.map((key) => ({
      name: formatKey(key),
      max: maxValue * 1.15,
    }));
  } else if (chartType === "treemap") {
    treemapData = buildTreemapRows(
      rawRows,
      groupField,
      valueField,
      secondaryField,
      aggregation,
    );
    processedData = treemapData;
    seriesKeys = ["value"];
  } else {
    const aggregated = aggregateRows(
      rawRows,
      groupField,
      valueField,
      secondaryField,
      aggregation,
    );
    processedData = aggregated.data;
    seriesKeys = aggregated.seriesKeys;
  }

  const sortedAndLimited = applySortingAndTopN(
    processedData,
    chartType,
    groupField,
    seriesKeys,
    topNThreshold,
    topNEnabled,
  );
  processedData = applyPercentages(sortedAndLimited.data);

  if (chartType === "treemap") {
    treemapData = applyPercentages(
      sortedAndLimited.data.map((datum) => ({
        ...datum,
        children: datum.children
          ? applyPercentages(datum.children.sort((a, b) => b.total - a.total))
          : undefined,
      })),
    );
  }

  const maxLabelLength = Math.max(
    0,
    ...processedData.map((datum) => datum.name.length),
  );
  const categoryCount = processedData.length;
  const smartHorizontal =
    chartType === "bar" && (categoryCount > 10 || maxLabelLength > 16);
  const requestedOrientation = normalizeOrientation(overrides.orientation);
  const orientation =
    chartType === "bar"
      ? smartHorizontal
        ? "horizontal"
        : (requestedOrientation ?? "vertical")
      : (requestedOrientation ?? "vertical");

  const numericValues = processedData.flatMap((datum) =>
    seriesKeys.map((key) => datum.values[key] ?? datum.total),
  );
  const numberFormat = detectNumberFormat(
    yAxisKey ?? valueField?.key ?? null,
    numericValues,
  );
  const responsive = getResponsiveSettings(processedData, orientation);
  const dense = responsive.isDense || maxLabelLength > 16;
  const axis = {
    xLabelRotate:
      orientation === "vertical" && ["bar", "line", "area"].includes(chartType)
        ? dense
          ? 45
          : 0
        : 0,
    yLabelRotate: 0,
    truncateLength: orientation === "horizontal" ? 28 : dense ? 14 : 18,
    gridLeft:
      orientation === "horizontal"
        ? Math.min(220, Math.max(92, maxLabelLength * 7))
        : 40,
    gridRight: 10,
    gridTop: 20,
    gridBottom: dense ? 86 : 30,
    dataZoom: categoryCount > 24 && ["bar", "line", "area"].includes(chartType),
  };
  const label = {
    show:
      (chartType === "pie" && categoryCount <= 6) ||
      (chartType === "bar" && categoryCount <= 10 && seriesKeys.length <= 2) ||
      chartType === "funnel",
    rotate: 0,
    maxLength: axis.truncateLength,
    hideOverlap: true,
  };

  const insights = getInsights(
    processedData,
    groupField?.key ?? null,
    yAxisKey ?? valueField?.key ?? null,
    groupField,
    numberFormat,
  );
  const emptyState = getEmptyState(rawRows, processedData, fields, chartType);

  const groupByOptions = fields
    .filter((field) => !field.isIdentifier && field.kind !== "numeric")
    .map((field) => field.key);
  const valueKeyOptions = fields
    .filter((field) => field.kind === "numeric" && !field.isIdentifier)
    .map((field) => field.key);

  return {
    rawRows,
    chartType,
    autoChartType,
    requestedChartType,
    orientation,
    aggregation,
    groupBy: groupField?.key ?? null,
    valueKey: valueField?.key ?? null,
    secondaryGroupBy: secondaryField?.key ?? null,
    xAxisKey,
    yAxisKey,
    metricKeys,
    seriesKeys,
    groupByOptions,
    valueKeyOptions,
    fieldAnalysis: fields,
    processedData,
    treemapData,
    radarIndicators,
    sorting: sortedAndLimited.sorting,
    topN: sortedAndLimited.topN,
    numberFormat,
    responsive,
    label,
    axis,
    tooltip: {
      trigger: ["bar", "line", "area"].includes(chartType) ? "axis" : "item",
      showPercent: ["pie", "funnel", "treemap", "bar"].includes(chartType),
      showInsights: insights.length > 0,
    },
    insights,
    emptyState,
  };
};

const hexToRgba = (hex: string, alpha = 1): string => {
  const normalized = hex.replace("#", "");
  const r = parseInt(
    normalized.length === 3
      ? normalized.slice(0, 1).repeat(2)
      : normalized.slice(0, 2),
    16,
  );
  const g = parseInt(
    normalized.length === 3
      ? normalized.slice(1, 2).repeat(2)
      : normalized.slice(2, 4),
    16,
  );
  const b = parseInt(
    normalized.length === 3
      ? normalized.slice(2, 3).repeat(2)
      : normalized.slice(4, 6),
    16,
  );
  return `rgba(${r},${g},${b},${alpha})`;
};

const getPalette = (theme: Theme): string[] =>
  theme.colors.barColors?.length ? theme.colors.barColors : DEFAULT_PALETTE;

const makeGradient = (
  color: string,
  orientation: SmartOrientation,
  alpha = 1,
) =>
  orientation === "horizontal"
    ? new echarts.graphic.LinearGradient(0, 0, 1, 0, [
        { offset: 0, color: hexToRgba(color, alpha * 0.75) },
        { offset: 1, color: hexToRgba(color, alpha) },
      ])
    : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: hexToRgba(color, alpha) },
        { offset: 1, color: hexToRgba(color, alpha * 0.68) },
      ]);

const makeTooltipFormatter =
  (config: SmartChartConfig, theme: Theme) =>
  (params: unknown): string => {
    const payload = Array.isArray(params) ? params : [params];
    const entries = payload.filter(Boolean) as Array<{
      marker?: string;
      name?: string;
      seriesName?: string;
      axisValue?: string;
      value?: unknown;
      percent?: number;
      color?: string;
      data?: { percent?: number; name?: string; value?: number };
    }>;
    if (entries.length === 0) return "";

    const first = entries[0];
    const title = first.axisValue ?? first.name ?? first.data?.name ?? "";
    const insight = config.insights[0];

    const rows = entries
      .map((entry) => {
        const rawValue = Array.isArray(entry.value)
          ? entry.value[1]
          : typeof entry.value === "object" && entry.value !== null
            ? (entry.value as { value?: unknown }).value
            : entry.value;
        const numericValue = toFiniteNumber(rawValue) ?? entry.data?.value ?? 0;
        const percent =
          entry.percent ??
          entry.data?.percent ??
          config.processedData.find(
            (datum) => datum.name === (entry.name ?? title),
          )?.percent;
        const label =
          entry.seriesName && entry.seriesName !== "value"
            ? formatKey(entry.seriesName)
            : formatKey(entry.name ?? entry.data?.name ?? "Value");
        const percentText =
          config.tooltip.showPercent && percent !== undefined
            ? `<span style="color:${theme.colors.textSecondary};margin-left:8px;">${trimTrailingZeroes(percent.toFixed(1))}%</span>`
            : "";
        const color =
          typeof entry.color === "string" ? entry.color : theme.colors.accent;
        return `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:8px 0;border-top:1px solid ${theme.colors.border};">
            <span style="display:flex;align-items:center;gap:8px;color:${theme.colors.textSecondary};">
              <span style="width:9px;height:9px;border-radius:99px;background:${color};display:inline-block;"></span>
              ${escapeHtml(label)}
            </span>
            <span style="font-weight:${theme.typography.weight.bold};color:${theme.colors.text};white-space:nowrap;">
              ${escapeHtml(formatSmartNumber(numericValue, config.numberFormat))}${percentText}
            </span>
          </div>
        `;
      })
      .join("");

    return `
      <div style="
        min-width:220px;
        max-width:320px;
        padding:14px 16px;
        color:${theme.colors.text};
        background:${theme.colors.surfaceGlass};
        border:1px solid ${theme.colors.border};
        border-radius:${theme.borderRadius.large};
        box-shadow:${theme.shadow.lg};
        backdrop-filter:blur(18px) saturate(180%);
        -webkit-backdrop-filter:blur(18px) saturate(180%);
        font-family:${theme.typography.fontFamily};
      ">
        <div style="height:3px;background:${theme.gradients.primary};border-radius:99px;margin:-4px 0 10px;"></div>
        <div style="font-size:14px;font-weight:${theme.typography.weight.bold};margin-bottom:4px;">
          ${escapeHtml(formatKey(title))}
        </div>
        ${rows}
        ${
          insight
            ? `<div style="margin-top:8px;color:${theme.colors.textSecondary};font-size:12px;">${escapeHtml(insight.label)}: ${escapeHtml(insight.value)}</div>`
            : ""
        }
      </div>
    `;
  };

const makeValueAxis = (
  config: SmartChartConfig,
  theme: Theme,
  name?: string | null,
) => ({
  type: "value",
  name: name ? formatKey(name) : undefined,
  nameTextStyle: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  axisTick: { show: false },
  axisLine: { show: false },
  axisLabel: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    formatter: (value: number) => formatSmartNumber(value, config.numberFormat),
  },
  splitLine: {
    lineStyle: {
      type: "dashed",
      color: `${theme.colors.textSecondary}33`,
    },
  },
});

const makeCategoryAxis = (
  config: SmartChartConfig,
  theme: Theme,
  axis: "x" | "y",
) => ({
  type: "category",
  data: config.processedData.map((datum) => datum.name),
  inverse: axis === "y" && config.orientation === "horizontal",
  axisTick: { show: false },
  axisLine: {
    lineStyle: {
      color: `${theme.colors.textSecondary}55`,
    },
  },
  axisLabel: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    rotate: axis === "x" ? config.axis.xLabelRotate : config.axis.yLabelRotate,
    hideOverlap: true,
    overflow: "truncate",
    width: axis === "y" ? config.axis.gridLeft - 20 : undefined,
    formatter: (value: string) =>
      truncateLabel(value, config.axis.truncateLength),
  },
});

const getSeriesData = (
  config: SmartChartConfig,
  seriesKey: string,
  color: string,
  theme: Theme,
) =>
  config.processedData.map((datum) => {
    const value = datum.values[seriesKey] ?? datum.total;
    const isNegative = value < 0;
    return {
      value,
      itemStyle: {
        color: isNegative
          ? theme.colors.error
          : makeGradient(color, config.orientation),
        borderRadius:
          config.orientation === "horizontal" ? [0, 6, 6, 0] : [6, 6, 0, 0],
      },
    };
  });

export const getSmartEChartsOption = (
  config: SmartChartConfig,
  theme: Theme,
): EChartsOption => {
  if (config.emptyState.isEmpty) return {};

  const palette = getPalette(theme);
  const showLegend =
    config.chartType === "pie"
      ? config.processedData.length <= 6
      : config.seriesKeys.length > 1 && config.seriesKeys.length <= 6;

  const baseOption: EChartsOption = {
    animationDuration: 450,
    animationEasing: "cubicOut",
    color: palette,
    backgroundColor: "transparent",
    textStyle: {
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.text,
    },
    tooltip: {
      trigger: config.tooltip.trigger,
      confine: true,
      appendToBody: true,
      backgroundColor: "transparent",
      borderWidth: 0,
      padding: 0,
      extraCssText: "box-shadow:none;",
      axisPointer: {
        type: ["line", "area"].includes(config.chartType) ? "line" : "shadow",
        shadowStyle: {
          color: `${theme.colors.accent}14`,
        },
        lineStyle: {
          color: `${theme.colors.accent}88`,
          width: 2,
        },
      },
      formatter: makeTooltipFormatter(config, theme),
    },
    legend: showLegend
      ? {
          bottom: 0,
          left: "center",
          icon: "circle",
          itemWidth: 10,
          itemHeight: 10,
          itemGap: 14,
          textStyle: {
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.fontFamily,
            fontSize: 12,
          },
          formatter: (name: string) => formatKey(name),
        }
      : { show: false },
  };

  if (config.chartType === "pie") {
    return {
      ...baseOption,
      series: [
        {
          name: formatKey(config.valueKey ?? "Value"),
          type: "pie",
          radius: ["62%", "80%"],
          center: ["50%", "46%"],
          avoidLabelOverlap: true,
          minAngle: 4,
          itemStyle: {
            borderColor: theme.colors.surface,
            borderWidth: 2,
            borderRadius: 6,
          },
          label: {
            show: config.label.show,
            color: theme.colors.textSecondary,
            formatter: (params: { name: string; percent: number }) =>
              `${truncateLabel(params.name, 10)}\n${trimTrailingZeroes(params.percent.toFixed(1))}%`,
          },
          labelLine: { show: config.label.show, smooth: true, length: 5, length2: 3 },
          data: config.processedData.map((datum, index) => ({
            name: datum.name,
            value: Math.max(0, datum.total),
            percent: datum.percent,
            itemStyle: {
              color: palette[index % palette.length],
            },
          })),
        },
      ],
    };
  }

  if (config.chartType === "funnel") {
    return {
      ...baseOption,
      series: [
        {
          name: formatKey(config.valueKey ?? "Value"),
          type: "funnel",
          left: "7%",
          top: 18,
          bottom: showLegend ? 46 : 16,
          width: "86%",
          min: 0,
          max: Math.max(1, ...config.processedData.map((datum) => datum.total)),
          sort: "descending",
          gap: 3,
          label: {
            show: true,
            position: "inside",
            color: "#fff",
            formatter: (params: { name: string; value: number }) =>
              `${truncateLabel(params.name, 18)}  ${formatSmartNumber(params.value, config.numberFormat)}`,
          },
          itemStyle: {
            borderColor: theme.colors.surface,
            borderWidth: 1,
          },
          data: config.processedData.map((datum) => ({
            name: datum.name,
            value: Math.max(0, datum.total),
            percent: datum.percent,
          })),
        },
      ],
    };
  }

  if (config.chartType === "treemap") {
    return {
      ...baseOption,
      tooltip: { ...baseOption.tooltip, trigger: "item" },
      series: [
        {
          name: formatKey(config.valueKey ?? "Value"),
          type: "treemap",
          roam: false,
          nodeClick: "zoomToNode",
          breadcrumb: {
            show: true,
            bottom: 2,
            itemStyle: {
              color: theme.colors.surface,
              borderColor: theme.colors.border,
              textStyle: { color: theme.colors.textSecondary },
            },
          },
          top: 8,
          left: 8,
          right: 8,
          bottom: 32,
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
            show: config.processedData.length <= 18,
            color: "#fff",
            overflow: "truncate",
            formatter: (params: { name: string; value: number }) =>
              `${truncateLabel(params.name, 18)}\n${formatSmartNumber(params.value, config.numberFormat)}`,
          },
          data: config.treemapData.map((datum) => ({
            name: datum.name,
            value: Math.max(0, datum.total),
            percent: datum.percent,
            children: datum.children?.map((child) => ({
              name: child.name,
              value: Math.max(0, child.total),
              percent: child.percent,
            })),
          })),
        },
      ],
    };
  }

  if (config.chartType === "radar") {
    return {
      ...baseOption,
      tooltip: { ...baseOption.tooltip, trigger: "item" },
      radar: {
        center: ["50%", "51%"],
        radius: "64%",
        indicator: config.radarIndicators,
        axisName: {
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily,
        },
        splitArea: {
          areaStyle: {
            color: [`${theme.colors.accent}12`, `${theme.colors.accent}05`],
          },
        },
        splitLine: {
          lineStyle: { color: `${theme.colors.textSecondary}33` },
        },
        axisLine: {
          lineStyle: { color: `${theme.colors.textSecondary}33` },
        },
      },
      series: [
        {
          type: "radar",
          symbolSize: 6,
          lineStyle: { width: 2 },
          areaStyle: { opacity: 0.16 },
          data: config.processedData.map((datum) => ({
            name: datum.name,
            value: config.seriesKeys.map((key) => datum.values[key] ?? 0),
          })),
        },
      ],
    };
  }

  if (config.chartType === "scatter") {
    return {
      ...baseOption,
      tooltip: { ...baseOption.tooltip, trigger: "item" },
      grid: {
        left: 64,
        right: 32,
        top: 36,
        bottom: 56,
        containLabel: true,
      },
      xAxis: makeValueAxis(config, theme, config.xAxisKey),
      yAxis: makeValueAxis(config, theme, config.yAxisKey),
      series: [
        {
          name: formatKey(config.yAxisKey ?? "Value"),
          type: "scatter",
          symbolSize: (value: number[]) => {
            const y = Math.abs(value[1] ?? 0);
            return Math.min(22, Math.max(8, Math.sqrt(y || 1) * 1.6));
          },
          itemStyle: {
            color: hexToRgba(palette[0], 0.82),
            shadowBlur: 12,
            shadowColor: hexToRgba(palette[0], 0.36),
          },
          emphasis: {
            focus: "series",
          },
          data: config.processedData.map((datum) => ({
            name: datum.name,
            value: [datum.x ?? 0, datum.y ?? 0],
          })),
        },
      ],
    };
  }

  const isHorizontal = config.orientation === "horizontal";
  const categoryAxis = makeCategoryAxis(
    config,
    theme,
    isHorizontal ? "y" : "x",
  );
  const valueAxis = makeValueAxis(config, theme, config.yAxisKey);

  return {
    ...baseOption,
    grid: {
      left: config.axis.gridLeft,
      right: config.axis.gridRight,
      top: config.axis.gridTop,
      bottom: showLegend
        ? Math.max(config.axis.gridBottom, 44)
        : config.axis.gridBottom,
      containLabel: true,
    },
    dataZoom: config.axis.dataZoom
      ? [
          {
            type: "inside",
            throttle: 50,
            zoomLock: false,
          },
          {
            type: "slider",
            height: 14,
            bottom: 24,
            borderColor: theme.colors.border,
            fillerColor: `${theme.colors.accent}33`,
            handleStyle: { color: theme.colors.accent },
            textStyle: { color: theme.colors.textSecondary },
          },
        ]
      : undefined,
    xAxis: isHorizontal ? valueAxis : categoryAxis,
    yAxis: isHorizontal ? categoryAxis : valueAxis,
    series: config.seriesKeys.map((seriesKey, index) => {
      const color = palette[index % palette.length];
      const isLine = config.chartType === "line" || config.chartType === "area";
      return {
        name: seriesKey,
        type: isLine ? "line" : "bar",
        stack:
          config.seriesKeys.length > 1 &&
          ["bar", "area"].includes(config.chartType)
            ? "total"
            : undefined,
        smooth: isLine,
        showSymbol: config.processedData.length <= 28,
        symbolSize: 7,
        barMaxWidth: isHorizontal ? 24 : 54,
        barCategoryGap: config.processedData.length <= 3 ? "42%" : "18%",
        data: getSeriesData(config, seriesKey, color, theme),
        lineStyle: isLine
          ? {
              width: 3,
              color,
            }
          : undefined,
        areaStyle:
          config.chartType === "area"
            ? {
                opacity: 0.24,
                color: makeGradient(color, "vertical", 0.8),
              }
            : undefined,
        label: {
          show: config.label.show && !isLine,
          position: isHorizontal ? "right" : "top",
          color: theme.colors.textSecondary,
          formatter: (params: { value: number }) =>
            formatSmartNumber(params.value, config.numberFormat),
          hideOverlap: config.label.hideOverlap,
        },
        emphasis: {
          focus: "series",
        },
      };
    }),
  };
};
