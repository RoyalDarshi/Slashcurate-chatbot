import React, { useState, useEffect, useRef } from "react";
import { Message } from "../types";
import {
  Search,
  Trash2,
  Pencil,
  Check,
  X,
  Clock,
  CalendarDays,
  ChevronRight,
  MessageSquare,
  AlertCircle,
  Database,
  Grid,
  List,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../ThemeContext";
import CustomTooltip from "./CustomTooltip";
import { historyService } from "../services/historyService";
import { handleApiError } from "../utils/errorHandler";
import { toast } from "react-toastify";

/* ----------------------------------------------------------
   TIMESTAMP FIX — ALWAYS PARSES MISSING TIMEZONE AS UTC
   -----------------------------------------------------------*/
const parseTimestamp = (ts: string | number) => {
  if (!ts) return new Date();
  if (typeof ts === "string" && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(ts)) {
    return new Date(ts + "Z"); // Treat as UTC
  }
  return new Date(ts);
};

/* Helper to highlight matched search terms */
const highlightText = (text: string, highlight: string, activeColor: string) => {
  if (!highlight.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="px-0.5 rounded font-bold"
            style={{ backgroundColor: `${activeColor}25`, color: activeColor }}
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

interface Session {
  id: string;
  messages: Message[]; // Kept for type safety, but will be empty from API
  timestamp: string;
  connection: string;
  title: string;
  messageCount?: number;
  preview?: string;
}

interface HistoryProps {
  onSessionClicked: () => void;
}

const History: React.FC<HistoryProps> = ({ onSessionClicked }) => {
  const { theme } = useTheme();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("today");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const token = sessionStorage.getItem("token") ?? "";
  const currentSessionId = localStorage.getItem("currentSessionId");
  const isDark = theme.mode === "dark";
  const mode = isDark ? "dark" : "light";

  // Search shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Reload sessions whenever the Active Filter changes
  useEffect(() => {
    loadSessions(activeFilter);
  }, [activeFilter]);

  const loadSessions = async (filter: string) => {
    setIsLoading(true);
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const fetchedSessions = await historyService.fetchSessions(filter);
      setSessions(fetchedSessions);
    } catch (error) {
      handleApiError(error, "Failed to load chat history", mode);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await historyService.deleteSession(sessionId);
      
      // Remove locally
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));

      if (localStorage.getItem("currentSessionId") === sessionId) {
        localStorage.removeItem("currentSessionId");
      }
      toast.success("Session deleted successfully.", {
        style: {
          background: theme.colors.surface,
          color: theme.colors.success,
          border: `1px solid ${theme.colors.success}20`,
          borderRadius: theme.borderRadius.default,
        },
        theme: mode,
      });
    } catch (error) {
      handleApiError(error, "Failed to delete session", mode);
    } finally {
      setShowConfirmDelete(null);
    }
  };

  const startEditing = (session: Session, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const saveTitle = async (sessionId: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation();
    if (!editingTitle.trim()) return;

    try {
      await historyService.updateSessionTitle(sessionId, editingTitle);

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, title: editingTitle } : s
        )
      );
      setEditingSessionId(null);
      toast.success("Title updated successfully.", {
        style: {
          background: theme.colors.surface,
          color: theme.colors.success,
          border: `1px solid ${theme.colors.success}20`,
          borderRadius: theme.borderRadius.default,
        },
        theme: mode,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const cancelEditing = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingSessionId(null);
    setEditingTitle("");
  };

  // Expanded Search capability to scan titles, connection names, and message previews
  const getDisplaySessions = () => {
    if (!searchTerm) return sessions;
    const term = searchTerm.toLowerCase();
    return sessions.filter((session) =>
      session.title.toLowerCase().includes(term) ||
      session.connection.toLowerCase().includes(term) ||
      session.preview?.toLowerCase().includes(term)
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setSearchTerm("");
  };

  const handleSessionClick = async (session: Session) => {
    setSelectedSession(session.id);
    localStorage.setItem("selectedConnection", session.connection);
    setTimeout(() => {
      localStorage.setItem("currentSessionId", session.id);
      onSessionClicked();
    }, 300);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = parseTimestamp(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return (
        date.toLocaleDateString([], {
          month: "short",
          day: "numeric",
          year: "numeric",
        }) +
        ` at ${date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      );
    }
  };

  const filters = [
    { id: "today", label: "Today", icon: <Clock className="w-4 h-4" /> },
    {
      id: "yesterday",
      label: "Yesterday",
      icon: <Clock className="w-4 h-4" />,
    },
    {
      id: "last7days",
      label: "Last 7 Days",
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      id: "last1month",
      label: "Last Month",
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      id: "all",
      label: "All Chats",
      icon: <MessageSquare className="w-4 h-4" />,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4, staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 } 
    },
    exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.2 } },
    selected: { scale: 0.98, opacity: 0.9, y: 1, transition: { duration: 0.2 } },
  };

  const displayedSessions = getDisplaySessions();

  return (
    <div
      className="p-4 md:p-6 h-full min-h-screen overflow-y-hidden transition-colors duration-500"
      style={{
        background: theme.colors.background,
        backgroundImage: isDark
          ? `radial-gradient(rgba(99, 102, 241, 0.08) 1px, transparent 1px)`
          : `radial-gradient(rgba(79, 70, 229, 0.05) 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }}
    >
      <motion.div
        className="mx-auto overflow-y-hidden w-full max-w-4xl flex flex-col h-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Title and Search Control Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div 
              className="p-2.5 rounded-xl flex items-center justify-center shadow-inner"
              style={{ background: `${theme.colors.accent}15` }}
            >
              <MessageSquare
                className="w-5 h-5"
                style={{ color: theme.colors.accent }}
              />
            </div>
            <div>
              <h2
                className="text-xl md:text-2xl font-extrabold tracking-tight flex items-center gap-2"
                style={{ color: theme.colors.text }}
              >
                Chat History
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center justify-center border"
                  style={{
                    background: `${theme.colors.accent}10`,
                    color: theme.colors.accent,
                    borderColor: `${theme.colors.accent}20`,
                  }}
                >
                  {displayedSessions.length}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow sm:w-72">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search chats, sources, previews... (⌘+K)"
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full py-2.5 pl-10 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border transition-all"
                style={{
                  background: isDark ? "rgba(30, 41, 59, 0.4)" : "rgba(255, 255, 255, 0.85)",
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  borderRadius: theme.borderRadius.default,
                  boxShadow: theme.shadow.xs,
                }}
              />
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: theme.colors.textSecondary }}
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:text-red-500 transition-colors"
                  style={{ color: theme.colors.textSecondary }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div
              className="flex p-1 rounded-xl gap-1 border shadow-inner backdrop-blur-md"
              style={{
                backgroundColor: isDark ? "rgba(15, 23, 42, 0.3)" : "rgba(0, 0, 0, 0.03)",
                borderColor: theme.colors.border,
              }}
            >
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all duration-300 flex items-center justify-center ${
                  viewMode === "grid" ? "shadow-sm" : "opacity-50 hover:opacity-100"
                }`}
                style={{
                  backgroundColor:
                    viewMode === "grid" ? theme.colors.accent : "transparent",
                  color: viewMode === "grid" ? "#ffffff" : theme.colors.text,
                }}
                type="button"
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all duration-300 flex items-center justify-center ${
                  viewMode === "list" ? "shadow-sm" : "opacity-50 hover:opacity-100"
                }`}
                style={{
                  backgroundColor:
                    viewMode === "list" ? theme.colors.accent : "transparent",
                  color: viewMode === "list" ? "#ffffff" : theme.colors.text,
                }}
                type="button"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Selection Panel */}
        <div 
          className="flex flex-wrap p-1.5 mb-6 gap-1 border shadow-inner backdrop-blur-md overflow-x-auto custom-scrollbar"
          style={{ 
            background: isDark ? "rgba(15, 23, 42, 0.3)" : "rgba(0, 0, 0, 0.03)",
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.large
          }}
        >
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleFilterChange(filter.id)}
              className="px-4 py-2 text-xs md:text-sm font-semibold transition-all flex items-center gap-2 rounded-lg"
              style={{
                background: activeFilter === filter.id ? theme.colors.accent : "transparent",
                color: activeFilter === filter.id ? "#FFFFFF" : theme.colors.textSecondary,
                boxShadow: activeFilter === filter.id ? theme.shadow.sm : "none",
              }}
            >
              <span
                style={{
                  color: activeFilter === filter.id ? "#FFFFFF" : theme.colors.accent,
                }}
              >
                {filter.icon}
              </span>
              {filter.label}
            </button>
          ))}
        </div>

        {/* List Content Panel */}
        {isLoading ? (
          /* Premium Loading Skeletons */
          <div className="flex-1 overflow-hidden">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="p-5 border animate-pulse flex flex-col gap-4 rounded-xl"
                    style={{
                      background: theme.colors.surface,
                      borderColor: theme.colors.border,
                    }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="w-1/3 h-5 rounded bg-gray-200 dark:bg-slate-800" />
                      <div className="w-16 h-5 rounded-full bg-gray-200 dark:bg-slate-800" />
                    </div>
                    <div className="w-2/3 h-4 rounded bg-gray-200 dark:bg-slate-800" />
                    <div className="w-24 h-3 rounded bg-gray-100 dark:bg-slate-850" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4 max-h-[calc(100vh-210px)] overflow-hidden">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="p-5 border animate-pulse flex flex-col gap-3 rounded-xl"
                    style={{
                      background: theme.colors.surface,
                      borderColor: theme.colors.border,
                    }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="w-1/3 h-5 rounded bg-gray-200 dark:bg-slate-800" />
                      <div className="w-16 h-5 rounded-full bg-gray-200 dark:bg-slate-800" />
                    </div>
                    <div className="w-2/3 h-4 rounded bg-gray-200 dark:bg-slate-800" />
                    <div className="w-24 h-3 rounded bg-gray-100 dark:bg-slate-850" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <motion.div
            className="flex-1 overflow-y-auto custom-scrollbar pr-1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ maxHeight: "calc(100vh - 210px)", paddingBottom: "24px" }}
          >
            <AnimatePresence mode="popLayout">
              {displayedSessions.length > 0 ? (
                viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
                    {displayedSessions.map((session) => (
                      <motion.div
                        key={session.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate={selectedSession === session.id ? "selected" : "visible"}
                        exit="exit"
                        layout="position"
                        onClick={() => handleSessionClick(session)}
                        className="relative p-5 rounded-xl border backdrop-blur-md transition-all hover:-translate-y-0.5 cursor-pointer group overflow-hidden flex flex-col justify-between min-h-[180px]"
                        style={{
                          background:
                            session.id === currentSessionId
                              ? isDark 
                                ? "linear-gradient(135deg, rgba(30, 41, 59, 0.4), rgba(99, 102, 241, 0.15))"
                                : "linear-gradient(135deg, #FFFFFF, rgba(79, 70, 229, 0.05))"
                              : theme.colors.surface,
                          borderColor:
                            session.id === currentSessionId
                              ? theme.colors.accent
                              : theme.colors.border,
                          boxShadow:
                            session.id === currentSessionId
                              ? `0 10px 25px -5px ${theme.colors.accent}15, ${theme.shadow.sm}`
                              : theme.shadow.sm,
                        }}
                      >
                        {/* Glowing highlight indicator for active session */}
                        {session.id === currentSessionId && (
                          <div 
                            className="absolute left-0 top-0 bottom-0 w-[4px]"
                            style={{ backgroundColor: theme.colors.accent }}
                          />
                        )}

                        <div className="flex flex-col h-full justify-between gap-3">
                          <div className="w-full">
                            {session.id === editingSessionId ? (
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveTitle(session.id);
                                    else if (e.key === "Escape") cancelEditing();
                                  }}
                                  autoFocus
                                  className="flex-1 p-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none border font-semibold"
                                  style={{
                                    background: theme.colors.background,
                                    color: theme.colors.text,
                                    borderColor: theme.colors.accent,
                                    borderRadius: theme.borderRadius.default,
                                  }}
                                />
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => saveTitle(session.id, e)}
                                  className="p-2 rounded-lg text-white flex-shrink-0"
                                  style={{ backgroundColor: theme.colors.success }}
                                >
                                  <Check size={16} />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={cancelEditing}
                                  className="p-2 rounded-lg bg-gray-500 text-white flex-shrink-0"
                                >
                                  <X size={16} />
                                </motion.button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between gap-2.5 mb-1.5">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <h3
                                      className="font-bold text-base md:text-lg truncate max-w-[200px]"
                                      style={{ color: theme.colors.text }}
                                    >
                                      {highlightText(session.title, searchTerm, theme.colors.accent)}
                                    </h3>
                                    {session.id === currentSessionId && (
                                      <span className="relative flex h-2 w-2 flex-shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                      </span>
                                    )}
                                  </div>

                                  {session.connection && (
                                    <span 
                                      className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider flex-shrink-0"
                                      style={{
                                        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                                        color: theme.colors.textSecondary,
                                        borderColor: theme.colors.border,
                                      }}
                                    >
                                      <Database className="w-2.5 h-2.5 text-indigo-500" />
                                      {highlightText(session.connection, searchTerm, theme.colors.accent)}
                                    </span>
                                  )}
                                </div>

                                <p
                                  className="text-xs md:text-sm mb-3 line-clamp-2 italic font-normal"
                                  style={{ color: theme.colors.textSecondary }}
                                >
                                  "{session.preview ? highlightText(session.preview, searchTerm, theme.colors.accent) : "No messages in this chat"}"
                                </p>
                              </>
                            )}
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: theme.colors.border }}>
                            <div className="flex items-center gap-1.5">
                              <Clock
                                className="w-3.5 h-3.5"
                                style={{ color: theme.colors.textSecondary }}
                              />
                              <p
                                className="text-xs font-semibold"
                                style={{ color: theme.colors.textSecondary }}
                              >
                                {formatTimestamp(session.timestamp)}
                              </p>
                            </div>

                            {session.id !== editingSessionId && (
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <span
                                  className="text-[10px] font-bold px-2 py-1 rounded-lg mr-1"
                                  style={{
                                    background: `${theme.colors.accent}12`,
                                    color: theme.colors.accent,
                                  }}
                                >
                                  {(() => {
                                    const count = Math.max(0, (session?.messageCount ?? 0) / 2);
                                    return `${count} ${count === 1 ? "Query" : "Queries"}`;
                                  })()}
                                </span>

                                <CustomTooltip title="Edit Title">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => startEditing(session, e)}
                                    className="p-1.5 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 transition-all focus:outline-none"
                                    style={{
                                      color: theme.colors.textSecondary,
                                      borderColor: theme.colors.border,
                                      background: theme.colors.surface,
                                    }}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </motion.button>
                                </CustomTooltip>

                                <CustomTooltip title="Delete Chat">
                                  <motion.button
                                    whileHover={{ scale: 1.05, backgroundColor: `${theme.colors.error}12` }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowConfirmDelete(session.id)}
                                    className="p-1.5 rounded-lg border transition-all focus:outline-none"
                                    style={{
                                      color: theme.colors.error,
                                      borderColor: theme.colors.border,
                                      background: theme.colors.surface,
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </motion.button>
                                </CustomTooltip>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Glassy Confirm Delete Modal */}
                        <AnimatePresence>
                          {showConfirmDelete === session.id && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 flex items-center justify-center z-20 p-2"
                              style={{
                                background: isDark ? "rgba(15, 23, 42, 0.92)" : "rgba(255, 255, 255, 0.92)",
                                backdropFilter: "blur(8px)",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="text-center max-w-[200px] flex flex-col gap-3 items-center">
                                <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
                                <p
                                  className="text-xs font-bold tracking-tight"
                                  style={{ color: theme.colors.text }}
                                >
                                  Delete this chat session permanently?
                                </p>
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => deleteSession(session.id)}
                                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => setShowConfirmDelete(null)}
                                    className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Hover indicator arrow */}
                        {!editingSessionId && (
                          <motion.div
                            className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            style={{ color: theme.colors.accent }}
                          >
                            <ChevronRight size={18} />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 pb-8">
                    {displayedSessions.map((session) => (
                      <motion.div
                        key={session.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate={selectedSession === session.id ? "selected" : "visible"}
                        exit="exit"
                        layout="position"
                        onClick={() => handleSessionClick(session)}
                        className="relative mb-4 p-5 rounded-xl border backdrop-blur-md transition-all hover:-translate-y-0.5 cursor-pointer group overflow-hidden"
                        style={{
                          background:
                            session.id === currentSessionId
                              ? isDark 
                                ? "linear-gradient(135deg, rgba(30, 41, 59, 0.4), rgba(99, 102, 241, 0.15))"
                                : "linear-gradient(135deg, #FFFFFF, rgba(79, 70, 229, 0.05))"
                              : theme.colors.surface,
                          borderColor:
                            session.id === currentSessionId
                              ? theme.colors.accent
                              : theme.colors.border,
                          boxShadow:
                            session.id === currentSessionId
                              ? `0 10px 25px -5px ${theme.colors.accent}15, ${theme.shadow.sm}`
                              : theme.shadow.sm,
                        }}
                      >
                        {/* Glowing highlight indicator for active session */}
                        {session.id === currentSessionId && (
                          <div 
                            className="absolute left-0 top-0 bottom-0 w-[4px]"
                            style={{ backgroundColor: theme.colors.accent }}
                          />
                        )}

                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {session.id === editingSessionId ? (
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveTitle(session.id);
                                    else if (e.key === "Escape") cancelEditing();
                                  }}
                                  autoFocus
                                  className="flex-1 p-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none border"
                                  style={{
                                    background: theme.colors.background,
                                    color: theme.colors.text,
                                    borderColor: theme.colors.accent,
                                    borderRadius: theme.borderRadius.default,
                                  }}
                                />
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => saveTitle(session.id, e)}
                                  className="p-2 rounded-lg text-white"
                                  style={{ backgroundColor: theme.colors.success }}
                                >
                                  <Check size={16} />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={cancelEditing}
                                  className="p-2 rounded-lg bg-gray-500 text-white"
                                >
                                  <X size={16} />
                                </motion.button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center flex-wrap gap-2.5 mb-1.5">
                                  <h3
                                    className="font-bold text-base md:text-lg truncate max-w-sm"
                                    style={{ color: theme.colors.text }}
                                  >
                                    {highlightText(session.title, searchTerm, theme.colors.accent)}
                                  </h3>
                                  
                                  {session.id === currentSessionId && (
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                  )}
                                  {session.connection && (
                                    <span 
                                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider"
                                      style={{
                                        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                                        color: theme.colors.textSecondary,
                                        borderColor: theme.colors.border,
                                      }}
                                    >
                                      <Database className="w-2.5 h-2.5 text-indigo-500" />
                                      {highlightText(session.connection, searchTerm, theme.colors.accent)}
                                    </span>
                                  )}
                                </div>

                                <p
                                  className="text-xs md:text-sm mb-3.5 line-clamp-1 italic font-normal"
                                  style={{ color: theme.colors.textSecondary }}
                                >
                                  "{session.preview ? highlightText(session.preview, searchTerm, theme.colors.accent) : "No messages in this chat"}"
                                </p>

                                <div className="flex items-center gap-2">
                                  <Clock
                                    className="w-3.5 h-3.5"
                                    style={{ color: theme.colors.textSecondary }}
                                  />
                                  <p
                                    className="text-xs font-semibold"
                                    style={{ color: theme.colors.textSecondary }}
                                  >
                                    {formatTimestamp(session.timestamp)}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Controls Area */}
                          {session.id !== editingSessionId && (
                            <div className="flex items-center gap-2.5 self-start sm:self-center" onClick={(e) => e.stopPropagation()}>
                              <span
                                className="text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-lg"
                                style={{
                                  background: `${theme.colors.accent}12`,
                                  color: theme.colors.accent,
                                }}
                              >
                                {(() => {
                                  const count = Math.max(0, (session?.messageCount ?? 0) / 2);
                                  return `${count} ${count === 1 ? "Query" : "Queries"}`;
                                })()}
                              </span>

                              <CustomTooltip title="Edit Title">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => startEditing(session, e)}
                                  className="p-2 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 transition-all focus:outline-none"
                                  style={{
                                    color: theme.colors.textSecondary,
                                    borderColor: theme.colors.border,
                                    background: theme.colors.surface,
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </motion.button>
                              </CustomTooltip>

                              <CustomTooltip title="Delete Chat">
                                <motion.button
                                  whileHover={{ scale: 1.05, backgroundColor: `${theme.colors.error}12` }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setShowConfirmDelete(session.id)}
                                  className="p-2 rounded-lg border transition-all focus:outline-none"
                                  style={{
                                    color: theme.colors.error,
                                    borderColor: theme.colors.border,
                                    background: theme.colors.surface,
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </motion.button>
                              </CustomTooltip>
                            </div>
                          )}
                        </div>

                        {/* Fixed Confirm Delete Modal (Backdrop filter & stopping clicks) */}
                        <AnimatePresence>
                          {showConfirmDelete === session.id && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 flex items-center justify-center z-20 p-2"
                              style={{
                                background: isDark ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.85)",
                                backdropFilter: "blur(6px)",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="text-center max-w-[200px] flex flex-col gap-3 items-center">
                                <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
                                <p
                                  className="text-sm font-bold tracking-tight"
                                  style={{ color: theme.colors.text }}
                                >
                                  Delete this chat session permanently?
                                </p>
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => deleteSession(session.id)}
                                    className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => setShowConfirmDelete(null)}
                                    className="px-4 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Hover indicator arrow */}
                        {!editingSessionId && (
                          <motion.div
                            className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            style={{ color: theme.colors.accent }}
                          >
                            <ChevronRight size={18} />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )
              ) : (
                <motion.div
                  className="text-center p-12 rounded-2xl border"
                  style={{
                    background: theme.colors.surface,
                    color: theme.colors.textSecondary,
                    borderColor: theme.colors.border,
                    boxShadow: theme.shadow.sm,
                  }}
                >
                  <MessageSquare
                    size={44}
                    className="mx-auto mb-3"
                    style={{ color: theme.colors.accent + "35" }}
                  />
                  <h3 className="font-bold text-lg mb-1" style={{ color: theme.colors.text }}>No chats found</h3>
                  <p className="text-sm opacity-80">
                    {searchTerm
                      ? "No matching conversations in this tab."
                      : "You have no history logged for this time period."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${theme.colors.accent}20;
            border-radius: 99px;
            transition: all 0.3s ease;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${theme.colors.accent}45;
          }
        `}</style>
      </motion.div>
    </div>
  );
};

export default History;
