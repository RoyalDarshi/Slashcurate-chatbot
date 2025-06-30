import React, { useState, useEffect } from "react";
import {
  TriangleAlert,
  Edit3,
  X,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Theme } from "../types";

interface DashboardErrorProps {
  question: string;
  errorMessage: string;
  theme: Theme;
  onEditQuestion: (newQuestion: string) => void;
}

const DashboardError: React.FC<DashboardErrorProps> = ({
  question,
  errorMessage,
  theme,
  onEditQuestion,
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
      className=" h-full"
      style={{
        background: `linear-gradient(135deg, ${theme.colors.background}20, ${theme.colors.surface}40, ${theme.colors.background}20)`,
      }}
    >
      {/* Main Content Container - Uses full viewport height */}
      <div className="flex flex-col items-center justify-center h-full p-2">
        <div
          className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto backdrop-blur-xl rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl border transform transition-all duration-500 max-h-full overflow-hidden flex flex-col"
          style={{
            backgroundColor: `${theme.colors.surface}95`,
            borderColor: `${theme.colors.border}40`,
            boxShadow: `0 10px 25px -6px ${theme.colors.background}40, 0 0 0 1px ${theme.colors.border}20`,
          }}
        >
          {/* Header Section - Compact on mobile */}
          <div className="text-center pt-4 pb-3 sm:pb-4 md:pb-6 px-3 sm:px-4 md:px-6 flex-shrink-0">
            {/* Animated Error Icon - Smaller on mobile */}
            {/* <div className="relative inline-flex items-center justify-center mb-3 sm:mb-4 md:mb-6">
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{ backgroundColor: `${theme.colors.error}20` }}
              />
              <div
                className="relative p-2 sm:p-3 md:p-4 rounded-full shadow-lg"
                style={{
                  backgroundColor: `${theme.colors.error}15`,
                  border: `2px solid ${theme.colors.error}30`,
                }}
              >
                <TriangleAlert
                  size={
                    window.innerWidth < 640
                      ? 32
                      : window.innerWidth < 768
                      ? 40
                      : 48
                  }
                  className="animate-bounce"
                  style={{ color: theme.colors.error }}
                />
              </div>
            </div> */}

            {/* Title and Subtitle - Responsive text sizes */}
            <h1
              className="text-xl sm:text-2xl md:text-3xl font-black mb-2 sm:mb-3 tracking-tight bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${theme.colors.error}, ${theme.colors.error}80)`,
              }}
            >
              Oops! Something went wrong
            </h1>

            <p
              className="text-sm sm:text-base leading-relaxed max-w-xs sm:max-w-sm md:max-w-lg mx-auto opacity-80"
              style={{ color: theme.colors.textSecondary }}
            >
              Let's refine your question and get you back on track.
            </p>
          </div>

          {/* Content Section - Scrollable if needed */}
          <div className="px-3 sm:px-4 md:px-6 pb-4 flex-1 overflow-y-auto">
            {isEditing ? (
              <div className="space-y-2 animate-in fade-in-50 slide-in-from-bottom-4 duration-300">
                {/* Edit Form */}
                <div
                  className="p-4  rounded-lg sm:rounded-xl border-2 border-dashed transition-all duration-300"
                  style={{
                    backgroundColor: `${theme.colors.background}60`,
                    borderColor: `${theme.colors.accent}40`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <Edit3 size={16} style={{ color: theme.colors.accent }} />
                    <h3
                      className="text-base sm:text-lg font-bold"
                      style={{ color: theme.colors.text }}
                    >
                      Refine Your Question
                    </h3>
                  </div>

                  <textarea
                    value={editedQuestion}
                    onChange={(e) => setEditedQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full p-3 sm:p-4 rounded-lg resize-none focus:outline-none focus:ring-2 transition-all duration-300 font-medium text-sm sm:text-base"
                    style={{
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text,
                      border: `2px solid ${theme.colors.border}`,
                      focusRing: `0 0 0 2px ${theme.colors.accent}20`,
                      minHeight: "80px",
                      maxHeight: "120px",
                    }}
                    placeholder="What would you like to know?"
                    autoFocus
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-1">
                    <p
                      className="text-xs opacity-70 flex items-center gap-1 order-2 sm:order-1"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      <AlertCircle size={12} />
                      <span className="hidden sm:inline">
                        Ctrl+Enter to submit
                      </span>
                      <span className="sm:hidden">Tap Try Again</span>
                    </p>

                    <div className="flex gap-2 sm:gap-3 order-1 sm:order-2">
                      <button
                        onClick={handleCancelClick}
                        className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 text-sm sm:text-base"
                        style={{
                          backgroundColor: `${theme.colors.surface}20`,
                          color: theme.colors.textSecondary,
                          border: `1px solid ${theme.colors.border}`,
                        }}
                      >
                        <X size={14} />
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitClick}
                        className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:hover:scale-100 text-sm sm:text-base"
                        style={{
                          backgroundColor: theme.colors.accent,
                          color: theme.colors.surface,
                          boxShadow: `0 4px 12px ${theme.colors.accent}40`,
                        }}
                        disabled={!editedQuestion.trim()}
                      >
                        <RefreshCw size={14} />
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Question Card */}
                <div
                  className="group p-2 rounded-lg sm:rounded-xl transition-all duration-300 hover:shadow-lg relative overflow-hidden"
                  style={{
                    backgroundColor: `${theme.colors.background}80`,
                    border: `2px solid ${theme.colors.accent}30`,
                  }}
                >
                  <div
                    className="absolute top-0 left-0 w-full h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
                    style={{ backgroundColor: theme.colors.accent }}
                  />

                  <div className="flex items-start gap-2">
                    <div
                      className="p-1.5 sm:p-2 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: `${theme.colors.accent}20` }}
                    >
                      <AlertCircle
                        size={16}
                        style={{ color: theme.colors.accent }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-base sm:text-lg font-bold mb-1"
                        style={{ color: theme.colors.text }}
                      >
                        Your Question
                      </h3>
                      <p
                        className="text-xs sm:text-sm opacity-70"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        What we tried to process
                      </p>
                    </div>
                  </div>

                  <blockquote
                    className="text-sm sm:text-base italic leading-relaxed mb-3 sm:mb-4 pl-3 sm:pl-4 border-l-4 break-words"
                    style={{
                      color: theme.colors.text,
                      borderLeftColor: theme.colors.accent,
                    }}
                  >
                    "{question}"
                  </blockquote>

                  <button
                    onClick={handleEditClick}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 text-sm sm:text-base"
                    style={{
                      backgroundColor: `${theme.colors.accent}15`,
                      color: theme.colors.accent,
                      border: `1px solid ${theme.colors.accent}40`,
                    }}
                  >
                    <Edit3 size={14} />
                    Edit
                  </button>
                </div>

                {/* Error Details Card - Collapsible on mobile */}
                <div
                  className="p-3 rounded-lg sm:rounded-xl transition-all duration-300 hover:shadow-lg relative overflow-hidden"
                  style={{
                    backgroundColor: `${theme.colors.error}08`,
                    border: `2px solid ${theme.colors.error}30`,
                  }}
                >
                  <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div
                      className="p-1.5 sm:p-2 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: `${theme.colors.error}20` }}
                    >
                      <TriangleAlert
                        size={16}
                        style={{ color: theme.colors.error }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-base sm:text-lg font-bold mb-1"
                        style={{ color: theme.colors.error }}
                      >
                        Error Details
                      </h3>
                      <p
                        className="text-xs sm:text-sm opacity-70"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        Technical information
                      </p>
                    </div>
                  </div>

                  <div
                    className="p-3 sm:p-4 rounded-lg font-mono text-xs sm:text-sm leading-relaxed break-all max-h-32 sm:max-h-40 overflow-y-auto"
                    style={{
                      backgroundColor: `${theme.colors.background}40`,
                      color: theme.colors.error,
                      border: `1px solid ${theme.colors.error}20`,
                    }}
                  >
                    {errorMessage}
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
