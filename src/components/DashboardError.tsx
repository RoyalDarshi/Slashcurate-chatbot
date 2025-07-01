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
  initialReaction: "like" | "dislike" | null;
}

const DashboardError: React.FC<DashboardErrorProps> = ({
  question,
  errorMessage,
  theme,
  onEditQuestion,
  onRetry,
  sessionConErr = false,
  botResponseId,
  initialReaction,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState(question);
  const [isLiked, setIsLiked] = useState(initialReaction === "like");
  const [isDisliked, setIsDisliked] = useState(initialReaction === "dislike");
  const [showDislikeOptions, setShowDislikeOptions] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customReason, setCustomReason] = useState("");
  const dislikeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setEditedQuestion(question);
    }
  }, [question, isEditing]);

  useEffect(() => {
    setIsLiked(initialReaction === "like");
    setIsDisliked(initialReaction === "dislike");
  }, [initialReaction]);

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
    if (showDislikeOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDislikeOptions]);

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

  const handleLike = async () => {
    const newReaction = isLiked ? null : "like";
    try {
      await axios.post(`${API_URL}/api/messages/${botResponseId}/reaction`, {
        token: sessionStorage.getItem("token"),
        reaction: newReaction,
        dislike_reason: null,
      });
      setIsLiked(!isLiked);
      setIsDisliked(false);
    } catch (error) {
      console.error("Error setting like reaction:", error);
      toast.error("Failed to set like reaction.");
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
        setIsDisliked(false);
        setIsLiked(false);
        setShowDislikeOptions(false);
        setShowCustomInput(false);
      } catch (error) {
        console.error("Error removing dislike reaction:", error);
        toast.error("Failed to remove dislike reaction.");
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
      setIsDisliked(true);
      setIsLiked(false);
      setShowDislikeOptions(false);
      setShowCustomInput(false);
    } catch (error) {
      console.error("Error setting dislike reaction:", error);
      toast.error("Failed to set dislike reaction.");
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
          <div className="text-center p-2">
            <div
              className="absolute inset-0 opacity-5"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.error}20, transparent)`,
              }}
            />
            <h1
              className="text-2xl sm:text-3xl md:text-4xl font-black mb-2 tracking-tight bg-clip-text text-transparent leading-tight"
              style={{
                backgroundImage: `linear-gradient(135deg, ${theme.colors.error}`,
              }}
            >
              Oops! Something went wrong
            </h1>
            <p
              className="text-sm sm:text-base md:text-lg leading-relaxed max-w-sm

System: md:max-w-lg mx-auto opacity-80 font-medium"
              style={{ color: theme.colors.textSecondary }}
            >
              Don't worry! Let's refine your question or give it another try to
              get you back on track.
            </p>
          </div>

          <div className="p-3 flex-1">
            {isEditing ? (
              <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-8 duration-500">
                <div
                  className="relative p-6 rounded-2xl border-2 border-dashed transition-all duration-500 hover:shadow-xl group"
                  style={{
                    backgroundColor: `${theme.colors.background}80`,
                    borderColor: `${theme.colors.accent}40`,
                  }}
                >
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
              <div className="space-y-2 relative">
                <div
                  className="group p-2 rounded-2xl transition-all duration-500 hover:shadow-2xl"
                  style={{
                    backgroundColor: `${theme.colors.background}90`,
                    border: `2px solid ${theme.colors.accent}25`,
                  }}
                >
                  <div
                    className="absolute top-0 left-0 h-1 bg-gradient-to-r transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out"
                    style={{
                      background: `linear-gradient(90deg, ${theme.colors.accent}, ${theme.colors.accent}60, ${theme.colors.accent})`,
                      width: "100%",
                    }}
                  />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at center, ${theme.colors.accent}, transparent)`,
                    }}
                  />
                  <div>
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
                    <div className="flex items-center gap-2 mt-2 relative">
                      {!sessionConErr && (
                        <>
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
                          <CustomTooltip
                            title={
                              isLiked ? "Remove like" : "Like this response"
                            }
                            position="bottom"
                          >
                            <button
                              onClick={handleLike}
                              className="p-2 rounded-md"
                            >
                              {isLiked ? (
                                <BsHandThumbsUpFill
                                  size={20}
                                  style={{ color: theme.colors.textSecondary }}
                                />
                              ) : (
                                <BsHandThumbsUp
                                  size={20}
                                  style={{ color: theme.colors.textSecondary }}
                                />
                              )}
                            </button>
                          </CustomTooltip>
                          <div className="relative" ref={dislikeRef}>
                            <CustomTooltip
                              title={
                                isDisliked
                                  ? "Remove dislike"
                                  : "Dislike this response"
                              }
                              position="bottom"
                            >
                              <button
                                onClick={handleDislike}
                                className="p-2 rounded-md"
                              >
                                {isDisliked ? (
                                  <BsHandThumbsDownFill
                                    size={20}
                                    style={{
                                      color: theme.colors.textSecondary,
                                    }}
                                  />
                                ) : (
                                  <BsHandThumbsDown
                                    size={20}
                                    style={{
                                      color: theme.colors.textSecondary,
                                    }}
                                  />
                                )}
                              </button>
                            </CustomTooltip>
                            {showDislikeOptions && (
                              <div
                                className="absolute z-[100] bottom-full left-0 mb-2 rounded-md shadow-lg min-w-[180px]"
                                style={{
                                  background: theme.colors.surface,
                                  border: `1px solid ${theme.colors.border}`,
                                  boxShadow: theme.shadow.md,
                                }}
                              >
                                {showCustomInput ? (
                                  <div className="p-3">
                                    <textarea
                                      value={customReason}
                                      onChange={(e) =>
                                        setCustomReason(e.target.value)
                                      }
                                      placeholder="Enter your reason"
                                      rows={3}
                                      className="w-full p-2 rounded resize-none focus:outline-none"
                                      style={{
                                        background: theme.colors.background,
                                        color: theme.colors.text,
                                        border: `1px solid ${theme.colors.border}`,
                                      }}
                                    />
                                    <div className="flex justify-end mt-2 gap-2">
                                      <button
                                        onClick={() => {
                                          setShowCustomInput(false);
                                          setCustomReason("");
                                        }}
                                        className="px-2 py-1 rounded"
                                        style={{
                                          background: theme.colors.surface,
                                          color: theme.colors.text,
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
                                        className="px-2 py-1 rounded"
                                        style={{
                                          background: theme.colors.accent,
                                          color: "white",
                                        }}
                                      >
                                        Submit
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {[
                                      "Incorrect data",
                                      "Takes too long",
                                      "Irrelevant response",
                                      "Confusing answer",
                                      "Other",
                                    ].map((reason) => (
                                      <button
                                        key={reason}
                                        onClick={() => {
                                          if (reason === "Other")
                                            setShowCustomInput(true);
                                          else handleDislikeOption(reason);
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-[theme.colors.accent]20"
                                        style={{ color: theme.colors.text }}
                                      >
                                        {reason}
                                      </button>
                                    ))}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="relative p-2 rounded-2xl transition-all duration-500 hover:shadow-2xl"
                  style={{
                    backgroundColor: `${theme.colors.error}06`,
                    border: `2px solid ${theme.colors.error}25`,
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-5"
                    style={{
                      background: `radial-gradient(circle at top right, ${theme.colors.error}20, transparent)`,
                    }}
                  />
                  <div className="relative">
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
