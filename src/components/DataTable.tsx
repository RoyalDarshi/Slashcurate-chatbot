import React from "react";
import { DataTableProps } from "../types";
import SmartDataTable from "./SmartDataTable";

const DataTable: React.FC<DataTableProps> = React.memo(({ data, onRowsChange, variant = "dashboard-flat" }) => {
  return (
    <SmartDataTable
      data={data}
      variant={variant}
      fileBaseName={`dashboard_table_${new Date().toISOString().slice(0, 10)}`}
      onRowsChange={onRowsChange}
    />
  );
});

const areEqual = (prevProps: DataTableProps, nextProps: DataTableProps) =>
  prevProps.data === nextProps.data &&
  prevProps.onRowsChange === nextProps.onRowsChange &&
  prevProps.variant === nextProps.variant;

export default React.memo(DataTable, areEqual);
