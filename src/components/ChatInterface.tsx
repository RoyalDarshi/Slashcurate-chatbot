import {
  useState,
  useEffect,
  useCallback,
  memo,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { Message, Connection, ChatInterfaceProps } from "../types";
import { API_URL, CHATBOT_API_URL } from "../config";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import Loader from "./Loader";
import { useTheme } from "../ThemeContext";
import { ArrowDown, Database, Layers, PlusCircle } from "lucide-react";
import RecommendedQuestions from "./RecommendedQuestions";
import CustomTooltip from "./CustomTooltip";
import {
  useConnections,
  useSession,
  useRecommendedQuestions,
  useChatScroll,
} from "../hooks";
import SchemaExplorer from "./SchemaExplorer";
import schemaSampleData from "../data/sampleSchemaData";
import html2canvas from "html2canvas";
import SummaryModal from "./SummaryModal";
import { FaFilePdf } from "react-icons/fa";

export type ChatInterfaceHandle = {
  handleNewChat: () => void;
  handleAskFavoriteQuestion: (
    question: string,
    connection: string,
    query?: string
  ) => void;
};

const getErrorMessage = (error: unknown): string => {
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

const ChatInterface = memo(
  forwardRef<ChatInterfaceHandle, ChatInterfaceProps>(
    ({ onCreateConSelected, initialQuestion, onQuestionAsked }, ref) => {
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

      const [input, setInput] = useState("");
      const connectionDropdownRef = useRef<HTMLDivElement>(null);
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [editingMessageId, setEditingMessageId] = useState<string | null>(
        null
      );
      const [sessionConnectionError, setSessionConnectionError] = useState<
        string | null
      >(null);
      const [isConnectionDropdownOpen, setIsConnectionDropdownOpen] =
        useState(false);
      const [isDbExplorerOpen, setIsDbExplorerOpen] = useState(false);
      const [graphSummary, setGraphSummary] = useState<string | null>(null);
      const [showSummaryModal, setShowSummaryModal] = useState(false);

      const options = [
        {
          value: "create-con",
          label: "Create New Connection",
          isAdmin: false,
        },
        ...connections.map((connection: Connection) => ({
          value: connection.connectionName,
          label: connection.connectionName,
          isAdmin: connection.isAdmin,
        })),
      ];

      const summarizeGraph = useCallback(
        async (graphElement: HTMLElement, botMessageId: string) => {
          if (!graphElement) {
            toast.error("No graph element to summarize.");
            return;
          }
          const botMessage = messages.find((m) => m.id === botMessageId);
          if (!botMessage || !botMessage.parentId) {
            toast.error("Cannot find associated question for this graph.");
            return;
          }
          const userMessage = messages.find(
            (m) => m.id === botMessage.parentId
          );
          const question = userMessage
            ? userMessage.content
            : "Unknown question";

          setIsSubmitting(true);
          try {
            const canvas = await html2canvas(graphElement, { scale: 2 });
            const imageData = canvas.toDataURL("image/png");
            const prompt = `Summarize the key insights from this graph image. Consider the current question: "${question}". Main View Data Query: ${botMessage.sql_query}. Focus on trends, anomalies, and overall patterns shown in the visual data.`;
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY; // Replace with your actual API key
            const payload = {
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: prompt },
                    {
                      inlineData: {
                        mimeType: "image/png",
                        data: imageData.split(",")[1],
                      },
                    },
                  ],
                },
              ],
            };
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const result = await response.json();
            let summaryText = "No summary could be generated.";
            if (
              result.candidates &&
              result.candidates.length > 0 &&
              result.candidates[0].content &&
              result.candidates[0].content.parts &&
              result.candidates[0].content.parts.length > 0
            ) {
              summaryText = result.candidates[0].content.parts[0].text;
              setGraphSummary(summaryText);
              setShowSummaryModal(true);
            } else {
              console.error("Unexpected API response:", result);
              toast.error("Failed to get summary from AI.");
            }
          } catch (error) {
            console.error("Error summarizing graph:", error);
            toast.error("Failed to summarize graph.");
          } finally {
            setIsSubmitting(false);
          }
        },
        [messages]
      );

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
          try {
            for (const msg of loadingMessages) {
              const response = await axios.post(
                `${API_URL}/api/getmessages/${msg.id}`,
                { token },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (response.data.content !== "loading...") {
                setIsSubmitting(false);
                dispatchMessages({
                  type: "UPDATE_MESSAGE",
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

      useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (
            connectionDropdownRef.current &&
            !connectionDropdownRef.current.contains(event.target as Node)
          ) {
            setIsConnectionDropdownOpen(false);
          }
        };

        if (isConnectionDropdownOpen) {
          document.addEventListener("mousedown", handleClickOutside);
        } else {
          document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, [isConnectionDropdownOpen]);

      useEffect(() => {
        const handleVisibilityChange = async () => {
          if (document.visibilityState === "visible") {
            const storedSessionId = localStorage.getItem("currentSessionId");
            if (storedSessionId) {
              try {
                await axios.get(`${API_URL}/api/sessions/${storedSessionId}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
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
            handleVisibilityChange
          );
      }, [token, loadSession, clearSession]);

      const handleNewChat = useCallback(() => {
        clearSession();
        setInput("");
        setEditingMessageId(null);
        setSessionConnectionError(null);
        setGraphSummary(null);
        setShowSummaryModal(false);
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
              localStorage.setItem("currentSessionId", currentSessionId || "");
              dispatchMessages({
                type: "SET_SESSION",
                sessionId: currentSessionId || "",
                messages: [],
                connection: connection,
              });
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
            finalUserMessageId = userResponse.data.id;
            dispatchMessages({
              type: "ADD_MESSAGE",
              message: finalUserMessage,
            });

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
              id: botMessageId || "",
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
            setTimeout(() => scrollToMessage(botMessageId!), 100);

            try {
              const connectionObj = connections.find(
                (conn) => conn.connectionName === connection
              );
              if (!connectionObj) {
                throw new Error(
                  `Connection '${connection}' not found during askQuestion.`
                );
              }

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
                id: botMessageId!,
                message: updatedBotMessage,
              });
              setTimeout(() => scrollToMessage(botMessageId!), 100);
            } catch (error) {
              console.error("Error getting bot response:", error);
              const errorContent =
                "Sorry, an error occurred. Please try again.";

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
                setTimeout(
                  () => botMessageId && scrollToMessage(botMessageId),
                  100
                );
              } else {
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
            console.error(
              "Error saving user message or creating bot loading message:",
              error
            );
            toast.error(`Failed to send message: ${getErrorMessage(error)}`);
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

          // if (sessionId && sessionConnection === connection) {
          //   await askQuestion(question, connection, true, query);
          // } else {
          handleNewChat();
          await new Promise<void>((resolve) => setTimeout(resolve, 0));
          setSelectedConnection(connection);
          await askQuestion(question, connection, true, query);
          // }
        },
        [
          // sessionId,
          // sessionConnection,
          connections,
          askQuestion,
          handleNewChat,
          setSelectedConnection,
        ]
      );

      useEffect(() => {
        if (sessionConnection) {
          if (selectedConnection !== sessionConnection)
            setSelectedConnection(sessionConnection);
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

      const handleConnectionSelect = useCallback(
        (connection: string | null) => {
          if (connection === "create-con") {
            onCreateConSelected();
            if (sessionId) handleNewChat();
            setSelectedConnection(null);
            localStorage.removeItem("selectedConnection");
          } else {
            const selectedConnectionObj = connections.find(
              (conn) => conn.connectionName === connection
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
                  selectedConnectionObj.connectionName
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
          onCreateConSelected,
          connections,
          handleNewChat,
          setSelectedConnection,
          sessionId,
          selectedConnection,
        ]
      );

      const handlePdfClick = useCallback(
        async (connection: string, e: React.MouseEvent) => {
          e.stopPropagation();
          try {
            const response = await axios.get(
              `${API_URL}/api/data-atlas/${connection}`,
              {
                headers: { Authorization: `Bearer ${token}` },
                responseType: "blob",
              }
            );
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
        [token]
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
              "Cannot favorite message: Missing token or active connection."
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
                  !getErrorMessage(null).includes(responseMessage.content)
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
            const message = messages.find((msg) => msg.id === messageId);
            await axios.post(
              `${API_URL}/unfavorite`,
              {
                token,
                currentConnection: currentConnectionForAction,
                questionContent: message?.content,
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

          const originalBotMessageId = botMessage.id;

          try {
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
          (msg) => msg.parentId === id && msg.isBot
        );
        if (responseMessage) {
          botMessageToUpdateId = responseMessage.id;
        }

        try {
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
            botMessageToUpdateId = botLoadingResponse.data.id;
            const newBotLoadingMessage: Message = {
              id: botMessageToUpdateId!,
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
            throw new Error(
              "Failed to obtain a bot message ID for update/creation."
            );
          }

          try {
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
            setTimeout(() => scrollToMessage(botMessageToUpdateId!), 100);
          } catch (error) {
            console.error(
              "Error getting bot response for edited message:",
              error
            );
            const errorContent = "Sorry, an error occurred. Please try again.";

            await axios
              .put(
                `${API_URL}/api/messages/${botMessageToUpdateId}`,
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
              id: botMessageToUpdateId,
              message: {
                content: errorContent,
                timestamp: new Date().toISOString(),
              },
            });
            setTimeout(() => scrollToMessage(botMessageToUpdateId!), 100);
          }
        } catch (error) {
          console.error("Error handling edit message (outer scope):", error);
          toast.error(`Failed to process edit: ${getErrorMessage(error)}`);
        }
      }

      useImperativeHandle(ref, () => ({
        handleNewChat,
        handleAskFavoriteQuestion,
      }));

      const getMessageResponseStatus = (
        userMessageId: string
      ): "loading" | "success" | "error" | null => {
        const botResponse = messages.find(
          (msg) => msg.isBot && msg.parentId === userMessageId
        );
        if (botResponse) {
          if (botResponse.content === "loading...") return "loading";
          const potentialErrorMessages = [
            "Sorry, an error occurred. Please try again.",
            "An unknown error occurred. Please try again.",
          ];
          if (
            potentialErrorMessages.includes(botResponse.content) ||
            (botResponse.content &&
              botResponse.content.startsWith("Request failed with status code"))
          ) {
            return "error";
          }
          try {
            JSON.parse(botResponse.content);
            return "success";
          } catch {
            return "error";
          }
        }
        return null;
      };

      const toggleConnectionDropdown = useCallback(() => {
        if (isDbExplorerOpen) {
          setIsDbExplorerOpen(false);
        }
        setIsConnectionDropdownOpen((prev) => !prev);
      }, [isDbExplorerOpen]);

      const toggleDbExplorer = useCallback(() => {
        setIsDbExplorerOpen((prev) => !prev);
      }, []);

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
              className="flex items-center justify-between sticky top-0 z-20 mx-auto max-w-3xl animate-fade-in"
              style={{
                background: theme.colors.surface,
                color: theme.colors.error,
                borderLeft: `4px solid ${theme.colors.error}`,
                borderRadius: theme.borderRadius.default,
                boxShadow: theme.shadow.md,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                // marginBottom: theme.spacing.md,
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
                  {/* <div className="text-sm opacity-75">
                    You can view the chat history but cannot ask new questions
                    with this session. Start a new chat or select a valid
                    connection.
                  </div> */}
                </div>
              </div>
            </div>
          )}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto"
            style={{
              padding: theme.spacing.lg,
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
                        responseStatus={responseStatus}
                        disabled={!!sessionConnectionError}
                        onRetry={handleRetry}
                        onSummarizeGraph={summarizeGraph}
                        isSubmitting={isSubmitting}
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
              paddingBottom: theme.spacing.sm,
            }}
          >
            {userHasScrolledUp && (
              <div
                className="flex justify-end"
                style={{
                  position: "absolute",
                  bottom: "80px",
                  right: "30px",
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
            <div className="max-w-4xl mx-auto flex items-center gap-2">
              <div className="relative" ref={connectionDropdownRef}>
                <CustomTooltip
                  title="Change or create a connection"
                  position="top"
                >
                  <button
                    type="button"
                    onClick={toggleConnectionDropdown}
                    disabled={isSubmitting || !!sessionConnectionError}
                    className="p-2.5 shadow-lg rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50"
                    style={{
                      background: theme.colors.surface,
                      color: theme.colors.accent,
                    }}
                  >
                    <Database size={20} />
                  </button>
                </CustomTooltip>
                {isConnectionDropdownOpen && (
                  <div
                    className="absolute bottom-full left-0 rounded-md shadow-lg z-30 transition-all duration-300 mb-2"
                    style={{
                      background: theme.colors.surface,
                      border: `1px solid ${theme.colors.border}`,
                      boxShadow: `0 4px 12px ${theme.colors.text}20`,
                      width: "min-content",
                      maxWidth: "min-content",
                    }}
                  >
                    {options.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center justify-between px-3 py-2 hover:bg-opacity-10 hover:bg-accent cursor-pointer transition-all duration-300"
                        style={{
                          color: theme.colors.text,
                          background:
                            selectedConnection === option.value
                              ? `${theme.colors.accent}10`
                              : "transparent",
                        }}
                        onClick={() => handleConnectionSelect(option.value)}
                      >
                        <span
                          className="truncate"
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {option.label}
                        </span>
                        {option.isAdmin && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              backgroundColor: theme.colors.background,
                              color: theme.colors.accent,
                              fontSize: theme.typography.size.sm,
                              fontWeight: theme.typography.weight.normal,
                              padding: `0 ${theme.spacing.sm}`,
                              borderRadius: theme.borderRadius.default,
                              marginLeft: theme.spacing.sm,
                              textTransform: "lowercase",
                            }}
                          >
                            Default
                          </span>
                        )}
                        {option.value !== "create-con" && (
                          <div className="relative group">
                            <button
                              type="button"
                              onClick={(e) => handlePdfClick(option.value, e)}
                              className="p-1"
                            >
                              <FaFilePdf
                                size={16}
                                style={{ color: theme.colors.error }}
                                className="hover:scale-105 transition-transform duration-300"
                              />
                            </button>
                            <span
                              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mt-1 text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap"
                              style={{
                                background: theme.colors.accent,
                                color: theme.colors.surface,
                                boxShadow: `0 0 6px ${theme.colors.accent}40`,
                              }}
                            >
                              View Data Atlas
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <CustomTooltip title="Explore Database Schema" position="top">
                <button
                  type="button"
                  onClick={toggleDbExplorer}
                  disabled={
                    isSubmitting ||
                    !selectedConnection ||
                    !!sessionConnectionError
                  }
                  className={`p-2.5 shadow-lg rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 ${
                    isDbExplorerOpen ? "schema-active" : ""
                  }`}
                  style={{
                    background: theme.colors.surface,
                    color: theme.colors.accent,
                  }}
                >
                  <Layers
                    size={20}
                    style={{
                      transform: isDbExplorerOpen
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.3s ease",
                    }}
                  />
                </button>
              </CustomTooltip>
              <CustomTooltip title="Create a new session" position="top">
                <button
                  type="button"
                  onClick={handleNewChat}
                  disabled={isSubmitting}
                  className="p-2.5 shadow-lg rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50"
                  style={{
                    background: theme.colors.surface,
                    color: theme.colors.accent,
                  }}
                >
                  <PlusCircle size={20} />
                </button>
              </CustomTooltip>
              <ChatInput
                input={input}
                isSubmitting={isSubmitting}
                onInputChange={setInput}
                onSubmit={handleSubmit}
                disabled={!!sessionConnectionError}
              />
            </div>
          </div>
          {isDbExplorerOpen && selectedConnection && (
            <div className="w-3/4 backdrop-blur-lg self-center absolute bottom-16 z-50 flex items-center justify-center">
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
            <div
              className="text-center"
              style={{ padding: theme.spacing.md, color: theme.colors.error }}
            >
              {connectionError}
            </div>
          )}
          {showSummaryModal && graphSummary && (
            <SummaryModal
              summaryText={graphSummary}
              onClose={() => setShowSummaryModal(false)}
              theme={theme}
            />
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