import React, { useState, useEffect } from "react";
import { Message } from "../types";
import { Search, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../ThemeContext";
import CustomTooltip from "./CustomTooltip";

interface Session {
  id: string;
  messages: Message[];
  timestamp: string;
  title: string;
  isFavorite: boolean;
}

interface HistoryProps {
  onSessionClicked: () => void; // Update prop type
}

const History: React.FC<HistoryProps> = ({ onSessionClicked }) => {
  const { theme } = useTheme();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("today");

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    try {
      const storedSessions = localStorage.getItem("chatSessions");
      if (storedSessions) {
        const parsedSessions: Session[] = JSON.parse(storedSessions);
        setSessions(parsedSessions);
        filterSessions(parsedSessions, activeFilter);
      }
    } catch (error) {
      console.error("Failed to load sessions from local storage", error);
    }
  };

  const toggleFavorite = (sessionId: string) => {
    const updatedSessions = sessions.map((session) =>
      session.id === sessionId
        ? { ...session, isFavorite: !session.isFavorite }
        : session
    );
    setSessions(updatedSessions);
    filterSessions(updatedSessions, activeFilter);
    localStorage.setItem("chatSessions", JSON.stringify(updatedSessions));
  };

  const filterSessions = (sessions: Session[], filter: string) => {
    const now = new Date();
    const filtered = sessions.filter((session) => {
      const sessionDate = new Date(session.timestamp);
      const diffInMs = now.getTime() - sessionDate.getTime();
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

      switch (filter) {
        case "today":
          return diffInDays < 1;
        case "yesterday":
          return diffInDays >= 1 && diffInDays < 2;
        case "last7days":
          return diffInDays < 7;
        case "last1month":
          return diffInDays < 30;
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
    } else {
      filterSessions(sessions, activeFilter);
    }
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setSearchTerm("");
    filterSessions(sessions, filter);
  };

  const handleSessionClick = (session: Session) => {
    localStorage.setItem("selectedSession", JSON.stringify(session));
    onSessionClicked();
  };

  const filters = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "last7days", label: "Last 7 Days" },
    { id: "last1month", label: "Last 1 Month" },
  ];

  const sessionListVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
        when: "beforeChildren",
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
  };

  const sessionItemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
  };

  const heartVariants = {
    unfavorite: {
      scale: 1,
      transition: {
        duration: 0.2,
      },
    },
    favorite: {
      scale: [1, 1.3, 1],
      transition: {
        duration: 0.3,
        times: [0, 0.5, 1],
      },
    },
  };

  return (
    <div
      className="flex h-full flex-col"
      style={{
        background: theme.colors.background,
        padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
      }}
    >
      <div
        className="flex items-center justify-between border-b pb-4 mb-6"
        style={{
          borderColor: theme.colors.border,
          gap: theme.spacing.lg,
        }}
      >
        <h2
          className="text-2xl font-semibold tracking-tight"
          style={{
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily,
            fontWeight: theme.typography.weight.bold,
          }}
        >
          Chat History
        </h2>
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Search sessions"
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

      <div className="flex flex-wrap mb-6" style={{ gap: theme.spacing.sm }}>
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => handleFilterChange(filter.id)}
            className="px-4 py-1.5 text-sm transition-all"
            style={{
              background:
                activeFilter === filter.id
                  ? theme.colors.accent
                  : "transparent",
              color:
                activeFilter === filter.id
                  ? "white"
                  : theme.colors.textSecondary,
              border: `1px solid ${
                activeFilter === filter.id
                  ? theme.colors.accent
                  : theme.colors.border
              }`,
              borderRadius: theme.borderRadius.pill,
              fontFamily: theme.typography.fontFamily,
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.medium,
              transition: theme.transition.default,
            }}
            onMouseOver={(e) =>
              activeFilter !== filter.id &&
              (e.target.style.color = theme.colors.text)
            }
            onMouseOut={(e) =>
              activeFilter !== filter.id &&
              (e.target.style.color = theme.colors.textSecondary)
            }
          >
            {filter.label}
          </button>
        ))}
      </div>

      <motion.div
        className="flex-1 overflow-y-auto"
        variants={sessionListVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <AnimatePresence>
          {filteredSessions.length > 0 ? (
            filteredSessions.map((session) => (
              <motion.div
                key={session.id}
                variants={sessionItemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
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
                    <CustomTooltip
                          title={
                            session.isFavorite
                              ? "Remove from favorites"
                              : "Add to favorites"
                          }
                          position="top"
                        >
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(session.id);
                      }}
                      className="p-1 rounded-full transition-colors"
                    >
                      <motion.div
                        variants={heartVariants}
                        initial="unfavorite"
                        animate={session.isFavorite ? "favorite" : "unfavorite"}
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
                      </motion.div>
                    </motion.button>
                    </CustomTooltip>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              variants={sessionItemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
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
                No sessions found for this period
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default History;
