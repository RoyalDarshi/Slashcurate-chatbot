import {
  useState,
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
import { askChatbot } from "../api";
import RecommendedQuestions from "./RecommendedQuestions";
import CustomTooltip from "./CustomTooltip";
import {
  useConnections,
  useSession,
  useRecommendedQuestions,
  useChatScroll,
} from "../hooks";

export type ChatInterfaceHandle = {
  handleNewChat: () => void;
  handleAskFavoriteQuestion: (
    question: string,
    connection: string,
    query?: string
  ) => void;
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
      const token = sessionStorage.getItem("token") ?? "";
      const mode = theme.colors.background === "#0F172A" ? "dark" : "light";

      // Use custom hooks
      const {
        connections,
        selectedConnection,
        setSelectedConnection,
        connectionError,
        connectionsLoading,
      } = useConnections(token);
      const {
        sessionId,
        messages,
        dispatchMessages,
        sessionConnection,
        loadSession,
        clearSession,
      } = useSession(token);
      const recommendedQuestions = useRecommendedQuestions(token, sessionId);
      const {
        chatContainerRef,
        messagesEndRef,
        messageRefs,
        scrollToBottom,
        scrollToMessage,
        userHasScrolledUp,
      } = useChatScroll();

      const [loadingMessageId, setLoadingMessageId] = useState<string | null>(
        null
      );
      const [input, setInput] = useState("");
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [editingMessageId, setEditingMessageId] = useState<string | null>(
        null
      );
      const [sessionConnectionError, setSessionConnectionError] = useState<
        string | null
      >(null);

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

          // Check if we can ask questions in the current session
          if (sessionId && !sessionConnection) {
            toast.error(
              "This session does not have a connection. Cannot ask new questions."
            );
            return;
          }

          let currentSessionId = sessionId;
          if (!sessionId) {
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
              currentSessionId = response.data.id;
              localStorage.setItem("currentSessionId", currentSessionId);
            } catch (error) {
              console.error("Error creating session:", error);
              toast.error("Failed to create session.");
              return;
            }
          }

          const userMessage: Message = {
            id: Date.now().toString(), // Temporary ID, will be updated
            content: question,
            isBot: false,
            timestamp: new Date().toISOString(),
            isFavorited,
            parentId: null,
          };

          try {
            // Step 1: Create user message on the server
            const userResponse = await axios.post(
              `${API_URL}/api/messages`,
              {
                token,
                session_id: currentSessionId,
                content: question,
                isBot: false,
                isFavorited,
                parentId: null,
              },
              { headers: { "Content-Type": "application/json" } }
            );
            userMessage.id = userResponse.data.id;

            // Step 2: Create bot loading message on the server
            const botLoadingResponse = await axios.post(
              `${API_URL}/api/messages`,
              {
                token,
                session_id: currentSessionId,
                content: "loading...",
                isBot: true,
                isFavorited: false,
                parentId: userMessage.id,
              },
              { headers: { "Content-Type": "application/json" } }
            );
            const botMessageId = botLoadingResponse.data.id;
            const botMessage: Message = {
              id: botMessageId,
              isBot: true,
              content: "loading...",
              timestamp: new Date().toISOString(),
              isFavorited: false,
              parentId: userMessage.id,
            };

            // Step 3: Add both messages to local state
            dispatchMessages({ type: "ADD_MESSAGE", message: userMessage });
            dispatchMessages({ type: "ADD_MESSAGE", message: botMessage });
            setLoadingMessageId(botMessageId);

            try {
              // Fetch bot response from chatbot API
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

              const botResponseContent = JSON.stringify(response.data, null, 2);

              // Step 4: Update the bot message on the server
              await axios.put(
                `${API_URL}/api/messages/${botMessageId}`,
                {
                  token,
                  content: botResponseContent,
                  timestamp: new Date().toISOString(),
                },
                { headers: { "Content-Type": "application/json" } }
              );

              // Update local state with the actual response
              const updatedBotMessage: Message = {
                ...botMessage,
                content: botResponseContent,
                timestamp: new Date().toISOString(),
              };
              dispatchMessages({
                type: "UPDATE_MESSAGE",
                id: botMessageId,
                message: updatedBotMessage,
              });
              setTimeout(() => scrollToMessage(botMessageId), 100);
            } catch (error) {
              console.error("Error getting bot response:", error);
              const errorContent =
                "Sorry, an error occurred. Please try again.";

              // Step 5: Update bot message with error content on the server
              await axios.put(
                `${API_URL}/api/messages/${botMessageId}`,
                {
                  token,
                  content: errorContent,
                  timestamp: new Date().toISOString(),
                },
                { headers: { "Content-Type": "application/json" } }
              );

              // Update local state with error message
              const errorMessage: Message = {
                ...botMessage,
                content: errorContent,
                timestamp: new Date().toISOString(),
              };
              dispatchMessages({
                type: "UPDATE_MESSAGE",
                id: botMessageId,
                message: errorMessage,
              });
              setTimeout(() => scrollToMessage(botMessageId), 100);
            } finally {
              setLoadingMessageId(null);
            }
          } catch (error) {
            console.error("Error saving user message:", error);
            toast.error("Failed to save message.");
          }
        },
        [
          sessionId,
          sessionConnection,
          connections,
          token,
          scrollToMessage,
          dispatchMessages,
        ]
      );

      const handleAskFavoriteQuestion = useCallback(
        (question: string, connection: string, query?: string) => {
          askQuestion(question, connection, true, query);
        },
        [askQuestion]
      );

      // Sync selectedConnection with sessionConnection
      useEffect(() => {
        if (sessionConnection) {
          setSelectedConnection(sessionConnection);
          localStorage.setItem("selectedConnection", sessionConnection);
          setSessionConnectionError(null);
        } else if (sessionId) {
          setSelectedConnection(null);
          localStorage.removeItem("selectedConnection");
          setSessionConnectionError("This session does not have a connection.");
        }
      }, [sessionConnection, sessionId, setSelectedConnection]);

      // Initial load
      useEffect(() => {
        const storedSessionId = localStorage.getItem("currentSessionId");
        if (storedSessionId) loadSession(storedSessionId);
      }, [loadSession]);

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
        handleAskFavoriteQuestion,
        onQuestionAsked,
      ]);

      // Auto-scroll when appropriate
      useEffect(() => {
        if (!userHasScrolledUp && !editingMessageId) scrollToBottom();
      }, [messages, userHasScrolledUp, editingMessageId, scrollToBottom]);

      const handleNewChat = useCallback(() => {
        clearSession();
        setInput("");
        setEditingMessageId(null);
        localStorage.removeItem("currentSessionId");
      }, [clearSession]);

      const handleSelect = useCallback(
        (option: any) => {
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
            }
          } else {
            setSelectedConnection(null);
            localStorage.removeItem("selectedConnection");
          }
        },
        [onCreateConSelected, connections, handleNewChat]
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

      const handleFavoriteMessage = useCallback(
        async (messageId: string) => {
          if (!token || !selectedConnection) {
            toast.error(
              "Cannot favorite message: Missing token or connection."
            );
            return;
          }
          const questionMessage = messages.find((msg) => msg.id === messageId);
          if (!questionMessage || questionMessage.isBot) return;
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
        [token, messages, selectedConnection, dispatchMessages]
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
        [token, messages, selectedConnection, dispatchMessages]
      );

      const handleRetry = useCallback(
        async (userMessageId: string) => {
          const userMessage = messages.find(
            (msg) => msg.id === userMessageId && !msg.isBot
          );
          if (!userMessage) {
            toast.error("User message not found.");
            return;
          }

          const botMessage = messages.find(
            (msg) => msg.parentId === userMessageId && msg.isBot
          );
          if (!botMessage) {
            toast.error("Bot response not found.");
            return;
          }

          if (!sessionConnection) {
            toast.error("No connection available for this session.");
            return;
          }

          const connectionObj = connections.find(
            (conn) => conn.connectionName === sessionConnection
          );
          if (!connectionObj) {
            toast.error("Connection not found.");
            return;
          }

          try {
            // Update bot message to "loading..." on server
            await axios.put(
              `${API_URL}/api/messages/${botMessage.id}`,
              {
                token,
                content: "loading...",
                timestamp: new Date().toISOString(),
              },
              { headers: { "Content-Type": "application/json" } }
            );

            // Update local state to "loading..."
            const loadingBotMessage: Message = {
              ...botMessage,
              content: "loading...",
              timestamp: new Date().toISOString(),
            };
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: botMessage.id,
              message: loadingBotMessage,
            });
            setLoadingMessageId(botMessage.id);

            try {
              // Fetch new bot response
              const payload = {
                question: userMessage.content,
                connection: connectionObj,
              };
              const response = await axios.post(
                `${CHATBOT_API_URL}/ask`,
                payload
              );

              const botResponseContent = JSON.stringify(response.data, null, 2);

              // Update bot message on server with new response
              await axios.put(
                `${API_URL}/api/messages/${botMessage.id}`,
                {
                  token,
                  content: botResponseContent,
                  timestamp: new Date().toISOString(),
                },
                { headers: { "Content-Type": "application/json" } }
              );

              // Update local state
              const updatedBotMessage: Message = {
                ...botMessage,
                content: botResponseContent,
                timestamp: new Date().toISOString(),
              };
              dispatchMessages({
                type: "UPDATE_MESSAGE",
                id: botMessage.id,
                message: updatedBotMessage,
              });
              setTimeout(() => scrollToMessage(botMessage.id), 100);
            } catch (error) {
              console.error("Error retrying message:", error);
              const errorContent =
                "Sorry, an error occurred. Please try again.";

              // Update bot message with error content on server
              await axios.put(
                `${API_URL}/api/messages/${botMessage.id}`,
                {
                  token,
                  content: errorContent,
                  timestamp: new Date().toISOString(),
                },
                { headers: { "Content-Type": "application/json" } }
              );

              // Update local state
              const errorMessage: Message = {
                ...botMessage,
                content: errorContent,
                timestamp: new Date().toISOString(),
              };
              dispatchMessages({
                type: "UPDATE_MESSAGE",
                id: botMessage.id,
                message: errorMessage,
              });
              setTimeout(() => scrollToMessage(botMessage.id), 100);
            } finally {
              setLoadingMessageId(null);
            }
          } catch (error) {
            console.error("Error updating bot message to loading:", error);
            toast.error("Failed to retry message.");
          }
        },
        [
          messages,
          sessionConnection,
          connections,
          token,
          dispatchMessages,
          scrollToMessage,
        ]
      );

      async function handleEditMessage(id: string) {
        try {
          const userMessage = messages.find(
            (msg) => msg.id === id && !msg.isBot
          );
          if (!userMessage) {
            toast.error("User message not found.");
            return;
          }

          if (!sessionConnection) {
            toast.error("No connection available for this session.");
            return;
          }

          const connectionObj = connections.find(
            (conn) => conn.connectionName === sessionConnection
          );
          if (!connectionObj) {
            toast.error("Connection not found.");
            return;
          }

          // Check if there's an existing bot response
          const responseMessage = messages.find(
            (msg) => msg.parentId === id && msg.isBot
          );

          let botMessageId: string;
          let botMessage: Message;

          if (responseMessage) {
            // Update existing bot response to "loading..."
            botMessageId = responseMessage.id;
            botMessage = {
              ...responseMessage,
              content: "loading...",
              timestamp: new Date().toISOString(),
            };
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: botMessageId,
              message: botMessage,
            });
            setLoadingMessageId(botMessageId);

            // Update on server
            await axios.put(
              `${API_URL}/api/messages/${botMessageId}`,
              {
                token,
                content: "loading...",
                timestamp: botMessage.timestamp,
              },
              { headers: { "Content-Type": "application/json" } }
            );
          } else {
            // Create new bot message with "loading..."
            const botLoadingResponse = await axios.post(
              `${API_URL}/api/messages`,
              {
                token,
                session_id: sessionId,
                content: "loading...",
                isBot: true,
                isFavorited: false,
                parentId: id,
              },
              { headers: { "Content-Type": "application/json" } }
            );
            botMessageId = botLoadingResponse.data.id;
            botMessage = {
              id: botMessageId,
              content: "loading...",
              isBot: true,
              timestamp: new Date().toISOString(),
              isFavorited: false,
              parentId: id,
            };
            dispatchMessages({ type: "ADD_MESSAGE", message: botMessage });
            setLoadingMessageId(botMessageId);
          }

          try {
            // Fetch bot response from chatbot API
            const payload = {
              question: userMessage.content,
              connection: connectionObj,
            };
            const response = await axios.post(
              `${CHATBOT_API_URL}/ask`,
              payload
            );

            const botResponseContent = JSON.stringify(response.data, null, 2);

            // Update the bot message on the server
            await axios.put(
              `${API_URL}/api/messages/${botMessageId}`,
              {
                token,
                content: botResponseContent,
                timestamp: new Date().toISOString(),
              },
              { headers: { "Content-Type": "application/json" } }
            );

            // Update local state
            const updatedBotMessage: Message = {
              ...botMessage,
              content: botResponseContent,
              timestamp: new Date().toISOString(),
            };
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: botMessageId,
              message: updatedBotMessage,
            });
            setTimeout(() => scrollToMessage(botMessageId), 100);
          } catch (error) {
            console.error("Error getting bot response:", error);
            const errorContent = "Sorry, an error occurred. Please try again.";

            // Update bot message with error content on the server
            await axios.put(
              `${API_URL}/api/messages/${botMessageId}`,
              {
                token,
                content: errorContent,
                timestamp: new Date().toISOString(),
              },
              { headers: { "Content-Type": "application/json" } }
            );

            // Update local state
            const errorMessage: Message = {
              ...botMessage,
              content: errorContent,
              timestamp: new Date().toISOString(),
            };
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: botMessageId,
              message: errorMessage,
            });
            setTimeout(() => scrollToMessage(botMessageId), 100);
          } finally {
            setLoadingMessageId(null);
          }
        } catch (error) {
          console.error("Error handling edit message:", error);
          toast.error("Failed to handle edit message.");
        }
      }

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
          {sessionConnectionError && (
            <div
              className="flex items-center justify-between sticky top-0 z-20 mx-auto my-2 max-w-3xl animate-fade-in"
              style={{
                background: theme.colors.surface,
                color: theme.colors.error,
                borderLeft: `4px solid ${theme.colors.error}`,
                borderRadius: theme.borderRadius.default,
                boxShadow: theme.shadow.md,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                marginBottom: theme.spacing.md,
              }}
            >
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: theme.spacing.sm }}
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div>
                  <div className="font-medium">{sessionConnectionError}</div>
                  <div className="text-sm opacity-75">
                    You can view the chat history but cannot ask new questions.
                  </div>
                </div>
              </div>
            </div>
          )}
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
                  className="mt-6 flex items-center justify-center w-full max-w-[180px] py-2 text-sm font-medium tracking-wide"
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
                        onRetry={handleRetry}
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
