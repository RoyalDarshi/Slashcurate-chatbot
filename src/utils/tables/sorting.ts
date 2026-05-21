import { parseSmartDate, toFiniteNumber } from "./formatting";
import type { SmartTableColumn, SmartTableRow, SmartTableSort } from "./types";

const compareEmpty = (a: unknown, b: unknown, desc: boolean): number | null => {
  const aEmpty = a === null || a === undefined || a === "";
  const bEmpty = b === null || b === undefined || b === "";
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return desc ? -1 : 1;
  if (bEmpty) return desc ? 1 : -1;
  return null;
};

export const compareSmartValues = (
  a: unknown,
  b: unknown,
  column: SmartTableColumn,
  desc = false
): number => {
  const emptyComparison = compareEmpty(a, b, desc);
  if (emptyComparison !== null) return emptyComparison;

  let result = 0;
  if (["numeric", "currency", "percentage"].includes(column.type)) {
    result = (toFiniteNumber(a) ?? 0) - (toFiniteNumber(b) ?? 0);
  } else if (["date", "datetime", "month", "year", "quarter"].includes(column.type)) {
    result =
      (parseSmartDate(a, column.key)?.timestamp ?? 0) -
      (parseSmartDate(b, column.key)?.timestamp ?? 0);
  } else if (column.type === "boolean") {
    result = Number(Boolean(a)) - Number(Boolean(b));
  } else {
    result = String(a).localeCompare(String(b), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  }

  return desc ? -result : result;
};

export const smartSortRows = (
  rows: SmartTableRow[],
  columns: SmartTableColumn[],
  sort: SmartTableSort | null
): SmartTableRow[] => {
  if (!sort) return rows;
  const column = columns.find((item) => item.key === sort.key);
  if (!column || !column.sortable) return rows;
  return [...rows].sort((a, b) =>
    compareSmartValues(a[column.key], b[column.key], column, sort.desc)
  );
};
