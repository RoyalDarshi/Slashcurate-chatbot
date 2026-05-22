// ChatMessage.tsx
import React, { useRef, useEffect, useState } from "react";
import {
  Bot,
  User,
  Table,
  LineChart,
  Edit3,
  Download,
  Database,
  Copy,
  Check,
  Heart,
  RefreshCw,
  ScanEye,
  AlertCircle,
} from "lucide-react";
import {
  BsHandThumbsDown,
  BsHandThumbsDownFill,
  BsHandThumbsUp,
  BsHandThumbsUpFill,
} from "react-icons/bs";
import { ChatMessageProps } from "../types";
import SmartDataTable from "./SmartDataTable";
import CustomTooltip from "./CustomTooltip";
import DynamicGraph, { formatKey } from "./ChatGraphs/ChatDynamicGraph";
import {
  getSmartChartConfig,
  toFiniteNumber,
  type SmartAggregation,
  type SmartChartType,
} from "../utils/smartChart";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import html2canvas from "html2canvas";
import EditableMessage from "./EditableMessage";
import { motion } from "framer-motion";
import { useTheme } from "../ThemeContext";
import MiniLoader from "./MiniLoader";
import QueryDisplay from "./ChatQueryDisplay";
import { toast } from "react-toastify";
import axios from "axios";
import { API_URL } from "../config";
import { useSettings } from "../SettingsContext";

/* ----------------------------------------------------------
   ⭐ TIMESTAMP FIX — ALWAYS PARSES MISSING TIMEZONE AS UTC
-----------------------------------------------------------*/
const parseTimestamp = (ts: string | number) => {
  if (!ts) return new Date();

  // If string AND missing timezone (no Z or ±HH:MM)
  if (typeof ts === "string" && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(ts)) {
    return new Date(ts + "Z"); // Treat as UTC
  }

  return new Date(ts);
};
/* ------------------------------------------------------- */

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onEditMessage,
  selectedConnection,
  onFavorite,
  onUnfavorite,
  isFavorited: initialIsFavorited,
  responseStatus,
  disabled,
  onRetry,
  isSubmitting,
}) => {
  const { theme } = useTheme();
  const [csvData, setCsvData] = useState<any[]>([]);
  const [hasNumericData, setHasNumericData] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<
    "table" | "graph" | "query" | "text" | "error"
  >("table");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [hasChanges, setHasChanges] = useState(false);
  const [showResolutionOptions, setShowResolutionOptions] = useState(false);
  const [isLiked, setIsLiked] = useState(message.reaction === "like");
  const [isDisliked, setIsDisliked] = useState(message.reaction === "dislike");
  const [dislikeReason, setDislikeReason] = useState(message.dislike_reason);
  const [showDislikeOptions, setShowDislikeOptions] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customReason, setCustomReason] = useState("");
  const [copied, setCopied] = useState(false);
  const [canCopy, setCanCopy] = useState(true);
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [copyTooltipTxt, setCopyTooltipTxt] = useState("Copy SQL Query");
  const [chartType, setChartType] = useState<SmartChartType>("bar");
  const [groupBy, setGroupBy] = useState<string | null>(null);
  const [aggregate, setAggregate] = useState<SmartAggregation | null>(null);
  const [valueKey, setValueKey] = useState<string | null>(null);
  const [showChartOptions, setShowChartOptions] = useState(false);
  const [isVertical, setIsVertical] = useState(true);
  const [showOrientationToggle, setShowOrientationToggle] = useState(false);

  const graphRef = useRef<HTMLDivElement>(null);
  const dislikeRef = useRef<HTMLDivElement>(null);
  const resolutionRef = useRef<HTMLDivElement>(null);
  const chartOptionsRef = useRef<HTMLDivElement>(null);
  const { chatFontSize } = useSettings();

  const parsedData = React.useMemo(() => {
    try {
      return JSON.parse(message.content);
    } catch {
      return message.isBot ? null : { content: message.content };
    }
  }, [message.content, message.isBot]);

  useEffect(() => {
    if (message.isBot) {
      if (message.status === "error") {
        setCurrentView("error");
        setCsvData([]);
        setHasNumericData(false);
      } else if (message.status === "normal") {
        try {
          const parsedData = JSON.parse(message.content);
          console.log(parsedData);
          let tableData = [];

          if (parsedData?.answer) {
            tableData = Array.isArray(parsedData.answer)
              ? parsedData.answer
              : [parsedData.answer];
          } else if (Object.keys(parsedData).length > 0) {
            tableData = [parsedData];
          }

          setCsvData(tableData);

          const hasGraphicalData =
            tableData.length > 0 &&
            tableData.some((row) =>
              Object.entries(row).some(([key, val]) => {
                const lowerKey = key.toLowerCase();
                const isExcludedKey =
                  lowerKey.includes("id") ||
                  lowerKey.includes("code") ||
                  lowerKey.includes("phone") ||
                  lowerKey.includes("postal") ||
                  lowerKey === "phone_number";

                const numericValue = toFiniteNumber(val);

                return (
                  !isExcludedKey &&
                  numericValue !== null &&
                  isFinite(numericValue)
                );
              }),
            );
          setHasNumericData(hasGraphicalData);

          if (hasGraphicalData && tableData.length > 0) {
            const smartDefaults = getSmartChartConfig(tableData);

            setValueKey(smartDefaults.valueKey);
            setGroupBy(smartDefaults.groupBy);
            setAggregate(smartDefaults.aggregation);
            setChartType(smartDefaults.chartType);
            setIsVertical(smartDefaults.orientation === "vertical");

            setCurrentView("table");
          } else if (tableData.length > 0) {
            setCurrentView("table");
          } else {
            setCurrentView("text");
          }
        } catch {
          setCsvData([]);
          setHasNumericData(false);
          setCurrentView("text");
        }
      }
      // If status is 'loading', do nothing here
    }
  }, [message.content, message.isBot, message.status]);

  useEffect(() => {
    const shouldShowToggle =
      ["bar", "line", "area"].includes(chartType) &&
      hasNumericData &&
      csvData.length > 0;
    setShowOrientationToggle(shouldShowToggle);
    if (!shouldShowToggle) {
      setIsVertical(true);
    }
  }, [chartType, hasNumericData, csvData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dislikeRef.current &&
        !dislikeRef.current.contains(event.target as Node)
      ) {
        setShowDislikeOptions(false);
        setShowCustomInput(false);
      }

      if (
        resolutionRef.current &&
        !resolutionRef.current.contains(event.target as Node)
      ) {
        setShowResolutionOptions(false);
      }

      if (
        chartOptionsRef.current &&
        !chartOptionsRef.current.contains(event.target as Node)
      ) {
        setShowChartOptions(false);
      }
    };

    if (showDislikeOptions || showResolutionOptions || showChartOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDislikeOptions, showResolutionOptions, showChartOptions]);

  const handleEdit = () => setIsEditing(true);

  const handleFavorite = async () => {
    try {
      if (isFavorited) {
        await onUnfavorite(message.id);
        setIsFavorited(false);
      } else {
        await onFavorite(message.id);
        setIsFavorited(true);
      }
    } catch (error) {
      toast.error("Failed to update favorite status");
    }
  };

  const handleLike = async () => {
    try {
      const newReaction = isLiked ? null : "like";
      await axios.post(
        `${API_URL}/api/messages/${message.id}/reaction`,
        {
          token: sessionStorage.getItem("token"),
          reaction: newReaction,
          dislike_reason: null,
        },
        { headers: { "Content-Type": "application/json" } },
      );
      setIsLiked(!isLiked);
      setIsDisliked(false);
      setDislikeReason(null);
      setShowDislikeOptions(false);
      setShowCustomInput(false);
    } catch (error) {
      console.error("Error setting like reaction:", error);
      toast.error("Failed to set like reaction.");
    }
  };

  const handleDislike = async () => {
    if (isDisliked) {
      try {
        await axios.post(
          `${API_URL}/api/messages/${message.id}/reaction`,
          {
            token: sessionStorage.getItem("token"),
            reaction: null,
            dislike_reason: null,
          },
          { headers: { "Content-Type": "application/json" } },
        );
        setIsDisliked(false);
        setDislikeReason(null);
        setShowDislikeOptions(false);
        setShowCustomInput(false);
      } catch (error) {
        console.error("Error removing dislike reaction:", error);
        toast.error("Failed to remove dislike reaction.");
      }
    } else {
      setShowDislikeOptions(true);
    }
  };

  const handleDislikeOption = async (reason: string) => {
    try {
      await axios.post(
        `${API_URL}/api/messages/${message.id}/reaction`,
        {
          token: sessionStorage.getItem("token"),
          reaction: "dislike",
          dislike_reason: reason,
        },
        { headers: { "Content-Type": "application/json" } },
      );

      setDislikeReason(reason);
      setIsDisliked(true);
      setShowDislikeOptions(false);
      setShowCustomInput(false);
      setIsLiked(false);
    } catch {
      toast.error("Failed to set dislike reaction.");
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setEditedContent(newContent);
    setHasChanges(newContent !== message.content);
  };

  const handleSave = async () => {
    setIsEditing(false);
    setIsFavorited(false);
    if (!selectedConnection || !editedContent.trim() || !hasChanges) return;
    try {
      await onEditMessage(message.id, editedContent);
      setHasChanges(false);
    } catch (error) {
      console.error("Error updating message:", error);
      toast.error("Failed to update message.");
    }
  };

  const handleCancel = () => {
    setEditedContent(message.content);
    setHasChanges(false);
    setIsEditing(false);
  };

  const handleDownloadCSV = () => {
    try {
      const data = JSON.parse(message.content);
      const tableData = Array.isArray(data.answer)
        ? data.answer
        : [data.answer];
      if (!tableData || tableData.length === 0) return;

      // 1. Get headers
      const headers = Object.keys(tableData[0]);

      // 2. Convert to CSV string
      const csvContent = [
        headers.join(","), // Header row
        ...tableData.map((row) =>
          headers
            .map((header) => {
              const cellValue = row[header];

              // Handle null or undefined
              const stringValue =
                cellValue === null || cellValue === undefined
                  ? ""
                  : String(cellValue);

              // Escape double quotes (") and wrap when necessary
              if (stringValue.search(/("|,|\n)/g) >= 0) {
                return `"${stringValue.replace(/"/g, '""')}"`;
              }
              return stringValue;
            })
            .join(","),
        ),
      ].join("\n");

      // 3. Create blob and trigger download
      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `table_export_${new Date().toISOString().split("T")[0]}.csv`,
      );

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading CSV:", error);
    }
  };

  const handleDownloadGraph = async (resolution: "low" | "high") => {
    if (graphRef.current) {
      try {
        const scale = resolution === "high" ? 2 : 1;
        const canvas = await html2canvas(graphRef.current, {
          scale,
          useCORS: true,
          logging: false,
        });
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = `graph_${resolution}.png`;
        link.click();
      } catch (error) {
        console.error("Error downloading graph:", error);
      }
    }
    setShowResolutionOptions(false);
  };

  const availableKeys = React.useMemo(() => {
    if (csvData.length === 0) return { stringKeys: [], numericKeys: [] };
    const smartDefaults = getSmartChartConfig(csvData);
    return {
      stringKeys: smartDefaults.groupByOptions,
      numericKeys: smartDefaults.valueKeyOptions,
    };
  }, [csvData]);

  const renderContent = () => {
    if (message.isBot && message.status === "loading") {
      return (
        <div className="flex items-center gap-3 py-2 w-full opacity-80">
          <div className="flex items-center gap-1">
            <span
              className="loading-dot"
              style={{ backgroundColor: theme.colors.accent }}
            />
            <span
              className="loading-dot"
              style={{ backgroundColor: theme.colors.accent }}
            />
            <span
              className="loading-dot"
              style={{ backgroundColor: theme.colors.accent }}
            />
          </div>
          <span
            className="font-medium text-xs"
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.typography.fontFamily,
            }}
          >
            Analyzing...
          </span>
        </div>
      );
    }

    if (currentView === "error" || message.status === "error") {
      return (
        <div
          className="flex flex-col gap-2 p-3 rounded-2xl"
          style={{
            backgroundColor:
              theme.mode === "dark"
                ? `${theme.colors.error}15`
                : `${theme.colors.error}10`,
            border: `1px solid ${theme.colors.error}30`,
          }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={16} style={{ color: theme.colors.error }} />
            <span
              className="text-sm font-semibold"
              style={{ color: theme.colors.error }}
            >
              Analysis Interrupted
            </span>
          </div>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ node, ...props }) => (
                <p
                  className="whitespace-pre-wrap break-words leading-relaxed"
                  style={{
                    color: theme.colors.error,
                    fontSize: chatFontSize,
                  }}
                  {...props}
                />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
          <div
            className="mt-2 mr-2 text-right text-xs"
            style={{ color: theme.colors.textSecondary }}
          >
            {parseTimestamp(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full">
        <div className="w-full">
          {currentView === "table" && csvData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex-1"
            >
              <SmartDataTable
                data={csvData}
                variant="chat"
                configOverrides={{
                  performance: { mode: "virtualized", estimatedRowHeight: 36 },
                }}
              />
            </motion.div>
          )}
          {currentView === "graph" && hasNumericData && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              ref={graphRef}
              style={{ width: "100%" }}
            >
              <div className="flex gap-2 mb-4 flex-wrap">
                <select
                  value={chartType}
                  onChange={(e) =>
                    setChartType(e.target.value as SmartChartType)
                  }
                  className="text-xs font-medium cursor-pointer transition-colors"
                  style={{
                    background: theme.colors.surfaceGlass,
                    color: theme.colors.text,
                    border: "none",
                    borderRadius: theme.borderRadius.pill,
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    boxShadow: `0 1px 3px ${theme.colors.border}`,
                  }}
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="scatter">Scatter Chart</option>
                  <option value="radar">Radar Chart</option>
                  <option value="funnel">Funnel Chart</option>
                  <option value="treemap">Treemap Chart</option>
                </select>
                <select
                  value={groupBy || ""}
                  onChange={(e) => setGroupBy(e.target.value || null)}
                  className="text-xs font-medium cursor-pointer transition-colors"
                  style={{
                    background: theme.colors.surfaceGlass,
                    color: theme.colors.text,
                    border: "none",
                    borderRadius: theme.borderRadius.pill,
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    boxShadow: `0 1px 3px ${theme.colors.border}`,
                  }}
                >
                  <option value="">Select Group By</option>
                  {availableKeys.stringKeys.map((key) => (
                    <option key={key} value={key}>
                      {formatKey(key)}
                    </option>
                  ))}
                </select>
                <select
                  value={aggregate || ""}
                  onChange={(e) =>
                    setAggregate(e.target.value as SmartAggregation)
                  }
                  className="text-xs font-medium cursor-pointer transition-colors"
                  style={{
                    background: theme.colors.surfaceGlass,
                    color: theme.colors.text,
                    border: "none",
                    borderRadius: theme.borderRadius.pill,
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    boxShadow: `0 1px 3px ${theme.colors.border}`,
                  }}
                >
                  <option value="">Select Aggregate</option>
                  <option value="sum">Sum</option>
                  <option value="count">Count</option>
                  <option value="avg">Average</option>
                  <option value="min">Minimum</option>
                  <option value="max">Maximum</option>
                </select>
                <select
                  value={valueKey || ""}
                  onChange={(e) => setValueKey(e.target.value || null)}
                  className="text-xs font-medium cursor-pointer transition-colors"
                  style={{
                    background: theme.colors.surfaceGlass,
                    color: theme.colors.text,
                    border: "none",
                    borderRadius: theme.borderRadius.pill,
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    boxShadow: `0 1px 3px ${theme.colors.border}`,
                  }}
                >
                  <option disabled value="">
                    Select Value Key
                  </option>
                  {availableKeys.numericKeys.map((key) => (
                    <option key={key} value={key}>
                      {formatKey(key)}
                    </option>
                  ))}
                </select>
                {showOrientationToggle && (
                  <select
                    value={isVertical ? "vertical" : "horizontal"}
                    onChange={(e) =>
                      setIsVertical(e.target.value === "vertical")
                    }
                    className="text-xs font-medium cursor-pointer transition-colors"
                    style={{
                      background: theme.colors.surfaceGlass,
                      color: theme.colors.text,
                      border: "none",
                      borderRadius: theme.borderRadius.pill,
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      boxShadow: `0 1px 3px ${theme.colors.border}`,
                    }}
                  >
                    <option value="vertical">Vertical</option>
                    <option value="horizontal">Horizontal</option>
                  </select>
                )}
              </div>
              <div className="w-full relative aspect-video min-h-[300px] max-h-[600px] mt-4">
                <DynamicGraph
                  data={csvData}
                  isValidGraph={setHasNumericData}
                  chartType={chartType}
                  groupBy={groupBy}
                  aggregate={aggregate}
                  valueKey={valueKey}
                  isVertical={isVertical}
                />
              </div>
              <div
                className="mr-2 mt-1 text-right text-[10px]"
                style={{ color: theme.colors.textSecondary }}
              >
                {parseTimestamp(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </motion.div>
          )}
          {currentView === "query" && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {parsedData?.sql_query ? (
                <QueryDisplay
                  query={parsedData.sql_query.toUpperCase()}
                  fontSize={chatFontSize}
                />
              ) : (
                <p
                  style={{
                    color: theme.colors.text,
                    fontSize: chatFontSize,
                  }}
                >
                  No query available.
                </p>
              )}
              <div
                className="mr-2 mt-1 text-right text-[10px]"
                style={{ color: theme.colors.textSecondary }}
              >
                {parseTimestamp(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-full justify-start mb-3">
      {message.isBot ? (
        <div
          className="flex w-full items-start gap-4 transition-all animate-fade-up"
          style={{
            position: "relative",
            maxWidth: "100%",
          }}
        >
          {/* Bot Avatar */}
          <div
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full"
            style={{
              background: `${theme.colors.accent}15`,
              border: `1px solid ${theme.colors.accent}30`,
            }}
          >
            <Bot size={18} style={{ color: theme.colors.accent }} />
          </div>

          <div
            className="w-full flex flex-col gap-2 overflow-visible"
            style={{ position: "relative" }}
          >
            <div className="w-full flex flex-col gap-3">
              {currentView === "error" &&
                !disabled &&
                !isSubmitting &&
                message.parentId && (
                  <div className="flex justify-end">
                    <CustomTooltip title="Retry" position="top">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onRetry?.(message.parentId!)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm border transition-colors text-sm font-medium"
                        style={{
                          background: theme.colors.surface,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      >
                        <RefreshCw
                          size={14}
                          style={{ color: theme.colors.accent }}
                        />
                        Retry Analysis
                      </motion.button>
                    </CustomTooltip>
                  </div>
                )}

              {currentView !== "error" &&
                message.status === "normal" &&
                parsedData?.content && (
                  <div
                    className="prose prose-lg dark:prose-invert max-w-3xl text-base leading-relaxed tracking-wide"
                    style={{ color: theme.colors.text }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {parsedData.content}
                    </ReactMarkdown>
                  </div>
                )}

              {/* Segmented Controls for Additional Views */}
              {currentView !== "error" &&
                message.status === "normal" &&
                (csvData.length > 0 || parsedData?.sql_query) && (
                  <div
                    className="flex items-center justify-between py-2 border-b mb-3 flex-shrink-0"
                    style={{ borderColor: `${theme.colors.border}40` }}
                  >
                    {/* Segmented Switcher Control */}
                    <div
                      className="flex p-0.5 rounded-lg border"
                      style={{
                        backgroundColor: theme.mode === 'light' ? '#f1f5f9' : '#0f172a',
                        borderColor: theme.colors.border,
                      }}
                    >
                      {hasNumericData && (
                        <button
                          onClick={() => setCurrentView("graph")}
                          className="px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150"
                          style={{
                            backgroundColor: currentView === "graph" ? theme.colors.surface : "transparent",
                            color: currentView === "graph" ? theme.colors.text : theme.colors.textSecondary,
                            boxShadow: currentView === "graph" ? theme.shadow.sm : "none",
                          }}
                        >
                          Chart
                        </button>
                      )}
                      {csvData.length > 0 && (
                        <button
                          onClick={() => setCurrentView("table")}
                          className="px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150"
                          style={{
                            backgroundColor: currentView === "table" ? theme.colors.surface : "transparent",
                            color: currentView === "table" ? theme.colors.text : theme.colors.textSecondary,
                            boxShadow: currentView === "table" ? theme.shadow.sm : "none",
                          }}
                        >
                          Table
                        </button>
                      )}
                      {parsedData?.sql_query && (
                        <button
                          onClick={() => setCurrentView("query")}
                          className="px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150"
                          style={{
                            backgroundColor: currentView === "query" ? theme.colors.surface : "transparent",
                            color: currentView === "query" ? theme.colors.text : theme.colors.textSecondary,
                            boxShadow: currentView === "query" ? theme.shadow.sm : "none",
                          }}
                        >
                          Query
                        </button>
                      )}
                    </div>

                    {/* Actions for active view */}
                    <div className="flex items-center gap-2">
                      {currentView === "graph" && hasNumericData && (
                        <div className="relative" ref={resolutionRef}>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              setShowResolutionOptions(!showResolutionOptions)
                            }
                            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                            title="Download Graph"
                          >
                            <Download
                              size={16}
                              style={{ color: theme.colors.textSecondary }}
                            />
                          </motion.button>
                          {showResolutionOptions && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute right-0 mt-2 rounded-xl shadow-lg z-10 w-40 overflow-hidden"
                              style={{
                                background: theme.colors.surfaceGlass,
                                backdropFilter: "blur(12px)",
                                border: `1px solid ${theme.colors.border}`,
                              }}
                            >
                              <button
                                onClick={() => handleDownloadGraph("low")}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                style={{ color: theme.colors.text }}
                              >
                                Low Resolution
                              </button>
                              <button
                                onClick={() => handleDownloadGraph("high")}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                style={{ color: theme.colors.text }}
                              >
                                High Resolution
                              </button>
                            </motion.div>
                          )}
                        </div>
                      )}
                      
                      {currentView === "table" && csvData.length > 0 && (
                        <CustomTooltip title="Export to CSV" position="top">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleDownloadCSV}
                            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                          >
                            <Download
                              size={16}
                              style={{ color: theme.colors.textSecondary }}
                            />
                          </motion.button>
                        </CustomTooltip>
                      )}

                      {currentView === "query" && parsedData?.sql_query && (
                        <CustomTooltip title={copyTooltipTxt} position="top">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              if (!canCopy) return;
                              setCanCopy(false);
                              navigator.clipboard
                                ?.writeText(parsedData.sql_query)
                                .then(() => {
                                  setCopied(true);
                                  setCopyTooltipTxt("Copied!");
                                  setTimeout(() => {
                                    setCopied(false);
                                    setCopyTooltipTxt("Copy SQL Query");
                                    setCanCopy(true);
                                  }, 2000);
                                });
                            }}
                            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                            disabled={!canCopy}
                          >
                            {copied ? (
                              <Check
                                size={16}
                                style={{ color: theme.colors.success }}
                              />
                            ) : (
                              <Copy
                                size={16}
                                style={{ color: theme.colors.textSecondary }}
                              />
                            )}
                          </motion.button>
                        </CustomTooltip>
                      )}
                    </div>
                  </div>
                )}
              {renderContent()}
            </div>
            {message.status === "normal" && !disabled && (
              <div className="flex justify-end items-center gap-2">
                <CustomTooltip
                  title={isLiked ? "Remove like" : "Like this response"}
                  position="bottom"
                >
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLike}
                    className="rounded-md transition-colors duration-200"
                  >
                    {isLiked ? (
                      <BsHandThumbsUpFill
                        size={20}
                        style={{ color: theme.colors.success }}
                      />
                    ) : (
                      <BsHandThumbsUp
                        size={20}
                        style={{ color: theme.colors.textSecondary }}
                      />
                    )}
                  </motion.button>
                </CustomTooltip>
                <div className="relative" ref={dislikeRef}>
                  <CustomTooltip
                    title={
                      isDisliked ? "Remove dislike" : "Dislike this response"
                    }
                    position="bottom"
                  >
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDislike}
                      className="pt-2 pr-2 rounded-md transition-colors duration-200"
                    >
                      {isDisliked ? (
                        <BsHandThumbsDownFill
                          size={20}
                          style={{ color: theme.colors.error }}
                        />
                      ) : (
                        <BsHandThumbsDown
                          size={20}
                          style={{ color: theme.colors.textSecondary }}
                        />
                      )}
                    </motion.button>
                  </CustomTooltip>
                  {showDislikeOptions && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-full right-0 mb-2 rounded-md shadow-lg z-10 min-w-[180px]"
                      style={{
                        background: theme.colors.surface,
                        border: `1px solid ${theme.colors.border}`,
                        boxShadow: `0 4px 12px ${theme.colors.text}20`,
                      }}
                    >
                      {showCustomInput ? (
                        <div className="px-3 py-2">
                          <textarea
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                            placeholder="Enter your reason"
                            rows={3}
                            autoFocus={true}
                            className="w-full p-2 rounded resize-none focus:outline-none focus:ring-2 focus:ring-accent"
                            style={{
                              background: theme.colors.surface,
                              color: theme.colors.text,
                              border: `1px solid ${theme.colors.border}`,
                            }}
                          />
                          <div className="flex justify-end mt-2 gap-2">
                            <button
                              onClick={() => {
                                setShowCustomInput(false);
                                setCustomReason("");
                              }}
                              className="px-2 py-1 rounded hover:opacity-80 transition-opacity"
                              style={{
                                background: theme.colors.surface,
                                color: theme.colors.text,
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                if (customReason.trim()) {
                                  handleDislikeOption(customReason);
                                  setCustomReason("");
                                }
                              }}
                              className="px-2 py-1 rounded hover:opacity-80 transition-opacity"
                              style={{
                                background: theme.colors.accent,
                                color: "white",
                              }}
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {[
                            "Incorrect data",
                            "Takes too long",
                            "Irrelevant response",
                            "Confusing answer",
                            "Other",
                          ].map((reason) => (
                            <button
                              key={reason}
                              onClick={() => {
                                if (reason === "Other") {
                                  setShowCustomInput(true);
                                } else {
                                  handleDislikeOption(reason);
                                }
                              }}
                              className="w-full text-left px-3 py-2 text-sm transition-all duration-200"
                              style={{
                                color: theme.colors.text,
                                backgroundColor: "transparent",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = `${theme.colors.accent}20`)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "transparent")
                              }
                            >
                              {reason}
                            </button>
                          ))}
                        </>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex w-full justify-end mb-2">
          {!isEditing ? (
            <div
              className="relative group max-w-[85%] md:max-w-[75%] px-6 py-4 rounded-[2rem] transition-all animate-fade-up shadow-sm"
              style={{
                backgroundColor: theme.colors.surfaceGlass,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              {!disabled && (
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                  <CustomTooltip
                    title={
                      responseStatus === "loading" || responseStatus === "error"
                        ? "Cannot favorite while response is loading or failed"
                        : isFavorited
                          ? "Remove from favorites"
                          : "Add to favorites"
                    }
                    position="left"
                  >
                    <motion.button
                      whileHover={{
                        scale:
                          responseStatus === "loading" ||
                          responseStatus === "error"
                            ? 1
                            : 1.1,
                      }}
                      whileTap={{
                        scale:
                          responseStatus === "loading" ||
                          responseStatus === "error"
                            ? 1
                            : 0.95,
                      }}
                      onClick={handleFavorite}
                      className="p-1.5 rounded-full transition-colors bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                      style={{
                        color: isFavorited
                          ? "#FF4D4D"
                          : theme.colors.textSecondary,
                        cursor:
                          responseStatus === "loading" ||
                          responseStatus === "error"
                            ? "not-allowed"
                            : "pointer",
                      }}
                      disabled={
                        responseStatus === "loading" ||
                        responseStatus === "error"
                      }
                    >
                      <Heart
                        size={16}
                        fill={isFavorited ? "currentColor" : "none"}
                        strokeWidth={isFavorited ? 1.5 : 2}
                      />
                    </motion.button>
                  </CustomTooltip>

                  {!isSubmitting && (
                    <CustomTooltip title="Edit message" position="left">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleEdit}
                        className="p-1.5 rounded-full transition-colors bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        <Edit3 size={16} />
                      </motion.button>
                    </CustomTooltip>
                  )}
                </div>
              )}

              <p
                className="whitespace-pre-wrap break-words leading-relaxed"
                style={{
                  color: theme.colors.text,
                  fontSize: chatFontSize,
                }}
              >
                {message.content}
              </p>
            </div>
          ) : (
            <div className="w-full max-w-3xl">
              <EditableMessage
                messageContent={editedContent}
                onSave={handleSave}
                onCancel={handleCancel}
                onContentChange={handleContentChange}
                fontSize={chatFontSize}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const areEqual = (prevProps: ChatMessageProps, nextProps: ChatMessageProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.isFavorited === nextProps.message.isFavorited &&
    prevProps.selectedConnection === nextProps.selectedConnection &&
    prevProps.isFavorited === nextProps.isFavorited &&
    prevProps.responseStatus === nextProps.responseStatus &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.onRetry === nextProps.onRetry &&
    prevProps.isSubmitting === nextProps.isSubmitting
  );
};

export default React.memo(ChatMessage, areEqual);
