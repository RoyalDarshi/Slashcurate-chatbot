import { formatSmartNumber, toFiniteNumber } from "./formatting";
import type {
  SmartTableAggregation,
  SmartTableColumn,
  SmartTableRow,
  SmartTableSummary,
} from "./types";

const chooseAggregation = (column: SmartTableColumn): SmartTableAggregation => {
  if (column.type === "percentage") return "avg";
  if (/rating|score|avg|average|rate/i.test(column.key)) return "avg";
  if (/min/i.test(column.key)) return "min";
  if (/max/i.test(column.key)) return "max";
  return "sum";
};

export const summarizeColumn = (
  rows: SmartTableRow[],
  column: SmartTableColumn
): SmartTableSummary | null => {
  if (!column.canSummarize || !column.numberFormat) return null;

  const values = rows
    .map((row) => toFiniteNumber(row[column.key]))
    .filter((value): value is number => value !== null);
  if (values.length === 0) return null;

  const aggregation = chooseAggregation(column);
  let rawValue = 0;
  if (aggregation === "avg") {
    rawValue = values.reduce((total, value) => total + value, 0) / values.length;
  } else if (aggregation === "min") {
    rawValue = Math.min(...values);
  } else if (aggregation === "max") {
    rawValue = Math.max(...values);
  } else if (aggregation === "count") {
    rawValue = values.length;
  } else {
    rawValue = values.reduce((total, value) => total + value, 0);
  }

  return {
    key: column.key,
    label:
      aggregation === "sum"
        ? `Total ${column.label}`
        : aggregation === "avg"
          ? `Average ${column.label}`
          : `${aggregation.toUpperCase()} ${column.label}`,
    aggregation,
    rawValue,
    value: formatSmartNumber(rawValue, column.numberFormat),
  };
};

export const generateSummaries = (
  rows: SmartTableRow[],
  columns: SmartTableColumn[]
): SmartTableSummary[] =>
  columns
    .map((column) => summarizeColumn(rows, column))
    .filter((summary): summary is SmartTableSummary => summary !== null)
    .slice(0, 6);
