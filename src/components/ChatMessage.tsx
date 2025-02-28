import React, { useState } from "react";
import { Bot, User, Table, ChartSpline } from "lucide-react";
import { Message } from "../types";
import "./ChatMessage.css";
import DataTable from "./DataTable";
import { Tooltip } from "react-tooltip";
import DynamicBarGraph from "./Graphs/DynamicBarGraph";

interface ChatMessageProps {
  message: Message;
  loading: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = React.memo(({ message }) => {
  const [showTable, setShowTable] = useState(false);

  const handleSwap = () => {
    setShowTable((prev) => !prev);
  };

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const renderContent = () => {
    if (message.content === "loading...") {
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

      if (data) {
        return (
          <div className="relative">
            <button
              data-tooltip-content={
                showTable ? "Switch to Graph View" : "Switch to Table View"
              }
              data-tooltip-id="my-tooltip"
              onClick={handleSwap}
              aria-label="Swap Data"
              className="absolute top-0 -right-12 -m-1 p-2 rounded-full transition hover:bg-gray-300 dark:hover:bg-gray-600 z-10"
            >
              {showTable ? (
                <ChartSpline className="text-blue-600" strokeWidth={2} />
              ) : (
                <Table size={22} className="text-blue-600" />
              )}
            </button>
            <Tooltip
              id="my-tooltip"
              place="top"
              delayShow={200}
              delayHide={200}
              style={{
                background: "#374151", // Dark background
                color: "#e5e7eb", // Light text
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "14px",
                boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
              }}
            />
            {showTable ? (
              <DataTable
                data={Array.isArray(data.answer) ? data.answer : [data.answer]}
              />
            ) : (
              <div>
                <DynamicBarGraph data={data.answer} />
              </div>
            )}
          </div>
        );
      } else {
        return <p>{message.content}</p>;
      }
    } catch {
      return <p>{message.content}</p>;
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
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 block text-right">
                  {formattedTime}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-end space-y-2">
            <div className="flex items-start gap-4 max-w-[80%] flex-row-reverse">
              <div className="p-2 rounded-full bg-blue-400">
                <User size={20} className="text-white" />
              </div>
              <div className="bg-blue-500 text-white rounded-2xl px-4 py-3 w-auto max-w-full shadow-md">
                <p className="whitespace-pre-wrap">{message.content}</p>
                <span className="text-xs text-gray-300 mt-2 block text-right">
                  {formattedTime}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default ChatMessage;
