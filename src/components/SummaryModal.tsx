import React, { useState, useEffect, useRef } from "react";

interface SummaryModalProps {
  summaryText: string;
  onClose: () => void;
  theme: any; // Assuming theme is passed for styling
}

const SummaryModal: React.FC<SummaryModalProps> = ({
  summaryText,
  onClose,
  theme,
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  console.log("SummaryModal rendered with summaryText:", summaryText);

  useEffect(() => {
    setIsVisible(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDisplayedText("");
    setIsTypingComplete(false);
    if (!summaryText || typeof summaryText !== "string") {
      return;
    }
    let currentIdx = 0;
    intervalRef.current = setInterval(() => {
      if (currentIdx < summaryText.length) {
        setDisplayedText((prev) => prev + summaryText[currentIdx]);
        currentIdx += 1;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsTypingComplete(true);
      }
    }, 0);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [summaryText]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for exit animation
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Parse text for bold formatting (e.g., **text** becomes <strong>text</strong>)
  const parseText = (text: string) => {
    const parts = text.split("**");
    return parts.map((part, index) =>
      index % 2 === 0 ? part : <strong key={index}>{part}</strong>
    );
  };

  // Render summary text as paragraphs and lists
  const renderSummary = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let currentList: React.ReactNode[] | null = null;

    lines.forEach((line, index) => {
      if (line.trim().startsWith("*")) {
        if (!currentList) {
          currentList = [];
          elements.push(
            <ul key={`ul-${index}`} className="list-disc pl-5">
              {currentList}
            </ul>
          );
        }
        const listItemText = line.trim().substring(1).trim();
        currentList.push(
          <li key={`li-${index}`}>{parseText(listItemText)}</li>
        );
      } else {
        if (currentList) {
          currentList = null;
        }
        if (line.trim()) {
          // Only add non-empty paragraphs
          elements.push(<p key={`p-${index}`}>{parseText(line)}</p>);
        }
      }
    });
    return elements;
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Widget Container */}
      <div className="absolute bottom-6 right-6 pointer-events-auto">
        <div
          className={`relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 transition-all duration-500 ease-out transform ${
            isVisible
              ? "translate-y-0 opacity-100 scale-100"
              : "translate-y-8 opacity-0 scale-95"
          } ${isExpanded ? "w-96 h-[500px]" : "w-80 h-64"}`}
          style={{
            background: `linear-gradient(135deg, ${theme.colors.surface}f0 0%, ${theme.colors.surface}e0 100%)`,
            backdropFilter: "blur(20px)",
            border: `1px solid ${theme.colors.surface}40`,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200/30">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
              <h2
                className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent"
                style={{ color: theme.colors.text }}
              >
                Graph Summary
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleExpanded}
                className="p-1.5 hover:bg-gray-100/50 rounded-lg transition-colors duration-200"
                title={isExpanded ? "Minimize" : "Expand"}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-600"
                >
                  {isExpanded ? (
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  ) : (
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  )}
                </svg>
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors duration-200 text-gray-500"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div
            className={`p-4 transition-all duration-500 ${
              isExpanded ? "h-[400px]" : "h-[180px]"
            } overflow-hidden`}
          >
            <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {isTypingComplete ? (
                <div
                  className="text-sm leading-relaxed"
                  style={{ color: theme.colors.text }}
                >
                  {renderSummary(summaryText)}
                </div>
              ) : (
                <div
                  className="text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ color: theme.colors.text }}
                >
                  {displayedText}
                  {displayedText.length < summaryText.length && (
                    <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse align-middle"></span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Progress indicator */}
          {displayedText.length < summaryText.length && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200/30 rounded-b-2xl overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-100 ease-out"
                style={{
                  width: `${
                    (displayedText.length / summaryText.length) * 100
                  }%`,
                }}
              ></div>
            </div>
          )}

          {/* Floating action button when minimized */}
          {!isExpanded && displayedText.length >= summaryText.length && (
            <button
              onClick={toggleExpanded}
              className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-sm font-medium"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.8);
        }
      `}</style>
    </div>
  );
};

export default SummaryModal;
