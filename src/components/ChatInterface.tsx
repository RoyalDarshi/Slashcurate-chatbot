import { useReducer, useRef, useEffect, useCallback, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import {
  Message,
  Connection,
  ChatState,
  ChatAction,
  ChatInterfaceProps,
} from "../types";
import { CHATBOT_API_URL } from "../config";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import Loader from "./Loader";
import { useTheme } from "../ThemeContext";
import { askChatbot, getConnectionDetails, getUserConnections } from "../api";

interface Session {
  id: string;
  messages: Message[];
  timestamp: string;
  title: string;
  isFavorite: boolean;
}

const initialState: ChatState = {
  isLoading: false,
  input: "",
  isSubmitting: false,
};

const reducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_INPUT":
      return { ...state, input: action.payload };
    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.payload };
    default:
      return state;
  }
};

const ChatInterface: React.FC<
  ChatInterfaceProps & { onSessionSelected?: (session: Session) => void }
> = ({ onCreateConSelected, onSessionSelected }) => {
  const { theme } = useTheme();
  const [loadingMessageId, setLoadingMessageId] = useState<string | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const messagesRef = useRef<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(
    localStorage.getItem("selectedConnection") || null
  );
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null); // Track current session
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const mode = theme.colors.background === "#0F172A" ? "dark" : "light";

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const scrollToMessage = useCallback((messageId: string) => {
    const messageRef = messageRefs.current[messageId];
    if (messageRef) {
      messageRef.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  useEffect(() => {
    if (!editingMessageId) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom, editingMessageId]);

  const saveMessages = useCallback(() => {
    try {
      localStorage.setItem("chatMessages", JSON.stringify(messagesRef.current));
      if (currentSessionId) {
        const storedSessions = localStorage.getItem("chatSessions");
        const sessions = storedSessions ? JSON.parse(storedSessions) : [];
        const updatedSessions = sessions.map((session: Session) =>
          session.id === currentSessionId
            ? { ...session, messages: messagesRef.current }
            : session
        );
        localStorage.setItem("chatSessions", JSON.stringify(updatedSessions));
      }
    } catch (error) {
      console.error("Failed to save messages", error);
    }
  }, [currentSessionId]);

  const saveSession = useCallback(() => {
    if (messagesRef.current.length > 0 && !currentSessionId) {
      const storedSessions = localStorage.getItem("chatSessions");
      const sessions = storedSessions ? JSON.parse(storedSessions) : [];
      const newSession = {
        id: `session-${Date.now()}`,
        messages: [...messagesRef.current],
        timestamp: new Date().toISOString(),
        title:
          messagesRef.current[0]?.content.substring(0, 50) + "..." ||
          "Untitled",
        isFavorite: false,
      };
      sessions.push(newSession);
      localStorage.setItem("chatSessions", JSON.stringify(sessions));
      setCurrentSessionId(newSession.id);
      localStorage.setItem("currentSessionId", newSession.id); // Persist the new session ID
    }
  }, [currentSessionId]);

  useEffect(() => {
    const loadInitialMessages = () => {
      // Check for an existing current session first
      const currentSessionId = localStorage.getItem("currentSessionId");
      if (currentSessionId) {
        const storedSessions = localStorage.getItem("chatSessions");
        const sessions = storedSessions ? JSON.parse(storedSessions) : [];
        const currentSession = sessions.find(
          (session: Session) => session.id === currentSessionId
        );
        if (currentSession) {
          messagesRef.current = currentSession.messages;
          setMessages(currentSession.messages);
          setCurrentSessionId(currentSessionId);
          return; // Exit after loading the current session
        }
      }

      // If no current session, check for a newly selected session
      const selectedSession = localStorage.getItem("selectedSession");
      if (selectedSession) {
        const session: Session = JSON.parse(selectedSession);
        messagesRef.current = session.messages;
        setMessages(session.messages);
        setCurrentSessionId(session.id);
        localStorage.setItem("currentSessionId", session.id); // Persist the session ID
        localStorage.removeItem("selectedSession"); // Clean up after transferring
        if (onSessionSelected) onSessionSelected(session);
      } else {
        // Fallback to unsaved messages if no session is selected
        const storedMessages = localStorage.getItem("chatMessages");
        if (storedMessages) {
          messagesRef.current = JSON.parse(storedMessages);
          setMessages(messagesRef.current);
        }
      }
    };

    loadInitialMessages();
    fetchConnections();
  }, [theme, onSessionSelected]);

  const fetchConnections = async () => {
    setConnectionsLoading(false);
    const token = sessionStorage.getItem("token");
    if (!token) {
      toast.error("User ID not found. Please log in again.", {
        style: {
          background: theme.colors.surface,
          color: theme.colors.error,
        },
        theme: mode,
      });
      setConnectionsLoading(false);
      return;
    }
    try {
      const response = await getUserConnections(token);
      setConnections(response.data.connections);

      if (response.data.connections.length === 0) {
        setSelectedConnection(null);
        localStorage.removeItem("selectedConnection");
      } else {
        const storedConnectionName = localStorage.getItem("selectedConnection");
        const defaultConnection =
          response.data.connections.find(
            (conn: Connection) => conn.connectionName === storedConnectionName
          ) ||
          response.data.connections[0] ||
          null;

        setSelectedConnection(defaultConnection?.connectionName || null);
        localStorage.setItem(
          "selectedConnection",
          defaultConnection?.connectionName || ""
        );

        if (defaultConnection) {
          await getConnectionDetails(defaultConnection);
        }
      }
      setConnectionError(null);
    } catch (error) {
      setSelectedConnection("");
      console.error("Error fetching connections:", error);
      setConnectionError("Failed to make connection. Please try again.");
    } finally {
      setConnectionsLoading(false);
    }
  };

  const handleSelect = async (option: any) => {
    if (option?.value === "create-con") {
      onCreateConSelected();
      setSelectedConnection(null);
      localStorage.removeItem("selectedConnection");
    } else if (option) {
      const selectedConnectionObj = connections.find(
        (conn) => conn.connectionName === option.value.connectionName
      );
      if (selectedConnectionObj) {
        try {
          await getConnectionDetails(selectedConnectionObj);
          setSelectedConnection(selectedConnectionObj.connectionName);
          localStorage.setItem(
            "selectedConnection",
            selectedConnectionObj.connectionName
          );
          setConnectionError(null);
        } catch (error) {
          console.error("Error fetching connection details:", error);
          setConnectionError("Failed to make connection. Please try again.");
        }
      }
    } else {
      setSelectedConnection(null);
      localStorage.removeItem("selectedConnection");
    }
  };

  const handleNewChat = () => {
    saveSession(); // Save the current session before resetting
    messagesRef.current = [];
    setMessages([]);
    localStorage.removeItem("selectedConnection");
    localStorage.setItem("chatMessages", JSON.stringify([]));
    setConnectionError(null);
    dispatch({ type: "SET_INPUT", payload: "" });
    setEditingMessageId(null);
    setCurrentSessionId(null);
    localStorage.removeItem("currentSessionId"); // Clear the current session ID
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!state.input.trim() || state.isLoading) return;
      if (!selectedConnection) {
        toast.error(
          "No connection selected. Please create or select a connection first.",
          {
            style: {
              background: theme.colors.surface,
              color: theme.colors.error,
              border: `1px solid ${theme.colors.error}20`,
            },
            theme: mode,
          }
        );
        return;
      }

      dispatch({ type: "SET_SUBMITTING", payload: true });

      const userMessage: Message = {
        id: Date.now().toString(),
        content: state.input,
        isBot: false,
        timestamp: new Date().toISOString(),
      };
      const botLoadingMessage: Message = {
        id: `loading-${Date.now()}`,
        isBot: true,
        content: "loading...",
        timestamp: new Date().toISOString(),
      };

      setLoadingMessageId(botLoadingMessage.id);
      messagesRef.current = [
        ...messagesRef.current,
        userMessage,
        botLoadingMessage,
      ];
      setMessages([...messagesRef.current]);
      dispatch({ type: "SET_INPUT", payload: "" });
      setEditingMessageId(null);
      scrollToBottom();

      try {
        const selectedConnectionObj = connections.find(
          (conn) => conn.connectionName === selectedConnection
        );
        if (!selectedConnectionObj)
          throw new Error("Selected connection not found");

        const response = await askChatbot(state.input, selectedConnectionObj);

        const botResponseMessage: Message = {
          id: Date.now().toString(),
          content: JSON.stringify(response.data, null, 2),
          isBot: true,
          timestamp: new Date().toISOString(),
        };

        messagesRef.current = messagesRef.current.map((msg) =>
          msg.id === botLoadingMessage.id ? botResponseMessage : msg
        );
      } catch (error) {
        console.error("Error getting bot response:", error);
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: "Sorry, an error occurred. Please try again.",
          isBot: true,
          timestamp: new Date().toISOString(),
        };
        messagesRef.current = messagesRef.current.map((msg) =>
          msg.id === botLoadingMessage.id ? errorMessage : msg
        );
      } finally {
        setLoadingMessageId(null);
        setMessages([...messagesRef.current]);
        dispatch({ type: "SET_SUBMITTING", payload: false });
        saveMessages();
      }
    },
    [
      state.input,
      state.isLoading,
      selectedConnection,
      connections,
      saveMessages,
    ]
  );

  const handleEditMessage = async (id: string, newContent: string) => {
    const messageIndex = messagesRef.current.findIndex((msg) => msg.id === id);
    if (messageIndex === -1) return;

    if (!selectedConnection) {
      toast.error(
        "No connection selected. Please create or select a connection first.",
        {
          style: {
            background: theme.colors.surface,
            color: theme.colors.error,
            border: `1px solid ${theme.colors.error}20`,
          },
        }
      );
      return;
    }

    messagesRef.current = messagesRef.current.map((msg) =>
      msg.id === id ? { ...msg, content: newContent } : msg
    );
    setMessages([...messagesRef.current]);
    setEditingMessageId(id);

    const editedMessage = messagesRef.current[messageIndex];
    if (!editedMessage.isBot && selectedConnection) {
      const botLoadingMessage: Message = {
        id: `loading-${Date.now()}`,
        content: "loading...",
        isBot: true,
        timestamp: new Date().toISOString(),
      };
      setLoadingMessageId(botLoadingMessage.id);

      if (
        messageIndex + 1 < messagesRef.current.length &&
        messagesRef.current[messageIndex + 1].isBot
      ) {
        messagesRef.current[messageIndex + 1] = botLoadingMessage;
      } else {
        messagesRef.current.splice(messageIndex + 1, 0, botLoadingMessage);
      }
      setMessages([...messagesRef.current]);

      try {
        const selectedConnectionObj = connections.find(
          (conn) => conn.connectionName === selectedConnection
        );
        if (!selectedConnectionObj)
          throw new Error("Selected connection not found");

        const response = await axios.post(`${CHATBOT_API_URL}/ask`, {
          question: newContent,
          connection: selectedConnectionObj,
        });
        const botResponse = JSON.stringify(response.data, null, 2);
        const botResponseMessage: Message = {
          id: Date.now().toString(),
          content: botResponse,
          isBot: true,
          timestamp: new Date().toISOString(),
        };

        messagesRef.current = messagesRef.current.map((msg) =>
          msg.id === botLoadingMessage.id ? botResponseMessage : msg
        );
        setMessages([...messagesRef.current]);
        setTimeout(() => scrollToMessage(botResponseMessage.id), 100);
      } catch (error) {
        console.error("Error updating message:", error);
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: "Sorry, an error occurred. Please try again.",
          isBot: true,
          timestamp: new Date().toISOString(),
        };
        messagesRef.current = messagesRef.current.map((msg) =>
          msg.id === botLoadingMessage.id ? errorMessage : msg
        );
        setMessages([...messagesRef.current]);
        setTimeout(() => scrollToMessage(errorMessage.id), 100);
      } finally {
        setLoadingMessageId(null);
        saveMessages();
        setEditingMessageId(null);
      }
    }
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: theme.colors.background }}
    >
      <ToastContainer
        toastStyle={{
          background: theme.colors.surface,
          color: theme.colors.text,
          border: `1px solid ${theme.colors.text}20`,
          borderRadius: theme.borderRadius.default,
          padding: theme.spacing.sm,
        }}
      />

      <div
        className="flex-1 overflow-y-auto"
        style={{
          padding: theme.spacing.lg,
          maxHeight: "calc(100vh + 100px)",
        }}
      >
        {connectionsLoading ? (
          <Loader />
        ) : connections.length === 0 && !selectedConnection ? (
          <div
            className="flex flex-col items-center justify-center h-full text-center"
            style={{ color: theme.colors.text }}
          >
            <p className="text-2xl font-semibold mb-4">No Connections Found</p>
            <p className="text-lg">
              Please create one to start chatting with your data assistant.
            </p>
            <button
              onClick={onCreateConSelected}
              className="mt-6 flex items-center justify-center w-full max-w-[180px] py-1.5 text-sm font-medium tracking-wide transition-all duration-200"
              style={{
                color: theme.colors.text,
                backgroundColor: "transparent",
                border: `1px solid ${theme.colors.accent}`,
                borderRadius: theme.borderRadius.pill,
                padding: "6px 10px",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor =
                  theme.colors.accentHover + "20")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              Create Connection
            </button>
          </div>
        ) : messages.length === 0 && !connectionError ? (
          <div
            className="flex items-center justify-center h-full text-center"
            style={{ color: theme.colors.text }}
          >
            <p className="text-3xl font-bold" style={{ maxWidth: "80%" }}>
              Hello! I’m your Data Assistant. How can I help you today?
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              className="flex flex-col w-full"
              style={{ gap: theme.spacing.md }}
              key={message.id}
              ref={(el) => (messageRefs.current[message.id] = el)}
            >
              <ChatMessage
                message={message}
                loading={message.id === loadingMessageId}
                onEditMessage={handleEditMessage}
                onDeleteMessage={(id) => {
                  messagesRef.current = messagesRef.current.filter(
                    (msg) => msg.id !== id
                  );
                  setMessages([...messagesRef.current]);
                  saveMessages();
                }}
                selectedConnection={selectedConnection}
              />
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: theme.colors.background,
          padding: theme.spacing.md,
        }}
      >
        <ChatInput
          input={state.input}
          isLoading={state.isLoading}
          onInputChange={(value) =>
            dispatch({ type: "SET_INPUT", payload: value })
          }
          isSubmitting={state.isSubmitting}
          onSubmit={handleSubmit}
          connections={connections}
          selectedConnection={selectedConnection}
          onSelect={handleSelect}
          onNewChat={handleNewChat}
        />
      </div>

      {connectionError && (
        <div
          className="text-center"
          style={{
            padding: theme.spacing.md,
            color: theme.colors.error,
          }}
        >
          {connectionError}
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
