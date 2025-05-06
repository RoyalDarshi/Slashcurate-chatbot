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
} from "lucide-react";
import {
  BsHandThumbsDown,
  BsHandThumbsDownFill,
  BsHandThumbsUp,
  BsHandThumbsUpFill,
} from "react-icons/bs";
import { ChatMessageProps } from "../types";
import DataTable from "./DataTable";
import CustomTooltip from "./CustomTooltip";
import DynamicBarGraph from "./Graphs/DynamicBarGraph";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import EditableMessage from "./EditableMessage";
import { motion } from "framer-motion";
import { useTheme } from "../ThemeContext";
import MiniLoader from "./MiniLoader";
import QueryDisplay from "./QueryDisplay";
import { toast } from "react-toastify";
import axios from "axios";
import { API_URL } from "../config";

const ChatMessage: React.FC<ChatMessageProps> = React.memo(
  ({
    message,
    loading,
    onEditMessage,
    selectedConnection,
    onFavorite,
    onUnfavorite,
    isFavorited: initialIsFavorited,
    responseStatus,
    disabled,
  }) => {
    const { theme } = useTheme();
    const [csvData, setCsvData] = useState<any[]>([]);
    const [hasNumericData, setHasNumericData] = useState<boolean>(false);
    const [currentView, setCurrentView] = useState<
      "table" | "graph" | "query" | "text"
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

    const graphRef = useRef<HTMLDivElement>(null);
    const dislikeRef = useRef<HTMLDivElement>(null);
    const resolutionRef = useRef<HTMLDivElement>(null);
    const mode = theme.colors.background === "#0F172A" ? "dark" : "light";
    const { chatFontSizeValue } = useTheme();

    const parsedData = React.useMemo(() => {
      try {
        return JSON.parse(message.content);
      } catch {
        return message.isBot ? null : { content: message.content };
      }
    }, [message.content, message.isBot]);

    useEffect(() => {
      if (parsedData?.answer && message.isBot) {
        const tableData = Array.isArray(parsedData.answer)
          ? parsedData.answer
          : [parsedData.answer];
        setCsvData(tableData);

        const hasGraphicalData =
          tableData.length > 0 &&
          tableData.some((row) => {
            return Object.entries(row).some(([key, val]) => {
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
                !isExcludedKey && !isNaN(numericValue) && isFinite(numericValue)
              );
            });
          });
        setHasNumericData(hasGraphicalData);

        if (tableData.length > 0) {
          setCurrentView(hasGraphicalData ? "graph" : "table");
        } else {
          setCurrentView("text");
        }
      } else {
        setCsvData([]);
        setHasNumericData(false);
        setCurrentView("text");
      }
    }, [parsedData, message.isBot]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        // Handle dislike options
        if (
          dislikeRef.current &&
          !dislikeRef.current.contains(event.target as Node)
        ) {
          setShowDislikeOptions(false);
          setShowCustomInput(false);
        }

        // Handle resolution options
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
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
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
          console.error("Error unsetting dislike reaction:", error);
          toast.error("Failed to unset dislike reaction.");
        }
      } else {
        setShowDislikeOptions(true);
        setIsLiked(false);
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
        onEditMessage(message.id, editedContent);
        setHasChanges(false);
      } catch (error) {
        console.error("Error updating message:", error);
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

    const renderContent = () => {
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
              className="ml-2"
              style={{
                color: theme.colors.textSecondary,
                fontSize: chatFontSizeValue,
              }}
            >
              Thinking...
            </span>
          </div>
        );
      }

      if (!parsedData && message.isBot) {
        return (
          <div
            className="p-4 shadow-md"
            style={{
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.large,
              borderTopLeftRadius: message.isBot ? "0" : undefined,
              boxShadow: `0 2px 6px ${theme.colors.text}20`,
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ node, ...props }) => (
                  <p
                    className="whitespace-pre-wrap break-words leading-relaxed"
                    style={{
                      color: theme.colors.text,
                      fontSize: chatFontSizeValue,
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
            className="absolute -right-12 top-0 flex flex-col items-center"
            style={{ gap: theme.spacing.sm }}
          >
            {currentView === "query" && csvData.length === 0 && (
              <CustomTooltip title="Switch to Text View" position="top">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentView("text")}
                  className="rounded-full p-2 shadow-sm transition-colors duration-200 hover:opacity-85"
                  style={{ background: theme.colors.surface }}
                >
                  <Table size={20} style={{ color: theme.colors.accent }} />
                </motion.button>
              </CustomTooltip>
            )}

            {csvData.length > 0 && currentView !== "table" && (
              <CustomTooltip title="Switch to Table View" position="top">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentView("table")}
                  className="rounded-full p-2 shadow-sm transition-colors duration-200 hover:opacity-85"
                  style={{ background: theme.colors.surface }}
                >
                  <Table size={20} style={{ color: theme.colors.accent }} />
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
              <CustomTooltip title="Switch to Query View" position="top">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentView("query")}
                  className="rounded-full p-2 shadow-sm transition-colors duration-200 hover:opacity-85"
                  style={{ background: theme.colors.surface }}
                >
                  <Database size={20} style={{ color: theme.colors.accent }} />
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
                  <Download size={20} style={{ color: theme.colors.accent }} />
                </motion.button>
              </CustomTooltip>
            )}

            {currentView === "graph" && hasNumericData && (
              <div className="relative" ref={resolutionRef}>
                <CustomTooltip title="Download Graph" position="bottom">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      setShowResolutionOptions(!showResolutionOptions)
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
                        (e.currentTarget.style.backgroundColor = "transparent")
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
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      High Resolution
                    </button>
                  </motion.div>
                )}
              </div>
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
                      const textarea = document.createElement("textarea");
                      textarea.value = parsedData.sql_query;
                      document.body.appendChild(textarea);
                      textarea.select();
                      try {
                        const success = document.execCommand("copy");
                        if (success) {
                          setCopied(true);
                          setCopyTooltipTxt("Copied!");
                        } else {
                          toast.error("Copying failed. Try again.");
                        }
                      } catch (error) {
                        console.error("Legacy copy failed:", error);
                        toast.error("Copying not supported in this browser.");
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
                    <Check size={20} style={{ color: theme.colors.accent }} />
                  ) : (
                    <Copy size={20} style={{ color: theme.colors.accent }} />
                  )}
                </motion.button>
              </CustomTooltip>
            )}
          </div>
          <div
            className="p-2 shadow-md"
            style={{
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.large,
              borderTopLeftRadius: message.isBot ? "0" : undefined,
              boxShadow: `0 2px 6px ${theme.colors.text}20`,
              width: "100%",
            }}
          >
            {currentView === "text" && (
              <>
                <p
                  style={{
                    color: theme.colors.text,
                    fontSize: chatFontSizeValue,
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
                <DynamicBarGraph
                  data={csvData}
                  isValidGraph={setHasNumericData}
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
                    fontSize={chatFontSizeValue}
                  />
                ) : (
                  <p
                    style={{
                      color: theme.colors.text,
                      fontSize: chatFontSizeValue,
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
            className="flex w-full items-start"
            style={{ gap: theme.spacing.md }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full shadow-md"
              style={{ background: theme.colors.accent }}
            >
              <Bot size={20} style={{ color: "white" }} />
            </div>
            <div
              className="max-w-[75%] flex flex-col gap-2"
              style={{ position: "relative" }}
            >
              {renderContent()}
              {!loading && (
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
                          style={{ color: theme.colors.textSecondary }}
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
                            style={{ color: theme.colors.textSecondary }}
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
                            loading ||
                            responseStatus === "loading" ||
                            responseStatus === "error"
                              ? 1
                              : 1.1,
                        }}
                        whileTap={{
                          scale:
                            loading ||
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
                            loading ||
                            responseStatus === "loading" ||
                            responseStatus === "error"
                              ? "not-allowed"
                              : "pointer",
                          opacity:
                            loading ||
                            responseStatus === "loading" ||
                            responseStatus === "error"
                              ? 0.5
                              : 1,
                        }}
                        disabled={
                          loading ||
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
                  style={{ color: "white", fontSize: chatFontSizeValue }}
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
                  {!disabled && (
                    <CustomTooltip title="Edit message" position="bottom">
                      <button
                        onClick={handleEdit}
                        className="p-2 transition-colors duration-200 hover:opacity-80"
                        style={{ color: "white" }}
                      >
                        <Edit3 size={16} />
                      </button>
                    </CustomTooltip>
                  )}
                </div>
              </div>
            ) : (
              <EditableMessage
                messageContent={editedContent}
                onSave={handleSave}
                onCancel={handleCancel}
                onContentChange={handleContentChange}
                fontSize={chatFontSizeValue}
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
    prevProps.message === nextProps.message &&
    prevProps.loading === nextProps.loading &&
    prevProps.selectedConnection === nextProps.selectedConnection &&
    prevProps.favoriteCount === nextProps.favoriteCount &&
    prevProps.isFavorited === nextProps.isFavorited &&
    prevProps.onEditMessage === nextProps.onEditMessage &&
    prevProps.onFavorite === nextProps.onFavorite &&
    prevProps.onUnfavorite === nextProps.onUnfavorite
  );
};

export default React.memo(ChatMessage, areEqual);
