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
import { motion, AnimatePresence } from "framer-motion";

const DataTable: React.FC<DataTableProps> = React.memo(({ data }) => {
  const { theme } = useTheme();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Listen for resize events
    window.addEventListener("resize", checkMobile);

    // Clean up
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return processedData;

    return processedData.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [processedData, searchTerm]);

  // Compute paginated data
  const paginatedData = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredData.slice(start, end);
  }, [filteredData, pagination]);

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
          sortingFn: "alphanumeric",
          header: ({ column }) => (
            <div
              className="flex items-center space-x-1 cursor-pointer select-none group"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() !== "asc")
              }
            >
              <span className="font-medium transition-colors duration-200 group-hover:text-opacity-90">
                {header}
              </span>
              <motion.span
                animate={{
                  rotate:
                    column.getIsSorted() === "asc"
                      ? 0
                      : column.getIsSorted() === "desc"
                      ? 180
                      : 0,
                  opacity: column.getIsSorted() ? 1 : 0.3,
                }}
                transition={{ duration: 0.2 }}
                style={{ color: theme.colors.accent }}
                className="flex items-center justify-center w-5 h-5"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M8 14l4-4 4 4" />
                </svg>
              </motion.span>
            </div>
          ),
          cell: (info) => {
            const cellValue = info.getValue();
            const valueString = cellValue?.toString() || "N/A";

            // Highlight search term if present
            if (searchTerm && valueString !== "N/A") {
              const regex = new RegExp(`(${searchTerm})`, "gi");
              const parts = valueString.split(regex);

              return (
                <div>
                  {parts.map((part: string, i: number) =>
                    regex.test(part) ? (
                      <span
                        key={i}
                        style={{
                          backgroundColor: `${theme.colors.accent}40`,
                          padding: "0px 2px",
                          borderRadius: "2px",
                        }}
                      >
                        {part}
                      </span>
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  )}
                </div>
              );
            }

            return valueString;
          },
        })
      ),
    [headers, theme, searchTerm]
  );

  const table = useReactTable({
    data: sortedPaginatedData,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(filteredData.length / pagination.pageSize),
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

  const maxVisiblePages = isMobile ? 3 : 5;
  const visiblePages = getVisiblePages(
    pagination.pageIndex + 1,
    table.getPageCount(),
    maxVisiblePages
  );

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: theme.colors.surface,
        transition: "all 0.3s ease",
      }}
    >
      {/* Header with search and info - Responsive layout */}
      <div
        className={`flex ${
          isMobile ? "flex-col space-y-2" : "items-center justify-between"
        } px-2 py-2 border-b`}
        style={{ borderColor: `${theme.colors.text}10` }}
      >
        <div className="flex items-center">
          <motion.div
            className="flex items-center bg-opacity-10 rounded-full overflow-hidden"
            animate={{
              width: isSearchOpen ? (isMobile ? "100%" : "240px") : "40px",
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{
              backgroundColor: `${theme.colors.accent}20`,
            }}
          >
            <button
              className="p-2 rounded-full flex-shrink-0"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              style={{ color: theme.colors.accent }}
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
            <AnimatePresence>
              {isSearchOpen && (
                <motion.input
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  type="text"
                  placeholder="Search table..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none px-2 py-1 text-sm w-full"
                  style={{ color: theme.colors.text }}
                  autoFocus
                />
              )}
            </AnimatePresence>
          </motion.div>

          <div
            className={`${isMobile ? "mt-2" : "ml-4"} text-sm`}
            style={{ color: theme.colors.textSecondary }}
          >
            {filteredData.length}{" "}
            {filteredData.length === 1 ? "record" : "records"}
            {searchTerm && ` • Filtering "${searchTerm}"`}
          </div>
        </div>

        <div
          className={`flex items-center ${
            isMobile ? "mt-2 justify-end" : "space-x-2"
          }`}
        >
          <span
            className="text-sm mr-2"
            style={{ color: theme.colors.textSecondary }}
          >
            Rows:
          </span>
          <select
            value={pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="rounded-md text-sm px-2 py-1 focus:outline-none transition-all"
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.accent}30`,
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
      </div>

      <div
        className="overflow-auto max-h-96 scrollbar-thin"
        style={{
          scrollbarColor: `${theme.colors.textSecondary} ${theme.colors.surface}`,
          scrollbarWidth: "thin",
        }}
      >
        <table className="w-full">
          <thead
            className="sticky top-0 z-10"
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
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="transition-colors"
                  onMouseEnter={() => setHoveredRow(row.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    backgroundColor:
                      hoveredRow === row.id
                        ? `${theme.colors.accent}08`
                        : theme.colors.surface,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 text-sm"
                      style={{
                        color: theme.colors.textSecondary,
                        transition: "all 0.2s ease",
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </motion.tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-6 py-12 text-center text-sm"
                  style={{ color: theme.colors.textSecondary }}
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <svg
                      className="w-12 h-12 opacity-30"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>No results found</span>
                    {searchTerm && (
                      <button
                        className="text-sm px-3 py-1 rounded-full mt-2"
                        style={{
                          backgroundColor: `${theme.colors.accent}20`,
                          color: theme.colors.accent,
                        }}
                        onClick={() => setSearchTerm("")}
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination area - Responsive layout */}
      <div
        className={`${
          isMobile
            ? "flex flex-col space-y-2"
            : "flex items-center justify-between"
        } px-2 pt-2 pb-2`}
        style={{
          backgroundColor: theme.colors.surface,
        }}
      >
        <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
          {isMobile ? "Page " : "Showing "}
          <span
            className="font-medium mx-1"
            style={{ color: theme.colors.text }}
          >
            {Math.min(
              pagination.pageIndex * pagination.pageSize + 1,
              filteredData.length
            )}
          </span>
          {!isMobile && "to"}
          {!isMobile && (
            <span
              className="font-medium mx-1"
              style={{ color: theme.colors.text }}
            >
              {Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                filteredData.length
              )}
            </span>
          )}
          {isMobile ? " of " : " of "}
          <span
            className="font-medium ml-1"
            style={{ color: theme.colors.text }}
          >
            {filteredData.length}
          </span>
        </div>

        <div
          className={`flex ${
            isMobile ? "justify-center w-full" : "items-center"
          }`}
        >
          <div className="flex items-center space-x-1">
            <CustomTooltip title="Go to first page">
              <button
                title="Go to first page"
                className="p-1.5 rounded-md hover:bg-opacity-20 disabled:opacity-30 disabled:hover:bg-opacity-0 disabled:cursor-not-allowed transition-all"
                style={{
                  color: theme.colors.text,
                  backgroundColor: table.getCanPreviousPage()
                    ? `${theme.colors.accent}10`
                    : "transparent",
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
                className="p-1.5 rounded-md hover:bg-opacity-20 disabled:opacity-30 disabled:hover:bg-opacity-0 disabled:cursor-not-allowed transition-all"
                style={{
                  color: theme.colors.text,
                  backgroundColor: table.getCanPreviousPage()
                    ? `${theme.colors.accent}10`
                    : "transparent",
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
                    <motion.button
                      key={index}
                      title={`Go to page ${page}`}
                      className={`px-2 py-1 text-sm rounded-md transition-colors ${
                        isMobile ? "text-xs" : ""
                      }`}
                      whileHover={{
                        scale: page === pagination.pageIndex + 1 ? 1 : 1.05,
                      }}
                      style={{
                        color:
                          page === pagination.pageIndex + 1
                            ? theme.colors.accent
                            : theme.colors.text,
                        backgroundColor:
                          page === pagination.pageIndex + 1
                            ? `${theme.colors.accent}20`
                            : "transparent",
                        fontWeight:
                          page === pagination.pageIndex + 1 ? 600 : 400,
                      }}
                      onClick={() => table.setPageIndex(page - 1)}
                    >
                      {page}
                    </motion.button>
                  </CustomTooltip>
                ) : (
                  <span
                    key={index}
                    className={`px-1 py-1 text-sm flex items-center ${
                      isMobile ? "text-xs" : ""
                    }`}
                    style={{ color: theme.colors.textSecondary }}
                  >
                    <svg
                      width="16"
                      height="4"
                      viewBox="0 0 16 4"
                      fill="currentColor"
                    >
                      <circle cx="2" cy="2" r="2" />
                      <circle cx="8" cy="2" r="2" />
                      <circle cx="14" cy="2" r="2" />
                    </svg>
                  </span>
                )
              )}
            </div>
            <CustomTooltip title="Go to next page">
              <button
                title="Go to next page"
                className="p-1.5 rounded-md hover:bg-opacity-20 disabled:opacity-30 disabled:hover:bg-opacity-0 disabled:cursor-not-allowed transition-all"
                style={{
                  color: theme.colors.text,
                  backgroundColor: table.getCanNextPage()
                    ? `${theme.colors.accent}10`
                    : "transparent",
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
                className="p-1.5 rounded-md hover:bg-opacity-20 disabled:opacity-30 disabled:hover:bg-opacity-0 disabled:cursor-not-allowed transition-all"
                style={{
                  color: theme.colors.text,
                  backgroundColor: table.getCanNextPage()
                    ? `${theme.colors.accent}10`
                    : "transparent",
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
