import React, { useMemo, useState, useEffect } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";

interface DataTableProps {
  data: any; // Supports both arrays and single objects
  darkMode?: boolean; // Add a prop for dark mode
}

const DataTable: React.FC<DataTableProps> = ({ data, darkMode = false }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [processedData, setProcessedData] = useState<any[]>([]);

  useEffect(() => {
    if (!data) {
      setHeaders([]);
      setProcessedData([]);
      return;
    }

    let normalizedData = data;

    if (!Array.isArray(normalizedData)) {
      normalizedData = [normalizedData];
    }

    if (typeof normalizedData[0] === "object") {
      const keys = Object.keys(normalizedData[0]);
      setHeaders(keys);
      setProcessedData(normalizedData);
    } else if (
      Array.isArray(normalizedData) &&
      typeof normalizedData[0] !== "object"
    ) {
      setHeaders(["Value"]);
      setProcessedData(normalizedData.map((item) => ({ Value: item })));
    } else {
      console.warn("Data format not recognized:", normalizedData);
      setHeaders([]);
      setProcessedData([]);
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
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() !== "asc")
              }
            >
              <span>{header}</span>
              {column.getIsSorted() === "asc"
                ? " 🔼"
                : column.getIsSorted() === "desc"
                ? " 🔽"
                : " ⬍"}
            </div>
          ),
          cell: (info) => info.getValue() ?? "N/A",
        })
      ),
    [headers]
  );

  const table = useReactTable({
    data: processedData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const tableClasses = darkMode
    ? "bg-gray-800 text-white"
    : "bg-white text-gray-800";
  const headerClasses = darkMode
    ? "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white sticky top-0"
    : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-700 sticky top-0";
  const rowClasses = darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100";
  const cellClasses = darkMode ? "text-gray-400" : "text-gray-500";
  const outerDivClasses = darkMode
    ? "rounded-md border p-1 bg-gray-900 border-gray-700"
    : "rounded-md border p-1";

  return (
    <div className={outerDivClasses}>
      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        {" "}
        {/* Combined scrollable container */}
        <table className={`w-full text-sm border-collapse ${tableClasses}`}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${headerClasses}`}
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
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className={rowClasses}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${cellClasses}`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
