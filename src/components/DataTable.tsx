import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual"; // Import the virtualizer
import { DataTableProps } from "../types";
import { useTheme } from "../ThemeContext";
import CustomTooltip from "./CustomTooltip";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";

const formatHeaderText = (header: string): string => {
  return header
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const DataTable: React.FC<DataTableProps> = React.memo(({ data }) => {
  const { theme } = useTheme();
  const [sorting, setSorting] = useState<SortingState>([]);
  // --- Pagination state is removed ---
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

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
    return processedData.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchTermLower)
      )
    );
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

  const handleExportToExcel = () => {
    try {
      // Export uses filteredData, which contains all matching rows, not just visible ones. This is correct.
      const worksheet = XLSX.utils.json_to_sheet(sortedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
      XLSX.writeFile(workbook, "table_data.xlsx");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    }
  };

  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) setIsSearching(true);
    else setIsSearching(false);
  }, [searchTerm, debouncedSearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const hasNoResults =
    debouncedSearchTerm.trim() !== "" && filteredData.length === 0;

  const columnHelper = createColumnHelper<any>();
  const columns = useMemo(
    () =>
      headers.map((header) =>
        columnHelper.accessor(header, {
          id: header,
          header: ({ column }) => (
            <div
              className="flex items-center justify-between cursor-pointer select-none group transition-colors px-2 py-1 rounded-md"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() !== "asc")
              }
            >
              <span className="font-medium transition-colors text-white duration-200 group-hover:text-opacity-90">
                {formatHeaderText(header)}
              </span>
            </div>
          ),
          cell: (info) => (
            <div className="text-base font-medium">
              {info.getValue()?.toString() || "N/A"}
            </div>
          ),
        })
      ),
    [headers, theme]
  );

  const table = useReactTable({
    data: sortedData, // Use the full sorted/filtered data
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    // No pagination options needed
  });

  // --- Virtualization Setup ---
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 60, // IMPORTANT: Adjust this to your row's height in pixels
    overscan: 10,
  });

  return (
    <div
      className="rounded-lg overflow-hidden shadow-lg"
      style={{ background: theme.colors.surface }}
    >
      <div
        className={`flex ${
          isMobile ? "flex-col space-y-2" : "items-center justify-between"
        } px-3 py-2 border-b`}
        style={{ borderColor: `${theme.colors.text}10` }}
      >
        <div className="flex items-center">
          {/* Search Input */}
          <motion.div
            className="flex items-center bg-opacity-10 rounded-full overflow-hidden"
            animate={{
              width: isSearchOpen ? (isMobile ? "100%" : "240px") : "40px",
            }}
          >
            {/* ... your search UI ... */}
          </motion.div>
        </div>
        <div
          className={`flex items-center ${
            isMobile ? "mt-2 justify-end" : "space-x-2"
          }`}
        >
          {filteredData.length > 0 && (
            <CustomTooltip title="Export to Excel">
              <button
                className="flex items-center space-x-1 px-2 py-1 rounded-md transition-colors"
                style={{
                  backgroundColor: `${theme.colors.accent}15`,
                  color: theme.colors.accent,
                }}
                onClick={handleExportToExcel}
              >
                <Download size={16} />
                <span className="text-sm">Export</span>
              </button>
            </CustomTooltip>
          )}
        </div>
      </div>

      {/* --- Scrollable Table Container --- */}
      <div
        ref={tableContainerRef}
        className="overflow-auto scrollbar-thin"
        style={{
          height: "calc(100vh - 223px)", // Adjust height to fit your layout
          scrollbarColor: `${theme.colors.accent}40 ${theme.colors.surface}`,
        }}
      >
        <table className="w-full">
          <thead
            className="sticky top-0 z-10"
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

          {/* --- Virtualized Table Body --- */}
          <tbody
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: virtualRow.index * 0.01 }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    backgroundColor:
                      hoveredRow === row.id
                        ? `${theme.colors.accent}20`
                        : virtualRow.index % 2 === 0
                        ? `${theme.colors.accent}05`
                        : `${theme.colors.accent}10`,
                  }}
                  onMouseEnter={() => setHoveredRow(row.id)}
                  onMouseLeave={() => setHoveredRow(null)}
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
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div
            className="flex justify-center items-center h-48 text-center"
            style={{ color: theme.colors.textSecondary }}
          >
            <div>
              <svg
                className="w-12 h-12 opacity-30 mx-auto"
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
              <span>
                {hasNoResults ? "No results found" : "No data available"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* --- Footer with record count --- */}
      <div
        className="flex items-center justify-start px-3 py-2"
        style={{
          backgroundColor: theme.colors.surface,
          borderTop: `1px solid ${theme.colors.text}10`,
        }}
      >
        <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
          Total Records:{" "}
          <span className="font-medium" style={{ color: theme.colors.text }}>
            {filteredData.length}
          </span>
        </div>
      </div>
    </div>
  );
});

const areEqual = (prevProps: DataTableProps, nextProps: DataTableProps) => {
  return prevProps.data === nextProps.data;
};

export default React.memo(DataTable, areEqual);
