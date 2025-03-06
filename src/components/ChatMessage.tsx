import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Bot,
  User,
  Table,
  ChartSpline,
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

interface ChatMessageProps {
  message: Message;
  loading: boolean;
  onEditMessage: (id: string, newContent: string, botResponse?: string) => void;
  onDeleteMessage: (id: string) => void;
  selectedConnection: string | null;
}

const CHATBOT_API_URL = process.env.REACT_APP_CHATBOT_API_URL || ""; // Ensure you have this defined
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
      if (!selectedConnection || !editedContent.trim() || !hasChanges) return;

      setIsUpdating(true);
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
      } finally {
        setIsUpdating(false);
        setIsEditing(false);
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
          <div className="flex justify-center items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-typing delay-100"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-typing delay-200"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-typing delay-300"></div>
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
              <div className="absolute top-0 -right-14 flex flex-col items-center">
                <button
                  onClick={handleSwap}
                  aria-label="Swap Data"
                  className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 z-10"
                >
                  <Tooltip
                    title={
                      showTable
                        ? "Switch to Graph View"
                        : "Switch to Table View"
                    }
                  >
                    {showTable ? (
                      <ChartSpline className="text-blue-600" strokeWidth={2} />
                    ) : (
                      <Table size={22} className="text-blue-600" />
                    )}
                  </Tooltip>
                </button>
                {!showTable && (
                  <button
                    onClick={handleDownloadGraph}
                    className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 mt-2 z-10"
                  >
                    <Tooltip title="Download Graph">
                      <Download size={22} className="text-blue-600" />
                    </Tooltip>
                  </button>
                )}
                {showTable && (
                  <CSVLink
                    data={csvData}
                    filename={"table_data.csv"}
                    className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 mt-2 z-10"
                  >
                    <Tooltip title="Download CSV">
                      <Download size={22} className="text-blue-600" />
                    </Tooltip>
                  </CSVLink>
                )}
              </div>

              {showTable ? (
                <DataTable data={tableData} />
              ) : (
                <div>
                  <div ref={graphRef} style={{ flex: 1 }}>
                    <DynamicBarGraph data={data.answer} />
                  </div>
                </div>
              )}
            </div>
          );
        } else {
          return (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ node, ...props }) => (
                  <p className="whitespace-pre-wrap break-words" {...props} />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          );
        }
      } catch {
        return (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ node, ...props }) => (
                <p className="whitespace-pre-wrap break-words" {...props} />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        );
      }
    };

    return (
      <div className="w-full flex flex-col px-4 space-y-4">
        <div className="w-full flex">
          {message.isBot ? (
            <div className="w-full flex flex-col items-start space-y-2">
              <div className="flex items-start space-x-4 max-w-[80%]">
                <div className="p-2 rounded-full bg-gray-400 dark:bg-gray-600">
                  <Bot size={20} className="text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl px-4 py-3 my-4 w-auto max-w-full shadow-md animate-fade">
                  {renderContent()}
                  <div className="flex justify-end mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formattedTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-end space-y-2">
              <div className="flex items-start gap-4 max-w-[80%] flex-row-reverse relative">
                <div className="p-2 rounded-full bg-blue-400 shadow-md">
                  <User size={20} className="text-white" />
                </div>
                {!isEditing ? (
                  <div className="bg-blue-500 text-white rounded-2xl px-4 py-3 w-auto max-w-full shadow-md hover:shadow-lg transition-shadow">
                    <>
                      <p className="whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-400/30">
                        <Tooltip
                          title="Edit message"
                          position="bottom"
                          arrow={true}
                        >
                          <button
                            onClick={handleEdit}
                            className="p-2 text-blue-100 hover:text-white transition-colors duration-200"
                          >
                            <Edit3 size={16} />
                          </button>
                        </Tooltip>
                        <span className="text-xs text-blue-100">
                          {formattedTime}
                        </span>
                      </div>
                    </>
                  </div>
                ) : null}
                {isEditing ? (
                  <EditableMessage
                    messageContent={editedContent}
                    isUpdating={isUpdating}
                    hasChanges={hasChanges}
                    formattedTime={formattedTime}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    onContentChange={handleContentChange}
                  />
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default ChatMessage;
