import React, { useState, useEffect } from "react";
import {
  TriangleAlert,
  Edit3,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Theme } from "../types";

interface DashboardErrorProps {
  question: string;
  errorMessage: string;
  theme: Theme;
  onEditQuestion: (newQuestion: string) => void;
  onRetry: () => void;
  sessionConErr?: boolean; // Optional prop for session connection error
}

const DashboardError: React.FC<DashboardErrorProps> = ({
  question,
  errorMessage,
  theme,
  onEditQuestion,
  onRetry,
  sessionConErr = false, // Default to false if not provided
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState(question);

  useEffect(() => {
    if (!isEditing) {
      setEditedQuestion(question);
    }
  }, [question, isEditing]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setEditedQuestion(question);
  };

  const handleSubmitClick = () => {
    if (editedQuestion.trim()) {
      onEditQuestion(editedQuestion);
      setIsEditing(false);
    } else {
      alert("Question cannot be empty.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSubmitClick();
    } else if (e.key === "Escape") {
      handleCancelClick();
    }
  };

  return (
    <div
      className="h-full"
      style={{
        background: `radial-gradient(ellipse at top, ${theme.colors.background}10, ${theme.colors.surface}20, ${theme.colors.background}40)`,
      }}
    >
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div
          className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl border transform transition-all duration-700 overflow-hidden flex flex-col"
          style={{
            backgroundColor: `${theme.colors.surface}98`,
            borderColor: `${theme.colors.border}30`,
            boxShadow: `
              0 25px 50px -12px ${theme.colors.background}60,
              0 0 0 1px ${theme.colors.border}20,
              inset 0 1px 0 ${theme.colors.surface}40
            `,
          }}
        >
          {/* Header with gradient overlay */}
          <div className=" text-center p-2 ">
            <div
              className="absolute inset-0 opacity-5"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.error}20, transparent)`,
              }}
            />

            {/* Icon with animated glow */}
            {/* <div className="relative inline-flex items-center justify-center mb-4">
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-30 animate-pulse"
                style={{ backgroundColor: theme.colors.error }}
              />
              <div
                className="relative p-4 rounded-2xl backdrop-blur-sm border"
                style={{
                  backgroundColor: `${theme.colors.error}15`,
                  borderColor: `${theme.colors.error}30`,
                }}
              >
                <TriangleAlert
                  size={32}
                  style={{ color: theme.colors.error }}
                  className="animate-pulse"
                />
              </div>
            </div> */}

            <h1
              className="text-2xl sm:text-3xl md:text-4xl font-black mb-2 tracking-tight bg-clip-text text-transparent leading-tight"
              style={{
                backgroundImage: `linear-gradient(135deg, ${theme.colors.error}`,
              }}
            >
              Oops! Something went wrong
            </h1>
            <p
              className="text-sm sm:text-base md:text-lg leading-relaxed max-w-sm md:max-w-lg mx-auto opacity-80 font-medium"
              style={{ color: theme.colors.textSecondary }}
            >
              Don't worry! Let's refine your question or give it another try to
              get you back on track.
            </p>
          </div>

          {/* Content area with improved spacing */}
          <div className="p-3 flex-1 overflow-y-auto">
            {isEditing ? (
              <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-8 duration-500">
                <div
                  className="relative p-6 rounded-2xl border-2 border-dashed transition-all duration-500 hover:shadow-xl group"
                  style={{
                    backgroundColor: `${theme.colors.background}80`,
                    borderColor: `${theme.colors.accent}40`,
                  }}
                >
                  {/* Subtle gradient overlay */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-5 group-hover:opacity-10 transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(135deg, ${theme.colors.accent}30, transparent)`,
                    }}
                  />

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-5">
                      <div
                        className="p-2 rounded-xl"
                        style={{ backgroundColor: `${theme.colors.accent}20` }}
                      >
                        <Sparkles
                          size={20}
                          style={{ color: theme.colors.accent }}
                        />
                      </div>
                      <h3
                        className="text-lg sm:text-xl font-bold"
                        style={{ color: theme.colors.text }}
                      >
                        Refine Your Question
                      </h3>
                    </div>
                    <textarea
                      value={editedQuestion}
                      onChange={(e) => setEditedQuestion(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full p-4 sm:p-5 rounded-xl resize-none focus:outline-none focus:ring-4 transition-all duration-300 font-medium text-sm sm:text-base leading-relaxed"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `2px solid ${theme.colors.border}40`,
                        boxShadow: `inset 0 2px 4px ${theme.colors.background}20`,
                        minHeight: "100px",
                        maxHeight: "140px",
                      }}
                      placeholder="What would you like to know? Be as specific as possible..."
                      autoFocus
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
                      <p
                        className="text-xs opacity-70 flex items-center gap-2 order-2 sm:order-1"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        <AlertCircle size={14} />
                        <span className="hidden sm:inline">
                          Press Ctrl+Enter to submit quickly
                        </span>
                        <span className="sm:hidden">
                          Tap "Try Again" when ready
                        </span>
                      </p>
                      <div className="flex gap-3 order-1 sm:order-2">
                        <button
                          onClick={handleCancelClick}
                          className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95 text-sm sm:text-base shadow-sm hover:shadow-md"
                          style={{
                            backgroundColor: `${theme.colors.surface}40`,
                            color: theme.colors.textSecondary,
                            border: `2px solid ${theme.colors.border}40`,
                          }}
                        >
                          <X size={16} />
                          Cancel
                        </button>
                        <button
                          onClick={handleSubmitClick}
                          className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100 text-sm sm:text-base relative overflow-hidden"
                          style={{
                            backgroundColor: theme.colors.accent,
                            color: "white",
                            boxShadow: `0 8px 25px ${theme.colors.accent}40`,
                          }}
                          disabled={!editedQuestion.trim()}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                          <RefreshCw size={16} />
                          Try Again
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Question section with enhanced styling */}
                <div
                  className="group relative p-2 rounded-2xl transition-all duration-500 hover:shadow-2xl overflow-hidden"
                  style={{
                    backgroundColor: `${theme.colors.background}90`,
                    border: `2px solid ${theme.colors.accent}25`,
                  }}
                >
                  {/* Animated top border */}
                  <div
                    className="absolute top-0 left-0 h-1 bg-gradient-to-r transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out"
                    style={{
                      background: `linear-gradient(90deg, ${theme.colors.accent}, ${theme.colors.accent}60, ${theme.colors.accent})`,
                      width: "100%",
                    }}
                  />

                  {/* Subtle glow effect */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at center, ${theme.colors.accent}, transparent)`,
                    }}
                  />

                  <div className="relative z-10">
                    <div className="flex items-start gap-2 mb-2">
                      <div
                        className="p-3 rounded-xl flex-shrink-0 shadow-lg"
                        style={{ backgroundColor: `${theme.colors.accent}15` }}
                      >
                        <AlertCircle
                          size={20}
                          style={{ color: theme.colors.accent }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3
                          className="text-lg sm:text-xl font-bold mb-2"
                          style={{ color: theme.colors.text }}
                        >
                          Your Question
                        </h3>
                        <p
                          className="text-sm opacity-70"
                          style={{ color: theme.colors.textSecondary }}
                        >
                          What we attempted to process
                        </p>
                      </div>
                    </div>

                    <blockquote
                      className="text-sm sm:text-base leading-relaxed mb-2 pl-5 border-l-4 break-words font-medium italic"
                      style={{
                        color: theme.colors.text,
                        borderLeftColor: theme.colors.accent,
                        backgroundColor: `${theme.colors.surface}30`,
                        padding: "14px 16px",
                        borderRadius: "0 12px 12px 0",
                      }}
                    >
                      "{question}"
                    </blockquote>

                    {!sessionConErr && (
                      <button
                        onClick={handleEditClick}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95 text-sm sm:text-base shadow-md hover:shadow-lg"
                        style={{
                          backgroundColor: `${theme.colors.accent}12`,
                          color: theme.colors.accent,
                          border: `2px solid ${theme.colors.accent}30`,
                        }}
                      >
                        <Edit3 size={16} />
                        Edit Question
                      </button>
                    )}
                  </div>
                </div>

                {/* Error section with enhanced styling */}
                <div
                  className="relative p-2 rounded-2xl transition-all duration-500 hover:shadow-2xl overflow-hidden"
                  style={{
                    backgroundColor: `${theme.colors.error}06`,
                    border: `2px solid ${theme.colors.error}25`,
                  }}
                >
                  {/* Error glow effect */}
                  <div
                    className="absolute inset-0 opacity-5"
                    style={{
                      background: `radial-gradient(circle at top right, ${theme.colors.error}20, transparent)`,
                    }}
                  />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-start gap-2">
                        <div
                          className="p-3 rounded-xl flex-shrink-0 shadow-lg"
                          style={{ backgroundColor: `${theme.colors.error}15` }}
                        >
                          <TriangleAlert
                            size={20}
                            style={{ color: theme.colors.error }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3
                            className="text-lg sm:text-xl font-bold mb-2"
                            style={{ color: theme.colors.error }}
                          >
                            Error Details
                          </h3>
                          <p
                            className="text-sm opacity-70"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            Technical information for debugging
                          </p>
                        </div>
                      </div>
                      {!sessionConErr && (
                        <button
                          onClick={onRetry}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 text-sm sm:text-base shadow-lg hover:shadow-xl relative overflow-hidden"
                          style={{
                            backgroundColor: theme.colors.accent,
                            color: "white",
                            boxShadow: `0 8px 25px ${theme.colors.accent}40`,
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                          <RefreshCw size={16} />
                          Retry
                        </button>
                      )}
                    </div>

                    <div
                      className="p-3 rounded-xl font-mono text-xs sm:text-sm leading-relaxed break-all max-h-40 sm:max-h-48 overflow-y-auto shadow-inner"
                      style={{
                        backgroundColor: `${theme.colors.background}60`,
                        color: theme.colors.error,
                        border: `1px solid ${theme.colors.error}20`,
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      {errorMessage}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardError;
