import React, { useState, useRef, useEffect } from "react";
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

const messagesRef = { current: [] as Message[] };

const ChatMessage: React.FC<ChatMessageProps> = React.memo(
  ({ message, loading, onEditMessage, selectedConnection }) => {
    const { theme } = useTheme();
    const [csvData, setCsvData] = useState<any[]>([]);
    const [hasNumericData, setHasNumericData] = useState<boolean>(true);
    const [showTable, setShowTable] = useState<boolean>(false); // Will be set based on numeric data
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);
    const [hasChanges, setHasChanges] = useState(false);
    const [showResolutionOptions, setShowResolutionOptions] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isDisliked, setIsDisliked] = useState(false);
    const [showDislikeOptions, setShowDislikeOptions] = useState(false);
    const [dislikeReason, setDislikeReason] = useState<string | null>(null);
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
        setShowTable(true); // Default to table on error
      }
    }, [message.content]);

    // Handle click outside to hide dislike options
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

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [showDislikeOptions]);

    const handleSwap = () => {
      if (hasNumericData) {
        setShowTable((prev) => !prev);
      }
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
        const response = await axios.post(`${CHATBOT_API_URL}/ask`, {
          question: editedContent,
          connection: selectedConnection,
        });
        const botResponse = JSON.stringify(response.data, null, 2);

        const messageIndex = messagesRef.current.findIndex(
          (msg) => msg.id === message.id
        );
        if (messageIndex + 1 < messagesRef.current.length) {
          onEditMessage(messagesRef.current[messageIndex + 1].id, botResponse);
        }
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
            scale: scale,
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
                    <DynamicBarGraph showTable={setShowTable} isValidGraph={setHasNumericData} data={data.answer} />
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
            <div className="max-w-[80%] flex flex-col gap-2">
              {renderContent()}
              {!loading && (
                <div className="flex justify-end gap-2">
                  <Tooltip
                    title={isLiked ? "Remove like" : "Like this response"}
                    position="top"
                    arrow={true}
                  >
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleLike}
                      className={`p-1 rounded-md border transition-colors duration-200 ${
                        isLiked
                          ? "bg-green-500 border-green-500 text-white dark:bg-green-500 dark:border-green-500 dark:text-gray-900"
                          : "bg-white border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
                      }`}
                    >
                      <ThumbsUp size={16} />
                    </motion.button>
                  </Tooltip>
                  <div className="relative" ref={dislikeRef}>
                    <Tooltip
                      title={
                        isDisliked ? "Remove dislike" : "Dislike this response"
                      }
                      position="top"
                      arrow={true}
                    >
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleDislike}
                        className={`p-1 rounded-md border transition-colors duration-200 ${
                          isDisliked
                            ? "bg-red-500 border-red-500 text-white dark:bg-red-500 dark:border-red-500 dark:text-gray-900"
                            : "bg-white border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
                        }`}
                      >
                        <ThumbsDown size={16} />
                      </motion.button>
                    </Tooltip>
                    {showDislikeOptions && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-md shadow-md p-2 z-10 min-w-[150px] dark:bg-gray-800 dark:border-gray-600"
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
                            className="block w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 dark:text-gray-200 dark:hover:bg-gray-700"
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
                    style={{ color: `${theme.colors.background}70` }}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <Tooltip title="Edit message" position="bottom" arrow={true}>
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
