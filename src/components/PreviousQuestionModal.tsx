import React, { useCallback } from "react";
import { X, MessageSquare, Clock, ChevronRight } from "lucide-react";
import { Theme } from "../types";
import { Message } from "../types";

interface PreviousQuestionsModalProps {
  showPrevQuestionsModal: boolean;
  onClose: () => void;
  userQuestionsFromSession: Message[];
  handleSelectPrevQuestion: (messageId: string) => void;
  theme: Theme;
  currentQuestionId?: string | null;
}

const PreviousQuestionsModal: React.FC<PreviousQuestionsModalProps> = ({
  showPrevQuestionsModal,
  onClose,
  userQuestionsFromSession,
  handleSelectPrevQuestion,
  theme,
  currentQuestionId,
}) => {
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <style>
        {`
        @keyframes modalAppear {
          from { 
            opacity: 0; 
            transform: scale(0.9) translateY(-20px);
            backdrop-filter: blur(0px);
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0);
            backdrop-filter: blur(12px);
          }
        }
        
        @keyframes slideIn {
          from { 
            transform: translateY(30px); 
            opacity: 0; 
          }
          to { 
            transform: translateY(0); 
            opacity: 1; 
          }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .modal-container {
          animation: modalAppear 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .question-item {
          animation: slideIn 0.4s ease-out forwards;
          position: relative;
          overflow: hidden;
        }
        
        .question-item:hover::before {
          content: '';
          position: absolute;
          top: 0;
          left: -200%;
          width: 200%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          animation: shimmer 1.5s ease-in-out;
          z-index: 1;
        }
        
        .current-indicator {
          background: linear-gradient(45deg, #3b82f6, #8b5cf6, #06b6d4);
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        `}
      </style>

      <div
        className="modal-container rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.surface}f0, ${theme.colors.surface}e0)`,
          backdropFilter: "blur(20px)",
          border: `1px solid ${theme.colors.border}40`,
          boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px ${theme.colors.border}20`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b relative"
          style={{
            borderColor: `${theme.colors.border}30`,
            background: `linear-gradient(90deg, ${theme.colors.surface}20, transparent)`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl"
              style={{
                backgroundColor: `${theme.colors.accent}15`,
                border: `1px solid ${theme.colors.accent}30`,
              }}
            >
              <MessageSquare size={20} style={{ color: theme.colors.accent }} />
            </div>
            <div>
              <h3
                className="font-bold tracking-tight"
                style={{
                  color: theme.colors.text,
                  fontSize: "1.125rem",
                }}
              >
                Conversation History
              </h3>
              <p
                className="text-xs opacity-70"
                style={{ color: theme.colors.textSecondary }}
              >
                {userQuestionsFromSession.length} question
                {userQuestionsFromSession.length !== 1 ? "s" : ""} in this
                session
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 group"
            style={{
              backgroundColor: `${theme.colors.surface}80`,
              color: theme.colors.textSecondary,
              border: `1px solid ${theme.colors.border}30`,
            }}
            aria-label="Close modal"
          >
            <X
              size={18}
              className="group-hover:rotate-90 transition-transform duration-200"
            />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {userQuestionsFromSession.length > 0 ? (
            userQuestionsFromSession.map((msg, index) => {
              const isCurrentQuestion = msg.id === currentQuestionId;

              return (
                <div
                  key={msg.id}
                  className="question-item"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <button
                    onClick={() => handleSelectPrevQuestion(msg.id)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-300 
                    hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 
                    group relative overflow-hidden ${isCurrentQuestion ? "ring-2" : ""
                      }
                    `}
                    style={{
                      backgroundColor: isCurrentQuestion
                        ? `${theme.colors.accent}20`
                        : `${theme.colors.bubbleBot}60`,
                      color: isCurrentQuestion
                        ? theme.colors.accent
                        : theme.colors.bubbleBotText,
                      border: `1px solid ${isCurrentQuestion
                        ? theme.colors.accent
                        : theme.colors.border
                        }40`,
                      boxShadow: isCurrentQuestion
                        ? `0 8px 25px -5px ${theme.colors.accent}40, 0 0 0 1px ${theme.colors.accent}30`
                        : `0 4px 15px -3px rgba(0, 0, 0, 0.1)`,
                      ringColor: theme.colors.accent,
                    }}
                  >
                    {/* Current question indicator */}
                    {isCurrentQuestion && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 current-indicator rounded-r-full" />
                    )}

                    <div className="flex items-start justify-between gap-3 relative z-10">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {isCurrentQuestion && (
                            <div
                              className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: theme.colors.accent,
                                color: "white",
                              }}
                            >
                              Current
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-xs opacity-60">
                            <Clock size={12} />
                            <span>{formatTimeAgo(msg.timestamp)}</span>
                          </div>
                        </div>

                        <p
                          className="font-medium leading-relaxed"
                          style={{
                            fontSize: "0.95rem",
                            fontWeight: isCurrentQuestion ? "600" : "500",
                          }}
                        >
                          {truncateText(msg.content, 120)}
                        </p>
                      </div>

                      <ChevronRight
                        size={16}
                        className="opacity-40 group-hover:opacity-70 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0"
                      />
                    </div>
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                style={{
                  backgroundColor: `${theme.colors.textSecondary}10`,
                  border: `1px solid ${theme.colors.border}30`,
                }}
              >
                <MessageSquare
                  size={24}
                  style={{ color: theme.colors.textSecondary, opacity: 0.5 }}
                />
              </div>
              <p
                className="font-medium mb-2"
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: "1rem",
                }}
              >
                No questions yet
              </p>
              <p
                className="text-sm opacity-70"
                style={{ color: theme.colors.textSecondary }}
              >
                Your conversation history will appear here
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="p-6 border-t flex justify-between items-center"
          style={{
            borderColor: `${theme.colors.border}30`,
            background: `linear-gradient(90deg, transparent, ${theme.colors.surface}20, transparent)`,
          }}
        >
          <p
            className="text-xs opacity-60"
            style={{ color: theme.colors.textSecondary }}
          >
            Click any question to navigate to it
          </p>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 
            hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 group"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accent}e0)`,
              color: "white",
              boxShadow: `0 4px 15px -3px ${theme.colors.accent}40`,
              ringColor: theme.colors.accent,
            }}
          >
            <span className="group-hover:scale-105 transition-transform duration-200 inline-block">
              Done
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviousQuestionsModal;
