import React, { useMemo, useState, useEffect } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import { DataTableProps } from "../types";
import { useTheme } from "../ThemeContext";
import CustomTooltip from "./CustomTooltip";

const DataTable: React.FC<DataTableProps> = React.memo(({ data }) => {
  const { theme } = useTheme();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const normalizedData = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : [data];
  }, [data]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [normalizedData]);

  const headers = useMemo(() => {
    if (normalizedData.length === 0) return [];
    const firstItem = normalizedData[0];
    return typeof firstItem === "object" && firstItem !== null
      ? Object.keys(firstItem)
      : ["Value"];
  }, [normalizedData]);

  const processedData = useMemo(() => {
    if (headers.length === 0) return [];
    return headers[0] === "Value"
      ? normalizedData.map((item) => ({ Value: item }))
      : normalizedData;
  }, [headers, normalizedData]);

  // Compute paginated data
  const paginatedData = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    return processedData.slice(start, end);
  }, [processedData, pagination]);

  // Sort only the paginated data
  const sortedPaginatedData = useMemo(() => {
    if (sorting.length === 0) return paginatedData;
    const [{ id, desc }] = sorting;
    return [...paginatedData].sort((a, b) => {
      const aVal = a[id];
      const bVal = b[id];
      if (aVal < bVal) return desc ? 1 : -1;
      if (aVal > bVal) return desc ? -1 : 1;
      return 0;
    });
  }, [paginatedData, sorting]);

  const columnHelper = createColumnHelper<any>();
  const columns = useMemo(
    () =>
      headers.map((header) =>
        columnHelper.accessor(header, {
          id: header,
          sortingFn: "alphanumeric", // Note: This is informational since sorting is manual
          header: ({ column }) => (
            <div
              className="flex items-center space-x-1 cursor-pointer select-none"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() !== "asc")
              }
            >
              <span className="font-medium">{header}</span>
              {column.getIsSorted() ? (
                column.getIsSorted() === "asc" ? (
                  <span style={{ color: theme.colors.accent }}> ▲</span>
                ) : (
                  <span style={{ color: theme.colors.accent }}> ▼</span>
                )
              ) : (
                <span style={{ color: theme.colors.textSecondary }}> ⬍</span>
              )}
            </div>
          ),
          cell: (info) => {
            const cellValue = info.getValue();
            return cellValue?.toString() || "N/A";
          },
        })
      ),
    [headers, theme]
  );

  const table = useReactTable({
    data: sortedPaginatedData,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(processedData.length / pagination.pageSize),
  });

  const getVisiblePages = (
    currentPage: number,
    totalPages: number,
    maxVisible: number
  ) => {
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const half = Math.floor(maxVisible / 2);
    let start = currentPage - half;
    if (start < 1) start = 1;
    let end = start + maxVisible - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxVisible + 1);
    }
    const pages: (number | string)[] = [];
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const maxVisiblePages = 5;
  const visiblePages = getVisiblePages(
    pagination.pageIndex + 1,
    table.getPageCount(),
    maxVisiblePages
  );

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: theme.colors.surface }}
    >
      <div
        className="overflow-auto max-h-96 scrollbar-thin"
        style={{
          scrollbarColor: `${theme.colors.textSecondary} ${theme.colors.surface}`,
        }}
      >
        <table className="w-full">
          <thead
            className="sticky top-0"
            style={{
              background: theme.colors.surface,
              boxShadow: `0 2px 8px ${theme.colors.text}10`,
            }}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-4 text-left text-sm font-medium transition-colors"
                    style={{
                      color: theme.colors.text,
                      backgroundColor: theme.colors.surface,
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody
            className="divide-y"
            style={{ borderColor: `${theme.colors.text}20` }}
          >
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-opacity-5 transition-colors"
                style={{ backgroundColor: theme.colors.surface }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 text-sm whitespace-nowrap"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        className="flex items-center justify-between pt-4 border-t"
        style={{
          borderColor: `${theme.colors.text}20`,
          backgroundColor: theme.colors.surface,
        }}
      >
        <div className="flex items-center space-x-2">
          <span
            className="text-sm"
            style={{ color: theme.colors.textSecondary }}
          >
            Rows per page:
          </span>
          <select
            value={pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="rounded-md text-sm px-3 py-1 focus:outline-none"
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.textSecondary}30`,
            }}
          >
            {[10, 20, 50, 100].map((size) => (
              <option
                key={size}
                value={size}
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                }}
              >
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center">
          <span
            className="text-sm px-2"
            style={{ color: theme.colors.textSecondary }}
          >
            Page <strong>{pagination.pageIndex + 1}</strong> of{" "}
            <strong>{table.getPageCount()}</strong>
          </span>
          <div className="flex items-center space-x-1">
            <CustomTooltip title="Go to first page">
              <button
                title="Go to first page"
                className="p-1.5 rounded-md hover:bg-opacity-10 disabled:opacity-30 disabled:hover:bg-opacity-0 disabled:cursor-not-allowed transition-all"
                style={{
                  color: theme.colors.text,
                  backgroundColor: theme.colors.accent + "20",
                }}
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                  />
                </svg>
              </button>
            </CustomTooltip>
            <CustomTooltip title="Go to previous page">
              <button
                title="Go to previous page"
                className="p-1.5 rounded-md hover:bg-opacity-10 disabled:opacity-30 disabled:hover:bg-opacity-0 disabled:cursor-not-allowed transition-all"
                style={{
                  color: theme.colors.text,
                  backgroundColor: theme.colors.accent + "20",
                }}
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            </CustomTooltip>
            <div className="flex">
              {visiblePages.map((page, index) =>
                typeof page === "number" ? (
                  <CustomTooltip key={index} title={`Go to page ${page}`}>
                    <button
                      key={index}
                      title={`Go to page ${page}`}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        page === pagination.pageIndex + 1
                          ? "font-semibold"
                          : "hover:bg-opacity-10"
                      }`}
                      style={{
                        color:
                          page === pagination.pageIndex + 1
                            ? theme.colors.accent
                            : theme.colors.text,
                        backgroundColor:
                          page === pagination.pageIndex + 1
                            ? theme.colors.accent + "20"
                            : "transparent",
                      }}
                      onClick={() => table.setPageIndex(page - 1)}
                    >
                      {page}
                    </button>
                  </CustomTooltip>
                ) : (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {page}
                  </span>
                )
              )}
            </div>
            <CustomTooltip title="Go to next page">
              <button
                title="Go to next page"
                className="p-1.5 rounded-md hover:bg-opacity-10 disabled:opacity-30 disabled:hover:bg-opacity-0 disabled:cursor-not-allowed transition-all"
                style={{
                  color: theme.colors.text,
                  backgroundColor: theme.colors.accent + "20",
                }}
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </CustomTooltip>
            <CustomTooltip title="Go to last page">
              <button
                title="Go to last page"
                className="p-1.5 rounded-md hover:bg-opacity-10 disabled:opacity-30 disabled:hover:bg-opacity-0 disabled:cursor-not-allowed transition-all"
                style={{
                  color: theme.colors.text,
                  backgroundColor: theme.colors.accent + "20",
                }}
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                </svg>
              </button>
            </CustomTooltip>
          </div>
        </div>
      </div>
    </div>
  );
});

const areEqual = (prevProps: DataTableProps, nextProps: DataTableProps) => {
  return prevProps.data === nextProps.data;
};

export default React.memo(DataTable, areEqual);
