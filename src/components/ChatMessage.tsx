import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Bot, User, Table, LineChart, Edit3, Download } from "lucide-react";
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

const ChatMessage: React.FC<ChatMessageProps> = React.memo(
  ({ message, loading, onEditMessage, selectedConnection }) => {
    const { theme } = useTheme();

    // Memoize parsed data to prevent unnecessary re-parsing
    const parsedData = useMemo(() => {
      try {
        return JSON.parse(message.content);
      } catch {
        return null;
      }
    }, [message.content]);

    // Memoize table data
    const tableData = useMemo(() => {
      if (!parsedData?.answer) return [];
      return Array.isArray(parsedData.answer)
        ? parsedData.answer
        : [parsedData.answer];
    }, [parsedData]);

    const [csvData, setCsvData] = useState<any[]>(tableData);
    const [hasNumericData, setHasNumericData] = useState<boolean>(true);
    const [showTable, setShowTable] = useState<boolean>(!parsedData?.answer);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);
    const [hasChanges, setHasChanges] = useState(false);
    const [showResolutionOptions, setShowResolutionOptions] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isDisliked, setIsDisliked] = useState(false);
    const [showDislikeOptions, setShowDislikeOptions] = useState(false);
    const [dislikeReason, setDislikeReason] = useState<string | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const graphRef = useRef<HTMLDivElement>(null);
    const dislikeRef = useRef<HTMLDivElement>(null);

    // Update csvData only when tableData actually changes
    useEffect(() => {
      setCsvData(tableData);
    }, [tableData]);

    // Reset showTable when message changes
    useEffect(() => {
      setShowTable(!parsedData?.answer);
    }, [parsedData]);

    // Handle clicks outside dislike options
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dislikeRef.current &&
          !dislikeRef.current.contains(event.target as Node)
        ) {
          setShowDislikeOptions(false);
        }
      };
      if (showDislikeOptions) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [showDislikeOptions]);

    const handleSwap = useCallback(() => {
      if (hasNumericData) setShowTable((prev) => !prev);
    }, [hasNumericData]);

    const handleEdit = useCallback(() => setIsEditing(true), []);

    const handleLike = useCallback(() => {
      setIsLiked((prev) => !prev);
      setIsDisliked(false);
      setShowDislikeOptions(false);
      setDislikeReason(null);
    }, []);

    const handleDislike = useCallback(() => {
      if (isDisliked) {
        setIsDisliked(false);
        setDislikeReason(null);
        setShowDislikeOptions(false);
      } else {
        setShowDislikeOptions(true);
        setIsLiked(false);
      }
    }, [isDisliked]);

    const handleDislikeOption = useCallback((reason: string) => {
      setDislikeReason(reason);
      setIsDisliked(true);
      setShowDislikeOptions(false);
    }, []);

    const handleContentChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        setEditedContent(newContent);
        setHasChanges(newContent !== message.content);
      },
      [message.content]
    );

    const handleSave = useCallback(async () => {
      setIsEditing(false);
      if (!selectedConnection || !editedContent.trim() || !hasChanges) return;
      try {
        onEditMessage(message.id, editedContent);
        setHasChanges(false);
      } catch (error) {
        console.error("Error updating message:", error);
      }
    }, [
      editedContent,
      hasChanges,
      message.id,
      onEditMessage,
      selectedConnection,
    ]);

    const handleCancel = useCallback(() => {
      setEditedContent(message.content);
      setHasChanges(false);
      setIsEditing(false);
    }, [message.content]);

    const handleDownloadTableXLSX = useCallback(() => {
      try {
        const worksheet = XLSX.utils.json_to_sheet(tableData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
        XLSX.writeFile(workbook, "table_data.xlsx");
      } catch (error) {
        console.error("Error downloading XLSX:", error);
      }
    }, [tableData]);

    const handleDownloadGraph = useCallback(
      async (resolution: "low" | "high") => {
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
      },
      []
    );

    const renderContent = useCallback(() => {
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

      if (parsedData?.answer) {
        return (
          <div className="relative">
            <div
              className="absolute -right-12 top-0 flex flex-col items-center"
              style={{ gap: theme.spacing.sm }}
            >
              <motion.button
                whileHover={{ scale: hasNumericData ? 1.1 : 1 }}
                whileTap={{ scale: hasNumericData ? 0.95 : 1 }}
                onClick={handleSwap}
                className={`rounded-full p-2 shadow-sm transition-colors duration-200 ${
                  !hasNumericData
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:opacity-85"
                }`}
                style={{ background: theme.colors.surface }}
                disabled={!hasNumericData}
              >
                <CustomTooltip
                  title={
                    !hasNumericData
                      ? "Graph unavailable: No numeric data to visualize"
                      : showTable
                      ? "Switch to Graph View"
                      : "Switch to Table View"
                  }
                  position="top"
                >
                  {showTable ? (
                    <LineChart
                      size={20}
                      style={{ color: theme.colors.accent }}
                    />
                  ) : (
                    <Table size={20} style={{ color: theme.colors.accent }} />
                  )}
                </CustomTooltip>
              </motion.button>
              {!showTable && hasNumericData && (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowResolutionOptions((prev) => !prev)}
                    className="rounded-full p-2 shadow-sm transition-colors duration-200 hover:opacity-85"
                    style={{ background: theme.colors.surface }}
                  >
                    <CustomTooltip title="Download Graph" position="top">
                      <Download
                        size={20}
                        style={{ color: theme.colors.accent }}
                      />
                    </CustomTooltip>
                  </motion.button>
                  {showResolutionOptions && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full mt-2 right-0 shadow-lg rounded-md p-2 z-10"
                      style={{ background: theme.colors.surface }}
                    >
                      <button
                        onClick={() => handleDownloadGraph("low")}
                        className="block w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                        style={{ color: theme.colors.text }}
                      >
                        Low Resolution
                      </button>
                      <button
                        onClick={() => handleDownloadGraph("high")}
                        className="block w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                        style={{ color: theme.colors.text }}
                      >
                        High Resolution
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
              {showTable && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDownloadTableXLSX}
                  className="rounded-full p-2 shadow-sm transition-colors duration-200 hover:opacity-85"
                  style={{ background: theme.colors.surface }}
                >
                  <CustomTooltip title="Download XLSX" position="top">
                    <Download
                      size={20}
                      style={{ color: theme.colors.accent }}
                    />
                  </CustomTooltip>
                </motion.button>
              )}
            </div>
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
                <>
                  <DataTable data={tableData} />
                  <div
                    className="mt-2 text-right text-xs"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </>
              ) : (
                <div ref={graphRef} style={{ width: "100%" }}>
                  <DynamicBarGraph
                    showTable={setShowTable}
                    isValidGraph={setHasNumericData}
                    data={parsedData.answer}
                  />
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
              )}
            </div>
          </div>
        );
      }

      return (
        <div
          className="p-4 shadow-md"
          style={{
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.large,
            borderTopLeftRadius: message.isBot ? "0" : undefined,
            borderTopRightRadius: !message.isBot ? "0" : undefined,
            boxShadow: `0 2px 6px ${theme.colors.text}20`,
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ node, ...props }) => (
                <p
                  className="whitespace-pre-wrap break-words leading-relaxed"
                  style={{ color: theme.colors.text }}
                  {...props}
                />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
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
    }, [
      loading,
      parsedData,
      tableData,
      message.content,
      message.timestamp,
      message.isBot,
      theme,
      showTable,
      hasNumericData,
      handleSwap,
      handleDownloadTableXLSX,
      handleDownloadGraph,
      showResolutionOptions,
    ]);

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
              className="max-w-[80%] flex flex-col gap-2"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
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
                        {[
                          "Incorrect data",
                          "Takes too long",
                          "Irrelevant response",
                          "Confusing answer",
                          "Other",
                        ].map((reason) => (
                          <button
                            key={reason}
                            onClick={() => handleDislikeOption(reason)}
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
                className="max-w-[80%] p-4 shadow-md"
                style={{
                  background: theme.colors.accent,
                  borderRadius: theme.borderRadius.large,
                  borderTopRightRadius: "0",
                  boxShadow: `0 2px 6px ${theme.colors.text}20`,
                }}
              >
                <p
                  className="whitespace-pre-wrap break-words"
                  style={{ color: "white" }}
                >
                  {message.content}
                </p>
                <div
                  className="mt-2 border-t pt-2 flex items-center justify-between"
                  style={{ borderColor: `${theme.colors.surface}20` }}
                >
                  <span
                    className="text-xs"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <CustomTooltip title="Edit message" position="bottom">
                    <button
                      onClick={handleEdit}
                      className="p-2 transition-colors duration-200 hover:opacity-80"
                      style={{ color: "white" }}
                    >
                      <Edit3 size={16} />
                    </button>
                  </CustomTooltip>
                </div>
              </div>
            ) : (
              <EditableMessage
                messageContent={editedContent}
                onSave={handleSave}
                onCancel={handleCancel}
                onContentChange={handleContentChange}
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
  },
  (prevProps, nextProps) =>
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.timestamp === nextProps.message.timestamp &&
    prevProps.message.isBot === nextProps.message.isBot &&
    prevProps.loading === nextProps.loading &&
    prevProps.selectedConnection === nextProps.selectedConnection
);

export default ChatMessage;
