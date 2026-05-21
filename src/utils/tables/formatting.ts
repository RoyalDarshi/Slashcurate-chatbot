import type {
  SmartTableColumn,
  SmartTableDateFormat,
  SmartTableNumberFormat,
} from "./types";

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

export const formatColumnLabel = (key: string): string =>
  key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\s+/g, " ")
    .replace(/^./, (value) => value.toUpperCase())
    .trim();

export const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  let multiplier = 1;
  if (/(crore|crores|cr)$/.test(normalized)) multiplier = 10_000_000;
  else if (/(lakh|lakhs|lac|lacs|l)$/.test(normalized)) multiplier = 100_000;
  else if (/k$/.test(normalized)) multiplier = 1_000;
  else if (/m$/.test(normalized)) multiplier = 1_000_000;
  else if (/b$/.test(normalized)) multiplier = 1_000_000_000;

  const cleaned = normalized
    .replace(/(crores?|cr|lakhs?|lacs?|l|k|m|b)$/i, "")
    .replace(/[₹$€£,\s%]/g, "")
    .replace(/rs\.?/gi, "");

  if (!cleaned || cleaned === "-" || cleaned === ".") return null;
  const numericValue = Number(cleaned);
  return Number.isFinite(numericValue) ? numericValue * multiplier : null;
};

export const parseSmartDate = (
  value: unknown,
  key = ""
): { timestamp: number; granularity: SmartTableDateFormat["granularity"] } | null => {
  const lowerKey = key.toLowerCase();

  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) ? { timestamp: time, granularity: "datetime" } : null;
  }

  if ((typeof value === "number" || typeof value === "string") && /year/.test(lowerKey)) {
    const year = Number(value);
    if (Number.isInteger(year) && year >= 1900 && year <= 2200) {
      return { timestamp: new Date(year, 0, 1).getTime(), granularity: "year" };
    }
  }

  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  const lower = text.toLowerCase();

  const quarter = text.match(/^(\d{4})[-\s]?q([1-4])$/i);
  if (quarter) {
    return {
      timestamp: new Date(Number(quarter[1]), (Number(quarter[2]) - 1) * 3, 1).getTime(),
      granularity: "quarter",
    };
  }

  const yearMonth = text.match(/^(\d{4})[-/](\d{1,2})$/);
  if (yearMonth) {
    return {
      timestamp: new Date(Number(yearMonth[1]), Number(yearMonth[2]) - 1, 1).getTime(),
      granularity: "month",
    };
  }

  const monthIndex = MONTH_INDEX[lower];
  if (monthIndex !== undefined && /month/.test(lowerKey)) {
    return {
      timestamp: new Date(2000, monthIndex, 1).getTime(),
      granularity: "month",
    };
  }

  const monthYear = text.match(
    /^(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)[a-z]*[\s,-]+(\d{4})$/i
  );
  if (monthYear) {
    return {
      timestamp: new Date(Number(monthYear[2]), MONTH_INDEX[monthYear[1].toLowerCase()], 1).getTime(),
      granularity: "month",
    };
  }

  const looksTemporal =
    /(date|time|created|updated|timestamp|month|year|quarter|period)/i.test(key) ||
    /[-/:T]/.test(text);
  if (!looksTemporal) return null;

  const parsed = Date.parse(text);
  if (!Number.isFinite(parsed)) return null;

  const granularity = /T|\d{1,2}:\d{2}/.test(text) ? "datetime" : "date";
  return { timestamp: parsed, granularity };
};

export const detectDecimalPrecision = (values: number[]): number => {
  const finiteValues = values.filter(Number.isFinite);
  if (finiteValues.length === 0) return 0;
  if (finiteValues.every((value) => Number.isInteger(value))) return 0;
  const maxAbs = Math.max(...finiteValues.map((value) => Math.abs(value)));
  if (maxAbs < 10) return 2;
  if (maxAbs < 100) return 1;
  return 2;
};

const trimZeroes = (value: string): string =>
  value.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");

export const formatSmartNumber = (
  value: unknown,
  format: SmartTableNumberFormat
): string => {
  const numericValue = toFiniteNumber(value) ?? 0;
  const sign = numericValue < 0 ? "-" : "";
  const abs = Math.abs(numericValue);

  if (format.style === "percentage") {
    const percent = abs <= 1 ? abs * 100 : abs;
    return `${sign}${trimZeroes(percent.toFixed(Math.max(0, format.precision)))}%`;
  }

  let body: string;
  if (format.compact && abs >= 10_000_000) {
    body = `${trimZeroes((abs / 10_000_000).toFixed(2))}Cr`;
  } else if (format.compact && abs >= 100_000) {
    body = `${trimZeroes((abs / 100_000).toFixed(2))}L`;
  } else {
    body = new Intl.NumberFormat(format.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: format.precision,
    }).format(abs);
  }

  return `${sign}${format.currencySymbol ?? ""}${body}`;
};

export const formatSmartDate = (
  value: unknown,
  format: SmartTableDateFormat,
  key = ""
): string => {
  const parsed = parseSmartDate(value, key);
  if (!parsed) return String(value ?? "");
  const date = new Date(parsed.timestamp);
  const granularity = format.granularity ?? parsed.granularity;

  if (granularity === "year") {
    return new Intl.DateTimeFormat(format.locale, { year: "numeric" }).format(date);
  }
  if (granularity === "month") {
    return new Intl.DateTimeFormat(format.locale, {
      month: "short",
      year: date.getFullYear() === 2000 ? undefined : "numeric",
    }).format(date);
  }
  if (granularity === "quarter") {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `Q${quarter} ${date.getFullYear()}`;
  }
  if (granularity === "datetime") {
    return new Intl.DateTimeFormat(format.locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }
  return new Intl.DateTimeFormat(format.locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const formatTableValue = (
  value: unknown,
  column: SmartTableColumn
): string => {
  if (value === null || value === undefined || value === "") return "N/A";
  if (column.numberFormat) return formatSmartNumber(value, column.numberFormat);
  if (column.dateFormat) return formatSmartDate(value, column.dateFormat, column.key);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};
