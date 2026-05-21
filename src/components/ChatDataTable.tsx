import React from "react";
import { DataTableProps } from "../types";
import SmartDataTable from "./SmartDataTable";

const ChatDataTable: React.FC<DataTableProps> = React.memo(({ data, onRowsChange }) => {
  return (
    <SmartDataTable
      data={data}
      variant="chat"
      fileBaseName={`chat_table_${new Date().toISOString().slice(0, 10)}`}
      onRowsChange={onRowsChange}
    />
  );
});

const areEqual = (prevProps: DataTableProps, nextProps: DataTableProps) =>
  prevProps.data === nextProps.data &&
  prevProps.onRowsChange === nextProps.onRowsChange;

export default React.memo(ChatDataTable, areEqual);
