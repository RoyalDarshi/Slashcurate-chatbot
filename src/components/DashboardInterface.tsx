import React, {
  useState,
  useEffect,
  useCallback,
  memo,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import {
  Message,
  Connection,
  ChatInterfaceProps as DashboardInterfaceProps,
} from "../types";
import { API_URL, CHATBOT_API_URL } from "../config";
import ChatInput from "./DashboardInput";
import Loader from "./Loader";
import { useTheme } from "../ThemeContext";
import RecommendedQuestions from "./RecommendedQuestions";
import CustomTooltip from "./CustomTooltip";
import { useConnections, useSession, useRecommendedQuestions } from "../hooks";
import DashboardView, { DashboardViewHandle } from "./DashboardView";
import SchemaExplorer from "./SchemaExplorer";
import DashboardSkeletonLoader from "./DashboardSkeletonLoader";
import schemaSampleData from "../data/sampleSchemaData";
import DashboardError from "./DashboardError";
import PreviousQuestionsModal from "./PreviousQuestionModal";
import html2canvas from "html2canvas";
import { FaFilePdf } from "react-icons/fa";
import {
  ListChecks,
  Database,
  Layers,
  PlusCircle,
  ScanEye,
} from "lucide-react";

export type DashboardInterfaceHandle = {
  handleNewChat: () => void;
  handleAskFavoriteQuestion: (
    question: string,
    connection: string,
    query?: string
  ) => void;
};

interface KpiData {
  kpi1: { label: string; value: string | number | null; change: number };
  kpi2: { label: string; value: string | number | null; change: number };
  kpi3: { label: string; value: string | number | null; change: number };
}

export interface MainViewData {
  chartData: any[];
  tableData: any[];
  queryData: string;
}

export interface DashboardItem {
  id: string;
  question: string;
  kpiData: KpiData;
  mainViewData: MainViewData;
  textualSummary: string;
  lastViewType: "graph" | "table" | "query";
  isFavorited: boolean;
  questionMessageId: string;
  connectionName: string;
  reaction: "like" | "dislike" | null;
  dislike_reason: string | null;
  botResponseId: string;
  isError: boolean;
}

// Added this interface
interface QueuedQuestion {
  question: string;
  connection: string;
  query?: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const initialEmptyKpiData: KpiData = {
  kpi1: { value: null, label: "No Data", change: 0 },
  kpi2: { value: null, label: "No Data", change: 0 },
  kpi3: { value: null, label: "No Data", change: 0 },
};

const initialEmptyMainViewData: MainViewData = {
  chartData: [],
  tableData: [],
  queryData: "No query available.",
};

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
  textualSummary: errorMsg,
  question: question,
  reaction: null,
  dislike_reason: null,
  isError: true,
});

const getErrorMessage = (error: any): string => {
  // Check for axios cancel
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

// Utility function to limit data to 500 rows for backend storage
const limitDataForBackend = (responseData: any): any => {
  const MAX_ROWS = 500;
  // Create a deep copy to avoid mutating the original
  const limitedData = { ...responseData };

  // Limit the answer array to 500 rows if it exists
  if (Array.isArray(limitedData.answer) && limitedData.answer.length > MAX_ROWS) {
    limitedData.answer = limitedData.answer.slice(0, MAX_ROWS);
  }

  return limitedData;
};

const sanitizeReaction = (reaction: any): "like" | "dislike" | null => {
  return reaction === "like" || reaction === "dislike" ? reaction : null;
};

const createDashboardItemFromMessages = (
  userMessage: Message,
  botMessage: Message | undefined,
  connectionName: string
): DashboardItem | null => {
  const baseItem = {
    id: generateId(),
    question: userMessage.content,
    lastViewType: "table" as const,
    isFavorited: userMessage.isFavorited,
    questionMessageId: userMessage.id,
    connectionName: connectionName,
    reaction: botMessage ? sanitizeReaction(botMessage.reaction) : null,
    dislike_reason: botMessage ? botMessage.dislike_reason ?? null : null,
    botResponseId: botMessage ? botMessage.id : "",
    isError: false,
  };

  if (!botMessage) {
    return null;
  } else if (botMessage.status === "loading") {
    // <-- MODIFIED
    return {
      ...baseItem,
      ...getDashboardLoadingState(),
      isError: false,
    };
  } else if (botMessage.status === "error") {
    // <-- MODIFIED
    return {
      ...baseItem,
      ...getDashboardErrorState(userMessage.content, botMessage.content),
      isError: true,
    };
  } else {
    // Assumes botMessage.status === "normal"
    try {
      const botResponseContent = JSON.parse(botMessage.content);
      const actualKpiData = botResponseContent.kpiData || initialEmptyKpiData;
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

      return {
        ...baseItem,
        kpiData: actualKpiData,
        mainViewData: actualMainViewData,
        textualSummary: actualTextualSummary,
        isError: false,
      };
    } catch (parseError) {
      console.error(
        "Failed to parse bot response content from session:",
        parseError
      );
      return {
        ...baseItem,
        ...getDashboardErrorState(
          userMessage.content,
          "Sorry, an error occurred. Please try again."
        ),
        isError: true,
      };
    }
  }
};

const DashboardInterface = memo(
  forwardRef<DashboardInterfaceHandle, DashboardInterfaceProps>(
    ({ onCreateConSelected, initialQuestion, onQuestionAsked }, ref) => {
      const { theme } = useTheme();
      const token = sessionStorage.getItem("token") ?? "";

      const connectionDropdownRef = useRef<HTMLDivElement>(null);
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
      const [isDbExplorerOpen, setIsDbExplorerOpen] = useState(false);
      const [isConnectionDropdownOpen, setIsConnectionDropdownOpen] =
        useState(false);
      const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(
        null
      );
      const [graphSummary, setGraphSummary] = useState<string | null>(null);
      const [sessionConnectionError, setSessionConnectionError] = useState<
        string | null
      >(null);
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [activeRequestController, setActiveRequestController] =
        useState<AbortController | null>(null);

      // Added this state
      const [queuedQuestion, setQueuedQuestion] =
        useState<QueuedQuestion | null>(null);

      const options = [
        {
          value: "create-con",
          label: "Create New Connection",
          isAdmin: false,
        },
        ...connections.map((connection: Connection) => ({
          value: connection.connectionName,
          label: connection.connectionName,
          isReading: {
            value: connection.connectionName,
            label: connection.connectionName,
            isAdmin: connection.isAdmin,
          },
        })),
      ];

      const initialDashboardState = useMemo(
        (): DashboardItem => ({
          id: generateId(),
          question: "Welcome to your interactive analytics dashboard!",
          kpiData: initialEmptyKpiData,
          mainViewData: initialEmptyMainViewData,
          textualSummary: "Ask a question to get started.",
          lastViewType: "table",
          isFavorited: false,
          questionMessageId: "",
          connectionName: "",
          reaction: null,
          dislike_reason: null,
          botResponseId: "",
          isError: false,
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

      useEffect(() => {
        const loadingMessages = messages.filter(
          (msg) =>
            msg.isBot &&
            msg.status === "loading" &&
            msg.id.includes("-") &&
            !msg.id.startsWith("temp-")
        );
        if (loadingMessages.length === 0) {
          setIsSubmitting(false);
          return;
        }
        setIsSubmitting(true);

        // Create an async function inside the useEffect
        const pollMessages = async () => {
          try {
            for (const msg of loadingMessages) {
              const response = await axios.post(
                `${API_URL}/api/getmessages/${msg.id}`,
                { token },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (response.data.status !== "loading") {
                // <-- MODIFIED
                dispatchMessages({
                  type: "UPDATE_MESSAGE",
                  id: msg.id,
                  message: {
                    content: response.data.content,
                    timestamp: response.data.timestamp,
                    reaction: sanitizeReaction(response.data.reaction),
                    dislike_reason: response.data.dislike_reason ?? null,
                    status: response.data.status, // <-- ADDED
                  },
                });
                // Update dashboardHistory based on the new bot content
                setDashboardHistory((prev) =>
                  prev.map((item) => {
                    if (item.botResponseId === msg.id) {
                      if (response.data.status === "error") {
                        // <-- MODIFIED
                        return {
                          ...item,
                          ...getDashboardErrorState(
                            item.question,
                            response.data.content
                          ),
                          isError: true,
                        };
                      } else {
                        // Assumes "normal"
                        try {
                          const botResponseContent = JSON.parse(
                            response.data.content
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
                            `Here is the analysis for: "${item.question}"`;
                          return {
                            ...item,
                            kpiData: actualKpiData,
                            mainViewData: actualMainViewData,
                            textualSummary: actualTextualSummary,
                            isError: false,
                          };
                        } catch (parseError) {
                          console.error(
                            "Failed to parse polled bot response:",
                            parseError
                          );
                          return {
                            ...item,
                            ...getDashboardErrorState(
                              item.question,
                              "Sorry, an error occurred. Please try again."
                            ),
                            isError: true,
                          };
                        }
                      }
                    }
                    return item;
                  })
                );
              }
            }
          } catch (error) {
            setIsSubmitting(false);
            console.error("Error polling message updates:", error);
          }
        };

        // Call the async function
        pollMessages();
      }, [messages, token, dispatchMessages]);

      useEffect(() => {
        if (currentDashboardView?.questionMessageId) {
          setCurrentQuestionId(currentDashboardView.questionMessageId);
        }
      }, [currentDashboardView]);

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
              await loadSession(storedSessionId);

              const userMessages = sessionData.messages
                .filter((msg: Message) => !msg.isBot)
                .sort(
                  (a: Message, b: Message) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime()
                );

              const botMessagesByParentId = new Map<string, Message[]>();
              sessionData.messages
                .filter((msg: Message) => msg.isBot && msg.parentId)
                .forEach((msg: Message) => {
                  if (!botMessagesByParentId.has(msg.parentId!)) {
                    botMessagesByParentId.set(msg.parentId!, []);
                  }
                  botMessagesByParentId.get(msg.parentId!)!.push(msg);
                });

              const loadedDashboardHistory: DashboardItem[] = [];

              for (const userMessage of userMessages) {
                const correspondingBotMessages = botMessagesByParentId.get(
                  userMessage.id
                );
                const latestBotMessage = correspondingBotMessages?.sort(
                  (a: Message, b: Message) =>
                    new Date(b.timestamp).getTime() -
                    new Date(a.timestamp).getTime()
                )[0];

                const dashboardItem = createDashboardItemFromMessages(
                  userMessage,
                  latestBotMessage,
                  sessionData.connection
                );
                if (dashboardItem) {
                  loadedDashboardHistory.push(dashboardItem);
                }
              }

              if (loadedDashboardHistory.length > 0) {
                const foundIndex = loadedDashboardHistory.findIndex(
                  (item) => item.questionMessageId === storedCurrentQuestionId
                );

                const restoredIndex =
                  foundIndex !== -1
                    ? foundIndex
                    : loadedDashboardHistory.length - 1;

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
                setDashboardHistory([initialDashboardState]);
                setCurrentHistoryIndex(0);
                setCurrentMainViewType("table");
                setInput("");
              }
            } catch (error) {
              console.error("Session validation failed or no data:", error);
              localStorage.removeItem("currentSessionId");
              localStorage.removeItem("currentDashboardQuestionId");
              clearSession();
              setDashboardHistory([initialDashboardState]);
              setCurrentHistoryIndex(0);
              setCurrentMainViewType("table");
            }
          } else if (!storedSessionId) {
            clearSession();
            localStorage.removeItem("currentDashboardQuestionId");
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

      useEffect(() => {
        if (currentDashboardView?.questionMessageId) {
          localStorage.setItem(
            "currentDashboardQuestionId",
            currentDashboardView.questionMessageId
          );
        }
      }, [currentDashboardView]);

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
        setGraphSummary(null);
        setSessionConnectionError(null);
        localStorage.removeItem("currentDashboardQuestionId");
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
        async (question: string, connection: string, query?: string) => {
          // 1. Validation
          if (!connection) {
            toast.error("No connection provided.");
            return;
          }

          // 2. Generate Temporary IDs for Optimistic UI
          const tempUserMsgId = `temp-user-${Date.now()}`;
          const tempBotMsgId = `temp-bot-${Date.now()}`;
          const newLoadingEntryId = generateId();

          // 3. Optimistic Dashboard History Update
          // Add the "Loading" card to the dashboard immediately
          const newLoadingEntry: DashboardItem = {
            id: newLoadingEntryId,
            question: question,
            questionMessageId: tempUserMsgId, // Use Temp ID
            connectionName: connection,
            ...getDashboardLoadingState(),
            lastViewType: "table",
            isFavorited: false,
            reaction: null,
            dislike_reason: null,
            botResponseId: tempBotMsgId, // Use Temp ID
            isError: false,
          };

          setDashboardHistory((prev) => {
            const newHistory =
              currentHistoryIndex === prev.length - 1
                ? [...prev, newLoadingEntry]
                : [...prev.slice(0, currentHistoryIndex + 1), newLoadingEntry];
            return newHistory;
          });
          setCurrentHistoryIndex((prevIndex) => prevIndex + 1);
          setGraphSummary(null);

          // 4. Optimistic Global Message State Update
          // Add User Message to Chat Context
          dispatchMessages({
            type: "ADD_MESSAGE",
            message: {
              id: tempUserMsgId,
              content: question,
              isBot: false,
              timestamp: new Date().toISOString(),
              isFavorited: false,
              parentId: null,
              status: "normal",
            },
          });

          // Add Bot Loading Message to Chat Context
          dispatchMessages({
            type: "ADD_MESSAGE",
            message: {
              id: tempBotMsgId,
              isBot: true,
              content: "loading...",
              timestamp: new Date().toISOString(),
              isFavorited: false,
              parentId: tempUserMsgId,
              status: "loading",
            },
          });

          // 5. Handle Session Logic
          let currentSessionId = sessionId;

          // Check if we need to restore a session or connection
          if (currentSessionId && !sessionConnection) {
            const currentSessionInfo = connections.find(
              (c) => c.connectionName === selectedConnection
            );
            if (!currentSessionInfo && messages.length > 0) {
              toast.error("This session does not have a valid connection.");
              // Mark optimistic item as error
              setDashboardHistory((prev) =>
                prev.map((item) =>
                  item.id === newLoadingEntryId
                    ? { ...item, ...getDashboardErrorState(question, "Invalid connection"), isError: true }
                    : item
                )
              );
              setIsSubmitting(false);
              return;
            }
          }

          // Variables to track Real IDs as we get them
          let realUserMsgId = "";
          let realBotMsgId = "";

          try {
            // Create New Session if needed
            if (!currentSessionId) {
              try {
                // Re-using your startNewSession logic manually here to ensure we catch errors
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
                  messages: [], // We will re-add our optimistic messages via local state if needed, but usually we just keep appending
                  connection: connection,
                });
              } catch (error) {
                throw new Error("Failed to create session: " + getErrorMessage(error));
              }
            }

            // 6. Send User Message to Backend
            const userResponse = await axios.post(
              `${API_URL}/api/messages`,
              {
                token,
                session_id: currentSessionId,
                content: question,
                isBot: false,
                isFavorited: false, // Default
                parentId: null,
                status: "normal",
              },
              { headers: { "Content-Type": "application/json" } }
            );

            realUserMsgId = userResponse.data.id;
            const isFavorited = userResponse.data.isFavorited;

            // SWAP 1: Replace Temp User ID with Real User ID in Reducer
            dispatchMessages({
              type: "REPLACE_MESSAGE_ID",
              oldId: tempUserMsgId,
              newId: realUserMsgId,
            });

            // Update Dashboard History with Real User ID
            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.id === newLoadingEntryId
                  ? { ...item, questionMessageId: realUserMsgId, isFavorited }
                  : item
              )
            );

            // 7. Send Bot Loading Message to Backend
            const botLoadingResponse = await axios.post(
              `${API_URL}/api/messages`,
              {
                token,
                session_id: currentSessionId,
                content: "loading...",
                isBot: true,
                isFavorited: false,
                parentId: realUserMsgId, // Link to REAL User ID
                status: "loading",
              },
              { headers: { "Content-Type": "application/json" } }
            );

            realBotMsgId = botLoadingResponse.data.id;

            // SWAP 2: Replace Temp Bot ID with Real Bot ID in Reducer
            dispatchMessages({
              type: "REPLACE_MESSAGE_ID",
              oldId: tempBotMsgId,
              newId: realBotMsgId,
            });

            // Update Dashboard History with Real Bot ID
            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.id === newLoadingEntryId
                  ? { ...item, botResponseId: realBotMsgId }
                  : item
              )
            );

            // 8. Call Chatbot API (The heavy lifting)
            const connectionObj = connections.find(
              (conn) => conn.connectionName === connection
            );
            if (!connectionObj) throw new Error("Connection not found.");

            const controller = new AbortController();
            setActiveRequestController(controller);

            const payload = query
              ? { question, sql_query: query, connection: connectionObj, sessionId: currentSessionId }
              : { question, connection: connectionObj, sessionId: currentSessionId };

            const response = await axios.post(`${CHATBOT_API_URL}/ask`, payload, {
              signal: controller.signal,
            });

            setActiveRequestController(null);
            const responseData = response.data;

            // 9. Handle Response Data
            let finalStatus: Message["status"] = "normal";
            let finalContent = "";

            // Check for Python-side logic errors
            if (
              responseData.execution_status === "Failed" ||
              responseData.data_availability === "Execution Error"
            ) {
              finalStatus = "error";
              let errorMsg = "Query execution failed.";
              if (responseData.answer && responseData.answer.error) {
                errorMsg = responseData.answer.error.message || errorMsg;
                if (responseData.answer.error.db2_raw) {
                  errorMsg += `\n\nDetails: ${responseData.answer.error.db2_raw}`;
                }
              }
              finalContent = errorMsg;
            } else {
              finalContent = JSON.stringify(responseData, null, 2);
            }

            // 10. Save Final Result to Backend
            // Create limited data for backend storage (500 rows max) if successful
            const contentForBackend = finalStatus === "normal"
              ? JSON.stringify(limitDataForBackend(responseData), null, 2)
              : finalContent;

            await axios.put(
              `${API_URL}/api/messages/${realBotMsgId}`,
              {
                token,
                content: contentForBackend,
                timestamp: new Date().toISOString(),
                status: finalStatus,
              },
              { headers: { "Content-Type": "application/json" } }
            );

            // 11. Update Global Messages with Final Result
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: realBotMsgId,
              message: {
                content: finalContent,
                timestamp: new Date().toISOString(),
                status: finalStatus,
              },
            });

            // 12. Update Dashboard History with Final Result
            if (finalStatus === "error") {
              setDashboardHistory((prev) =>
                prev.map((item) =>
                  item.botResponseId === realBotMsgId
                    ? { ...item, ...getDashboardErrorState(question, finalContent), isError: true }
                    : item
                )
              );
            } else {
              // Parse Success Data
              const actualKpiData = responseData.kpiData || initialEmptyKpiData;
              const actualMainViewData = {
                chartData: Array.isArray(responseData.answer) ? responseData.answer : [],
                tableData: Array.isArray(responseData.answer) ? responseData.answer : [],
                queryData: typeof responseData.sql_query === "string" ? responseData.sql_query : "No query available.",
              };
              const actualTextualSummary = responseData.textualSummary || `Here is the analysis for: "${question}"`;

              setDashboardHistory((prev) =>
                prev.map((item) =>
                  item.botResponseId === realBotMsgId
                    ? {
                      ...item,
                      kpiData: actualKpiData,
                      mainViewData: actualMainViewData,
                      textualSummary: actualTextualSummary,
                      isError: false,
                    }
                    : item
                )
              );
            }

          } catch (error) {
            // 13. Error Handling
            setActiveRequestController(null);

            // If cancelled, stop processing (Dashboard handleStopRequest will take over UI update)
            if (axios.isCancel(error) || (error as Error).name === "CanceledError") {
              return;
            }

            console.error("AskQuestion Error:", error);
            const errorContent = getErrorMessage(error);

            // Determine which Bot ID to update (Real or Temp if Real never happened)
            const targetBotId = realBotMsgId || tempBotMsgId;

            // Update Backend to Error State (Only if we have a Real ID)
            if (realBotMsgId) {
              await axios.put(`${API_URL}/api/messages/${realBotMsgId}`, {
                token,
                content: errorContent,
                timestamp: new Date().toISOString(),
                status: "error",
              }).catch(e => console.error("Failed to sync error to backend", e));
            }

            // Update Global Messages UI
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: targetBotId,
              message: {
                content: errorContent,
                timestamp: new Date().toISOString(),
                status: "error",
              },
            });

            // Update Dashboard History UI
            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.id === newLoadingEntryId
                  ? {
                    ...item,
                    ...getDashboardErrorState(question, errorContent),
                    isError: true,
                    // Ensure IDs are synced even if failed before swap
                    questionMessageId: realUserMsgId || item.questionMessageId,
                    botResponseId: targetBotId,
                  }
                  : item
              )
            );
          } finally {
            // 14. Always release the lock
            setIsSubmitting(false);
          }
        },
        [
          sessionId,
          connections,
          token,
          dispatchMessages,
          selectedConnection,
          sessionConnection,
          currentHistoryIndex, // Needed for history update logic
          messages.length, // Needed for session validation check
          // Add other dependencies as required by your linting rules
        ]
      );

      // --- **** THIS IS THE FIX **** ---
      // This useEffect was moved from before askQuestion to *after* it,
      // resolving the ReferenceError.
      useEffect(() => {
        // Check if a question is queued, not already submitting, and connections are loaded
        if (queuedQuestion && !isSubmitting && connections.length > 0) {
          // Find the connection object
          const connectionObj = connections.find(
            (conn) => conn.connectionName === queuedQuestion.connection
          );

          if (connectionObj) {
            // State is now clean from handleNewChat() in the previous render.
            // We can safely call the *current* askQuestion function,
            // which has been recreated with the correct empty state.
            askQuestion(
              queuedQuestion.question,
              queuedQuestion.connection,
              queuedQuestion.query
            );
          } else {
            // This should be rare, as handleAskFavoriteQuestion checks, but good to have
            toast.error(`Connection "${queuedQuestion.connection}" not found.`);
          }

          // Clear the queue regardless
          setQueuedQuestion(null);
        }
      }, [queuedQuestion, isSubmitting, connections, askQuestion]); // Dependencies
      // --- **** END OF FIX **** ---

      const handleStopRequest = useCallback(async () => {
        if (!isSubmitting) return;

        // 1. Abort the in-flight Axios request
        if (activeRequestController) {
          activeRequestController.abort();
          setActiveRequestController(null);
        }

        const errorMessage = "Request cancelled by user.";
        const errorStatus = "error"; // <-- ADDED

        // 2. Find the loading message in the session
        const loadingMessage = messages.find(
          (msg) => msg.isBot && msg.status === "loading" // <-- MODIFIED
        );

        if (loadingMessage && loadingMessage.id) {
          const loadingBotMessageId = loadingMessage.id;
          try {
            // 3. Update the Flask (API_URL) backend message
            await axios.put(
              `${API_URL}/api/messages/${loadingBotMessageId}`,
              {
                token,
                content: errorMessage,
                timestamp: new Date().toISOString(),
                status: errorStatus, // <-- MODIFIED
              },
              { headers: { "Content-Type": "application/json" } }
            );

            // 4. Update local session state
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: loadingBotMessageId,
              message: {
                content: errorMessage,
                timestamp: new Date().toISOString(),
                status: errorStatus, // <-- MODIFIED
              },
            });

            // 5. Update the dashboard history state
            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.botResponseId === loadingBotMessageId
                  ? {
                    ...item,
                    ...getDashboardErrorState(item.question, errorMessage),
                    isError: true,
                  }
                  : item
              )
            );
          } catch (error) {
            console.error("Error cancelling request:", error);
            toast.error("Failed to cancel request.");
          }
        } else {
          // Fallback if message not found (e.g., race condition)
          // Update the *last* item in history if it's the loading one
          setDashboardHistory((prev) => {
            const lastItem = prev[prev.length - 1];
            if (lastItem.textualSummary === "Processing your request...") {
              return prev.map((item) =>
                item.id === lastItem.id
                  ? {
                    ...item,
                    ...getDashboardErrorState(item.question, errorMessage),
                    isError: true,
                  }
                  : item
              );
            }
            return prev;
          });
        }

        // 6. Update submitting state
        setIsSubmitting(false);
      }, [
        isSubmitting,
        messages,
        token,
        dispatchMessages,
        activeRequestController,
      ]);

      // This function is now correct. It just sets state.
      const handleAskFavoriteQuestion = useCallback(
        async (question: string, connection: string, query?: string) => {
          // Check if connection exists
          const connectionObj = connections.find(
            (conn) => conn.connectionName === connection
          );
          if (!connectionObj) {
            toast.error(
              "The connection for this favorite question no longer exists."
            );
            return;
          }

          // 1. Clear all state. This triggers a re-render.
          handleNewChat();

          // wait for the re-render to complete
          await new Promise((resolve) => setTimeout(resolve, 100));

          // 2. Set the new connection. This is batched with the clear.
          setSelectedConnection(connection);

          // 3. Queue the question to be asked *after* the re-render is complete.
          setQueuedQuestion({ question, connection, query });
        },
        [connections, handleNewChat, setSelectedConnection]
      );

      useEffect(() => {
        if (initialQuestion && onQuestionAsked && !connectionsLoading) {
          handleAskFavoriteQuestion(
            initialQuestion.text,
            initialQuestion.connection,
            initialQuestion.query
          );
          onQuestionAsked();
        }
      }, [
        initialQuestion,
        onQuestionAsked,
        handleAskFavoriteQuestion,
        connectionsLoading,
      ]);

      const handleConnectionSelect = useCallback(
        (value: string) => {
          if (value === "create-con") {
            onCreateConSelected();
          } else {
            setSelectedConnection(value);
          }
          setIsConnectionDropdownOpen(false);
        },
        [onCreateConSelected, setSelectedConnection]
      );

      const handlePdfClick = useCallback(
        async (connectionName: string, e: React.MouseEvent) => {
          e.stopPropagation();
          try {
            const response = await axios.get(
              `${API_URL}/api/connections/${connectionName}/atlas`,
              {
                headers: { Authorization: `Bearer ${token}` },
                responseType: "blob",
              }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `${connectionName}_data_atlas.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
          } catch (error) {
            console.error("Error downloading PDF:", error);
            toast.error("Failed to download Data Atlas PDF.");
          }
        },
        [token]
      );

      const handleSubmit = useCallback(
        (e: React.FormEvent) => {
          e.preventDefault();
          if (!input.trim() || !selectedConnection || isSubmitting) return;
          setIsSubmitting(true);
          askQuestion(input, selectedConnection);
          setInput("");
        },
        [askQuestion, input, selectedConnection, isSubmitting]
      );

      const handleToggleFavorite = useCallback(
        async (
          questionMessageId: string,
          questionContent: string,
          responseQuery: string,
          currentConnection: string,
          isCurrentlyFavorited: boolean
        ) => {
          try {
            const favEndpoint = isCurrentlyFavorited
              ? "unfavorite"
              : "favorite";
            await axios.post(`${API_URL}/${favEndpoint}`, {
              token,
              questionId: questionMessageId,
              questionContent: questionContent,
              currentConnection: currentConnection,
              responseQuery: responseQuery,
            });
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: questionMessageId,
              message: { isFavorited: !isCurrentlyFavorited },
            });
            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.questionMessageId === questionMessageId
                  ? { ...item, isFavorited: !isCurrentlyFavorited }
                  : item
              )
            );
          } catch (error) {
            console.error("Error toggling favorite:", error);
            toast.error("Failed to toggle favorite.");
          }
        },
        [token, dispatchMessages]
      );

      const handleUpdateReaction = useCallback(
        async (
          questionMessageId: string,
          reaction: "like" | "dislike" | null,
          dislike_reason: string | null
        ) => {
          const item = dashboardHistory.find(
            (i) => i.questionMessageId === questionMessageId
          );
          if (!item) return;
          try {
            await axios.post(
              `${API_URL}/api/messages/${item.botResponseId}/reaction`,
              {
                token,
                reaction,
                dislike_reason,
              }
            );
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: item.botResponseId,
              message: { reaction, dislike_reason },
            });
            setDashboardHistory((prev) =>
              prev.map((i) =>
                i.questionMessageId === questionMessageId
                  ? { ...i, reaction, dislike_reason }
                  : i
              )
            );
          } catch (error) {
            console.error("Error updating reaction:", error);
            toast.error("Failed to update reaction.");
          }
        },
        [token, dispatchMessages, dashboardHistory]
      );

      const handleSummarizeGraph = useCallback(async () => {
        const graphContainer = dashboardViewRef.current?.getGraphContainer();
        if (!graphContainer) {
          toast.error("No graph element to summarize.");
          return;
        }
        try {
          const canvas = await html2canvas(graphContainer, { scale: 2 });
          const imageData = canvas.toDataURL("image/png");
          const prompt = `Summarize the key insights from this graph image. Consider the current question: "${currentDashboardView.question}". Main View Data Query: ${currentDashboardView.mainViewData.queryData}. Focus on trends, anomalies, and overall patterns shown in the visual data.`;
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
          } else {
            console.error("Unexpected API response:", result);
            toast.error("Failed to get summary from AI.");
          }
        } catch (error) {
          console.error("Error summarizing graph:", error);
          toast.error("Failed to summarize graph.");
        }
      }, [currentDashboardView, theme]);

      const handleEditQuestion = useCallback(
        async (questionMessageId: string, newQuestion: string) => {
          if (!newQuestion.trim() || !selectedConnection) return;
          const userMessage = messages.find((m) => m.id === questionMessageId);
          if (!userMessage) return;
          try {
            await axios.put(`${API_URL}/api/messages/${questionMessageId}`, {
              token,
              content: newQuestion,
              timestamp: new Date().toISOString(),
              status: "normal", // <-- MODIFIED
            });
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: questionMessageId,
              message: {
                content: newQuestion,
                timestamp: new Date().toISOString(),
                status: "normal", // <-- MODIFIED
              },
            });
            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.questionMessageId === questionMessageId
                  ? {
                    ...item,
                    question: newQuestion,
                    ...getDashboardLoadingState(), // Set to loading
                    isError: false,
                  }
                  : item
              )
            );

            const botMessage = messages.find(
              (m) => m.isBot && m.parentId === questionMessageId
            );
            let botMessageToUpdateId = botMessage?.id;

            if (botMessageToUpdateId) {
              await axios.put(
                `${API_URL}/api/messages/${botMessageToUpdateId}`,
                {
                  token,
                  content: "loading...",
                  timestamp: new Date().toISOString(),
                  status: "loading", // <-- MODIFIED
                }
              );
              dispatchMessages({
                type: "UPDATE_MESSAGE",
                id: botMessageToUpdateId,
                message: {
                  content: "loading...",
                  timestamp: new Date().toISOString(),
                  status: "loading", // <-- MODIFIED
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
                  parentId: questionMessageId,
                  status: "loading", // <-- MODIFIED
                }
              );
              botMessageToUpdateId = botLoadingResponse.data.id;
              const newBotLoadingMessage: Message = {
                id: botMessageToUpdateId,
                content: "loading...",
                isBot: true,
                timestamp: new Date().toISOString(),
                isFavorited: false,
                parentId: questionMessageId,
                status: "loading", // <-- MODIFIED
              };
              dispatchMessages({
                type: "ADD_MESSAGE",
                message: newBotLoadingMessage,
              });
            }

            // Update dashboard history again to set the new botResponseId
            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.questionMessageId === questionMessageId
                  ? { ...item, botResponseId: botMessageToUpdateId! }
                  : item
              )
            );

            try {
              const connectionObj = connections.find(
                (conn) => conn.connectionName === selectedConnection
              );
              // Create a new AbortController for this request
              const controller = new AbortController();
              setActiveRequestController(controller); // Store it in state

              const payload = {
                question: newQuestion,
                connection: connectionObj,
                sessionId,
              };
              const response = await axios.post(
                `${CHATBOT_API_URL}/ask`,
                payload,
                {
                  signal: controller.signal, // <-- Pass the signal here
                }
              );

              // If we get here, the request was NOT cancelled
              setActiveRequestController(null);

              // Keep full data for frontend (downloads, display)
              const botResponseContent = JSON.stringify(response.data, null, 2);

              // Create limited data for backend storage (500 rows max)
              const limitedResponseData = limitDataForBackend(response.data);
              const botResponseContentForBackend = JSON.stringify(limitedResponseData, null, 2);

              await axios.put(
                `${API_URL}/api/messages/${botMessageToUpdateId}`,
                {
                  token,
                  content: botResponseContentForBackend,
                  timestamp: new Date().toISOString(),
                  status: "normal", // <-- MODIFIED
                }
              );
              dispatchMessages({
                type: "UPDATE_MESSAGE",
                id: botMessageToUpdateId!,
                message: {
                  content: botResponseContent,
                  timestamp: new Date().toISOString(),
                  status: "normal", // <-- MODIFIED
                },
              });

              // Update dashboard item
              try {
                const botResponseContentParsed = JSON.parse(botResponseContent);
                const actualKpiData =
                  botResponseContentParsed.kpiData || initialEmptyKpiData;
                const actualMainViewData = {
                  chartData: Array.isArray(botResponseContentParsed.answer)
                    ? botResponseContentParsed.answer
                    : [],
                  tableData: Array.isArray(botResponseContentParsed.answer)
                    ? botResponseContentParsed.answer
                    : [],
                  queryData:
                    typeof botResponseContentParsed.sql_query === "string"
                      ? botResponseContentParsed.sql_query
                      : "No query available.",
                };
                const actualTextualSummary =
                  botResponseContentParsed.textualSummary ||
                  `Here is the analysis for: "${newQuestion}"`;

                setDashboardHistory((prev) =>
                  prev.map((item) =>
                    item.questionMessageId === questionMessageId
                      ? {
                        ...item,
                        kpiData: actualKpiData,
                        mainViewData: actualMainViewData,
                        textualSummary: actualTextualSummary,
                        isError: false,
                      }
                      : item
                  )
                );
              } catch (parseError) {
                console.error(
                  "Failed to parse bot response for edited question:",
                  parseError
                );
                setDashboardHistory((prev) =>
                  prev.map((item) =>
                    item.questionMessageId === questionMessageId
                      ? {
                        ...item,
                        ...getDashboardErrorState(
                          newQuestion,
                          "Sorry, an error occurred. Please try again."
                        ),
                        isError: true,
                      }
                      : item
                  )
                );
              }
            } catch (error) {
              // Clear the controller
              setActiveRequestController(null);
              const errorContent = getErrorMessage(error); // Get smart error message
              const errorStatus = "error"; // <-- ADDED

              // Check if the error was from cancellation
              if (
                axios.isCancel(error) ||
                (error as Error).name === "CanceledError"
              ) {
                console.log("Edit request cancelled by AbortController.");
                // handleStopRequest will update the UI
              } else {
                await axios.put(
                  `${API_URL}/api/messages/${botMessageToUpdateId}`,
                  {
                    token,
                    content: errorContent,
                    timestamp: new Date().toISOString(),
                    status: errorStatus, // <-- MODIFIED
                  }
                );
                dispatchMessages({
                  type: "UPDATE_MESSAGE",
                  id: botMessageToUpdateId!,
                  message: {
                    content: errorContent,
                    timestamp: new Date().toISOString(),
                    status: errorStatus, // <-- MODIFIED
                  },
                });
                setDashboardHistory((prev) =>
                  prev.map((item) =>
                    item.questionMessageId === questionMessageId
                      ? {
                        ...item,
                        ...getDashboardErrorState(newQuestion, errorContent),
                        isError: true,
                      }
                      : item
                  )
                );
              }
            }
          } catch (error) {
            console.error("Error updating user message:", error);
            toast.error("Failed to update question.");
          }
        },
        [
          selectedConnection,
          messages,
          connections,
          sessionId,
          token,
          dispatchMessages,
        ]
      );

      // --- FIXED handleRetry ---
      const handleRetry = useCallback(
        async (questionMessageId: string) => {
          // 1. Find all necessary components
          const itemToRetry = dashboardHistory.find(
            (item) => item.questionMessageId === questionMessageId
          );
          const userMessage = messages.find((m) => m.id === questionMessageId);

          if (!itemToRetry || !userMessage) {
            toast.error("Could not find original message to retry.");
            return;
          }

          const connectionName =
            itemToRetry.connectionName || selectedConnection;
          if (!connectionName) {
            toast.error("No connection is associated with this question.");
            return;
          }

          const connectionObj = connections.find(
            (conn) => conn.connectionName === connectionName
          );
          if (!connectionObj) {
            toast.error("Connection details not found for retry.");
            return;
          }

          if (!sessionId) {
            toast.error("Session ID is missing, cannot retry.");
            return;
          }

          const questionContent = userMessage.content;
          let botMessageToUpdateId = itemToRetry.botResponseId;

          try {
            // 2. Set Dashboard to loading state
            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.questionMessageId === questionMessageId
                  ? {
                    ...item,
                    ...getDashboardLoadingState(),
                    isError: false,
                  }
                  : item
              )
            );

            // 3. Update/Create Bot Message to "loading..."
            if (botMessageToUpdateId) {
              await axios.put(
                `${API_URL}/api/messages/${botMessageToUpdateId}`,
                {
                  token,
                  content: "loading...",
                  timestamp: new Date().toISOString(),
                  status: "loading", // <-- MODIFIED
                }
              );
              dispatchMessages({
                type: "UPDATE_MESSAGE",
                id: botMessageToUpdateId,
                message: {
                  content: "loading...",
                  timestamp: new Date().toISOString(),
                  status: "loading", // <-- MODIFIED
                },
              });
            } else {
              // This case handles if the bot message was missing or failed to create
              const botLoadingResponse = await axios.post(
                `${API_URL}/api/messages`,
                {
                  token,
                  session_id: sessionId,
                  content: "loading...",
                  isBot: true,
                  isFavorited: false,
                  parentId: questionMessageId,
                  status: "loading", // <-- MODIFIED
                }
              );
              botMessageToUpdateId = botLoadingResponse.data.id;
              const newBotLoadingMessage: Message = {
                id: botMessageToUpdateId,
                content: "loading...",
                isBot: true,
                timestamp: new Date().toISOString(),
                isFavorited: false,
                parentId: questionMessageId,
                status: "loading", // <-- MODIFIED
              };
              dispatchMessages({
                type: "ADD_MESSAGE",
                message: newBotLoadingMessage,
              });
              // Update history item with the new bot ID
              setDashboardHistory((prev) =>
                prev.map((item) =>
                  item.questionMessageId === questionMessageId
                    ? { ...item, botResponseId: botMessageToUpdateId }
                    : item
                )
              );
            }

            // 4. Call /ask endpoint
            try {
              const controller = new AbortController();
              setActiveRequestController(controller);

              const payload = {
                question: questionContent,
                connection: connectionObj,
                sessionId,
              };
              const response = await axios.post(
                `${CHATBOT_API_URL}/ask`,
                payload,
                { signal: controller.signal }
              );

              setActiveRequestController(null);

              // Keep full data for frontend (downloads, display)
              const botResponseContent = JSON.stringify(response.data, null, 2);

              // Create limited data for backend storage (500 rows max)
              const limitedResponseData = limitDataForBackend(response.data);
              const botResponseContentForBackend = JSON.stringify(limitedResponseData, null, 2);

              // 5. Handle Success
              await axios.put(
                `${API_URL}/api/messages/${botMessageToUpdateId}`,
                {
                  token,
                  content: botResponseContentForBackend,
                  timestamp: new Date().toISOString(),
                  status: "normal", // <-- MODIFIED
                }
              );
              dispatchMessages({
                type: "UPDATE_MESSAGE",
                id: botMessageToUpdateId,
                message: {
                  content: botResponseContent,
                  timestamp: new Date().toISOString(),
                  status: "normal", // <-- MODIFIED
                },
              });

              // Parse and update dashboard
              const botResponseContentParsed = JSON.parse(botResponseContent);
              const actualKpiData =
                botResponseContentParsed.kpiData || initialEmptyKpiData;
              const actualMainViewData = {
                chartData: Array.isArray(botResponseContentParsed.answer)
                  ? botResponseContentParsed.answer
                  : [],
                tableData: Array.isArray(botResponseContentParsed.answer)
                  ? botResponseContentParsed.answer
                  : [],
                queryData:
                  typeof botResponseContentParsed.sql_query === "string"
                    ? botResponseContentParsed.sql_query
                    : "No query available.",
              };
              const actualTextualSummary =
                botResponseContentParsed.textualSummary ||
                `Here is the analysis for: "${questionContent}"`;

              setDashboardHistory((prev) =>
                prev.map((item) =>
                  item.questionMessageId === questionMessageId
                    ? {
                      ...item,
                      kpiData: actualKpiData,
                      mainViewData: actualMainViewData,
                      textualSummary: actualTextualSummary,
                      isError: false,
                    }
                    : item
                )
              );
            } catch (error) {
              // 6. Handle Failure
              setActiveRequestController(null);
              const errorContent = getErrorMessage(error);
              const errorStatus = "error"; // <-- ADDED

              if (
                axios.isCancel(error) ||
                (error as Error).name === "CanceledError"
              ) {
                console.log("Retry request cancelled by AbortController.");
                // handleStopRequest will update the UI
              } else {
                await axios.put(
                  `${API_URL}/api/messages/${botMessageToUpdateId}`,
                  {
                    token,
                    content: errorContent,
                    timestamp: new Date().toISOString(),
                    status: errorStatus, // <-- MODIFIED
                  }
                );
                dispatchMessages({
                  type: "UPDATE_MESSAGE",
                  id: botMessageToUpdateId,
                  message: {
                    content: errorContent,
                    timestamp: new Date().toISOString(),
                    status: errorStatus, // <-- MODIFIED
                  },
                });
                setDashboardHistory((prev) =>
                  prev.map((item) =>
                    item.questionMessageId === questionMessageId
                      ? {
                        ...item,
                        ...getDashboardErrorState(
                          questionContent,
                          errorContent
                        ),
                        isError: true,
                      }
                      : item
                  )
                );
              }
            }
          } catch (error) {
            // This catches errors in the *setup* (e.g., updating to "loading...")
            console.error("Error setting up retry:", error);
            const errorMsg = getErrorMessage(error);
            toast.error(`Failed to start retry: ${errorMsg}`);
            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.questionMessageId === questionMessageId
                  ? {
                    ...item,
                    ...getDashboardErrorState(questionContent, errorMsg),
                    isError: true,
                  }
                  : item
              )
            );
          }
        },
        [
          dashboardHistory,
          messages,
          selectedConnection,
          connections,
          sessionId,
          token,
          dispatchMessages,
        ]
      );

      const handleSelectPrevQuestion = useCallback(
        async (messageId: string) => {
          // 1. Try to find the question in the currently loaded dashboard history
          const targetIndex = dashboardHistory.findIndex(
            (item) => item.questionMessageId === messageId
          );

          if (targetIndex !== -1) {
            // Found it! Switch to this view
            setCurrentHistoryIndex(targetIndex);
            setCurrentQuestionId(messageId);

            // Persist immediately
            localStorage.setItem("currentDashboardQuestionId", messageId);

            // Restore the view type (graph/table/query) that was used for this item
            setCurrentMainViewType(dashboardHistory[targetIndex].lastViewType || "table");
            setGraphSummary(null);
          } else {
            // 2. Edge Case: If not in history stack (rare), reconstruct it from messages
            const selectedUserMessage = messages.find(
              (m) => m.id === messageId && !m.isBot
            );

            if (selectedUserMessage) {
              const correspondingBotMessages = messages.filter(
                (m) => m.isBot && m.parentId === messageId
              );
              const latestBotMessage = correspondingBotMessages.sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime()
              )[0];

              const newEntry = createDashboardItemFromMessages(
                selectedUserMessage,
                latestBotMessage,
                selectedConnection
              );

              if (newEntry) {
                setDashboardHistory((prev) => {
                  const newHistory = [...prev, newEntry];
                  setCurrentHistoryIndex(newHistory.length - 1); // Go to new last item
                  return newHistory;
                });

                localStorage.setItem(
                  "currentDashboardQuestionId",
                  selectedUserMessage.id
                );
                setCurrentQuestionId(selectedUserMessage.id);
              }
            } else {
              console.error("User message not found in session by ID:", messageId);
              toast.error("Could not load the selected previous question.");
            }
          }
          setShowPrevQuestionsModal(false);
        },
        [dashboardHistory, messages, selectedConnection]
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
          setGraphSummary(null);
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
                </div>
              </div>
            </div>
          )}

          <main className="flex-grow flex flex-col items-center overflow-y-auto">
            <div className="w-full flex-grow flex flex-col">
              {(() => {
                if (connectionsLoading) {
                  return (
                    <div className="flex justify-center items-center flex-grow">
                      <Loader text="Loading connections..." />
                    </div>
                  );
                }
                if (connections.length === 0 && !connectionsLoading) {
                  return (
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
                  );
                }

                // --- FIX: ADDED GUARD ---
                // This guard prevents a crash if `currentDashboardView` is
                // temporarily undefined during rapid state updates (like in handleRetry).
                if (!currentDashboardView) {
                  return (
                    <div className="flex justify-center items-center flex-grow">
                      <Loader text="Loading dashboard..." />
                    </div>
                  );
                }
                // --- END FIX ---

                if (showDashboardContent) {
                  if (
                    isSubmitting &&
                    currentDashboardView.textualSummary ===
                    "Processing your request..."
                  ) {
                    return (
                      <DashboardSkeletonLoader
                        question={currentDashboardView.question}
                        theme={theme}
                      />
                    );
                  }
                  if (currentDashboardView.isError) {
                    return (
                      <DashboardError
                        question={currentDashboardView.question}
                        errorMessage={currentDashboardView.textualSummary}
                        theme={theme}
                        onEditQuestion={(newQuestion) =>
                          handleEditQuestion(
                            currentDashboardView.questionMessageId,
                            newQuestion
                          )
                        }
                        onRetry={() =>
                          handleRetry(currentDashboardView.questionMessageId)
                        }
                        sessionConErr={!!sessionConnectionError}
                        botResponseId={currentDashboardView.botResponseId}
                        initialReaction={currentDashboardView.reaction}
                        questionMessageId={
                          currentDashboardView.questionMessageId
                        }
                        reaction={currentDashboardView.reaction}
                        onUpdateReaction={handleUpdateReaction}
                      />
                    );
                  }
                  return (
                    <DashboardView
                      ref={dashboardViewRef}
                      dashboardItem={currentDashboardView}
                      theme={theme}
                      isSubmitting={isSubmitting}
                      activeViewType={currentMainViewType}
                      onViewTypeChange={handleViewTypeChange}
                      onNavigateHistory={navigateDashboardHistory}
                      historyIndex={currentHistoryIndex}
                      historyLength={dashboardHistory.length}
                      onToggleFavorite={handleToggleFavorite}
                      sessionConErr={!!sessionConnectionError}
                      graphSummary={graphSummary}
                      onEditQuestion={handleEditQuestion}
                      onUpdateReaction={handleUpdateReaction}
                    />
                  );
                }
                return (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <h1
                      className={`text-3xl font-bold mb-4`}
                      style={{ marginTop: "10vh", color: theme.colors.text }}
                    >
                      Hello! I’m your Data Assistant. How can I help you today?
                    </h1>
                    {!selectedConnection && connections.length > 0 && (
                      <div className="flex flex-col items-center mb-6">
                        <p
                          className={`mb-4`}
                          style={{ color: theme.colors.textSecondary }}
                        >
                          You need to select a data connection first:
                        </p>
                      </div>
                    )}
                    {selectedConnection && recommendedQuestions.length > 0 && (
                      <RecommendedQuestions
                        questions={recommendedQuestions}
                        onQuestionClick={handleAskFavoriteQuestion}
                      />
                    )}
                  </div>
                );
              })()}
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

          {connections.length > 0 && (
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
                      disabled={isSubmitting || !!sessionConnectionError}
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
                    onClick={() => {
                      setIsDbExplorerOpen((prev) => !prev);
                      setIsConnectionDropdownOpen(false);
                    }}
                    disabled={
                      isSubmitting ||
                      !selectedConnection ||
                      !!sessionConnectionError
                    }
                    className={`p-2.5 shadow-lg rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 ${isDbExplorerOpen ? "schema-active" : ""
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
                  onSelect={handleConnectionSelect}
                  onNewChat={handleNewChat}
                  disabled={
                    isSubmitting ||
                    !!sessionConnectionError ||
                    (!selectedConnection && connections.length > 0)
                  }
                  isDbExplorerOpen={isDbExplorerOpen}
                  setIsDbExplorerOpen={setIsDbExplorerOpen}
                  onStopRequest={handleStopRequest}
                />
                <CustomTooltip title="View Previous Questions" position="top">
                  <button
                    title="View Previous Questions"
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
                {showDashboardContent &&
                  !currentDashboardView.isError &&
                  currentDashboardView.mainViewData.chartData.length > 0 && false && (
                    <CustomTooltip title="Summarize Graph" position="top">
                      <button
                        type="button"
                        title="Summarize Graph"
                        onClick={handleSummarizeGraph}
                        disabled={
                          isSubmitting ||
                          currentDashboardView.mainViewData.chartData.length ===
                          0
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
          )}

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
  prevProps: DashboardInterfaceProps,
  nextProps: DashboardInterfaceProps
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

export default memo(DashboardInterface, areEqual);
