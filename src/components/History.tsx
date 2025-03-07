import React, { useState, useEffect, useRef } from "react";
import { Message } from "../types";
import {
  Bot,
  User,
  Table,
  LineChart as ChartSpline,
  Download,
  Search,
} from "lucide-react";
import DataTable from "./DataTable";
import DynamicBarGraph from "./Graphs/DynamicBarGraph";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import html2canvas from "html2canvas";
import { CSVLink } from "react-csv";
import { Tooltip } from "react-tippy";
import { motion, AnimatePresence } from "framer-motion";
import "react-tippy/dist/tippy.css";

const History: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [showTable, setShowTable] = useState(false);
  const graphRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = () => {
    try {
      const storedMessages = localStorage.getItem("chatMessages");
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }
    } catch (error) {
      console.error("Failed to load messages from local storage", error);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term) {
      const filtered: Message[] = [];
      for (let i = 0; i < messages.length; i++) {
        if (
          !messages[i].isBot &&
          messages[i].content.toLowerCase().includes(term.toLowerCase())
        ) {
          // Found a user message with the search term
          filtered.push(messages[i]); // Add the user message

          // Search for the next bot message
          for (let j = i + 1; j < messages.length; j++) {
            if (messages[j].isBot) {
              filtered.push(messages[j]); // Add the bot message
              break; // Stop searching for bot messages after the first one
            }
          }
        }
      }
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages([]);
    }
  };

  const messagesToDisplay = searchTerm ? filteredMessages : messages;

  const handleSwap = () => {
    setShowTable((prev) => !prev);
  };

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

  const renderContent = (message: Message) => {
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
                    showTable ? "Switch to Graph View" : "Switch to Table View"
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
    <div className="flex h-full flex-col bg-gradient-to-br from-gray-300 to-gray-300 p-6 dark:from-gray-900 dark:to-gray-800">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent dark:from-blue-400 dark:to-purple-400">
          Chat History
        </h2>
        <div className="relative w-1/3">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full rounded-full bg-white px-5 py-2.5 pl-12 text-gray-700 shadow-sm ring-1 ring-gray-200 transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700 dark:placeholder:text-gray-500"
          />
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        </div>
      </div>

      <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-700 dark:hover:scrollbar-thumb-gray-600 flex-1 overflow-y-auto">
        <AnimatePresence>
          {messagesToDisplay.length > 0 ? (
            messagesToDisplay.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="mb-6 flex w-full last:mb-0"
              >
                {message.isBot ? (
                  <div className="flex w-full items-start space-x-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg dark:from-blue-600 dark:to-purple-600">
                      <Bot size={20} className="text-white" />
                    </div>
                    <div className="max-w-[80%]">{renderContent(message)}</div>
                  </div>
                ) : (
                  <div className="ml-auto flex w-full items-start justify-end space-x-4">
                    <div className="max-w-[80%] rounded-2xl rounded-tr-none bg-gradient-to-r from-blue-500 to-blue-600 p-4 shadow-lg dark:from-blue-600 dark:to-blue-700">
                      <p className="whitespace-pre-wrap break-words text-white">
                        {message.content}
                      </p>
                      <div className="mt-2 border-t border-blue-400/30 pt-2">
                        <span className="text-xs text-blue-50">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg dark:from-blue-600 dark:to-blue-700">
                      <User size={20} className="text-white" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-500 dark:text-gray-400"
            >
              No messages found.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default History;
