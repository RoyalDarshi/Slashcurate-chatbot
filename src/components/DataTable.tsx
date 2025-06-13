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

// This function formats header text from snake_case to Title Case
const formatHeaderText = (header: string): string => {
  return header
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const DataTable: React.FC<DataTableProps> = React.memo(({ data }) => {
  const { theme } = useTheme();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Only set searching to true when the search term changes but isn't debounced yet
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
    } else {
      // Once the debounced search term catches up, searching is done
      setIsSearching(false);
    }
  }, [searchTerm, debouncedSearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Add debounce effect for search
  useEffect(() => {
    setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 200);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [searchTerm]);

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
  }, [sorting]);

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

  // Enhanced filtering logic with better type handling
  const filteredData = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return processedData;

    const searchTermLower = debouncedSearchTerm.toLowerCase().trim();

    return processedData.filter((row) => {
      // Search across all fields in the row
      return Object.entries(row).some(([key, value]) => {
        // Skip null/undefined values
        if (value === null || value === undefined) return false;

        // Convert to string safely for comparison
        const stringValue = String(value).toLowerCase();

        // Check for partial matches
        return stringValue.includes(searchTermLower);
      });
    });
  }, [processedData, debouncedSearchTerm]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearchTerm]);

  const sortedData = useMemo(() => {
    if (sorting.length === 0) return filteredData;

    const [{ id, desc }] = sorting;

    return [...filteredData].sort((a, b) => {
      const aVal = a[id];
      const bVal = b[id];

      // Handle undefined/null values (place them at the end)
      if (aVal === undefined || aVal === null) return desc ? -1 : 1;
      if (bVal === undefined || bVal === null) return desc ? 1 : -1;

      // Handle different data types
      if (typeof aVal === "number" && typeof bVal === "number") {
        return desc ? bVal - aVal : aVal - bVal;
      }

      // Convert to strings for string comparison
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      // Try numeric comparison if both strings can be parsed as numbers
      const aNum = Number(aStr);
      const bNum = Number(bStr);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return desc ? bNum - aNum : aNum - bNum;
      }

      // Default string comparison
      if (aStr < bStr) return desc ? 1 : -1;
      if (aStr > bStr) return desc ? -1 : 1;
      return 0;
    });
  }, [filteredData, sorting]);

  // Add reset capability when search has no results
  const hasNoResults =
    debouncedSearchTerm.trim() !== "" && filteredData.length === 0;

  // Compute paginated data
  const paginatedData = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, pagination]);

  const columnHelper = createColumnHelper<any>();
  const columns = useMemo(
    () =>
      headers.map((header) =>
        columnHelper.accessor(header, {
          id: header,
          sortingFn: "alphanumeric",
          header: ({ column }) => (
            <div
              className="flex items-center justify-between cursor-pointer select-none group transition-colors px-2 py-1 rounded-md"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() !== "asc")
              }
              style={{
                backgroundColor: column.getIsSorted()
                  ? `${theme.colors.accent}15`
                  : "transparent",
              }}
            >
              <span className="font-medium transition-colors text-white duration-200 group-hover:text-opacity-90">
                {formatHeaderText(header)}
              </span>
              <motion.div
                animate={{
                  rotate:
                    column.getIsSorted() === "asc"
                      ? 0
                      : column.getIsSorted() === "desc"
                      ? 180
                      : 0,
                  opacity: column.getIsSorted() ? 1 : 0.4,
                  scale: column.getIsSorted() ? 1 : 0.9,
                }}
                transition={{ duration: 0.2, type: "spring", stiffness: 200 }}
                className="flex items-center justify-center w-5 h-5 ml-1.5"
                style={{
                  color: column.getIsSorted() ? "white" : theme.colors.accent,
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 9l6-6 6 6" />
                </svg>
              </motion.div>
            </div>
          ),
          cell: (info) => {
            // Cell implementation remains the same
            const cellValue = info.getValue();
            const valueString = cellValue?.toString() || "N/A";

            // Rest of your cell implementation...
            return <div className="text-base font-medium">{valueString}</div>;
          },
        })
      ),
    [headers, theme, debouncedSearchTerm]
  );

  const table = useReactTable({
    data: paginatedData, // previously was sortedPaginatedData
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

  const rowsOptions = useMemo(() => {
    const size = filteredData.length;
    let options = [20]; // Always include 20

    if (size <= 100) options = [...new Set([10, 20, 50, 100])];
    else if (size <= 1000) options = [...new Set([20, 50, 100, 200, 500])];
    else if (size <= 5000) options = [...new Set([20, 100, 500, 1000])];
    else if (size <= 10000) options = [...new Set([20, 100, 500, 1000, 2000])];
    else options = [...new Set([20, 100, 500, 1000, 2000, 5000])];

    return options.sort((a, b) => a - b); // Sort numerically
  }, [filteredData.length]);
  // Toggle controls visibility
  const toggleControls = () => {
    setShowControls(!showControls);
  };

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: theme.colors.surface,
        transition: "all 0.3s ease",
      }}
    >
      {/* Controls toggle button for small datasets */}
      {/* {filteredData.length <= 20 && (
        <div className="flex justify-end ">
          <button
            onClick={toggleControls}
            className="text-xs flex items-center py-1 px-2 rounded-md transition-colors"
            style={{
              backgroundColor: `${theme.colors.accent}15`,
              color: theme.colors.accent,
            }}
          >
            {showControls ? "Hide Controls" : "Show Controls"}
            <svg
              className="w-3 h-3 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={showControls ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"}
              />
            </svg>
          </button>
        </div>
      )} */}

      {/* Header with search and info - Conditionally displayed */}
      {(filteredData.length > 20 || showControls) && (
        <div
          className={`flex ${
            isMobile ? "flex-col space-y-2" : "items-center justify-between"
          } px-3 py-2 border-b`}
          style={{
            borderColor: `${theme.colors.text}10`,
            backgroundColor: `${theme.colors.surface}`,
          }}
        >
          <div className="flex items-center">
            <motion.div
              className="flex items-center bg-opacity-10 rounded-full overflow-hidden"
              animate={{
                width: isSearchOpen ? (isMobile ? "100%" : "240px") : "40px",
                backgroundColor: debouncedSearchTerm
                  ? `${theme.colors.accent}30`
                  : `${theme.colors.accent}20`,
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <button
                className="p-2 rounded-full flex-shrink-0"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                style={{
                  color: debouncedSearchTerm
                    ? theme.colors.accent
                    : theme.colors.textSecondary,
                }}
                aria-label={isSearchOpen ? "Close search" : "Open search"}
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
                    strokeWidth={debouncedSearchTerm ? 2.5 : 2}
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
                    placeholder="Search all data..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none px-2 py-1 text-sm w-full"
                    style={{ color: theme.colors.text }}
                    autoFocus
                  />
                )}
              </AnimatePresence>
              {isSearchOpen && searchTerm && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-1 mr-2 rounded-full flex-shrink-0"
                  onClick={() => {
                    setSearchTerm("");
                    setDebouncedSearchTerm("");
                  }}
                  style={{ color: theme.colors.accent }}
                  aria-label="Clear search"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </motion.button>
              )}
            </motion.div>

            <div
              className={`${isMobile ? "mt-2" : "ml-4"} text-sm`}
              style={{ color: theme.colors.textSecondary }}
            >
              <div
                className={`${isMobile && "mt-2"} text-sm flex items-center`}
                style={{ color: theme.colors.textSecondary }}
              >
                {isSearching ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="mr-2"
                    >
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6" />
                      </svg>
                    </motion.div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {filteredData.length}{" "}
                      {filteredData.length === 1 ? "record" : "records"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div
            className={`flex items-center ${
              isMobile ? "mt-2 justify-end" : "space-x-2"
            }`}
          >
            <span
              className="text-sm mx-2"
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
              {rowsOptions.map((size) => (
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
      )}

      {/* Table content - Enhanced styling for better visibility */}
      <div className="w-full flex justify-center py-2">
        <div
          className="overflow-auto scrollbar-thin"
          style={{
            height: "calc(100vh - 350px)", // Adjust height based on your layout
            scrollbarColor: `${theme.colors.accent}40 ${theme.colors.surface}`,
          }}
        >
          <table className="w-full">
            {table.getRowModel().rows.length > 0 && (
              <thead
                className="sticky top-0"
                style={{
                  background: theme.colors.accent,
                  color: theme.colors.surface,
                }}
              >
                {table.getHeaderGroups().map((headerGroup) => {
                  return (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <th
                            key={header.id}
                            className="px-6 py-3 text-center text-sm font-medium"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  );
                })}
              </thead>
            )}
            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row, idx) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    onMouseEnter={() => setHoveredRow(row.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      backgroundColor:
                        hoveredRow === row.id
                          ? `${theme.colors.accent}20`
                          : idx % 2 === 0
                          ? `${theme.colors.accent}10`
                          : `${theme.colors.accent}10`,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 text-center text-md"
                        style={{ color: theme.colors.text }}
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
                      {hasNoResults && (
                        <button
                          className="text-sm px-3 py-1 rounded-full mt-2 transition-colors"
                          style={{
                            backgroundColor: `${theme.colors.accent}20`,
                            color: theme.colors.accent,
                          }}
                          onClick={() => {
                            setSearchTerm("");
                            setDebouncedSearchTerm("");
                            setPagination((prev) => ({
                              ...prev,
                              pageIndex: 0,
                            }));
                          }}
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
      </div>

      {/* Pagination area - Conditionally displayed and simplified */}
      {(filteredData.length > 10 || showControls) && (
        <div
          className={`${
            isMobile
              ? "flex flex-col space-y-2"
              : "flex items-center justify-between"
          } px-3 pt-2 pb-2`}
          style={{
            backgroundColor: theme.colors.surface,
            borderTop: `1px solid ${theme.colors.text}10`,
          }}
        >
          <div
            className="text-sm"
            style={{ color: theme.colors.textSecondary }}
          >
            {isMobile ? "Page " : "Showing "}
            <span
              className="font-medium mx-1"
              style={{ color: theme.colors.text }}
            >
              {Math.min(
                pagination.pageIndex * pagination.pageSize +
                  (filteredData.length > 0 ? 1 : 0),
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

          {table.getPageCount() > 1 && (
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
          )}
        </div>
      )}
    </div>
  );
});

const areEqual = (prevProps: DataTableProps, nextProps: DataTableProps) => {
  return prevProps.data === nextProps.data;
};

export default React.memo(DataTable, areEqual);
