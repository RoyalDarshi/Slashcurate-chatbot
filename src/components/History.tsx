import React, { useState, useEffect } from "react";
import { Message } from "../types";
import { Search, Trash2 } from "lucide-react";
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
  onSessionClicked: () => void;
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

  const deleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(
      (session) => session.id !== sessionId
    );
    setSessions(updatedSessions);
    filterSessions(updatedSessions, activeFilter);
    localStorage.setItem("chatSessions", JSON.stringify(updatedSessions));

    const selectedSession = localStorage.getItem("selectedSession");
    if (selectedSession && JSON.parse(selectedSession).id === sessionId) {
      localStorage.removeItem("selectedSession");
    }
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

  return (
    <div
      className="p-4 h-full min-h-screen overflow-y-hidden transition-colors duration-300 flex flex-col"
      style={{ background: theme.colors.background }}
    >
      <div className="mx-auto overflow-y-hidden w-full flex-1 flex flex-col">
        {/* Header with smaller search bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
          <h2
            className="text-xl font-bold whitespace-nowrap"
            style={{
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily,
              fontWeight: theme.typography.weight.bold,
            }}
          >
            Chat History ({filteredSessions.length})
          </h2>
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full p-2 pl-8 text-sm transition-all focus:outline-none"
              style={{
                background: theme.colors.surface,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.default,
                fontFamily: theme.typography.fontFamily,
                fontSize: theme.typography.size.sm,
              }}
            />
            <Search
              className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: theme.colors.textSecondary }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap mb-3 gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleFilterChange(filter.id)}
              className="px-3 py-1 text-sm transition-all"
              style={{
                background:
                  activeFilter === filter.id
                    ? theme.colors.accent
                    : theme.colors.surface,
                color: activeFilter === filter.id ? "white" : theme.colors.text,
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
                (e.currentTarget.style.background = theme.colors.accent + "20")
              }
              onMouseOut={(e) =>
                activeFilter !== filter.id &&
                (e.currentTarget.style.background = theme.colors.surface)
              }
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Scrollable session cards */}
        <div
          className="flex-1 overflow-y-auto"
          style={{
            maxHeight: "calc(100vh - 180px)",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <motion.div
            className="space-y-2"
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
                    className="p-3 rounded-lg overflow-x-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                    style={{
                      background: theme.colors.surface,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.default,
                      transition: theme.transition.default,
                    }}
                    onClick={() => handleSessionClick(session)}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background =
                        theme.colors.accent + "10")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = theme.colors.surface)
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-medium truncate whitespace-nowrap"
                        style={{
                          color: theme.colors.text,
                          fontFamily: theme.typography.fontFamily,
                          fontWeight: theme.typography.weight.medium,
                          fontSize: theme.typography.size.base,
                        }}
                      >
                        {session.title}
                      </h3>
                      <p
                        className="text-xs mt-1"
                        style={{
                          color: theme.colors.textSecondary,
                          fontFamily: theme.typography.fontFamily,
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
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs px-2 py-1 rounded whitespace-nowrap"
                        style={{
                          background: theme.colors.accent + "10",
                          color: theme.colors.accent,
                          fontFamily: theme.typography.fontFamily,
                          fontWeight: theme.typography.weight.medium,
                        }}
                      >
                        {session.messages.length} msg
                      </span>
                      <CustomTooltip title="Delete session">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                          className="p-1 rounded-full hover:bg-red-500/10 transition-colors"
                          style={{ color: theme.colors.textSecondary }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </CustomTooltip>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  variants={sessionItemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="text-center p-4 rounded-lg"
                  style={{
                    background: theme.colors.surface,
                    color: theme.colors.textSecondary,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.default,
                  }}
                >
                  {searchTerm
                    ? "No matches found"
                    : "No sessions found for this period"}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default History;
