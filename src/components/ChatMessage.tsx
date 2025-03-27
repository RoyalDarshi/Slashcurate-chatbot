import React, { useRef, useEffect, useState } from "react";
import {
  Bot,
  User,
  Table,
  LineChart as ChartSpline,
  Edit3,
  Download,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import axios from "axios";
import { Message, ChatMessageProps } from "../types";
import DataTable from "./DataTable";
import { Tooltip } from "react-tippy";
import "react-tippy/dist/tippy.css";
import DynamicBarGraph from "./Graphs/DynamicBarGraph";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import EditableMessage from "./EditableMessage";
import { motion } from "framer-motion";
import { CHATBOT_API_URL } from "../config";
import { useTheme } from "../ThemeContext";
import MiniLoader from "./MiniLoader";

const ChatMessage: React.FC<ChatMessageProps> = React.memo(
  ({ message, loading, onEditMessage, selectedConnection }) => {
    const { theme } = useTheme();
    const [csvData, setCsvData] = useState<any[]>([]);
    const [hasNumericData, setHasNumericData] = useState<boolean>(true);
    const [showTable, setShowTable] = useState<boolean>(false);
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

    useEffect(() => {
      try {
        const data = JSON.parse(message.content);
        if (data && data.answer) {
          const tableData = Array.isArray(data.answer)
            ? data.answer
            : [data.answer];
          setCsvData(tableData);
        }
      } catch {
        setCsvData([]);
        setShowTable(true);
      }
    }, [message.content]);

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

    const handleSwap = () => {
      if (hasNumericData) setShowTable((prev) => !prev);
    };

    const handleEdit = () => setIsEditing(true);

    const handleLike = () => {
      setIsLiked(!isLiked);
      setIsDisliked(false);
      setShowDislikeOptions(false);
      setDislikeReason(null);
    };

    const handleDislike = () => {
      if (isDisliked) {
        setIsDisliked(false);
        setDislikeReason(null);
        setShowDislikeOptions(false);
      } else {
        setShowDislikeOptions(true);
        setIsLiked(false);
      }
    };

    const handleDislikeOption = (reason: string) => {
      setDislikeReason(reason);
      setIsDisliked(true);
      setShowDislikeOptions(false);
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setEditedContent(newContent);
      setHasChanges(newContent !== message.content);
    };

    const handleSave = async () => {
      setIsEditing(false);
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
              className="ml-2 text-sm"
              style={{ color: theme.colors.textSecondary }}
            >
              Thinking...
            </span>
          </div>
        );
      }

      try {
        const data = JSON.parse(message.content);
        if (data?.answer) {
          const tableData = Array.isArray(data.answer)
            ? data.answer
            : [data.answer];
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
                  <Tooltip
                    title={
                      !hasNumericData
                        ? "Graph unavailable: No numeric data to visualize"
                        : showTable
                        ? "Switch to Graph View"
                        : "Switch to Table View"
                    }
                  >
                    {showTable ? (
                      <ChartSpline
                        size={20}
                        style={{ color: theme.colors.accent }}
                      />
                    ) : (
                      <Table size={20} style={{ color: theme.colors.accent }} />
                    )}
                  </Tooltip>
                </motion.button>
                {!showTable && hasNumericData && (
                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        setShowResolutionOptions(!showResolutionOptions)
                      }
                      className="rounded-full p-2 shadow-sm transition-colors duration-200 hover:opacity-85"
                      style={{ background: theme.colors.surface }}
                    >
                      <Tooltip title="Download Graph">
                        <Download
                          size={20}
                          style={{ color: theme.colors.accent }}
                        />
                      </Tooltip>
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
                    <Tooltip title="Download XLSX">
                      <Download
                        size={20}
                        style={{ color: theme.colors.accent }}
                      />
                    </Tooltip>
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
                      data={data.answer}
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
        );
      } catch {
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
      }
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
              className="max-w-[80%] flex flex-col gap-2"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {renderContent()}
              {/* Updated condition to keep buttons visible when dislike options are shown */}
              {!loading &&
                (isHovered || isLiked || isDisliked || showDislikeOptions) && (
                  <div className="flex justify-end gap-2">
                    <Tooltip
                      title={isLiked ? "Remove like" : "Like this response"}
                      position="top"
                      arrow
                    >
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleLike}
                        style={{
                          backgroundColor: isLiked
                            ? theme.colors.success
                            : theme.colors.surface,
                          borderColor: isLiked
                            ? theme.colors.success
                            : theme.colors.border,
                          color: isLiked ? "white" : theme.colors.textSecondary,
                        }}
                        className="p-1 rounded-md border transition-colors duration-200"
                      >
                        <ThumbsUp size={16} />
                      </motion.button>
                    </Tooltip>
                    <div className="relative" ref={dislikeRef}>
                      <Tooltip
                        title={
                          isDisliked
                            ? "Remove dislike"
                            : "Dislike this response"
                        }
                        position="top"
                        arrow
                      >
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleDislike}
                          style={{
                            backgroundColor: isDisliked
                              ? theme.colors.error
                              : theme.colors.surface,
                            borderColor: isDisliked
                              ? theme.colors.error
                              : theme.colors.border,
                            color: isDisliked
                              ? "white"
                              : theme.colors.textSecondary,
                          }}
                          className="p-1 rounded-md border transition-colors duration-200"
                        >
                          <ThumbsDown size={16} />
                        </motion.button>
                      </Tooltip>
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
                  <Tooltip title="Edit message" position="bottom" arrow>
                    <button
                      onClick={handleEdit}
                      className="p-2 transition-colors duration-200 hover:opacity-80"
                      style={{ color: "white" }}
                    >
                      <Edit3 size={16} />
                    </button>
                  </Tooltip>
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
  }
);

export default ChatMessage;
