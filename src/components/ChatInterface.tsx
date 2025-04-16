import {
  useState,
  useRef,
  useEffect,
  useCallback,
  memo,
  forwardRef,
  useImperativeHandle,
} from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { Message, Connection, ChatInterfaceProps } from "../types";
import { API_URL, CHATBOT_API_URL } from "../config";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import Loader from "./Loader";
import { useTheme } from "../ThemeContext";
import { askChatbot, getUserConnections } from "../api";

interface Session {
  id: string;
  messages: Message[];
  timestamp: string;
  title: string;
  isFavorite: boolean;
  token: string;
}

export type ChatInterfaceHandle = {
  handleNewChat: () => void;
};

const ChatInterface = memo(
  forwardRef<ChatInterfaceHandle, ChatInterfaceProps>(
    ({ onCreateConSelected, onSessionSelected }, ref) => {
      const { theme } = useTheme();
      const [loadingMessageId, setLoadingMessageId] = useState<string | null>(
        null
      );
      const [input, setInput] = useState("");
      const [isSubmitting, setIsSubmitting] = useState(false);
      const messagesRef = useRef<Message[]>([]);
      const messagesEndRef = useRef<HTMLDivElement>(null);
      const [messages, setMessages] = useState<Message[]>([]);
      const [connections, setConnections] = useState<Connection[]>([]);
      const [selectedConnection, setSelectedConnection] = useState<
        string | null
      >(localStorage.getItem("selectedConnection") || null);
      const [connectionError, setConnectionError] = useState<string | null>(
        null
      );
      const [connectionsLoading, setConnectionsLoading] = useState(false);
      const [editingMessageId, setEditingMessageId] = useState<string | null>(
        null
      );
      const [currentSessionId, setCurrentSessionId] = useState<string | null>(
        null
      );
      const [favorites, setFavorites] = useState<{
        [messageId: string]: { count: number; isFavorited: boolean };
      }>({});

      const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
      const mode = theme.colors.background === "#0F172A" ? "dark" : "light";
      const token = sessionStorage.getItem("token") ?? "";

      const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, []);

      const scrollToMessage = useCallback((messageId: string) => {
        const messageRef = messageRefs.current[messageId];
        if (messageRef) {
          messageRef.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, []);

      const prevMessagesLength = useRef(messages.length);

      useEffect(() => {
        const isNewMessageAdded = messages.length > prevMessagesLength.current;
        prevMessagesLength.current = messages.length;

        if (isNewMessageAdded && !editingMessageId) {
          scrollToBottom();
        }
      }, [messages, scrollToBottom, editingMessageId]);

      const saveMessages = useCallback(() => {
        try {
          localStorage.setItem(
            "chatMessages",
            JSON.stringify(messagesRef.current)
          );
          if (currentSessionId) {
            const storedSessions = localStorage.getItem("chatSessions");
            const sessions = storedSessions ? JSON.parse(storedSessions) : [];
            const updatedSessions = sessions.map((session: Session) =>
              session.id === currentSessionId
                ? { ...session, messages: messagesRef.current }
                : session
            );
            localStorage.setItem(
              "chatSessions",
              JSON.stringify(updatedSessions)
            );
          }
        } catch (error) {
          console.error("Failed to save messages", error);
        }
      }, [currentSessionId]);

      const saveSession = useCallback(() => {
        console.log("Saving session");
        if (messagesRef.current.length > 0 && !currentSessionId) {
          const storedSessions = localStorage.getItem("chatSessions");
          const sessions = storedSessions ? JSON.parse(storedSessions) : [];
          console.log("Sessions:", sessions);
          const newSession: Session = {
            id: `session-${Date.now()}`,
            messages: [...messagesRef.current],
            timestamp: new Date().toISOString(),
            title:
              messagesRef.current[0]?.content.substring(0, 50) + "..." ||
              "Untitled",
            isFavorite: false,
            token: sessionStorage.getItem("token") ?? "", // Add current token
          };
          sessions.push(newSession);
          console.log("New session:", newSession);
          localStorage.setItem("chatSessions", JSON.stringify(sessions));
          setCurrentSessionId(newSession.id);
          localStorage.setItem("currentSessionId", newSession.id);
        }
      }, [currentSessionId]);

      useEffect(() => {
        const loadInitialMessages = () => {
          const currentToken = sessionStorage.getItem("token") ?? "";
          const storedSessions = localStorage.getItem("chatSessions");
          const sessions: Session[] = storedSessions
            ? JSON.parse(storedSessions)
            : [];

          // Filter sessions to only include those with the current token
          const validSessions = sessions.filter(
            (session) => session.token === currentToken
          );
          if (sessions.length !== validSessions.length) {
            localStorage.setItem("chatSessions", JSON.stringify(validSessions));
          }

          // Proceed with loading the current session or selected session
          const currentSessionId = localStorage.getItem("currentSessionId");
          if (currentSessionId) {
            const currentSession = validSessions.find(
              (session) => session.id === currentSessionId
            );
            if (currentSession) {
              messagesRef.current = currentSession.messages;
              setMessages(currentSession.messages);
              setCurrentSessionId(currentSessionId);
              return;
            }
          }

          const selectedSession = localStorage.getItem("selectedSession");
          if (selectedSession) {
            const session: Session = JSON.parse(selectedSession);
            messagesRef.current = session.messages;
            setMessages(session.messages);
            setCurrentSessionId(session.id);
            localStorage.setItem("currentSessionId", session.id);
            localStorage.removeItem("selectedSession");
            if (onSessionSelected) onSessionSelected(session);
          } else {
            const storedMessages = localStorage.getItem("chatMessages");
            if (storedMessages) {
              messagesRef.current = JSON.parse(storedMessages);
              setMessages(messagesRef.current);
            }
          }

          // Scroll to bottom if there are messages after loading
          if (messagesRef.current.length > 0) {
            setTimeout(() => scrollToBottom(), 200); // Small delay to ensure DOM is updated
          }
        };

        loadInitialMessages();
        fetchConnections();
      }, [onSessionSelected, scrollToBottom]); // Added scrollToBottom to dependencies

      const fetchConnections = useCallback(async () => {
        setConnectionsLoading(true);
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
            const storedConnectionName =
              localStorage.getItem("selectedConnection");
            const defaultConnection =
              response.data.connections.find(
                (conn: Connection) =>
                  conn.connectionName === storedConnectionName
              ) ||
              response.data.connections[0] ||
              null;

            setSelectedConnection(defaultConnection?.connectionName || null);
            localStorage.setItem(
              "selectedConnection",
              defaultConnection?.connectionName || ""
            );
          }
          setConnectionError(null);
        } catch (error) {
          setSelectedConnection("");
          console.error("Error fetching connections:", error);
          setConnectionError("Failed to make connection. Please try again.");
        } finally {
          setConnectionsLoading(false);
        }
      }, [theme, mode]);

      const updateSessions = useCallback(
        (updatedMessages: Message[]) => {
          const storedSessions = localStorage.getItem("chatSessions");
          if (storedSessions && currentSessionId) {
            const sessions: Session[] = JSON.parse(storedSessions);
            const updatedSessions = sessions.map((session) =>
              session.id === currentSessionId
                ? { ...session, messages: updatedMessages }
                : session
            );
            localStorage.setItem(
              "chatSessions",
              JSON.stringify(updatedSessions)
            );
          }
        },
        [currentSessionId]
      );

      const handleSelect = useCallback(
        async (option: any) => {
          if (option?.value === "create-con") {
            onCreateConSelected();
            setSelectedConnection(null);
            localStorage.removeItem("selectedConnection");
          } else if (option) {
            const selectedConnectionObj = connections.find(
              (conn) => conn.connectionName === option.value.connectionName
            );
            if (selectedConnectionObj) {
              setSelectedConnection(selectedConnectionObj.connectionName);
              localStorage.setItem(
                "selectedConnection",
                selectedConnectionObj.connectionName
              );
              setConnectionError(null);
            }
          } else {
            setSelectedConnection(null);
            localStorage.removeItem("selectedConnection");
          }
        },
        [onCreateConSelected, connections]
      );

      const handleNewChat = useCallback(() => {
        console.log("New chat started");
        saveSession();
        messagesRef.current = [];
        setMessages([]);
        localStorage.removeItem("selectedConnection");
        localStorage.setItem("chatMessages", JSON.stringify([]));
        setConnectionError(null);
        setInput("");
        setEditingMessageId(null);
        setCurrentSessionId(null);
        localStorage.removeItem("currentSessionId");
      }, [saveSession]);

      useImperativeHandle(ref, () => ({
        handleNewChat,
      }));

      const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
          e.preventDefault();
          if (!input.trim() || isSubmitting) return;
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

          setIsSubmitting(true);

          const userMessage: Message = {
            id: Date.now().toString(),
            content: input,
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
          setInput("");
          setEditingMessageId(null);

          try {
            const selectedConnectionObj = connections.find(
              (conn) => conn.connectionName === selectedConnection
            );
            if (!selectedConnectionObj)
              throw new Error("Selected connection not found");

            const response = await askChatbot(input, selectedConnectionObj);

            const botResponseMessage: Message = {
              id: Date.now().toString(),
              content: JSON.stringify(response.data, null, 2),
              isBot: true,
              timestamp: new Date().toISOString(),
            };

            messagesRef.current = messagesRef.current.map((msg) =>
              msg.id === botLoadingMessage.id ? botResponseMessage : msg
            );
            setTimeout(() => scrollToMessage(botResponseMessage.id), 100);
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
            setTimeout(() => scrollToMessage(errorMessage.id), 100);
          } finally {
            setLoadingMessageId(null);
            setMessages([...messagesRef.current]);
            setIsSubmitting(false);
            saveMessages();
          }
        },
        [
          input,
          isSubmitting,
          selectedConnection,
          connections,
          saveMessages,
          scrollToMessage,
          mode,
          theme,
        ]
      );

      const findBotResponse = useCallback((messageId: string) => {
        try {
          const messages = messagesRef.current;
          const questionIndex = messages.findIndex(
            (msg) => msg.id === messageId
          );

          if (
            questionIndex === -1 ||
            questionIndex + 1 >= messages.length ||
            messages[questionIndex].isBot
          ) {
            return null;
          }

          const botResponse = messages[questionIndex + 1];
          if (!botResponse.isBot) return null;

          const parsedResponse = JSON.parse(botResponse.content);
          const isValidResponse =
            parsedResponse &&
            (parsedResponse.answer || parsedResponse.sql_query);

          return isValidResponse
            ? {
                ...botResponse,
                parsedContent: {
                  answer: Array.isArray(parsedResponse.answer)
                    ? parsedResponse.answer
                    : [parsedResponse.answer],
                  sql_query: parsedResponse.sql_query || "",
                  explanation: parsedResponse.explanation || "",
                },
              }
            : null;
        } catch (error) {
          console.error("Error parsing bot response:", error);
          return null;
        }
      }, []);

      const handleFavoriteMessage = useCallback(
        async (messageId: string) => {
          try {
            const token = sessionStorage.getItem("token");
            const questionMessage = messages.find((m) => m.id === messageId);
            const botResponse = findBotResponse(messageId);

            if (!questionMessage) {
              toast.error("Message not found");
              return;
            }

            const response = await axios.post(`${API_URL}/favorite`, {
              question: {
                id: questionMessage.id,
                content: questionMessage.content,
              },
              response: botResponse
                ? {
                    id: botResponse.id,
                    query: botResponse.parsedContent.sql_query,
                  }
                : null,
              connection: selectedConnection,
              token,
            });

            setFavorites((prev) => ({
              ...prev,
              [messageId]: {
                count: response.data.count,
                isFavorited: true,
              },
            }));
            updateMessageFavoriteStatus(messageId, response.data.count, true);
            toast.success("Question & response favorited");
          } catch (error) {
            console.error("Error favoriting message:", error);
            toast.error("Failed to favorite question");
          }
        },
        [messages, selectedConnection, findBotResponse]
      );

      const handleUnfavoriteMessage = useCallback(async (messageId: string) => {
        try {
          const token = sessionStorage.getItem("token");
          const response = await axios.post(`${API_URL}/unfavorite`, {
            token: token,
            messageId: messageId,
          });

          updateMessageFavoriteStatus(messageId, response.data.count, false);
        } catch (error) {
          toast.error("Failed to unfavorite message");
        }
      }, []);

      const updateMessageFavoriteStatus = useCallback(
        (messageId: string, count: number, isFavorited: boolean) => {
          const updatedMessages = messagesRef.current.map((msg) =>
            msg.id === messageId
              ? { ...msg, favoriteCount: count, isFavorited }
              : msg
          );

          messagesRef.current = updatedMessages;
          setMessages(updatedMessages);
          updateSessions(updatedMessages);
        },
        [updateSessions]
      );

      const handleEditMessage = useCallback(
        async (id: string, newContent: string) => {
          const messageIndex = messagesRef.current.findIndex(
            (msg) => msg.id === id
          );
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
            const botLoadingMessage = {
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
              messagesRef.current.splice(
                messageIndex + 1,
                0,
                botLoadingMessage
              );
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
              const botResponseMessage = {
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
              const errorMessage = {
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
        },
        [selectedConnection, connections, scrollToMessage, saveMessages, theme]
      );

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
              <Loader text="" />
            ) : connections.length === 0 && !selectedConnection ? (
              <div
                className="flex flex-col items-center justify-center h-full text-center"
                style={{ color: theme.colors.text }}
              >
                <p className="text-2xl font-semibold mb-4">
                  No Connections Found
                </p>
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
                    selectedConnection={selectedConnection}
                    onFavorite={handleFavoriteMessage}
                    onUnfavorite={handleUnfavoriteMessage}
                    favoriteCount={message.favoriteCount || 0}
                    isFavorited={message.isFavorited || false}
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
              paddingTop: 0,
            }}
          >
            <ChatInput
              input={input}
              isSubmitting={isSubmitting}
              onInputChange={setInput}
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
    }
  )
);

const areEqual = (
  prevProps: ChatInterfaceProps & {
    onSessionSelected?: (session: Session) => void;
  },
  nextProps: ChatInterfaceProps & {
    onSessionSelected?: (session: Session) => void;
  }
) => {
  return (
    prevProps.onCreateConSelected === nextProps.onCreateConSelected &&
    prevProps.onSessionSelected === nextProps.onSessionSelected &&
    prevProps.messages === nextProps.messages
  );
};

export default memo(ChatInterface, areEqual);
