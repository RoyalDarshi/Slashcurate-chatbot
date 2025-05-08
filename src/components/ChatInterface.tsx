import {
  useState,
  useRef,
  useEffect,
  useCallback,
  memo,
  forwardRef,
  useImperativeHandle,
  useReducer,
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
  handleAskFavoriteQuestion: (
    question: string,
    connection: string,
    query?: string
  ) => void;
};

// Reducer for managing messages
type MessagesAction =
  | { type: "SET_MESSAGES"; messages: Message[] }
  | { type: "ADD_MESSAGE"; message: Message }
  | { type: "UPDATE_MESSAGE"; id: string; message: Partial<Message> };

const messagesReducer = (
  state: Message[],
  action: MessagesAction
): Message[] => {
  switch (action.type) {
    case "SET_MESSAGES":
      return action.messages;
    case "ADD_MESSAGE":
      return [...state, action.message];
    case "UPDATE_MESSAGE":
      return state.map((msg) =>
        msg.id === action.id ? { ...msg, ...action.message } : msg
      );
    default:
      return state;
  }
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
      const [messages, dispatchMessages] = useReducer(messagesReducer, []);
      const [connections, setConnections] = useState<Connection[]>([]);
      const [selectedConnection, setSelectedConnection] = useState<
        string | null
      >(localStorage.getItem("selectedConnection") || null);
      const [connectionError, setConnectionError] = useState<string | null>(
        null
      );
      const [connectionsLoading, setConnectionsLoading] = useState(true);
      const [editingMessageId, setEditingMessageId] = useState<string | null>(
        null
      );
      const [currentSessionId, setCurrentSessionId] = useState<string | null>(
        null
      );
      const [recommendedQuestions, setRecommendedQuestions] = useState<any[]>(
        []
      );
      const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);
      const [sessionConnectionError, setSessionConnectionError] = useState<
        string | null
      >(null);
      const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
      const messagesEndRef = useRef<HTMLDivElement>(null);
      const chatContainerRef = useRef<HTMLDivElement>(null);
      const mode = theme.colors.background === "#0F172A" ? "dark" : "light";
      const token = sessionStorage.getItem("token") ?? "";

      const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, []);

      const scrollToMessage = useCallback((messageId: string) => {
        const messageRef = messageRefs.current[messageId];
        if (messageRef)
          messageRef.scrollIntoView({ behavior: "smooth", block: "center" });
      }, []);

      // Scroll behavior
      useEffect(() => {
        const handleScroll = () => {
          if (!chatContainerRef.current) return;
          const { scrollTop, clientHeight, scrollHeight } =
            chatContainerRef.current;
          setUserHasScrolledUp(scrollTop + clientHeight < scrollHeight - 10);
        };
        const chatContainer = chatContainerRef.current;
        if (chatContainer)
          chatContainer.addEventListener("scroll", handleScroll);
        return () => chatContainer?.removeEventListener("scroll", handleScroll);
      }, []);

      useEffect(() => {
        if (!userHasScrolledUp && !editingMessageId) scrollToBottom();
      }, [messages, userHasScrolledUp, editingMessageId, scrollToBottom]);

      // Fetch connections
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
            const storedConnection = localStorage.getItem("selectedConnection");
            const defaultConnection =
              response.data.connections.find(
                (conn: Connection) => conn.connectionName === storedConnection
              ) || response.data.connections[0];
            setSelectedConnection(defaultConnection?.connectionName || null);
            localStorage.setItem(
              "selectedConnection",
              defaultConnection?.connectionName || ""
            );
          }
          setConnectionError(null);
        } catch (error) {
          console.error("Error fetching connections:", error);
          setConnectionError("Failed to make connection. Please try again.");
          setSelectedConnection(null);
        } finally {
          setConnectionsLoading(false);
        }
      }, [token, theme, mode]);

      // Fetch session
      const fetchSession = useCallback(
        async (sessionId: string) => {
          setConnectionsLoading(true);
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
            dispatchMessages({
              type: "SET_MESSAGES",
              messages: response.data.messages || [],
            });
            setCurrentSessionId(sessionId);
            if (response.data.connection) {
              setSelectedConnection(response.data.connection);
              localStorage.setItem(
                "selectedConnection",
                response.data.connection
              );
            } else {
              setSelectedConnection(null);
              setSessionConnectionError(
                "This session does not have a connection."
              );
              localStorage.removeItem("selectedConnection");
            }
            setTimeout(scrollToBottom, 300);
          } catch (error) {
            console.error("Error fetching session:", error);
            setSessionConnectionError("Failed to load session.");
            dispatchMessages({ type: "SET_MESSAGES", messages: [] });
          } finally {
            setConnectionsLoading(false);
          }
        },
        [token, scrollToBottom]
      );

      // Initial load
      useEffect(() => {
        const loadInitialData = async () => {
          const storedSessionId = localStorage.getItem("currentSessionId");
          if (storedSessionId) await fetchSession(storedSessionId);
          await fetchConnections();
        };
        loadInitialData();
      }, [fetchConnections, fetchSession]);

      // Fetch recommended questions
      useEffect(() => {
        const fetchRecQuestions = async () => {
          if (token && !currentSessionId) {
            try {
              const data = await getRecommendedQuestions(token);
              setRecommendedQuestions(data);
            } catch (error) {
              console.error("Failed to fetch recommended questions:", error);
            }
          }
        };
        fetchRecQuestions();
      }, [token, currentSessionId]);

      // Handle initial question
      useEffect(() => {
        if (initialQuestion && !connectionsLoading && connections.length > 0) {
          if (!selectedConnection) {
            const defaultConnection = connections[0];
            setSelectedConnection(defaultConnection.connectionName);
            localStorage.setItem(
              "selectedConnection",
              defaultConnection.connectionName
            );
          }
          handleAskFavoriteQuestion(
            initialQuestion.text,
            initialQuestion.connection,
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

      // Centralized question-asking logic
      const askQuestion = useCallback(
        async (
          question: string,
          connection: string,
          isFavorited: boolean,
          query?: string
        ) => {
          if (!connection) {
            toast.error("No connection provided.");
            return;
          }

          let sessionId = currentSessionId;
          const useExistingSession =
            sessionId && selectedConnection === connection;

          if (!useExistingSession) {
            try {
              const response = await axios.post(
                `${API_URL}/api/sessions`,
                {
                  token,
                  currentConnection: connection,
                  title: question.substring(0, 50) + "...",
                },
                { headers: { "Content-Type": "application/json" } }
              );
              sessionId = response.data.id;
              setCurrentSessionId(sessionId);
              localStorage.setItem("currentSessionId", sessionId??"");
              setSelectedConnection(connection);
              localStorage.setItem("selectedConnection", connection);
              dispatchMessages({ type: "SET_MESSAGES", messages: [] });
            } catch (error) {
              console.error("Error creating session:", error);
              toast.error("Failed to create session.");
              return;
            }
          }

          const userMessage: Message = {
            id: Date.now().toString(),
            content: question,
            isBot: false,
            timestamp: new Date().toISOString(),
            isFavorited,
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

          try {
            const userResponse = await axios.post(
              `${API_URL}/api/messages`,
              {
                token,
                session_id: sessionId,
                content: question,
                isBot: false,
                isFavorited,
                parentId: null,
              },
              { headers: { "Content-Type": "application/json" } }
            );
            userMessage.id = userResponse.data.id;
          } catch (error) {
            console.error("Error saving user message:", error);
            toast.error("Failed to save message.");
            return;
          }

          setLoadingMessageId(botLoadingMessage.id);
          dispatchMessages({ type: "ADD_MESSAGE", message: userMessage });
          dispatchMessages({ type: "ADD_MESSAGE", message: botLoadingMessage });

          try {
            const connectionObj = connections.find(
              (conn) => conn.connectionName === connection
            );
            if (!connectionObj) throw new Error("Connection not found");

            const payload = query
              ? { question, sql_query: query, connection: connectionObj }
              : { question, connection: connectionObj };
            const response = await axios.post(
              `${CHATBOT_API_URL}/ask`,
              payload
            );

            const botResponse: Message = {
              id: Date.now().toString(),
              content: JSON.stringify(response.data, null, 2),
              isBot: true,
              timestamp: new Date().toISOString(),
              isFavorited,
              parentId: userMessage.id,
            };

            const botResponseData = await axios.post(
              `${API_URL}/api/messages`,
              {
                token,
                session_id: sessionId,
                content: botResponse.content,
                isBot: true,
                isFavorited,
                parentId: userMessage.id,
              },
              { headers: { "Content-Type": "application/json" } }
            );
            botResponse.id = botResponseData.data.id;

            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: botLoadingMessage.id,
              message: botResponse,
            });
            setTimeout(() => scrollToMessage(botResponse.id), 100);
          } catch (error) {
            console.error("Error getting bot response:", error);
            const errorMessage: Message = {
              id: botLoadingMessage.id,
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
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: botLoadingMessage.id,
              message: errorMessage,
            });
            setTimeout(() => scrollToMessage(errorMessage.id), 100);
          } finally {
            setLoadingMessageId(null);
          }
        },
        [
          currentSessionId,
          selectedConnection,
          connections,
          token,
          scrollToMessage,
          theme,
          mode,
        ]
      );

      const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
          e.preventDefault();
          if (!input.trim() || isSubmitting) return;
          if (!selectedConnection) {
            toast.error("No connection selected.", {
              style: {
                background: theme.colors.surface,
                color: theme.colors.error,
              },
              theme: mode,
            });
            return;
          }
          setIsSubmitting(true);
          await askQuestion(input, selectedConnection, false);
          setInput("");
          setIsSubmitting(false);
        },
        [input, isSubmitting, selectedConnection, askQuestion, theme, mode]
      );

      const handleAskFavoriteQuestion = useCallback(
        async (question: string, connection: string, query?: string) => {
          await askQuestion(question, connection, true, query);
        },
        [askQuestion]
      );

      const handleNewChat = useCallback(() => {
        dispatchMessages({ type: "SET_MESSAGES", messages: [] });
        setInput("");
        setEditingMessageId(null);
        setCurrentSessionId(null);
        setSessionConnectionError(null);
        localStorage.removeItem("currentSessionId");
      }, []);

      const handleSelect = useCallback(
        async (option: any) => {
          if (option?.value === "create-con") {
            onCreateConSelected();
            setSelectedConnection(null);
            localStorage.removeItem("selectedConnection");
          } else if (option) {
            handleNewChat();
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
        [onCreateConSelected, connections, handleNewChat]
      );

      const handleFavoriteMessage = useCallback(
        async (messageId: string) => {
          if (!token || !selectedConnection) {
            toast.error(
              "Cannot favorite message: Missing token or connection.",
              {
                style: {
                  background: theme.colors.surface,
                  color: theme.colors.error,
                },
                theme: mode,
              }
            );
            return;
          }
          const questionMessage = messages.find((msg) => msg.id === messageId);
          if (!questionMessage || questionMessage.isBot) {
            toast.error("Invalid question message.");
            return;
          }
          try {
            const responseMessage = messages.find(
              (msg) => msg.parentId === messageId
            );
            await axios.post(
              `${API_URL}/favorite`,
              {
                token,
                questionId: messageId,
                questionContent: questionMessage.content,
                currentConnection: selectedConnection,
                responseQuery: responseMessage
                  ? JSON.parse(responseMessage.content).sql_query
                  : null,
              },
              { headers: { "Content-Type": "application/json" } }
            );
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: messageId,
              message: { isFavorited: true },
            });
            if (responseMessage) {
              dispatchMessages({
                type: "UPDATE_MESSAGE",
                id: responseMessage.id,
                message: { isFavorited: true },
              });
            }
          } catch (error) {
            console.error("Error favoriting message:", error);
            toast.error("Failed to favorite message.");
          }
        },
        [token, messages, selectedConnection, theme, mode]
      );

      const handleUnfavoriteMessage = useCallback(
        async (messageId: string) => {
          if (!token) {
            toast.error("Cannot unfavorite message: Token missing.");
            return;
          }
          try {
            await axios.post(
              `${API_URL}/unfavorite`,
              {
                token,
                currentConnection: selectedConnection,
                questionId: messageId,
              },
              { headers: { "Content-Type": "application/json" } }
            );
            const responseMessage = messages.find(
              (msg) => msg.parentId === messageId
            );
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: messageId,
              message: { isFavorited: false },
            });
            if (responseMessage) {
              dispatchMessages({
                type: "UPDATE_MESSAGE",
                id: responseMessage.id,
                message: { isFavorited: false },
              });
            }
          } catch (error) {
            console.error("Error unfavoriting message:", error);
            toast.error("Failed to unfavorite message.");
          }
        },
        [token, messages, selectedConnection]
      );

      const handleEditMessage = useCallback(
        async (id: string, newContent: string) => {
          if (!selectedConnection) {
            toast.error("No connection selected.", {
              style: {
                background: theme.colors.surface,
                color: theme.colors.error,
              },
              theme: mode,
            });
            return;
          }
          try {
            await axios.put(
              `${API_URL}/api/messages/${id}`,
              { token, content: newContent },
              { headers: { "Content-Type": "application/json" } }
            );
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id,
              message: { content: newContent, isFavorited: false },
            });
            setEditingMessageId(id);

            const editedMessage = messages.find((msg) => msg.id === id);
            if (!editedMessage?.isBot) {
              const responseMessage = messages.find(
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
                dispatchMessages({
                  type: "UPDATE_MESSAGE",
                  id: responseMessage.id,
                  message: botLoadingMessage,
                });
              } else {
                dispatchMessages({
                  type: "ADD_MESSAGE",
                  message: botLoadingMessage,
                });
              }

              try {
                const connectionObj = connections.find(
                  (conn) => conn.connectionName === selectedConnection
                );
                if (!connectionObj) throw new Error("Connection not found");
                const response = await axios.post(`${CHATBOT_API_URL}/ask`, {
                  question: newContent,
                  connection: connectionObj,
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
                dispatchMessages({
                  type: "UPDATE_MESSAGE",
                  id: botLoadingMessage.id,
                  message: botResponse,
                });
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
                    },
                    { headers: { "Content-Type": "application/json" } }
                  );
                }
                dispatchMessages({
                  type: "UPDATE_MESSAGE",
                  id: botLoadingMessage.id,
                  message: errorMessage,
                });
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
          token,
          scrollToMessage,
          theme,
          mode,
        ]
      );

      useImperativeHandle(ref, () => ({
        handleNewChat,
        handleAskFavoriteQuestion,
      }));

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
            ref={chatContainerRef}
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
                    color: "white",
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
              <div>
                {sessionConnectionError && (
                  <div
                    className="text-center"
                    style={{
                      padding: theme.spacing.md,
                      color: theme.colors.error,
                    }}
                  >
                    {sessionConnectionError} You can view the chat history but
                    cannot ask new questions, favorite, or edit messages.
                  </div>
                )}
                {messages.map((message) => {
                  let responseStatus: "loading" | "success" | "error" | null =
                    null;
                  if (!message.isBot) {
                    const botResponse = messages.find(
                      (msg) => msg.isBot && msg.parentId === message.id
                    );
                    if (botResponse) {
                      if (botResponse.content === "loading...")
                        responseStatus = "loading";
                      else if (
                        botResponse.content.includes(
                          "Sorry, an error occurred."
                        )
                      )
                        responseStatus = "error";
                      else responseStatus = "success";
                    }
                  }
                  return (
                    <div
                      className="flex flex-col w-full max-w-full"
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
                        disabled={!!sessionConnectionError}
                      />
                    </div>
                  );
                })}
              </div>
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
            {userHasScrolledUp && (
              <div
                className="flex justify-end"
                style={{
                  position: "absolute",
                  bottom: "130px",
                  right: "120px",
                  zIndex: 1000,
                  marginBottom: "10px",
                }}
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
                      boxShadow: theme.shadow.md,
                    }}
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
              disabled={!!sessionConnectionError}
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
