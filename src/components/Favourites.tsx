import { useState, useEffect } from "react";
import { useTheme } from "../ThemeContext";
import axios from "axios";
import { API_URL } from "../config";
import CustomTooltip from "./CustomTooltip";

interface FavoriteMessage {
  id: string;
  text: string;
  query?: string;
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
  const { theme } = useTheme();
  const token = sessionStorage.getItem("token") ?? "";

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        if (!token) {
          setError("Authentication required");
          return;
        }

        const response = await axios.post(`${API_URL}/favorites`, { token });

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

      await axios.post(`${API_URL}/favorite/delete`, {
        token,
        messageId: id,
      });

      setFavorites((prev) => prev.filter((msg) => msg.id !== id));
    } catch (err) {
      setError("Failed to remove favorite");
      console.error("API Error:", err);
    }
  };

  const filteredMessages = favorites.filter((message) =>
    message.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`p-4 h-full min-h-screen transition-colors duration-300`}
      style={{ backgroundColor: theme.colors.background }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1
            className="text-2xl font-bold"
            style={{ color: theme.colors.text }}
          >
            Favorite Messages ({filteredMessages.length})
          </h1>
        </div>

        {error && (
          <div
            className="p-3 mb-4 rounded-lg"
            style={{
              backgroundColor: theme.colors.error,
              color: theme.colors.text,
            }}
          >
            {error}
          </div>
        )}

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full p-3 rounded-lg ${theme.typography.fontFamily} focus:outline-none`}
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`,
              fontSize: theme.typography.size.base,
            }}
          />
        </div>

        {loading && (
          <div className="text-center" style={{ color: theme.colors.text }}>
            <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mb-2" />
            <p>Loading favorites...</p>
          </div>
        )}

        {!loading && (
          <div className="space-y-3">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg flex items-center justify-between transition-all cursor-pointer`}
                style={{
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                }}
                onClick={() => onFavoriteSelected(message.text, message.query)}
              >
                <span
                  style={{
                    color: theme.colors.text,
                    fontSize: theme.typography.size.base,
                  }}
                >
                  {message.text}
                </span>

                <CustomTooltip title="Remove from favorites">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFavorite(message.id);
                    }}
                    className="focus:outline-none hover:opacity-75"
                    aria-label="Remove favorite"
                    style={{ transition: theme.transition.default }}
                  >
                    <svg
                      className="w-6 h-6"
                      fill={theme.colors.accent}
                      stroke={theme.colors.accent}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>
                </CustomTooltip>
              </div>
            ))}

            {!loading && filteredMessages.length === 0 && (
              <div
                className="text-center p-4 rounded-lg"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textSecondary,
                }}
              >
                {searchQuery ? "No matches found" : "No favorite messages"}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
