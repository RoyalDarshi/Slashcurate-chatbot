import {
  detectDecimalPrecision,
  formatColumnLabel,
  parseSmartDate,
  toFiniteNumber,
} from "./formatting";
import type {
  SmartTableAlignment,
  SmartTableColumn,
  SmartTableColumnStats,
  SmartTableColumnType,
  SmartTableFilterType,
  SmartTableRow,
} from "./types";

const CURRENCY_PATTERN =
  /(revenue|sales|profit|amount|price|cost|expense|income|earning|turnover|gmv|balance|payment|invoice|salary|budget|value)/i;
const PERCENTAGE_PATTERN =
  /(percent|percentage|growth|margin|ratio|rate|conversion|share|pct|%)/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s().-]{7,}$/;
const URL_PATTERN = /^(https?:\/\/|www\.)[^\s]+$/i;
const IMAGE_PATTERN = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i;
const STATUS_PATTERN =
  /(status|state|stage|priority|severity|result|condition|flag|active|enabled|approved)/i;
const IDENTIFIER_PATTERN =
  /(^id$|_id$|id$|uuid|guid|hash|token|code$|number$|no$|key$|password|secret)/i;

const isPresent = (value: unknown): boolean =>
  value !== null && value !== undefined && String(value).trim() !== "";

const toSampleStrings = (values: unknown[]): string[] =>
  values.filter(isPresent).map((value) => String(value).trim());

const isMostly = (count: number, total: number, ratio = 0.7): boolean =>
  total > 0 && count / total >= ratio;

const buildStats = (
  key: string,
  rows: SmartTableRow[],
  values: unknown[],
): SmartTableColumnStats => {
  const presentValues = values.filter(isPresent);
  const sampleStrings = toSampleStrings(values);
  const uniqueValues = Array.from(new Set(sampleStrings));
  const numericValues = presentValues
    .map(toFiniteNumber)
    .filter((value): value is number => value !== null);
  const dateValues = presentValues
    .map((value) => parseSmartDate(value, key))
    .filter((value): value is NonNullable<typeof value> => value !== null);
  const booleanCount = presentValues.filter(
    (value) =>
      typeof value === "boolean" ||
      /^(true|false|yes|no|y|n)$/i.test(String(value).trim()),
  ).length;
  const averageLength =
    sampleStrings.reduce((total, value) => total + value.length, 0) /
    Math.max(sampleStrings.length, 1);
  const mean =
    numericValues.reduce((total, value) => total + value, 0) /
    Math.max(numericValues.length, 1);
  const variance =
    numericValues.reduce(
      (total, value) => total + Math.pow(value - mean, 2),
      0,
    ) / Math.max(numericValues.length, 1);

  return {
    nonEmptyCount: presentValues.length,
    nullCount: rows.length - presentValues.length,
    uniqueCount: uniqueValues.length,
    numericRatio: numericValues.length / Math.max(presentValues.length, 1),
    dateRatio: dateValues.length / Math.max(presentValues.length, 1),
    booleanRatio: booleanCount / Math.max(presentValues.length, 1),
    averageLength,
    min: numericValues.length ? Math.min(...numericValues) : undefined,
    max: numericValues.length ? Math.max(...numericValues) : undefined,
    mean: numericValues.length ? mean : undefined,
    standardDeviation: numericValues.length ? Math.sqrt(variance) : undefined,
    missingPercent: rows.length
      ? ((rows.length - presentValues.length) / rows.length) * 100
      : 0,
    duplicateCount: Math.max(0, presentValues.length - uniqueValues.length),
    sampleValues: presentValues.slice(0, 8),
    uniqueValues: uniqueValues.slice(0, 100),
  };
};

const detectType = (
  key: string,
  stats: SmartTableColumnStats,
): SmartTableColumnType => {
  const lowerKey = key.toLowerCase();
  const samples = stats.sampleValues.map((value) => String(value).trim());

  if (
    samples.length &&
    isMostly(
      samples.filter((value) => EMAIL_PATTERN.test(value)).length,
      samples.length,
      0.8,
    )
  ) {
    return "email";
  }
  if (
    samples.length &&
    isMostly(
      samples.filter((value) => URL_PATTERN.test(value)).length,
      samples.length,
      0.8,
    )
  ) {
    if (samples.some((value) => IMAGE_PATTERN.test(value))) return "image";
    return "url";
  }
  if (
    samples.length &&
    isMostly(
      samples.filter((value) => IMAGE_PATTERN.test(value)).length,
      samples.length,
      0.8,
    )
  ) {
    return "image";
  }
  if (
    samples.length &&
    isMostly(
      samples.filter((value) => PHONE_PATTERN.test(value)).length,
      samples.length,
      0.8,
    ) &&
    /phone|mobile|contact/i.test(lowerKey)
  ) {
    return "phone";
  }
  if (stats.booleanRatio >= 0.8) return "boolean";

  const parsedDates = stats.sampleValues
    .map((value) => parseSmartDate(value, key))
    .filter((value): value is NonNullable<typeof value> => value !== null);

  // Only treat as date if either: data ratio is high, OR the key contains a standalone date keyword
  // AND the column is not primarily numeric (prevents "monthly_payment" → date misdetection)
  const hasDateKeyword =
    /(^|_)(date|time|created|updated|timestamp|month|year|quarter)(_|$)/i.test(
      lowerKey,
    );
  const isLikelyDate =
    stats.dateRatio >= 0.7 || (hasDateKeyword && parsedDates.length > 0);
  const isLikelyNumeric = stats.numericRatio >= 0.65;

  if (isLikelyDate && !isLikelyNumeric) {
    const granularity = parsedDates[0]?.granularity;
    if (granularity === "datetime") return "datetime";
    if (granularity === "month") return "month";
    if (granularity === "year") return "year";
    if (granularity === "quarter") return "quarter";
    return "date";
  }

  if (stats.numericRatio >= 0.75) {
    if (PERCENTAGE_PATTERN.test(lowerKey)) return "percentage";
    if (CURRENCY_PATTERN.test(lowerKey)) return "currency";
    if (IDENTIFIER_PATTERN.test(lowerKey)) return "identifier";
    return "numeric";
  }

  if (IDENTIFIER_PATTERN.test(lowerKey)) return "identifier";
  if (
    STATUS_PATTERN.test(lowerKey) ||
    (stats.uniqueCount > 1 &&
      stats.uniqueCount <= 8 &&
      stats.averageLength < 24)
  ) {
    return "status";
  }
  if (stats.uniqueCount > 1 && stats.uniqueCount <= 40) return "categorical";
  if (
    stats.sampleValues.some(
      (value) => typeof value === "object" && value !== null,
    )
  )
    return "json";
  return "text";
};

const getAlignment = (type: SmartTableColumnType): SmartTableAlignment => {
  if (["numeric", "currency", "percentage"].includes(type)) return "right";
  if (["boolean", "status", "image"].includes(type)) return "center";
  return "left";
};

const getFilterType = (
  type: SmartTableColumnType,
  stats: SmartTableColumnStats,
): SmartTableFilterType => {
  if (["numeric", "currency", "percentage"].includes(type))
    return "numberRange";
  if (["date", "datetime", "month", "year", "quarter"].includes(type))
    return "dateRange";
  if (type === "boolean") return "boolean";
  if (["status", "categorical"].includes(type) && stats.uniqueCount <= 50)
    return "multiSelect";
  if (type === "identifier" && stats.uniqueCount > 100) return "none";
  return "text";
};

const getWidth = (
  key: string,
  type: SmartTableColumnType,
  stats: SmartTableColumnStats,
) => {
  const labelWidth = formatColumnLabel(key).length * 9 + 48;
  const sampleWidth = Math.min(360, Math.max(80, stats.averageLength * 8 + 36));
  const typeBase: Record<SmartTableColumnType, number> = {
    numeric: 132,
    currency: 148,
    percentage: 124,
    date: 138,
    datetime: 190,
    month: 132,
    year: 92,
    quarter: 112,
    boolean: 104,
    categorical: 160,
    identifier: 160,
    email: 220,
    phone: 156,
    url: 240,
    image: 112,
    status: 128,
    json: 260,
    text: sampleWidth,
  };

  const width = Math.max(labelWidth, typeBase[type]);
  return Math.min(360, Math.max(92, width));
};

const isTechnicalColumn = (
  key: string,
  type: SmartTableColumnType,
  stats: SmartTableColumnStats,
  rowCount: number,
): boolean => {
  const lowerKey = key.toLowerCase();
  if (
    /(password|token|hash|secret|salt|internal|metadata|_raw|etag)/i.test(
      lowerKey,
    )
  ) {
    return true;
  }
  if (type !== "identifier") return false;
  if (
    /branch|customer|product|user|employee|account|order|invoice/i.test(
      lowerKey,
    )
  ) {
    return false;
  }
  return rowCount > 20 && stats.uniqueCount >= rowCount * 0.9;
};

export const detectSmartTableColumns = (
  rows: SmartTableRow[],
): SmartTableColumn[] => {
  if (rows.length === 0) return [];
  const keys = Array.from(
    rows.slice(0, 100).reduce((acc, row) => {
      Object.keys(row).forEach((key) => acc.add(key));
      return acc;
    }, new Set<string>()),
  );

  return keys.map((key) => {
    const values = rows.map((row) => row[key]);
    const stats = buildStats(key, rows, values);
    const type = detectType(key, stats);
    const numericValues = values
      .map(toFiniteNumber)
      .filter((value): value is number => value !== null);
    const isTechnical = isTechnicalColumn(key, type, stats, rows.length);
    const width = getWidth(key, type, stats);
    const granularity = [
      "date",
      "datetime",
      "month",
      "year",
      "quarter",
    ].includes(type)
      ? type === "date" ||
        type === "datetime" ||
        type === "month" ||
        type === "year" ||
        type === "quarter"
        ? type
        : "date"
      : undefined;

    return {
      key,
      label: formatColumnLabel(key),
      type,
      alignment: getAlignment(type),
      width,
      minWidth: Math.min(96, width),
      maxWidth: Math.max(width, type === "text" ? 420 : 300),
      sortable: type !== "json" && type !== "image",
      filterType: getFilterType(type, stats),
      hiddenByDefault: isTechnical,
      isTechnical,
      isMetric: ["numeric", "currency", "percentage"].includes(type),
      canSummarize: ["numeric", "currency", "percentage"].includes(type),
      numberFormat: ["numeric", "currency", "percentage"].includes(type)
        ? {
            locale: "en-IN",
            style:
              type === "currency"
                ? "currency"
                : type === "percentage"
                  ? "percentage"
                  : "number",
            currency: type === "currency" ? "INR" : undefined,
            currencySymbol: type === "currency" ? "₹" : undefined,
            precision:
              type === "percentage" ? 1 : detectDecimalPrecision(numericValues),
            compact:
              type === "currency" ||
              Math.max(0, ...numericValues.map(Math.abs)) >= 100_000,
          }
        : undefined,
      dateFormat: granularity
        ? {
            locale: "en-IN",
            granularity,
          }
        : undefined,
      stats,
    };
  });
};
