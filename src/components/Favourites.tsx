import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { historyService } from "../services/historyService";
import { handleApiError } from "../utils/errorHandler";
import CustomTooltip from "./CustomTooltip";
import { toast } from "react-toastify";

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

interface FavoriteMessage {
  id: string;
  text: string;
  query: string;
  connection: string;
  isFavorited: boolean;
  timestamp?: string;
}

interface FavoritesProps {
  onFavoriteSelected: (
    question: string,
    connection: string,
    query?: string
  ) => void;
}

const Favorites = ({ onFavoriteSelected }: FavoritesProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<FavoriteMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animateId, setAnimateId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { theme } = useTheme();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const token = sessionStorage.getItem("token") ?? "demo-token";
  const isDark = theme.mode === "dark";

  // Search shortcut (⌘+K / Ctrl+K)
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
          }));
          setFavorites(formattedData);
        }
      } catch (err) {
        handleApiError(err, "Failed to load favorites", isDark ? "dark" : "light");
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

      setAnimateId(id);
      const fallbackConnection = localStorage.getItem("selectedConnection");
      const connectionToDelete = favoriteConnection || fallbackConnection;

      setTimeout(async () => {
        try {
          await historyService.deleteFavourite(id, connectionToDelete);
          setFavorites((prev) => prev.filter((msg) => msg.id !== id));
          toast.success("Removed from favorites", {
            style: {
              background: theme.colors.surface,
              color: theme.colors.success,
              border: `1px solid ${theme.colors.success}20`,
              borderRadius: theme.borderRadius.default,
            },
            theme: isDark ? "dark" : "light",
          });
        } catch (err) {
          handleApiError(err, "Failed to remove favorite", isDark ? "dark" : "light");
        } finally {
          setAnimateId(null);
          setDeleteConfirmId(null);
        }
      }, 300);
    } catch (err) {
      handleApiError(err, "Failed to remove favorite", isDark ? "dark" : "light");
      setAnimateId(null);
      setDeleteConfirmId(null);
    }
  };

  const clearSearch = () => setSearchQuery("");

  const getRelativeTime = (timestamp?: string) => {
    if (!timestamp) return "";
    const date = parseTimestamp(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Extract unique connections for filter pills
  const connections = Array.from(
    new Set(favorites.map((f) => f.connection).filter(Boolean))
  );

  const filteredMessages = favorites.filter((message) => {
    const matchesSearch = 
      message.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.connection.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedCategory === "all") return true;
    if (selectedCategory === "queries") return Boolean(message.query);

    if (selectedCategory.startsWith("conn:")) {
      const connName = selectedCategory.substring(5);
      return message.connection === connName;
    }

    return true;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, staggerChildren: 0.05 },
    },
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
  };

  return (
    <div
      className="p-4 md:p-6 min-h-screen transition-colors duration-500 overflow-y-auto"
      style={{
        background: theme.colors.background,
        backgroundImage: isDark
          ? `radial-gradient(rgba(99, 102, 241, 0.08) 1px, transparent 1px)`
          : `radial-gradient(rgba(79, 70, 229, 0.05) 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }}
    >
      <div className="max-w-6xl mx-auto flex flex-col h-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center">
            <BookmarkCheck
              size={28}
              className="mr-3"
              style={{ color: theme.colors.accent }}
            />
            <h1
              className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2"
              style={{ color: theme.colors.text }}
            >
              Favorites
              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center justify-center border"
                style={{
                  background: `${theme.colors.accent}10`,
                  color: theme.colors.accent,
                  borderColor: `${theme.colors.accent}20`,
                }}
              >
                {filteredMessages.length}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
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
              >
                <Grid size={18} />
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
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div
            className="p-4 mb-6 rounded-xl flex items-center border"
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

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search size={18} style={{ color: theme.colors.textSecondary }} />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search favorites by prompt text or connection name... (⌘+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-xl focus:outline-none transition-all duration-300 border focus:ring-2 focus:ring-indigo-500/20"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.border,
                fontSize: theme.typography.size.base,
                boxShadow: searchQuery ? theme.shadow.md : theme.shadow.sm,
              }}
            />
            {searchQuery && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  onClick={clearSearch}
                  className="focus:outline-none hover:opacity-75 p-1.5 rounded-full transition-colors"
                  style={{ backgroundColor: theme.colors.hover }}
                >
                  <X size={14} style={{ color: theme.colors.text }} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Filter Selector */}
        {connections.length > 0 && (
          <div
            className="flex flex-wrap p-1.5 mb-6 gap-1 border shadow-inner backdrop-blur-md overflow-x-auto custom-scrollbar"
            style={{
              background: isDark ? "rgba(15, 23, 42, 0.3)" : "rgba(0, 0, 0, 0.03)",
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.large,
            }}
          >
            <button
              onClick={() => setSelectedCategory("all")}
              className="px-4 py-2 text-xs md:text-sm font-semibold transition-all flex items-center gap-2 rounded-lg"
              style={{
                background: selectedCategory === "all" ? theme.colors.accent : "transparent",
                color: selectedCategory === "all" ? "#FFFFFF" : theme.colors.textSecondary,
                boxShadow: selectedCategory === "all" ? theme.shadow.sm : "none",
              }}
            >
              <BookmarkCheck className="w-4 h-4" />
              All Favorites
            </button>

            <button
              onClick={() => setSelectedCategory("queries")}
              className="px-4 py-2 text-xs md:text-sm font-semibold transition-all flex items-center gap-2 rounded-lg"
              style={{
                background: selectedCategory === "queries" ? theme.colors.accent : "transparent",
                color: selectedCategory === "queries" ? "#FFFFFF" : theme.colors.textSecondary,
                boxShadow: selectedCategory === "queries" ? theme.shadow.sm : "none",
              }}
            >
              <Sparkles className="w-4 h-4" />
              SQL Queries
            </button>

            {connections.map((conn) => (
              <button
                key={conn}
                onClick={() => setSelectedCategory(`conn:${conn}`)}
                className="px-4 py-2 text-xs md:text-sm font-semibold transition-all flex items-center gap-2 rounded-lg"
                style={{
                  background: selectedCategory === `conn:${conn}` ? theme.colors.accent : "transparent",
                  color: selectedCategory === `conn:${conn}` ? "#FFFFFF" : theme.colors.textSecondary,
                  boxShadow: selectedCategory === `conn:${conn}` ? theme.shadow.sm : "none",
                }}
              >
                <Database className="w-4 h-4 text-indigo-400" />
                {highlightText(conn, searchQuery, "#FFFFFF")}
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="w-full">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="p-5 border animate-pulse flex flex-col gap-4 rounded-xl backdrop-blur-sm"
                    style={{
                      background: theme.colors.surface,
                      borderColor: theme.colors.border,
                    }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="w-20 h-4 rounded bg-gray-200 dark:bg-slate-800" />
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-800" />
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-4 rounded bg-gray-200 dark:bg-slate-800" />
                      <div className="w-5/6 h-4 rounded bg-gray-200 dark:bg-slate-800" />
                      <div className="w-2/3 h-4 rounded bg-gray-200 dark:bg-slate-800" />
                    </div>
                    <div
                      className="flex justify-between items-center mt-auto pt-2 border-t"
                      style={{ borderColor: theme.colors.border }}
                    >
                      <div className="w-24 h-3 rounded bg-gray-100 dark:bg-slate-850" />
                      <div className="w-4 h-4 rounded bg-gray-100 dark:bg-slate-850" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="p-4 border animate-pulse flex items-center justify-between gap-4 rounded-xl"
                    style={{
                      background: theme.colors.surface,
                      borderColor: theme.colors.border,
                    }}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-800" />
                      <div className="flex-1 space-y-2">
                        <div className="w-1/2 h-4 rounded bg-gray-200 dark:bg-slate-800" />
                        <div className="w-24 h-3 rounded bg-gray-100 dark:bg-slate-850" />
                      </div>
                    </div>
                    <div className="w-16 h-8 rounded bg-gray-200 dark:bg-slate-850" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {!loading && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex-grow"
          >
            <AnimatePresence mode="popLayout">
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
                  {filteredMessages.map((message) => {
                    const hasConnection = Boolean(message.connection !== "");

                    return (
                      <motion.div
                        key={message.id}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout="position"
                        whileHover={
                          hasConnection
                            ? {
                                y: -4,
                                boxShadow: isDark
                                  ? "0 12px 20px -8px rgba(0,0,0,0.5)"
                                  : "0 12px 20px -8px rgba(15, 23, 42, 0.08)",
                              }
                            : undefined
                        }
                        className={`rounded-xl overflow-hidden border backdrop-blur-md relative group flex flex-col justify-between ${
                          hasConnection ? "cursor-pointer" : "cursor-not-allowed opacity-75"
                        }`}
                        style={{
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                        }}
                        onClick={
                          hasConnection
                            ? () =>
                                onFavoriteSelected(
                                  message.text,
                                  message.connection,
                                  message.query
                                )
                            : undefined
                        }
                      >
                        <div className="p-5 flex-grow flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-center mb-3.5 gap-2">
                              <span
                                className="text-[10px] font-bold py-1 px-2.5 rounded-lg uppercase tracking-wider"
                                style={{
                                  backgroundColor: `${theme.colors.accent}12`,
                                  color: theme.colors.accent,
                                }}
                              >
                                {getRelativeTime(message.timestamp)}
                              </span>

                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <CustomTooltip title="Remove from favorites">
                                  <button
                                    onClick={() => setDeleteConfirmId(message.id)}
                                    className="p-1.5 rounded-lg focus:outline-none hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200"
                                    style={{ color: theme.colors.accent }}
                                    aria-label="Remove favorite"
                                  >
                                    <Heart className="w-4 h-4 fill-current" />
                                  </button>
                                </CustomTooltip>
                              </div>
                            </div>

                            <p
                              className="line-clamp-3 text-sm font-medium leading-relaxed mb-4 text-justify"
                              style={{
                                color: hasConnection
                                  ? theme.colors.text
                                  : theme.colors.textSecondary,
                              }}
                            >
                              {highlightText(message.text, searchQuery, theme.colors.accent)}
                            </p>
                          </div>

                          <div
                            className="flex justify-between items-center mt-3 pt-3 border-t"
                            style={{ borderColor: theme.colors.border }}
                          >
                            {!hasConnection ? (
                              <div
                                className="flex items-center text-xs font-semibold"
                                style={{ color: theme.colors.error }}
                              >
                                <AlertCircle size={14} className="mr-1 flex-shrink-0" />
                                <span>Connection required</span>
                              </div>
                            ) : (
                              <div
                                className="text-xs font-semibold opacity-70 flex items-center gap-1.5"
                                style={{ color: theme.colors.textSecondary }}
                              >
                                <Database size={12} className="text-indigo-400" />
                                <span>
                                  {highlightText(message.connection, searchQuery, theme.colors.accent)}
                                </span>
                              </div>
                            )}

                            {hasConnection && (
                              <div className="flex items-center gap-1">
                                {message.query && (
                                  <span
                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide mr-1"
                                    style={{
                                      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                                      color: theme.colors.textSecondary,
                                      borderColor: theme.colors.border,
                                    }}
                                  >
                                    SQL
                                  </span>
                                )}
                                <ChevronRight
                                  size={16}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{ color: theme.colors.accent }}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Glassy Confirm Delete Overlay */}
                        <AnimatePresence>
                          {deleteConfirmId === message.id && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 flex items-center justify-center z-20 p-4"
                              style={{
                                background: isDark
                                  ? "rgba(15, 23, 42, 0.92)"
                                  : "rgba(255, 255, 255, 0.92)",
                                backdropFilter: "blur(8px)",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="text-center flex flex-col items-center gap-3">
                                <div className="p-2.5 rounded-full bg-red-500/10 text-red-500 animate-pulse">
                                  <Trash2 className="w-5 h-5" />
                                </div>
                                <p
                                  className="text-sm font-bold tracking-tight"
                                  style={{ color: theme.colors.text }}
                                >
                                  Remove from favorites?
                                </p>
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => handleRemoveFavorite(message.id, message.connection)}
                                    className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                  >
                                    Remove
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-4 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {!hasConnection && (
                          <div
                            className="absolute top-0 right-0 px-2.5 py-0.5 rounded-bl-lg text-[9px] font-bold uppercase tracking-wider"
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
                  })}
                </div>
              ) : (
                <div className="space-y-3 pb-8">
                  {filteredMessages.map((message) => {
                    const hasConnection = Boolean(message.connection);

                    return (
                      <motion.div
                        key={message.id}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout="position"
                        whileHover={hasConnection ? { scale: 1.005 } : undefined}
                        className={`p-4 rounded-xl border backdrop-blur-md flex items-center justify-between gap-4 relative group ${
                          hasConnection ? "cursor-pointer" : "cursor-not-allowed opacity-75"
                        }`}
                        style={{
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                          boxShadow: theme.shadow.sm,
                        }}
                        onClick={
                          hasConnection
                            ? () =>
                                onFavoriteSelected(
                                  message.text,
                                  message.connection,
                                  message.query
                                )
                            : undefined
                        }
                      >
                        <div className="flex-1 mr-4 overflow-hidden flex items-center gap-4 min-w-0">
                          <div
                            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                            style={{
                              backgroundColor: hasConnection
                                ? `${theme.colors.accent}12`
                                : "rgba(239, 68, 68, 0.08)",
                            }}
                          >
                            {hasConnection ? (
                              <Heart size={14} style={{ color: theme.colors.accent }} className="fill-current" />
                            ) : (
                              <AlertCircle size={14} style={{ color: theme.colors.error }} />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span
                              className="block truncate text-sm font-semibold"
                              style={{
                                color: hasConnection
                                  ? theme.colors.text
                                  : theme.colors.textSecondary,
                              }}
                            >
                              {highlightText(message.text, searchQuery, theme.colors.accent)}
                            </span>
                            <div className="flex items-center gap-3 text-xs mt-0.5">
                              {hasConnection && (
                                <span className="opacity-70 flex items-center gap-1" style={{ color: theme.colors.textSecondary }}>
                                  <Database size={11} className="text-indigo-400" />
                                  {highlightText(message.connection, searchQuery, theme.colors.accent)}
                                </span>
                              )}
                              <span
                                className="font-semibold"
                                style={{
                                  color: !hasConnection
                                    ? theme.colors.error
                                    : theme.colors.textSecondary,
                                }}
                              >
                                {!hasConnection ? (
                                  "Connection required"
                                ) : (
                                  getRelativeTime(message.timestamp)
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          {message.query && (
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide mr-1"
                              style={{
                                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                                color: theme.colors.textSecondary,
                                borderColor: theme.colors.border,
                              }}
                            >
                              SQL
                            </span>
                          )}

                          <CustomTooltip title="Remove from favorites">
                            <button
                              onClick={() => setDeleteConfirmId(message.id)}
                              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100 transition-colors"
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

                        {/* Glassy Confirm Delete Overlay */}
                        <AnimatePresence>
                          {deleteConfirmId === message.id && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 flex items-center justify-center z-20 p-2"
                              style={{
                                background: isDark
                                  ? "rgba(15, 23, 42, 0.92)"
                                  : "rgba(255, 255, 255, 0.92)",
                                backdropFilter: "blur(8px)",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="text-center flex items-center gap-3">
                                <p
                                  className="text-xs font-bold tracking-tight"
                                  style={{ color: theme.colors.text }}
                                >
                                  Remove from favorites?
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleRemoveFavorite(message.id, message.connection)}
                                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all"
                                  >
                                    Remove
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {!hasConnection && (
                          <div
                            className="absolute top-0 right-0 px-2 py-0.5 text-[9px] font-bold rounded-bl-lg uppercase tracking-wider"
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
                  })}
                </div>
              )}
            </AnimatePresence>

            {/* Empty State */}
            {!loading && filteredMessages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 px-6 rounded-2xl border backdrop-blur-md max-w-lg mx-auto mt-8 shadow-sm"
                style={{
                  background: theme.colors.surface,
                  color: theme.colors.textSecondary,
                  borderColor: theme.colors.border,
                  boxShadow: theme.shadow.md,
                }}
              >
                <div className="flex flex-col items-center justify-center">
                  {searchQuery ? (
                    <>
                      <div className="p-4 rounded-full mb-4" style={{ backgroundColor: `${theme.colors.accent}10` }}>
                        <Search size={36} style={{ color: theme.colors.accent }} />
                      </div>
                      <h3 className="font-extrabold text-xl mb-2" style={{ color: theme.colors.text }}>
                        No results found
                      </h3>
                      <p className="text-sm opacity-85 mb-6 max-w-sm">
                        We couldn't find any favorites matching "{searchQuery}". Try adjusting your keywords or search query.
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={clearSearch}
                        className="px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all text-white text-sm"
                        style={{
                          backgroundColor: theme.colors.accent,
                        }}
                      >
                        Clear search
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <div className="p-4 rounded-full mb-4 animate-pulse" style={{ backgroundColor: `${theme.colors.accent}10` }}>
                        <Heart size={36} style={{ color: theme.colors.accent }} />
                      </div>
                      <h3 className="font-extrabold text-xl mb-2" style={{ color: theme.colors.text }}>
                        Your favorites folder is empty
                      </h3>
                      <p className="text-sm opacity-85 max-w-sm">
                        Star your queries and messages during chat sessions to quickly access and execute them from this panel.
                      </p>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 4px;
          width: 4px;
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
    </div>
  );
};

export default Favorites;
