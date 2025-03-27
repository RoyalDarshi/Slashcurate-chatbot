import React, { useState, useEffect } from "react";
import { Message } from "../types";
import { Search, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../ThemeContext";

interface Session {
  id: string;
  messages: Message[];
  timestamp: string;
  title: string;
  isFavorite: boolean;
}

interface FavouritesProps {
  onSessionClicked: () => void;
}

const Favourites: React.FC<FavouritesProps> = ({ onSessionClicked }) => {
  const { theme } = useTheme();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);

  // Load favorite sessions from local storage on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    try {
      const storedSessions = localStorage.getItem("chatSessions");
      if (storedSessions) {
        const parsedSessions: Session[] = JSON.parse(storedSessions);
        const favoriteSessions = parsedSessions.filter(
          (session) => session.isFavorite
        );
        setSessions(favoriteSessions);
        setFilteredSessions(favoriteSessions);
      }
    } catch (error) {
      console.error("Failed to load sessions from local storage", error);
    }
  };

  // Toggle favorite status and update local storage
  const toggleFavorite = (sessionId: string) => {
    const updatedSessions = sessions.map((session) =>
      session.id === sessionId
        ? { ...session, isFavorite: !session.isFavorite }
        : session
    );
    const newSessions = updatedSessions.filter((session) => session.isFavorite);
    setSessions(newSessions);
    setFilteredSessions(newSessions);

    const storedSessions = localStorage.getItem("chatSessions");
    if (storedSessions) {
      const allSessions: Session[] = JSON.parse(storedSessions);
      const updatedAllSessions = allSessions.map((session) =>
        session.id === sessionId
          ? { ...session, isFavorite: !session.isFavorite }
          : session
      );
      localStorage.setItem("chatSessions", JSON.stringify(updatedAllSessions));
    }
  };

  // Handle search within favorite sessions
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term) {
      const filtered = sessions.filter((session) =>
        session.title.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredSessions(filtered);
    } else {
      setFilteredSessions(sessions);
    }
  };

  // Handle session click to load messages on home page
  const handleSessionClick = (session: Session) => {
    localStorage.setItem("selectedSession", JSON.stringify(session));
    onSessionClicked()
  };

  return (
    <div
      className="flex h-full flex-col"
      style={{
        background: theme.colors.background,
        padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
      }}
    >
      {/* Header with title and search bar */}
      <div
        className="flex items-center justify-between border-b pb-4 mb-6"
        style={{ borderColor: theme.colors.border, gap: theme.spacing.lg }}
      >
        <h2
          className="text-2xl font-semibold tracking-tight"
          style={{
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily,
            fontWeight: theme.typography.weight.bold,
          }}
        >
          Favorite Sessions
        </h2>
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Search favorite sessions"
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 pl-10 text-sm transition-all focus:outline-none"
            style={{
              background: theme.colors.surface,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.default,
              boxShadow: theme.shadow.sm,
              fontFamily: theme.typography.fontFamily,
              fontSize: theme.typography.size.sm,
              transition: theme.transition.default,
            }}
            onFocus={(e) => (e.target.style.borderColor = theme.colors.accent)}
            onBlur={(e) => (e.target.style.borderColor = theme.colors.border)}
          />
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: theme.colors.textSecondary }}
          />
        </div>
      </div>

      {/* List of favorite sessions */}
      <motion.div
        className="flex-1 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <AnimatePresence>
          {filteredSessions.length > 0 ? (
            filteredSessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-3 px-4 py-3 cursor-pointer border-b"
                style={{
                  background: `${theme.colors.accent}20`,
                  borderColor: `${theme.colors.border}50`,
                  borderRadius: theme.borderRadius.default,
                  transition: theme.transition.default,
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = `${theme.colors.hover}90`)
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = `${theme.colors.accent}20`)
                }
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex-1"
                    onClick={() => handleSessionClick(session)}
                  >
                    <h3
                      className="text-base font-medium truncate max-w-[70%]"
                      style={{
                        color: theme.colors.text,
                        fontFamily: theme.typography.fontFamily,
                        fontWeight: theme.typography.weight.medium,
                      }}
                    >
                      {session.title}
                    </h3>
                    <p
                      className="text-sm"
                      style={{
                        color: theme.colors.textSecondary,
                        fontFamily: theme.typography.fontFamily,
                        fontSize: theme.typography.size.sm,
                      }}
                    >
                      {new Date(session.timestamp).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        background: theme.colors.accent + "10",
                        color: theme.colors.accent,
                        fontFamily: theme.typography.fontFamily,
                        fontWeight: theme.typography.weight.medium,
                      }}
                    >
                      {session.messages.length} msg
                    </span>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(session.id);
                      }}
                      className="p-1 rounded-full transition-colors"
                    >
                      <Heart
                        className="h-5 w-5"
                        style={{
                          color: session.isFavorite
                            ? theme.colors.accent
                            : theme.colors.textSecondary,
                          fill: session.isFavorite
                            ? theme.colors.accent
                            : "none",
                        }}
                      />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center h-full"
              style={{ minHeight: "300px" }}
            >
              <p
                className="text-base"
                style={{
                  color: theme.colors.textSecondary,
                  fontFamily: theme.typography.fontFamily,
                  fontSize: theme.typography.size.base,
                  fontWeight: theme.typography.weight.normal,
                  background: theme.colors.surface,
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  borderRadius: theme.borderRadius.default,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                No favorite sessions found
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Favourites;
