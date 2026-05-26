import React, { useState, useEffect, useRef } from "react";
import {
  TriangleAlert,
  Edit3,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  BsHandThumbsUp,
  BsHandThumbsUpFill,
  BsHandThumbsDown,
  BsHandThumbsDownFill,
} from "react-icons/bs";
import CustomTooltip from "./CustomTooltip";
import { Theme } from "../types";
import axios from "axios";
import { API_URL } from "../config";
import { toast } from "react-toastify";

interface DashboardErrorProps {
  question: string;
  errorMessage: string;
  theme: Theme;
  onEditQuestion: (newQuestion: string) => void;
  onRetry: () => void;
  sessionConErr?: boolean;
  botResponseId: string;
  questionMessageId: string;
  reaction: "like" | "dislike" | null;
  onUpdateReaction: (
    questionMessageId: string,
    reaction: "like" | "dislike" | null,
    dislike_reason: string | null,
  ) => void;
}

const DashboardError: React.FC<DashboardErrorProps> = ({
  question,
  errorMessage,
  theme,
  onEditQuestion,
  onRetry,
  sessionConErr = false,
  botResponseId,
  questionMessageId,
  reaction,
  onUpdateReaction,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState(question);
  const [showDislikeOptions, setShowDislikeOptions] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customReason, setCustomReason] = useState("");
  const dislikeRef = useRef<HTMLDivElement>(null);

  const isLiked = reaction === "like";
  const isDisliked = reaction === "dislike";

  useEffect(() => {
    if (!isEditing) setEditedQuestion(question);
  }, [question, isEditing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dislikeRef.current &&
        !dislikeRef.current.contains(event.target as Node)
      ) {
        setShowDislikeOptions(false);
        setShowCustomInput(false);
      }
    };
    if (showDislikeOptions)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDislikeOptions]);

  const handleEditClick = () => setIsEditing(true);
  const handleCancelClick = () => {
    setIsEditing(false);
    setEditedQuestion(question);
  };

  const handleSubmitClick = () => {
    if (editedQuestion.trim()) {
      onEditQuestion(editedQuestion);
      setIsEditing(false);
    } else {
      toast.error("Prompt field cannot be empty.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) handleSubmitClick();
    else if (e.key === "Escape") handleCancelClick();
  };

  const handleLike = async () => {
    const newReaction = isLiked ? null : "like";
    try {
      await axios.post(`${API_URL}/api/messages/${botResponseId}/reaction`, {
        token: sessionStorage.getItem("token"),
        reaction: newReaction,
        dislike_reason: null,
      });
      onUpdateReaction(questionMessageId, newReaction, null);
    } catch {
      toast.error("Failed to post reaction metric.");
    }
  };

  const handleDislike = async () => {
    if (isDisliked) {
      try {
        await axios.post(`${API_URL}/api/messages/${botResponseId}/reaction`, {
          token: sessionStorage.getItem("token"),
          reaction: null,
          dislike_reason: null,
        });
        onUpdateReaction(questionMessageId, null, null);
      } catch {
        toast.error("Failed to clear reaction metric.");
      }
    } else {
      setShowDislikeOptions(true);
    }
  };

  const handleDislikeOption = async (reason: string) => {
    try {
      await axios.post(`${API_URL}/api/messages/${botResponseId}/reaction`, {
        token: sessionStorage.getItem("token"),
        reaction: "dislike",
        dislike_reason: reason,
      });
      onUpdateReaction(questionMessageId, "dislike", reason);
      setShowDislikeOptions(false);
      setShowCustomInput(false);
    } catch {
      toast.error("Failed to post discrepancy metric.");
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-transparent animate-fade-in">
      <div
        className="w-full max-w-2xl border rounded-2xl shadow-xl overflow-hidden flex flex-col p-6"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }}
      >
        <div className="text-center pb-4">
          <h1
            className="text-2xl font-semibold tracking-tight mb-2"
            style={{ color: theme.colors.text }}
          >
            Analysis Discrepancy Caught
          </h1>
          <p
            className="text-xs font-semibold max-w-md mx-auto"
            style={{ color: theme.colors.textSecondary }}
          >
            Let's refine your analytical request metrics or trigger a system
            evaluation query to re-index parameters.
          </p>
        </div>

        <div className="flex-1 mt-2">
          {isEditing ? (
            <div className="space-y-4 animate-fade-up">
              <div
                className="p-4 rounded-xl border"
                style={{
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} style={{ color: theme.colors.accent }} />
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: theme.colors.text }}
                  >
                    Refine Metric Parameters
                  </h3>
                </div>
                <textarea
                  value={editedQuestion}
                  onChange={(e) => setEditedQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full p-3 rounded-lg border resize-none focus:outline-none text-sm font-semibold leading-relaxed max-h-28"
                  style={{
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  }}
                  placeholder="Modify query rules..."
                  autoFocus
                />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
                  <p
                    className="text-[11px] font-medium opacity-60 flex items-center gap-1.5"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    <AlertCircle size={13} />
                    <span>Press Ctrl+Enter to submit quickly</span>
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleCancelClick}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
                      style={{
                        color: theme.colors.textSecondary,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surface,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitClick}
                      disabled={!editedQuestion.trim()}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs"
                      style={{ backgroundColor: theme.colors.accent }}
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 animate-fade-up">
              <div
                className="p-4 rounded-xl border"
                style={{
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                }}
              >
                <div
                  className="flex items-center justify-between border-b pb-2 mb-3.5"
                  style={{ borderColor: `${theme.colors.border}60` }}
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle
                      size={16}
                      style={{ color: theme.colors.accent }}
                    />
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: theme.colors.text }}
                    >
                      Your Core Prompt
                    </h3>
                  </div>
                  {!sessionConErr && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleEditClick}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors bg-white dark:bg-slate-900"
                        style={{
                          color: theme.colors.accent,
                          borderColor: `${theme.colors.accent}30`,
                        }}
                      >
                        Modify
                      </button>
                      <button
                        onClick={handleLike}
                        className="p-1 text-slate-400 hover:text-emerald-500 transition-colors"
                      >
                        {isLiked ? (
                          <BsHandThumbsUpFill
                            size={15}
                            style={{ color: theme.colors.success }}
                          />
                        ) : (
                          <BsHandThumbsUp size={15} />
                        )}
                      </button>
                      <div className="relative" ref={dislikeRef}>
                        <button
                          onClick={handleDislike}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          {isDisliked ? (
                            <BsHandThumbsDownFill
                              size={15}
                              style={{ color: theme.colors.error }}
                            />
                          ) : (
                            <BsHandThumbsDown size={15} />
                          )}
                        </button>
                        {showDislikeOptions && (
                          <div
                            className="absolute top-full right-0 mt-1 rounded-xl border z-50 min-w-[180px] overflow-hidden py-1 shadow-lg animate-fade-up"
                            style={{
                              background: theme.colors.surface,
                              borderColor: theme.colors.border,
                            }}
                          >
                            {showCustomInput ? (
                              <div className="p-2.5 flex flex-col gap-2">
                                <textarea
                                  value={customReason}
                                  onChange={(e) =>
                                    setCustomReason(e.target.value)
                                  }
                                  placeholder="Reason description..."
                                  rows={2}
                                  autoFocus
                                  className="w-full text-xs p-2 rounded-lg border focus:outline-none resize-none font-medium"
                                  style={{
                                    color: theme.colors.text,
                                    background: theme.colors.background,
                                    borderColor: theme.colors.border,
                                  }}
                                />
                                <div className="flex justify-end gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
                                  <button
                                    onClick={() => {
                                      setShowCustomInput(false);
                                      setCustomReason("");
                                    }}
                                    style={{
                                      color: theme.colors.textSecondary,
                                    }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (customReason.trim()) {
                                        handleDislikeOption(customReason);
                                        setCustomReason("");
                                      }
                                    }}
                                    className="px-2 py-0.5 rounded text-white bg-indigo-600"
                                  >
                                    Submit
                                  </button>
                                </div>
                              </div>
                            ) : (
                              [
                                "Incorrect data",
                                "Takes too long",
                                "Irrelevant response",
                                "Confusing answer",
                                "Other",
                              ].map((reason) => (
                                <button
                                  key={reason}
                                  onClick={() =>
                                    reason === "Other"
                                      ? setShowCustomInput(true)
                                      : handleDislikeOption(reason)
                                  }
                                  className="w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                  style={{ color: theme.colors.text }}
                                >
                                  {reason}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <blockquote
                  className="text-sm font-semibold italic pl-4 border-l-4 break-all"
                  style={{
                    color: theme.colors.text,
                    borderLeftColor: theme.colors.accent,
                  }}
                >
                  "{question}"
                </blockquote>
              </div>

              {/* Error Details Diagnostics Box */}
              <div
                className="p-4 rounded-xl border animate-fade-up"
                style={{
                  backgroundColor: theme.mode === 'light' ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255, 255, 255, 0.02)',
                  borderColor: theme.colors.border,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TriangleAlert
                      size={16}
                      style={{ color: theme.colors.error }}
                    />
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: theme.colors.text }}
                    >
                      Diagnostic Trace
                    </h3>
                  </div>
                  {!sessionConErr && (
                    <button
                      onClick={onRetry}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-xs transition-transform active:scale-95"
                      style={{ backgroundColor: theme.colors.accent }}
                    >
                      <RefreshCw size={12} />
                      <span>Re-index</span>
                    </button>
                  )}
                </div>
                <div
                  className="p-2.5 rounded-lg font-mono text-xs leading-relaxed max-h-36 overflow-y-auto shadow-inner bg-black/5 dark:bg-black/30"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {errorMessage}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardError;
