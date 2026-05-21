import { formatTableValue, parseSmartDate, toFiniteNumber } from "./formatting";
import type {
  SmartTableColumn,
  SmartTableColumnFilter,
  SmartTableRow,
} from "./types";

const normalize = (value: unknown): string =>
  String(value ?? "")
    .toLowerCase()
    .trim();

export const fuzzyIncludes = (source: string, query: string): boolean => {
  const text = normalize(source);
  const needle = normalize(query);
  if (!needle) return true;
  if (text.includes(needle)) return true;

  let index = 0;
  for (const character of text) {
    if (character === needle[index]) index += 1;
    if (index === needle.length) return true;
  }
  return false;
};

export const applyGlobalSearch = (
  rows: SmartTableRow[],
  columns: SmartTableColumn[],
  query: string
): SmartTableRow[] => {
  if (!query.trim()) return rows;
  const searchableColumns = columns.filter((column) => !column.hiddenByDefault);
  return rows.filter((row) =>
    searchableColumns.some((column) =>
      fuzzyIncludes(formatTableValue(row[column.key], column), query)
    )
  );
};

const matchesColumnFilter = (
  value: unknown,
  column: SmartTableColumn,
  filter: SmartTableColumnFilter
): boolean => {
  if (filter.type === "none") return true;
  if (filter.type === "text") return fuzzyIncludes(String(value ?? ""), filter.value ?? "");

  if (filter.type === "numberRange") {
    const numericValue = toFiniteNumber(value);
    if (numericValue === null) return false;
    if (filter.min !== null && filter.min !== undefined && numericValue < filter.min) return false;
    if (filter.max !== null && filter.max !== undefined && numericValue > filter.max) return false;
    return true;
  }

  if (filter.type === "dateRange") {
    const timestamp = parseSmartDate(value, column.key)?.timestamp;
    if (timestamp === undefined) return false;
    if (filter.start) {
      const start = Date.parse(filter.start);
      if (Number.isFinite(start) && timestamp < start) return false;
    }
    if (filter.end) {
      const end = Date.parse(filter.end);
      if (Number.isFinite(end) && timestamp > end + 86_399_999) return false;
    }
    return true;
  }

  if (filter.type === "boolean") {
    if (filter.booleanValue === null || filter.booleanValue === undefined) return true;
    const normalized = normalize(value);
    const boolValue = value === true || normalized === "true" || normalized === "yes" || normalized === "y";
    return boolValue === filter.booleanValue;
  }

  if (filter.type === "multiSelect") {
    if (!filter.values?.length) return true;
    return filter.values.includes(String(value ?? ""));
  }

  return true;
};

export const applyColumnFilters = (
  rows: SmartTableRow[],
  columns: SmartTableColumn[],
  filters: Record<string, SmartTableColumnFilter | undefined>
): SmartTableRow[] => {
  const activeFilters = Object.entries(filters).filter(([, filter]) => {
    if (!filter) return false;
    if (filter.type === "text") return Boolean(filter.value?.trim());
    if (filter.type === "numberRange") return filter.min !== undefined || filter.max !== undefined;
    if (filter.type === "dateRange") return Boolean(filter.start || filter.end);
    if (filter.type === "boolean") return filter.booleanValue !== null && filter.booleanValue !== undefined;
    if (filter.type === "multiSelect") return Boolean(filter.values?.length);
    return false;
  });

  if (activeFilters.length === 0) return rows;

  return rows.filter((row) =>
    activeFilters.every(([key, filter]) => {
      const column = columns.find((item) => item.key === key);
      return column && filter
        ? matchesColumnFilter(row[key], column, filter)
        : true;
    })
  );
};

export const getColumnFilterPlaceholder = (column: SmartTableColumn): string => {
  if (column.filterType === "numberRange") return "Min / max";
  if (column.filterType === "dateRange") return "Date range";
  if (column.filterType === "multiSelect") return "Select values";
  if (column.filterType === "boolean") return "Yes / no";
  return `Search ${column.label}`;
};
