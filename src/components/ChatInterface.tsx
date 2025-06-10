import React, {
  useState,
  useEffect,
  useCallback,
  memo,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
// Note: Typically, you'd import 'react-toastify/dist/ReactToastify.css' here for styles

// Importing external components, hooks, and types
// Adjusted import paths assuming a flat directory structure where all files are siblings
// or in direct sibling subdirectories (e.g., ./data/sampleSchemaData)
import { Message, Connection, ChatInterfaceProps } from "../types";
import { API_URL, CHATBOT_API_URL } from "../config";
import ChatInput from "./ChatInput";
import Loader from "./Loader";
import { useTheme } from "../ThemeContext";
import RecommendedQuestions from "./RecommendedQuestions";
import CustomTooltip from "./CustomTooltip";
import { useConnections, useSession, useRecommendedQuestions } from "../hooks";
import DashboardView from "./DashboardView";
import SchemaExplorer from "./SchemaExplorer";
import DashboardSkeletonLoader from "./DashboardSkeletonLoader"; // Import the new skeleton loader
import schemaSampleData from "../data/sampleSchemaData";

import {
  ListChecks,
  HelpCircle,
  Database,
  Layers,
  PlusCircle,
  ChevronDown,
  X,
} from "lucide-react";

export type ChatInterfaceHandle = {
  handleNewChat: () => void;
  handleAskFavoriteQuestion: (
    question: string,
    connection: string,
    query?: string
  ) => void;
};

// Define the expected structure for KPI and Main View Data
interface KpiData {
  kpi1: { label: string; value: string | number | null; change: number };
  kpi2: { label: string; value: string | number | null; change: number };
  kpi3: { label: string; value: string | number | null; change: number };
}

interface MainViewData {
  chartData: any[];
  tableData: any[];
  queryData: string;
}

// Data Generation Helpers
const generateId = () => Math.random().toString(36).substr(2, 9);

// Initial empty KPI data structure
const initialEmptyKpiData: KpiData = {
  kpi1: { value: null, label: "No Data", change: 0 },
  kpi2: { value: null, label: "No Data", change: 0 },
  kpi3: { value: null, label: "No Data", change: 0 },
};

// Initial empty Main View Data structure
const initialEmptyMainViewData: MainViewData = {
  chartData: [],
  tableData: [],
  queryData: "No query available.",
};

// Placeholder for loading/error states in the dashboard
const getDashboardLoadingState = () => ({
  kpiData: {
    kpi1: { value: null, label: "Loading...", change: 0 },
    kpi2: { value: null, label: "Loading...", change: 0 },
    kpi3: { value: null, label: "Loading...", change: 0 },
  },
  mainViewData: { chartData: [], tableData: [], queryData: "Loading query..." },
  textualSummary: "Processing your request...",
});

const getDashboardErrorState = () => ({
  kpiData: {
    kpi1: { value: null, label: "Error", change: 0 },
    kpi2: { value: null, label: "Error", change: 0 },
    kpi3: { value: null, label: "Error", change: 0 },
  },
  mainViewData: {
    chartData: [],
    tableData: [],
    queryData: "Error loading query.",
  },
  textualSummary: "Error: Could not generate analysis.",
});

// Helper function to extract error messages
const getErrorMessage = (error: any): string => {
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

// Main ChatInterface Component
const ChatInterface = memo(
  forwardRef<ChatInterfaceHandle, ChatInterfaceProps>(
    ({ onCreateConSelected, initialQuestion, onQuestionAsked }, ref) => {
      const { theme } = useTheme();
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

      const [input, setInput] = useState("");
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [isDbExplorerOpen, setIsDbExplorerOpen] = useState(false);
      const [isConnectionDropdownOpen, setIsConnectionDropdownOpen] =
        useState(false);

      // Memoized initial dashboard state to prevent infinite loop
      const initialDashboardState = useMemo(
        () => ({
          id: generateId(),
          question: "Welcome to your interactive analytics dashboard!",
          kpiData: initialEmptyKpiData,
          mainViewData: initialEmptyMainViewData,
          textualSummary: "Ask a question to get started.",
          lastViewType: "table" as "graph" | "table" | "query",
        }),
        []
      );

      const [dashboardHistory, setDashboardHistory] = useState([
        initialDashboardState,
      ]);
      const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
      const [currentMainViewType, setCurrentMainViewType] = useState<
        "graph" | "table" | "query"
      >("table");
      const [showPrevQuestionsModal, setShowPrevQuestionsModal] =
        useState(false);

      const currentDashboardView = dashboardHistory[currentHistoryIndex];

      useEffect(() => {
        if (
          currentDashboardView?.textualSummary === "Processing your request..."
        ) {
          setIsSubmitting(true);
        } else if (
          isSubmitting &&
          currentDashboardView?.textualSummary !==
            "Processing your request..." &&
          currentDashboardView?.textualSummary !==
            "Error: Could not generate analysis."
        ) {
          setIsSubmitting(false);
        }
      }, [currentDashboardView, isSubmitting]);

      useEffect(() => {
        const handleSessionLoad = async () => {
          const storedSessionId = localStorage.getItem("currentSessionId");
          if (storedSessionId && connections.length > 0) {
            try {
              const response = await axios.get(
                `${API_URL}/api/sessions/${storedSessionId}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              const sessionData = response.data;
              await loadSession(storedSessionId);

              const lastUserMessage = sessionData.messages
                .filter((msg: Message) => !msg.isBot)
                .sort(
                  (a: Message, b: Message) =>
                    new Date(b.timestamp).getTime() -
                    new Date(a.timestamp).getTime()
                )[0];

              if (lastUserMessage) {
                const lastBotMessage = sessionData.messages
                  .filter(
                    (msg: Message) =>
                      msg.isBot && msg.parentId === lastUserMessage.id
                  )
                  .sort(
                    (a: Message, b: Message) =>
                      new Date(b.timestamp).getTime() -
                      new Date(a.timestamp).getTime()
                  )[0];

                if (lastBotMessage && lastBotMessage.content !== "loading...") {
                  try {
                    const botResponseContent = JSON.parse(
                      lastBotMessage.content
                    );
                    const actualKpiData =
                      botResponseContent.kpiData || initialEmptyKpiData;
                    const actualMainViewData = {
                      chartData: Array.isArray(botResponseContent.answer)
                        ? botResponseContent.answer
                        : [],
                      tableData: Array.isArray(botResponseContent.answer)
                        ? botResponseContent.answer
                        : [],
                      queryData:
                        typeof botResponseContent.sql_query === "string"
                          ? botResponseContent.sql_query
                          : "No query available.",
                    };
                    const actualTextualSummary =
                      botResponseContent.textualSummary ||
                      `Here is the analysis for: "${lastUserMessage.content}"`;

                    const newEntry = {
                      id: generateId(),
                      question: lastUserMessage.content,
                      kpiData: actualKpiData,
                      mainViewData: actualMainViewData,
                      textualSummary: actualTextualSummary,
                      lastViewType: "table" as "graph" | "table" | "query",
                    };
                    setDashboardHistory([newEntry]);
                    setCurrentHistoryIndex(0);
                    setCurrentMainViewType("table");
                    setInput(lastUserMessage.content);
                  } catch (parseError) {
                    console.error(
                      "Failed to parse bot response content from session:",
                      parseError
                    );
                    setDashboardHistory([initialDashboardState]);
                    setCurrentHistoryIndex(0);
                    setCurrentMainViewType("table");
                  }
                } else {
                  setDashboardHistory([initialDashboardState]);
                  setCurrentHistoryIndex(0);
                  setCurrentMainViewType("table");
                  setInput(lastUserMessage.content);
                }
              } else {
                setDashboardHistory([initialDashboardState]);
                setCurrentHistoryIndex(0);
                setCurrentMainViewType("table");
              }
            } catch (error) {
              console.error("Session validation failed or no data:", error);
              localStorage.removeItem("currentSessionId");
              clearSession();
              setDashboardHistory([initialDashboardState]);
              setCurrentHistoryIndex(0);
              setCurrentMainViewType("table");
            }
          } else if (!storedSessionId) {
            clearSession();
            setDashboardHistory([initialDashboardState]);
            setCurrentHistoryIndex(0);
            setCurrentMainViewType("table");
          }
        };

        handleSessionLoad();
        document.addEventListener("visibilitychange", handleSessionLoad);
        return () =>
          document.removeEventListener("visibilitychange", handleSessionLoad);
      }, [
        token,
        loadSession,
        clearSession,
        initialDashboardState,
        connections,
      ]);

      const handleNewChat = useCallback(() => {
        clearSession();
        setInput("");
        setDashboardHistory([initialDashboardState]);
        setCurrentHistoryIndex(0);
        setCurrentMainViewType("table");
      }, [clearSession, initialDashboardState]);

      const startNewSession = useCallback(
        async (connectionName: string, question: string) => {
          try {
            const response = await axios.post(
              `${API_URL}/api/sessions`,
              {
                token,
                currentConnection: connectionName,
                title: question.substring(0, 50) + "...",
              },
              { headers: { "Content-Type": "application/json" } }
            );
            const newSessionId = response.data.id;
            localStorage.setItem("currentSessionId", newSessionId);
            return newSessionId;
          } catch (error) {
            console.error("Error creating new session:", error);
            toast.error(
              `Failed to start new session: ${getErrorMessage(error)}`
            );
            return null;
          }
        },
        [token]
      );

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

          const newLoadingEntryId = generateId();
          const newLoadingEntry = {
            id: newLoadingEntryId,
            question: question,
            ...getDashboardLoadingState(),
            lastViewType: "table" as "graph" | "table" | "query",
          };

          setDashboardHistory((prev) => {
            const newHistory =
              currentHistoryIndex === prev.length - 1
                ? [...prev, newLoadingEntry]
                : [...prev.slice(0, currentHistoryIndex + 1), newLoadingEntry];
            return newHistory;
          });

          setCurrentHistoryIndex((prevIndex) => prevIndex + 1);

          let currentSessionId = sessionId;

          if (currentSessionId && !sessionConnection) {
            const currentSessionInfo = connections.find(
              (c) => c.connectionName === selectedConnection
            );
            if (!currentSessionInfo && messages.length > 0) {
              toast.error(
                "This session does not have a valid connection. Cannot ask new questions."
              );
              setDashboardHistory((prev) =>
                prev.map((item) =>
                  item.id === newLoadingEntryId
                    ? {
                        ...item,
                        ...getDashboardErrorState(),
                        textualSummary:
                          "Error: No valid session connection found.",
                      }
                    : item
                )
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
              const newSessId = await startNewSession(connection, question);
              if (newSessId) {
                currentSessionId = newSessId;
                dispatchMessages({
                  type: "SET_SESSION",
                  sessionId: currentSessionId,
                  messages: [],
                  connection: connection,
                });
              } else {
                setDashboardHistory((prev) =>
                  prev.map((item) =>
                    item.id === newLoadingEntryId
                      ? {
                          ...item,
                          ...getDashboardErrorState(),
                          textualSummary: "Error: Could not create session.",
                        }
                      : item
                  )
                );
                return;
              }
            } catch (error) {
              console.error("Error creating session:", error);
              setDashboardHistory((prev) =>
                prev.map((item) =>
                  item.id === newLoadingEntryId
                    ? {
                        ...item,
                        ...getDashboardErrorState(),
                        textualSummary: "Error: Could not create session.",
                      }
                    : item
                )
              );
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
            finalUserMessageId = finalUserMessage.id;
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

              const botResponseData = response.data;

              const actualKpiData =
                botResponseData.kpiData || initialEmptyKpiData;

              const actualMainViewData = {
                chartData: Array.isArray(botResponseData.answer)
                  ? botResponseData.answer
                  : [],
                tableData: Array.isArray(botResponseData.answer)
                  ? botResponseData.answer
                  : [],
                queryData:
                  typeof botResponseData.sql_query === "string"
                    ? botResponseData.sql_query
                    : "No query available.",
              };

              const actualTextualSummary =
                botResponseData.textualSummary ||
                `Here is the analysis for: "${question}"`;

              setDashboardHistory((prev) =>
                prev.map((item) =>
                  item.id === newLoadingEntryId
                    ? {
                        ...item,
                        kpiData: actualKpiData,
                        mainViewData: actualMainViewData,
                        textualSummary: actualTextualSummary,
                      }
                    : item
                )
              );

              const botResponseContent = JSON.stringify(
                botResponseData,
                null,
                2
              );

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
            } catch (error) {
              console.error("Error getting bot response:", error);
              const errorContent =
                "Sorry, an error occurred. Please try again.";

              setDashboardHistory((prev) =>
                prev.map((item) =>
                  item.id === newLoadingEntryId
                    ? {
                        ...item,
                        ...getDashboardErrorState(),
                        textualSummary: "Error: Could not generate analysis.",
                      }
                    : item
                )
              );

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
              } else {
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
              }
            }
          } catch (error) {
            console.error(
              "Error saving user message or creating bot loading message:",
              error
            );
            toast.error(`Failed to send message: ${getErrorMessage(error)}`);

            setDashboardHistory((prev) =>
              prev.filter((item) => item.id !== newLoadingEntryId)
            );
            setCurrentHistoryIndex((prevIndex) => Math.max(0, prevIndex - 1));
          }
        },
        [
          sessionId,
          sessionConnection,
          connections,
          token,
          dispatchMessages,
          loadSession,
          selectedConnection,
          currentHistoryIndex,
          startNewSession,
        ]
      );

      const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
          e.preventDefault();
          if (!input.trim() || isSubmitting) return;
          if (!selectedConnection) {
            toast.error("No connection selected.");
            return;
          }

          const questionToAsk = input;
          setInput("");
          await askQuestion(questionToAsk, selectedConnection, false);
        },
        [input, isSubmitting, selectedConnection, askQuestion]
      );

      const handleAskFavoriteQuestion = useCallback(
        async (question: string, connectionName: string, query?: string) => {
          const connectionObj = connections.find(
            (conn) => conn.connectionName === connectionName
          );
          if (!connectionObj) {
            toast.error(
              "The connection for this favorite question no longer exists."
            );
            return;
          }
          handleNewChat();
          await new Promise<void>((resolve) => setTimeout(resolve, 0));
          setSelectedConnection(connectionName);
          setInput(question);
          await askQuestion(question, connectionName, false, query);
        },
        [connections, handleNewChat, setSelectedConnection, askQuestion]
      );

      useEffect(() => {
        if (sessionConnection) {
          if (selectedConnection !== sessionConnection)
            setSelectedConnection(sessionConnection);
        }
      }, [sessionConnection, setSelectedConnection, selectedConnection]);

      useEffect(() => {
        if (initialQuestion && !connectionsLoading && connections.length > 0) {
          let targetConnection = initialQuestion.connection;
          if (!connections.some((c) => c.connectionName === targetConnection)) {
            targetConnection = connections[0]?.connectionName;
            if (!targetConnection) {
              toast.error(
                "No connections available to ask the initial question."
              );
              if (onQuestionAsked) onQuestionAsked();
              return;
            }
          }
          setSelectedConnection(targetConnection);
          askQuestion(
            initialQuestion.text,
            targetConnection,
            false,
            initialQuestion.query
          );
          if (onQuestionAsked) onQuestionAsked();
        }
      }, [
        initialQuestion,
        connections,
        connectionsLoading,
        askQuestion,
        onQuestionAsked,
        setSelectedConnection,
      ]);

      useEffect(() => {
        if (
          dashboardHistory.length > 0 &&
          currentHistoryIndex >= dashboardHistory.length
        ) {
          setCurrentHistoryIndex(dashboardHistory.length - 1);
        } else if (dashboardHistory.length === 0 && currentHistoryIndex !== 0) {
          setCurrentHistoryIndex(0);
          setDashboardHistory([initialDashboardState]);
        }
      }, [dashboardHistory, currentHistoryIndex, initialDashboardState]);

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
            if (selectedConnection) {
              handleNewChat();
            }
            setSelectedConnection(null);
            localStorage.removeItem("selectedConnection");
          }
          setIsConnectionDropdownOpen(false);
        },
        [
          onCreateConSelected,
          handleNewChat,
          setSelectedConnection,
          sessionId,
          selectedConnection,
        ]
      );

      const handlePdfClick = useCallback(
        (connectionName: string, e: React.MouseEvent) => {
          e.stopPropagation();
          toast.info(
            `Generating Data Atlas for ${connectionName}... (Mock Action)`
          );
        },
        []
      );

      const PdfIcon = (props: React.SVGProps<SVGSVGElement>) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          {...props}
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 0l6 6v2H14zM16 13c0 .55-.45 1-1 1h-2v2c0 .55-.45 1-1 1H9c-.55 0-1-.45-1-1v-2H6c-.55 0-1-.45-1-1V9c0-.55.45-1 1-1h2V6c0-.55.45-1 1-1h2c.55 0 1 .45 1 1v2h2c.55 0 1 .45 1 1v4z" />
        </svg>
      );

      const handleSelectPrevQuestion = useCallback(
        async (questionContent: string) => {
          if (!selectedConnection) {
            toast.error(
              "No connection selected. Please select a connection first."
            );
            return;
          }

          setInput(questionContent);
          setShowPrevQuestionsModal(false);

          // Find the user message in the session messages
          const selectedUserMessage = messages.find(
            (msg) => !msg.isBot && msg.content === questionContent
          );

          if (selectedUserMessage) {
            // Find the corresponding bot message
            const correspondingBotMessage = messages.find(
              (msg) => msg.isBot && msg.parentId === selectedUserMessage.id
            );

            if (
              correspondingBotMessage &&
              correspondingBotMessage.content !== "loading..."
            ) {
              try {
                // Parse the bot's JSON content
                const botResponseContent = JSON.parse(
                  correspondingBotMessage.content
                );

                const actualKpiData =
                  botResponseContent.kpiData || initialEmptyKpiData;
                const actualMainViewData = {
                  chartData: Array.isArray(botResponseContent.answer)
                    ? botResponseContent.answer
                    : [],
                  tableData: Array.isArray(botResponseContent.answer)
                    ? botResponseContent.answer
                    : [],
                  queryData:
                    typeof botResponseContent.sql_query === "string"
                      ? botResponseContent.sql_query
                      : "No query available.",
                };
                const actualTextualSummary =
                  botResponseContent.textualSummary ||
                  `Here is the analysis for: "${questionContent}"`;

                const newEntry = {
                  id: generateId(), // Generate a new ID for this history entry
                  question: questionContent,
                  kpiData: actualKpiData,
                  mainViewData: actualMainViewData,
                  textualSummary: actualTextualSummary,
                  lastViewType: "table" as "graph" | "table" | "query", // Default to table view
                };

                // Add the new entry to dashboard history and set it as current
                setDashboardHistory((prev) => {
                  const newHistory =
                    currentHistoryIndex === prev.length - 1
                      ? [...prev, newEntry]
                      : [...prev.slice(0, currentHistoryIndex + 1), newEntry];
                  return newHistory;
                });
                setCurrentHistoryIndex((prevIndex) => prevIndex + 1); // Move to the newly added entry
              } catch (parseError) {
                console.error(
                  "Failed to parse bot response content for previous question:",
                  parseError
                );
                // Fallback: If parsing fails, re-ask the question.
                await askQuestion(questionContent, selectedConnection, false);
              }
            } else {
              // Fallback: If no corresponding bot message or it's still loading, re-ask the question.
              await askQuestion(questionContent, selectedConnection, false);
            }
          } else {
            // Fallback: If the user message is not found in session messages, re-ask.
            await askQuestion(questionContent, selectedConnection, false);
          }
        },
        [selectedConnection, messages, askQuestion, currentHistoryIndex]
      );

      const navigateDashboardHistory = useCallback(
        (direction: "prev" | "next") => {
          let newIndex = currentHistoryIndex;
          if (direction === "prev" && currentHistoryIndex > 0) {
            newIndex = currentHistoryIndex - 1;
          } else if (
            direction === "next" &&
            currentHistoryIndex < dashboardHistory.length - 1
          ) {
            newIndex = currentHistoryIndex + 1;
          }
          setCurrentHistoryIndex(newIndex);
          setCurrentMainViewType("table");
        },
        [currentHistoryIndex, dashboardHistory]
      );

      const handleViewTypeChange = useCallback(
        (viewType: "graph" | "table" | "query") => {
          setCurrentMainViewType(viewType);
          if (currentDashboardView) {
            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.id === currentDashboardView.id
                  ? { ...item, lastViewType: viewType }
                  : item
              )
            );
          }
        },
        [currentDashboardView]
      );

      useImperativeHandle(ref, () => ({
        handleNewChat,
        handleAskFavoriteQuestion,
      }));

      const userQuestionsFromSession = messages
        .filter((msg) => !msg.isBot)
        .reverse();

      // Determine if the dashboard view should be shown (i.e., an active session or some history exists)
      const showDashboardContent =
        sessionId ||
        messages.length > 0 ||
        currentDashboardView.question !== initialDashboardState.question;

      return (
        <div
          className={`flex flex-col h-screen transition-colors duration-300 overflow-hidden`}
          style={{
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
          }}
        >
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme={theme.mode}
            toastStyle={{
              background: theme.colors.surface,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.text}20`,
              borderRadius: theme.borderRadius.default,
              padding: theme.spacing.sm,
            }}
          />

          <main className="flex-grow flex flex-col items-center overflow-y-auto">
            <div className="w-full flex-grow flex flex-col">
              {connectionsLoading ? (
                <div className="flex justify-center items-center flex-grow">
                  <Loader text="Loading connections..." />
                </div>
              ) : connections.length === 0 && !connectionsLoading ? (
                // Scenario: No data connections at all
                <div className="flex flex-col items-center justify-center flex-grow text-center">
                  <h1
                    className={`text-2xl font-semibold mb-4 ${
                      theme.mode === "dark"
                        ? "text-slate-300"
                        : "text-slate-700"
                    }`}
                  >
                    No Data Connections
                  </h1>
                  <p
                    className={`${
                      theme.mode === "dark"
                        ? "text-slate-400"
                        : "text-slate-600"
                    } mb-6`}
                  >
                    Please create a data connection to start analyzing your
                    data.
                  </p>
                  <button
                    onClick={onCreateConSelected}
                    className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                  >
                    Create Connection
                  </button>
                </div>
              ) : showDashboardContent ? (
                // Scenario: An active session exists or questions have been asked
                isSubmitting &&
                currentDashboardView.textualSummary ===
                  "Processing your request..." ? (
                  <DashboardSkeletonLoader question={currentDashboardView.question} theme={theme} />
                ) : (
                  <DashboardView
                    dashboardItem={currentDashboardView}
                    theme={theme}
                    isSubmitting={isSubmitting}
                    activeViewType={currentMainViewType}
                    onViewTypeChange={handleViewTypeChange}
                    onNavigateHistory={navigateDashboardHistory}
                    historyIndex={currentHistoryIndex}
                    historyLength={dashboardHistory.length}
                  />
                )
              ) : (
                // Scenario: Initial state, no active session/questions, but connections are available
                <div className="flex flex-col items-center justify-start flex-grow text-center px-4 pt-12">
                  <h1
                    className={`text-3xl font-bold mb-4 ${
                      theme.mode === "dark"
                        ? "text-slate-200"
                        : "text-slate-800"
                    }`}
                    style={{ marginTop: "10vh" }}
                  >
                    Hello there! How can I help you today?
                  </h1>
                  <p
                    className={`${
                      theme.mode === "dark"
                        ? "text-slate-400"
                        : "text-slate-600"
                    } mb-8 text-lg`}
                  >
                    Start by selecting a connection or exploring recommended
                    questions.
                  </p>
                  {!selectedConnection && connections.length > 0 && (
                    <div className="flex flex-col items-center mb-6">
                      <p
                        className={`${
                          theme.mode === "dark"
                            ? "text-slate-400"
                            : "text-slate-600"
                        } mb-4`}
                      >
                        You need to select a data connection first:
                      </p>
                      {/* You could optionally add a connection selection UI here or rely on the footer dropdown */}
                    </div>
                  )}
                  {selectedConnection && recommendedQuestions.length > 0 && (
                    <RecommendedQuestions
                      questions={recommendedQuestions}
                      onQuestionClick={handleAskFavoriteQuestion}
                    />
                  )}
                </div>
              )}
            </div>
          </main>

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

          <footer
            className={`shadow-top flex justify-center pb-2`}
            style={{
              background: theme.colors.background,
            }}
          >
            <div className="w-full max-w-4xl flex items-center gap-2 px-2">
              <div className="relative">
                <CustomTooltip
                  title="Change or create a connection"
                  position="top"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsConnectionDropdownOpen((prev) => !prev);
                      setIsDbExplorerOpen(false);
                    }}
                    disabled={isSubmitting}
                    className={`p-2.5 shadow-lg rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50`}
                    style={{
                      background: theme.colors.surface,
                      color: theme.colors.accent,
                    }}
                    aria-label="Select Connection"
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
                    {connections.length === 0 ? (
                      <div
                        className="flex items-center justify-between px-3 py-2 hover:bg-opacity-10 hover:bg-accent cursor-pointer transition-all duration-300"
                        style={{ color: theme.colors.text }}
                        onClick={() => handleSelect({ value: "create-con" })}
                      >
                        <span className="truncate">Create Connection</span>
                      </div>
                    ) : (
                      <>
                        <div
                          className="flex items-center justify-between px-3 py-2 hover:bg-opacity-10 hover:bg-accent cursor-pointer transition-all duration-300"
                          style={{ color: theme.colors.text }}
                          onClick={() => handleSelect({ value: "create-con" })}
                        >
                          <span className="truncate">Create Connection</span>
                        </div>
                        {connections.map((connection: Connection) => (
                          <div
                            key={connection.connectionName}
                            className="flex items-center justify-between px-3 py-2 hover:bg-opacity-10 hover:bg-accent cursor-pointer transition-all duration-300"
                            style={{
                              color: theme.colors.text,
                              background:
                                selectedConnection === connection.connectionName
                                  ? `${theme.colors.accent}10`
                                  : "transparent",
                            }}
                            onClick={() => handleSelect({ value: connection })}
                          >
                            <span
                              className="truncate"
                              style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {connection.connectionName}
                            </span>
                            {connection.isAdmin && (
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
                            <div className="relative group">
                              <button
                                type="button"
                                onClick={(e) =>
                                  handlePdfClick(connection.connectionName, e)
                                }
                                className="p-1"
                                aria-label="View Data Atlas"
                              >
                                <PdfIcon
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
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
              <CustomTooltip title="Explore Database Schema" position="top">
                <button
                  type="button"
                  onClick={() => {
                    setIsDbExplorerOpen((prev) => !prev);
                    setIsConnectionDropdownOpen(false);
                  }}
                  disabled={isSubmitting || !selectedConnection}
                  className={`p-2.5 shadow-lg rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 ${
                    isDbExplorerOpen ? "schema-active" : ""
                  }`}
                  style={{
                    background: theme.colors.surface,
                    color: theme.colors.accent,
                  }}
                  aria-label="Explore Database Schema"
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
                  className={`p-2.5 shadow-lg rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50`}
                  style={{
                    background: theme.colors.surface,
                    color: theme.colors.accent,
                  }}
                  aria-label="New Chat"
                >
                  <PlusCircle size={20} />
                </button>
              </CustomTooltip>
              <ChatInput
                input={input}
                isSubmitting={isSubmitting}
                onInputChange={setInput}
                onSubmit={handleSubmit}
                connections={connections}
                selectedConnection={selectedConnection}
                onSelect={handleSelect}
                onNewChat={handleNewChat}
                disabled={
                  isSubmitting ||
                  (!selectedConnection && connections.length > 0)
                }
              />
              <CustomTooltip title="View Previous Questions" position="top">
                <button
                  onClick={() => setShowPrevQuestionsModal(true)}
                  disabled={
                    isSubmitting || userQuestionsFromSession.length === 0
                  }
                  className={`p-2.5 shadow-lg rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50`}
                  style={{
                    background: theme.colors.surface,
                    color: theme.colors.accent,
                  }}
                >
                  <ListChecks size={20} />
                </button>
              </CustomTooltip>
            </div>
          </footer>

          {showPrevQuestionsModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div
                className={`rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col ${
                  theme.mode === "dark" ? "bg-slate-800" : "bg-white"
                }`}
              >
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700 border-slate-200">
                  <h3
                    className={`text-lg font-semibold ${
                      theme.mode === "dark"
                        ? "text-slate-100"
                        : "text-slate-800"
                    }`}
                  >
                    Previous Questions
                  </h3>
                  <button
                    onClick={() => setShowPrevQuestionsModal(false)}
                    className={`p-1 rounded-md ${
                      theme.mode === "dark"
                        ? "text-slate-400 hover:bg-slate-700"
                        : "text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="overflow-y-auto p-4 space-y-2">
                  {userQuestionsFromSession.length > 0 ? (
                    userQuestionsFromSession.map((msg) => (
                      <button
                        key={msg.id}
                        onClick={() => handleSelectPrevQuestion(msg.content)}
                        className={`w-full text-left p-2.5 rounded-md transition-colors text-sm ${
                          theme.mode === "dark"
                            ? "bg-slate-700 hover:bg-slate-600 text-slate-200"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {msg.content}
                      </button>
                    ))
                  ) : (
                    <p
                      className={`${
                        theme.mode === "dark"
                          ? "text-slate-400"
                          : "text-slate-600"
                      }`}
                    >
                      No previous questions in this session.
                    </p>
                  )}
                </div>
                <div className="p-3 border-t dark:border-slate-700 border-slate-200 text-right">
                  <button
                    onClick={() => setShowPrevQuestionsModal(false)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      theme.mode === "dark"
                        ? "bg-slate-600 hover:bg-slate-500 text-slate-200"
                        : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                    }`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {connectionError && (
            <div
              className={`text-center p-2 text-sm ${
                theme.mode === "dark"
                  ? "text-red-400 bg-red-900/[0.3]"
                  : "text-red-600 bg-red-100/[0.5]"
              }`}
            >
              Connection Error: {connectionError}
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
    prevProps.initialQuestion?.text === nextProps.initialQuestion?.text &&
    prevProps.initialQuestion?.connection ===
      nextProps.initialQuestion?.connection &&
    prevProps.initialQuestion?.query === nextProps.initialQuestion?.query &&
    prevProps.onQuestionAsked === nextProps.onQuestionAsked
  );
};

export default memo(ChatInterface, areEqual);
