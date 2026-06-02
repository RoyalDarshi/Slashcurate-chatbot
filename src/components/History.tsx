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
  HistoryIcon,
  Sparkles,
  Filter,
  Pin,
  ArrowUpDown,
  CheckSquare,
  Square,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../ThemeContext";
import CustomTooltip from "./CustomTooltip";
import { historyService } from "../services/historyService";
import { connectionService } from "../services/connectionService";
import { handleApiError } from "../utils/errorHandler";
import { toast } from "react-toastify";
import ReactDOM from "react-dom";

/* ─────────────────────────────────────────────────────────────────
   TIMESTAMP FIX — ALWAYS PARSES MISSING TIMEZONE AS UTC
───────────────────────────────────────────────────────────────── */
const parseTimestamp = (ts: string | number) => {
  if (!ts) return new Date();
  if (typeof ts === "string" && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(ts)) {
    return new Date(ts + "Z");
  }
  return new Date(ts);
};

/* Helper to highlight matched search terms */
const highlightText = (text: string, highlight: string, activeColor: string) => {
  if (!highlight.trim()) return <span>{text}</span>;
  const regex = new RegExp(
    `(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`,
    "gi"
  );
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

/* Deterministic color from a string (for avatars) */
const stringToColor = (str: string) => {
  const palette = [
    "#6366F1", "#0EA5E9", "#10B981", "#F59E0B",
    "#EC4899", "#8B5CF6", "#14B8A6", "#F97316",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};

/* ─────────────────────────────────────────────────────────────────
   DELETE CONFIRMATION MODAL — rendered via portal so it's never
   clipped by overflow:hidden on any ancestor card.
───────────────────────────────────────────────────────────────── */
interface DeleteModalProps {
  sessionId: string;
  isDark: boolean;
  textColor: string;
  textSecondary: string;
  onConfirm: (id: string) => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteModalProps> = ({
  sessionId,
  isDark,
  textColor,
  textSecondary,
  onConfirm,
  onCancel,
}) => {
  return ReactDOM.createPortal(
    <motion.div
      key="delete-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.35)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <motion.div
        key="delete-dialog"
        initial={{ opacity: 0, scale: 0.88, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 16 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isDark ? "#131C2E" : "#ffffff",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
          borderRadius: 20,
          padding: "28px 32px",
          minWidth: 300,
          maxWidth: 360,
          boxShadow: isDark
            ? "0 24px 64px rgba(0,0,0,0.6)"
            : "0 24px 64px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "rgba(239,68,68,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 4,
          }}
        >
          <AlertCircle
            style={{ width: 26, height: 26, color: "#EF4444" }}
          />
        </div>

        <p style={{ fontWeight: 800, fontSize: 16, color: textColor, margin: 0 }}>
          Delete this session?
        </p>
        <p style={{ fontSize: 13, color: textSecondary, margin: 0, lineHeight: 1.5 }}>
          This will permanently remove the conversation and all its messages. This action cannot be undone.
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 8, width: "100%" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "9px 16px",
              borderRadius: 12,
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              color: textSecondary,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = isDark
                ? "rgba(255,255,255,0.10)"
                : "rgba(0,0,0,0.07)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.04)";
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(sessionId)}
            style={{
              flex: 1,
              padding: "9px 16px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #EF4444, #DC2626)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(239,68,68,0.35)",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 6px 20px rgba(239,68,68,0.5)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 4px 14px rgba(239,68,68,0.35)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};

/* ─────────────────────────────────────────────────────────────────
   BULK DELETE CONFIRMATION MODAL
───────────────────────────────────────────────────────────────── */
interface BulkDeleteModalProps {
  count: number;
  isDark: boolean;
  textColor: string;
  textSecondary: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const BulkDeleteConfirmModal: React.FC<BulkDeleteModalProps> = ({
  count,
  isDark,
  textColor,
  textSecondary,
  onConfirm,
  onCancel,
}) => {
  return ReactDOM.createPortal(
    <motion.div
      key="bulk-delete-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.35)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <motion.div
        key="bulk-delete-dialog"
        initial={{ opacity: 0, scale: 0.88, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 16 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isDark ? "#131C2E" : "#ffffff",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
          borderRadius: 20,
          padding: "28px 32px",
          minWidth: 300,
          maxWidth: 360,
          boxShadow: isDark
            ? "0 24px 64px rgba(0,0,0,0.6)"
            : "0 24px 64px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "rgba(239,68,68,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 4,
          }}
        >
          <AlertCircle
            style={{ width: 26, height: 26, color: "#EF4444" }}
          />
        </div>

        <p style={{ fontWeight: 800, fontSize: 16, color: textColor, margin: 0 }}>
          Delete {count} sessions?
        </p>
        <p style={{ fontSize: 13, color: textSecondary, margin: 0, lineHeight: 1.5 }}>
          This will permanently delete the {count} selected conversations and all of their messages. This action cannot be undone.
        </p>

        <div style={{ display: "flex", gap: 10, marginTop: 8, width: "100%" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "9px 16px",
              borderRadius: 12,
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              color: textSecondary,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "9px 16px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #EF4444, #DC2626)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(239,68,68,0.35)",
              transition: "all 0.15s",
            }}
          >
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};

/* ─────────────────────────────────────────────────────────────────
   INTERFACES
───────────────────────────────────────────────────────────────── */
interface Session {
  id: string;
  messages: Message[];
  timestamp: string;
  connection: string;
  title: string;
  messageCount?: number;
  preview?: string;
  is_pinned?: boolean;
  pinned_at?: string | null;
}

interface ConnectionOption {
  id: number;
  connectionName: string;
}

interface HistoryProps {
  onSessionClicked: () => void;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
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
  const [connectionFilter, setConnectionFilter] = useState<string>(""); // "" = all connections
  const [connections, setConnections] = useState<ConnectionOption[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  const token = sessionStorage.getItem("token") ?? "";
  const currentSessionId = localStorage.getItem("currentSessionId");
  const isDark = theme.mode === "dark";
  const mode = isDark ? "dark" : "light";
  const accent = theme.colors.accent;

  /* ── Keyboard shortcut ── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        if (showConfirmDelete) setShowConfirmDelete(null);
        if (showBulkDeleteConfirm) setShowBulkDeleteConfirm(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showConfirmDelete, showBulkDeleteConfirm]);

  // Load available connections for the filter dropdown
  useEffect(() => {
    connectionService.getUserConnections()
      .then((data) => setConnections(data.connections ?? []))
      .catch(() => {}); // non-critical, silently ignore
  }, []);

  useEffect(() => {
    loadSessions(activeFilter, connectionFilter);
  }, [activeFilter, connectionFilter]);

  const loadSessions = async (filter: string, connName?: string) => {
    setIsLoading(true);
    if (!token) { setIsLoading(false); return; }
    try {
      const fetchedSessions = await historyService.fetchSessions(
        filter,
        connName || undefined
      );
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

  const togglePin = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await historyService.togglePin(sessionId);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, is_pinned: response.is_pinned, pinned_at: response.pinned_at }
            : s
        )
      );
      toast.success(response.is_pinned ? "Session pinned." : "Session unpinned.", {
        style: {
          background: theme.colors.surface,
          color: theme.colors.success,
          border: `1px solid ${theme.colors.success}20`,
          borderRadius: theme.borderRadius.default,
        },
        theme: mode,
      });
    } catch (error) {
      handleApiError(error, "Failed to toggle pin", mode);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await historyService.bulkDelete(selectedIds);
      setSessions((prev) => prev.filter((s) => !selectedIds.includes(s.id)));
      
      const currentId = localStorage.getItem("currentSessionId");
      if (currentId && selectedIds.includes(currentId)) {
        localStorage.removeItem("currentSessionId");
      }
      
      toast.success(`Successfully deleted ${selectedIds.length} sessions.`, {
        style: {
          background: theme.colors.surface,
          color: theme.colors.success,
          border: `1px solid ${theme.colors.success}20`,
          borderRadius: theme.borderRadius.default,
        },
        theme: mode,
      });
      setSelectedIds([]);
      setShowBulkDeleteConfirm(false);
    } catch (error) {
      handleApiError(error, "Failed to delete sessions", mode);
    }
  };

  const handleToggleSelect = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(sessionId)
        ? prev.filter((id) => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const handleSelectAll = () => {
    const displayedIds = displayedSessions.map((s) => s.id);
    const allSelected = displayedIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !displayedIds.includes(id)));
    } else {
      setSelectedIds((prev) => {
        const union = new Set([...prev, ...displayedIds]);
        return Array.from(union);
      });
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
        prev.map((s) => (s.id === sessionId ? { ...s, title: editingTitle } : s))
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

  const handleSessionClick = async (session: Session) => {
    if (showConfirmDelete || editingSessionId) return;
    if (selectedIds.length > 0) {
      setSelectedIds((prev) =>
        prev.includes(session.id)
          ? prev.filter((id) => id !== session.id)
          : [...prev, session.id]
      );
      return;
    }
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
    const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (isToday) return `Today · ${time}`;
    if (isYesterday) return `Yesterday · ${time}`;
    return (
      date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) +
      ` · ${time}`
    );
  };

  const filters = [
    { id: "today",      label: "Today",       icon: <Clock className="w-3.5 h-3.5" /> },
    { id: "yesterday",  label: "Yesterday",   icon: <Clock className="w-3.5 h-3.5" /> },
    { id: "last7days",  label: "Last 7 Days", icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { id: "last1month", label: "Last Month",  icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { id: "all",        label: "All Chats",   icon: <MessageSquare className="w-3.5 h-3.5" /> },
  ];

  /* ── Grouping logic for date headers ── */
  const groupSessions = (sessionsList: Session[]) => {
    const pinned: Session[] = [];
    const today: Session[] = [];
    const yesterday: Session[] = [];
    const thisWeek: Session[] = [];
    const thisMonth: Session[] = [];
    const older: Session[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const monthStart = new Date(todayStart);
    monthStart.setDate(monthStart.getDate() - 30);

    sessionsList.forEach((session) => {
      if (session.is_pinned) {
        pinned.push(session);
        return;
      }

      const date = parseTimestamp(session.timestamp);
      if (date >= todayStart) {
        today.push(session);
      } else if (date >= yesterdayStart) {
        yesterday.push(session);
      } else if (date >= weekStart) {
        thisWeek.push(session);
      } else if (date >= monthStart) {
        thisMonth.push(session);
      } else {
        older.push(session);
      }
    });

    return {
      Pinned: pinned,
      Today: today,
      Yesterday: yesterday,
      "This Week": thisWeek,
      "This Month": thisMonth,
      Older: older,
    };
  };

  const getEmptyStateContent = () => {
    if (searchTerm) {
      return {
        title: "No matches found",
        description: `We couldn't find any chats matching "${searchTerm}". Try checking your spelling or using different keywords.`,
        icon: <Search size={28} style={{ color: accent }} />,
      };
    }
    
    if (connectionFilter) {
      return {
        title: `No chats for ${connectionFilter}`,
        description: `There are no conversations associated with the connection "${connectionFilter}" in this time range.`,
        icon: <Database size={28} style={{ color: accent }} />,
      };
    }

    switch (activeFilter) {
      case "today":
        return {
          title: "No chats today",
          description: "You haven't started any conversations today. Start a new chat to begin!",
          icon: <Clock size={28} style={{ color: accent }} />,
        };
      case "yesterday":
        return {
          title: "No chats yesterday",
          description: "No conversations recorded from yesterday.",
          icon: <Clock size={28} style={{ color: accent }} />,
        };
      case "last7days":
        return {
          title: "Clean week",
          description: "No conversations in the last 7 days.",
          icon: <CalendarDays size={28} style={{ color: accent }} />,
        };
      case "last1month":
        return {
          title: "No chats last month",
          description: "No conversations recorded from last month.",
          icon: <CalendarDays size={28} style={{ color: accent }} />,
        };
      default:
        return {
          title: "No chat history",
          description: "Your conversations will appear here. Start a new chat to get started!",
          icon: <Sparkles size={28} style={{ color: accent }} />,
        };
    }
  };

  // Get displayed sessions: Search and sort
  const displayedSessions = (() => {
    let list = [...sessions];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (session) =>
          session.title.toLowerCase().includes(term) ||
          session.connection.toLowerCase().includes(term) ||
          (session.preview && session.preview.toLowerCase().includes(term))
      );
    }
    
    list.sort((a, b) => {
      const timeA = parseTimestamp(a.timestamp).getTime();
      const timeB = parseTimestamp(b.timestamp).getTime();
      return sortBy === "newest" ? timeB - timeA : timeA - timeB;
    });
    
    return list;
  })();

  const groupedSessions = groupSessions(displayedSessions);
  const groupKeys = ["Pinned", "Today", "Yesterday", "This Week", "This Month", "Older"] as const;

  /* framer variants */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3, staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden:   { opacity: 0, y: 12, scale: 0.98 },
    visible:  { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 320, damping: 26 } },
    exit:     { opacity: 0, x: 80, scale: 0.95, transition: { duration: 0.28 } },
    selected: { scale: 0.97, opacity: 0.85, transition: { duration: 0.18 } },
  };

  /* shared card styles */
  const cardBase = {
    background: isDark ? "rgba(19,28,46,0.7)" : "#ffffff",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: isDark
      ? "0 4px 20px -4px rgba(0,0,0,0.4)"
      : "0 2px 16px -4px rgba(0,0,0,0.07)",
  };

  const activeCardBase = {
    background: isDark
      ? `linear-gradient(135deg, rgba(30,41,59,0.55), rgba(99,102,241,0.18))`
      : `linear-gradient(135deg, #ffffff, rgba(79,70,229,0.05))`,
    border: `1.5px solid ${accent}`,
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: `0 8px 28px -6px ${accent}28`,
  };

  const pinnedCardBase = {
    background: isDark ? "rgba(245,158,11,0.04)" : "rgba(245,158,11,0.02)",
    border: `1px solid ${isDark ? "rgba(245,158,11,0.25)" : "rgba(245,158,11,0.18)"}`,
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: isDark
      ? "0 4px 20px -4px rgba(245,158,11,0.08)"
      : "0 2px 16px -4px rgba(245,158,11,0.04)",
  };

  /* ── Inline skeleton card ── */
  const renderSkeleton = (isGrid: boolean) => (
    <div
      className="animate-pulse rounded-2xl p-5 flex flex-col gap-3"
      style={{ ...cardBase, minHeight: isGrid ? 170 : "auto" }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex-shrink-0"
          style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }} />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/5 rounded-lg"
            style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }} />
          <div className="h-3 w-1/4 rounded-lg"
            style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
        </div>
      </div>
      <div className="h-3 w-3/4 rounded-lg"
        style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
      <div className="h-3 w-1/2 rounded-lg"
        style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }} />
    </div>
  );

  /* ── Inline edit row ── */
  const renderEditRow = (session: Session) => (
    <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
      <input
        type="text"
        value={editingTitle}
        onChange={(e) => setEditingTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") saveTitle(session.id);
          else if (e.key === "Escape") cancelEditing();
        }}
        autoFocus
        className="flex-1 px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none border font-semibold"
        style={{
          background: theme.colors.background,
          color: theme.colors.text,
          borderColor: accent,
          borderRadius: theme.borderRadius.default,
        }}
      />
      <motion.button
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
        onClick={(e) => saveTitle(session.id, e)}
        className="p-1.5 rounded-lg text-white flex-shrink-0"
        style={{ backgroundColor: theme.colors.success }}
      >
        <Check size={15} />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
        onClick={cancelEditing}
        className="p-1.5 rounded-lg text-white flex-shrink-0 bg-slate-500"
      >
        <X size={15} />
      </motion.button>
    </div>
  );

  /* ── Inline action buttons ── */
  const renderActions = (session: Session) => (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {/* Pin / Star Toggle */}
      <CustomTooltip title={session.is_pinned ? "Unpin Chat" : "Pin Chat"}>
        <motion.button
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
          onClick={(e) => togglePin(session.id, e)}
          className="p-1.5 rounded-lg border transition-all focus:outline-none"
          style={{
            color: session.is_pinned ? "#F59E0B" : theme.colors.textSecondary,
            borderColor: session.is_pinned ? "rgba(245,158,11,0.25)" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
            background: session.is_pinned 
              ? "rgba(245,158,11,0.12)"
              : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          }}
        >
          {session.is_pinned ? (
            <Pin className="h-3.5 w-3.5 fill-current" />
          ) : (
            <Pin className="h-3.5 w-3.5" />
          )}
        </motion.button>
      </CustomTooltip>

      <CustomTooltip title="Edit Title">
        <motion.button
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
          onClick={(e) => startEditing(session, e)}
          className="p-1.5 rounded-lg border transition-all focus:outline-none"
          style={{
            color: theme.colors.textSecondary,
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </motion.button>
      </CustomTooltip>

      <CustomTooltip title="Delete Chat">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={(e) => { e.stopPropagation(); setShowConfirmDelete(session.id); }}
          className="p-1.5 rounded-lg border transition-all focus:outline-none"
          style={{
            color: theme.colors.error,
            borderColor: isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.12)",
            background: isDark ? "rgba(239,68,68,0.04)" : "rgba(239,68,68,0.03)",
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </motion.button>
      </CustomTooltip>
    </div>
  );

  /* ── Render single Grid item ── */
  const renderSessionCard = (session: Session) => {
    const isActive = session.id === currentSessionId;
    const isSelected = selectedIds.includes(session.id);
    const avatarColor = stringToColor(session.title + session.connection);
    const queryCount = Math.max(0, (session?.messageCount ?? 0) / 2);

    let style = cardBase;
    if (isActive) {
      style = activeCardBase;
    } else if (session.is_pinned) {
      style = pinnedCardBase;
    }

    return (
      <motion.div
        key={session.id}
        variants={itemVariants}
        animate={selectedSession === session.id ? "selected" : "visible"}
        exit="exit"
        layout="position"
        onClick={() => handleSessionClick(session)}
        className="relative rounded-2xl cursor-pointer group overflow-hidden flex flex-col transition-all duration-300"
        style={{
          ...style,
          minHeight: 170,
        }}
        whileHover={{ y: -2 }}
      >
        {/* Active left accent bar */}
        {isActive && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
            style={{ background: `linear-gradient(180deg, ${accent}, ${theme.colors.accentHover || accent})` }}
          />
        )}

        <div className="flex flex-col h-full p-5 gap-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {/* Checkbox Container */}
              <div 
                className={`flex-shrink-0 transition-all duration-200 flex items-center justify-center ${
                  selectedIds.length > 0 ? "w-6 opacity-100 mr-1" : "w-0 opacity-0 group-hover:w-6 group-hover:opacity-100 group-hover:mr-1"
                }`}
                onClick={(e) => handleToggleSelect(session.id, e)}
              >
                {isSelected ? (
                  <CheckSquare className="w-5 h-5" style={{ color: accent }} />
                ) : (
                  <Square className="w-5 h-5 opacity-60" style={{ color: theme.colors.textSecondary }} />
                )}
              </div>

              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
                style={{ background: `linear-gradient(135deg, ${avatarColor}cc, ${avatarColor}88)` }}
              >
                {session.title.charAt(0).toUpperCase()}
              </div>

              {session.id === editingSessionId ? (
                renderEditRow(session)
              ) : (
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3
                      className="font-bold text-sm truncate"
                      style={{ color: theme.colors.text }}
                    >
                      {highlightText(session.title, searchTerm, accent)}
                    </h3>
                    {isActive && (
                      <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                      </span>
                    )}
                  </div>
                  {session.connection && (
                    <span
                      className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider mt-0.5"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      <Database className="w-2.5 h-2.5" style={{ color: accent }} />
                      {highlightText(session.connection, searchTerm, accent)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons (hover-reveal) */}
            {session.id !== editingSessionId && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {renderActions(session)}
              </div>
            )}
          </div>

          {/* Preview content */}
          {session.preview && (
            <p 
              className="text-xs line-clamp-2 mt-1 flex-1 opacity-80"
              style={{ color: theme.colors.textSecondary }}
            >
              {highlightText(session.preview, searchTerm, accent)}
            </p>
          )}

          {/* Footer */}
          <div
            className="flex items-center justify-between pt-2.5 border-t mt-auto"
            style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" style={{ color: theme.colors.textSecondary }} />
              <span className="text-[11px]" style={{ color: theme.colors.textSecondary }}>
                {formatTimestamp(session.timestamp)}
              </span>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
              style={{ background: `${accent}14`, color: accent }}
            >
              {queryCount} {queryCount === 1 ? "Query" : "Queries"}
            </span>
          </div>
        </div>

        {/* Hover arrow */}
        {!editingSessionId && (
          <div
            className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: accent }}
          >
            <ChevronRight size={16} />
          </div>
        )}
      </motion.div>
    );
  };

  /* ── Render single List row ── */
  const renderSessionRow = (session: Session) => {
    const isActive = session.id === currentSessionId;
    const isSelected = selectedIds.includes(session.id);
    const avatarColor = stringToColor(session.title + session.connection);
    const queryCount = Math.max(0, (session?.messageCount ?? 0) / 2);

    let style = cardBase;
    if (isActive) {
      style = activeCardBase;
    } else if (session.is_pinned) {
      style = pinnedCardBase;
    }

    return (
      <motion.div
        key={session.id}
        variants={itemVariants}
        animate={selectedSession === session.id ? "selected" : "visible"}
        exit="exit"
        layout="position"
        onClick={() => handleSessionClick(session)}
        className="relative rounded-2xl cursor-pointer group overflow-hidden transition-all duration-300"
        style={style}
        whileHover={{ y: -1 }}
      >
        {/* Active left accent bar */}
        {isActive && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
            style={{ background: `linear-gradient(180deg, ${accent}, ${theme.colors.accentHover || accent})` }}
          />
        )}

        <div className="flex items-center gap-3 px-5 py-4 pl-6">
          {/* Checkbox Container */}
          <div 
            className={`flex-shrink-0 transition-all duration-200 flex items-center justify-center ${
              selectedIds.length > 0 ? "w-6 opacity-100 mr-1" : "w-0 opacity-0 group-hover:w-6 group-hover:opacity-100 group-hover:mr-1"
            }`}
            onClick={(e) => handleToggleSelect(session.id, e)}
          >
            {isSelected ? (
              <CheckSquare className="w-5 h-5" style={{ color: accent }} />
            ) : (
              <Square className="w-5 h-5 opacity-60" style={{ color: theme.colors.textSecondary }} />
            )}
          </div>

          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
            style={{ background: `linear-gradient(135deg, ${avatarColor}cc, ${avatarColor}88)` }}
          >
            {session.title.charAt(0).toUpperCase()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {session.id === editingSessionId ? (
              renderEditRow(session)
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    className="font-bold text-sm truncate max-w-xs md:max-w-md"
                    style={{ color: theme.colors.text }}
                  >
                    {highlightText(session.title, searchTerm, accent)}
                  </h3>
                  {isActive && (
                    <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                  )}
                  {session.connection && (
                    <span
                      className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider"
                      style={{
                        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                        color: theme.colors.textSecondary,
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
                      }}
                    >
                      <Database className="w-2.5 h-2.5" style={{ color: accent }} />
                      {highlightText(session.connection, searchTerm, accent)}
                    </span>
                  )}
                </div>

                {session.preview && (
                  <p 
                    className="text-xs line-clamp-1 mt-0.5 opacity-70 truncate max-w-lg"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {highlightText(session.preview, searchTerm, accent)}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" style={{ color: theme.colors.textSecondary }} />
                    <span className="text-[11px]" style={{ color: theme.colors.textSecondary }}>
                      {formatTimestamp(session.timestamp)}
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                    style={{ background: `${accent}14`, color: accent }}
                  >
                    {queryCount} {queryCount === 1 ? "Query" : "Queries"}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Actions (hover-reveal) */}
          {session.id !== editingSessionId && (
            <div
              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {renderActions(session)}
              <ChevronRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
                style={{ color: accent }}
              />
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div
      className="h-full overflow-hidden flex flex-col transition-colors duration-500"
      style={{ background: theme.colors.background }}
    >
      {/* ════════════════════════════════════════
          PORTAL: Delete Confirmation Modal
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {showConfirmDelete && (
          <DeleteConfirmModal
            sessionId={showConfirmDelete}
            isDark={isDark}
            textColor={theme.colors.text}
            textSecondary={theme.colors.textSecondary}
            onConfirm={deleteSession}
            onCancel={() => setShowConfirmDelete(null)}
          />
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════
          PORTAL: Bulk Delete Confirmation Modal
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {showBulkDeleteConfirm && (
          <BulkDeleteConfirmModal
            count={selectedIds.length}
            isDark={isDark}
            textColor={theme.colors.text}
            textSecondary={theme.colors.textSecondary}
            onConfirm={handleBulkDelete}
            onCancel={() => setShowBulkDeleteConfirm(false)}
          />
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════
          STICKY HEADER
      ════════════════════════════════════════ */}
      <div
        className="flex-shrink-0 px-4 md:px-8 pt-6 pb-4"
        style={{
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
          background: isDark
            ? "linear-gradient(180deg, rgba(9,13,22,1) 0%, rgba(9,13,22,0.95) 100%)"
            : "linear-gradient(180deg, rgba(250,250,250,1) 0%, rgba(250,250,250,0.95) 100%)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${accent} 0%, ${theme.colors.accentHover || accent} 100%)`,
                  boxShadow: `0 4px 14px ${accent}50`,
                }}
              >
                <HistoryIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1
                    className="text-xl md:text-2xl font-extrabold tracking-tight"
                    style={{ color: theme.colors.text }}
                  >
                    Chat History
                  </h1>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-bold border"
                    style={{
                      background: `${accent}12`,
                      color: accent,
                      borderColor: `${accent}20`,
                    }}
                  >
                    {displayedSessions.length}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: theme.colors.textSecondary }}>
                  Browse and resume your previous conversations
                </p>
              </div>
            </div>

            {/* Search + filters + actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search bar */}
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search… (⌘K)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="py-2 pl-9 pr-8 text-sm focus:outline-none transition-all w-42 md:w-52"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                    color: theme.colors.text,
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                    borderRadius: 12,
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = `${accent}60`;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${accent}15`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.08)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                  style={{ color: theme.colors.textSecondary }}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Connection filter dropdown */}
              {connections.length > 0 && (
                <div className="relative">
                  <Filter
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none"
                    style={{ color: connectionFilter ? accent : theme.colors.textSecondary }}
                  />
                  <select
                    value={connectionFilter}
                    onChange={(e) => { setConnectionFilter(e.target.value); setSearchTerm(""); }}
                    className="appearance-none py-2 pl-8 pr-7 text-sm focus:outline-none transition-all cursor-pointer"
                    style={{
                      background: connectionFilter
                        ? isDark ? `${accent}20` : `${accent}10`
                        : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                      color: connectionFilter ? accent : theme.colors.textSecondary,
                      border: `1px solid ${connectionFilter ? `${accent}40` : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                      borderRadius: 12,
                      minWidth: 130,
                      fontWeight: connectionFilter ? 600 : 400,
                    }}
                  >
                    <option value="">All Connections</option>
                    {connections.map((c) => (
                      <option key={c.id} value={c.connectionName}>
                        {c.connectionName}
                      </option>
                    ))}
                  </select>
                  <ChevronRight
                    size={12}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none"
                    style={{ color: connectionFilter ? accent : theme.colors.textSecondary }}
                  />
                  {connectionFilter && (
                    <button
                      onClick={() => setConnectionFilter("")}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white"
                      style={{ background: accent, fontSize: 9, lineHeight: 1 }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}

              {/* Sort Toggle */}
              <button
                onClick={() => setSortBy((prev) => prev === "newest" ? "oldest" : "newest")}
                className="p-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-semibold border"
                style={{
                  background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                  color: theme.colors.textSecondary,
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                }}
              >
                <ArrowUpDown size={14} style={{ color: sortBy === "oldest" ? accent : undefined }} />
                <span className="hidden sm:inline">
                  {sortBy === "newest" ? "Newest" : "Oldest"}
                </span>
              </button>

              {/* Select All Toggle (only when selection active) */}
              {selectedIds.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="p-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-semibold border"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                    color: theme.colors.textSecondary,
                    borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                  }}
                >
                  <CheckSquare size={14} style={{ color: accent }} />
                  <span className="hidden sm:inline">Select All</span>
                </button>
              )}

              {/* Grid / List toggle */}
              <div
                className="flex p-1 gap-1 rounded-xl"
                style={{
                  background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`,
                }}
              >
                {(["grid", "list"] as const).map((vm) => (
                  <button
                    key={vm}
                    onClick={() => setViewMode(vm)}
                    className="p-2 rounded-lg transition-all flex items-center justify-center"
                    style={{
                      background: viewMode === vm ? accent : "transparent",
                      color: viewMode === vm ? "#fff" : theme.colors.textSecondary,
                      boxShadow: viewMode === vm ? `0 2px 8px ${accent}40` : "none",
                    }}
                  >
                    {vm === "grid" ? <Grid size={15} /> : <List size={15} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filter strip */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
            {filters.map((filter) => {
              const active = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => { setActiveFilter(filter.id); setSearchTerm(""); }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex-shrink-0"
                  style={{
                    background: active
                      ? `linear-gradient(135deg, ${accent}, ${theme.colors.accentHover || accent})`
                      : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                    color: active ? "#fff" : theme.colors.textSecondary,
                    border: `1px solid ${active ? "transparent" : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
                    boxShadow: active ? `0 4px 12px ${accent}40` : "none",
                  }}
                >
                  <span style={{ color: active ? "#fff" : accent }}>{filter.icon}</span>
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          SCROLLABLE CONTENT AREA
      ════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-8 py-5">
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-3"}>
              {[1, 2, 3, 4].map((n) => (
                <React.Fragment key={n}>{renderSkeleton(viewMode === "grid")}</React.Fragment>
              ))}
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <AnimatePresence mode="popLayout">
                {displayedSessions.length > 0 ? (
                  groupKeys.map((groupName) => {
                    const groupSessionsList = groupedSessions[groupName];
                    if (groupSessionsList.length === 0) return null;

                    return (
                      <div key={groupName} className="mb-8 w-full">
                        {/* Group Header */}
                        <div className="flex items-center gap-3 mb-4">
                          <span 
                            className={`text-xs font-black tracking-widest uppercase flex items-center gap-1.5`}
                            style={{ 
                              color: groupName === "Pinned" ? "#F59E0B" : theme.colors.textSecondary,
                              opacity: groupName === "Pinned" ? 1 : 0.6 
                            }}
                          >
                            {groupName === "Pinned" && <Pin className="w-3.5 h-3.5 fill-current animate-bounce" />}
                            {groupName}
                          </span>
                          <div 
                            className="flex-1 h-px" 
                            style={{ 
                              background: groupName === "Pinned" 
                                ? "linear-gradient(90deg, rgba(245,158,11,0.3), transparent)"
                                : `linear-gradient(90deg, ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}, transparent)`
                            }} 
                          />
                        </div>

                        {/* Group Body */}
                        {viewMode === "grid" ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {groupSessionsList.map((session) => renderSessionCard(session))}
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {groupSessionsList.map((session) => renderSessionRow(session))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  /* ── Empty state (Context-Aware) ── */
                  (() => {
                    const emptyState = getEmptyStateContent();
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-20 rounded-2xl"
                        style={{ ...cardBase, borderStyle: "dashed" }}
                      >
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                          style={{ background: `${accent}12` }}
                        >
                          {emptyState.icon}
                        </div>
                        <h3 className="font-bold text-lg mb-1" style={{ color: theme.colors.text }}>
                          {emptyState.title}
                        </h3>
                        <p className="text-sm text-center max-w-xs px-4" style={{ color: theme.colors.textSecondary }}>
                          {emptyState.description}
                        </p>
                      </motion.div>
                    );
                  })()
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════
          FLOATING BULK ACTION BAR
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border"
            style={{
              background: isDark ? "rgba(19, 28, 46, 0.95)" : "rgba(255, 255, 255, 0.95)",
              borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              minWidth: "320px",
              justifyContent: "space-between",
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold" style={{ color: theme.colors.text }}>
                {selectedIds.length} chat{selectedIds.length > 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:bg-black/5 dark:hover:bg-white/5"
                style={{
                  color: theme.colors.textSecondary,
                  background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-md"
                style={{
                  background: "linear-gradient(135deg, #EF4444, #DC2626)",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)",
                }}
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${accent}25;
          border-radius: 99px;
          transition: background 0.3s;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${accent}50; }
      `}</style>
    </div>
  );
};

export default History;
