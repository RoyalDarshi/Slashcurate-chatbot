import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
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
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [searchTerm, debouncedSearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const normalizedData = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : [data];
  }, [data]);

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

  const filteredData = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return processedData;
    const searchTermLower = debouncedSearchTerm.toLowerCase().trim();
    return processedData.filter((row) => {
      return Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchTermLower)
      );
    });
  }, [processedData, debouncedSearchTerm]);

  const sortedData = useMemo(() => {
    if (sorting.length === 0) return filteredData;
    const [{ id, desc }] = sorting;
    return [...filteredData].sort((a, b) => {
      const aVal = a[id];
      const bVal = b[id];
      if (aVal === undefined || aVal === null) return desc ? -1 : 1;
      if (bVal === undefined || bVal === null) return desc ? 1 : -1;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return desc ? bVal - aVal : aVal - bVal;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return desc ? 1 : -1;
      if (aStr > bStr) return desc ? -1 : 1;
      return 0;
    });
  }, [filteredData, sorting]);

  const hasNoResults =
    debouncedSearchTerm.trim() !== "" && filteredData.length === 0;

  const columnHelper = createColumnHelper<any>();
  const columns = useMemo(
    () =>
      headers.map((header) =>
        columnHelper.accessor(header, {
          id: header,
          sortingFn: "alphanumeric",
          header: ({ column }) => (
            <div
              className="flex items-center justify-center gap-2 cursor-pointer select-none group transition-colors px-2 py-1 rounded-md"
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
            const cellValue = info.getValue();
            // Just return the text directly
            return cellValue?.toString() || "N/A";
          },
        })
      ),
    [headers, theme]
  );

  const table = useReactTable({
    data: sortedData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
  });

  // --- Virtualization Setup ---
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 65, // Adjust this to your actual row height
    overscan: 5,
  });

  // --- NEW: Ref for the header container ---
  const headerContainerRef = useRef<HTMLDivElement>(null);

  // --- NEW: Effect to sync horizontal scroll ---
  useEffect(() => {
    const bodyEl = tableContainerRef.current;
    const headEl = headerContainerRef.current;

    if (bodyEl && headEl) {
      const syncScroll = () => {
        headEl.scrollLeft = bodyEl.scrollLeft;
      };
      bodyEl.addEventListener("scroll", syncScroll);
      return () => bodyEl.removeEventListener("scroll", syncScroll);
    }
  }, []); // Runs once on mount

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  return (
    <div
      className="rounded-lg overflow-hidden h-full flex flex-col"
      style={{
        height: "calc(100vh - 135px)", // Adjust height to fit your layout
        background: theme.colors.surface,
        transition: "all 0.3s ease",
      }}
    >
      {/* --- CONTROLS SECTION (Unchanged) --- */}
      {filteredData.length <= 20 && (
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
      )}

      {(filteredData.length > 20 || showControls) && (
        <div
          className={`flex ${isMobile ? "flex-col space-y-2" : "items-center justify-between"
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
            </motion.div>

            <div
              className={`${isMobile ? "mt-2" : "ml-4"} text-sm`}
              style={{ color: theme.colors.textSecondary }}
            >
              <span>
                {filteredData.length}{" "}
                {filteredData.length === 1 ? "record" : "records"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* --- NEW: Header Table Container --- */}
      <div
        ref={headerContainerRef}
        className="w-full overflow-x-hidden" // Overflow is hidden, controlled by body scroll
        style={{
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE
        }}
      >
        <table
          className="mx-auto"
          style={{
            tableLayout: "fixed",
            width: table.getTotalSize(), // Set total width
          }}
        >
          <thead
            style={{
              background: theme.colors.accent,
              color: theme.colors.surface,
            }}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-center text-sm font-medium"
                    onClick={header.column.getToggleSortingHandler()}
                    style={{
                      width: header.getSize(), // Set specific column width
                    }}
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
        </table>
      </div>

      {/* --- REFACTORED: Body Table Container (Scrollable) --- */}
      <div
        ref={tableContainerRef}
        className="w-full overflow-auto flex-1 scrollbar-thin" // Handles V and H scroll
        style={{
          scrollbarColor: `${theme.colors.accent}40 ${theme.colors.surface}`,
        }}
      >
        <table
          className="mx-auto"
          style={{
            tableLayout: "fixed",
            width: table.getTotalSize(), // Set total width
          }}
        >
          {/* Header is GONE from here */}

          {/* --- Virtualized Table Body --- */}
          <tbody
            style={{
              display: "grid",
              height: `${rowVirtualizer.getTotalSize()}px`, // Virtual height
              position: "relative",
            }}
          >
            {/* Rows are mapped only if they exist */}
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <motion.tr
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualRow.index}
                  key={row.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, y: virtualRow.start }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{
                    display: "flex",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%", // Row spans full table width
                  }}
                  onMouseEnter={() => setHoveredRow(row.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-5 text-md"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: theme.colors.text,
                        textAlign: "center",
                        width: cell.column.getSize(), // Set specific column width
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </motion.tr>
              );
            })}
          </tbody>
        </table>

        {/* --- NEW: "No Results" Table --- */}
        {/* Rendered only when rows.length is 0, outside the virtualized tbody */}
        {rows.length === 0 && (
          <table className="w-full">
            <tbody>
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
                        }}
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
});

const areEqual = (prevProps: DataTableProps, nextProps: DataTableProps) => {
  return prevProps.data === nextProps.data;
};

export default React.memo(DataTable, areEqual);
