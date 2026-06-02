import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Filter,
  Search,
  X,
} from "lucide-react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTheme } from "../ThemeContext";
import { useSmartTable } from "../hooks/useSmartTable";
import { getCellRenderModel } from "../utils/tables/cellRenderer";
import { downloadSmartCsv, downloadSmartExcel } from "../utils/tables/export";
import { getColumnFilterPlaceholder } from "../utils/tables/filtering";
import type {
  SmartTableColumn,
  SmartTableRow,
} from "../utils/tables/smartTable";

interface SmartDataTableProps {
  data: unknown;
  variant?: "dashboard" | "chat" | "dashboard-flat";
  fileBaseName?: string;
  onRowsChange?: (rows: SmartTableRow[]) => void;
  configOverrides?: any;
}

// Clear high-contrast status colors to prevent visual blurring
const statusBadgeStyles = {
  positive: { bg: "#10B9811A", fg: "#047857", border: "rgba(4, 120, 87, 0.2)" },
  negative: {
    bg: "#EF44441A",
    fg: "#B91C1C",
    border: "rgba(185, 28, 28, 0.2)",
  },
  warning: { bg: "#F59E0B1A", fg: "#B45309", border: "rgba(180, 83, 9, 0.2)" },
  info: { bg: "#4F46E51A", fg: "#3730A3", border: "rgba(55, 48, 163, 0.2)" },
  neutral: { bg: "#64748B1A", fg: "#1E293B", border: "rgba(30, 41, 59, 0.2)" },
};

const HighlightedText = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return <>{text}</>;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  if (index === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-amber-200/90 text-slate-950 font-bold px-0.5">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  );
};

const getCellJustify = (column: SmartTableColumn) => {
  if (column.alignment === "right") return "flex-end";
  if (column.alignment === "left") return "flex-start";
  return "center";
};

const SmartDataTable: React.FC<SmartDataTableProps> = React.memo(
  ({ data, variant = "dashboard", fileBaseName, onRowsChange }) => {
    const { theme } = useTheme();
    const [showFilters, setShowFilters] = useState(false);
    const [showColumns, setShowColumns] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (
          exportRef.current &&
          !exportRef.current.contains(e.target as Node)
        ) {
          setShowExport(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    const tableState = useSmartTable(data, {
      fileBaseName,
      onRowsChange,
    });

    const {
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
      pageIndex,
      pageCount,
      pageSize,
      setPageIndex,
    } = tableState;

    const columnHelper = createColumnHelper<SmartTableRow>();
    const tableColumns = useMemo(() => {
      return visibleColumns.map((column) =>
        columnHelper.accessor((row) => row[column.key], {
          id: column.key,
          size: column.width,
          header: () => {
            const isSorted = sorting?.key === column.key;
            const SortIcon = isSorted
              ? sorting?.desc
                ? ArrowDown
                : ArrowUp
              : ArrowUpDown;
            return (
              <button
                type="button"
                className="flex w-full items-center gap-1.5 text-center transition-colors hover:opacity-80"
                style={{
                  justifyContent: getCellJustify(column),
                  color:
                    theme.mode === "light"
                      ? "#475569"
                      : theme.colors.textSecondary,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
                onClick={() => {
                  if (!column.sortable) return;
                  setSorting((current) =>
                    current?.key === column.key
                      ? { key: column.key, desc: !current.desc }
                      : { key: column.key, desc: column.isMetric },
                  );
                }}
                title={`Sort by ${column.label}`}
              >
                <span className="truncate">{column.label}</span>
                {column.sortable && (
                  <SortIcon
                    size={12}
                    style={{ opacity: isSorted ? 1 : 0.5, flexShrink: 0 }}
                  />
                )}
              </button>
            );
          },
          cell: ({ row }) => {
            const model = getCellRenderModel(row.original, column);
            const content = (() => {
              if (model.kind === "link" && model.href) {
                return (
                  <a
                    href={model.href}
                    className="truncate underline-offset-2 hover:underline font-bold transition-colors"
                    style={{ color: theme.colors.accent }}
                    target={column.type === "url" ? "_blank" : undefined}
                    rel={column.type === "url" ? "noreferrer" : undefined}
                  >
                    <HighlightedText
                      text={model.displayValue}
                      query={debouncedGlobalSearch}
                    />
                  </a>
                );
              }
              if (model.kind === "image" && model.imageUrl) {
                return (
                  <img
                    src={model.imageUrl}
                    alt={model.displayValue}
                    className="h-7 w-10 rounded object-cover shadow-xs border border-slate-200/60 dark:border-slate-800/40"
                    loading="lazy"
                  />
                );
              }
              if (model.kind === "badge") {
                return (
                  <span
                    className="flex items-center gap-1.5"
                    style={{
                      color: theme.mode === "light" ? "#334155" : theme.colors.text,
                      fontWeight: 600,
                    }}
                  >
                    <span className="truncate">{model.displayValue}</span>
                  </span>
                );
              }
              return (
                <span className="truncate font-semibold">
                  <HighlightedText
                    text={model.displayValue}
                    query={debouncedGlobalSearch}
                  />
                </span>
              );
            })();

            return (
              <div
                className="relative flex min-w-0 items-center gap-2 overflow-hidden w-full h-full px-1"
                title={model.title}
                style={{
                  justifyContent: getCellJustify(column),
                  color:
                    model.isNegative &&
                    /growth|profit|change|delta|diff|variance|gain|loss|return|yield/i.test(
                      column.key,
                    )
                      ? theme.colors.error
                      : model.isPositive &&
                          /growth|profit|change|delta/i.test(column.key)
                        ? theme.colors.success
                        : theme.mode === "light"
                          ? "#0F172A"
                          : theme.colors.text,
                  borderRadius: theme.borderRadius.default,
                }}
              >
                {content}
              </div>
            );
          },
        }),
      );
    }, [
      columnHelper,
      debouncedGlobalSearch,
      setSorting,
      sorting,
      theme,
      visibleColumns,
    ]);

    const table = useReactTable({
      data: displayedRows,
      columns: tableColumns,
      getCoreRowModel: getCoreRowModel(),
    });

    const tableContainerRef = useRef<HTMLDivElement>(null);
    const rows = table.getRowModel().rows;
    const isVirtualized = config.performance.mode === "virtualized";
    const rowVirtualizer = useVirtualizer({
      count: rows.length,
      getScrollElement: () => tableContainerRef.current,
      estimateSize: () => config.performance.estimatedRowHeight,
      overscan: config.performance.overscan,
    });
    const virtualItems = isVirtualized
      ? rowVirtualizer.getVirtualItems()
      : rows.map((_, index) => ({
          key: index,
          index,
          start: index * config.performance.estimatedRowHeight,
          size: config.performance.estimatedRowHeight,
          end: (index + 1) * config.performance.estimatedRowHeight,
          lane: 0,
        }));
    const totalTableWidth = visibleColumns.reduce(
      (total, column) => total + column.width,
      0,
    );
    const tableHeight = isVirtualized
      ? rowVirtualizer.getTotalSize()
      : rows.length * config.performance.estimatedRowHeight;

    const summaryByKey = new Map(
      summaries.map((summary) => [summary.key, summary]),
    );
    const filterCount = Object.values(columnFilters).filter(Boolean).length;
    const shownFrom =
      config.performance.mode === "paginated" ? pageIndex * pageSize + 1 : 1;
    const shownTo =
      config.performance.mode === "paginated"
        ? Math.min(sortedRows.length, (pageIndex + 1) * pageSize)
        : sortedRows.length;

    const renderColumnFilter = (column: SmartTableColumn) => {
      const filter = columnFilters[column.key];
      if (column.filterType === "none") return null;

      if (column.filterType === "numberRange") {
        return (
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              className="w-full rounded-lg px-2.5 py-1.5 text-xs border outline-none font-semibold"
              value={filter?.min ?? ""}
              onChange={(event) =>
                updateColumnFilter(column.key, {
                  type: "numberRange",
                  min: event.target.value
                    ? Number(event.target.value)
                    : undefined,
                  max: filter?.max,
                })
              }
              style={{
                background: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              }}
            />
            <input
              type="number"
              placeholder="Max"
              className="w-full rounded-lg px-2.5 py-1.5 text-xs border outline-none font-semibold"
              value={filter?.max ?? ""}
              onChange={(event) =>
                updateColumnFilter(column.key, {
                  type: "numberRange",
                  min: filter?.min,
                  max: event.target.value
                    ? Number(event.target.value)
                    : undefined,
                })
              }
              style={{
                background: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              }}
            />
          </div>
        );
      }

      if (column.filterType === "dateRange") {
        return (
          <div className="flex gap-2">
            <input
              type="date"
              className="w-full rounded-lg px-2 py-1 text-xs border outline-none font-semibold"
              value={filter?.start ?? ""}
              onChange={(event) =>
                updateColumnFilter(column.key, {
                  type: "dateRange",
                  start: event.target.value,
                  end: filter?.end,
                })
              }
              style={{
                background: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              }}
            />
            <input
              type="date"
              className="w-full rounded-lg px-2 py-1 text-xs border outline-none font-semibold"
              value={filter?.end ?? ""}
              onChange={(event) =>
                updateColumnFilter(column.key, {
                  type: "dateRange",
                  start: filter?.start,
                  end: event.target.value,
                })
              }
              style={{
                background: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              }}
            />
          </div>
        );
      }

      if (column.filterType === "boolean") {
        return (
          <select
            className="w-full rounded-lg px-2.5 py-1.5 text-xs border outline-none cursor-pointer font-semibold"
            value={
              filter?.booleanValue === undefined || filter.booleanValue === null
                ? ""
                : String(filter.booleanValue)
            }
            onChange={(event) =>
              updateColumnFilter(column.key, {
                type: "boolean",
                booleanValue:
                  event.target.value === ""
                    ? null
                    : event.target.value === "true",
              })
            }
            style={{
              background: theme.colors.background,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            }}
          >
            <option value="">All Records</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );
      }

      if (column.filterType === "multiSelect") {
        return (
          <div
            className="max-h-32 overflow-y-auto rounded-lg border py-1 custom-scrollbar"
            style={{
              borderColor: theme.colors.border,
              background: theme.colors.background,
            }}
          >
            {column.stats.uniqueValues.slice(0, 30).map((value) => {
              const isSelected = (filter?.values ?? []).includes(value);
              return (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={{ color: theme.colors.text }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = theme.colors.hover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <input
                    type="checkbox"
                    className="cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                    checked={isSelected}
                    onChange={(e) => {
                      const current = filter?.values ?? [];
                      const next = e.target.checked
                        ? [...current, value]
                        : current.filter((v) => v !== value);
                      updateColumnFilter(column.key, {
                        type: "multiSelect",
                        values: next.length > 0 ? next : undefined,
                      });
                    }}
                  />
                  <span className="truncate">{value}</span>
                </label>
              );
            })}
          </div>
        );
      }

      return (
        <input
          type="text"
          placeholder={getColumnFilterPlaceholder(column)}
          className="w-full rounded-lg px-2.5 py-1.5 text-xs border outline-none font-semibold"
          value={filter?.value ?? ""}
          onChange={(event) =>
            updateColumnFilter(column.key, {
              type: "text",
              value: event.target.value,
            })
          }
          style={{
            background: theme.colors.background,
            color: theme.colors.text,
            borderColor: theme.colors.border,
          }}
        />
      );
    };

    if (config.columns.length === 0) {
      return (
        <div
          className="flex h-full min-h-[240px] items-center justify-center rounded-xl p-6 text-center text-sm border border-dashed"
          style={{
            background: theme.colors.surface,
            borderColor: theme.colors.border,
            color: theme.colors.textSecondary,
          }}
        >
          No records found mapping active indices.
        </div>
      );
    }

    return (
      <div
        className={`flex w-full flex-col overflow-hidden transition-all duration-300 ${
          variant === "dashboard-flat" || variant === "chat" ? "" : "rounded-xl"
        }`}
        style={{
          background:
            variant === "chat" || variant === "dashboard-flat"
              ? "transparent"
              : theme.colors.surface,
          border:
            variant === "chat" || variant === "dashboard-flat"
              ? "none"
              : `1px solid ${theme.colors.border}`,
          boxShadow:
            variant === "chat" || variant === "dashboard-flat"
              ? "none"
              : "0 4px 20px -4px rgba(2, 6, 23, 0.05)",
          height: variant === "chat" ? "auto" : "100%",
          maxHeight: variant === "chat" ? 500 : "100%",
          width: variant === "dashboard-flat" ? "100%" : "fit-content",
          maxWidth: "100%",
          minWidth: 0,
          flex: 1,
        }}
      >
        {/* Anti-Glare Structured Top Action deck */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-3 py-2"
          style={{
            backgroundColor: "transparent",
            borderBottom: `1px solid ${theme.colors.border}`,
            flexShrink: 0,
          }}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 border"
              style={{ 
                backgroundColor: theme.mode === 'light' ? '#F8FAFC' : theme.colors.background,
                borderColor: theme.colors.border 
              }}
            >
              <Search
                size={13}
                style={{ color: theme.colors.textSecondary, flexShrink: 0 }}
              />
              <input
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search columns..."
                className="w-36 bg-transparent text-xs outline-none font-bold"
                style={{ color: theme.colors.text }}
              />
              {globalSearch && (
                <button
                  type="button"
                  onClick={() => setGlobalSearch("")}
                  className="opacity-60 hover:opacity-100"
                >
                  <X size={12} style={{ color: theme.colors.textSecondary }} />
                </button>
              )}
            </div>
            <span
              className="text-xs font-bold"
              style={{ color: theme.colors.textSecondary }}
            >
              {filteredRows.length.toLocaleString("en-IN")} rows
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setShowFilters((v) => !v);
                setShowColumns(false);
              }}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all border shadow-xs"
              style={{
                color:
                  showFilters || filterCount > 0
                    ? theme.colors.accent
                    : theme.colors.textSecondary,
                background: showFilters
                  ? `${theme.colors.accent}10`
                  : theme.colors.surface,
                borderColor:
                  showFilters || filterCount > 0
                    ? `${theme.colors.accent}40`
                    : theme.colors.border,
              }}
            >
              <Filter size={13} />
              {filterCount > 0 ? `Filters (${filterCount})` : "Filters"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowColumns((v) => !v);
                setShowFilters(false);
              }}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all border shadow-xs"
              style={{
                color: showColumns
                  ? theme.colors.accent
                  : theme.colors.textSecondary,
                background: showColumns
                  ? `${theme.colors.accent}10`
                  : theme.colors.surface,
                borderColor: showColumns
                  ? `${theme.colors.accent}40`
                  : theme.colors.border,
              }}
            >
              <Columns3 size={13} />
              Columns
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

            <div ref={exportRef} className="relative">
              <button
                type="button"
                onClick={() => setShowExport((v) => !v)}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all border"
                style={{
                  color: theme.colors.textSecondary,
                  borderColor: theme.colors.border,
                  background: theme.colors.surface,
                }}
              >
                <Download size={13} />
                Export
                <ChevronDown
                  size={11}
                  className={`opacity-60 transition-transform ${showExport ? "rotate-180" : ""}`}
                />
              </button>
              {showExport && (
                <div
                  className="absolute right-0 top-[calc(100%+4px)] z-50 rounded-lg border py-1 min-w(145px) shadow-xl overflow-hidden"
                  style={{
                    background: theme.colors.surface,
                    borderColor: theme.colors.border,
                  }}
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-left font-bold"
                    style={{ color: theme.colors.text }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = theme.colors.hover)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                    onClick={() => {
                      downloadSmartCsv(
                        sortedRows,
                        visibleColumns,
                        summaries,
                        config.exportConfig.fileBaseName,
                      );
                      setShowExport(false);
                    }}
                  >
                    <Download
                      size={13}
                      style={{ color: theme.colors.accent }}
                    />
                    Download CSV
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-left font-bold"
                    style={{ color: theme.colors.text }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = theme.colors.hover)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                    onClick={() => {
                      downloadSmartExcel(
                        sortedRows,
                        visibleColumns,
                        summaries,
                        config.exportConfig.fileBaseName,
                      );
                      setShowExport(false);
                    }}
                  >
                    <FileSpreadsheet
                      size={13}
                      style={{ color: theme.colors.accent }}
                    />
                    Download Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Display Columns Toggle Deck */}
        {showColumns && (
          <div
            className="border-b px-3 py-2 bg-slate-50/50 dark:bg-black/10"
            style={{ borderColor: theme.colors.border }}
          >
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Show / Hide Layout Fields
            </div>
            <div className="flex flex-wrap gap-1">
              {config.columns.map((column) => {
                const visible =
                  columnVisibility[column.key] ??
                  config.defaultVisibleColumnKeys.includes(column.key);
                return (
                  <button
                    key={column.key}
                    type="button"
                    onClick={() => toggleColumnVisibility(column.key)}
                    className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold transition-all border"
                    style={{
                      color: visible
                        ? theme.colors.accent
                        : theme.colors.textSecondary,
                      borderColor: visible
                        ? `${theme.colors.accent}40`
                        : theme.colors.border,
                      background: visible
                        ? `${theme.colors.accent}08`
                        : "transparent",
                    }}
                  >
                    {visible ? <Eye size={11} /> : <EyeOff size={11} />}
                    {column.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Selection Panel Overlay */}
        {showFilters && (
          <div className="absolute inset-0 z-50 flex bg-slate-900/10 dark:bg-black/20 backdrop-blur-xs">
            <div className="flex-1" onClick={() => setShowFilters(false)} />
            <div
              className="flex w-72 flex-col border-l shadow-2xl"
              style={{
                background: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
            >
              <div
                className="flex items-center justify-between border-b px-4 py-2.5"
                style={{ borderColor: theme.colors.border }}
              >
                <span
                  className="text-sm font-bold tracking-tight"
                  style={{ color: theme.colors.text }}
                >
                  Filters
                </span>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: theme.colors.textSecondary }}
                >
                  <X size={15} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="grid gap-4">
                  {visibleColumns
                    .filter((col) => col.filterType !== "none")
                    .map((column) => (
                      <div key={column.key} className="flex flex-col gap-1">
                        <div
                          className="truncate text-xs font-bold"
                          style={{ color: theme.colors.textSecondary }}
                          title={column.label}
                        >
                          {column.label}
                        </div>
                        {renderColumnFilter(column)}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Badges Frame */}
        {filterCount > 0 && (
          <div
            className="flex flex-wrap items-center gap-1.5 border-b px-3 py-1.5 bg-slate-50/50 dark:bg-black/10"
            style={{ borderColor: theme.colors.border }}
          >
            <span
              className="text-xs font-bold"
              style={{ color: theme.colors.textSecondary }}
            >
              Active Filters:
            </span>
            {Object.entries(columnFilters).map(([key, filter]) => {
              if (!filter) return null;
              const col = config.columns.find((c) => c.key === key);
              if (!col) return null;
              let display = "";
              if (filter.type === "text") display = `"${filter.value}"`;
              if (filter.type === "boolean")
                display = filter.booleanValue ? "Yes" : "No";
              if (filter.type === "numberRange")
                display = `${filter.min ?? "*"} - ${filter.max ?? "*"}`;
              if (filter.type === "dateRange")
                display = `${filter.start ?? "*"} to ${filter.end ?? "*"}`;
              if (filter.type === "multiSelect")
                display = `${filter.values?.length} selected`;

              return (
                <div
                  key={key}
                  className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border"
                  style={{
                    background: `${theme.colors.accent}08`,
                    color: theme.colors.accent,
                    borderColor: `${theme.colors.accent}20`,
                  }}
                >
                  <span>
                    {col.label}: {display}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateColumnFilter(key, undefined)}
                    className="hover:opacity-70"
                  >
                    <X size={11} />
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto text-xs font-bold hover:opacity-80"
              style={{ color: theme.colors.error }}
            >
              Clear all
            </button>
          </div>
        )}

        {/* Bounded Scroll Matrix Frame */}
        <div
          ref={tableContainerRef}
          className="custom-scrollbar"
          style={{
            overflow: "auto",
            flex: 1,
            minHeight: 0,
            scrollbarWidth: "thin",
          }}
        >
          <table
            style={{
              width: totalTableWidth,
              tableLayout: "fixed",
              borderCollapse: "separate",
              borderSpacing: 0,
              margin: "0 auto",
            }}
          >
            <thead
              style={{
                position: "sticky",
                top: 0,
                zIndex: 4,
                background: theme.colors.surface,
              }}
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  style={{ display: "flex", width: totalTableWidth }}
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-2"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: getCellJustify(
                          visibleColumns.find(
                            (c) => c.key === header.column.id,
                          ),
                        ),
                        width: header.getSize(),
                        flexShrink: 0,
                        borderBottom: `1px solid ${theme.mode === "light" ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)"}`,
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody
              style={{
                display: "grid",
                height: tableHeight,
                minHeight: rows.length ? undefined : 140,
                position: "relative",
                width: totalTableWidth,
              }}
            >
              {virtualItems.map((virtualRow) => {
                const row = rows[virtualRow.index];
                if (!row) return null;
                const isEven = virtualRow.index % 2 === 0;
                const rowBg = "transparent";
                return (
                  <tr
                    key={row.id}
                    data-index={virtualRow.index}
                    ref={
                      isVirtualized ? rowVirtualizer.measureElement : undefined
                    }
                    className="transition-colors duration-100 ease-out"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        theme.colors.hover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = rowBg;
                    }}
                    style={{
                      display: "flex",
                      position: "absolute",
                      transform: `translateY(${virtualRow.start}px)`,
                      width: totalTableWidth,
                      minHeight: config.performance.estimatedRowHeight,
                      background: rowBg,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="min-w-0 px-3 py-1.5 text-[0.84rem]"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: getCellJustify(
                            visibleColumns.find(
                              (c) => c.key === cell.column.id,
                            ),
                          ),
                          width: cell.column.getSize(),
                          borderBottom: `1px solid ${theme.mode === "light" ? "rgba(0,0,0,0.015)" : "rgba(255,255,255,0.02)"}`,
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
            {rows.length > 1 && summaries.length > 0 && (
              <tfoot
                style={{
                  position: "sticky",
                  bottom: 0,
                  zIndex: 3,
                  background: theme.colors.surface,
                }}
              >
                <tr style={{ display: "flex", width: totalTableWidth }}>
                  {visibleColumns.map((column) => (
                    <td
                      key={column.key}
                      className="truncate px-3 py-1.5 text-xs font-bold"
                      title={summaryByKey.get(column.key)?.value ?? ""}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        width: column.width,
                        flexShrink: 0,
                        color: theme.colors.accent,
                        justifyContent: getCellJustify(column),
                        borderTop: `1px solid ${theme.colors.border}`,
                        background: `${theme.colors.accent}04`,
                      }}
                    >
                      {summaryByKey.get(column.key)?.value ?? ""}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>

          {rows.length === 0 && (
            <div
              className="flex min-h-[140px] flex-col items-center justify-center gap-2 p-4 text-center"
              style={{ color: theme.colors.textSecondary }}
            >
              <Search size={22} className="opacity-30 mb-0.5" />
              <div className="text-xs font-bold">
                No columns match current rule filters
              </div>
              {filterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-md px-2.5 py-1 text-xs border mt-1.5 font-bold transition-transform active:scale-98"
                  style={{
                    color: theme.colors.accent,
                    borderColor: `${theme.colors.accent}30`,
                    background: `${theme.colors.accent}08`,
                  }}
                >
                  Reset Grid Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination Footer Drawer */}
        {config.performance.mode === "paginated" && (
          <div
            className="flex items-center justify-between border-t px-3 py-2.5"
            style={{ borderColor: theme.colors.border, backgroundColor: "transparent" }}
          >
            <span
              className="text-xs font-semibold"
              style={{ color: theme.colors.textSecondary }}
            >
              Page{" "}
              <strong style={{ color: theme.colors.text }}>
                {pageIndex + 1}
              </strong>{" "}
              of {pageCount}
              {" · "}
              <span className="opacity-70">
                {shownFrom.toLocaleString("en-IN")}–
                {shownTo.toLocaleString("en-IN")} of{" "}
                {sortedRows.length.toLocaleString("en-IN")}
              </span>
            </span>
            <div className="flex items-center gap-0.5">
              {[
                {
                  icon: <ChevronsLeft size={14} />,
                  onClick: () => setPageIndex(0),
                  disabled: pageIndex === 0,
                  title: "First",
                },
                {
                  icon: <ChevronLeft size={14} />,
                  onClick: () => setPageIndex(Math.max(0, pageIndex - 1)),
                  disabled: pageIndex === 0,
                  title: "Previous",
                },
                {
                  icon: <ChevronRight size={14} />,
                  onClick: () =>
                    setPageIndex(Math.min(pageCount - 1, pageIndex + 1)),
                  disabled: pageIndex >= pageCount - 1,
                  title: "Next",
                },
                {
                  icon: <ChevronsRight size={14} />,
                  onClick: () => setPageIndex(pageCount - 1),
                  disabled: pageIndex >= pageCount - 1,
                  title: "Last",
                },
              ].map(({ icon, onClick, disabled, title }) => (
                <button
                  key={title}
                  type="button"
                  onClick={onClick}
                  disabled={disabled}
                  title={title}
                  className="rounded-lg p-1 transition-all hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                  style={{ color: theme.colors.accent }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
);

export default SmartDataTable;
