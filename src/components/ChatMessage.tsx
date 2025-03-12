import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Bot,
  User,
  Table,
  LineChart as ChartSpline,
  Edit3,
  Check,
  X,
  Download,
} from "lucide-react";
import axios from "axios";
import { Message } from "../types";
import DataTable from "./DataTable";
import { Tooltip } from "react-tippy";
import "react-tippy/dist/tippy.css";
import DynamicBarGraph from "./Graphs/DynamicBarGraph";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./ChatMessage.css";
import html2canvas from "html2canvas";
import { CSVLink } from "react-csv";
import EditableMessage from "./EditableMessage";
import { motion } from "framer-motion";
import { CHATBOT_API_URL } from "../config";

interface ChatMessageProps {
  message: Message;
  loading: boolean;
  onEditMessage: (id: string, newContent: string, botResponse?: string) => void;
  onDeleteMessage: (id: string) => void;
  selectedConnection: string | null;
}

const messagesRef = { current: [] as Message[] }; // Ensure you have this defined

const ChatMessage: React.FC<ChatMessageProps> = React.memo(
  ({
    message,
    loading,
    onEditMessage,
    onDeleteMessage,
    selectedConnection,
  }) => {
    const [showTable, setShowTable] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);
    const [isUpdating, setIsUpdating] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const graphRef = useRef<HTMLDivElement>(null); // Ref for the graph container
    const [csvData, setCsvData] = useState<any[]>([]);

    useEffect(() => {
      try {
        const data = JSON.parse(message.content);
        if (data && data.answer) {
          const tableData = Array.isArray(data.answer)
            ? data.answer
            : [data.answer];
          setCsvData(tableData);
        }
      } catch (error) {
        setCsvData([]);
      }
    }, [message.content]);

    const handleSwap = () => {
      setShowTable((prev) => !prev);
    };

    const handleEdit = () => {
      setIsEditing(true);
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setEditedContent(newContent);
      setHasChanges(newContent !== message.content);
    };

    const handleSave = async () => {
      setIsEditing(false);
      if (!selectedConnection || !editedContent.trim() || !hasChanges) return;

      setIsUpdating(true);
      try {
        onEditMessage(message.id, editedContent);
        setHasChanges(false);
        console.log(CHATBOT_API_URL);
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
      } finally {
        setIsUpdating(false);
      }
    };

    const handleCancel = () => {
      setEditedContent(message.content);
      setHasChanges(false);
      setIsEditing(false);
    };

    const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const handleDownloadGraph = async () => {
      if (graphRef.current) {
        try {
          const canvas = await html2canvas(graphRef.current);
          const image = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = image;
          link.download = "graph.png";
          link.click();
        } catch (error) {
          console.error("Error downloading graph:", error);
        }
      }
    };

    const renderContent = () => {
      if (loading) {
        return (
          <div className="rounded-2xl rounded-tl-none bg-white p-4 shadow-md pb-6 flex items-center justify-center dark:bg-gray-800">
            <div className="loader"></div>
          </div>
        );
      }

      try {
        const data = JSON.parse(message.content);

        if (data && data.answer) {
          const tableData = Array.isArray(data.answer)
            ? data.answer
            : [data.answer];

          return (
            <div className="relative">
              <div className="absolute -right-12 top-0 flex flex-col items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSwap}
                  className="rounded-full bg-gray-100 p-2.5 shadow-sm transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  <Tooltip
                    title={
                      showTable
                        ? "Switch to Graph View"
                        : "Switch to Table View"
                    }
                  >
                    {showTable ? (
                      <ChartSpline
                        className="text-blue-500 dark:text-blue-400"
                        size={20}
                      />
                    ) : (
                      <Table
                        className="text-blue-500 dark:text-blue-400"
                        size={20}
                      />
                    )}
                  </Tooltip>
                </motion.button>

                {!showTable && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownloadGraph}
                    className="rounded-full bg-gray-100 p-2.5 shadow-sm transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    <Tooltip title="Download Graph">
                      <Download
                        className="text-blue-500 dark:text-blue-400"
                        size={20}
                      />
                    </Tooltip>
                  </motion.button>
                )}

                {showTable && (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <CSVLink
                      data={tableData}
                      filename="table_data.csv"
                      className="flex rounded-full bg-gray-100 p-2.5 shadow-sm transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                      <Tooltip title="Download CSV">
                        <Download
                          className="text-blue-500 dark:text-blue-400"
                          size={20}
                        />
                      </Tooltip>
                    </CSVLink>
                  </motion.div>
                )}
              </div>

              <div className="rounded-xl bg-white p-4 shadow-md dark:bg-gray-800">
                {showTable ? (
                  <>
                    <DataTable data={tableData} />
                    <div className="mt-2 text-right text-xs text-gray-400 dark:text-gray-500">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </>
                ) : (
                  <div ref={graphRef} className="w-full">
                    <DynamicBarGraph data={data.answer} />
                    <div className="mt-2 text-right text-xs text-gray-400 dark:text-gray-500">
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
                  className="whitespace-pre-wrap break-words leading-relaxed text-gray-700 dark:text-gray-300"
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
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ node, ...props }) => (
                <div className="rounded-2xl rounded-tl-none bg-white p-4 shadow-md dark:bg-gray-800">
                  <p
                    className="whitespace-pre-wrap break-words leading-relaxed text-gray-700 dark:text-gray-300"
                    {...props}
                  />
                  <div className="mt-2 text-right text-xs text-gray-400 dark:text-gray-500">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        );
      }
    };

    return (
      <div className="mb-6 flex w-full">
        {message.isBot ? (
          <div className="flex w-full items-start space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg dark:from-blue-600 dark:to-purple-600">
              <Bot size={20} className="text-white" />
            </div>
            <div className="max-w-[80%]">{renderContent()}</div>
          </div>
        ) : (
          <div className="ml-auto flex w-full items-start justify-end space-x-4">
            {!isEditing ? (
              <div className="max-w-[80%] rounded-2xl rounded-tr-none bg-gradient-to-r from-blue-500 to-blue-600 p-4 shadow-lg dark:from-blue-600 dark:to-blue-700">
                <p className="whitespace-pre-wrap break-words text-white">
                  {message.content}
                </p>
                <div className="mt-2 border-t border-blue-400/30 pt-2 flex items-center justify-between">
                  <span className="text-xs text-blue-50">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <Tooltip title="Edit message" position="bottom" arrow={true}>
                    <button
                      onClick={handleEdit}
                      className="p-2 text-blue-100 hover:text-white transition-colors duration-200"
                    >
                      <Edit3 size={16} />
                    </button>
                  </Tooltip>
                </div>
              </div>
            ) : (
              <EditableMessage
                messageContent={editedContent}
                isUpdating={isUpdating}
                hasChanges={hasChanges}
                formattedTime={formattedTime}
                onSave={handleSave}
                onCancel={handleCancel}
                onContentChange={handleContentChange}
              />
            )}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg dark:from-blue-600 dark:to-blue-700">
              <User size={20} className="text-white" />
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default ChatMessage;
