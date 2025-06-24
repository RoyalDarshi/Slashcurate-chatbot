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
import ChatInput from "./DashboardInput";
import ChatMessage from "./ChatMessage";
import Loader from "./Loader";
import { useTheme } from "../ThemeContext";
import { ArrowDown } from "lucide-react";
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

// Helper function to extract error messages
const getErrorMessage = (error: any): string => {
  let extractedErrorMessage = "Sorry, an error occurred. Please try again."; // Default

  if (axios.isAxiosError(error)) {
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (typeof data === "string" && data.trim().length > 0) {
        extractedErrorMessage = data;
      } else if (
        data.detail &&
        typeof data.detail === "string" &&
        data.detail.trim().length > 0
      ) {
        extractedErrorMessage = data.detail;
      } else if (
        data.message &&
        typeof data.message === "string" &&
        data.message.trim().length > 0
      ) {
        extractedErrorMessage = data.message;
      } else if (error.message) {
        // Fallback to Axios error message if data is not helpful
        extractedErrorMessage = error.message;
      }
    } else if (error.message) {
      // No response.data but error.message exists (e.g., network error)
      extractedErrorMessage = error.message;
    }
  } else if (error instanceof Error && error.message) {
    // Non-Axios error
    extractedErrorMessage = error.message;
  }

  // Ensure it's not an empty string
  if (!extractedErrorMessage || extractedErrorMessage.trim() === "") {
    extractedErrorMessage = "An unknown error occurred. Please try again.";
  }
  return extractedErrorMessage;
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
        dispatchMessages, // This is the dispatch from useSession's useReducer
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

      const [input, setInput] = useState("");
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [editingMessageId, setEditingMessageId] = useState<string | null>(
        null
      );
      const [sessionConnectionError, setSessionConnectionError] = useState<
        string | null
      >(null);

      // Poll for loading messages
      useEffect(() => {
        const loadingMessages = messages.filter(
          (msg) => msg.isBot && msg.content === "loading..."
        );
        if (loadingMessages.length === 0) {
          setIsSubmitting(false);
          return;
        }
        setIsSubmitting(true);
        const interval = setInterval(async () => {
          // console.log( // Kept for debugging if needed
          //   "Polling for updates on loading messages:",
          //   loadingMessages.map((msg) => msg.id)
          // );
          try {
            for (const msg of loadingMessages) {
              const response = await axios.post(
                `${API_URL}/api/getmessages/${msg.id}`,
                { token },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              if (response.data.content !== "loading...") {
                // console.log( // Kept for debugging
                //   `Updating message ${msg.id} with content:`,
                //   response.data.content
                // );
                setIsSubmitting(false);
                dispatchMessages({
                  type: "UPDATE_MESSAGE", // Correctly uses SessionAction type
                  id: msg.id,
                  message: {
                    content: response.data.content,
                    timestamp: response.data.timestamp,
                  },
                });
              }
            }
          } catch (error) {
            setIsSubmitting(false);
            console.error("Error polling message updates:", error);
          }
        }, 2000);

        return () => clearInterval(interval);
      }, [messages, token, dispatchMessages]);

      // Refresh session on tab visibility change with validation
      useEffect(() => {
        const handleVisibilityChange = async () => {
          if (document.visibilityState === "visible") {
            const storedSessionId = localStorage.getItem("currentSessionId");
            if (storedSessionId) {
              // console.log("Tab visible, validating session:", storedSessionId); // Kept for debugging
              try {
                // Validate session existence
                await axios.get(`${API_URL}/api/sessions/${storedSessionId}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                // console.log("Session valid, loading:", storedSessionId); // Kept for debugging
                loadSession(storedSessionId);
              } catch (error) {
                console.error("Session validation failed:", error);
                localStorage.removeItem("currentSessionId");
                clearSession();
              }
            } else {
              // console.log("No stored session ID found on visibility change"); // Kept for debugging
            }
          }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () =>
          document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange
          );
      }, [token, loadSession, clearSession]);

      const handleNewChat = useCallback(() => {
        // console.log("Starting new chat, clearing session"); // Kept for debugging
        clearSession(); // This dispatches CLEAR_SESSION to sessionReducer
        setInput("");
        setEditingMessageId(null);
        setSessionConnectionError(null);
      }, [clearSession]);

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

          let currentSessionId = sessionId;

          if (currentSessionId && !sessionConnection) {
            const currentSessionInfo = connections.find(
              (c) => c.connectionName === selectedConnection
            );
            if (!currentSessionInfo && messages.length > 0) {
              toast.error(
                "This session does not have a valid connection. Cannot ask new questions."
              );
              return;
            }
          }

          if (!currentSessionId) {
            const storedSessionId = localStorage.getItem("currentSessionId");
            if (storedSessionId) {
              // console.log("Using stored session ID from localStorage (askQuestion):", storedSessionId); // Kept for debugging
              try {
                await loadSession(storedSessionId);
                currentSessionId = storedSessionId;
              } catch (error) {
                console.error(
                  "Failed to load stored session from localStorage (askQuestion):",
                  error
                );
                localStorage.removeItem("currentSessionId");
              }
            }
          }

          if (!currentSessionId) {
            try {
              // console.log("Creating new session for question:", question); // Kept for debugging
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
              dispatchMessages({
                type: "SET_SESSION",
                sessionId: currentSessionId,
                messages: [],
                connection: connection,
              });
              // console.log("New session created and set in state:", currentSessionId); // Kept for debugging
            } catch (error) {
              console.error("Error creating session:", error);
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

          let finalUserMessageId: string | null = null;
          let botMessageId: string | null = null;

          try {
            // console.log("Saving user message for session:", currentSessionId); // Kept for debugging
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
            const finalUserMessage = {
              ...userMessage,
              id: userResponse.data.id,
            };
            finalUserMessageId = finalUserMessage.id;
            dispatchMessages({
              type: "ADD_MESSAGE",
              message: finalUserMessage,
            });

            // console.log("Creating bot loading message for user message:", finalUserMessage.id); // Kept for debugging
            const botLoadingResponse = await axios.post(
              `${API_URL}/api/messages`,
              {
                token,
                session_id: currentSessionId,
                content: "loading...",
                isBot: true,
                isFavorited: false,
                parentId: finalUserMessage.id,
              },
              { headers: { "Content-Type": "application/json" } }
            );
            botMessageId = botLoadingResponse.data.id;
            const botLoadingMessage: Message = {
              // Renamed to botLoadingMessage for clarity
              id: botMessageId,
              isBot: true,
              content: "loading...",
              timestamp: new Date().toISOString(),
              isFavorited: false,
              parentId: finalUserMessage.id,
            };
            dispatchMessages({
              type: "ADD_MESSAGE",
              message: botLoadingMessage,
            });
            setTimeout(() => scrollToMessage(botMessageId!), 100); // Added non-null assertion as it's assigned above

            try {
              const connectionObj = connections.find(
                (conn) => conn.connectionName === connection
              );
              if (!connectionObj) {
                throw new Error(
                  `Connection '${connection}' not found during askQuestion.`
                );
              }

              // console.log("Sending question to chatbot API:", question); // Kept for debugging
              const payload = query
                ? {
                    question,
                    sql_query: query,
                    connection: connectionObj,
                    sessionId: currentSessionId,
                  }
                : {
                    question,
                    connection: connectionObj,
                    sessionId: currentSessionId,
                  };
              const response = await axios.post(
                `${CHATBOT_API_URL}/ask`,
                payload
              );
              const botResponseContent = JSON.stringify(response.data, null, 2);
              // console.log("Received bot response:", botResponseContent); // Kept for debugging

              // console.log("Updating bot message on server:", botMessageId); // Kept for debugging
              await axios.put(
                `${API_URL}/api/messages/${botMessageId}`,
                {
                  token,
                  content: botResponseContent,
                  timestamp: new Date().toISOString(),
                },
                { headers: { "Content-Type": "application/json" } }
              );

              const updatedBotMessage: Partial<Message> = {
                content: botResponseContent,
                timestamp: new Date().toISOString(),
              };
              dispatchMessages({
                type: "UPDATE_MESSAGE",
                id: botMessageId!, // Added non-null assertion
                message: updatedBotMessage,
              });
              setTimeout(() => scrollToMessage(botMessageId!), 100); // Added non-null assertion
            } catch (error) {
              // Catch for CHATBOT_API_URL/ask
              console.error("Error getting bot response:", error);
              const errorContent =
                "Sorry, an error occurred. Please try again.";

              // console.log("Updating bot message to error on server:", botMessageId); // Kept for debugging
              if (botMessageId) {
                await axios
                  .put(
                    `${API_URL}/api/messages/${botMessageId}`,
                    {
                      token,
                      content: errorContent,
                      timestamp: new Date().toISOString(),
                    },
                    { headers: { "Content-Type": "application/json" } }
                  )
                  .catch((updateError) =>
                    console.error(
                      "Failed to update message to error state on server:",
                      updateError
                    )
                  );

                const errorMessageUpdate: Partial<Message> = {
                  content: errorContent,
                  timestamp: new Date().toISOString(),
                };
                dispatchMessages({
                  type: "UPDATE_MESSAGE",
                  id: botMessageId,
                  message: errorMessageUpdate,
                });
                setTimeout(() => scrollToMessage(botMessageId), 100);
              } else {
                // This case should be rare if bot loading message was created
                console.error(
                  "botMessageId is null when trying to update with error for /ask"
                );
                const generalErrorMessage: Message = {
                  id: `error-${Date.now().toString()}`,
                  content: errorContent,
                  isBot: true,
                  timestamp: new Date().toISOString(),
                  isFavorited: false,
                  parentId: finalUserMessageId,
                };
                dispatchMessages({
                  type: "ADD_MESSAGE",
                  message: generalErrorMessage,
                });
                setTimeout(() => scrollToMessage(generalErrorMessage.id), 100);
              }
            }
          } catch (error) {
            // Catch for initial message saving or bot loading message creation
            console.error(
              "Error saving user message or creating bot loading message:",
              error
            );
            toast.error(`Failed to send message: ${getErrorMessage(error)}`);
            // If user message failed to save, remove its temporary presence if added optimistically (not current setup)
            // If bot loading message failed, the user message is there but no bot response will appear.
          }
        },
        [
          sessionId,
          sessionConnection,
          connections,
          token,
          scrollToMessage,
          dispatchMessages,
          loadSession,
          selectedConnection,
        ]
      );

      const handleAskFavoriteQuestion = useCallback(
        async (question: string, connection: string, query?: string) => {
          const connectionObj = connections.find(
            (conn) => conn.connectionName === connection
          );
          if (!connectionObj) {
            toast.error(
              "The connection for this favorite question no longer exists."
            );
            return;
          }

          if (sessionId && sessionConnection === connection) {
            // console.log("Asking favorite question in existing session (same connection):", sessionId); // Kept for debugging
            await askQuestion(question, connection, true, query);
          } else {
            // console.log(`Handling favorite question. Current session: ${sessionId}, current session connection: ${sessionConnection}, target connection: ${connection}`); // Kept for debugging
            // console.log("Clearing current session and setting up for new connection:", connection); // Kept for debugging

            handleNewChat();

            await new Promise<void>((resolve) => {
              setTimeout(resolve, 0);
            });

            setSelectedConnection(connection);
            // console.log("New connection set in state:", connection); // Kept for debugging
            // console.log("Asking favorite question, which will create/use a new session with connection:", connection); // Kept for debugging
            await askQuestion(question, connection, true, query);
            // console.log("Favorite question processed with connection:", connection); // Kept for debugging
          }
        },
        [
          sessionId,
          sessionConnection,
          connections,
          askQuestion,
          handleNewChat,
          setSelectedConnection,
        ]
      );

      useEffect(() => {
        if (sessionConnection) {
          if (selectedConnection !== sessionConnection) {
            setSelectedConnection(sessionConnection);
          }
          setSessionConnectionError(null);
        } else if (sessionId && !sessionConnection) {
          setSessionConnectionError(
            "This session was loaded but has no associated connection. You can view history or start a new chat."
          );
        }
      }, [
        sessionConnection,
        sessionId,
        setSelectedConnection,
        selectedConnection,
      ]);

      useEffect(() => {
        const storedSessionId = localStorage.getItem("currentSessionId");
        if (storedSessionId) {
          // console.log("Initial load, validating session from localStorage:", storedSessionId); // Kept for debugging
          axios
            .get(`${API_URL}/api/sessions/${storedSessionId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then(() => {
              // Axios response object not directly used here, relies on loadSession
              // console.log("Stored session valid, loading:", storedSessionId); // Kept for debugging
              loadSession(storedSessionId);
            })
            .catch((error) => {
              console.error("Stored session invalid or error loading:", error);
              localStorage.removeItem("currentSessionId");
              clearSession();
            });
        } else {
          // console.log("No stored session ID found on initial load, starting fresh."); // Kept for debugging
          if (sessionId) {
            clearSession();
          }
        }
      }, [loadSession, token, clearSession, sessionId]);

      useEffect(() => {
        if (initialQuestion && !connectionsLoading && connections.length > 0) {
          let targetConnection = initialQuestion.connection;
          if (!connections.some((c) => c.connectionName === targetConnection)) {
            console.warn(
              `Initial question's connection "${targetConnection}" not found. Using first available.`
            );
            targetConnection = connections[0]?.connectionName;
            if (!targetConnection) {
              toast.error(
                "No connections available to ask the initial question."
              );
              if (onQuestionAsked) onQuestionAsked();
              return;
            }
          }

          handleAskFavoriteQuestion(
            initialQuestion.text,
            targetConnection,
            initialQuestion.query
          );
          if (onQuestionAsked) onQuestionAsked();
        }
      }, [
        initialQuestion,
        connections,
        connectionsLoading,
        handleAskFavoriteQuestion,
        onQuestionAsked,
      ]);

      useEffect(() => {
        if (!userHasScrolledUp && !editingMessageId) scrollToBottom();
      }, [messages, userHasScrolledUp, editingMessageId, scrollToBottom]);

      const handleSelect = useCallback(
        (option: any) => {
          if (option?.value === "create-con") {
            onCreateConSelected();
            if (sessionId) handleNewChat();
            setSelectedConnection(null);
            localStorage.removeItem("selectedConnection");
          } else if (option) {
            const newSelectedConnection = option.value.connectionName;
            if (selectedConnection !== newSelectedConnection || !sessionId) {
              handleNewChat();
              setSelectedConnection(newSelectedConnection);
              localStorage.setItem("selectedConnection", newSelectedConnection);
            }
          } else {
            if (sessionId && selectedConnection) handleNewChat();
            setSelectedConnection(null);
            localStorage.removeItem("selectedConnection");
          }
        },
        [
          onCreateConSelected,
          connections,
          handleNewChat,
          setSelectedConnection,
          sessionId,
          selectedConnection,
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
          setInput("");
          await askQuestion(input, selectedConnection, false);
          setIsSubmitting(false);
        },
        [input, isSubmitting, selectedConnection, askQuestion, theme, mode]
      );

      const handleFavoriteMessage = useCallback(
        async (messageId: string) => {
          const currentConnectionForAction =
            sessionConnection || selectedConnection;
          if (!token || !currentConnectionForAction) {
            toast.error(
              "Cannot favorite message: Missing token or active connection for this action."
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
                currentConnection: currentConnectionForAction,
                responseQuery:
                  responseMessage &&
                  responseMessage.content !== "loading..." &&
                  !getErrorMessage(null).includes(responseMessage.content) // Basic check if it's not an error/loading
                    ? JSON.parse(responseMessage.content).sql_query // This might fail if content is not JSON
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
            toast.error(
              `Failed to favorite message: ${getErrorMessage(error)}`
            );
          }
        },
        [
          token,
          messages,
          selectedConnection,
          sessionConnection,
          dispatchMessages,
        ]
      );

      const handleUnfavoriteMessage = useCallback(
        async (messageId: string) => {
          const currentConnectionForAction =
            sessionConnection || selectedConnection;
          if (!token || !currentConnectionForAction) {
            toast.error(
              "Cannot unfavorite message: Token or active connection missing."
            );
            return;
          }
          try {
            await axios.post(
              `${API_URL}/unfavorite`,
              {
                token,
                currentConnection: currentConnectionForAction,
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
            toast.error(
              `Failed to unfavorite message: ${getErrorMessage(error)}`
            );
          }
        },
        [
          token,
          messages,
          selectedConnection,
          sessionConnection,
          dispatchMessages,
        ]
      );

      const handleRetry = useCallback(
        async (userMessageId: string) => {
          const userMessage = messages.find(
            (msg) => msg.id === userMessageId && !msg.isBot
          );
          if (!userMessage) {
            toast.error("User message not found for retry.");
            return;
          }

          const botMessage = messages.find(
            (msg) => msg.parentId === userMessageId && msg.isBot
          );
          if (!botMessage) {
            toast.error("Bot response not found for retry.");
            return;
          }

          const connectionForRetry = sessionConnection || selectedConnection;
          if (!connectionForRetry) {
            toast.error(
              "No active connection available for this session to retry."
            );
            return;
          }

          const connectionObj = connections.find(
            (conn) => conn.connectionName === connectionForRetry
          );
          if (!connectionObj) {
            toast.error("Connection details not found for retry.");
            return;
          }

          if (!sessionId) {
            toast.error("Session ID is missing, cannot retry.");
            return;
          }

          const originalBotMessageId = botMessage.id; // Store before potential changes

          try {
            // console.log("Retrying message, setting to loading:", originalBotMessageId); // Kept for debugging
            await axios.put(
              `${API_URL}/api/messages/${originalBotMessageId}`,
              {
                token,
                content: "loading...",
                timestamp: new Date().toISOString(),
              },
              { headers: { "Content-Type": "application/json" } }
            );
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: originalBotMessageId,
              message: {
                content: "loading...",
                timestamp: new Date().toISOString(),
              },
            });

            // console.log("Sending retry request for question:", userMessage.content); // Kept for debugging
            const payload = {
              question: userMessage.content,
              connection: connectionObj,
              sessionId,
            };
            const response = await axios.post(
              `${CHATBOT_API_URL}/ask`,
              payload
            );
            const botResponseContent = JSON.stringify(response.data, null, 2);
            // console.log("Retry response received:", botResponseContent); // Kept for debugging

            await axios.put(
              `${API_URL}/api/messages/${originalBotMessageId}`,
              {
                token,
                content: botResponseContent,
                timestamp: new Date().toISOString(),
              },
              { headers: { "Content-Type": "application/json" } }
            );
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: originalBotMessageId,
              message: {
                content: botResponseContent,
                timestamp: new Date().toISOString(),
              },
            });
            setTimeout(() => scrollToMessage(originalBotMessageId), 100);
          } catch (error) {
            console.error("Error retrying message:", error);
            // const errorContent = getErrorMessage(error);
            const errorContent = "Sorry, an error occurred. Please try again.";

            await axios
              .put(
                `${API_URL}/api/messages/${originalBotMessageId}`,
                {
                  token,
                  content: errorContent,
                  timestamp: new Date().toISOString(),
                },
                { headers: { "Content-Type": "application/json" } }
              )
              .catch((updateError) =>
                console.error(
                  "Failed to update message to error state on server (retry):",
                  updateError
                )
              );
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: originalBotMessageId,
              message: {
                content: errorContent,
                timestamp: new Date().toISOString(),
              },
            });
            setTimeout(() => scrollToMessage(originalBotMessageId), 100);
          }
        },
        [
          messages,
          selectedConnection,
          sessionConnection,
          connections,
          token,
          dispatchMessages,
          scrollToMessage,
          sessionId,
        ]
      );

      async function handleEditMessage(id: string, content: string) {
        const userMessage = messages.find((msg) => msg.id === id && !msg.isBot);
        if (!userMessage) {
          toast.error("User message not found for edit.");
          return;
        }

        const connectionForEdit = sessionConnection || selectedConnection;
        if (!connectionForEdit) {
          toast.error(
            "No active connection available for this session to edit."
          );
          return;
        }

        const connectionObj = connections.find(
          (conn) => conn.connectionName === connectionForEdit
        );
        if (!connectionObj) {
          toast.error("Connection details not found for edit.");
          return;
        }

        if (!sessionId) {
          toast.error("Session ID is missing, cannot edit message.");
          return;
        }

        let botMessageToUpdateId: string | null = null;
        const responseMessage = messages.find(
          // Find existing bot response
          (msg) => msg.parentId === id && msg.isBot
        );
        if (responseMessage) {
          botMessageToUpdateId = responseMessage.id;
        }

        try {
          // console.log("Updating user message on server:", id, content); // Kept for debugging
          await axios.put(
            `${API_URL}/api/messages/${id}`,
            {
              token,
              content,
              timestamp: new Date().toISOString(),
            },
            { headers: { "Content-Type": "application/json" } }
          );
          dispatchMessages({
            type: "UPDATE_MESSAGE",
            id,
            message: {
              content,
              timestamp: new Date().toISOString(),
            },
          });

          if (botMessageToUpdateId) {
            // console.log("Updating existing bot message to loading for edited user message:", botMessageToUpdateId); // Kept for debugging
            await axios.put(
              `${API_URL}/api/messages/${botMessageToUpdateId}`,
              {
                token,
                content: "loading...",
                timestamp: new Date().toISOString(),
              },
              { headers: { "Content-Type": "application/json" } }
            );
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: botMessageToUpdateId,
              message: {
                content: "loading...",
                timestamp: new Date().toISOString(),
              },
            });
          } else {
            // console.log("No existing bot message found, creating new bot loading message for edited user message:", id); // Kept for debugging
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
            botMessageToUpdateId = botLoadingResponse.data.id; // Assign new ID
            const newBotLoadingMessage: Message = {
              id: botMessageToUpdateId,
              content: "loading...",
              isBot: true,
              timestamp: new Date().toISOString(),
              isFavorited: false,
              parentId: id,
            };
            dispatchMessages({
              type: "ADD_MESSAGE",
              message: newBotLoadingMessage,
            });
          }

          if (!botMessageToUpdateId) {
            // Should not happen if logic above is correct
            throw new Error(
              "Failed to obtain a bot message ID for update/creation."
            );
          }

          try {
            // Inner try for the actual chatbot API call
            // console.log("Sending edited question to chatbot API:", content); // Kept for debugging
            const payload = {
              question: content,
              connection: connectionObj,
              sessionId,
            };
            const response = await axios.post(
              `${CHATBOT_API_URL}/ask`,
              payload
            );
            const botResponseContent = JSON.stringify(response.data, null, 2);
            // console.log("Received bot response for edited message:", botResponseContent); // Kept for debugging

            await axios.put(
              `${API_URL}/api/messages/${botMessageToUpdateId}`,
              {
                token,
                content: botResponseContent,
                timestamp: new Date().toISOString(),
              },
              { headers: { "Content-Type": "application/json" } }
            );
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: botMessageToUpdateId,
              message: {
                content: botResponseContent,
                timestamp: new Date().toISOString(),
              },
            });
            setTimeout(() => scrollToMessage(botMessageToUpdateId!), 100); // Added non-null assertion
          } catch (error) {
            // Catch for CHATBOT_API_URL/ask
            console.error(
              "Error getting bot response for edited message:",
              error
            );
            // const errorContent = getErrorMessage(error);
            const errorContent = "Sorry, an error occurred. Please try again.";

            await axios
              .put(
                `${API_URL}/api/messages/${botMessageToUpdateId}`, // Use the ID obtained
                {
                  token,
                  content: errorContent,
                  timestamp: new Date().toISOString(),
                },
                { headers: { "Content-Type": "application/json" } }
              )
              .catch((updateError) =>
                console.error(
                  "Failed to update message to error state on server (edit):",
                  updateError
                )
              );
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: botMessageToUpdateId, // Use the ID obtained
              message: {
                content: errorContent,
                timestamp: new Date().toISOString(),
              },
            });
            setTimeout(() => scrollToMessage(botMessageToUpdateId!), 100); // Added non-null assertion
          }
        } catch (error) {
          // Catch for outer operations (user message update, initial bot message update/creation)
          console.error("Error handling edit message (outer scope):", error);
          toast.error(`Failed to process edit: ${getErrorMessage(error)}`);
        }
      }

      useImperativeHandle(ref, () => ({
        handleNewChat,
        handleAskFavoriteQuestion,
      }));

      // Determine response status for user messages based on their corresponding bot message
      const getMessageResponseStatus = (
        userMessageId: string
      ): "loading" | "success" | "error" | null => {
        const botResponse = messages.find(
          (msg) => msg.isBot && msg.parentId === userMessageId
        );
        if (botResponse) {
          if (botResponse.content === "loading...") return "loading";

          // Check if bot content IS an error message generated by getErrorMessage
          // This is a heuristic. A dedicated `isError` flag on Message would be better.
          const potentialErrorMessages = [
            "Sorry, an error occurred. Please try again.",
            "An unknown error occurred. Please try again.",
            // Add other known error strings if they are specific and not likely to be actual data
          ];
          if (
            potentialErrorMessages.includes(botResponse.content) ||
            (botResponse.content &&
              botResponse.content.startsWith("Request failed with status code"))
          ) {
            // Common Axios error message
            return "error";
          }
          // If backend consistently returns error details in a specific way that's not JSON (e.g. plain text error)
          // and successful responses are always JSON, we could try to parse JSON:
          try {
            JSON.parse(botResponse.content); // If it's valid JSON, assume success (or successful empty)
            return "success";
          } catch (e) {
            // If it's not "loading..." and not valid JSON, it's likely a plain text error message.
            return "error";
          }
        }
        return null; // No bot response yet or not applicable
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
                    You can view the chat history but cannot ask new questions
                    with this session. Start a new chat or select a valid
                    connection.
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
              maxHeight: "calc(100vh - 150px)", // Adjusted maxHeight for better visibility of input
            }}
          >
            {connectionsLoading ? (
              <Loader text="Loading connections..." />
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
            ) : messages.length === 0 &&
              !connectionError &&
              !sessionConnectionError ? (
              <div
                className="flex flex-col items-center justify-center h-full text-center"
                style={{ color: theme.colors.text }}
              >
                <h1 className="text-3xl font-bold mb-4">
                  Hello! I’m your Data Assistant. How can I help you today?
                </h1>
                {recommendedQuestions &&
                  recommendedQuestions.length > 0 &&
                  selectedConnection && (
                    <RecommendedQuestions
                      questions={recommendedQuestions}
                      onQuestionClick={(q, c, query) =>
                        handleAskFavoriteQuestion(
                          q,
                          c || selectedConnection,
                          query
                        )
                      }
                    />
                  )}
              </div>
            ) : (
              <div>
                {messages.map((message) => {
                  const responseStatus = message.isBot
                    ? null
                    : getMessageResponseStatus(message.id);
                  return (
                    <div
                      className="flex flex-col w-full max-w-full"
                      style={{ gap: theme.spacing.md }}
                      key={message.id}
                      ref={(el) => (messageRefs.current[message.id] = el)}
                    >
                      <ChatMessage
                        message={message}
                        onEditMessage={handleEditMessage}
                        selectedConnection={
                          sessionConnection || selectedConnection
                        }
                        onFavorite={handleFavoriteMessage}
                        onUnfavorite={handleUnfavoriteMessage}
                        isFavorited={message.isFavorited || false}
                        responseStatus={responseStatus} // Pass the determined status
                        disabled={!!sessionConnectionError && message.isBot}
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
              paddingTop: theme.spacing.xs, // Added small top padding
            }}
          >
            {userHasScrolledUp && (
              <div
                className="flex justify-end"
                style={{
                  position: "absolute",
                  bottom: "80px", // Adjusted based on typical input height + padding
                  right: "30px", // Adjusted for better placement
                  zIndex: 1000,
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
              isSubmitting={isSubmitting}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              connections={connections}
              selectedConnection={selectedConnection}
              onSelect={handleSelect}
              onNewChat={handleNewChat}
              disabled={!!sessionConnectionError && !selectedConnection}
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
    prevProps.initialQuestion?.connection ===
      nextProps.initialQuestion?.connection &&
    prevProps.initialQuestion?.query === nextProps.initialQuestion?.query &&
    prevProps.onQuestionAsked === nextProps.onQuestionAsked
  );
};

export default memo(ChatInterface, areEqual);
