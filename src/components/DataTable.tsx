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
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";

const formatHeaderText = (header: string): string => {
  return header
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const MIN_COL_WIDTH = 140; // Best compromise
const MAX_COL_WIDTH = 260; // Prevent super-wide growth

const DataTable: React.FC<DataTableProps> = React.memo(({ data }) => {
  const { theme } = useTheme();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const normalizedData = useMemo(
    () => (Array.isArray(data) ? data : data ? [data] : []),
    [data]
  );

  const headers = useMemo(() => {
    if (normalizedData.length === 0) return [];
    const first = normalizedData[0];
    return typeof first === "object" ? Object.keys(first) : ["Value"];
  }, [normalizedData]);

  const processedData = useMemo(() => {
    if (headers[0] === "Value") return normalizedData.map((v) => ({ Value: v }));
    return normalizedData;
  }, [headers, normalizedData]);

  const filteredData = useMemo(() => {
    if (!debouncedSearch.trim()) return processedData;
    const term = debouncedSearch.toLowerCase();
    return processedData.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(term))
    );
  }, [processedData, debouncedSearch]);

  const sortedData = useMemo(() => {
    if (!sorting.length) return filteredData;
    const [{ id, desc }] = sorting;
    return [...filteredData].sort((a, b) => {
      const av = a[id];
      const bv = b[id];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (!isNaN(av) && !isNaN(bv)) return desc ? bv - av : av - bv;
      return desc
        ? String(bv).localeCompare(String(av))
        : String(av).localeCompare(String(bv));
    });
  }, [filteredData, sorting]);

  const columnHelper = createColumnHelper<any>();

  const columns = useMemo(
    () =>
      headers.map((header) =>
        columnHelper.accessor(header, {
          id: header,
          header: ({ column }) => (
            <div
              className="cursor-pointer select-none"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() !== "asc")
              }
            >
              {formatHeaderText(header)}
            </div>
          ),
          cell: (info) => {
            const value = info.getValue();
            return (
              <div className="truncate">
                {value !== null && value !== undefined ? String(value) : "N/A"}
              </div>
            );
          },
        })
      ),
    [headers]
  );

  const table = useReactTable({
    data: sortedData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const rows = table.getRowModel().rows;

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 52,
    overscan: 10,
  });

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const exportExcel = () => {
    const sheet = XLSX.utils.json_to_sheet(sortedData);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Data");
    XLSX.writeFile(book, "table_data.xlsx");
  };

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        background: theme.colors.surface,
        borderColor: `${theme.colors.text}20`,
        boxShadow: theme.shadow.lg,
      }}
    >
      {/* ===================== Top Bar ===================== */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: `${theme.colors.text}15` }}
      >
        <input
          type="text"
          placeholder="Search..."
          className="px-3 py-1.5 rounded-md w-48 text-sm outline-none"
          style={{
            background: theme.colors.surface,
            border: `1px solid ${theme.colors.text}25`,
            color: theme.colors.text,
          }}
          onChange={(e) => setSearchTerm(e.target.value)}
          value={searchTerm}
        />

        {sortedData.length > 0 && (
          <CustomTooltip title="Export to Excel">
            <button
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm"
              style={{
                backgroundColor: `${theme.colors.accent}20`,
                color: theme.colors.accent,
              }}
              onClick={exportExcel}
            >
              <Download size={16} />
              Export
            </button>
          </CustomTooltip>
        )}
      </div>

      {/* ===================== TABLE ===================== */}
      <div
        ref={containerRef}
        className="overflow-auto"
        style={{
          height: "calc(100vh - 260px)",
        }}
      >
        <table className="w-full table-fixed">
          {/* ---------- HEADER ---------- */}
          <thead
            className="sticky top-0 z-10"
            style={{
              background: theme.colors.accent,
              color: theme.colors.surface,
            }}
          >
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left text-sm font-semibold border-b truncate"
                    style={{
                      minWidth: MIN_COL_WIDTH,
                      maxWidth: MAX_COL_WIDTH,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      borderColor: `${theme.colors.surface}25`,
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

          {/* ---------- BODY (Virtualized) ---------- */}
          <tbody
            style={{
              height: rowVirtualizer.getTotalSize(),
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((vRow) => {
              const row = rows[vRow.index];

              return (
                <tr
                  key={row.id}
                  className="absolute left-0 w-full border-b"
                  style={{
                    top: 0,
                    transform: `translateY(${vRow.start}px)`,
                    height: vRow.size,
                    background:
                      vRow.index % 2 === 0
                        ? `${theme.colors.accent}05`
                        : `${theme.colors.accent}10`,
                    borderColor: `${theme.colors.text}10`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-3 py-2 text-sm truncate"
                      style={{
                        minWidth: MIN_COL_WIDTH,
                        maxWidth: MAX_COL_WIDTH,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: theme.colors.text,
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div
            className="flex justify-center items-center h-40 text-sm"
            style={{ color: theme.colors.textSecondary }}
          >
            No matching data found.
          </div>
        )}
      </div>

      {/* ===================== FOOTER ===================== */}
      <div
        className="px-3 py-2 border-t text-sm"
        style={{ borderColor: `${theme.colors.text}15` }}
      >
        <span style={{ color: theme.colors.textSecondary }}>
          Total Records:{" "}
        </span>
        <span style={{ color: theme.colors.text, fontWeight: 600 }}>
          {filteredData.length}
        </span>
      </div>
    </div>
  );
});

export default DataTable;
