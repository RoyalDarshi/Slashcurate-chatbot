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
  Share2,
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

  // If string AND missing timezone (no Z or ±HH:MM)
  if (typeof ts === "string" && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(ts)) {
    return new Date(ts + "Z"); // Treat as UTC
  }

  return new Date(ts);
};

interface Session {
  id: string;
  messages: Message[];
  timestamp: string;
  connection: string;
  title: string;
}

interface HistoryProps {
  onSessionClicked: () => void;
}

const History: React.FC<HistoryProps> = ({ onSessionClicked }) => {
  const { theme } = useTheme();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("today");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(
    null
  );
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

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    if (!token) {
      toast.error("Please log in to view chat history.", {
        style: {
          background: theme.colors.surface,
          color: theme.colors.error,
          border: `1px solid ${theme.colors.error}20`,
          borderRadius: theme.borderRadius.default,
        },
        theme: theme.colors.background === "#0F172A" ? "dark" : "light",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/fetchsessions`,
        { token },
        { headers: { "Content-Type": "application/json" } }
      );
      const sessions = response.data;
      const normalizedSessions = sessions.map((session: Session) => ({
        ...session,
        messages: Array.isArray(session.messages) ? session.messages : [],
      }));
      setSessions(normalizedSessions);
      filterSessions(normalizedSessions, activeFilter);
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
      setFilteredSessions([]);
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
      const updatedSessions = sessions.filter(
        (session) => session.id !== sessionId
      );
      setSessions(updatedSessions);
      filterSessions(updatedSessions, activeFilter);
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
      console.error("Error deleting session:", error);
      toast.error("Failed to delete session.", {
        style: {
          background: theme.colors.surface,
          color: theme.colors.error,
          border: `1px solid ${theme.colors.error}20`,
          borderRadius: theme.borderRadius.default,
        },
        theme: theme.colors.background === "#0F172A" ? "dark" : "light",
      });
    } finally {
      setShowConfirmDelete(null);
    }
  };

  const startEditing = (session: Session, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const saveTitle = async (sessionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (!editingTitle.trim()) {
      toast.error("Title cannot be empty.", {
        style: {
          background: theme.colors.surface,
          color: theme.colors.error,
          border: `1px solid ${theme.colors.error}20`,
          borderRadius: theme.borderRadius.default,
        },
        theme: theme.colors.background === "#0F172A" ? "dark" : "light",
      });
      return;
    }

    try {
      await axios.put(
        `${API_URL}/api/sessions/${sessionId}`,
        { title: editingTitle },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const updatedSessions = sessions.map((session) =>
        session.id === sessionId ? { ...session, title: editingTitle } : session
      );
      setSessions(updatedSessions);
      setFilteredSessions(
        filteredSessions.map((session) =>
          session.id === sessionId
            ? { ...session, title: editingTitle }
            : session
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
        theme: theme.colors.background === "#0F172A" ? "dark" : "light",
      });
    } catch (error) {
      console.error("Error updating session title:", error);
      toast.error("Failed to update title.", {
        style: {
          background: theme.colors.surface,
          color: theme.colors.error,
          border: `1px solid ${theme.colors.error}20`,
          borderRadius: theme.borderRadius.default,
        },
        theme: theme.colors.background === "#0F172A" ? "dark" : "light",
      });
    }
  };

  const cancelEditing = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingSessionId(null);
    setEditingTitle("");
  };

  const filterSessions = (sessions: Session[], filter: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const eightDaysAgo = new Date(today);
    eightDaysAgo.setDate(today.getDate() - 8);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const filtered = sessions.filter((session) => {
      const sessionDate = parseTimestamp(session.timestamp); // FIXED
      const sessionDay = new Date(
        sessionDate.getFullYear(),
        sessionDate.getMonth(),
        sessionDate.getDate()
      );

      switch (filter) {
        case "today":
          return sessionDay.getTime() === today.getTime();
        case "yesterday":
          return sessionDay.getTime() === yesterday.getTime();
        case "last7days":
          return sessionDay >= sevenDaysAgo && sessionDay <= twoDaysAgo;
        case "last1month":
          return sessionDay >= thirtyDaysAgo && sessionDay <= eightDaysAgo;
        case "all":
          return true;
        default:
          return true;
      }
    });

    setFilteredSessions(filtered);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term) {
      const filtered = sessions.filter((session) =>
        session.title.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredSessions(filtered);
      setActiveFilter(""); // Clear active filter when searching
    } else {
      filterSessions(sessions, activeFilter);
    }
  };

  const hanleClearSearch = () => {
    setSearchTerm("");
    filterSessions(sessions, activeFilter);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setSearchTerm("");
    filterSessions(sessions, filter);
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
    const date = parseTimestamp(timestamp); // FIXED
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

  const getFirstMessage = (messages: Message[]) => {
    if (!messages || messages.length === 0) return "No messages";

    // Find the first message with actual content (backend only sends content for first user message)
    const firstMessageWithContent = messages.find(msg => msg.content && msg.content.trim().length > 0);

    if (!firstMessageWithContent || !firstMessageWithContent.content) {
      return "No messages";
    }

    return (
      firstMessageWithContent.content.substring(0, 60) +
      (firstMessageWithContent.content.length > 60 ? "..." : "")
    );
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
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.2 },
    },
    hover: {
      scale: 1.02,
      boxShadow: theme.shadow.md,
      transition: { duration: 0.2 },
    },
    selected: {
      scale: 0.98,
      opacity: 0.8,
      transition: { duration: 0.2 },
    },
  };

  const buttonVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95, transition: { duration: 0.1 } },
  };

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
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-2xl font-bold whitespace-nowrap flex items-center gap-2"
            style={{
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily,
              fontWeight: theme.typography.weight.bold,
            }}
          >
            <MessageSquare
              className="w-6 h-6"
              style={{ color: theme.colors.accent }}
            />
            Chat History
            <span
              className="text-sm px-2 py-1 rounded-full"
              style={{
                background: theme.colors.accent + "20",
                color: theme.colors.accent,
                fontWeight: theme.typography.weight.medium,
              }}
            >
              {filteredSessions.length}
            </span>
          </motion.h2>

          <motion.div
            className="relative w-full sm:w-64"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search chats... (⌘+K)"
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full p-3 pl-10 text-sm transition-all focus:outline-none focus:ring-2"
              style={{
                background: theme.colors.surface,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.default,
                fontFamily: theme.typography.fontFamily,
                fontSize: theme.typography.size.sm,
                boxShadow: theme.shadow.sm,
                focusRing: theme.colors.accent + "40",
              }}
            />
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: theme.colors.textSecondary }}
            />
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

        <motion.div
          className="flex flex-wrap mb-5 gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {filters.map((filter, index) => (
            <motion.button
              key={filter.id}
              onClick={() => handleFilterChange(filter.id)}
              variants={buttonVariants}
              whileTap="tap"
              className="px-4 py-2 text-sm transition-all flex items-center gap-2"
              style={{
                background:
                  activeFilter === filter.id
                    ? theme.colors.accent
                    : theme.colors.surface,
                color: activeFilter === filter.id ? "white" : theme.colors.text,
                border: `1px solid ${activeFilter === filter.id
                    ? theme.colors.accent
                    : theme.colors.border
                  }`,
                borderRadius: theme.borderRadius.pill,
                fontFamily: theme.typography.fontFamily,
                fontSize: theme.typography.size.sm,
                fontWeight: theme.typography.weight.medium,
                boxShadow:
                  activeFilter === filter.id
                    ? theme.shadow.md
                    : theme.shadow.sm,
                transition: theme.transition.default,
              }}
            >
              <span
                style={{
                  color:
                    activeFilter === filter.id ? "white" : theme.colors.accent,
                }}
              >
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
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col items-center">
              <div
                className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
                style={{
                  borderColor: `${theme.colors.accent}30`,
                  borderTopColor: "transparent",
                }}
              />
              <p className="mt-4" style={{ color: theme.colors.textSecondary }}>
                Loading your conversations...
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="flex-1 overflow-y-auto custom-scrollbar"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{
              maxHeight: "calc(100vh - 180px)",
              padding: "4px",
            }}
          >
            <AnimatePresence>
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session) => (
                  <motion.div
                    key={session.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate={
                      selectedSession === session.id ? "selected" : "visible"
                    }
                    exit="exit"
                    onClick={() => handleSessionClick(session)}
                    className="mb-4 p-4 rounded-lg overflow-hidden cursor-pointer"
                    style={{
                      background:
                        session.id === currentSessionId
                          ? `linear-gradient(135deg, ${theme.colors.surface}, ${theme.colors.accent}10)`
                          : theme.colors.surface,
                      border: `1px solid ${session.id === currentSessionId
                          ? theme.colors.accent + "40"
                          : theme.colors.border
                        }`,
                      borderRadius: theme.borderRadius.default,
                      boxShadow:
                        session.id === currentSessionId
                          ? theme.shadow.md
                          : theme.shadow.sm,
                      transition: theme.transition.default,
                    }}
                  >
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {session.id === editingSessionId ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  saveTitle(session.id);
                                } else if (e.key === "Escape") {
                                  cancelEditing();
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                              className="flex-1 p-2 text-sm focus:ring-2 focus:outline-none"
                              style={{
                                background: theme.colors.background,
                                color: theme.colors.text,
                                border: `1px solid ${theme.colors.accent}`,
                                borderRadius: theme.borderRadius.default,
                                fontFamily: theme.typography.fontFamily,
                                fontSize: theme.typography.size.base,
                                boxShadow: theme.shadow.sm,
                              }}
                            />
                            <CustomTooltip title="Save title">
                              <motion.button
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={(e) => saveTitle(session.id, e)}
                                className="p-2 rounded-full"
                                style={{
                                  color: "white",
                                  background: theme.colors.success,
                                  boxShadow: theme.shadow.sm,
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </motion.button>
                            </CustomTooltip>
                            <CustomTooltip title="Cancel">
                              <motion.button
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={(e) => cancelEditing(e)}
                                className="p-2 rounded-full"
                                style={{
                                  color: "white",
                                  background: theme.colors.textSecondary,
                                  boxShadow: theme.shadow.sm,
                                }}
                              >
                                <X className="h-4 w-4" />
                              </motion.button>
                            </CustomTooltip>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <h3
                                className="font-medium text-lg truncate"
                                style={{
                                  color: theme.colors.text,
                                  fontFamily: theme.typography.fontFamily,
                                  fontWeight: theme.typography.weight.bold,
                                }}
                              >
                                {session.title}
                              </h3>
                              {session.id === currentSessionId && (
                                <span
                                  className="text-xs px-2 py-1 rounded-full"
                                  style={{
                                    background: theme.colors.accent,
                                    color: "white",
                                    fontFamily: theme.typography.fontFamily,
                                    fontWeight: theme.typography.weight.medium,
                                  }}
                                >
                                  Active
                                </span>
                              )}
                            </div>

                            <p
                              className="text-sm mb-3 line-clamp-1 opacity-80"
                              style={{
                                color: theme.colors.textSecondary,
                                fontFamily: theme.typography.fontFamily,
                              }}
                            >
                              {getFirstMessage(session.messages)}
                            </p>

                            <div className="flex items-center gap-2">
                              <Clock
                                className="w-3 h-3"
                                style={{ color: theme.colors.textSecondary }}
                              />
                              <p
                                className="text-xs"
                                style={{
                                  color: theme.colors.textSecondary,
                                  fontFamily: theme.typography.fontFamily,
                                }}
                              >
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
                              fontFamily: theme.typography.fontFamily,
                              fontWeight: theme.typography.weight.medium,
                            }}
                          >
                            {(session.messages || []).length} msgs
                          </span>

                          <CustomTooltip title="Edit title">
                            <motion.button
                              variants={buttonVariants}
                              whileHover="hover"
                              whileTap="tap"
                              onClick={(e) => startEditing(session, e)}
                              className="p-1 rounded-full"
                              style={{
                                color: theme.colors.textSecondary,
                                background: theme.colors.surface + "80",
                              }}
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
                              style={{
                                color: theme.colors.error,
                                background: theme.colors.surface + "80",
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </motion.button>
                          </CustomTooltip>
                        </div>
                      )}
                    </div>

                    {/* Delete confirmation overlay */}
                    <AnimatePresence>
                      {showConfirmDelete === session.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute inset-0 flex items-center justify-center p-4 z-10"
                          style={{
                            background: theme.colors.surface + "E0",
                            backdropFilter: "blur(4px)",
                            borderRadius: theme.borderRadius.default,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            className="p-4 rounded-lg text-center"
                            style={{
                              background: theme.colors.background,
                              border: `1px solid ${theme.colors.border}`,
                              boxShadow: theme.shadow.lg,
                            }}
                          >
                            <h4
                              className="mb-3 font-bold"
                              style={{ color: theme.colors.text }}
                            >
                              Delete this conversation?
                            </h4>
                            <p
                              className="mb-4 text-sm"
                              style={{ color: theme.colors.textSecondary }}
                            >
                              This action cannot be undone.
                            </p>
                            <div className="flex justify-center gap-3">
                              <motion.button
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() => setShowConfirmDelete(null)}
                                className="px-4 py-2 rounded"
                                style={{
                                  background: theme.colors.surface,
                                  color: theme.colors.text,
                                  border: `1px solid ${theme.colors.border}`,
                                }}
                              >
                                Cancel
                              </motion.button>
                              <motion.button
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() => deleteSession(session.id)}
                                className="px-4 py-2 rounded"
                                style={{
                                  background: theme.colors.error,
                                  color: "white",
                                }}
                              >
                                Delete
                              </motion.button>
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
                    borderRadius: theme.borderRadius.default,
                    boxShadow: theme.shadow.sm,
                  }}
                >
                  <div className="flex flex-col items-center gap-4">
                    <MessageSquare
                      size={40}
                      style={{ color: theme.colors.accent + "50" }}
                    />
                    <div>
                      <h3
                        className="font-medium mb-2"
                        style={{ color: theme.colors.text }}
                      >
                        {searchTerm
                          ? "No matching sessions found"
                          : "No sessions found for this period"}
                      </h3>
                      <p
                        className="text-sm mb-4"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        {searchTerm
                          ? "Try a different search term or clear the search"
                          : "Start a new conversation or select a different time period"}
                      </p>

                      {searchTerm && (
                        <button
                          onClick={hanleClearSearch}
                          className="px-4 py-2 text-sm font-medium rounded-md transition duration-200"
                          style={{
                            backgroundColor: theme.colors.accent,
                            color: "white",
                          }}
                        >
                          Clear Search
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Add custom styles for scrollbar */}
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: ${theme.colors.background}80;
            border-radius: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${theme.colors.accent}30;
            border-radius: 8px;
            transition: all 0.3s ease;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${theme.colors.accent}50;
          }
          @keyframes gradient {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
        `}</style>
      </motion.div>
    </div>
  );
};

export default History;
