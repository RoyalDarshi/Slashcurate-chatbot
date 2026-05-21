import { formatTableValue, toFiniteNumber } from "./formatting";
import type {
  SmartCellRenderModel,
  SmartTableColumn,
  SmartTableRow,
} from "./types";

const getStatusTone = (
  value: string
): SmartCellRenderModel["badgeTone"] => {
  const normalized = value.toLowerCase();
  if (/(success|completed|complete|active|approved|paid|won|good|high)/.test(normalized)) {
    return "positive";
  }
  if (/(failed|error|inactive|rejected|cancelled|canceled|lost|bad|low|overdue)/.test(normalized)) {
    return "negative";
  }
  if (/(pending|waiting|hold|medium|review|open|warning)/.test(normalized)) {
    return "warning";
  }
  return "info";
};

const getHeatPercent = (value: unknown, column: SmartTableColumn): number | undefined => {
  const numericValue = toFiniteNumber(value);
  if (numericValue === null || column.stats.min === undefined || column.stats.max === undefined) {
    return undefined;
  }
  const range = column.stats.max - column.stats.min;
  if (range <= 0) return undefined;
  return Math.max(0, Math.min(100, ((numericValue - column.stats.min) / range) * 100));
};

export const getCellRenderModel = (
  row: SmartTableRow,
  column: SmartTableColumn
): SmartCellRenderModel => {
  const rawValue = row[column.key];
  const displayValue = formatTableValue(rawValue, column);
  const numericValue = toFiniteNumber(rawValue);
  const heatPercent = getHeatPercent(rawValue, column);
  const isAnomaly =
    numericValue !== null &&
    column.stats.mean !== undefined &&
    column.stats.standardDeviation !== undefined &&
    column.stats.standardDeviation > 0 &&
    Math.abs(numericValue - column.stats.mean) > column.stats.standardDeviation * 2;

  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return {
      rawValue,
      displayValue: "N/A",
      kind: "empty",
      title: `${column.label}: empty`,
    };
  }

  if (column.type === "url") {
    const href = String(rawValue).startsWith("http")
      ? String(rawValue)
      : `https://${String(rawValue)}`;
    return { rawValue, displayValue, kind: "link", href, title: href };
  }

  if (column.type === "email") {
    return {
      rawValue,
      displayValue,
      kind: "link",
      href: `mailto:${String(rawValue)}`,
      title: displayValue,
    };
  }

  if (column.type === "phone") {
    return {
      rawValue,
      displayValue,
      kind: "link",
      href: `tel:${String(rawValue).replace(/[^\d+]/g, "")}`,
      title: displayValue,
    };
  }

  if (column.type === "image") {
    return {
      rawValue,
      displayValue,
      kind: "image",
      imageUrl: String(rawValue),
      title: displayValue,
    };
  }

  if (column.type === "boolean") {
    const normalized = String(rawValue).toLowerCase();
    const truthy = rawValue === true || normalized === "true" || normalized === "yes" || normalized === "y";
    return {
      rawValue,
      displayValue: truthy ? "Yes" : "No",
      kind: "badge",
      badgeTone: truthy ? "positive" : "neutral",
      title: displayValue,
    };
  }

  if (column.type === "status") {
    return {
      rawValue,
      displayValue,
      kind: "badge",
      badgeTone: getStatusTone(displayValue),
      title: displayValue,
    };
  }

  if (column.type === "json") {
    return {
      rawValue,
      displayValue,
      kind: "json",
      title: displayValue,
    };
  }

  if (numericValue !== null && ["numeric", "currency", "percentage"].includes(column.type)) {
    return {
      rawValue,
      displayValue,
      kind: "number",
      title: displayValue,
      heatPercent,
      progressPercent:
        column.stats.max && column.stats.max > 0
          ? Math.max(0, Math.min(100, (Math.abs(numericValue) / column.stats.max) * 100))
          : undefined,
      isAnomaly,
      isPositive: numericValue > 0,
      isNegative: numericValue < 0,
    };
  }

  return {
    rawValue,
    displayValue,
    kind: "text",
    title: displayValue,
  };
};
