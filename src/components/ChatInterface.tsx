import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { Message, Connection, ChatInterfaceProps } from "../types";
import { chatService } from "../services/chatService";
import { historyService } from "../services/historyService";
import { connectionService } from "../services/connectionService";
import { handleApiError } from "../utils/errorHandler";
import { API_URL } from "../config";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import Loader from "./Loader";
import { useTheme } from "../ThemeContext";
import {
  ArrowDown,
  Database,
  Layers,
  PlusCircle,
  AlertCircle,
  Sparkles,
  LayoutDashboard,
  X,
} from "lucide-react";
import ConnectionForm from "./ConnectionForm";
import RecommendedQuestions from "./RecommendedQuestions";
import CustomTooltip from "./CustomTooltip";
import {
  useConnections,
  useSession,
  useRecommendedQuestions,
  useChatScroll,
} from "../hooks";
import { useSettings } from "../SettingsContext";
import SchemaExplorer from "./SchemaExplorer";
import schemaSampleData from "../data/sampleSchemaData";
import { FaFilePdf } from "react-icons/fa";

export type ChatInterfaceHandle = {
  handleNewChat: () => void;
  handleAskFavoriteQuestion: (
    question: string,
    connection: string,
    query?: string,
  ) => void;
};

const getErrorMessage = (error: any): string => {
  if (axios.isCancel(error) || (error as Error).name === "CanceledError") {
    return "Request cancelled by user.";
  }
  let extractedErrorMessage = "Sorry, an error occurred. Please try again.";
  if (axios.isAxiosError(error)) {
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (typeof data === "string" && data.trim().length > 0)
        extractedErrorMessage = data;
      else if (
        data.detail &&
        typeof data.detail === "string" &&
        data.detail.trim().length > 0
      )
        extractedErrorMessage = data.detail;
      else if (
        data.message &&
        typeof data.message === "string" &&
        data.message.trim().length > 0
      )
        extractedErrorMessage = data.message;
    } else if (error.message) extractedErrorMessage = error.message;
  } else if (error instanceof Error && error.message)
    extractedErrorMessage = error.message;
  return (
    extractedErrorMessage || "An unknown error occurred. Please try again."
  );
};

const limitDataForBackend = (responseData: any): any => {
  const MAX_ROWS = 500;
  const limitedData = { ...responseData };
  if (
    Array.isArray(limitedData.answer) &&
    limitedData.answer.length > MAX_ROWS
  ) {
    limitedData.answer = limitedData.answer.slice(0, MAX_ROWS);
  }
  return limitedData;
};

const ChatInterface = memo(
  forwardRef<ChatInterfaceHandle, ChatInterfaceProps>(
    ({ onCreateConSelected, initialQuestion, onQuestionAsked }, ref) => {
      const { theme } = useTheme();
      const { currentView, setCurrentView } = useSettings();
      const token = sessionStorage.getItem("token") ?? "";

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
      const [activeRequestController, setActiveRequestController] =
        useState<AbortController | null>(null);

      const [input, setInput] = useState("");
      const connectionDropdownRef = useRef<HTMLDivElement>(null);
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [editingMessageId, setEditingMessageId] = useState<string | null>(
        null,
      );
      const [sessionConnectionError, setSessionConnectionError] = useState<
        string | null
      >(null);
      const [isConnectionDropdownOpen, setIsConnectionDropdownOpen] =
        useState(false);
      const [isDbExplorerOpen, setIsDbExplorerOpen] = useState(false);
      const [showCreateConnectionModal, setShowCreateConnectionModal] = useState(false);

      const options = [
        { value: "create-con", label: "Create New Connection", isAdmin: false },
        ...connections.map((connection: Connection) => ({
          value: connection.connectionName,
          label: connection.connectionName,
          isAdmin: connection.isAdmin,
        })),
      ];

      const orderedMessages = useMemo(() => {
        const parentMessages = messages.filter(m => !m.isBot || !m.parentId);
        const childMessages = messages.filter(m => m.isBot && m.parentId);
        const sorted: Message[] = [];
        
        parentMessages.forEach(parent => {
          sorted.push(parent);
          const children = childMessages.filter(child => child.parentId === parent.id);
          sorted.push(...children);
        });
        
        // Add any orphaned child messages at the end
        const orphanedChildren = childMessages.filter(child => !parentMessages.some(p => p.id === child.parentId));
        sorted.push(...orphanedChildren);
        
        return sorted;
      }, [messages]);

      useEffect(() => {
        const checkAndPoll = async () => {
          const allLoadingMessages = messages.filter(
            (msg) => msg.isBot && msg.status === "loading",
          );
          if (allLoadingMessages.length === 0) {
            setIsSubmitting(false);
            return;
          }
          setIsSubmitting(true);
          const messagesToPoll = allLoadingMessages.filter(
            (msg) => msg.id.includes("-") && !msg.id.startsWith("temp-"),
          );
          if (messagesToPoll.length === 0) return;

          try {
            for (const msg of messagesToPoll) {
              const response = await chatService.getMessage(msg.id);
              if (response.status !== "loading") {
                dispatchMessages({
                  type: "UPDATE_MESSAGE",
                  id: msg.id,
                  message: {
                    content: response.content,
                    timestamp: response.timestamp,
                    status: response.status,
                  },
                });
              }
            }
          } catch (error) {
            console.error("Error polling message updates:", error);
          }
        };

        checkAndPoll();
        const intervalId = setInterval(checkAndPoll, 3000);
        return () => clearInterval(intervalId);
      }, [messages, token, dispatchMessages]);

      useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (
            connectionDropdownRef.current &&
            !connectionDropdownRef.current.contains(event.target as Node)
          ) {
            setIsConnectionDropdownOpen(false);
          }
        };
        if (isConnectionDropdownOpen)
          document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }, [isConnectionDropdownOpen]);

      useEffect(() => {
        const handleVisibilityChange = async () => {
          if (document.visibilityState === "visible") {
            const storedSessionId = localStorage.getItem("currentSessionId");
            if (storedSessionId) {
              try {
                await historyService.getSession(storedSessionId);
                loadSession(storedSessionId);
              } catch (error) {
                console.error("Session validation failed:", error);
                localStorage.removeItem("currentSessionId");
                clearSession();
              }
            }
          }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () =>
          document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange,
          );
      }, [token, loadSession, clearSession]);

      const handleNewChat = useCallback(() => {
        clearSession();
        setInput("");
        setEditingMessageId(null);
        setSessionConnectionError(null);
      }, [clearSession]);

      const askQuestion = useCallback(
        async (
          question: string,
          connection: string,
          isFavorited: boolean,
          query?: string,
        ) => {
          if (!connection) {
            toast.error("No connection provided.");
            setIsSubmitting(false);
            return;
          }
          let currentSessionId = sessionId;
          if (currentSessionId && !sessionConnection) {
            const currentSessionInfo = connections.find(
              (c) => c.connectionName === selectedConnection,
            );
            if (!currentSessionInfo && messages.length > 0) {
              toast.error(
                "This session does not have a valid connection. Cannot ask new questions.",
              );
              return;
            }
          }

          if (!currentSessionId) {
            const storedSessionId = localStorage.getItem("currentSessionId");
            if (storedSessionId) {
              try {
                await loadSession(storedSessionId);
                currentSessionId = storedSessionId;
              } catch (error) {
                console.error(
                  "Failed to load stored session from localStorage:",
                  error,
                );
                localStorage.removeItem("currentSessionId");
              }
            }
          }

          const tempUserMsgId = `temp-user-${Date.now()}`;
          const tempBotMsgId = `temp-bot-${Date.now() + 1}`;

          const optimisticUserMessage: Message = {
            id: tempUserMsgId,
            content: question,
            isBot: false,
            timestamp: new Date().toISOString(),
            isFavorited,
            parentId: null,
            status: "normal",
          };

          const optimisticBotMessage: Message = {
            id: tempBotMsgId,
            isBot: true,
            content: "loading...",
            timestamp: new Date().toISOString(),
            isFavorited: false,
            parentId: tempUserMsgId,
            status: "loading",
          };

          if (!currentSessionId) {
            try {
              const connectionObj = connections.find(
                (c) => c.connectionName === connection,
              );
              
              const response = await historyService.createSession({
                token,
                currentConnection: connection,
                con_id: connectionObj?.id ?? "",
                title: question.substring(0, 50) + "...",
              });
              currentSessionId = response.id;
              localStorage.setItem("currentSessionId", currentSessionId || "");
              dispatchMessages({
                type: "SET_SESSION",
                sessionId: currentSessionId || "",
                messages: [optimisticUserMessage, optimisticBotMessage],
                connection: connection,
              });
            } catch (error) {
              console.error("Error creating session:", error);
              setIsSubmitting(false);
              return;
            }
          } else {
            dispatchMessages({
              type: "ADD_MESSAGE",
              message: optimisticUserMessage,
            });
            dispatchMessages({
              type: "ADD_MESSAGE",
              message: optimisticBotMessage,
            });
          }

          setTimeout(() => scrollToMessage(tempBotMsgId), 100);

          let finalUserMessageId = tempUserMsgId;
          let finalBotMessageId = tempBotMsgId;

          try {
            const userResponse = await chatService.createMessage({
              token,
              session_id: currentSessionId,
              content: question,
              isBot: false,
              isFavorited: false,
              status: "normal",
            });

            finalUserMessageId = userResponse.id;
            dispatchMessages({
              type: "REPLACE_MESSAGE_ID",
              oldId: tempUserMsgId,
              newId: finalUserMessageId,
            });

            const botLoadingResponse = await chatService.createMessage({
              token,
              session_id: currentSessionId,
              content: "loading...",
              isBot: true,
              isFavorited: false,
              parentId: userResponse.data?.id || userResponse.id,
              status: "loading",
            });

            finalBotMessageId = botLoadingResponse.id;
            dispatchMessages({
              type: "REPLACE_MESSAGE_ID",
              oldId: tempBotMsgId,
              newId: finalBotMessageId,
            });

            const controller = new AbortController();
            setActiveRequestController(controller);

            const connectionObj = connections.find(
              (c) => c.connectionName === connection,
            );
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

            const response = await chatService.askChatbot(payload, controller);
            setActiveRequestController(null);
            const responseData = response.data;

            let finalContent = "";
            let finalStatus: Message["status"] = "normal";

            if (
              responseData.execution_status === "Failed" ||
              responseData.data_availability === "Execution Error"
            ) {
              finalStatus = "error";
              finalContent =
                responseData.answer?.error?.message ||
                "Query execution failed.";
            } else {
              finalContent = JSON.stringify(responseData, null, 2);
            }

            const limitedData = limitDataForBackend(responseData);
            await chatService.updateMessage(finalBotMessageId, {
              token,
              content:
                finalStatus === "error"
                  ? finalContent
                  : JSON.stringify(limitedData, null, 2),
              timestamp: new Date().toISOString(),
              status: finalStatus,
            });

            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: finalBotMessageId,
              message: {
                content: finalContent,
                timestamp: new Date().toISOString(),
                status: finalStatus,
              },
            });
            setIsSubmitting(false);
            setTimeout(() => scrollToMessage(finalBotMessageId), 150);
          } catch (error) {
            setActiveRequestController(null);
            const errorContent = getErrorMessage(error);
            if (
              axios.isCancel(error) ||
              (error as Error).name === "CanceledError"
            )
              return;

            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: finalBotMessageId,
              message: { content: errorContent, status: "error" },
            });

            if (finalBotMessageId !== tempBotMsgId) {
              await axios
                .put(`${API_URL}/api/messages/${finalBotMessageId}`, {
                  token,
                  content: errorContent,
                  status: "error",
                })
                .catch((e) => console.error("Failed to save error state", e));
            }
            setIsSubmitting(false);
          }
        },
        [
          sessionId,
          messages.length,
          sessionConnection,
          connections,
          token,
          scrollToMessage,
          dispatchMessages,
          loadSession,
          selectedConnection,
        ],
      );

      const handleAskFavoriteQuestion = useCallback(
        async (question: string, connection: string, query?: string) => {
          const connectionObj = connections.find(
            (conn) => conn.connectionName === connection,
          );
          if (!connectionObj) {
            toast.error(
              "The connection for this favorite question no longer exists.",
            );
            return;
          }
          handleNewChat();
          await new Promise<void>((resolve) => setTimeout(resolve, 0));
          setSelectedConnection(connection);
          await askQuestion(question, connection, false, query);
        },
        [connections, askQuestion, handleNewChat, setSelectedConnection],
      );

      useEffect(() => {
        if (sessionConnection) {
          if (selectedConnection !== sessionConnection)
            setSelectedConnection(sessionConnection);
          setSessionConnectionError(null);
        } else if (sessionId && !sessionConnection) {
          setSessionConnectionError(
            "This session was loaded but has no associated connection. View history or start a new chat.",
          );
          const timer = setTimeout(() => {
            setSessionConnectionError(null);
          }, 8000);
          return () => clearTimeout(timer);
        }
      }, [
        sessionConnection,
        sessionId,
        setSelectedConnection,
        selectedConnection,
      ]);

      useEffect(() => {
        if (currentView !== "chat") return;
        const storedSessionId = localStorage.getItem("currentSessionId");
        if (storedSessionId) {
          axios
            .get(`${API_URL}/api/sessions/${storedSessionId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then(() => loadSession(storedSessionId))
            .catch((error) => {
              console.error("Stored session invalid or error loading:", error);
              localStorage.removeItem("currentSessionId");
              clearSession();
            });
        } else if (sessionId) {
          clearSession();
        }
      }, [loadSession, token, clearSession, currentView]);

      useEffect(() => {
        if (initialQuestion && !connectionsLoading && connections.length > 0) {
          let targetConnection = initialQuestion.connection;
          if (!connections.some((c) => c.connectionName === targetConnection)) {
            console.warn(
              `Initial question's connection "${targetConnection}" not found. Using first available.`,
            );
            targetConnection = connections[0]?.connectionName;
            if (!targetConnection) {
              toast.error(
                "No connections available to ask the initial question.",
              );
              if (onQuestionAsked) onQuestionAsked();
              return;
            }
          }
          handleAskFavoriteQuestion(
            initialQuestion.text,
            targetConnection,
            initialQuestion.query,
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

      const handleConnectionSelect = useCallback(
        (value: string) => {
          if (value === "create-con") {
            setShowCreateConnectionModal(true);
          } else {
            const selectedConnectionObj = connections.find(
              (conn) => conn.connectionName === value,
            );
            if (selectedConnectionObj) {
              if (
                selectedConnection !== selectedConnectionObj.connectionName ||
                !sessionId
              ) {
                handleNewChat();
                setSelectedConnection(selectedConnectionObj.connectionName);
                localStorage.setItem(
                  "selectedConnection",
                  selectedConnectionObj.connectionName,
                );
              }
            } else {
              if (selectedConnection) handleNewChat();
              setSelectedConnection(null);
              localStorage.removeItem("selectedConnection");
            }
          }
          setIsConnectionDropdownOpen(false);
        },
        [
          connections,
          handleNewChat,
          setSelectedConnection,
          sessionId,
          selectedConnection,
        ],
      );

      const handlePdfClick = useCallback(
        async (connection: string, e: React.MouseEvent) => {
          e.stopPropagation();
          try {
            const response = await connectionService.downloadDataAtlas(connection);
            const pdfBlob = new Blob([response.data], {
              type: "application/pdf",
            });
            const url = window.URL.createObjectURL(pdfBlob);
            window.open(url, "_blank");
            window.URL.revokeObjectURL(url);
            toast.success(`Opened Data Atlas for ${connection}`);
          } catch (error) {
            console.error("Error fetching Data Atlas:", error);
            toast.error(`Failed to open Data Atlas: ${getErrorMessage(error)}`);
          }
        },
        [token],
      );

      const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
          e.preventDefault();
          if (!input.trim() || isSubmitting) return;
          if (!selectedConnection) {
            toast.error("No connection selected.");
            return;
          }
          setIsSubmitting(true);
          const question = input;
          setInput("");
          try {
            await askQuestion(question, selectedConnection, false);
          } catch (error) {
            setIsSubmitting(false);
            console.error(error);
          }
        },
        [input, isSubmitting, selectedConnection, askQuestion],
      );

      const handleStopRequest = useCallback(async () => {
        if (!isSubmitting) return;
        if (activeRequestController) {
          activeRequestController.abort();
          setActiveRequestController(null);
        }
        const loadingMessage = messages.find(
          (msg) => msg.isBot && msg.status === "loading",
        );
        if (loadingMessage && loadingMessage.id) {
          const errorMessage = "Request cancelled by user.";
          const errorStatus = "error";
          const loadingMessageId = loadingMessage.id;
          try {
            await chatService.updateMessage(loadingMessageId, { token, content: errorMessage, timestamp: new Date().toISOString(), status: errorStatus });
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: loadingMessageId,
              message: {
                content: errorMessage,
                timestamp: new Date().toISOString(),
                status: errorStatus,
              },
            });
            setIsSubmitting(false);
          } catch (error) {
            console.error("Error cancelling request:", error);
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: loadingMessageId,
              message: {
                content: `Error cancelling: ${getErrorMessage(error)}`,
                timestamp: new Date().toISOString(),
                status: "error",
              },
            });
            setIsSubmitting(false);
          }
        } else {
          setIsSubmitting(false);
        }
      }, [
        isSubmitting,
        messages,
        token,
        dispatchMessages,
        activeRequestController,
      ]);

      const handleFavoriteMessage = useCallback(
        async (messageId: string) => {
          const currentConnectionForAction =
            sessionConnection || selectedConnection;
          if (!token || !currentConnectionForAction) {
            toast.error(
              "Cannot favorite message: Missing active connection parameters.",
            );
            return;
          }
          const questionMessage = messages.find((msg) => msg.id === messageId);
          if (!questionMessage || questionMessage.isBot) return;
          try {
            const responseMessage = messages.find(
              (msg) => msg.parentId === messageId,
            );
            await chatService.favoriteMessage({ token, questionId: messageId, questionContent: questionMessage.content, currentConnection: currentConnectionForAction, con_id: connections.find((c) => c.connectionName === currentConnectionForAction)?.id, responseQuery: responseMessage && responseMessage.status === "normal" ? (JSON.parse(responseMessage.content).metadata?.query || JSON.parse(responseMessage.content).query || null) : null });
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: messageId,
              message: { isFavorited: true },
            });
            if (responseMessage)
              dispatchMessages({
                type: "UPDATE_MESSAGE",
                id: responseMessage.id,
                message: { isFavorited: true },
              });
          } catch (error) {
            toast.error(
              `Failed to favorite message: ${getErrorMessage(error)}`,
            );
          }
        },
        [
          token,
          messages,
          selectedConnection,
          sessionConnection,
          connections,
          dispatchMessages,
        ],
      );

      const handleUnfavoriteMessage = useCallback(
        async (messageId: string) => {
          const currentConnectionForAction =
            sessionConnection || selectedConnection;
          if (!token || !currentConnectionForAction) {
            toast.error(
              "Cannot unfavorite message: Active configuration reference dropped.",
            );
            return;
          }
          try {
            const message = messages.find((msg) => msg.id === messageId);
            await chatService.unfavoriteMessage({ token, currentConnection: currentConnectionForAction, con_id: connections.find((c) => c.connectionName === currentConnectionForAction)?.id, questionContent: message?.content, questionId: messageId });
            const responseMessage = messages.find(
              (msg) => msg.parentId === messageId,
            );
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: messageId,
              message: { isFavorited: false },
            });
            if (responseMessage)
              dispatchMessages({
                type: "UPDATE_MESSAGE",
                id: responseMessage.id,
                message: { isFavorited: false },
              });
          } catch (error) {
            toast.error(
              `Failed to unfavorite message: ${getErrorMessage(error)}`,
            );
          }
        },
        [
          token,
          messages,
          selectedConnection,
          sessionConnection,
          connections,
          dispatchMessages,
        ],
      );

      const handleRetry = useCallback(
        async (userMessageId: string) => {
          const userMessage = messages.find(
            (msg) => msg.id === userMessageId && !msg.isBot,
          );
          const botMessage = messages.find(
            (msg) => msg.parentId === userMessageId && msg.isBot,
          );
          if (!userMessage || !botMessage) return;

          const connectionForRetry = sessionConnection || selectedConnection;
          const connectionObj = connections.find(
            (conn) => conn.connectionName === connectionForRetry,
          );
          if (!connectionObj || !sessionId) return;

          const originalBotMessageId = botMessage.id;
          
          const payload = {
            question: userMessage.content,
            con_id: connectionObj.id,
            session_id: sessionId,
          };

          try {
            await chatService.updateMessage(originalBotMessageId, { token, content: "loading...", timestamp: new Date().toISOString(), status: "loading" });
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: originalBotMessageId,
              message: {
                content: "loading...",
                timestamp: new Date().toISOString(),
                status: "loading",
              },
            });

            const controller = new AbortController();
            setActiveRequestController(controller);

            const response = await chatService.askChatbot(payload, controller);
            setActiveRequestController(null);
            const botResponseContent = JSON.stringify(response.data, null, 2);

            const limitedResponseData = limitDataForBackend(response.data);
            await chatService.updateMessage(originalBotMessageId, { token, content: JSON.stringify(limitedResponseData, null, 2), timestamp: new Date().toISOString(), status: "normal" });
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: originalBotMessageId,
              message: {
                content: botResponseContent,
                timestamp: new Date().toISOString(),
                status: "normal",
              },
            });
            setTimeout(() => scrollToMessage(originalBotMessageId), 100);
          } catch (error) {
            setActiveRequestController(null);
            const errorContent = getErrorMessage(error);
            if (
              axios.isCancel(error) ||
              (error as Error).name === "CanceledError"
            )
              return;

            await chatService.updateMessage(originalBotMessageId, { token, content: errorContent, timestamp: new Date().toISOString(), status: "error" }).catch(() => {});
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: originalBotMessageId,
              message: {
                content: errorContent,
                timestamp: new Date().toISOString(),
                status: "error",
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
        ],
      );

      async function handleEditMessage(id: string, content: string) {
        const userMessage = messages.find((msg) => msg.id === id && !msg.isBot);
        if (!userMessage || !sessionId) return;
        const connectionForEdit = sessionConnection || selectedConnection;
        const connectionObj = connections.find(
          (conn) => conn.connectionName === connectionForEdit,
        );
        if (!connectionObj) return;

        const payload = {
          question: content,
          con_id: connectionObj.id,
          session_id: sessionId,
        };

        let botMessageToUpdateId: string | null = null;
        const responseMessage = messages.find(
          (msg) => msg.parentId === id && msg.isBot,
        );
        if (responseMessage) botMessageToUpdateId = responseMessage.id;

        try {
          await chatService.updateMessage(id, { token, content, timestamp: new Date().toISOString(), status: "normal" });
          dispatchMessages({
            type: "UPDATE_MESSAGE",
            id,
            message: {
              content,
              timestamp: new Date().toISOString(),
              status: "normal",
            },
          });

          if (botMessageToUpdateId) {
            await chatService.updateMessage(botMessageToUpdateId, { token, content: "loading...", timestamp: new Date().toISOString(), status: "loading" });
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: botMessageToUpdateId,
              message: {
                content: "loading...",
                timestamp: new Date().toISOString(),
                status: "loading",
              },
            });
          } else {
            const botLoadingResponse = await chatService.createMessage({ token, session_id: sessionId, content: "loading...", isBot: true, isFavorited: false, parentId: id, status: "loading" });
            botMessageToUpdateId = botLoadingResponse.id;
            dispatchMessages({
              type: "ADD_MESSAGE",
              message: {
                id: botMessageToUpdateId!,
                content: "loading...",
                isBot: true,
                timestamp: new Date().toISOString(),
                isFavorited: false,
                parentId: id,
                status: "loading",
              },
            });
          }

          const controller = new AbortController();
          setActiveRequestController(controller);
          const response = await chatService.askChatbot(payload, controller);
          setActiveRequestController(null);
          const botResponseContent = JSON.stringify(response.data, null, 2);

          await chatService.updateMessage(botMessageToUpdateId, { token, content: botResponseContent, timestamp: new Date().toISOString(), status: "normal" });
          dispatchMessages({
            type: "UPDATE_MESSAGE",
            id: botMessageToUpdateId,
            message: {
              content: botResponseContent,
              timestamp: new Date().toISOString(),
              status: "normal",
            },
          });
          setTimeout(() => scrollToMessage(botMessageToUpdateId!, 100));
        } catch (error) {
          setActiveRequestController(null);
          const errorContent = getErrorMessage(error);
          if (
            axios.isCancel(error) ||
            (error as Error).name === "CanceledError"
          )
            return;
          if (botMessageToUpdateId) {
            await chatService.updateMessage(botMessageToUpdateId, { token, content: errorContent, timestamp: new Date().toISOString(), status: "error" }).catch(() => {});
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: botMessageToUpdateId,
              message: { content: errorContent, status: "error" },
            });
          }
        }
      }

      useImperativeHandle(ref, () => ({
        handleNewChat,
        handleAskFavoriteQuestion,
      }));

      const getMessageResponseStatus = (
        userMessageId: string,
      ): "loading" | "success" | "error" | null => {
        const botResponse = messages.find(
          (msg) => msg.isBot && msg.parentId === userMessageId,
        );
        if (botResponse) {
          if (botResponse.status === "loading") return "loading";
          if (botResponse.status === "error") return "error";
          if (botResponse.status === "normal") return "success";
        }
        return null;
      };

      const toggleConnectionDropdown = useCallback(() => {
        if (isDbExplorerOpen) setIsDbExplorerOpen(false);
        setIsConnectionDropdownOpen((prev) => !prev);
      }, [isDbExplorerOpen]);

      const toggleDbExplorer = useCallback(() => {
        setIsDbExplorerOpen((prev) => !prev);
      }, []);

      return (
        <div
          className="flex flex-col h-full relative"
          style={{ 
            backgroundColor: theme.colors.background,
            color: theme.colors.text
          }}
        >
          <ToastContainer
            toastStyle={{
              background: theme.colors.surface,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.default,
            }}
          />
          {sessionConnectionError && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-down max-w-md w-full px-4 pointer-events-none">
              <div 
                className="flex items-start gap-3 p-4 rounded-2xl shadow-xl backdrop-blur-xl border pointer-events-auto"
                style={{
                  background: theme.mode === 'light' ? 'rgba(254, 242, 242, 0.9)' : 'rgba(69, 10, 10, 0.85)',
                  borderColor: theme.mode === 'light' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.3)',
                  color: theme.mode === 'light' ? '#B91C1C' : '#FCA5A5'
                }}
              >
                <div className="flex-shrink-0 p-1.5 rounded-full bg-red-500/15 text-red-500 mt-0.5">
                  <AlertCircle size={18} />
                </div>
                <div className="flex-1 text-sm font-medium leading-snug">
                  {sessionConnectionError}
                </div>
              </div>
            </div>
          )}

          {/* Core scrollable messages region with enhanced contrast padding */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto w-full custom-scrollbar pt-6 pb-36 px-4 md:px-8 flex flex-col"
          >
            {connectionsLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto animate-pulse">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium opacity-70" style={{ color: theme.colors.text }}>Mapping integrated clusters...</p>
              </div>
            ) : connections.length === 0 && !selectedConnection ? (
              <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 border"
                  style={{
                    background: `${theme.colors.accent}08`,
                    borderColor: theme.colors.border,
                  }}
                >
                  <Database size={22} style={{ color: theme.colors.accent }} />
                </div>
                <p
                  className="text-lg font-bold tracking-tight mb-1"
                  style={{ color: theme.colors.text }}
                >
                  No Repositories Hooked
                </p>
                <p
                  className="text-xs font-medium opacity-70 mb-5"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Connect a database schema layer to unlock analytical
                  transformations.
                </p>
                {localStorage.getItem("allowedToCreateConnection") !==
                  "false" && (
                  <button
                    onClick={onCreateConSelected}
                    className="px-4 py-2 text-xs font-bold text-white transition-all hover:scale-102 active:scale-98 shadow-sm"
                    style={{
                      backgroundColor: theme.colors.accent,
                      borderRadius: theme.borderRadius.default,
                    }}
                  >
                    Setup New Matrix
                  </button>
                )}
              </div>
            ) : messages.length === 0 &&
              !connectionError &&
              !sessionConnectionError ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 max-w-2xl mx-auto">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 border animate-pulse"
                  style={{
                    background: `${theme.colors.accent}08`,
                    borderColor: theme.colors.border,
                  }}
                >
                  <Sparkles size={18} style={{ color: theme.colors.accent }} />
                </div>
                <h1
                  className="text-2xl md:text-3xl font-bold tracking-tight mb-3"
                  style={{ color: theme.colors.text }}
                >
                  Automate Your Relational Insights
                </h1>
                <p
                  className="text-sm font-medium mb-8 max-w-lg"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Input analytical queries in natural language to query, plot,
                  and verify structure layouts instantly.
                </p>
                {recommendedQuestions &&
                  recommendedQuestions.length > 0 &&
                  selectedConnection && (
                    <RecommendedQuestions
                      questions={recommendedQuestions}
                      onQuestionClick={(q, c, query) =>
                        handleAskFavoriteQuestion(
                          q,
                          c || selectedConnection,
                          query,
                        )
                      }
                    />
                  )}
              </div>
            ) : (
              <div className="max-w-4xl mx-auto w-full flex flex-col gap-2">
                {orderedMessages.map((message) => {
                  const responseStatus = message.isBot
                    ? null
                    : getMessageResponseStatus(message.id);
                  return (
                    <div
                      className="flex flex-col w-full max-w-full"
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
                        responseStatus={responseStatus}
                        disabled={!sessionConnection && !!sessionId}
                        onRetry={handleRetry}
                        isSubmitting={isSubmitting}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {userHasScrolledUp && (
            <div className="absolute bottom-24 right-6 z-50">
              <CustomTooltip title="Scroll to Bottom" position="top">
                <button
                  onClick={scrollToBottom}
                  className="p-3 rounded-full text-white transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md"
                  style={{
                    background: theme.colors.accent,
                  }}
                >
                  <ArrowDown size={18} />
                </button>
              </CustomTooltip>
            </div>
          )}

          {/* Premium Floating Command Pod */}
          {connections.length > 0 && (
            <footer className="absolute bottom-4 left-0 right-0 z-40 pointer-events-none px-4 flex justify-center">
              <div
                className="w-full max-w-4xl flex items-end gap-2 px-3 py-2 rounded-[24px] pointer-events-auto border transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-2xl"
                style={{
                  backgroundColor: theme.mode === 'light' ? '#FFFFFF' : theme.colors.surfaceGlass,
                  borderColor: theme.mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : theme.colors.border,
                  boxShadow: theme.mode === "light" 
                    ? "0 8px 32px -4px rgba(0, 0, 0, 0.1), 0 0 1px rgba(0, 0, 0, 0.15)" 
                    : "0 24px 48px -12px rgba(0, 0, 0, 0.5)"
                }}
              >
                <div
                  className="relative flex-shrink-0"
                  ref={connectionDropdownRef}
                >
                  <CustomTooltip title="Database Nodes" position="top">
                    <button
                      type="button"
                      onClick={toggleConnectionDropdown}
                      disabled={isSubmitting || (!sessionConnection && !!sessionId)}
                      className="p-2 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      <Database size={19} />
                    </button>
                  </CustomTooltip>

                  {isConnectionDropdownOpen && (
                    <div
                      className="absolute bottom-[calc(100%+0.5rem)] left-0 rounded-xl border z-50 min-w-[220px] overflow-hidden py-1.5 shadow-xl animate-fade-up"
                      style={{
                        background: theme.colors.surface,
                        borderColor: theme.colors.border,
                      }}
                    >
                      {options.map((option) => (
                        <div
                          key={option.value}
                          className="flex items-center justify-between px-3.5 py-2 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors text-xs font-semibold"
                          style={{
                            color: theme.colors.text,
                            background:
                              selectedConnection === option.value
                                ? `${theme.colors.accent}08`
                                : "transparent",
                          }}
                          onClick={() => handleConnectionSelect(option.value)}
                        >
                          <span className="truncate">{option.label}</span>
                          {option.isAdmin && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ml-2 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                              System
                            </span>
                          )}
                          {option.value !== "create-con" && (
                            <button
                              type="button"
                              onClick={(e) => handlePdfClick(option.value, e)}
                              className="p-1 rounded text-red-500 hover:bg-red-500/10 transition-colors ml-auto"
                              title="Data Atlas PDF"
                            >
                              <FaFilePdf size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <CustomTooltip title="Schema Matrix" position="top">
                  <button
                    type="button"
                    onClick={toggleDbExplorer}
                      disabled={
                        isSubmitting ||
                        !selectedConnection ||
                        (!sessionConnection && !!sessionId)
                      }
                    className="p-2 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40"
                    style={{
                      color: isDbExplorerOpen
                        ? theme.colors.accent
                        : theme.colors.textSecondary,
                    }}
                  >
                    <Layers
                      size={19}
                      style={{
                        transform: isDbExplorerOpen ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s",
                      }}
                    />
                  </button>
                </CustomTooltip>

                <CustomTooltip title="Switch to Dashboard" position="top">
                  <button
                    type="button"
                    onClick={() => setCurrentView("dashboard")}
                    disabled={isSubmitting}
                    className="p-2 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    <LayoutDashboard size={19} />
                  </button>
                </CustomTooltip>

                <CustomTooltip title="Reset Analytics Thread" position="top">
                  <button
                    type="button"
                    onClick={handleNewChat}
                    disabled={isSubmitting}
                    className="p-2 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    <PlusCircle size={19} />
                  </button>
                </CustomTooltip>

                <div className="flex-1 min-w-0">
                  <ChatInput
                    input={input}
                    isSubmitting={isSubmitting}
                    onInputChange={setInput}
                    onSubmit={handleSubmit}
                    disabled={!sessionConnection && !!sessionId}
                    onStopRequest={handleStopRequest}
                  />
                </div>
              </div>
            </footer>
          )}

          {isDbExplorerOpen && selectedConnection && (
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl pointer-events-auto">
              <SchemaExplorer
                schemas={schemaSampleData}
                onClose={() => setIsDbExplorerOpen(false)}
                theme={theme}
                onColumnClick={() => console.log("Column clicked")}
                selectedConnection={selectedConnection}
              />
            </div>
          )}

          {connectionError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-down max-w-sm w-full px-4 pointer-events-none">
              <div 
                className="flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg backdrop-blur-md border text-xs font-bold justify-center pointer-events-auto"
                style={{
                  background: theme.mode === 'light' ? 'rgba(254, 242, 242, 0.95)' : 'rgba(69, 10, 10, 0.85)',
                  borderColor: theme.mode === 'light' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.3)',
                  color: theme.mode === 'light' ? '#DC2626' : '#FCA5A5'
                }}
              >
                <AlertCircle size={14} />
                <span className="truncate">Connection Error: {connectionError}</span>
              </div>
            </div>
          )}

          {/* Create Connection Modal */}
          {showCreateConnectionModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-up">
              <div
                className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl custom-scrollbar"
                style={{ backgroundColor: theme.colors.background }}
              >
                <button
                  onClick={() => setShowCreateConnectionModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 z-10 transition-colors"
                  style={{ color: theme.colors.text }}
                >
                  <X size={20} />
                </button>
                <div className="p-6 md:p-8">
                  <ConnectionForm
                    isAdmin={false}
                    token={token}
                    onSuccess={() => {
                      setShowCreateConnectionModal(false);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      );
    },
  ),
);

const areEqual = (
  prevProps: ChatInterfaceProps,
  nextProps: ChatInterfaceProps,
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
