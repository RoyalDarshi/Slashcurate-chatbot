import React, { useMemo, useState, useEffect } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

interface DataTableProps {
  data: any; // Supports both arrays and single objects
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
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
      // Handle the case where data is an array of primitives
      setHeaders(["Value"]); // Or a more appropriate name
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

  return (
    <div className="rounded-md border p-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
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
