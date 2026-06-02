import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../ThemeContext";
import {
  Heart,
  Search,
  X,
  ChevronRight,
  Trash2,
  BookmarkCheck,
  AlertCircle,
  Database,
  Grid,
  List,
  Sparkles,
  ArrowUpDown,
  CheckSquare,
  Square,
  Clock,
  CalendarDays,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { historyService } from "../services/historyService";
import { handleApiError } from "../utils/errorHandler";
import CustomTooltip from "./CustomTooltip";
import { toast } from "react-toastify";
import ReactDOM from "react-dom";

/* Helper to parse database timestamps as UTC if timezone is missing */
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
   DELETE CONFIRMATION MODAL — rendered via portal
───────────────────────────────────────────────────────────────── */
interface DeleteModalProps {
  favoriteId: string;
  favoriteConnection: string;
  isDark: boolean;
  textColor: string;
  textSecondary: string;
  onConfirm: (id: string, connection: string) => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteModalProps> = ({
  favoriteId,
  favoriteConnection,
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
          Remove from favorites?
        </p>
        <p style={{ fontSize: 13, color: textSecondary, margin: 0, lineHeight: 1.5 }}>
          This will remove this query from your favorites list.
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
            onClick={() => onConfirm(favoriteId, favoriteConnection)}
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
            Remove
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
          Remove {count} favorites?
        </p>
        <p style={{ fontSize: 13, color: textSecondary, margin: 0, lineHeight: 1.5 }}>
          This will permanently remove the {count} selected items from your favorites. This action cannot be undone.
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
            Remove
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
interface FavoriteMessage {
  id: string;
  text: string;
  query: string;
  connection: string;
  isFavorited: boolean;
  timestamp?: string;
  count: number;
}

interface FavoritesProps {
  onFavoriteSelected: (
    question: string,
    connection: string,
    query?: string
  ) => void;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
const Favorites = ({ onFavoriteSelected }: FavoritesProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<FavoriteMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showConfirmDelete, setShowConfirmDelete] = useState<{ id: string; connection: string } | null>(null);
  const { theme } = useTheme();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [sortBy, setSortBy] = useState<"popularity" | "newest" | "oldest">("popularity");

  const token = sessionStorage.getItem("token") ?? "demo-token";
  const isDark = theme.mode === "dark";
  const mode = isDark ? "dark" : "light";
  const accent = theme.colors.accent;

  // Search shortcut (⌘+K / Ctrl+K)
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

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        if (!token) {
          setError("Authentication required");
          return;
        }

        const data = await historyService.fetchFavourites();
        if (data) {
          const formattedData = data.map((item: any) => ({
            id: item.question_id,
            text: item.question,
            query: item.query || undefined,
            isFavorited: true,
            connection: item.connection,
            timestamp: item.timestamp,
            count: item.count || 1,
          }));
          setFavorites(formattedData);
        }
      } catch (err) {
        handleApiError(err, "Failed to load favorites", mode);
        setError("Failed to load favorites");
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [token]);

  const handleRemoveFavorite = async (id: string, favoriteConnection: string) => {
    try {
      if (!token) {
        setError("Authentication required");
        return;
      }

      const fallbackConnection = localStorage.getItem("selectedConnection");
      const connectionToDelete = favoriteConnection || fallbackConnection;

      await historyService.deleteFavourite(id, connectionToDelete);
      setFavorites((prev) => prev.filter((msg) => msg.id !== id));
      toast.success("Removed from favorites", {
        style: {
          background: theme.colors.surface,
          color: theme.colors.success,
          border: `1px solid ${theme.colors.success}20`,
          borderRadius: theme.borderRadius.default,
        },
        theme: mode,
      });
    } catch (err) {
      handleApiError(err, "Failed to remove favorite", mode);
    } finally {
      setShowConfirmDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await historyService.bulkDeleteFavorites(selectedIds);
      setFavorites((prev) => prev.filter((fav) => !selectedIds.includes(fav.id)));
      toast.success(`Removed ${selectedIds.length} favorites.`, {
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
    } catch (err) {
      handleApiError(err, "Failed to bulk delete favorites", mode);
    }
  };

  const handleToggleSelect = (favoriteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(favoriteId)
        ? prev.filter((id) => id !== favoriteId)
        : [...prev, favoriteId]
    );
  };

  const handleSelectAll = () => {
    const displayedIds = displayedFavorites.map((f) => f.id);
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

  const handleFavoriteClick = (message: FavoriteMessage) => {
    const hasConnection = Boolean(message.connection !== "");
    if (!hasConnection) return;

    if (selectedIds.length > 0) {
      setSelectedIds((prev) =>
        prev.includes(message.id)
          ? prev.filter((id) => id !== message.id)
          : [...prev, message.id]
      );
      return;
    }

    onFavoriteSelected(message.text, message.connection, message.query);
  };

  const clearSearch = () => setSearchQuery("");

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return "";
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

  // Grouping logic for date headers
  const groupFavorites = (favsList: FavoriteMessage[]) => {
    const today: FavoriteMessage[] = [];
    const yesterday: FavoriteMessage[] = [];
    const thisWeek: FavoriteMessage[] = [];
    const thisMonth: FavoriteMessage[] = [];
    const older: FavoriteMessage[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const monthStart = new Date(todayStart);
    monthStart.setDate(monthStart.getDate() - 30);

    favsList.forEach((fav) => {
      if (!fav.timestamp) {
        older.push(fav);
        return;
      }
      const date = parseTimestamp(fav.timestamp);
      if (date >= todayStart) {
        today.push(fav);
      } else if (date >= yesterdayStart) {
        yesterday.push(fav);
      } else if (date >= weekStart) {
        thisWeek.push(fav);
      } else if (date >= monthStart) {
        thisMonth.push(fav);
      } else {
        older.push(fav);
      }
    });

    return {
      Today: today,
      Yesterday: yesterday,
      "This Week": thisWeek,
      "This Month": thisMonth,
      Older: older,
    };
  };

  const getEmptyStateContent = () => {
    if (searchQuery) {
      return {
        title: "No matches found",
        description: `We couldn't find any favorites matching "${searchQuery}". Try checking your spelling or using different keywords.`,
        icon: <Search size={28} style={{ color: accent }} />,
      };
    }
    
    if (selectedCategory && selectedCategory.startsWith("conn:")) {
      const connName = selectedCategory.substring(5);
      return {
        title: `No favorites for ${connName}`,
        description: `There are no favorited messages associated with the connection "${connName}".`,
        icon: <Database size={28} style={{ color: accent }} />,
      };
    }

    return {
      title: "Your favorites folder is empty",
      description: "Star your queries and messages during chat sessions to quickly access and execute them from this panel.",
      icon: <Heart size={28} style={{ color: accent }} />,
    };
  };

  // Get displayed favorites (Search, Connection filter and Sort)
  const displayedFavorites = (() => {
    let list = [...favorites];
    
    // 1. Connection category filter
    if (selectedCategory !== "all") {
      if (selectedCategory.startsWith("conn:")) {
        const connName = selectedCategory.substring(5);
        list = list.filter((message) => message.connection === connName);
      }
    }

    // 2. Search query filter
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      list = list.filter(
        (message) =>
          message.text.toLowerCase().includes(term) ||
          message.connection.toLowerCase().includes(term)
      );
    }
    
    // 3. Sort logic
    list.sort((a, b) => {
      if (sortBy === "popularity") {
        return b.count - a.count;
      }
      const timeA = a.timestamp ? parseTimestamp(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? parseTimestamp(b.timestamp).getTime() : 0;
      return sortBy === "newest" ? timeB - timeA : timeA - timeB;
    });
    
    return list;
  })();

  const connections = Array.from(
    new Set(favorites.map((f) => f.connection).filter(Boolean))
  );

  const groupedFavorites = groupFavorites(displayedFavorites);
  const groupKeys = ["Today", "Yesterday", "This Week", "This Month", "Older"] as const;

  /* framer variants */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3, staggerChildren: 0.05 } },
  };
  
  const cardVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 350, damping: 25 },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -15,
      transition: { duration: 0.2 },
    },
    selected: { scale: 0.98, opacity: 0.85, transition: { duration: 0.18 } },
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

  /* ── Inline skeleton card ── */
  const renderSkeleton = (isGrid: boolean) => (
    <div
      className="animate-pulse rounded-2xl p-5 flex flex-col gap-3"
      style={{ ...cardBase, minHeight: isGrid ? 160 : "auto" }}
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
    </div>
  );

  /* ── Render single Grid card ── */
  const renderFavoriteCard = (message: FavoriteMessage) => {
    const hasConnection = Boolean(message.connection !== "");
    const isSelected = selectedIds.includes(message.id);
    const avatarColor = stringToColor(message.text + message.connection);

    return (
      <motion.div
        key={message.id}
        variants={cardVariants}
        animate={selectedIds.includes(message.id) ? "selected" : "visible"}
        exit="exit"
        layout="position"
        whileHover={hasConnection ? { y: -3 } : undefined}
        onClick={() => handleFavoriteClick(message)}
        className={`rounded-2xl border backdrop-blur-md relative overflow-hidden group flex flex-col justify-between transition-all duration-300 ${
          selectedIds.length > 0
            ? "cursor-pointer"
            : hasConnection
            ? "cursor-pointer"
            : "cursor-not-allowed opacity-70"
        }`}
        style={{
          ...cardBase,
          minHeight: 160,
        }}
      >
        <div className="p-5 flex-grow flex flex-col justify-between gap-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {/* Checkbox Container */}
              <div 
                className={`flex-shrink-0 transition-all duration-200 flex items-center justify-center cursor-pointer ${
                  selectedIds.length > 0 ? "w-6 opacity-100 mr-1" : "w-0 opacity-0 group-hover:w-6 group-hover:opacity-100 group-hover:mr-1"
                }`}
                onClick={(e) => handleToggleSelect(message.id, e)}
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
                {message.text.charAt(0).toUpperCase()}
              </div>

              {/* Date Badge */}
              <span
                className="text-[9px] font-extrabold py-0.5 px-2 rounded-lg uppercase tracking-wider"
                style={{
                  backgroundColor: `${theme.colors.accent}12`,
                  color: theme.colors.accent,
                }}
              >
                {formatTimestamp(message.timestamp).split(" · ")[0]}
              </span>
            </div>

            {/* Actions (hover-reveal) */}
            <div 
              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <CustomTooltip title="Remove from favorites">
                <motion.button
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                  onClick={() => setShowConfirmDelete({ id: message.id, connection: message.connection })}
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
          </div>

          {/* Main Text Content */}
          <p
            className="line-clamp-3 text-xs md:text-sm font-semibold leading-relaxed text-justify flex-grow"
            style={{
              color: hasConnection ? theme.colors.text : theme.colors.textSecondary,
            }}
          >
            {highlightText(message.text, searchQuery, theme.colors.accent)}
          </p>

          {/* Footer */}
          <div
            className="flex justify-between items-center pt-2.5 border-t mt-auto"
            style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
          >
            {!hasConnection ? (
              <div
                className="flex items-center text-[10px] font-bold"
                style={{ color: theme.colors.error }}
              >
                <AlertCircle size={12} className="mr-1 flex-shrink-0" />
                <span>Connection required</span>
              </div>
            ) : (
              <div
                className="text-[10px] font-bold opacity-75 flex items-center gap-1"
                style={{ color: theme.colors.textSecondary }}
              >
                <Database size={11} className="text-indigo-400" />
                <span>
                  {highlightText(message.connection, searchQuery, theme.colors.accent)}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              {message.query && (
                <span
                  className="text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide"
                  style={{
                    backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                    color: theme.colors.textSecondary,
                    borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                  }}
                >
                  SQL
                </span>
              )}
              {/* Popularity Badge */}
              <span
                className="text-[8px] font-black px-1.5 py-0.5 rounded-lg"
                style={{ background: `${accent}14`, color: accent }}
              >
                Used {message.count}x
              </span>
              {hasConnection && (
                <ChevronRight
                  size={14}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: theme.colors.accent }}
                />
              )}
            </div>
          </div>
        </div>

        {!hasConnection && (
          <div
            className="absolute top-0 right-0 px-2.5 py-0.5 rounded-bl-lg text-[8px] font-black uppercase tracking-wider"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              color: theme.colors.error,
            }}
          >
            Disabled
          </div>
        )}
      </motion.div>
    );
  };

  /* ── Render single List row ── */
  const renderFavoriteRow = (message: FavoriteMessage) => {
    const hasConnection = Boolean(message.connection !== "");
    const isSelected = selectedIds.includes(message.id);
    const avatarColor = stringToColor(message.text + message.connection);

    return (
      <motion.div
        key={message.id}
        variants={cardVariants}
        animate={selectedIds.includes(message.id) ? "selected" : "visible"}
        exit="exit"
        layout="position"
        whileHover={hasConnection ? { scale: 1.003 } : undefined}
        onClick={() => handleFavoriteClick(message)}
        className={`rounded-2xl border backdrop-blur-md flex items-center justify-between gap-4 relative transition-all duration-300 p-4 ${
          selectedIds.length > 0
            ? "cursor-pointer"
            : hasConnection
            ? "cursor-pointer"
            : "cursor-not-allowed opacity-70"
        }`}
        style={cardBase}
      >
        <div className="flex-1 mr-4 overflow-hidden flex items-center gap-3 min-w-0">
          {/* Checkbox Container */}
          <div 
            className={`flex-shrink-0 transition-all duration-200 flex items-center justify-center cursor-pointer ${
              selectedIds.length > 0 ? "w-6 opacity-100 mr-1" : "w-0 opacity-0 group-hover:w-6 group-hover:opacity-100 group-hover:mr-1"
            }`}
            onClick={(e) => handleToggleSelect(message.id, e)}
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
            {message.text.charAt(0).toUpperCase()}
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <span
              className="block truncate text-sm font-bold"
              style={{
                color: hasConnection ? theme.colors.text : theme.colors.textSecondary,
              }}
            >
              {highlightText(message.text, searchQuery, theme.colors.accent)}
            </span>
            <div className="flex items-center gap-3 text-[11px] mt-0.5 flex-wrap">
              {hasConnection && (
                <span className="opacity-75 flex items-center gap-1" style={{ color: theme.colors.textSecondary }}>
                  <Database size={11} className="text-indigo-400" />
                  {highlightText(message.connection, searchQuery, theme.colors.accent)}
                </span>
              )}
              <span
                className="font-bold opacity-75"
                style={{
                  color: !hasConnection ? theme.colors.error : theme.colors.textSecondary,
                }}
              >
                {!hasConnection ? "Connection required" : formatTimestamp(message.timestamp)}
              </span>
              <span
                className="font-black px-1.5 py-0.2 rounded-lg"
                style={{ background: `${accent}14`, color: accent, fontSize: 9 }}
              >
                Used {message.count}x
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {message.query && (
            <span
              className="text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide mr-1"
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                color: theme.colors.textSecondary,
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
              }}
            >
              SQL
            </span>
          )}

          <CustomTooltip title="Remove from favorites">
            <button
              onClick={() => setShowConfirmDelete({ id: message.id, connection: message.connection })}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100 transition-colors"
              aria-label="Remove favorite"
              style={{
                color: theme.colors.accent,
              }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </CustomTooltip>

          {hasConnection && (
            <ChevronRight
              size={16}
              className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: theme.colors.textSecondary }}
            />
          )}
        </div>

        {!hasConnection && (
          <div
            className="absolute top-0 right-0 px-2 py-0.5 text-[8px] font-black rounded-bl-lg uppercase tracking-wider"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              color: theme.colors.error,
            }}
          >
            Disabled
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div
      className="p-4 md:p-6 min-h-screen transition-colors duration-500 overflow-y-auto custom-scrollbar"
      style={{ background: theme.colors.background }}
    >
      {/* ════════════════════════════════════════
          PORTAL: Remove Confirmation Modal
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {showConfirmDelete && (
          <DeleteConfirmModal
            favoriteId={showConfirmDelete.id}
            favoriteConnection={showConfirmDelete.connection}
            isDark={isDark}
            textColor={theme.colors.text}
            textSecondary={theme.colors.textSecondary}
            onConfirm={handleRemoveFavorite}
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

      <div className="max-w-6xl mx-auto flex flex-col h-full gap-5">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 animate-pulse"
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, ${theme.colors.accentHover || accent} 100%)`,
                boxShadow: `0 4px 14px ${accent}50`,
              }}
            >
              <Heart className="w-5 h-5 text-white fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className="text-xl md:text-2xl font-extrabold tracking-tight"
                  style={{ color: theme.colors.text }}
                >
                  Favorite Queries
                </h1>
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-bold border"
                  style={{
                    background: `${accent}12`,
                    color: accent,
                    borderColor: `${accent}20`,
                  }}
                >
                  {displayedFavorites.length}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: theme.colors.textSecondary }}>
                Quickly review and re-run your starred queries.
              </p>
            </div>
          </div>

          {/* Search, Filter, Sort and Layout Controls */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            {/* Search input */}
            <div className="relative flex-1 md:flex-none">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search favorites… (⌘K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="py-2 pl-9 pr-8 text-sm focus:outline-none transition-all w-full md:w-52"
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
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: theme.colors.textSecondary }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Dynamic sorting dropdown */}
            <div className="relative">
              <ArrowUpDown
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: theme.colors.textSecondary }}
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none py-2 pl-8 pr-7 text-xs md:text-sm focus:outline-none transition-all cursor-pointer font-semibold"
                style={{
                  background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                  color: theme.colors.textSecondary,
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                  borderRadius: 12,
                }}
              >
                <option value="popularity">Most Popular</option>
                <option value="newest">Newest Added</option>
                <option value="oldest">Oldest Added</option>
              </select>
              <ChevronRight
                size={12}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none"
                style={{ color: theme.colors.textSecondary }}
              />
            </div>

            {/* Select All Toggle */}
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
                <span>Select All</span>
              </button>
            )}

            {/* Layout viewMode buttons */}
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
                  className="p-1.5 md:p-2 rounded-lg transition-all flex items-center justify-center"
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

        {/* Dynamic Filter Pills */}
        {connections.length > 0 && (
          <div
            className="flex flex-wrap p-1.5 gap-1 border shadow-inner backdrop-blur-md overflow-x-auto custom-scrollbar"
            style={{
              background: isDark ? "rgba(15, 23, 42, 0.3)" : "rgba(0, 0, 0, 0.03)",
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.large,
              scrollbarWidth: "none",
            }}
          >
            <button
              onClick={() => setSelectedCategory("all")}
              className="px-4 py-2 text-xs md:text-sm font-semibold transition-all flex items-center gap-2 rounded-lg"
              style={{
                background: selectedCategory === "all" ? accent : "transparent",
                color: selectedCategory === "all" ? "#FFFFFF" : theme.colors.textSecondary,
                boxShadow: selectedCategory === "all" ? `0 2px 8px ${accent}30` : "none",
              }}
            >
              <BookmarkCheck className="w-4 h-4" />
              All Connections
            </button>

            {connections.map((conn) => (
              <button
                key={conn}
                onClick={() => setSelectedCategory(`conn:${conn}`)}
                className="px-4 py-2 text-xs md:text-sm font-semibold transition-all flex items-center gap-2 rounded-lg"
                style={{
                  background: selectedCategory === `conn:${conn}` ? accent : "transparent",
                  color: selectedCategory === `conn:${conn}` ? "#FFFFFF" : theme.colors.textSecondary,
                  boxShadow: selectedCategory === `conn:${conn}` ? `0 2px 8px ${accent}30` : "none",
                }}
              >
                <Database className="w-4 h-4 text-indigo-400" />
                {conn}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div
            className="p-4 rounded-xl flex items-center border"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              color: theme.colors.error,
              borderColor: `${theme.colors.error}20`,
            }}
          >
            <AlertCircle size={20} className="mr-2 flex-shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <React.Fragment key={n}>{renderSkeleton(viewMode === "grid")}</React.Fragment>
            ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex-grow"
          >
            <AnimatePresence mode="popLayout">
              {displayedFavorites.length > 0 ? (
                // If sort order is newest/oldest, group by dates
                sortBy !== "popularity" ? (
                  groupKeys.map((groupName) => {
                    const groupFavs = groupedFavorites[groupName];
                    if (groupFavs.length === 0) return null;

                    return (
                      <div key={groupName} className="mb-8 w-full">
                        {/* Group Header */}
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-xs font-black tracking-widest uppercase opacity-65 flex items-center gap-1.5" style={{ color: theme.colors.textSecondary }}>
                            <Clock className="w-3.5 h-3.5" />
                            {groupName}
                          </span>
                          <div 
                            className="flex-1 h-px" 
                            style={{ background: `linear-gradient(90deg, ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}, transparent)` }} 
                          />
                        </div>

                        {/* Group Content */}
                        {viewMode === "grid" ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groupFavs.map((message) => renderFavoriteCard(message))}
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {groupFavs.map((message) => renderFavoriteRow(message))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  // Popularity mode: simple grid/list layout without date headers
                  <div>
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-black tracking-widest uppercase opacity-65 flex items-center gap-1.5" style={{ color: theme.colors.textSecondary }}>
                        <Sparkles className="w-3.5 h-3.5" style={{ color: accent }} />
                        Most Popular
                      </span>
                      <div 
                        className="flex-1 h-px" 
                        style={{ background: `linear-gradient(90deg, ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}, transparent)` }} 
                      />
                    </div>
                    
                    {viewMode === "grid" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
                        {displayedFavorites.map((message) => renderFavoriteCard(message))}
                      </div>
                    ) : (
                      <div className="space-y-2.5 pb-8">
                        {displayedFavorites.map((message) => renderFavoriteRow(message))}
                      </div>
                    )}
                  </div>
                )
              ) : (
                /* ── Empty state (Context-Aware) ── */
                (() => {
                  const emptyState = getEmptyStateContent();
                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-20 px-6 rounded-2xl border backdrop-blur-md max-w-lg mx-auto shadow-sm"
                      style={{
                        ...cardBase,
                        borderStyle: "dashed",
                      }}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="p-4 rounded-full mb-4" style={{ backgroundColor: `${accent}10` }}>
                          {emptyState.icon}
                        </div>
                        <h3 className="font-extrabold text-xl mb-2" style={{ color: theme.colors.text }}>
                          {emptyState.title}
                        </h3>
                        <p className="text-sm opacity-85 mb-6 max-w-sm" style={{ color: theme.colors.textSecondary }}>
                          {emptyState.description}
                        </p>
                        {searchQuery && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={clearSearch}
                            className="px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all text-white text-sm"
                            style={{ backgroundColor: accent }}
                          >
                            Clear search
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  );
                })()
              )}
            </AnimatePresence>
          </motion.div>
        )}
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
                {selectedIds.length} item{selectedIds.length > 1 ? "s" : ""} selected
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
                Unfavorite
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 4px;
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${accent}20;
          border-radius: 99px;
          transition: all 0.3s ease;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${accent}45;
        }
      `}</style>
    </div>
  );
};

export default Favorites;
