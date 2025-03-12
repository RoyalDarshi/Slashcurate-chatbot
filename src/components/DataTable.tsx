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

const DataTable: React.FC<DataTableProps> = ({ data }) => {
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
                  <span className="text-blue-500"> ▲</span>
                ) : (
                  <span className="text-blue-500"> ▼</span>
                )
              ) : (
                <span className="text-gray-400"> ⬍</span>
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
    <div className="rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 transition-colors duration-200 shadow-sm dark:shadow-lg">
      <div
        ref={tableContainerRef}
        className="overflow-auto max-h-96 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
      >
        <div className="align-middle mr-2">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="sticky top-0 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors duration-200">
              <tr>
                {table.getHeaderGroups().map((headerGroup) => (
                  <React.Fragment key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        scope="col"
                        className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wider hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer"
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
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 transition-colors duration-200">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-all duration-200 bg-white dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200 group-hover:text-gray-700 dark:group-hover:text-gray-200"
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
