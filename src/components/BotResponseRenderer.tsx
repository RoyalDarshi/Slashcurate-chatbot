// BotResponseRenderer.tsx
import React, { useEffect, useState } from "react";
import DataTable from "./DataTable";
import DynamicBarGraph from "./Graphs/DynamicBarGraph";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MiniLoader from "./MiniLoader";
import { useTheme } from "../ThemeContext";
import { ChatMessageProps } from "../types";

interface BotResponseRendererProps {
  message: ChatMessageProps["message"];
  loading?: boolean;
  graphRef: React.RefObject<HTMLDivElement>;
  showTable: boolean;
  onShowTableChange: (show: boolean) => void;
  onDataCompatibility: (valid: boolean) => void;
  hasNumericData: boolean;
}

const BotResponseRenderer: React.FC<BotResponseRendererProps> = ({
  message,
  loading,
  graphRef,
  showTable,
  onShowTableChange,
  onDataCompatibility,
  hasNumericData,
}) => {
  const { theme } = useTheme();
  const [csvData, setCsvData] = useState<any[]>([]);

  useEffect(() => {
    try {
      const data = JSON.parse(message.content);
      if (data?.answer) {
        const tableData = Array.isArray(data.answer)
          ? data.answer
          : [data.answer];
        setCsvData(tableData);

        const hasNumbers = tableData.some((item) =>
          Object.values(item).some((val) => !isNaN(Number(val)))
        );
        onDataCompatibility(hasNumbers);
        onShowTableChange(!hasNumbers);
      }
    } catch {
      setCsvData([]);
      onDataCompatibility(false);
      onShowTableChange(true);
    }
  }, [message.content]);

  if (loading) {
    return (
      <div
        className="p-4 shadow-md flex items-center justify-center"
        style={{
          background: theme.colors.surface,
          borderRadius: theme.borderRadius.large,
          borderTopLeftRadius: "0",
          boxShadow: `0 2px 6px ${theme.colors.text}20`,
        }}
      >
        <MiniLoader />
        <span
          className="ml-2 text-sm"
          style={{ color: theme.colors.textSecondary }}
        >
          Thinking...
        </span>
      </div>
    );
  }

  return (
    <div
      className="p-4 shadow-md"
      style={{
        background: theme.colors.surface,
        borderRadius: theme.borderRadius.large,
        boxShadow: `0 2px 6px ${theme.colors.text}20`,
        width: "100%",
      }}
    >
      {showTable ? (
        <DataTable data={csvData} />
      ) : (
        <DynamicBarGraph
          data={csvData}
          onShowTable={onShowTableChange}
          onValidateData={onDataCompatibility}
        />
      )}
      <div
        className="mt-2 text-right text-xs"
        style={{ color: theme.colors.textSecondary }}
      >
        {new Date(message.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </div>
  );
};

export default React.memo(BotResponseRenderer);
