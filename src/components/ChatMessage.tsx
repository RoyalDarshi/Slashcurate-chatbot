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
  FileWarning,
  MessageSquareWarning,
  Clock,
  Target,
  MoreHorizontal,
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
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../ThemeContext";
import MiniLoader from "./MiniLoader";
import QueryDisplay from "./ChatQueryDisplay";
import SummaryModal from "./SummaryModal";
import { toast } from "react-toastify";
import axios from "axios";
import { API_URL } from "../config";
import { useSettings } from "../SettingsContext";

const parseTimestamp = (ts: string | number) => {
  if (!ts) return new Date();
  if (typeof ts === "string" && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(ts)) {
    return new Date(ts + "Z");
  }
  return new Date(ts);
};

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
  const [isVertical, setIsVertical] = useState(true);
  const [showOrientationToggle, setShowOrientationToggle] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const graphRef = useRef<HTMLDivElement>(null);
  const dislikeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLiked(message.reaction === "like");
    setIsDisliked(message.reaction === "dislike");
    setDislikeReason(message.dislike_reason);
    setIsFavorited(initialIsFavorited);
  }, [message.reaction, message.dislike_reason, initialIsFavorited]);
  const resolutionRef = useRef<HTMLDivElement>(null);
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
    }
  }, [message.content, message.isBot, message.status]);

  useEffect(() => {
    const shouldShowToggle =
      ["bar", "line", "area"].includes(chartType) &&
      hasNumericData &&
      csvData.length > 0;
    setShowOrientationToggle(shouldShowToggle);
    if (!shouldShowToggle) setIsVertical(true);
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
    };
    if (showDislikeOptions || showResolutionOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDislikeOptions, showResolutionOptions]);

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
    if (!selectedConnection || !editedContent.trim()) return;
    try {
      await onEditMessage(message.id, editedContent);
      setHasChanges(false);
    } catch (error) {
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

      const headers = Object.keys(tableData[0]);
      const csvContent = [
        headers.join(","),
        ...tableData.map((row) =>
          headers
            .map((header) => {
              const cellValue = row[header];
              const stringValue =
                cellValue === null || cellValue === undefined
                  ? ""
                  : String(cellValue);
              if (stringValue.search(/("|,|\n)/g) >= 0) {
                return `"${stringValue.replace(/"/g, '""')}"`;
              }
              return stringValue;
            })
            .join(","),
        ),
      ].join("\n");

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
        <div className="flex items-center gap-2 py-2 opacity-80">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full animate-bounce bg-indigo-600 [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full animate-bounce bg-indigo-600 [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full animate-bounce bg-indigo-600" />
          </div>
          <span
            className="text-xs font-semibold tracking-wide uppercase"
            style={{ color: theme.colors.textSecondary }}
          >
            Processing Framework...
          </span>
        </div>
      );
    }

    if (currentView === "error" || message.status === "error") {
      return (
        <div
          className="flex flex-col gap-2 p-4 rounded-xl border border-red-500/20"
          style={{
            backgroundColor:
              theme.mode === "light" ? "#FEF2F2" : "rgba(239, 68, 68, 0.05)",
          }}
        >
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle size={15} />
            <span className="text-xs font-bold uppercase tracking-wider">
              Analysis Interrupted
            </span>
          </div>
          <div
            className="text-sm leading-relaxed font-medium"
            style={{ color: theme.colors.error, fontSize: chatFontSize }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full">
        {currentView === "table" && csvData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <SmartDataTable data={csvData} variant="chat" />
          </motion.div>
        )}

        {currentView === "graph" && hasNumericData && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            ref={graphRef}
            className="w-full flex flex-col"
          >
            <div className="flex gap-2 mb-3 flex-wrap items-center">
              {[
                {
                  value: chartType,
                  onChange: (e: any) => setChartType(e.target.value),
                  options: [
                    { v: "bar", l: "Bar View" },
                    { v: "line", l: "Line Plot" },
                    { v: "pie", l: "Pie Segment" },
                    { v: "area", l: "Area Canvas" },
                    { v: "scatter", l: "Scatter Layout" },
                    { v: "radar", l: "Radar Matrix" },
                    { v: "funnel", l: "Funnel Graph" },
                    { v: "treemap", l: "Treemap Hierarchy" },
                  ],
                },
                {
                  value: groupBy || "",
                  onChange: (e: any) => setGroupBy(e.target.value || null),
                  options: [
                    { v: "", l: "Dimension Mapping" },
                    ...availableKeys.stringKeys.map((k) => ({
                      v: k,
                      l: formatKey(k),
                    })),
                  ],
                },
                {
                  value: aggregate || "",
                  onChange: (e: any) => setAggregate(e.target.value),
                  options: [
                    { v: "", l: "Metric Evaluation" },
                    { v: "sum", l: "Sum" },
                    { v: "count", l: "Count" },
                    { v: "avg", l: "Average" },
                    { v: "min", l: "Minimum" },
                    { v: "max", l: "Maximum" },
                  ],
                },
                {
                  value: valueKey || "",
                  onChange: (e: any) => setValueKey(e.target.value || null),
                  options: [
                    { v: "", l: "Value Matrix", d: true },
                    ...availableKeys.numericKeys.map((k) => ({
                      v: k,
                      l: formatKey(k),
                    })),
                  ],
                },
              ].map((select, idx) => (
                <select
                  key={idx}
                  value={select.value}
                  onChange={select.onChange}
                  className="text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none font-semibold cursor-pointer shadow-xs"
                  style={{
                    color: theme.colors.text,
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  }}
                >
                  {select.options.map((o: any) => (
                    <option
                      key={o.v}
                      value={o.v}
                      disabled={o.d}
                      style={{
                        color: theme.colors.text,
                        background: theme.colors.surface,
                      }}
                    >
                      {o.l}
                    </option>
                  ))}
                </select>
              ))}

              {showOrientationToggle && (
                <select
                  value={isVertical ? "vertical" : "horizontal"}
                  onChange={(e) => setIsVertical(e.target.value === "vertical")}
                  className="text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none font-semibold cursor-pointer shadow-xs"
                  style={{
                    color: theme.colors.text,
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  }}
                >
                  <option value="vertical">Vertical</option>
                  <option value="horizontal">Horizontal</option>
                </select>
              )}
            </div>

            <div className="w-full relative min-h-[250px] max-h-[400px]">
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
          </motion.div>
        )}

        {currentView === "query" && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            {parsedData?.sql_query ? (
              <QueryDisplay
                query={parsedData.sql_query.toUpperCase()}
                fontSize={chatFontSize}
              />
            ) : (
              <p
                className="text-sm font-medium opacity-60 animate-pulse"
                style={{ color: theme.colors.text }}
              >
                No transaction query log generated.
              </p>
            )}
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col mb-1">
      {message.isBot ? (
        /* Minimalist Bot Stream Message */
        <div
          className="flex w-full items-start gap-4 py-2 transition-all duration-300 group"
          style={{
            backgroundColor: "transparent",
          }}
        >
          <div
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border"
            style={{
              background: `${theme.colors.accent}12`,
              borderColor: `${theme.colors.accent}25`,
            }}
          >
            <Bot size={16} style={{ color: theme.colors.accent }} />
          </div>

          <div className="flex-1 flex flex-col gap-3 min-w-0">
            {currentView === "error" &&
              !disabled &&
              !isSubmitting &&
              message.parentId && (
                <div className="flex justify-end">
                  <button
                    onClick={() => onRetry?.(message.parentId!)}
                    className="group flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
                    style={{
                      background: theme.mode === 'light' ? '#FFFFFF' : theme.colors.surface,
                      borderColor: theme.mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : theme.colors.border,
                      color: theme.colors.text,
                    }}
                  >
                    <RefreshCw
                      size={13}
                      className="transition-transform duration-700 group-hover:rotate-180"
                      style={{ color: theme.colors.accent }}
                    />
                    <span>Re-evaluate Request</span>
                  </button>
                </div>
              )}

            {currentView !== "error" &&
              message.status === "normal" &&
              parsedData?.content && (
                <div
                  className="text-[15px] leading-relaxed font-normal tracking-wide markdown-content"
                  style={{
                    color:
                      theme.mode === "light" ? "#1E293B" : theme.colors.text,
                  }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {parsedData.content}
                  </ReactMarkdown>
                </div>
              )}

            {currentView !== "error" &&
              message.status === "normal" &&
              (csvData.length > 0 || parsedData?.sql_query) && (
                <div
                  className="flex items-center justify-between py-1 mb-1"
                >
                  {/* Modern Subtle Tab Shell */}
                  <div
                    className="flex p-0.5 rounded-xl font-medium"
                    style={{
                      backgroundColor:
                        theme.mode === "light" ? "rgba(15, 23, 42, 0.04)" : "rgba(255, 255, 255, 0.04)",
                    }}
                  >
                    {hasNumericData && (
                      <button
                        onClick={() => setCurrentView("graph")}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150"
                        style={{
                          backgroundColor:
                            currentView === "graph"
                              ? theme.colors.surface
                              : "transparent",
                          color:
                            currentView === "graph"
                              ? theme.colors.text
                              : theme.colors.textSecondary,
                          boxShadow:
                            currentView === "graph" && theme.mode === "light"
                              ? "0 2px 5px rgba(0,0,0,0.05)"
                              : "none",
                        }}
                      >
                        Chart
                      </button>
                    )}
                    {hasNumericData && parsedData?.content && currentView === 'graph' && (
                      <button
                        onClick={() => setShowSummaryModal(true)}
                        className="ml-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center gap-1.5"
                        style={{
                          backgroundColor: `${theme.colors.accent}15`,
                          color: theme.colors.accent,
                        }}
                      >
                        Explain Chart
                      </button>
                    )}
                    {csvData.length > 0 && (
                      <button
                        onClick={() => setCurrentView("table")}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150"
                        style={{
                          backgroundColor:
                            currentView === "table"
                              ? theme.colors.surface
                              : "transparent",
                          color:
                            currentView === "table"
                              ? theme.colors.text
                              : theme.colors.textSecondary,
                          boxShadow:
                            currentView === "table" && theme.mode === "light"
                              ? "0 2px 5px rgba(0,0,0,0.05)"
                              : "none",
                        }}
                      >
                        Table
                      </button>
                    )}
                    {parsedData?.sql_query && (
                      <button
                        onClick={() => setCurrentView("query")}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150"
                        style={{
                          backgroundColor:
                            currentView === "query"
                              ? theme.colors.surface
                              : "transparent",
                          color:
                            currentView === "query"
                              ? theme.colors.text
                              : theme.colors.textSecondary,
                          boxShadow:
                            currentView === "query" && theme.mode === "light"
                              ? "0 2px 5px rgba(0,0,0,0.05)"
                              : "none",
                        }}
                      >
                        Query
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {currentView === "graph" && hasNumericData && (
                      <div className="relative" ref={resolutionRef}>
                        <button
                          onClick={() =>
                            setShowResolutionOptions(!showResolutionOptions)
                          }
                          className="p-1.5 rounded-md text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          title="Download Layout Render"
                        >
                          <Download size={15} />
                        </button>
                        <AnimatePresence>
                          {showResolutionOptions && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="absolute right-0 mt-1 rounded-lg border z-50 w-36 overflow-hidden py-1 shadow-md"
                              style={{
                                background: theme.colors.surface,
                                borderColor: theme.colors.border,
                              }}
                            >
                              {["low", "high"].map((res) => (
                                <button
                                  key={res}
                                  onClick={() =>
                                    handleDownloadGraph(res as any)
                                  }
                                  className="w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                  style={{ color: theme.colors.text }}
                                >
                                  {res === "low"
                                    ? "Standard Grid"
                                    : "High Density"}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {currentView === "query" && parsedData?.sql_query && (
                      <CustomTooltip title={copyTooltipTxt} position="top">
                        <button
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
                          className="p-1.5 rounded-md text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          disabled={!canCopy}
                        >
                          {copied ? (
                            <Check
                              size={15}
                              style={{ color: theme.colors.success }}
                            />
                          ) : (
                            <Copy size={15} />
                          )}
                        </button>
                      </CustomTooltip>
                    )}
                  </div>
                </div>
              )}

            {renderContent()}

            {/* Bottom Actions Matrix */}
            {message.status !== "loading" && (message.status === "normal" || message.status === "error" || currentView === "error") && !disabled && (
              <div className="flex justify-end items-center gap-3.5 mt-1 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                <span
                  className="text-[11px] font-semibold mr-auto opacity-50"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {parseTimestamp(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLike}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isLiked ? "bg-emerald-500/10 text-emerald-500" : "text-slate-400 hover:text-emerald-500 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  {isLiked ? (
                    <BsHandThumbsUpFill
                      size={15}
                      style={{ color: theme.colors.success }}
                      className="drop-shadow-sm"
                    />
                  ) : (
                    <BsHandThumbsUp size={15} />
                  )}
                </motion.button>
                <div className="relative" ref={dislikeRef}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleDislike}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isDisliked ? "bg-red-500/10 text-red-500" : "text-slate-400 hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    {isDisliked ? (
                      <BsHandThumbsDownFill
                        size={15}
                        style={{ color: theme.colors.error }}
                        className="drop-shadow-sm"
                      />
                    ) : (
                      <BsHandThumbsDown size={15} />
                    )}
                  </motion.button>
                  <AnimatePresence>
                    {showDislikeOptions && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full right-0 mb-2 rounded-xl border z-50 min-w-[200px] overflow-hidden py-1.5 shadow-xl backdrop-blur-xl"
                        style={{
                          background: theme.mode === 'light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(30, 41, 59, 0.85)',
                          borderColor: theme.mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                        }}
                      >
                        {showCustomInput ? (
                          <div className="p-3 flex flex-col gap-2.5">
                            <textarea
                              value={customReason}
                              onChange={(e) => setCustomReason(e.target.value)}
                              placeholder="What went wrong?"
                              rows={2}
                              autoFocus
                              className="w-full p-2.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none font-medium transition-all"
                              style={{
                                color: theme.colors.text,
                                backgroundColor: theme.colors.background,
                                borderColor: theme.colors.border,
                              }}
                            />
                            <div className="flex justify-end gap-2 text-[10px] font-bold uppercase tracking-wider">
                              <button
                                onClick={() => {
                                  setShowCustomInput(false);
                                  setCustomReason("");
                                }}
                                className="hover:opacity-70 transition-opacity"
                                style={{ color: theme.colors.textSecondary }}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  if (customReason.trim())
                                    handleDislikeOption(customReason);
                                }}
                                className="px-2.5 py-1 rounded text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
                              >
                                Submit
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-0.5 px-1.5">
                            {[
                              { id: "Inaccurate data", icon: <FileWarning size={13} className="opacity-60 group-hover:opacity-100" /> },
                              { id: "Confusing or unclear", icon: <MessageSquareWarning size={13} className="opacity-60 group-hover:opacity-100" /> },
                              { id: "Too slow", icon: <Clock size={13} className="opacity-60 group-hover:opacity-100" /> },
                              { id: "Irrelevant response", icon: <Target size={13} className="opacity-60 group-hover:opacity-100" /> },
                              { id: "Other", icon: <MoreHorizontal size={13} className="opacity-60 group-hover:opacity-100" /> },
                            ].map(({ id, icon }) => (
                              <button
                                key={id}
                                onClick={() =>
                                  id === "Other"
                                    ? setShowCustomInput(true)
                                    : handleDislikeOption(id)
                                }
                                className="group flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-black/5 dark:hover:bg-white/10"
                                style={{ color: theme.colors.text }}
                              >
                                {icon}
                                <span>{id}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
          {/* Summary Modal */}
          {showSummaryModal && parsedData?.content && (
            <SummaryModal
              summaryText={parsedData.content}
              onClose={() => setShowSummaryModal(false)}
              theme={theme}
            />
          )}

        </div>
      ) : (
        <div className="w-full flex justify-end group py-2">
          {!isEditing ? (
            <div
              className="relative max-w-[85%] md:max-w-[75%] px-6 py-4 rounded-3xl font-medium"
              style={{
                backgroundColor:
                  theme.mode === "light"
                    ? "#F1F5F9"
                    : "rgba(255, 255, 255, 0.05)",
                color: theme.colors.text,
              }}
            >
              {!disabled && (
                <div className="absolute right-full top-1/2 -translate-y-1/2 pr-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  {responseStatus === "success" && (
                    <CustomTooltip
                      title={isFavorited ? "Remove from favorites" : "Add to favorites"}
                      position="left"
                    >
                      <button
                        onClick={handleFavorite}
                        className="p-1 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        style={{
                          color: isFavorited ? theme.colors.accent : "rgb(156 163 175)",
                        }}
                      >
                        <Heart
                          size={14}
                          className={isFavorited ? "fill-current" : ""}
                        />
                      </button>
                    </CustomTooltip>
                  )}
                  {!isSubmitting && (
                    <CustomTooltip title="Edit this question" position="left">
                      <button
                        onClick={handleEdit}
                        className="p-1 rounded-md text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <Edit3 size={14} />
                      </button>
                    </CustomTooltip>
                  )}
                </div>
              )}

              <p
                className="whitespace-pre-wrap break-words leading-relaxed text-[15px]"
                style={{
                  color: theme.mode === "light" ? "#0F172A" : theme.colors.text,
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
