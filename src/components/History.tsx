import React, { useState, useEffect, useRef } from "react";
import { Message } from "../types";
import { Bot, User, Table, ChartSpline, Download } from "lucide-react";
import DataTable from "./DataTable";
import DynamicBarGraph from "./Graphs/DynamicBarGraph";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import html2canvas from "html2canvas";
import { CSVLink } from "react-csv";
import { Tooltip } from "react-tippy";
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
      for (let i = 0; i < messages.length - 1; i++) {
        if (
          !messages[i].isBot &&
          messages[i].content.toLowerCase().includes(term.toLowerCase()) &&
          messages[i + 1].isBot
        ) {
          filtered.push(messages[i]); // push user message
          filtered.push(messages[i + 1]); // Push the bot's response
          i++; // Skip the bot's response in the next iteration
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
            <div className="absolute top-0 -right-14 flex flex-col items-center">
              <button
                onClick={handleSwap}
                aria-label="Swap Data"
                className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 z-10"
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
                  data={tableData}
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
    <div className="flex flex-col h-full bg-gray-200 dark:bg-gray-900 p-4">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        Chat History
      </h2>
      <input
        type="text"
        placeholder="Search chat history..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="w-full px-4 py-2 border rounded-md text-gray-700 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
      />
      <div className="overflow-y-auto flex-1">
        {messagesToDisplay.length > 0 ? (
          messagesToDisplay.map((message) => (
            <div key={message.id} className="w-full flex">
              {message.isBot ? (
                <div className="w-full flex flex-col items-start space-y-2">
                  <div className="flex items-start space-x-4 max-w-[80%]">
                    <div className="p-2 rounded-full bg-gray-400 dark:bg-gray-600">
                      <Bot size={20} className="text-white" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl px-4 py-3 my-4 w-auto max-w-full shadow-md animate-fade">
                      {renderContent(message)}
                      <div className="flex justify-end mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-end space-y-2">
                  <div className="flex items-start gap-4 max-w-[80%] flex-row-reverse">
                    <div className="p-2 rounded-full bg-blue-500 shadow-md">
                      <User size={20} className="text-white" />
                    </div>
                    <div className="bg-blue-600 text-white rounded-2xl px-4 py-3 w-auto max-w-full shadow-md hover:shadow-lg transition-shadow">
                      <p className="whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-400/30">
                        <span className="text-xs text-blue-100">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No messages found.</p>
        )}
      </div>
    </div>
  );
};

export default History;
