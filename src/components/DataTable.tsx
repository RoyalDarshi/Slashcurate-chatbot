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
              className="flex items-center space-x-1 cursor-pointer select-none"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() !== "asc")
              }
            >
              <span className="font-medium">{header}</span>
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
      className={`rounded-lg border p-4 shadow-realistic ${
        darkMode
          ? "bg-gray-800 border-gray-700 text-gray-200"
          : "bg-white border-gray-200 text-gray-700"
      }`}
    >
      <div
        ref={tableContainerRef}
        className="overflow-x-auto overflow-y-auto max-h-96"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: darkMode
            ? "gray-600 transparent"
            : "gray-300 transparent",
        }}
      >
        <div className="min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead
              className={`sticky top-0 ${
                darkMode
                  ? "bg-gray-700 text-gray-300"
                  : "bg-gray-50 text-gray-600"
              }`}
            >
              <tr>
                {table.getHeaderGroups().map((headerGroup) => (
                  <React.Fragment key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        scope="col"
                        className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wider"
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
                  ? "bg-gray-800 divide-gray-700"
                  : "bg-white divide-gray-200"
              }`}
            >
              {table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`${
                    i % 2 === 0
                      ? darkMode
                        ? "bg-gray-800"
                        : "bg-white"
                      : darkMode
                      ? "bg-gray-750"
                      : "bg-gray-50"
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
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
