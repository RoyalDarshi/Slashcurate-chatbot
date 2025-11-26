
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../ThemeContext";
import CustomTooltip from "./CustomTooltip";
import { API_URL } from "../config";
import axios from "axios";
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

// Updated Interface
interface Session {
  id: string;
  messages: Message[]; // Kept for type safety, but will be empty from API
  timestamp: string;
  connection: string;
  title: string;
  messageCount?: number; // Added
  preview?: string;      // Added
}

interface HistoryProps {
  onSessionClicked: () => void;
}

const History: React.FC<HistoryProps> = ({ onSessionClicked }) => {
  const { theme } = useTheme();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  // Removed client-side filteredSessions state, we now use 'sessions' directly
  const [activeFilter, setActiveFilter] = useState<string>("today");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const token = sessionStorage.getItem("token") ?? "";
  const currentSessionId = localStorage.getItem("currentSessionId");

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
      // Toast logic...
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/fetchsessions`,
        { token, filter }, // Pass the filter to the backend
        { headers: { "Content-Type": "application/json" } }
      );

      const fetchedSessions = response.data;
      // We no longer need to map empty messages array manually or client-side filter
      setSessions(fetchedSessions);

    } catch (error) {
      console.error("Failed to load sessions from server", error);
      toast.error("Failed to load chat history.", {
        style: {
          background: theme.colors.surface,
          color: theme.colors.error,
          border: `1px solid ${theme.colors.error}20`,
          borderRadius: theme.borderRadius.default,
        },
        theme: theme.colors.background === "#0F172A" ? "dark" : "light",
      });
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await axios.delete(`${API_URL}/api/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      // Remove locally
      setSessions(prev => prev.filter(s => s.id !== sessionId));

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
        theme: theme.colors.background === "#0F172A" ? "dark" : "light",
      });
    } catch (error) {
      // Error handling...
      console.error(error);
    } finally {
      setShowConfirmDelete(null);
    }
  };

  // ... startEditing, saveTitle, cancelEditing remain mostly the same, 
  // just update 'sessions' state directly instead of filteredSessions

  const startEditing = (session: Session, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const saveTitle = async (sessionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!editingTitle.trim()) return;

    try {
      await axios.put(
        `${API_URL}/api/sessions/${sessionId}`,
        { title: editingTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: editingTitle } : s));
      setEditingSessionId(null);
      toast.success("Title updated successfully.", {
        style: {
          background: theme.colors.surface,
          color: theme.colors.success,
          border: `1px solid ${theme.colors.success}20`,
          borderRadius: theme.borderRadius.default,
        },
        theme: theme.colors.background === "#0F172A" ? "dark" : "light",
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

  // Removed filterSessions function entirely

  // Handle Search: Local filter on top of the server-fetched tab data
  // Alternatively, you could trigger a backend search, but strictly based on your request
  // we are prioritizing the tab-based fetching.
  const getDisplaySessions = () => {
    if (!searchTerm) return sessions;
    return sessions.filter((session) =>
      session.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const hanleClearSearch = () => {
    setSearchTerm("");
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setSearchTerm("");
    // loadSessions is called by useEffect when activeFilter changes
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
      return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return (
        date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) +
        ` at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      );
    }
  };

  const filters = [
    { id: "today", label: "Today", icon: <Clock className="w-4 h-4" /> },
    { id: "yesterday", label: "Yesterday", icon: <Clock className="w-4 h-4" /> },
    { id: "last7days", label: "Last 7 Days", icon: <CalendarDays className="w-4 h-4" /> },
    { id: "last1month", label: "Last Month", icon: <CalendarDays className="w-4 h-4" /> },
    { id: "all", label: "All Chats", icon: <MessageSquare className="w-4 h-4" /> },
  ];

  // Animation variants remain the same...
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
    selected: { scale: 0.98, opacity: 0.8, transition: { duration: 0.2 } },
  };
  const buttonVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95, transition: { duration: 0.1 } },
  };

  const displayedSessions = getDisplaySessions();

  return (
    <div
      className="p-4 h-full min-h-screen overflow-y-hidden transition-colors duration-500"
      style={{
        background: theme.colors.background,
        backgroundImage: `radial-gradient(${theme.colors.accent}10 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }}
    >
      <motion.div
        className="mx-auto overflow-y-hidden w-full max-w-4xl flex flex-col h-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
          <motion.h2
            className="text-2xl font-bold whitespace-nowrap flex items-center gap-2"
            style={{ color: theme.colors.text }}
          >
            <MessageSquare
              className="w-6 h-6"
              style={{ color: theme.colors.accent }}
            />
            <span className="flex items-center pb-2">
              Chat History
            </span>
            <span
              className="text-sm font-semibold flex items-center justify-center rounded-full min-w-[24px] h-[24px] leading-none"
              style={{
                background: theme.colors.accent + "20",
                color: theme.colors.accent,
              }}
            >
              {displayedSessions.length}
            </span>
          </motion.h2>

          <motion.div className="relative w-full sm:w-64">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search in this tab... (⌘+K)"
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full p-3 pl-10 text-sm transition-all focus:outline-none focus:ring-2"
              style={{
                background: theme.colors.surface,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.default,
                boxShadow: theme.shadow.sm,
              }}
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: theme.colors.textSecondary }} />
            {searchTerm && (
              <button
                onClick={hanleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: theme.colors.textSecondary }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        </div>

        <motion.div className="flex flex-wrap mb-5 gap-2">
          {filters.map((filter) => (
            <motion.button
              key={filter.id}
              onClick={() => handleFilterChange(filter.id)}
              variants={buttonVariants}
              whileTap="tap"
              className="px-4 py-2 text-sm transition-all flex items-center gap-2"
              style={{
                background: activeFilter === filter.id ? theme.colors.accent : theme.colors.surface,
                color: activeFilter === filter.id ? "white" : theme.colors.text,
                border: `1px solid ${activeFilter === filter.id ? theme.colors.accent : theme.colors.border}`,
                borderRadius: theme.borderRadius.pill,
                boxShadow: activeFilter === filter.id ? theme.shadow.md : theme.shadow.sm,
              }}
            >
              <span style={{ color: activeFilter === filter.id ? "white" : theme.colors.accent }}>
                {filter.icon}
              </span>
              {filter.label}
            </motion.button>
          ))}
        </motion.div>

        {isLoading ? (
          <motion.div
            className="flex-1 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex flex-col items-center">
              <div
                className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
                style={{ borderColor: `${theme.colors.accent}30`, borderTopColor: "transparent" }}
              />
              <p className="mt-4" style={{ color: theme.colors.textSecondary }}>
                Loading conversations...
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="flex-1 overflow-y-auto custom-scrollbar"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ maxHeight: "calc(100vh - 180px)", padding: "4px" }}
          >
            <AnimatePresence>
              {displayedSessions.length > 0 ? (
                displayedSessions.map((session) => (
                  <motion.div
                    key={session.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate={selectedSession === session.id ? "selected" : "visible"}
                    exit="exit"
                    onClick={() => handleSessionClick(session)}
                    className="mb-4 p-4 rounded-lg overflow-hidden cursor-pointer group"
                    style={{
                      background: session.id === currentSessionId
                        ? `linear-gradient(135deg, ${theme.colors.surface}, ${theme.colors.accent}10)`
                        : theme.colors.surface,
                      border: `1px solid ${session.id === currentSessionId ? theme.colors.accent + "40" : theme.colors.border}`,
                      borderRadius: theme.borderRadius.default,
                      boxShadow: session.id === currentSessionId ? theme.shadow.md : theme.shadow.sm,
                    }}
                  >
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {session.id === editingSessionId ? (
                          <div className="flex items-center gap-2">
                            {/* Editing input logic same as before */}
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveTitle(session.id);
                                else if (e.key === "Escape") cancelEditing();
                              }}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                              className="flex-1 p-2 text-sm focus:ring-2 focus:outline-none"
                              style={{
                                background: theme.colors.background,
                                color: theme.colors.text,
                                border: `1px solid ${theme.colors.accent}`,
                                borderRadius: theme.borderRadius.default,
                              }}
                            />
                            {/* Save/Cancel buttons... same as original code */}
                            <motion.button onClick={(e) => saveTitle(session.id, e)} className="p-2 rounded-full bg-green-500 text-white"><Check size={16} /></motion.button>
                            <motion.button onClick={cancelEditing} className="p-2 rounded-full bg-gray-500 text-white"><X size={16} /></motion.button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <h3
                                className="font-medium text-lg truncate"
                                style={{ color: theme.colors.text }}
                              >
                                {session.title}
                              </h3>
                              {session.id === currentSessionId && (
                                <span
                                  className="text-xs px-2 py-1 rounded-full"
                                  style={{ background: theme.colors.accent, color: "white" }}
                                >
                                  Active
                                </span>
                              )}
                            </div>

                            <p
                              className="text-sm mb-3 line-clamp-1 opacity-80"
                              style={{ color: theme.colors.textSecondary }}
                            >
                              {/* USE NEW PREVIEW FIELD */}
                              {session.preview || "No messages"}
                            </p>

                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3" style={{ color: theme.colors.textSecondary }} />
                              <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                                {formatTimestamp(session.timestamp)}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {session.id !== editingSessionId && (
                        <div className="flex items-center gap-2 self-start">
                          <span
                            className="text-xs px-2 py-1 rounded whitespace-nowrap"
                            style={{
                              background: theme.colors.accent + "10",
                              color: theme.colors.accent,
                            }}
                          >
                            {/* Compute a safe count (defaults to 0) */}
                            {(() => {
                              const count = (session?.messageCount ?? 0) / 2;   // <-- default to 0 first
                              return (
                                <>
                                  {count} {count === 1 ? "chat" : "chats"}
                                </>
                              );
                            })()}
                          </span>

                          <CustomTooltip title="Edit title">
                            <motion.button
                              variants={buttonVariants}
                              whileHover="hover"
                              whileTap="tap"
                              onClick={(e) => startEditing(session, e)}
                              className="p-1 rounded-full"
                              style={{ color: theme.colors.textSecondary, background: theme.colors.surface + "80" }}
                            >
                              <Pencil className="h-4 w-4" />
                            </motion.button>
                          </CustomTooltip>

                          <CustomTooltip title="Delete session">
                            <motion.button
                              variants={buttonVariants}
                              whileHover="hover"
                              whileTap="tap"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowConfirmDelete(session.id);
                              }}
                              className="p-1 rounded-full"
                              style={{ color: theme.colors.error, background: theme.colors.surface + "80" }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </motion.button>
                          </CustomTooltip>
                        </div>
                      )}
                    </div>

                    {/* Delete Confirmation Modal (Same as original) */}
                    <AnimatePresence>
                      {showConfirmDelete === session.id && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center z-10 p-2"
                          style={{ background: theme.colors.surface + "E0", backdropFilter: "blur(4px)" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="text-center">
                            <p className="mb-2 text-sm font-bold" style={{ color: theme.colors.text }}>Delete?</p>
                            <div className="flex gap-2 justify-center">
                              <button onClick={() => deleteSession(session.id)} className="px-3 py-1 bg-red-500 text-white rounded text-xs">Yes</button>
                              <button onClick={() => setShowConfirmDelete(null)} className="px-3 py-1 bg-gray-500 text-white rounded text-xs">No</button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!editingSessionId && (
                      <motion.div
                        className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        style={{ color: theme.colors.accent }}
                      >
                        <ChevronRight size={20} />
                      </motion.div>
                    )}
                  </motion.div>
                ))
              ) : (
                <motion.div
                  className="text-center p-8 rounded-lg"
                  style={{
                    background: theme.colors.surface,
                    color: theme.colors.textSecondary,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <MessageSquare size={40} className="mx-auto mb-3" style={{ color: theme.colors.accent + "50" }} />
                  <h3 className="font-medium mb-2">No sessions found</h3>
                  <p className="text-sm">
                    {searchTerm ? "No matches in this tab." : "No history for this time period."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar { width: 8px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: ${theme.colors.background}80; border-radius: 8px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: ${theme.colors.accent}30; border-radius: 8px; transition: all 0.3s ease; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${theme.colors.accent}50; }
        `}</style>
      </motion.div>
    </div>
  );
};

export default History;