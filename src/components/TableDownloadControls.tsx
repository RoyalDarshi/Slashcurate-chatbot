// TableDownloadControls.tsx
import React from "react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import CustomTooltip from "./CustomTooltip";
import { Download } from "lucide-react";
import { Theme } from "../types";

interface TableDownloadControlsProps {
  csvData: any[];
  theme: Theme;
}

const TableDownloadControls: React.FC<TableDownloadControlsProps> = ({
  csvData,
  theme,
}) => {
  const handleDownloadTableXLSX = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(csvData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
      XLSX.writeFile(workbook, "table_data.xlsx");
    } catch (error) {
      console.error("Error downloading XLSX:", error);
    }
  };

  return (
    <CustomTooltip title="Download XLSX" position="top">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleDownloadTableXLSX}
        className="rounded-full p-2 shadow-sm transition-colors duration-200 hover:opacity-85"
        style={{ background: theme.colors.surface }}
      >
        <Download size={20} style={{ color: theme.colors.accent }} />
      </motion.button>
    </CustomTooltip>
  );
};

export default React.memo(TableDownloadControls);
