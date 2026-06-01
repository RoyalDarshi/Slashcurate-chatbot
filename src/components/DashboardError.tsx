import React, { useState, useEffect, useRef } from "react";
import {
  TriangleAlert,
  Edit3,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  Sparkles,
  FileWarning,
  MessageSquareWarning,
  Clock,
  Target,
  MoreHorizontal,
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
import { motion, AnimatePresence } from "framer-motion";
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
    <div className="h-full flex flex-col items-center justify-center p-4 w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl border rounded-2xl flex flex-col p-6 shadow-sm"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }}
      >
        <div className="text-center pb-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: `${theme.colors.error}10`, color: theme.colors.error }}>
            <TriangleAlert size={24} />
          </div>
          <h1
            className="text-xl md:text-2xl font-semibold tracking-tight mb-2"
            style={{ color: theme.colors.text }}
          >
            Analysis Discrepancy Caught
          </h1>
          <p
            className="text-sm font-medium max-w-md mx-auto"
            style={{ color: theme.colors.textSecondary }}
          >
            Let's refine your analytical request metrics or trigger a system evaluation query to re-index parameters.
          </p>
        </div>

        <div className="flex-1 mt-2">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="editing"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
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
                      className="text-sm font-medium"
                      style={{ color: theme.colors.text }}
                    >
                      Refine Metric Parameters
                    </h3>
                  </div>
                  <textarea
                    value={editedQuestion}
                    onChange={(e) => setEditedQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full p-3 rounded-lg border resize-none focus:outline-none focus:ring-1 text-sm font-medium leading-relaxed max-h-32"
                    style={{
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                    }}
                    onFocus={(e) => (e.target.style.borderColor = theme.colors.accent)}
                    onBlur={(e) => (e.target.style.borderColor = theme.colors.border)}
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
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        style={{
                          color: theme.colors.textSecondary,
                          borderColor: theme.colors.border,
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitClick}
                        disabled={!editedQuestion.trim()}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: theme.colors.accent }}
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="viewing"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div
                  className="p-4 rounded-xl border relative group"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                  }}
                >
                  <div
                    className="flex items-center justify-between border-b pb-2 mb-3"
                    style={{ borderColor: `${theme.colors.border}60` }}
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} style={{ color: theme.colors.accent }} />
                      <h3
                        className="text-sm font-medium"
                        style={{ color: theme.colors.text }}
                      >
                        Your Core Prompt
                      </h3>
                    </div>
                    {!sessionConErr && (
                      <div className="flex items-center gap-1.5 transition-opacity">
                        <button
                          onClick={handleEditClick}
                          className="px-2.5 py-1 rounded-md text-xs font-medium border transition-colors bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                          style={{
                            color: theme.colors.accent,
                            borderColor: `${theme.colors.accent}30`,
                          }}
                        >
                          Modify
                        </button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={handleLike}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isLiked ? "bg-emerald-500/10 text-emerald-500" : "text-slate-400 hover:text-emerald-500 hover:bg-black/5 dark:hover:bg-white/5"
                          }`}
                        >
                          {isLiked ? (
                            <BsHandThumbsUpFill size={15} style={{ color: theme.colors.success }} className="drop-shadow-sm" />
                          ) : (
                            <BsHandThumbsUp size={15} />
                          )}
                        </motion.button>
                        <div className="relative" ref={dislikeRef}>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleDislike}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDisliked ? "bg-red-500/10 text-red-500" : "text-slate-400 hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/5"
                            }`}
                          >
                            {isDisliked ? (
                              <BsHandThumbsDownFill size={15} style={{ color: theme.colors.error }} className="drop-shadow-sm" />
                            ) : (
                              <BsHandThumbsDown size={15} />
                            )}
                          </motion.button>
                          <AnimatePresence>
                            {showDislikeOptions && (
                              <motion.div
                                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full right-0 mt-2 rounded-xl border z-50 min-w-[200px] overflow-hidden py-1.5 shadow-xl backdrop-blur-xl"
                                style={{
                                  background: theme.mode === 'light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(30, 41, 59, 0.85)',
                                  borderColor: theme.mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                                }}
                              >
                                {showCustomInput ? (
                                  <div className="p-3 flex flex-col gap-2.5">
                                    <textarea
                                      value={customReason}
                                      onChange={(e) => setCustomReason(e.target.value)}
                                      placeholder="Reason description..."
                                      rows={2}
                                      autoFocus
                                      className="w-full p-2.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none font-medium transition-all"
                                      style={{
                                        color: theme.colors.text,
                                        background: theme.colors.background,
                                        borderColor: theme.colors.border,
                                      }}
                                    />
                                    <div className="flex justify-end gap-2 text-[10px] font-bold uppercase tracking-wider">
                                      <button
                                        onClick={() => {
                                          setShowCustomInput(false);
                                          setCustomReason("");
                                        }}
                                        className="hover:opacity-70 transition-opacity"
                                        style={{ color: theme.colors.textSecondary }}
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
                                        className="px-2.5 py-1 rounded text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
                                      >
                                        Submit
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-0.5 px-1.5">
                                    {[
                                      { id: "Inaccurate data", icon: <FileWarning size={13} className="opacity-60 group-hover:opacity-100" /> },
                                      { id: "Confusing or unclear", icon: <MessageSquareWarning size={13} className="opacity-60 group-hover:opacity-100" /> },
                                      { id: "Too slow", icon: <Clock size={13} className="opacity-60 group-hover:opacity-100" /> },
                                      { id: "Irrelevant response", icon: <Target size={13} className="opacity-60 group-hover:opacity-100" /> },
                                      { id: "Other", icon: <MoreHorizontal size={13} className="opacity-60 group-hover:opacity-100" /> },
                                    ].map(({ id, icon }) => (
                                      <button
                                        key={id}
                                        onClick={() =>
                                          id === "Other"
                                            ? setShowCustomInput(true)
                                            : handleDislikeOption(id)
                                        }
                                        className="group flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-black/5 dark:hover:bg-white/10"
                                        style={{ color: theme.colors.text }}
                                      >
                                        {icon}
                                        <span>{id}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                  </div>
                  <blockquote
                    className="text-sm font-medium italic pl-3 border-l-2 break-all"
                    style={{
                      color: theme.colors.text,
                      borderLeftColor: theme.colors.accent,
                    }}
                  >
                    "{question}"
                  </blockquote>
                </div>

                <div
                  className="p-4 rounded-xl border"
                  style={{
                    backgroundColor: theme.mode === 'light' ? 'rgba(15, 23, 42, 0.015)' : 'rgba(255, 255, 255, 0.015)',
                    borderColor: theme.colors.border,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TriangleAlert size={15} style={{ color: theme.colors.error }} />
                      <h3
                        className="text-sm font-medium"
                        style={{ color: theme.colors.text }}
                      >
                        Diagnostic Trace
                      </h3>
                    </div>
                    {!sessionConErr && (
                      <button
                        onClick={onRetry}
                        className="group flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
                        style={{ backgroundColor: theme.colors.accent }}
                      >
                        <RefreshCw
                          size={13}
                          className="transition-transform duration-700 group-hover:rotate-180"
                        />
                        <span>Re-index</span>
                      </button>
                    )}
                  </div>
                  <div
                    className="p-3 rounded-lg font-mono text-[11px] leading-relaxed max-h-40 overflow-y-auto"
                    style={{
                      color: theme.colors.textSecondary,
                      backgroundColor: theme.mode === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'
                    }}
                  >
                    {errorMessage}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardError;
