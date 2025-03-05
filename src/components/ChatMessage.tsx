import React, { useState, useRef, useEffect } from "react";
import { Bot, User, Table, ChartSpline, Edit3, Check, X } from "lucide-react";
import axios from "axios";
import { Message } from "../types";
import DataTable from "./DataTable";
import { Tooltip } from "react-tippy";
import "react-tippy/dist/tippy.css";
import DynamicBarGraph from "./Graphs/DynamicBarGraph";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./ChatMessage.css";

interface ChatMessageProps {
  message: Message;
  loading: boolean;
  onEditMessage: (id: string, newContent: string, botResponse?: string) => void;
  onDeleteMessage: (id: string) => void;
  selectedConnection: string | null;
}

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
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (isEditing) {
        inputRef.current?.focus();
      }
    }, [isEditing]);

    const handleSwap = () => {
      setShowTable((prev) => !prev);
    };

    const handleEdit = () => {
      setIsEditing(true);
    };

    const handleSave = async () => {
      if (!selectedConnection || !editedContent.trim()) return;

      setIsUpdating(true);
      try {
        // First update the user message
        onEditMessage(message.id, editedContent);

        // Then get new bot response
        const response = await axios.post(`${CHATBOT_API_URL}/ask`, {
          question: editedContent,
          connection: selectedConnection,
        });

        // Update the bot response that follows this message
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
      setIsEditing(false);
    };

    const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

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

      if (isEditing) {
        return (
          <div>
            <textarea
              ref={inputRef}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
            <div className="flex space-x-2 mt-2">
              <button
                onClick={handleSave}
                className="p-2 bg-green-500 text-white rounded-md"
              >
                <Check size={16} />
              </button>
              <button
                onClick={handleCancel}
                className="p-2 bg-red-500 text-white rounded-md"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        );
      }

      try {
        const data = JSON.parse(message.content);

        if (data && data.answer) {
          return (
            <div className="relative">
              <button
                onClick={handleSwap}
                aria-label="Swap Data"
                className="absolute top-0 -right-12 -m-1 p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 z-10"
              >
                <Tooltip
                  title={
                    showTable ? "Switch to Graph View" : "Switch to Table View"
                  }
                >
                  {showTable ? (
                    <ChartSpline className="text-blue-600" strokeWidth={2} />
                  ) : (
                    <Table size={22} className="text-blue-600" />
                  )}
                </Tooltip>
              </button>

              {showTable ? (
                <DataTable
                  data={
                    Array.isArray(data.answer) ? data.answer : [data.answer]
                  }
                />
              ) : (
                <div>
                  <div style={{ flex: 1 }}>
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
                <div className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl px-4 py-3 w-auto max-w-full shadow-md animate-fade">
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
                <div className="p-2 rounded-full bg-blue-400">
                  <User size={20} className="text-white" />
                </div>
                <div className="bg-blue-500 text-white rounded-2xl px-4 py-3 w-auto max-w-full shadow-md">
                  {isEditing ? (
                    <div>
                      <textarea
                        ref={inputRef}
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full bg-blue-500 text-white focus:outline-none resize-none"
                        disabled={isUpdating}
                        rows={3}
                      />
                      <div className="flex justify-between mt-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSave}
                            className="p-2 bg-green-500 text-white rounded-md disabled:opacity-50 hover:bg-green-600"
                            disabled={isUpdating}
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-2 bg-red-500 text-white rounded-md disabled:opacity-50 hover:bg-red-600"
                            disabled={isUpdating}
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <span className="text-xs text-gray-300 self-end">
                          {formattedTime}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <div className="flex justify-between mt-2">
                        <button
                          onClick={handleEdit}
                          className="text-gray-300 hover:text-gray-100"
                        >
                          <Edit3 size={16} />
                        </button>
                        <span className="text-xs text-gray-300">
                          {formattedTime}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default ChatMessage;
