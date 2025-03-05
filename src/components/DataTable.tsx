import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";

interface DataTableProps {
  data: any;
  darkMode?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({ data, darkMode = false }) => {
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

    let normalizedData = Array.isArray(data) ? data : [data];

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
              className="flex items-center space-x-1 cursor-pointer select-none hover:text-blue-500"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() !== "asc")
              }
            >
              <span className="font-semibold text-blue-500">{header}</span>
              {column.getIsSorted() ? (
                column.getIsSorted() === "asc" ? (
                  <span className="text-blue-500"> ▲</span>
                ) : (
                  <span className="text-blue-500"> ▼</span>
                )
              ) : (
                <span className="text-gray-400"> ⬍</span>
              )}
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

  return (
    <div
      className={`rounded-lg border shadow-lg transition-all duration-300 h-[400px] overflow-hidden ${
        darkMode
          ? "bg-gray-900 border-gray-700 text-gray-200"
          : "bg-white border-gray-200 text-gray-700"
      }`}
    >
      <div className="w-full h-full overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead
            className={`sticky top-0 z-10 border-b ${
              darkMode
                ? "bg-gray-800 text-gray-300"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <tr>
              {table.getHeaderGroups().map((headerGroup) => (
                <React.Fragment key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider cursor-pointer transition-colors duration-200 ${
                        darkMode
                          ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                      }`}
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
            className={`divide-y ${
              darkMode
                ? "bg-gray-900 divide-gray-700"
                : "bg-white divide-gray-200"
            }`}
          >
            {table.getRowModel().rows.map((row, i) => (
              <tr
                key={row.id}
                className={`transition duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 ${
                  i % 2 === 0
                    ? darkMode
                      ? "bg-gray-900"
                      : "bg-white"
                    : darkMode
                    ? "bg-gray-800"
                    : "bg-gray-50"
                }`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300"
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
