import React, { useCallback, useRef, useEffect } from "react";
import { X, MessageSquare, Clock, ChevronRight } from "lucide-react";
import { Theme } from "../types";
import { Message } from "../types";

interface PreviousQuestionsDrawerProps {
  showPrevQuestionsModal: boolean;
  onClose: () => void;
  userQuestionsFromSession: Message[];
  handleSelectPrevQuestion: (messageId: string) => void;
  theme: Theme;
  currentQuestionId?: string | null;
}

let savedScrollTop = 0;

const PreviousQuestionsDrawer: React.FC<PreviousQuestionsDrawerProps> = ({
  showPrevQuestionsModal,
  onClose,
  userQuestionsFromSession,
  handleSelectPrevQuestion,
  theme,
  currentQuestionId,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showPrevQuestionsModal && scrollContainerRef.current) {
      const timer = setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = savedScrollTop;
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showPrevQuestionsModal]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    savedScrollTop = e.currentTarget.scrollTop;
  }, []);

  if (!showPrevQuestionsModal) return null;

  const truncateText = (text: string, maxLength: number = 80) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const formatTimeAgo = (timestamp?: number) => {
    if (!timestamp) return "";
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toDateString();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/10 transition-opacity duration-300"
        onClick={onClose}
      />

      <style>
        {`
        @keyframes slideInRightFloat {
          from { 
            transform: translateX(120%);
            opacity: 0;
          }
          to { 
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideInItem {
          from { 
            transform: translateY(15px); 
            opacity: 0; 
          }
          to { 
            transform: translateY(0); 
            opacity: 1; 
          }
        }
        
        .floating-drawer {
          animation: slideInRightFloat 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .question-item {
          animation: slideInItem 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }

        /* Hide scrollbar for cleaner look */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        `}
      </style>

      <div
        className="floating-drawer absolute right-4 top-4 bottom-4 w-[calc(100%-2rem)] sm:w-[380px] flex flex-col shadow-[0_16px_40px_-10px_rgba(0,0,0,0.15)] rounded-[24px] overflow-hidden z-10"
        style={{
          background:
            theme.mode === "light"
              ? "rgba(255, 255, 255, 0.85)"
              : "rgba(20, 20, 25, 0.85)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: `1px solid ${theme.colors.border}80`,
        }}
      >
        {/* Header */}
        <div
          className="flex flex-col gap-1.5 p-6 shrink-0 relative z-10"
          style={{
            borderBottom: `1px solid ${theme.colors.border}40`,
          }}
        >
          <div className="flex items-center justify-between">
            <h3
              className="font-bold tracking-tight text-lg"
              style={{ color: theme.colors.text }}
            >
              Session History
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full transition-colors duration-200"
              style={{ color: theme.colors.textSecondary }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor =
                  theme.mode === "light"
                    ? "rgba(0,0,0,0.05)"
                    : "rgba(255,255,255,0.05)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <X size={18} />
            </button>
          </div>
          <p
            className="text-[13px] font-medium"
            style={{ color: theme.colors.textSecondary }}
          >
            {userQuestionsFromSession.length} question
            {userQuestionsFromSession.length !== 1 ? "s" : ""} asked
          </p>
        </div>

        {/* Content */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2"
        >
          {userQuestionsFromSession.length > 0 ? (
            userQuestionsFromSession.map((msg, index) => {
              const isCurrentQuestion = msg.id === currentQuestionId;

              return (
                <div
                  key={msg.id}
                  className="question-item"
                  style={{ animationDelay: `${index * 0.04}s` }}
                >
                  <button
                    onClick={() => handleSelectPrevQuestion(msg.id)}
                    className={`w-full text-left p-4 rounded-[18px] transition-all duration-300 flex flex-col gap-3 group relative
                      ${isCurrentQuestion ? "shadow-[0_4px_12px_rgba(0,0,0,0.03)]" : ""}
                    `}
                    style={{
                      backgroundColor: isCurrentQuestion
                        ? theme.mode === "light"
                          ? "#ffffff"
                          : "rgba(255,255,255,0.08)"
                        : "transparent",
                      border: `1px solid ${isCurrentQuestion ? theme.colors.border : "transparent"}`,
                    }}
                    onMouseOver={(e) => {
                      if (!isCurrentQuestion) {
                        e.currentTarget.style.backgroundColor =
                          theme.mode === "light"
                            ? "rgba(0,0,0,0.03)"
                            : "rgba(255,255,255,0.04)";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isCurrentQuestion) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <div
                      className="flex items-center justify-between w-full text-[12px] font-semibold"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      <span className="flex items-center gap-1.5 opacity-80">
                        <Clock size={13} strokeWidth={2.5} />
                        {formatTimeAgo(msg.timestamp)}
                      </span>
                      {isCurrentQuestion && (
                        <span
                          style={{
                            color: theme.colors.accent,
                            fontSize: "11px",
                            padding: "3px 8px",
                            borderRadius: "10px",
                            backgroundColor: `${theme.colors.accent}15`,
                          }}
                        >
                          Viewing
                        </span>
                      )}
                    </div>
                    <p
                      className="text-[14px] leading-relaxed font-medium line-clamp-3"
                      style={{ color: theme.colors.text }}
                    >
                      {msg.content}
                    </p>
                  </button>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-60">
              <MessageSquare
                size={32}
                style={{
                  color: theme.colors.textSecondary,
                  marginBottom: "16px",
                }}
                strokeWidth={1.5}
              />
              <p className="font-semibold" style={{ color: theme.colors.text }}>
                It's quiet here
              </p>
              <p
                className="text-[13px] mt-1 text-center px-4"
                style={{ color: theme.colors.textSecondary }}
              >
                Your asked questions will appear here as you chat.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviousQuestionsDrawer;
