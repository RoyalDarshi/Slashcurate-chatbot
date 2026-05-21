import { useEffect, useMemo, useState } from "react";
import {
  applyColumnFilters,
  applyGlobalSearch,
} from "../utils/tables/filtering";
import { generateSummaries } from "../utils/tables/summaries";
import { smartSortRows } from "../utils/tables/sorting";
import {
  getSmartTableConfig,
  type SmartTableAggregation,
  type SmartTableColumnFilter,
  type SmartTableOptions,
  type SmartTableRow,
  type SmartTableSort,
} from "../utils/tables/smartTable";

export interface UseSmartTableOptions extends SmartTableOptions {
  onRowsChange?: (rows: SmartTableRow[]) => void;
}

export const useSmartTable = (
  data: unknown,
  options: UseSmartTableOptions = {}
) => {
  const baseConfig = useMemo(
    () => getSmartTableConfig(data, options),
    [data, options.fileBaseName, options.hiddenColumns, options.visibleColumns]
  );

  const [globalSearch, setGlobalSearch] = useState("");
  const [debouncedGlobalSearch, setDebouncedGlobalSearch] = useState("");
  const [sorting, setSorting] = useState<SmartTableSort | null>(
    baseConfig.defaultSort
  );
  const [columnFilters, setColumnFilters] = useState<
    Record<string, SmartTableColumnFilter | undefined>
  >({});
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    {}
  );
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(baseConfig.performance.pageSize);
  const [pivotEnabled, setPivotEnabled] = useState(false);
  const [pivotGroupBy, setPivotGroupBy] = useState<string | null>(
    baseConfig.pivot.groupBy
  );
  const [pivotMetric, setPivotMetric] = useState<string | null>(
    baseConfig.pivot.metric
  );
  const [pivotAggregation, setPivotAggregation] =
    useState<SmartTableAggregation>("sum");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedGlobalSearch(globalSearch);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [globalSearch]);

  useEffect(() => {
    setPivotGroupBy((current) => current ?? baseConfig.pivot.groupBy);
    setPivotMetric((current) => current ?? baseConfig.pivot.metric);
  }, [baseConfig.pivot.groupBy, baseConfig.pivot.metric]);

  const config = useMemo(
    () =>
      getSmartTableConfig(data, {
        ...options,
        pivot: {
          enabled: pivotEnabled,
          groupBy: pivotGroupBy,
          metric: pivotMetric,
          aggregation: pivotAggregation,
          groupByOptions: [],
          metricOptions: [],
        },
      }),
    [
      data,
      options.fileBaseName,
      options.hiddenColumns,
      options.visibleColumns,
      pivotAggregation,
      pivotEnabled,
      pivotGroupBy,
      pivotMetric,
    ]
  );

  useEffect(() => {
    setColumnVisibility((current) => {
      const next = { ...current };
      const knownKeys = new Set(config.columns.map((column) => column.key));
      Object.keys(next).forEach((key) => {
        if (!knownKeys.has(key)) delete next[key];
      });
      config.columns.forEach((column) => {
        if (next[column.key] === undefined) {
          next[column.key] = config.defaultVisibleColumnKeys.includes(column.key);
        }
      });
      return next;
    });
  }, [config.columns, config.defaultVisibleColumnKeys]);

  useEffect(() => {
    setSorting((current) => {
      if (current && config.columns.some((column) => column.key === current.key)) {
        return current;
      }
      return config.defaultSort;
    });
    setPageSize(config.performance.pageSize);
  }, [config.columns, config.defaultSort, config.performance.pageSize]);

  const visibleColumns = useMemo(
    () =>
      config.columns.filter(
        (column) =>
          columnVisibility[column.key] ??
          config.defaultVisibleColumnKeys.includes(column.key)
      ),
    [columnVisibility, config.columns, config.defaultVisibleColumnKeys]
  );

  const filteredRows = useMemo(() => {
    const columnFiltered = applyColumnFilters(
      config.rows,
      config.columns,
      columnFilters
    );
    return applyGlobalSearch(columnFiltered, visibleColumns, debouncedGlobalSearch);
  }, [
    columnFilters,
    config.columns,
    config.rows,
    debouncedGlobalSearch,
    visibleColumns,
  ]);

  const sortedRows = useMemo(
    () => smartSortRows(filteredRows, config.columns, sorting),
    [config.columns, filteredRows, sorting]
  );

  useEffect(() => {
    setPageIndex(0);
  }, [debouncedGlobalSearch, columnFilters, sorting, pivotEnabled, pivotGroupBy, pivotMetric, pivotAggregation]);

  useEffect(() => {
    options.onRowsChange?.(sortedRows);
  }, [options.onRowsChange, sortedRows]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / Math.max(pageSize, 1)));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const shouldPaginate = config.performance.mode === "paginated";

  const displayedRows = useMemo(() => {
    if (!shouldPaginate) return sortedRows;
    const start = safePageIndex * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [pageSize, safePageIndex, shouldPaginate, sortedRows]);

  const summaries = useMemo(
    () => generateSummaries(filteredRows, visibleColumns),
    [filteredRows, visibleColumns]
  );

  const updateColumnFilter = (
    key: string,
    filter: SmartTableColumnFilter | undefined
  ) => {
    setColumnFilters((current) => ({ ...current, [key]: filter }));
  };

  const clearFilters = () => {
    setGlobalSearch("");
    setDebouncedGlobalSearch("");
    setColumnFilters({});
  };

  const toggleColumnVisibility = (key: string) => {
    setColumnVisibility((current) => ({
      ...current,
      [key]: !(current[key] ?? config.defaultVisibleColumnKeys.includes(key)),
    }));
  };

  return {
    config,
    globalSearch,
    debouncedGlobalSearch,
    setGlobalSearch,
    sorting,
    setSorting,
    columnFilters,
    updateColumnFilter,
    clearFilters,
    columnVisibility,
    toggleColumnVisibility,
    visibleColumns,
    filteredRows,
    sortedRows,
    displayedRows,
    summaries,
    pageIndex: safePageIndex,
    pageCount,
    pageSize,
    setPageIndex,
    setPageSize,
    pivotEnabled,
    setPivotEnabled,
    pivotGroupBy,
    setPivotGroupBy,
    pivotMetric,
    setPivotMetric,
    pivotAggregation,
    setPivotAggregation,
  };
};
