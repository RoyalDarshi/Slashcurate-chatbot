import React, {
  useReducer,
  useRef,
  useEffect,
  useCallback,
  useState,
} from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import {
  Message,
  Connection,
  ChatState,
  ChatAction,
  ChatInterfaceProps,
} from "../types";
import {
  CHATBOT_API_URL,
  API_URL,
  CHATBOT_CON_DETAILS_API_URL,
} from "../config";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import Loader from "./Loader";
import { useTheme } from "../ThemeContext";
import { handleLogout } from "../utils";

// Helper function to convert hex to RGB
const hexToRgb = (hex: string) => {
  const cleanedHex = hex.replace("#", "");
  const bigint = parseInt(cleanedHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
};

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

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onCreateConSelected,
}) => {
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
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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
      const limitedMessages = messagesRef.current.slice(-10);
      localStorage.setItem("chatMessages", JSON.stringify(limitedMessages));
    } catch (error) {
      console.error("Failed to save messages", error);
    }
  }, []);

  useEffect(() => {
    const fetchConnections = async () => {
      setConnectionsLoading(true);
      const userId = sessionStorage.getItem("userId");
      if (!userId) {
        toast.error("User ID not found. Please log in again.", {
          style: {
            background: theme.colors.surface,
            color: theme.colors.error,
          },
        });
        setConnectionsLoading(false);
        return;
      }
      try {
        const response = await axios.post(`${API_URL}/getuserconnections`, {
          userId,
        });
        setConnections(response.data.connections);

        if (response.data.connections.length === 0) {
          setSelectedConnection(null);
          localStorage.removeItem("selectedConnection");
        } else {
          const storedConnectionName =
            localStorage.getItem("selectedConnection");
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
            await axios.post(
              `${CHATBOT_CON_DETAILS_API_URL}/connection_details`,
              {
                connection: defaultConnection,
              }
            );
          }
        }
        setConnectionError(null);
      } catch (error) {
        console.error("Error fetching connections:", error);
        setConnectionError("Failed to fetch connections. Please try again.");
      } finally {
        setConnectionsLoading(false);
      }
    };
    fetchConnections();
  }, [theme]);

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
          await axios.post(
            `${CHATBOT_CON_DETAILS_API_URL}/connection_details`,
            {
              connection: selectedConnectionObj,
            }
          );
          setSelectedConnection(selectedConnectionObj.connectionName);
          localStorage.setItem(
            "selectedConnection",
            selectedConnectionObj.connectionName
          );
          setConnectionError(null);
        } catch (error) {
          console.error("Error fetching connection details:", error);
          setConnectionError("Failed to load connection details.");
        }
      }
    } else {
      setSelectedConnection(null);
      localStorage.removeItem("selectedConnection");
    }
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

        const response = await axios.post(`${CHATBOT_API_URL}/ask`, {
          question: state.input,
          connection: selectedConnectionObj,
        });

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
        const response = await axios.post(`${CHATBOT_API_URL}/ask`, {
          question: newContent,
          connection: selectedConnection,
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

  // Convert hex accent color to RGB for RGBA usage
  const { r, g, b } = hexToRgb(theme.colors.accent);

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
        ) : connections.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-full text-center"
            style={{ color: theme.colors.text }}
          >
            <p className="text-2xl font-semibold mb-4">No Connections Found</p>
            <p className="text-lg max-w-md">
              No connections found. Please create one to start chatting with
              your data assistant.
            </p>
            <button
              onClick={onCreateConSelected}
              className="mt-6 flex items-center justify-center w-full max-w-[180px] py-1.5 text-sm font-medium tracking-wide transition-all duration-200"
              style={{
                color: theme.colors.text, // #2D3748 (light) or #F8FAFC (dark)
                backgroundColor: "transparent",
                border: `1px solid ${theme.colors.accent}`, // #6B46C1 (light) or #7C3AED (dark)
                borderRadius: theme.borderRadius.pill, // 9999px
                padding: "6px 10px",
              }}
              onMouseOver={
                (e) =>
                  (e.currentTarget.style.backgroundColor =
                    theme.colors.accentHover + "20") // #5B3A9E20 (light) or #9F67FF20 (dark)
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
          padding: theme.spacing.lg,
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
