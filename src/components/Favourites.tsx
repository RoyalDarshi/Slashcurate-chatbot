import { useState, useEffect } from "react";
import { useTheme } from "../ThemeContext";
import { Heart, Search, X, ChevronRight, Loader2 } from "lucide-react";
import { API_URL } from "../config";
import axios from "axios";

interface FavoriteMessage {
  id: string;
  text: string;
  query: string;
  isFavorited: boolean;
}

interface FavoritesProps {
  onFavoriteSelected: (question: string, query?: string) => void;
}

const Favorites: React.FC<FavoritesProps> = ({ onFavoriteSelected }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<FavoriteMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animateId, setAnimateId] = useState<string | null>(null);
  const { theme } = useTheme();
  const token = sessionStorage.getItem("token") ?? "demo-token";

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        if (!token) {
          setError("Authentication required");
          return;
        }

        const response = await axios.post(`${API_URL}/favorites`, {
          token,
        });

        if (response.status === 200) {
          const formattedData: FavoriteMessage[] = response.data.map(
            (item: any) => ({
              id: item.question_id,
              text: item.question,
              query: item.query || undefined,
              isFavorited: true,
            })
          );
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

      // Delay actual removal to show animation
      setTimeout(async () => {
        await axios.post(`${API_URL}/favorite/delete`, {
          token,
          questionId: id,
        });

        setFavorites((prev) => prev.filter((msg) => msg.id !== id));
        setAnimateId(null);
      }, 300);
    } catch (err) {
      setError("Failed to remove favorite");
      console.error("API Error:", err);
      setAnimateId(null);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const filteredMessages = favorites.filter((message) =>
    message.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="p-4 md:p-6 h-full min-h-screen transition-colors duration-300"
      style={{ backgroundColor: theme.colors.background }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1
            className="text-3xl font-bold"
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

        <div className="relative mb-6">
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
                style={{
                  backgroundColor: theme.colors.hover,
                  opacity: 0.7,
                }}
              >
                <X size={16} style={{ color: theme.colors.text }} />
              </button>
            </div>
          )}
        </div>

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

        {!loading && (
          <div className="space-y-3">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className="p-4 rounded-lg flex items-center justify-between transition-all cursor-pointer hover:scale-[1.01] group"
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
                onClick={() => {
                  onFavoriteSelected(message.text, message.query);
                }}
              >
                <div className="flex-1 mr-4 overflow-hidden">
                  <span
                    className="block truncate"
                    style={{
                      color: theme.colors.text,
                      fontSize: theme.typography.size.base,
                    }}
                  >
                    {message.text}
                  </span>
                </div>

                <div className="flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFavorite(message.id);
                    }}
                    className="p-2 rounded-full focus:outline-none hover:opacity-90 transition-all"
                    aria-label="Remove favorite"
                    style={{
                      backgroundColor: "transparent",
                      color: theme.colors.accent,
                    }}
                  >
                    <Heart className="w-5 h-5 fill-current" />
                  </button>

                  <ChevronRight
                    size={18}
                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: theme.colors.textSecondary }}
                  />
                </div>
              </div>
            ))}

            {!loading && filteredMessages.length === 0 && (
              <div
                className="text-center py-12 rounded-lg"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textSecondary,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
