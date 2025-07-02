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
} from "lucide-react";
import {
  BsHandThumbsDown,
  BsHandThumbsDownFill,
  BsHandThumbsUp,
  BsHandThumbsUpFill,
} from "react-icons/bs";
import { ChatMessageProps } from "../types";
import DataTable from "./ChatDataTable";
import CustomTooltip from "./CustomTooltip";
import DynamicGraph, { formatKey } from "./ChatGraphs/ChatDynamicGraph";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import EditableMessage from "./EditableMessage";
import { motion } from "framer-motion";
import { useTheme } from "../ThemeContext";
import MiniLoader from "./MiniLoader";
import QueryDisplay from "./ChatQueryDisplay";
import { toast } from "react-toastify";
import axios from "axios";
import { API_URL } from "../config";
import { useSettings } from "../SettingsContext";

const ChatMessage: React.FC<ChatMessageProps> = React.memo(
  ({
    message,
    onEditMessage,
    selectedConnection,
    onFavorite,
    onUnfavorite,
    isFavorited: initialIsFavorited,
    responseStatus,
    disabled,
    onRetry,
    onSummarizeGraph,
    isSubmitting,
  }) => {
    const { theme } = useTheme();
    const [csvData, setCsvData] = useState<any[]>([]);
    const [hasNumericData, setHasNumericData] = useState<boolean>(false);
    const [currentView, setCurrentView] = useState<
      "table" | "graph" | "query" | "text" | "error"
    >("text");
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);
    const [hasChanges, setHasChanges] = useState(false);
    const [showResolutionOptions, setShowResolutionOptions] = useState(false);
    const [isLiked, setIsLiked] = useState(message.reaction === "like");
    const [isDisliked, setIsDisliked] = useState(
      message.reaction === "dislike"
    );
    const [dislikeReason, setDislikeReason] = useState(message.dislike_reason);
    const [showDislikeOptions, setShowDislikeOptions] = useState(false);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customReason, setCustomReason] = useState("");
    const [copied, setCopied] = useState(false);
    const [canCopy, setCanCopy] = useState(true);
    const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
    const [copyTooltipTxt, setCopyTooltipTxt] = useState("Copy SQL Query");
    const [chartType, setChartType] = useState<"bar" | "line" | "pie">("bar");
    const [groupBy, setGroupBy] = useState<string | null>(null);
    const [aggregate, setAggregate] = useState<
      "sum" | "count" | "avg" | "min" | "max" | null
    >(null);
    const [valueKey, setValueKey] = useState<string | null>(null);
    const [showChartOptions, setShowChartOptions] = useState(false);

    const graphRef = useRef<HTMLDivElement>(null);
    const dislikeRef = useRef<HTMLDivElement>(null);
    const resolutionRef = useRef<HTMLDivElement>(null);
    const chartOptionsRef = useRef<HTMLDivElement>(null);
    const mode = theme.colors.background === "#0F172A" ? "dark" : "light";
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
        if (message.content.includes("Sorry, an error occurred.")) {
          setCurrentView("error");
          setCsvData([]);
          setHasNumericData(false);
        } else {
          try {
            const parsedData = JSON.parse(message.content);
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

                  const numericValue = (() => {
                    if (typeof val === "number") return val;
                    if (typeof val === "string") {
                      const cleaned = val.replace(/,/g, "").trim();
                      return /^\d+(\.\d+)?$/.test(cleaned)
                        ? parseFloat(cleaned)
                        : NaN;
                    }
                    return NaN;
                  })();

                  return (
                    !isExcludedKey &&
                    !isNaN(numericValue) &&
                    isFinite(numericValue)
                  );
                })
              );
            setHasNumericData(hasGraphicalData);

            // Set default visualization parameters
            if (hasGraphicalData && tableData.length > 0) {
              const sample = tableData[0];
              const keys = Object.keys(sample);
              const numericKeys = keys.filter(
                (k) =>
                  typeof sample[k] === "number" ||
                  (typeof sample[k] === "string" &&
                    /^\d+(\.\d+)?$/.test(sample[k].replace(/,/g, "").trim()))
              );
              const stringKeys = keys.filter(
                (k) => typeof sample[k] === "string" && !numericKeys.includes(k)
              );

              setValueKey(numericKeys[0] || null);
              setGroupBy(stringKeys[1] || stringKeys[0] || null);
              setAggregate("sum");
              setCurrentView("graph");
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
      }
    }, [message]);

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
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
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
          { headers: { "Content-Type": "application/json" } }
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
            { headers: { "Content-Type": "application/json" } }
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
          { headers: { "Content-Type": "application/json" } }
        );
        setDislikeReason(reason);
        setIsDisliked(true);
        setShowDislikeOptions(false);
        setShowCustomInput(false);
        setIsLiked(false);
      } catch (error) {
        console.error("Error setting dislike reaction:", error);
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

    const handleDownloadTableXLSX = () => {
      try {
        const data = JSON.parse(message.content);
        const tableData = Array.isArray(data.answer)
          ? data.answer
          : [data.answer];
        const worksheet = XLSX.utils.json_to_sheet(tableData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
        XLSX.writeFile(workbook, "table_data.xlsx");
      } catch (error) {
        console.error("Error downloading XLSX:", error);
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
      const sample = csvData[0];
      const keys = Object.keys(sample);
      return {
        stringKeys: keys.filter((k) => typeof sample[k] === "string"),
        numericKeys: keys.filter((k) => {
          const val = sample[k];
          return val !== null && val !== "" && !isNaN(Number(val));
        }),
      };
    }, [csvData]);

    const renderContent = () => {
      if (message.isBot && message.content === "loading...") {
        return (
          <div
            className="p-4 shadow-md flex items-center justify-center"
            style={{
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.large,
              borderTopLeftRadius: "0",
            }}
          >
            <MiniLoader />
            <span
              className="ml-2"
              style={{
                color: theme.colors.textSecondary,
                fontSize: chatFontSize,
              }}
            >
              Thinking...
            </span>
          </div>
        );
      }

      if (currentView === "error") {
        return (
          <div
            className="p-4 shadow-md border-l-4 border-red-500"
            style={{
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.large,
              borderTopLeftRadius: 0,
            }}
          >
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
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        );
      }

      return (
        <div className="relative">
          <div
            className="p-2 shadow-md"
            style={{
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.large,
              borderTopLeftRadius: message.isBot ? "0" : undefined,
              width: "100%",
            }}
          >
            {currentView === "text" && (
              <>
                <p
                  style={{
                    color: theme.colors.text,
                    fontSize: chatFontSize,
                  }}
                >
                  {parsedData?.content || "No records found."}
                </p>
                <div
                  className="mt-2 mr-2 text-right text-xs"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </>
            )}
            {currentView === "table" && csvData.length > 0 && (
              <>
                <DataTable data={csvData} />
                <div
                  className="mt-2 mr-2 text-right text-xs"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </>
            )}
            {currentView === "graph" && hasNumericData && (
              <div ref={graphRef} style={{ width: "100%" }}>
                <div className="flex gap-2 mb-2">
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as any)}
                    style={{
                      background: theme.colors.surface,
                      color: theme.colors.text,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.default,
                      padding: theme.spacing.sm,
                    }}
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="pie">Pie Chart</option>
                  </select>
                  <select
                    value={groupBy || ""}
                    onChange={(e) => setGroupBy(e.target.value || null)}
                    style={{
                      background: theme.colors.surface,
                      color: theme.colors.text,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.default,
                      padding: theme.spacing.sm,
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
                    onChange={(e) => setAggregate(e.target.value as any)}
                    style={{
                      background: theme.colors.surface,
                      color: theme.colors.text,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.default,
                      padding: theme.spacing.sm,
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
                    style={{
                      background: theme.colors.surface,
                      color: theme.colors.text,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.default,
                      padding: theme.spacing.sm,
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
                </div>
                <DynamicGraph
                  data={csvData}
                  isValidGraph={setHasNumericData}
                  chartType={chartType}
                  groupBy={groupBy}
                  aggregate={aggregate}
                  valueKey={valueKey}
                />
                <div
                  className="mt-2 mr-2 text-right text-xs"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            )}
            {currentView === "query" && (
              <>
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
                  className="mt-2 mr-2 text-right text-xs"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="flex w-full" style={{ marginBottom: theme.spacing.md }}>
        {message.isBot ? (
          <div
            className={`flex w-full items-start ${
              currentView === "graph" ? "max-w-[90%]" : "w-max"
            } gap-2`}
            style={{ position: "relative" }}
          >
            <div
              className="flex p-2.5 items-center justify-center rounded-full shadow-md"
              style={{ background: theme.colors.accent }}
            >
              <Bot size={20} style={{ color: "white" }} />
            </div>
            <div
              className="w-full flex flex-col gap-2"
              style={{ position: "relative" }}
            >
              <div className="relative">
                <div
                  className="absolute -right-12 top-0 flex flex-col items-center"
                  style={{ gap: theme.spacing.sm }}
                >
                  {currentView === "error" && !disabled && message.parentId && (
                    <CustomTooltip title="Retry" position="top">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onRetry?.(message.parentId!)}
                        className="rounded-full absolute right-4 top-1 shadow-sm transition-colors duration-200 hover:opacity-85"
                      >
                        <RefreshCw
                          size={20}
                          style={{ color: theme.colors.accent }}
                        />
                      </motion.button>
                    </CustomTooltip>
                  )}
                  {currentView !== "error" &&
                    message.content !== "loading..." && (
                      <>
                        {currentView === "query" && csvData.length === 0 && (
                          <CustomTooltip
                            title="Switch to Text View"
                            position="top"
                          >
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setCurrentView("text")}
                              className="rounded-full p-2 shadow-sm transition-colors duration-200 hover:opacity-85"
                              style={{ background: theme.colors.surface }}
                            >
                              <Table
                                size={20}
                                style={{ color: theme.colors.accent }}
                              />
                            </motion.button>
                          </CustomTooltip>
                        )}
                        {csvData.length > 0 && currentView !== "table" && (
                          <CustomTooltip
                            title="Switch to Table View"
                            position="top"
                          >
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setCurrentView("table")}
                              className="rounded-full p-2 shadow-sm transition-colors duration-200 hover:opacity-85"
                              style={{ background: theme.colors.surface }}
                            >
                              <Table
                                size={20}
                                style={{ color: theme.colors.accent }}
                              />
                            </motion.button>
                          </CustomTooltip>
                        )}
                        {currentView !== "graph" && (
                          <CustomTooltip
                            title={
                              !hasNumericData
                                ? "No valid data for graph"
                                : "Switch to Graph View"
                            }
                            position="top"
                          >
                            <motion.button
                              whileHover={{ scale: hasNumericData ? 1.1 : 1 }}
                              whileTap={{ scale: hasNumericData ? 0.95 : 1 }}
                              disabled={!hasNumericData}
                              onClick={() => setCurrentView("graph")}
                              className="rounded-full disabled:cursor-not-allowed p-2 shadow-sm transition-colors duration-200 hover:opacity-85"
                              style={{
                                background: hasNumericData
                                  ? theme.colors.surface
                                  : theme.colors.disabled,
                              }}
                            >
                              <LineChart
                                size={20}
                                style={{
                                  color: hasNumericData
                                    ? theme.colors.accent
                                    : theme.colors.disabledText,
                                }}
                              />
                            </motion.button>
                          </CustomTooltip>
                        )}
                        {parsedData?.sql_query && currentView !== "query" && (
                          <CustomTooltip
                            title="Switch to Query View"
                            position="top"
                          >
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setCurrentView("query")}
                              className="rounded-full p-2 shadow-sm transition-colors duration-200 hover:opacity-85"
                              style={{ background: theme.colors.surface }}
                            >
                              <Database
                                size={20}
                                style={{ color: theme.colors.accent }}
                              />
                            </motion.button>
                          </CustomTooltip>
                        )}
                        {currentView === "table" && csvData.length > 0 && (
                          <CustomTooltip title="Download XLSX" position="top">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleDownloadTableXLSX}
                              className="rounded-full p-2 shadow-sm transition-colors duration-200 hover:opacity-85"
                              style={{ background: theme.colors.surface }}
                            >
                              <Download
                                size={20}
                                style={{ color: theme.colors.accent }}
                              />
                            </motion.button>
                          </CustomTooltip>
                        )}
                        {currentView === "graph" && hasNumericData && (
                          <div className="relative" ref={resolutionRef}>
                            <CustomTooltip
                              title="Download Graph"
                              position="bottom"
                            >
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() =>
                                  setShowResolutionOptions(
                                    !showResolutionOptions
                                  )
                                }
                                className="rounded-full p-2 shadow-sm transition-colors duration-200 hover:opacity-85"
                                style={{ background: theme.colors.surface }}
                              >
                                <Download
                                  size={20}
                                  style={{ color: theme.colors.accent }}
                                />
                              </motion.button>
                            </CustomTooltip>
                            {showResolutionOptions && (
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
                                <button
                                  onClick={() => handleDownloadGraph("low")}
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
                                  Low Resolution
                                </button>
                                <button
                                  onClick={() => handleDownloadGraph("high")}
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
                                  High Resolution
                                </button>
                              </motion.div>
                            )}
                          </div>
                        )}
                        {currentView === "graph" &&
                          hasNumericData &&
                          onSummarizeGraph && (
                            <CustomTooltip
                              title="Summarize Graph"
                              position="top"
                            >
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() =>
                                  onSummarizeGraph(
                                    graphRef.current!,
                                    message.id
                                  )
                                }
                                disabled={isSubmitting}
                                className="rounded-full p-2 shadow-sm transition-colors duration-200 hover:opacity-85 disabled:opacity-50"
                                style={{ background: theme.colors.surface }}
                              >
                                <ScanEye
                                  size={20}
                                  style={{ color: theme.colors.accent }}
                                />
                              </motion.button>
                            </CustomTooltip>
                          )}
                        {currentView === "query" && parsedData?.sql_query && (
                          <CustomTooltip title={copyTooltipTxt} position="top">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                if (!canCopy) return;
                                setCanCopy(false);
                                if (navigator?.clipboard?.writeText) {
                                  navigator.clipboard
                                    .writeText(parsedData.sql_query)
                                    .then(() => {
                                      setCopied(true);
                                      setCopyTooltipTxt("Copied!");
                                    })
                                    .catch((error) => {
                                      console.error("Copy failed:", error);
                                      toast.error("Failed to copy. Try again.");
                                    })
                                    .finally(() => {
                                      setTimeout(() => {
                                        setCopied(false);
                                        setCopyTooltipTxt("Copy SQL Query");
                                        setCanCopy(true);
                                      }, 2000);
                                    });
                                } else {
                                  const textarea =
                                    document.createElement("textarea");
                                  textarea.value = parsedData.sql_query;
                                  document.body.appendChild(textarea);
                                  textarea.select();
                                  try {
                                    const success =
                                      document.execCommand("copy");
                                    if (success) {
                                      setCopied(true);
                                      setCopyTooltipTxt("Copied!");
                                    } else {
                                      toast.error("Copying failed. Try again.");
                                    }
                                  } catch (error) {
                                    console.error("Legacy copy failed:", error);
                                    toast.error(
                                      "Copying not supported in this browser."
                                    );
                                  } finally {
                                    document.body.removeChild(textarea);
                                    setTimeout(() => {
                                      setCopied(false);
                                      setCopyTooltipTxt("Copy SQL Query");
                                      setCanCopy(true);
                                    }, 2000);
                                  }
                                }
                              }}
                              className="rounded-full p-2 shadow-sm transition-colors duration-200 hover:opacity-85"
                              style={{ background: theme.colors.surface }}
                              disabled={!canCopy}
                            >
                              {copied ? (
                                <Check
                                  size={20}
                                  style={{ color: theme.colors.accent }}
                                />
                              ) : (
                                <Copy
                                  size={20}
                                  style={{ color: theme.colors.accent }}
                                />
                              )}
                            </motion.button>
                          </CustomTooltip>
                        )}
                      </>
                    )}
                </div>
                {renderContent()}
              </div>
              {message.content !== "loading..." && !disabled && (
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
          <div
            className="ml-auto flex w-full items-start justify-end"
            style={{ gap: theme.spacing.md }}
          >
            {!isEditing ? (
              <div
                className="max-w-[80%] p-4 shadow-md relative"
                style={{
                  background: theme.colors.accent,
                  borderRadius: theme.borderRadius.large,
                  borderTopRightRadius: "0",
                  boxShadow: `0 2px 6px ${theme.colors.text}20`,
                }}
              >
                {!disabled && (
                  <div className="absolute top-2 left-1 flex items-center gap-1">
                    <CustomTooltip
                      title={
                        responseStatus === "loading" ||
                        responseStatus === "error"
                          ? "Cannot favorite while response is loading or failed"
                          : isFavorited
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                      position="top"
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
                        className="p-1 rounded-full transition-colors"
                        style={{
                          color: isFavorited
                            ? "#FF4D4D"
                            : "rgba(255,255,255,0.8)",
                          cursor:
                            responseStatus === "loading" ||
                            responseStatus === "error"
                              ? "not-allowed"
                              : "pointer",
                          opacity:
                            responseStatus === "loading" ||
                            responseStatus === "error"
                              ? 0.5
                              : 1,
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
                  </div>
                )}
                <p
                  className="ml-3 whitespace-pre-wrap break-words"
                  style={{ color: "white", fontSize: chatFontSize }}
                >
                  {message.content}
                </p>
                <div
                  className="mt-2 border-t pt-2 flex items-center justify-between"
                  style={{ borderColor: `${theme.colors.surface}20` }}
                >
                  <span className="text-xs" style={{ color: `${"#ffffff"}99` }}>
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    {!disabled && (
                      <CustomTooltip title="Edit message" position="bottom">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleEdit}
                          className="rounded-full p-2 transition-colors duration-200 hover:opacity-80"
                          style={{ color: "white" }}
                        >
                          <Edit3 size={16} />
                        </motion.button>
                      </CustomTooltip>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <EditableMessage
                messageContent={editedContent}
                onSave={handleSave}
                onCancel={handleCancel}
                onContentChange={handleContentChange}
                fontSize={chatFontSize}
              />
            )}
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full shadow-md"
              style={{ background: theme.colors.accent }}
            >
              <User size={20} style={{ color: "white" }} />
            </div>
          </div>
        )}
      </div>
    );
  }
);

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
    prevProps.onSummarizeGraph === nextProps.onSummarizeGraph &&
    prevProps.isSubmitting === nextProps.isSubmitting
  );
};

export default React.memo(ChatMessage, areEqual);