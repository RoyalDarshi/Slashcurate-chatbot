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
      className="relative w-full overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${theme.colors.background}20, ${theme.colors.surface}40, ${theme.colors.background}20)`,
      }}
    >
      {/* Animated Background Elements */}
      {/* <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-5 animate-pulse"
          style={{ backgroundColor: theme.colors.error }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-5 animate-bounce"
          style={{ backgroundColor: theme.colors.accent }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-4 h-4 rounded-full opacity-20 animate-ping"
          style={{ backgroundColor: theme.colors.error }}
        />
        <div
          className="absolute bottom-1/3 left-1/4 w-2 h-2 rounded-full opacity-30 animate-pulse"
          style={{ backgroundColor: theme.colors.accent }}
        />
      </div> */}

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 py-8">
        <div
          className="w-full max-w-2xl mx-auto backdrop-blur-xl rounded-2xl shadow-2xl border transform transition-all duration-500 hover:scale-[1.01]"
          style={{
            backgroundColor: `${theme.colors.surface}95`,
            borderColor: `${theme.colors.border}40`,
            boxShadow: `0 20px 40px -12px ${theme.colors.background}40, 0 0 0 1px ${theme.colors.border}20`,
          }}
        >
          {/* Header Section */}
          <div className="text-center pt-8 pb-6 px-6">
            {/* Animated Error Icon */}
            <div className="relative inline-flex items-center justify-center mb-6">
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{ backgroundColor: `${theme.colors.error}20` }}
              />
              <div
                className="relative p-4 rounded-full shadow-lg"
                style={{
                  backgroundColor: `${theme.colors.error}15`,
                  border: `2px solid ${theme.colors.error}30`,
                }}
              >
                <TriangleAlert
                  size={48}
                  className="animate-bounce"
                  style={{ color: theme.colors.error }}
                />
              </div>
            </div>

            {/* Title and Subtitle */}
            <h1
              className="text-3xl font-black mb-3 tracking-tight bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${theme.colors.error}, ${theme.colors.error}80)`,
              }}
            >
              Oops! Something went wrong
            </h1>

            <p
              className="text-base leading-relaxed max-w-lg mx-auto opacity-80"
              style={{ color: theme.colors.textSecondary }}
            >
              Let's refine your question and get you back on track.
            </p>
          </div>

          {/* Content Section */}
          <div className="px-6 pb-8">
            {isEditing ? (
              <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-300">
                {/* Edit Form */}
                <div
                  className="p-6 rounded-xl border-2 border-dashed transition-all duration-300"
                  style={{
                    backgroundColor: `${theme.colors.background}60`,
                    borderColor: `${theme.colors.accent}40`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Edit3 size={18} style={{ color: theme.colors.accent }} />
                    <h3
                      className="text-lg font-bold"
                      style={{ color: theme.colors.text }}
                    >
                      Refine Your Question
                    </h3>
                  </div>

                  <textarea
                    value={editedQuestion}
                    onChange={(e) => setEditedQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full p-4 rounded-lg resize-none focus:outline-none focus:ring-2 transition-all duration-300 font-medium"
                    style={{
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text,
                      border: `2px solid ${theme.colors.border}`,
                      focusRing: `0 0 0 2px ${theme.colors.accent}20`,
                      minHeight: "120px",
                    }}
                    placeholder="What would you like to know?"
                    autoFocus
                  />

                  <div className="flex items-center justify-between mt-4">
                    <p
                      className="text-xs opacity-70 flex items-center gap-1"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      <AlertCircle size={12} />
                      Ctrl+Enter to submit
                    </p>

                    <div className="flex gap-3">
                      <button
                        onClick={handleCancelClick}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                        style={{
                          backgroundColor: `${theme.colors.secondary}20`,
                          color: theme.colors.textSecondary,
                          border: `1px solid ${theme.colors.border}`,
                        }}
                      >
                        <X size={16} />
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitClick}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:hover:scale-100"
                        style={{
                          backgroundColor: theme.colors.accent,
                          color: theme.colors.surface,
                          boxShadow: `0 4px 12px ${theme.colors.accent}40`,
                        }}
                        disabled={!editedQuestion.trim()}
                      >
                        <RefreshCw size={16} />
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Question Card */}
                <div
                  className="group p-6 rounded-xl transition-all duration-300 hover:shadow-lg relative overflow-hidden"
                  style={{
                    backgroundColor: `${theme.colors.background}80`,
                    border: `2px solid ${theme.colors.accent}30`,
                  }}
                >
                  <div
                    className="absolute top-0 left-0 w-full h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
                    style={{ backgroundColor: theme.colors.accent }}
                  />

                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${theme.colors.accent}20` }}
                    >
                      <AlertCircle
                        size={18}
                        style={{ color: theme.colors.accent }}
                      />
                    </div>
                    <div>
                      <h3
                        className="text-lg font-bold mb-1"
                        style={{ color: theme.colors.text }}
                      >
                        Your Question
                      </h3>
                      <p
                        className="text-sm opacity-70"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        What we tried to process
                      </p>
                    </div>
                  </div>

                  <blockquote
                    className="text-base italic leading-relaxed mb-4 pl-4 border-l-4"
                    style={{
                      color: theme.colors.text,
                      borderLeftColor: theme.colors.accent,
                    }}
                  >
                    "{question}"
                  </blockquote>

                  <button
                    onClick={handleEditClick}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: `${theme.colors.accent}15`,
                      color: theme.colors.accent,
                      border: `1px solid ${theme.colors.accent}40`,
                    }}
                  >
                    <Edit3 size={16} />
                    Edit & Retry
                  </button>
                </div>

                {/* Error Details Card */}
                <div
                  className="p-6 rounded-xl transition-all duration-300 hover:shadow-lg relative overflow-hidden"
                  style={{
                    backgroundColor: `${theme.colors.error}08`,
                    border: `2px solid ${theme.colors.error}30`,
                  }}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${theme.colors.error}20` }}
                    >
                      <TriangleAlert
                        size={18}
                        style={{ color: theme.colors.error }}
                      />
                    </div>
                    <div>
                      <h3
                        className="text-lg font-bold mb-1"
                        style={{ color: theme.colors.error }}
                      >
                        Error Details
                      </h3>
                      <p
                        className="text-sm opacity-70"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        Technical information
                      </p>
                    </div>
                  </div>

                  <div
                    className="p-4 rounded-lg font-mono text-sm leading-relaxed break-all"
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
