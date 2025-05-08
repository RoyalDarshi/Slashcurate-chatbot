import { useState, useEffect } from "react";
import { useTheme } from "../ThemeContext";
import {
  Heart,
  Search,
  X,
  ChevronRight,
  Loader2,
  Trash2,
  BookmarkCheck,
  AlertCircle,
} from "lucide-react";
import { API_URL } from "../config";
import axios from "axios";
import CustomTooltip from "./CustomTooltip";

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
  const token = sessionStorage.getItem("token") ?? "demo-token";

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        if (!token) {
          setError("Authentication required");
          return;
        }

        const response = await axios.post(`${API_URL}/favorites`, { token });
        if (response.status === 200) {
          const formattedData = response.data.map((item: any) => ({
            id: item.question_id,
            text: item.question,
            query: item.query || undefined,
            isFavorited: true,
            connection: item.connection,
            timestamp: item.timestamp,
          }));
          setFavorites(formattedData);
          setError(null);
        }
      } catch (err) {
        setError("Failed to load favorites");
        console.error("API Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [token]);

  const handleRemoveFavorite = async (id: string) => {
    try {
      if (!token) {
        setError("Authentication required");
        return;
      }

      setAnimateId(id);
      const connection = localStorage.getItem("selectedConnection");
      setTimeout(async () => {
        await axios.post(`${API_URL}/favorite/delete`, {
          token,
          questionId: id,
          selectedConnection: connection,
        });
        setFavorites((prev) => prev.filter((msg) => msg.id !== id));
        setAnimateId(null);
        setDeleteConfirmId(null);
      }, 300);
    } catch (err) {
      setError("Failed to remove favorite");
      console.error("API Error:", err);
      setAnimateId(null);
      setDeleteConfirmId(null);
    }
  };

  const clearSearch = () => setSearchQuery("");

  const getRelativeTime = (timestamp?: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const filteredMessages = favorites.filter((message) => {
    const matchesSearch = message.text
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (selectedCategory === "all") return matchesSearch;

    const text = message.text.toLowerCase();
    if (
      selectedCategory === "questions" &&
      (text.includes("how") || text.includes("explain"))
    )
      return matchesSearch;
    if (
      selectedCategory === "coding" &&
      (text.includes("code") ||
        text.includes("javascript") ||
        text.includes("react"))
    )
      return matchesSearch;
    if (
      selectedCategory === "help" &&
      (text.includes("help") || text.includes("advice"))
    )
      return matchesSearch;

    return false;
  });

  return (
    <div
      className="p-4 md:p-6 min-h-screen transition-colors duration-300"
      style={{ backgroundColor: theme.colors.background }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center">
            <BookmarkCheck
              size={28}
              className="mr-3"
              style={{ color: theme.colors.accent }}
            />
            <h1
              className="text-2xl md:text-3xl font-bold"
              style={{ color: theme.colors.text }}
            >
              Favorites
              <span
                className="ml-2 px-3 py-1 text-sm rounded-full"
                style={{
                  backgroundColor: theme.colors.accent,
                  color: "#ffffff",
                }}
              >
                {filteredMessages.length}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="flex p-1 rounded-lg gap-1"
              style={{ backgroundColor: theme.colors.surface }}
            >
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid" ? "opacity-100" : "opacity-50"
                }`}
                style={{
                  backgroundColor:
                    viewMode === "grid" ? theme.colors.accent : "transparent",
                  color: viewMode === "grid" ? "#ffffff" : theme.colors.text,
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "list" ? "opacity-100" : "opacity-50"
                }`}
                style={{
                  backgroundColor:
                    viewMode === "list" ? theme.colors.accent : "transparent",
                  color: viewMode === "list" ? "#ffffff" : theme.colors.text,
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div
            className="p-4 mb-6 rounded-lg flex items-center"
            style={{
              backgroundColor: "rgba(248, 113, 113, 0.2)",
              color: theme.colors.error,
              border: `1px solid ${theme.colors.error}`,
            }}
          >
            <X size={20} className="mr-2" />
            <span>{error}</span>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} style={{ color: theme.colors.textSecondary }} />
            </div>
            <input
              type="text"
              placeholder="Search your favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-lg focus:outline-none transition-all duration-300"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                fontSize: theme.typography.size.base,
                boxShadow: searchQuery ? theme.shadow.md : theme.shadow.sm,
              }}
            />
            {searchQuery && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  onClick={clearSearch}
                  className="focus:outline-none hover:opacity-75 p-1 rounded-full"
                  style={{ backgroundColor: theme.colors.hover, opacity: 0.7 }}
                >
                  <X size={16} style={{ color: theme.colors.text }} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div
            className="text-center py-12 rounded-lg"
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <Loader2 size={32} className="animate-spin mx-auto mb-4" />
            <p className="text-lg">Loading your favorites...</p>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMessages.map((message) => {
                  // Check if favorite has a connection
                  const hasConnection = Boolean(message.connection !== "");

                  return (
                    <div
                      key={message.id}
                      className={`rounded-lg overflow-hidden transition-all group relative ${
                        hasConnection ? "hover:scale-[1.02]" : "opacity-75"
                      }`}
                      style={{
                        backgroundColor: theme.colors.surface,
                        border: `1px solid ${theme.colors.border}`,
                        boxShadow: theme.shadow.sm,
                        opacity: animateId === message.id ? 0 : 1,
                        transform:
                          animateId === message.id
                            ? "translateY(100%)"
                            : "translateY(0)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    >
                      <div
                        className={`p-5 ${
                          hasConnection
                            ? "cursor-pointer"
                            : "cursor-not-allowed"
                        }`}
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
                        role="button"
                        aria-disabled={!hasConnection}
                        tabIndex={hasConnection ? 0 : -1}
                      >
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <div
                            className="text-xs py-1 px-2 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: theme.colors.accent + "20",
                              color: theme.colors.accent,
                            }}
                          >
                            {getRelativeTime(message.timestamp)}
                          </div>
                          <div className="flex items-center gap-2">
                            {deleteConfirmId === message.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFavorite(message.id);
                                  }}
                                  className="p-1 rounded-full focus:outline-none hover:opacity-90 transition-all"
                                  style={{
                                    backgroundColor: theme.colors.error + "20",
                                    color: theme.colors.error,
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmId(null);
                                  }}
                                  className="p-1 rounded-full focus:outline-none hover:opacity-90 transition-all"
                                  style={{
                                    backgroundColor: theme.colors.border,
                                    color: theme.colors.textSecondary,
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <CustomTooltip
                                title="Remove from favorites"
                                position="top"
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmId(message.id);
                                  }}
                                  className="rounded-full focus:outline-none hover:opacity-90 transition-all opacity-0 group-hover:opacity-100"
                                  style={{
                                    color: theme.colors.accent,
                                  }}
                                >
                                  <Heart className="w-4 h-4 fill-current" />
                                </button>
                              </CustomTooltip>
                            )}
                          </div>
                        </div>
                        <p
                          className="line-clamp-3 mb-3 text-base min-h-[4.5rem]"
                          style={{
                            color: hasConnection
                              ? theme.colors.text
                              : theme.colors.textSecondary,
                          }}
                        >
                          {message.text}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          {!hasConnection ? (
                            <div
                              className="flex items-center text-xs"
                              style={{ color: theme.colors.error }}
                            >
                              <AlertCircle size={12} className="mr-1" />
                              <span>Connection required</span>
                            </div>
                          ) : (
                            <div
                              className="text-xs opacity-70"
                              style={{ color: theme.colors.textSecondary }}
                            >
                              {message.query
                                ? "Custom query attached"
                                : "Standard query"}
                            </div>
                          )}
                          {hasConnection && (
                            <ChevronRight
                              size={18}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ color: theme.colors.accent }}
                            />
                          )}
                        </div>
                      </div>
                      {/* Add disabled overlay for items without connection */}
                      {!hasConnection && (
                        <div
                          className="absolute top-0 right-0 px-2 py-1 rounded-bl-md text-xs font-medium"
                          style={{
                            backgroundColor: theme.colors.error + "20",
                            color: theme.colors.error,
                          }}
                        >
                          Disabled
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMessages.map((message) => {
                  // Check if favorite has a connection
                  const hasConnection = Boolean(message.connection);

                  return (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg flex items-center justify-between gap-4 transition-all group relative ${
                        hasConnection
                          ? "cursor-pointer hover:scale-[1.01]"
                          : "cursor-not-allowed opacity-75"
                      }`}
                      style={{
                        backgroundColor: theme.colors.surface,
                        border: `1px solid ${theme.colors.border}`,
                        boxShadow: theme.shadow.sm,
                        opacity: animateId === message.id ? 0 : 1,
                        transform:
                          animateId === message.id
                            ? "translateX(100%)"
                            : "translateX(0)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
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
                      role="button"
                      aria-disabled={!hasConnection}
                      tabIndex={hasConnection ? 0 : -1}
                    >
                      <div className="flex-1 mr-4 overflow-hidden flex items-center gap-4 min-w-0">
                        <div
                          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: hasConnection
                              ? theme.colors.accent
                              : theme.colors.textSecondary + "50",
                          }}
                        >
                          {hasConnection ? (
                            <Heart size={14} className="text-white" />
                          ) : (
                            <AlertCircle size={14} className="text-white" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span
                            className="block truncate"
                            style={{
                              color: hasConnection
                                ? theme.colors.text
                                : theme.colors.textSecondary,
                            }}
                          >
                            {message.text}
                          </span>
                          <span
                            className="text-xs truncate flex items-center"
                            style={{
                              color: !hasConnection
                                ? theme.colors.error
                                : theme.colors.textSecondary,
                            }}
                          >
                            {!hasConnection ? (
                              <>
                                <AlertCircle size={10} className="mr-1" />
                                Connection required
                              </>
                            ) : (
                              getRelativeTime(message.timestamp)
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {deleteConfirmId === message.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFavorite(message.id);
                              }}
                              className="p-1 rounded-md focus:outline-none hover:opacity-90 transition-all text-xs whitespace-nowrap"
                              style={{
                                backgroundColor: theme.colors.error,
                                color: "#ffffff",
                              }}
                            >
                              Confirm
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(null);
                              }}
                              className="p-1 rounded-md focus:outline-none hover:opacity-90 transition-all text-xs"
                              style={{
                                backgroundColor: theme.colors.hover,
                                color: theme.colors.text,
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <CustomTooltip
                              title="Remove from favorites"
                              position="top"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(message.id);
                                }}
                                className="p-2 rounded-full focus:outline-none hover:opacity-90 transition-all"
                                aria-label="Remove favorite"
                                style={{
                                  backgroundColor: "transparent",
                                  color: theme.colors.accent,
                                }}
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </CustomTooltip>
                            {hasConnection && (
                              <ChevronRight
                                size={18}
                                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ color: theme.colors.textSecondary }}
                              />
                            )}
                          </>
                        )}
                      </div>
                      {/* Add disabled badge for list view */}
                      {!hasConnection && (
                        <div
                          className="absolute top-0 right-0 px-2 py-1 text-xs font-medium rounded-bl-md"
                          style={{
                            backgroundColor: theme.colors.error + "20",
                            color: theme.colors.error,
                          }}
                        >
                          Disabled
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredMessages.length === 0 && (
              <div
                className="text-center py-12 rounded-lg"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textSecondary,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                <div className="flex flex-col items-center justify-center">
                  {searchQuery ? (
                    <>
                      <Search size={32} className="mx-auto mb-4 opacity-50" />
                      <p className="text-lg">
                        No matches found for "{searchQuery}"
                      </p>
                      <button
                        onClick={clearSearch}
                        className="mt-3 px-4 py-2 rounded-md"
                        style={{
                          backgroundColor: theme.colors.accent,
                          color: "#ffffff",
                        }}
                      >
                        Clear search
                      </button>
                    </>
                  ) : (
                    <>
                      <Heart size={32} className="mx-auto mb-4 opacity-50" />
                      <p className="text-lg">
                        You haven't added any favorites yet
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Favorites;
