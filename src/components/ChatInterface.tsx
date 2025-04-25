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
import { ArrowDown } from "lucide-react";
import {
  askChatbot,
  getUserConnections,
  getRecommendedQuestions,
} from "../api";
import RecommendedQuestions from "./RecommendedQuestions";
import CustomTooltip from "./CustomTooltip";

interface Session {
  id: string;
  messages: Message[];
  timestamp: string;
  title: string;
}

export type ChatInterfaceHandle = {
  handleNewChat: () => void;
  handleAskFavoriteQuestion: (question: string, query?: string) => void;
};

const ChatInterface = memo(
  forwardRef<ChatInterfaceHandle, ChatInterfaceProps>(
    (
      {
        onCreateConSelected,
        onSessionSelected,
        initialQuestion,
        onQuestionAsked,
      },
      ref
    ) => {
      const { theme } = useTheme();
      const [loadingMessageId, setLoadingMessageId] = useState<string | null>(
        null
      );
      const [input, setInput] = useState("");
      const [isSubmitting, setIsSubmitting] = useState(false);
      const messagesRef = useRef<Message[]>([]);
      const messagesEndRef = useRef<HTMLDivElement>(null);
      // New ref for the chat container
      const chatContainerRef = useRef<HTMLDivElement>(null);
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
      const [recommendedQuestions, setRecommendedQuestions] = useState<any[]>(
        []
      );
      // New state to track if the user has scrolled up
      const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);

      const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
      const mode = theme.colors.background === "#0F172A" ? "dark" : "light";
      const token = sessionStorage.getItem("token") ?? "";

      useEffect(() => {
        const fetchRecommendedQuestions = async () => {
          if (token) {
            try {
              const data = await getRecommendedQuestions(token);
              setRecommendedQuestions(data);
            } catch (error) {
              console.error("Failed to fetch recommended questions:", error);
            }
          }
        };
        fetchRecommendedQuestions();
      }, [token]);

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

      // Modified useEffect to only scroll if user is at the bottom
      useEffect(() => {
        if (!messages) return;
        const isNewMessageAdded = messages.length > prevMessagesLength.current;
        prevMessagesLength.current = messages.length;

        if (isNewMessageAdded && !editingMessageId && !userHasScrolledUp) {
          scrollToBottom();
        }
      }, [messages, scrollToBottom, editingMessageId, userHasScrolledUp]);

      // New useEffect to monitor scroll position
      useEffect(() => {
        const handleScroll = () => {
          if (!chatContainerRef.current) return;
          const { scrollTop, clientHeight, scrollHeight } =
            chatContainerRef.current;
          // Consider the user at the bottom if within 10px of the end
          const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
          setUserHasScrolledUp(!atBottom);
        };

        const chatContainer = chatContainerRef.current;
        if (chatContainer) {
          chatContainer.addEventListener("scroll", handleScroll);
        }

        // Cleanup event listener on unmount
        return () => {
          if (chatContainer) {
            chatContainer.removeEventListener("scroll", handleScroll);
          }
        };
      }, []);

      const fetchConnections = useCallback(async () => {
        setConnectionsLoading(true);
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
          setSelectedConnection(null);
          console.error("Error fetching connections:", error);
          setConnectionError("Failed to make connection. Please try again.");
        } finally {
          setConnectionsLoading(false);
        }
      }, [theme, mode, token]);

      const fetchSession = useCallback(
        async (sessionId: string) => {
          try {
            const response = await axios.get(
              `${API_URL}/api/sessions/${sessionId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );
            messagesRef.current = response.data.messages || [];
            setMessages(response.data.messages || []);
            setCurrentSessionId(sessionId);
            setTimeout(() => scrollToBottom(), 200);
            if (onSessionSelected) {
              onSessionSelected(response.data);
            }
          } catch (error) {
            console.error("Error fetching session:", error);
            setMessages([]);
            localStorage.removeItem("currentSessionId");
          }
        },
        [token, scrollToBottom, onSessionSelected]
      );

      useEffect(() => {
        const loadInitialMessages = async () => {
          const storedSessionId = localStorage.getItem("currentSessionId");
          if (storedSessionId) {
            await fetchSession(storedSessionId);
          }
          await fetchConnections();
        };
        loadInitialMessages();
      }, [fetchConnections, fetchSession]);

      useEffect(() => {
        if (initialQuestion && !connectionsLoading && connections.length > 0) {
          if (!selectedConnection && connections.length > 0) {
            const defaultConnection = connections[0];
            setSelectedConnection(defaultConnection.connectionName);
            localStorage.setItem(
              "selectedConnection",
              defaultConnection.connectionName
            );
          }
          handleAskFavoriteQuestion(
            initialQuestion.text,
            initialQuestion.query
          );
          if (onQuestionAsked) onQuestionAsked();
        }
      }, [
        initialQuestion,
        connections,
        connectionsLoading,
        selectedConnection,
        onQuestionAsked,
      ]);

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

      const handleNewChat = useCallback(async () => {
        messagesRef.current = [];
        setMessages([]);
        setInput("");
        setEditingMessageId(null);
        setCurrentSessionId(null);
        localStorage.removeItem("currentSessionId");
      }, []);

      const handleAskFavoriteQuestion = useCallback(
        async (question: string, query?: string) => {
          if (!selectedConnection) {
            toast.error(
              "No connection selected. Please select a connection first.",
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

          if (!currentSessionId) {
            await handleNewChat();
          }

          const userMessage: Message = {
            id: Date.now().toString(),
            content: question,
            isBot: false,
            timestamp: new Date().toISOString(),
            isFavorited: true,
            parentId: null,
          };
          const botLoadingMessage: Message = {
            id: `loading-${Date.now()}`,
            isBot: true,
            content: "loading...",
            timestamp: new Date().toISOString(),
            isFavorited: false,
            parentId: userMessage.id,
          };

          let sessionId = currentSessionId;
          if (!sessionId) {
            try {
              const response = await axios.post(
                `${API_URL}/api/sessions`,
                { token, title: question.substring(0, 50) + "..." },
                { headers: { "Content-Type": "application/json" } }
              );
              sessionId = response.data.id;
              setCurrentSessionId(sessionId);
              localStorage.setItem("currentSessionId", sessionId || "");
            } catch (error) {
              console.error("Error creating session:", error);
              toast.error("Failed to create session.");
              return;
            }
          }

          try {
            const userMessageResponse = await axios.post(
              `${API_URL}/api/messages`,
              {
                token,
                session_id: sessionId,
                content: question,
                isBot: false,
                isFavorited: true,
                parentId: null,
              },
              { headers: { "Content-Type": "application/json" } }
            );
            userMessage.id = userMessageResponse.data.id;
          } catch (error) {
            console.error("Error saving user message:", error);
            toast.error("Failed to save message.");
            return;
          }

          setLoadingMessageId(botLoadingMessage.id);
          messagesRef.current = [
            ...messagesRef.current,
            userMessage,
            botLoadingMessage,
          ];
          setMessages([...messagesRef.current]);

          try {
            const selectedConnectionObj = connections.find(
              (conn) => conn.connectionName === selectedConnection
            );
            if (!selectedConnectionObj) {
              throw new Error("Selected connection not found");
            }

            const payload = query
              ? {
                  question,
                  sql_query: query,
                  connection: selectedConnectionObj,
                }
              : { question, connection: selectedConnectionObj };
            const response = await axios.post(
              `${CHATBOT_API_URL}/ask`,
              payload
            );

            const botResponseMessage: Message = {
              id: Date.now().toString(),
              content: JSON.stringify(response.data, null, 2),
              isBot: true,
              timestamp: new Date().toISOString(),
              isFavorited: true,
              parentId: userMessage.id,
            };

            const botMessageResponse = await axios.post(
              `${API_URL}/api/messages`,
              {
                token,
                session_id: sessionId,
                content: botResponseMessage.content,
                isBot: true,
                isFavorited: true,
                parentId: userMessage.id,
              },
              { headers: { "Content-Type": "application/json" } }
            );
            botResponseMessage.id = botMessageResponse.data.id;
            messagesRef.current = messagesRef.current.map((msg) =>
              msg.id === botLoadingMessage.id ? botResponseMessage : msg
            );
            setMessages([...messagesRef.current]);
            setTimeout(() => scrollToMessage(botResponseMessage.id), 100);
          } catch (error) {
            console.error("Error getting bot response:", error);
            const errorMessage: Message = {
              id: Date.now().toString(),
              content: "Sorry, an error occurred. Please try again.",
              isBot: true,
              timestamp: new Date().toISOString(),
              isFavorited: false,
              parentId: userMessage.id,
            };

            await axios.post(
              `${API_URL}/api/messages`,
              {
                token,
                session_id: sessionId,
                content: errorMessage.content,
                isBot: true,
                parentId: userMessage.id,
              },
              { headers: { "Content-Type": "application/json" } }
            );

            messagesRef.current = messagesRef.current.map((msg) =>
              msg.id === botLoadingMessage.id ? errorMessage : msg
            );
            setMessages([...messagesRef.current]);
            setTimeout(() => scrollToMessage(errorMessage.id), 100);
          } finally {
            setLoadingMessageId(null);
          }
        },
        [
          selectedConnection,
          connections,
          currentSessionId,
          scrollToMessage,
          theme,
          mode,
          token,
          handleNewChat,
        ]
      );

      useImperativeHandle(ref, () => ({
        handleNewChat,
        handleAskFavoriteQuestion,
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
            isFavorited: false,
            parentId: null,
          };
          const botLoadingMessage: Message = {
            id: `loading-${Date.now()}`,
            isBot: true,
            content: "loading...",
            timestamp: new Date().toISOString(),
            isFavorited: false,
            parentId: userMessage.id,
          };

          let sessionId = currentSessionId;
          if (!sessionId) {
            try {
              const response = await axios.post(
                `${API_URL}/api/sessions`,
                { token, title: input.substring(0, 50) + "..." },
                { headers: { "Content-Type": "application/json" } }
              );
              sessionId = response.data.id;
              setCurrentSessionId(sessionId);
              localStorage.setItem("currentSessionId", sessionId || "");
            } catch (error) {
              console.error("Error creating session:", error);
              toast.error("Failed to create session.");
              setIsSubmitting(false);
              return;
            }
          }

          try {
            const userMessageResponse = await axios.post(
              `${API_URL}/api/messages`,
              {
                token,
                session_id: sessionId,
                content: input,
                isBot: false,
                parentId: null,
              },
              { headers: { "Content-Type": "application/json" } }
            );
            userMessage.id = userMessageResponse.data.id;

            setLoadingMessageId(botLoadingMessage.id);
            messagesRef.current = [
              ...messagesRef.current,
              userMessage,
              botLoadingMessage,
            ];
            setMessages([...messagesRef.current]);
            setInput("");
            setEditingMessageId(null);

            const selectedConnectionObj = connections.find(
              (conn) => conn.connectionName === selectedConnection
            );
            if (!selectedConnectionObj)
              throw new Error("Selected connection not found");

            const response = await askChatbot(input, selectedConnectionObj);

            const botResponseMessage: Message = {
              id: botLoadingMessage.id,
              content: JSON.stringify(response.data, null, 2),
              isBot: true,
              timestamp: new Date().toISOString(),
              isFavorited: false,
              parentId: userMessage.id,
            };

            const botResponseResponse = await axios.post(
              `${API_URL}/api/messages`,
              {
                token,
                session_id: sessionId,
                content: botResponseMessage.content,
                isBot: true,
                parentId: userMessage.id,
              },
              { headers: { "Content-Type": "application/json" } }
            );
            const serverBotId = botResponseResponse.data.id;
            botResponseMessage.id = serverBotId;

            messagesRef.current = messagesRef.current.map((msg) =>
              msg.id === botLoadingMessage.id ? botResponseMessage : msg
            );
            setMessages([...messagesRef.current]);
            setTimeout(() => scrollToMessage(serverBotId), 100);
          } catch (error) {
            console.error("Error in handleSubmit:", error);
            const errorMessage: Message = {
              id: botLoadingMessage.id,
              content: "Sorry, an error occurred. Please try again.",
              isBot: true,
              timestamp: new Date().toISOString(),
              isFavorited: false,
              parentId: userMessage.id,
            };

            const errorResponse = await axios.post(
              `${API_URL}/api/messages`,
              {
                token,
                session_id: sessionId,
                content: errorMessage.content,
                isBot: true,
                parentId: userMessage.id,
              },
              { headers: { "Content-Type": "application/json" } }
            );
            errorMessage.id = errorResponse.data.id;

            messagesRef.current = messagesRef.current.map((msg) =>
              msg.id === botLoadingMessage.id ? errorMessage : msg
            );
            setMessages([...messagesRef.current]);
            setTimeout(() => scrollToMessage(errorMessage.id), 100);
          } finally {
            setLoadingMessageId(null);
            setIsSubmitting(false);
          }
        },
        [
          input,
          isSubmitting,
          selectedConnection,
          connections,
          currentSessionId,
          scrollToMessage,
          theme,
          mode,
          token,
        ]
      );

      const handleFavoriteMessage = useCallback(
        async (messageId: string) => {
          if (!messages || !token) {
            toast.error("Cannot favorite message: Messages or token missing.");
            return;
          }

          try {
            const questionMessage = messages.find(
              (msg) => msg.id === messageId
            );
            if (!questionMessage || questionMessage.isBot) {
              toast.error("Invalid question message.");
              return;
            }

            const responseMessage = messages.find(
              (msg) => msg.parentId === messageId
            );

            await axios.post(
              `${API_URL}/favorite`,
              {
                token,
                questionId: messageId,
                questionContent: questionMessage.content,
                responseQuery: responseMessage
                  ? JSON.parse(responseMessage.content).sql_query
                  : null,
              },
              { headers: { "Content-Type": "application/json" } }
            );

            messagesRef.current = messagesRef.current.map((msg) => {
              if (msg.id === messageId) return { ...msg, isFavorited: true };
              if (msg.id === responseMessage?.id)
                return { ...msg, isFavorited: true };
              return msg;
            });
            setMessages([...messagesRef.current]);
          } catch (error) {
            console.error("Error favoriting message:", error);
            toast.error("Failed to favorite message.");
          }
        },
        [token, messages]
      );

      const handleUnfavoriteMessage = useCallback(
        async (messageId: string) => {
          if (!messages || !token) {
            toast.error(
              "Cannot unfavorite message: Messages or token missing."
            );
            return;
          }

          try {
            await axios.post(
              `${API_URL}/unfavorite`,
              { token, questionId: messageId },
              { headers: { "Content-Type": "application/json" } }
            );

            const responseMessage = messages.find(
              (msg) => msg.parentId === messageId
            );

            messagesRef.current = messagesRef.current.map((msg) => {
              if (msg.id === messageId || msg.id === responseMessage?.id) {
                return { ...msg, isFavorited: false };
              }
              return msg;
            });
            setMessages([...messagesRef.current]);
          } catch (error) {
            console.error("Error unfavoriting message:", error);
            toast.error("Failed to unfavorite message.");
          }
        },
        [token, messages]
      );

      const handleEditMessage = useCallback(
        async (id: string, newContent: string) => {
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

          const messageIndex = messagesRef.current.findIndex(
            (msg) => msg.id === id
          );
          if (messageIndex === -1) return;

          try {
            await axios.put(
              `${API_URL}/api/messages/${id}`,
              { token, content: newContent },
              { headers: { "Content-Type": "application/json" } }
            );
            messagesRef.current = messagesRef.current.map((msg) =>
              msg.id === id
                ? { ...msg, content: newContent, isFavorited: false }
                : msg
            );
            setMessages([...messagesRef.current]);
            setEditingMessageId(id);

            const editedMessage = messagesRef.current[messageIndex];
            if (!editedMessage.isBot && selectedConnection) {
              const responseMessage = messagesRef.current.find(
                (msg) => msg.parentId === id
              );

              const botLoadingMessage: Message = {
                id: responseMessage
                  ? responseMessage.id
                  : `loading-${Date.now()}`,
                content: "loading...",
                isBot: true,
                timestamp: new Date().toISOString(),
                isFavorited: false,
                parentId: id,
              };

              setLoadingMessageId(botLoadingMessage.id);

              if (responseMessage) {
                messagesRef.current = messagesRef.current.map((msg) =>
                  msg.id === responseMessage.id ? botLoadingMessage : msg
                );
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

                const botResponse: Message = {
                  id: botLoadingMessage.id,
                  content: JSON.stringify(response.data, null, 2),
                  isBot: true,
                  timestamp: new Date().toISOString(),
                  isFavorited: false,
                  parentId: id,
                };

                if (responseMessage) {
                  await axios.put(
                    `${API_URL}/api/messages/${responseMessage.id}`,
                    { token, content: botResponse.content },
                    { headers: { "Content-Type": "application/json" } }
                  );
                } else {
                  await axios.post(
                    `${API_URL}/api/messages`,
                    {
                      token,
                      session_id: currentSessionId,
                      content: botResponse.content,
                      isBot: true,
                      parentId: id,
                      isFavorited: false,
                    },
                    { headers: { "Content-Type": "application/json" } }
                  );
                }

                messagesRef.current = messagesRef.current.map((msg) =>
                  msg.id === botLoadingMessage.id ? botResponse : msg
                );
                setMessages([...messagesRef.current]);
                setTimeout(() => scrollToMessage(botResponse.id), 100);
              } catch (error) {
                console.error("Error updating bot response:", error);
                const errorMessage: Message = {
                  id: botLoadingMessage.id,
                  content: "Sorry, an error occurred. Please try again.",
                  isBot: true,
                  timestamp: new Date().toISOString(),
                  isFavorited: false,
                  parentId: id,
                };

                if (responseMessage) {
                  await axios.put(
                    `${API_URL}/api/messages/${responseMessage.id}`,
                    { token, content: errorMessage.content },
                    { headers: { "Content-Type": "application/json" } }
                  );
                } else {
                  await axios.post(
                    `${API_URL}/api/messages`,
                    {
                      token,
                      session_id: currentSessionId,
                      content: errorMessage.content,
                      isBot: true,
                      parentId: id,
                      isFavorited: false,
                    },
                    { headers: { "Content-Type": "application/json" } }
                  );
                }

                messagesRef.current = messagesRef.current.map((msg) =>
                  msg.id === botLoadingMessage.id ? errorMessage : msg
                );
                setMessages([...messagesRef.current]);
                setTimeout(() => scrollToMessage(errorMessage.id), 100);
              } finally {
                setLoadingMessageId(null);
                setEditingMessageId(null);
              }
            }
          } catch (error) {
            console.error("Error updating message:", error);
            toast.error("Failed to update message.");
          }
        },
        [
          selectedConnection,
          connections,
          currentSessionId,
          scrollToMessage,
          theme,
          mode,
          token,
        ]
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
            ref={chatContainerRef} // Attach ref to the chat container
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
                  Please create a connection to start interacting with your data
                  assistant.
                </p>
                <button
                  onClick={onCreateConSelected}
                  className="mt-6 flex items-center justify-center w-full max-w-[180px] py-2 text-sm font-medium tracking-wide transition-all duration-200"
                  style={{
                    color: theme.colors.text,
                    backgroundColor: theme.colors.accent,
                    borderRadius: theme.borderRadius.pill,
                    padding: "8px 16px",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      theme.colors.accentHover)
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      theme.colors.accent)
                  }
                >
                  Create Connection
                </button>
              </div>
            ) : messages.length === 0 && !connectionError ? (
              <div
                className="flex flex-col items-center justify-center h-full text-center"
                style={{ color: theme.colors.text }}
              >
                <h1 className="text-3xl font-bold mb-4">
                  Hello! I’m your Data Assistant. How can I help you today?
                </h1>
                <RecommendedQuestions
                  questions={recommendedQuestions}
                  onQuestionClick={handleAskFavoriteQuestion}
                />
              </div>
            ) : (
              messages.map((message) => {
                let responseStatus: "loading" | "success" | "error" | null =
                  null;
                if (!message.isBot) {
                  const botResponse = messages.find(
                    (msg) => msg.isBot && msg.parentId === message.id
                  );
                  if (botResponse) {
                    if (botResponse.content === "loading...") {
                      responseStatus = "loading";
                    } else if (
                      botResponse.content.includes("Sorry, an error occurred.")
                    ) {
                      responseStatus = "error";
                    } else {
                      responseStatus = "success";
                    }
                  }
                }
                return (
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
                      isFavorited={message.isFavorited || false}
                      responseStatus={responseStatus}
                    />
                  </div>
                );
              })
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
            {/* New button to scroll to bottom when user has scrolled up */}
            {userHasScrolledUp && (
              <div
                className=" flex justify-end"
                style={{ marginBottom: "10px", marginRight: "10px" }}
              >
                <CustomTooltip title="Scroll to Bottom" position="top">
                  <button
                    onClick={scrollToBottom}
                    style={{
                      background: theme.colors.accent,
                      color: "white",
                      padding: "8px",
                      borderRadius: theme.borderRadius.large,
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title="Scroll Bottom"
                  >
                    <ArrowDown size={20} />
                  </button>
                </CustomTooltip>
              </div>
            )}
            <ChatInput
              input={input}
              isSubmitting={isSubmitting || loadingMessageId !== null}
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
              style={{ padding: theme.spacing.md, color: theme.colors.error }}
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
  prevProps: ChatInterfaceProps,
  nextProps: ChatInterfaceProps
) => {
  return (
    prevProps.onCreateConSelected === nextProps.onCreateConSelected &&
    prevProps.onSessionSelected === nextProps.onSessionSelected &&
    prevProps.initialQuestion?.text === nextProps.initialQuestion?.text &&
    prevProps.initialQuestion?.query === nextProps.initialQuestion?.query &&
    prevProps.onQuestionAsked === nextProps.onQuestionAsked
  );
};

export default memo(ChatInterface, areEqual);
