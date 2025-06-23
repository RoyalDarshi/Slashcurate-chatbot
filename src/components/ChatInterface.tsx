// ChatInterface.tsx
import React, {
  useState,
  useEffect,
  useCallback,
  memo,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef, // Import useRef
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
import DashboardView, { DashboardViewHandle } from "./DashboardView"; // Import DashboardViewHandle
import SchemaExplorer from "./SchemaExplorer";
import DashboardSkeletonLoader from "./DashboardSkeletonLoader";
import schemaSampleData from "../data/sampleSchemaData";
import DashboardError from "./DashboardError";
import PreviousQuestionsModal from "./PreviousQuestionModal";
import html2canvas from "html2canvas"; // Import html2canvas

import {
  ListChecks,
  Database,
  Layers,
  PlusCircle,
  FileText,
  ScanEye, // Import ScanEye for summarize graph button
} from "lucide-react"; // Corrected import syntax

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

// Define the DashboardItem interface
interface DashboardItem {
  id: string; // Dashboard item's unique ID
  question: string;
  kpiData: KpiData;
  mainViewData: MainViewData;
  textualSummary: string;
  lastViewType: "graph" | "table" | "query";
  isFavorited: boolean; // Indicates if the question message for this item is favorited
  questionMessageId: string; // The actual message ID from the backend
  connectionName: string; // The connection associated with this dashboard item
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

const getDashboardErrorState = (question: string, errorMsg: string) => ({
  // Modified to accept question and error message
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
  textualSummary: `Error: ${errorMsg}`, // Store the specific error message
  question: question, // Store the original question
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

      // Ref for the connections dropdown to detect outside clicks
      const connectionDropdownRef = useRef<HTMLDivElement>(null);
      // Ref for the DashboardView component
      const dashboardViewRef = useRef<DashboardViewHandle>(null);

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
      const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(
        null
      );
      // New state for summarized graph text
      const [graphSummary, setGraphSummary] = useState<string | null>(null);

      // Memoized initial dashboard state to prevent infinite loop
      const initialDashboardState = useMemo(
        (): DashboardItem => ({
          id: generateId(),
          question: "Welcome to your interactive analytics dashboard!",
          kpiData: initialEmptyKpiData,
          mainViewData: initialEmptyMainViewData,
          textualSummary: "Ask a question to get started.",
          lastViewType: "table",
          isFavorited: false, // Default to false
          questionMessageId: "", // Default empty
          connectionName: "", // Default empty
        }),
        []
      );

      const [dashboardHistory, setDashboardHistory] = useState<DashboardItem[]>(
        [initialDashboardState]
      );
      const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
      const [currentMainViewType, setCurrentMainViewType] = useState<
        "graph" | "table" | "query"
      >("table");
      const [showPrevQuestionsModal, setShowPrevQuestionsModal] =
        useState(false);

      const currentDashboardView = dashboardHistory[currentHistoryIndex];

      // Determine if the current view is an error state
      const isErrorState =
        currentDashboardView.textualSummary.startsWith("Error:");

      // Synchronize currentQuestionId with currentDashboardView
      useEffect(() => {
        if (currentDashboardView?.questionMessageId) {
          setCurrentQuestionId(currentDashboardView.questionMessageId);
        }
      }, [currentDashboardView]);

      // Modified useEffect to stop loading on error or completion
      useEffect(() => {
        if (
          currentDashboardView?.textualSummary === "Processing your request..."
        ) {
          setIsSubmitting(true);
        } else if (
          isSubmitting &&
          currentDashboardView?.textualSummary !== "Processing your request..."
        ) {
          // If isSubmitting is true and the text is no longer 'Processing your request...', stop loading.
          // This covers both successful responses and error states.
          setIsSubmitting(false);
        }
      }, [currentDashboardView, isSubmitting]);

      // Effect to load session history when connections are ready or visibility changes
      useEffect(() => {
        const handleSessionLoad = async () => {
          const storedSessionId = localStorage.getItem("currentSessionId");
          const storedCurrentQuestionId = localStorage.getItem(
            "currentDashboardQuestionId"
          );

          if (storedSessionId && connections.length > 0) {
            try {
              const response = await axios.get(
                `${API_URL}/api/sessions/${storedSessionId}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              const sessionData = response.data;
              await loadSession(storedSessionId); // Load session messages into useSession hook

              const loadedDashboardHistory: DashboardItem[] = [];
              const userMessages = sessionData.messages
                .filter((msg: Message) => !msg.isBot)
                .sort(
                  (a: Message, b: Message) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime()
                ); // Sort by timestamp to process chronologically

              let restoredIndex = 0; // Default to the first question in the loaded history

              for (const userMessage of userMessages) {
                const correspondingBotMessage = sessionData.messages
                  .filter(
                    (msg: Message) =>
                      msg.isBot && msg.parentId === userMessage.id
                  )
                  .sort(
                    (a: Message, b: Message) =>
                      new Date(b.timestamp).getTime() -
                      new Date(a.timestamp).getTime()
                  )[0]; // Get the latest bot response for this user message

                if (
                  correspondingBotMessage &&
                  correspondingBotMessage.content !== "loading..."
                ) {
                  if (
                    correspondingBotMessage.content.startsWith("Error:") ||
                    !correspondingBotMessage.content.trim().startsWith("{")
                  ) {
                    // It's an error message
                    loadedDashboardHistory.push({
                      id: generateId(),
                      question: userMessage.content,
                      ...getDashboardErrorState(
                        userMessage.content,
                        correspondingBotMessage.content.replace("Error: ", "")
                      ),
                      lastViewType: "table",
                      isFavorited: userMessage.isFavorited,
                      questionMessageId: userMessage.id,
                      connectionName: sessionData.connection,
                    });
                  } else {
                    // Try to parse as JSON for a successful response
                    try {
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
                        `Here is the analysis for: "${userMessage.content}"`;

                      loadedDashboardHistory.push({
                        id: generateId(),
                        question: userMessage.content,
                        kpiData: actualKpiData,
                        mainViewData: actualMainViewData,
                        textualSummary: actualTextualSummary,
                        lastViewType: "table", // Default to table view on load
                        isFavorited: userMessage.isFavorited,
                        questionMessageId: userMessage.id,
                        connectionName: sessionData.connection,
                      });
                    } catch (parseError) {
                      console.error(
                        "Failed to parse bot response content from session:",
                        parseError
                      );
                      // If parsing fails, treat as an error or skip, but don't break the app
                      loadedDashboardHistory.push({
                        id: generateId(),
                        question: userMessage.content,
                        ...getDashboardErrorState(
                          userMessage.content,
                          "Failed to parse bot response."
                        ),
                        lastViewType: "table",
                        isFavorited: userMessage.isFavorited,
                        questionMessageId: userMessage.id,
                        connectionName: sessionData.connection,
                      });
                    }
                  }
                }
                // If no corresponding bot message or it's still 'loading...', we skip this interaction as it's incomplete
              }

              if (loadedDashboardHistory.length > 0) {
                // Find the index of the previously selected question
                const foundIndex = loadedDashboardHistory.findIndex(
                  (item) => item.questionMessageId === storedCurrentQuestionId
                );

                if (foundIndex !== -1) {
                  restoredIndex = foundIndex;
                } else {
                  // If the stored question is not found (e.g., new session, question deleted), default to the last one
                  restoredIndex = loadedDashboardHistory.length - 1;
                }

                setDashboardHistory(loadedDashboardHistory);
                setCurrentHistoryIndex(restoredIndex);
                setCurrentQuestionId(
                  loadedDashboardHistory[restoredIndex].questionMessageId
                );
                setCurrentMainViewType(
                  loadedDashboardHistory[restoredIndex].lastViewType || "table"
                );
                setInput("");
              } else {
                // If no complete interactions found, revert to initial state
                setDashboardHistory([initialDashboardState]);
                setCurrentHistoryIndex(0);
                setCurrentMainViewType("table");
                setInput("");
              }
            } catch (error) {
              console.error("Session validation failed or no data:", error);
              localStorage.removeItem("currentSessionId");
              localStorage.removeItem("currentDashboardQuestionId"); // Clear on error
              clearSession();
              setDashboardHistory([initialDashboardState]);
              setCurrentHistoryIndex(0);
              setCurrentMainViewType("table");
            }
          } else if (!storedSessionId) {
            clearSession();
            localStorage.removeItem("currentDashboardQuestionId"); // Clear if no session
            setDashboardHistory([initialDashboardState]);
            setCurrentHistoryIndex(0);
            setCurrentMainViewType("table");
          }
        };

        handleSessionLoad(); // Initial load
        document.addEventListener("visibilitychange", handleSessionLoad); // Listen for tab visibility changes
        return () =>
          document.removeEventListener("visibilitychange", handleSessionLoad); // Clean up listener
      }, [
        token,
        loadSession,
        clearSession,
        initialDashboardState,
        connections,
      ]);

      // Effect to save the current dashboard item's question ID to localStorage
      useEffect(() => {
        if (currentDashboardView?.questionMessageId) {
          localStorage.setItem(
            "currentDashboardQuestionId",
            currentDashboardView.questionMessageId
          );
        } else if (
          dashboardHistory.length === 1 &&
          currentDashboardView.id === initialDashboardState.id
        ) {
          // If it's the initial empty state, clear the stored ID
          localStorage.removeItem("currentDashboardQuestionId");
        }
      }, [currentDashboardView, dashboardHistory, initialDashboardState]);

      // Effect to handle clicks outside the connection dropdown
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

      const handleNewChat = useCallback(() => {
        clearSession();
        setInput("");
        setDashboardHistory([initialDashboardState]);
        setCurrentHistoryIndex(0);
        setCurrentMainViewType("table");
        setGraphSummary(null); // Clear graph summary on new chat
        localStorage.removeItem("currentDashboardQuestionId"); // Clear stored question on new chat
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
            // On new session, clear any old question ID
            localStorage.removeItem("currentDashboardQuestionId");
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
        async (question: string, connection: string, query?: string) => {
          if (!connection) {
            toast.error("No connection provided.");
            return;
          }

          const newLoadingEntryId = generateId();
          const newLoadingEntry: DashboardItem = {
            id: newLoadingEntryId,
            question: question,
            questionMessageId: "", // Will be set after the message is created
            connectionName: connection,
            ...getDashboardLoadingState(),
            lastViewType: "table",
            isFavorited: false, // Newly asked questions are not favorited by default
          };

          setDashboardHistory((prev) => {
            const newHistory =
              currentHistoryIndex === prev.length - 1
                ? [...prev, newLoadingEntry]
                : [...prev.slice(0, currentHistoryIndex + 1), newLoadingEntry];
            return newHistory;
          });

          setCurrentHistoryIndex((prevIndex) => prevIndex + 1);
          setGraphSummary(null); // Clear previous graph summary on new question

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
                        ...getDashboardErrorState(
                          question,
                          "No valid session connection found."
                        ),
                        textualSummary:
                          "Error: No valid session connection found.",
                        isFavorited: false, // Ensure error state is unfavorited
                        questionMessageId: "",
                        connectionName: connection,
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
                localStorage.removeItem("currentDashboardQuestionId"); // Clear on error
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
                          ...getDashboardErrorState(
                            question,
                            "Could not create session."
                          ),
                          textualSummary: "Error: Could not create session.",
                          isFavorited: false, // Ensure error state is unfavorited
                          questionMessageId: "",
                          connectionName: connection,
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
                        ...getDashboardErrorState(
                          question,
                          getErrorMessage(error)
                        ), // Pass specific error message
                        textualSummary: `Error: ${getErrorMessage(error)}`,
                        isFavorited: false, // Ensure error state is unfavorited
                        questionMessageId: "",
                        connectionName: connection,
                      }
                    : item
                )
              );
              return;
            }
          }

          const userMessage: Message = {
            id: Date.now().toString(), // Temp ID
            content: question,
            isBot: false,
            timestamp: new Date().toISOString(),
            isFavorited: false, // Will be set to false at creation in backend
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
                parentId: null,
              },
              { headers: { "Content-Type": "application/json" } }
            );
            const finalUserMessage = {
              ...userMessage,
              id: userResponse.data.id,
              isFavorited: userResponse.data.isFavorited, // Get actual status from backend
            };
            finalUserMessageId = finalUserMessage.id;
            dispatchMessages({
              type: "ADD_MESSAGE",
              message: finalUserMessage,
            });

            // Update the dashboardHistory item with the real message ID and favorite status
            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.id === newLoadingEntryId
                  ? {
                      ...item,
                      questionMessageId: finalUserMessageId,
                      isFavorited: finalUserMessage.isFavorited,
                      connectionName: connection,
                    }
                  : item
              )
            );

            // Update localStorage with the new question ID as it becomes the current
            if (finalUserMessageId) {
              localStorage.setItem(
                "currentDashboardQuestionId",
                finalUserMessageId
              );
            }

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
                        // isFavorited and questionMessageId should already be set from userResponse.data
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
              const errorContent = getErrorMessage(error); // Get the specific error message

              setDashboardHistory((prev) =>
                prev.map((item) =>
                  item.id === newLoadingEntryId
                    ? {
                        ...item,
                        ...getDashboardErrorState(question, errorContent), // Pass specific error message
                        textualSummary: `Error: ${errorContent}`,
                        isFavorited: item.isFavorited, // Preserve existing favorite status
                        questionMessageId: item.questionMessageId, // Preserve existing message ID
                        connectionName: item.connectionName, // Preserve existing connection
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

            // If an error occurred before message creation, filter out the loading entry
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
          await askQuestion(questionToAsk, selectedConnection);
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
          await askQuestion(question, connectionName, query);
        },
        [connections, handleNewChat, setSelectedConnection, askQuestion]
      );

      const handleToggleFavorite = useCallback(
        async (
          questionMessageId: string,
          questionContent: string,
          responseQuery: string,
          currentConnection: string,
          isCurrentlyFavorited: boolean
        ) => {
          if (!token) {
            toast.error("Authentication required to favorite/unfavorite.");
            return;
          }

          try {
            if (isCurrentlyFavorited) {
              await axios.post(
                `${API_URL}/unfavorite`,
                {
                  questionId: questionMessageId,
                  uid: "user1", // Hardcoded uid for now
                  currentConnection,
                  questionContent,
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );
            } else {
              await axios.post(
                `${API_URL}/favorite`,
                {
                  questionId: questionMessageId,
                  questionContent,
                  responseQuery,
                  currentConnection,
                  uid: "user1", // Hardcoded uid for now
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );
            }

            // Update the specific dashboard item's isFavorited status in history
            setDashboardHistory((prevHistory) =>
              prevHistory.map((item) =>
                item.questionMessageId === questionMessageId
                  ? { ...item, isFavorited: !isCurrentlyFavorited }
                  : item
              )
            );

            // Update the corresponding message in the messages state
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: questionMessageId,
              message: { isFavorited: !isCurrentlyFavorited },
            });
          } catch (error) {
            console.error("Error toggling favorite:", error);
            toast.error(`Failed to toggle favorite: ${getErrorMessage(error)}`);
          }
        },
        [token, dispatchMessages]
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
          setIsConnectionDropdownOpen(false); // Close dropdown after selection
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

      const handleSummarizeGraph = useCallback(async () => {
        if (!dashboardViewRef.current) {
          toast.error("Graph component not ready for summarization.");
          return;
        }

        const graphElement = dashboardViewRef.current.getGraphContainer();

        if (!graphElement) {
          toast.error("No graph visible to summarize.");
          return;
        }

        setIsSubmitting(true);
        setGraphSummary(null); // Clear previous summary
        toast.info("Summarizing graph...", { autoClose: false });

        try {
          // Temporarily hide other elements in dashboard-view to capture only graph
          // This is a simple approach; for more complex layouts, consider cloning the element
          // and rendering it off-screen, then capturing.
          const kpiSection = graphElement
            .closest(".flex")
            ?.querySelector(".grid.m-2");
          const viewToggleSection = graphElement
            .closest(".flex")
            ?.querySelector(".flex-row.self-start");
          const originalKPIDisplay = kpiSection ? kpiSection.style.display : "";
          const originalViewToggleDisplay = viewToggleSection
            ? viewToggleSection.style.display
            : "";

          if (kpiSection) kpiSection.style.display = "none";
          if (viewToggleSection) viewToggleSection.style.display = "none";

          const canvas = await html2canvas(graphElement, {
            scale: 2, // High resolution capture
            useCORS: true,
            logging: false,
            backgroundColor: theme.colors.surface, // Ensure consistent background
          });
          const imageData = canvas.toDataURL("image/png"); // Base64 image

          // Restore original display
          if (kpiSection) kpiSection.style.display = originalKPIDisplay;
          if (viewToggleSection)
            viewToggleSection.style.display = originalViewToggleDisplay;

          const prompt = `Summarize the key insights from this graph image. Consider the current question: "${
            currentDashboardView.question
          }". Also, note the dashboard's current state: Kpi data: ${JSON.stringify(
            currentDashboardView.kpiData
          )}, Main View Data Query: ${
            currentDashboardView.mainViewData.queryData
          }. Focus on trends, anomalies, and overall patterns shown in the visual data.`;
          const apiKey = ""; // Canvas will provide this automatically

          const payload = {
            contents: [
              {
                role: "user",
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: "image/png",
                      data: imageData.split(",")[1], // Remove "data:image/png;base64," prefix
                    },
                  },
                ],
              },
            ],
          };

          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

          // Post the image data and prompt to the Gemini API for summarization
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
            setGraphSummary(summaryText); // Set the summarized text
          } else {
            console.error("Unexpected Gemini API response structure:", result);
            toast.error(
              "Failed to get summary from AI due to unexpected response."
            );
            setGraphSummary("Error: Failed to get summary from AI.");
          }

          toast.dismiss();
          toast.success("Graph summarized successfully!");
        } catch (error) {
          console.error("Error summarizing graph:", error);
          toast.dismiss(); // Dismiss the loading toast
          const errorMessage = getErrorMessage(error);
          toast.error(`Failed to summarize graph: ${errorMessage}`);
          setGraphSummary(`Error: ${errorMessage}`);
        } finally {
          setIsSubmitting(false);
        }
      }, [currentDashboardView, theme.colors.surface]);

      const handleSelectPrevQuestion = useCallback(
        async (messageId: string) => {
          // Updated to accept messageId
          if (!selectedConnection) {
            toast.error(
              "No connection selected. Please select a connection first."
            );
            return;
          }

          setInput("");
          setShowPrevQuestionsModal(false);
          setGraphSummary(null); // Clear graph summary when selecting previous question

          // Find the user message in the session messages by its unique ID
          const selectedUserMessage = messages.find(
            (msg) => !msg.isBot && msg.id === messageId
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
              // Check if the bot message content indicates an error
              if (
                correspondingBotMessage.content.startsWith("Error:") ||
                !correspondingBotMessage.content.trim().startsWith("{")
              ) {
                const newEntry: DashboardItem = {
                  id: generateId(), // Generate a new ID for this history entry
                  question: selectedUserMessage.content, // Use content from the found message
                  ...getDashboardErrorState(
                    selectedUserMessage.content,
                    correspondingBotMessage.content.replace("Error: ", "")
                  ),
                  lastViewType: "table", // Default to table view
                  isFavorited: selectedUserMessage.isFavorited, // Get from the message, which is now correctly identified
                  questionMessageId: selectedUserMessage.id, // Set the message ID
                  connectionName: selectedConnection, // Use the currently selected connection
                };

                setDashboardHistory((prev) => {
                  const newHistory =
                    currentHistoryIndex === prev.length - 1
                      ? [...prev, newEntry]
                      : [...prev.slice(0, currentHistoryIndex + 1), newEntry];
                  return newHistory;
                });
                setCurrentHistoryIndex((prevIndex) => prevIndex + 1);
                // Save the selected question's ID to localStorage
                localStorage.setItem(
                  "currentDashboardQuestionId",
                  selectedUserMessage.id
                );
              } else {
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
                    `Here is the analysis for: "${selectedUserMessage.content}"`;

                  const newEntry: DashboardItem = {
                    id: generateId(), // Generate a new ID for this history entry
                    question: selectedUserMessage.content,
                    kpiData: actualKpiData,
                    mainViewData: actualMainViewData,
                    textualSummary: actualTextualSummary,
                    lastViewType: "table", // Default to table view
                    isFavorited: selectedUserMessage.isFavorited, // Get from the message, which is now correctly identified
                    questionMessageId: selectedUserMessage.id, // Set the message ID
                    connectionName: selectedConnection, // Use the currently selected connection
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
                  // Save the selected question's ID to localStorage
                  localStorage.setItem(
                    "currentDashboardQuestionId",
                    selectedUserMessage.id
                  );
                  setCurrentQuestionId(selectedUserMessage.id);
                } catch (parseError) {
                  console.error(
                    "Failed to parse bot response content for previous question:",
                    parseError
                  );
                  // Fallback: If parsing fails, re-ask the question.
                  await askQuestion(
                    selectedUserMessage.content,
                    selectedConnection
                  );
                }
              }
            } else {
              // Fallback: If no corresponding bot message or it's still loading, re-ask the question.
              await askQuestion(
                selectedUserMessage.content,
                selectedConnection
              );
            }
          } else {
            // Fallback: If the user message is not found in session messages by ID,
            // this implies a state inconsistency or an issue with the message ID.
            // For now, we will simply log an error.
            console.error(
              "User message not found in session by ID:",
              messageId
            );
            toast.error("Could not load the selected previous question.");
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
          setGraphSummary(null); // Clear graph summary on navigation
          // Save the current question's ID when navigating history
          if (dashboardHistory[newIndex]?.questionMessageId) {
            localStorage.setItem(
              "currentDashboardQuestionId",
              dashboardHistory[newIndex].questionMessageId
            );
          }
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
              border: `1px solid ${theme.colors.border}`,
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
                    className={`text-2xl font-semibold mb-4`}
                    style={{ color: theme.colors.text }}
                  >
                    No Data Connections
                  </h1>
                  <p
                    className={`mb-6`}
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Please create a data connection to start analyzing your
                    data.
                  </p>
                  <button
                    onClick={onCreateConSelected}
                    className="px-6 py-2 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                    style={{
                      backgroundColor: theme.colors.accent,
                      color: theme.colors.surface,
                      boxShadow: theme.shadow.md,
                      transition: theme.transition.default,
                    }}
                  >
                    Create Connection
                  </button>
                </div>
              ) : showDashboardContent ? (
                // Scenario: An active session exists or questions have been asked
                isSubmitting &&
                currentDashboardView.textualSummary ===
                  "Processing your request..." ? (
                  <DashboardSkeletonLoader
                    question={currentDashboardView.question}
                    theme={theme}
                  />
                ) : isErrorState ? (
                  <DashboardError
                    question={currentDashboardView.question}
                    errorMessage={currentDashboardView.textualSummary.replace(
                      "Error: ",
                      ""
                    )}
                    theme={theme}
                  />
                ) : (
                  <DashboardView
                    ref={dashboardViewRef} // Pass the ref to DashboardView
                    dashboardItem={currentDashboardView}
                    theme={theme}
                    isSubmitting={isSubmitting}
                    activeViewType={currentMainViewType}
                    onViewTypeChange={handleViewTypeChange}
                    onNavigateHistory={navigateDashboardHistory}
                    historyIndex={currentHistoryIndex}
                    historyLength={dashboardHistory.length}
                    onToggleFavorite={handleToggleFavorite} // Pass the new handler
                    currentConnection={selectedConnection || ""} // Pass the current selected connection
                    graphSummary={graphSummary} // Pass the graph summary
                  />
                )
              ) : (
                // Scenario: Initial state, no active session/questions, but connections are available
                <div className="flex flex-col items-center justify-start flex-grow text-center px-4 pt-12">
                  <h1
                    className={`text-3xl font-bold mb-4`}
                    style={{ marginTop: "10vh", color: theme.colors.text }}
                  >
                    Hello there! How can I help you today?
                  </h1>
                  {!selectedConnection && connections.length > 0 && (
                    <div className="flex flex-col items-center mb-6">
                      <p
                        className={`mb-4`}
                        style={{ color: theme.colors.textSecondary }}
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
              <div className="relative" ref={connectionDropdownRef}>
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
                  >
                    <Database size={20} />
                  </button>
                </CustomTooltip>

                {isConnectionDropdownOpen && (
                  <div
                    className="absolute bottom-full left-0 rounded-md shadow-lg z-30 transition-all duration-300 mb-2 w-64" // Removed overflow-hidden
                    style={{
                      background: theme.colors.surface,
                      border: `1px solid ${theme.colors.border}`,
                      boxShadow: theme.shadow.md,
                    }}
                  >
                    {connections.length === 0 ? (
                      <div
                        className="flex items-center justify-between px-4 py-3 hover:bg-opacity-10 cursor-pointer transition-colors duration-200" // Increased padding
                        style={{
                          color: theme.colors.text,
                          backgroundColor: `${theme.colors.surfaceGlass}`,
                        }}
                        onClick={() => handleSelect({ value: "create-con" })}
                      >
                        <span className="truncate font-medium">
                          <PlusCircle size={16} className="inline-block mr-2" />{" "}
                          Create New Connection
                        </span>{" "}
                        {/* Improved text and added icon */}
                      </div>
                    ) : (
                      <>
                        <div
                          className="flex items-center justify-between px-4 py-3 hover:bg-opacity-10 cursor-pointer transition-colors duration-200" // Increased padding
                          style={{
                            color: theme.colors.text,
                            backgroundColor: `${theme.colors.surface}`,
                          }}
                          onClick={() => handleSelect({ value: "create-con" })}
                        >
                          <span className="truncate font-medium">
                            <PlusCircle
                              size={16}
                              className="inline-block mr-2"
                            />{" "}
                            Create New Connection
                          </span>
                        </div>
                        {connections.map((connection: Connection) => (
                          <div
                            key={connection.connectionName}
                            className="flex items-center justify-between px-4 py-3 hover:bg-opacity-10 cursor-pointer transition-colors duration-200" // Increased padding
                            style={{
                              color: theme.colors.text,
                              background:
                                selectedConnection === connection.connectionName
                                  ? `${theme.colors.accent}20`
                                  : "transparent",
                            }}
                            onClick={() => handleSelect({ value: connection })}
                          >
                            <span
                              className="truncate font-medium" // Added font-medium
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
                                className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold" // Styled admin badge
                                style={{
                                  backgroundColor: theme.colors.accent,
                                  color: theme.colors.surface,
                                }}
                              >
                                Default
                              </span>
                            )}
                            {/* Replaced manual group-hover tooltip with CustomTooltip */}
                            <CustomTooltip
                              title="View Data Atlas"
                              position="top"
                            >
                              <button
                                type="button"
                                onClick={(e) =>
                                  handlePdfClick(connection.connectionName, e)
                                }
                                className="p-1 rounded-md"
                                style={{ background: theme.colors.accentHover }}
                                aria-label="View Data Atlas"
                              >
                                <p
                                  className="flex items-center gap-1"
                                  style={{ fontSize: theme.typography.size.sm }}
                                >
                                  <FileText
                                    size={16}
                                    style={{ color: "white" }}
                                    className="hover:scale-105 transition-transform duration-300"
                                  />
                                  Data Atlas
                                </p>
                              </button>
                            </CustomTooltip>
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
              {/* New Summarize Graph Button */}
              {showDashboardContent &&
                !isErrorState &&
                currentDashboardView.mainViewData.chartData.length > 0 && (
                  <CustomTooltip title="Summarize Graph" position="top">
                    <button
                      type="button"
                      onClick={handleSummarizeGraph}
                      disabled={
                        isSubmitting ||
                        currentDashboardView.mainViewData.chartData.length === 0
                      }
                      className={`p-2.5 shadow-lg rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50`}
                      style={{
                        background: theme.colors.surface,
                        color: theme.colors.accent,
                      }}
                    >
                      <ScanEye size={20} />
                    </button>
                  </CustomTooltip>
                )}
            </div>
          </footer>

          <PreviousQuestionsModal
            showPrevQuestionsModal={showPrevQuestionsModal}
            onClose={() => setShowPrevQuestionsModal(false)}
            userQuestionsFromSession={userQuestionsFromSession}
            handleSelectPrevQuestion={handleSelectPrevQuestion}
            currentQuestionId={currentQuestionId}
            theme={theme}
          />

          {connectionError && (
            <div
              className={`text-center p-2 text-sm`}
              style={{
                color: theme.colors.error,
                backgroundColor: `${theme.colors.error}20`,
              }}
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
