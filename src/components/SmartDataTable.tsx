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
  variant?: "dashboard" | "chat";
  fileBaseName?: string;
  onRowsChange?: (rows: SmartTableRow[]) => void;
}

const badgeColors = {
  positive: { bg: "#22C55E1F", fg: "#16A34A", border: "#22C55E44" },
  negative: { bg: "#EF44441F", fg: "#DC2626", border: "#EF444444" },
  warning: { bg: "#F59E0B1F", fg: "#D97706", border: "#F59E0B44" },
  info: { bg: "#3B82F61F", fg: "#2563EB", border: "#3B82F644" },
  neutral: { bg: "#64748B1F", fg: "#64748B", border: "#64748B44" },
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
      <mark className="rounded-sm bg-yellow-200 px-0.5 text-inherit">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  );
};

const getCellJustify = (column: SmartTableColumn) => {
  if (column.alignment === "right") return "flex-end";
  if (column.alignment === "left") return "flex-start";
  return "center"; // Changed to center as default
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
                className="flex w-full items-center gap-1.5 text-center"
                style={{
                  justifyContent: getCellJustify(column),
                  color: "rgba(255,255,255,0.92)",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.07em",
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
                    style={{ opacity: isSorted ? 1 : 0.4, flexShrink: 0 }}
                  />
                )}
              </button>
            );
          },
          cell: ({ row }) => {
            const model = getCellRenderModel(row.original, column);
            const heatColor =
              model.heatPercent !== undefined
                ? `linear-gradient(90deg, ${theme.colors.accent}22 ${model.heatPercent}%, transparent ${model.heatPercent}%)`
                : undefined;
            const content = (() => {
              if (model.kind === "link" && model.href) {
                return (
                  <a
                    href={model.href}
                    className="truncate underline-offset-2 hover:underline"
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
                    className="h-8 w-11 rounded object-cover"
                    loading="lazy"
                  />
                );
              }
              if (model.kind === "badge") {
                const colors = badgeColors[model.badgeTone ?? "neutral"];
                return (
                  <span
                    style={{
                      color: colors.fg,
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: theme.borderRadius.pill,
                      padding: "2px 10px",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      maxWidth: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {model.displayValue}
                  </span>
                );
              }
              return (
                <span className="truncate">
                  <HighlightedText
                    text={model.displayValue}
                    query={debouncedGlobalSearch}
                  />
                </span>
              );
            })();

            return (
              <div
                className="relative flex min-w-0 items-center gap-2 overflow-hidden w-full"
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
                        : theme.colors.text,
                  background: heatColor,
                  borderRadius: theme.borderRadius.default,
                }}
              >
                {model.kind === "number" &&
                  model.progressPercent !== undefined && (
                    <span
                      className="absolute bottom-0 left-0 h-0.5 rounded-full"
                      style={{
                        width: `${model.progressPercent}%`,
                        background: model.isNegative
                          ? theme.colors.error
                          : theme.colors.accent,
                        opacity: 0.5,
                      }}
                    />
                  )}
                {model.isAnomaly && (
                  <span
                    className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    title="Potential outlier"
                    style={{ background: theme.colors.warning }}
                  />
                )}
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
    const totalTableWidth = Math.max(
      680,
      visibleColumns.reduce((total, column) => total + column.width, 0),
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
          <div className="flex gap-1">
            <input
              type="number"
              placeholder="Min"
              className="w-20 rounded px-2 py-1 text-xs outline-none"
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
                background: theme.colors.surface,
                color: theme.colors.text,
              }}
            />
            <input
              type="number"
              placeholder="Max"
              className="w-20 rounded px-2 py-1 text-xs outline-none"
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
                background: theme.colors.surface,
                color: theme.colors.text,
              }}
            />
          </div>
        );
      }

      if (column.filterType === "dateRange") {
        return (
          <div className="flex gap-1">
            <input
              type="date"
              className="w-32 rounded px-2 py-1 text-xs outline-none"
              value={filter?.start ?? ""}
              onChange={(event) =>
                updateColumnFilter(column.key, {
                  type: "dateRange",
                  start: event.target.value,
                  end: filter?.end,
                })
              }
              style={{
                background: theme.colors.surface,
                color: theme.colors.text,
              }}
            />
            <input
              type="date"
              className="w-32 rounded px-2 py-1 text-xs outline-none"
              value={filter?.end ?? ""}
              onChange={(event) =>
                updateColumnFilter(column.key, {
                  type: "dateRange",
                  start: filter?.start,
                  end: event.target.value,
                })
              }
              style={{
                background: theme.colors.surface,
                color: theme.colors.text,
              }}
            />
          </div>
        );
      }

      if (column.filterType === "boolean") {
        return (
          <select
            className="w-24 rounded px-2 py-1 text-xs outline-none"
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
              background: theme.colors.surface,
              color: theme.colors.text,
            }}
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );
      }

      if (column.filterType === "multiSelect") {
        return (
          <select
            multiple
            className="h-16 w-full rounded px-2 py-1 text-xs outline-none"
            value={filter?.values ?? []}
            onChange={(event) =>
              updateColumnFilter(column.key, {
                type: "multiSelect",
                values: Array.from(event.target.selectedOptions).map(
                  (option) => option.value,
                ),
              })
            }
            style={{
              background: theme.colors.surface,
              color: theme.colors.text,
            }}
          >
            {column.stats.uniqueValues.slice(0, 30).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        );
      }

      return (
        <input
          type="text"
          placeholder={getColumnFilterPlaceholder(column)}
          className="w-full rounded px-2 py-1 text-xs outline-none"
          value={filter?.value ?? ""}
          onChange={(event) =>
            updateColumnFilter(column.key, {
              type: "text",
              value: event.target.value,
            })
          }
          style={{ background: theme.colors.surface, color: theme.colors.text }}
        />
      );
    };

    if (config.columns.length === 0) {
      return (
        <div
          className="flex h-full min-h-[280px] items-center justify-center rounded-lg p-8 text-center"
          style={{
            background: theme.colors.surface,
            color: theme.colors.textSecondary,
          }}
        >
          No rows available for table view.
        </div>
      );
    }

    return (
      <div
        className="flex flex-col overflow-hidden rounded-xl"
        style={{
          background: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.shadow.sm,
          height: variant === "chat" ? "auto" : "100%",
          maxHeight: variant === "chat" ? 480 : "100%",
          width: "100%",
          minWidth: 0,
          flex: 1,
        }}
      >
        <div
          className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
          style={{
            borderBottom: `1px solid ${theme.colors.border}`,
            flexShrink: 0,
          }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <div
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
              style={{
                background: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <Search
                size={13}
                style={{ color: theme.colors.textSecondary, flexShrink: 0 }}
              />
              <input
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search…"
                className="w-32 bg-transparent text-xs outline-none"
                style={{ color: theme.colors.text }}
              />
              {globalSearch && (
                <button type="button" onClick={() => setGlobalSearch("")}>
                  <X size={12} style={{ color: theme.colors.textSecondary }} />
                </button>
              )}
            </div>
            <span
              className="text-xs"
              style={{ color: theme.colors.textSecondary }}
            >
              {filteredRows.length.toLocaleString("en-IN")} rows
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setShowFilters((v) => !v);
                setShowColumns(false);
              }}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
              style={{
                color:
                  showFilters || filterCount > 0
                    ? theme.colors.accent
                    : theme.colors.textSecondary,
                background: showFilters
                  ? `${theme.colors.accent}14`
                  : "transparent",
                border: `1px solid ${showFilters || filterCount > 0 ? theme.colors.accent + "44" : theme.colors.border}`,
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
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
              style={{
                color: showColumns
                  ? theme.colors.accent
                  : theme.colors.textSecondary,
                background: showColumns
                  ? `${theme.colors.accent}14`
                  : "transparent",
                border: `1px solid ${showColumns ? theme.colors.accent + "44" : theme.colors.border}`,
              }}
            >
              <Columns3 size={13} />
              Columns
            </button>

            <div
              className="mx-1 h-5 w-px"
              style={{ background: theme.colors.border }}
            />

            <div ref={exportRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowExport((v) => !v)}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
                style={{
                  color: theme.colors.textSecondary,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                <Download size={13} />
                Export
                <ChevronDown size={11} style={{ opacity: 0.6 }} />
              </button>
              {showExport && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 4px)",
                    zIndex: 50,
                    background: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.default,
                    boxShadow: theme.shadow.md,
                    minWidth: 140,
                    overflow: "hidden",
                  }}
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs"
                    style={{ color: theme.colors.text }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        theme.colors.background)
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
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs"
                    style={{ color: theme.colors.text }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        theme.colors.background)
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

        {showColumns && (
          <div
            className="border-b px-3 py-2.5"
            style={{
              borderColor: theme.colors.border,
              background: theme.colors.background,
            }}
          >
            <div
              className="mb-2 text-xs font-semibold uppercase tracking-wide"
              style={{ color: theme.colors.textSecondary }}
            >
              Show / Hide Columns
            </div>
            <div className="flex flex-wrap gap-1.5">
              {config.columns.map((column) => {
                const visible =
                  columnVisibility[column.key] ??
                  config.defaultVisibleColumnKeys.includes(column.key);
                return (
                  <button
                    key={column.key}
                    type="button"
                    onClick={() => toggleColumnVisibility(column.key)}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
                    style={{
                      color: visible
                        ? theme.colors.accent
                        : theme.colors.textSecondary,
                      border: `1px solid ${visible ? theme.colors.accent + "44" : theme.colors.border}`,
                      background: visible
                        ? `${theme.colors.accent}10`
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

        {showFilters && (
          <div
            style={{
              borderBottom: `1px solid ${theme.colors.border}`,
              background: theme.colors.background,
              flexShrink: 0,
            }}
          >
            <div
              className="flex items-center justify-between px-3 py-2"
              style={{ borderBottom: `1px solid ${theme.colors.border}` }}
            >
              <span
                className="text-xs font-semibold"
                style={{ color: theme.colors.textSecondary }}
              >
                Filter columns
              </span>
              {filterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-medium"
                  style={{ color: theme.colors.error }}
                >
                  Clear all ({filterCount})
                </button>
              )}
            </div>
            <div
              className="grid gap-2 px-3 py-2.5"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                maxHeight: 180,
                overflowY: "auto",
              }}
            >
              {visibleColumns
                .filter((col) => col.filterType !== "none")
                .map((column) => (
                  <div key={column.key}>
                    <div
                      className="mb-1 truncate text-xs font-medium"
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
        )}

        <div
          ref={tableContainerRef}
          style={{
            overflow: "auto",
            flex: 1,
            minHeight: 0,
            scrollbarColor: `${theme.colors.accent}55 ${theme.colors.surface}`,
            scrollbarWidth: "thin",
          }}
        >
          <table
            style={{
              width: totalTableWidth,
              minWidth: "100%",
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
                background: theme.colors.accent,
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
                        width: header.getSize(),
                        flexShrink: 0,
                        borderRight: `1px solid ${theme.colors.surface}22`,
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
                minHeight: rows.length ? undefined : 160,
                position: "relative",
              }}
            >
              {virtualItems.map((virtualRow) => {
                const row = rows[virtualRow.index];
                if (!row) return null;
                return (
                  <tr
                    key={row.id}
                    data-index={virtualRow.index}
                    ref={
                      isVirtualized ? rowVirtualizer.measureElement : undefined
                    }
                    style={{
                      display: "flex",
                      position: "absolute",
                      transform: `translateY(${virtualRow.start}px)`,
                      width: "100%",
                      minHeight: config.performance.estimatedRowHeight,
                      background:
                        virtualRow.index % 2 === 0
                          ? theme.colors.surface
                          : `${theme.colors.accent}06`,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="min-w-0 border-b px-3 py-2 text-sm"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          width: cell.column.getSize(),
                          borderColor: theme.colors.border,
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
            {rows.length > 0 && (
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
                      className="truncate px-3 py-1.5 text-xs font-semibold"
                      title={summaryByKey.get(column.key)?.value ?? ""}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        width: column.width,
                        flexShrink: 0,
                        color: theme.colors.accent,
                        justifyContent:
                          column.alignment === "right"
                            ? "flex-end"
                            : column.alignment === "left"
                              ? "flex-start"
                              : "center",
                        borderTop: `1px solid ${theme.colors.border}`,
                        background: `${theme.colors.accent}06`,
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
              className="flex min-h-[180px] flex-col items-center justify-center gap-3 p-6 text-center"
              style={{ color: theme.colors.textSecondary }}
            >
              <Search size={32} style={{ opacity: 0.3 }} />
              <div className="text-sm font-medium">
                No matching records found
              </div>
              {filterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    color: theme.colors.accent,
                    background: `${theme.colors.accent}14`,
                    border: `1px solid ${theme.colors.accent}44`,
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {config.performance.mode === "paginated" && (
          <div
            className="flex items-center justify-between border-t px-3 py-2"
            style={{ borderColor: theme.colors.border }}
          >
            <span
              className="text-xs"
              style={{ color: theme.colors.textSecondary }}
            >
              Page{" "}
              <strong style={{ color: theme.colors.text }}>
                {pageIndex + 1}
              </strong>{" "}
              of {pageCount}
              {" · "}
              <span>
                {shownFrom.toLocaleString("en-IN")}–
                {shownTo.toLocaleString("en-IN")} of{" "}
                {sortedRows.length.toLocaleString("en-IN")}
              </span>
            </span>
            <div className="flex items-center gap-0.5">
              {[
                {
                  icon: <ChevronsLeft size={15} />,
                  onClick: () => setPageIndex(0),
                  disabled: pageIndex === 0,
                  title: "First",
                },
                {
                  icon: <ChevronLeft size={15} />,
                  onClick: () => setPageIndex(Math.max(0, pageIndex - 1)),
                  disabled: pageIndex === 0,
                  title: "Previous",
                },
                {
                  icon: <ChevronRight size={15} />,
                  onClick: () =>
                    setPageIndex(Math.min(pageCount - 1, pageIndex + 1)),
                  disabled: pageIndex >= pageCount - 1,
                  title: "Next",
                },
                {
                  icon: <ChevronsRight size={15} />,
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
                  className="rounded p-1 transition-colors"
                  style={{
                    color: disabled
                      ? theme.colors.textSecondary
                      : theme.colors.accent,
                    opacity: disabled ? 0.35 : 1,
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
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
