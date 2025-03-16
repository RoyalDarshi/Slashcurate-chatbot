import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import { DataTableProps } from "../types";
import { useTheme } from "../ThemeContext";

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const { theme } = useTheme();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [processedData, setProcessedData] = useState<any[]>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data) {
      setHeaders([]);
      setProcessedData([]);
      return;
    }

    const normalizedData = Array.isArray(data) ? data : [data];

    if (typeof normalizedData[0] === "object") {
      setHeaders(Object.keys(normalizedData[0]));
      setProcessedData(normalizedData);
    } else {
      setHeaders(["Value"]);
      setProcessedData(normalizedData.map((item) => ({ Value: item })));
    }
  }, [data]);

  const columnHelper = createColumnHelper<any>();

  const columns = useMemo(
    () =>
      headers.map((header) =>
        columnHelper.accessor(header, {
          id: header,
          sortingFn: "alphanumeric",
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
            return cellValue !== undefined && cellValue !== null
              ? cellValue
              : "N/A";
          },
        })
      ),
    [headers, theme]
  );

  const table = useReactTable({
    data: processedData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div
      className="rounded-lg border shadow-sm transition-colors duration-200"
      style={{
        background: theme.colors.surface,
        borderColor: `${theme.colors.text}20`,
        borderRadius: theme.borderRadius.default,
      }}
    >
      <div
        ref={tableContainerRef}
        className="overflow-auto max-h-96 scrollbar-thin"
        style={{
          scrollbarColor: `${theme.colors.textSecondary} ${theme.colors.surface}`,
        }}
      >
        <div className="align-middle mr-2">
          <table className="min-w-full divide-y">
            <thead
              className="sticky top-0 transition-colors duration-200"
              style={{
                background: theme.colors.surface,
                color: theme.colors.text,
              }}
            >
              <tr>
                {table.getHeaderGroups().map((headerGroup) => (
                  <React.Fragment key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        scope="col"
                        className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer"
                        style={{
                          background: theme.colors.surface,
                          color: theme.colors.text,
                          borderBottom: `1px solid ${theme.colors.text}20`,
                        }}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody
              className="divide-y transition-colors duration-200"
              style={{
                background: theme.colors.surface,
                borderColor: `${theme.colors.text}20`,
              }}
            >
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-all duration-200 group"
                  style={{
                    background: theme.colors.surface,
                    color: theme.colors.text,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-5 py-4 whitespace-nowrap text-sm transition-colors duration-200 group-hover:text-gray-700 dark:group-hover:text-gray-200"
                      style={{
                        color: theme.colors.textSecondary,
                        borderBottom: `1px solid ${theme.colors.text}20`,
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
