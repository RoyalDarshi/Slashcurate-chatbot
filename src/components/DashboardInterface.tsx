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
import axiosInstance from "axios";
import { ToastContainer, toast } from "react-toastify";
import {
  Message,
  Connection,
  ChatInterfaceProps as DashboardInterfaceProps,
} from "../types";
import { API_URL, CHATBOT_API_URL } from "../config";
import DashboardInput from "./DashboardInput";
import Loader from "./Loader";
import { useTheme } from "../ThemeContext";
import RecommendedQuestions from "./RecommendedQuestions";
import CustomTooltip from "./CustomTooltip";

import { useSettings } from "../SettingsContext";
import DashboardView, { DashboardViewHandle } from "./DashboardView";
import SchemaExplorer from "./SchemaExplorer";
import DashboardSkeletonLoader from "./DashboardSkeletonLoader";
import { DatabaseSchema } from "../types";
import { connectionService } from "../services/connectionService";
import DashboardError from "./DashboardError";
import PreviousQuestionsDrawer from "./PreviousQuestionsDrawer";
import html2canvas from "html2canvas";
import { FaFilePdf } from "react-icons/fa";
import ConnectionForm from "./ConnectionForm";
import {
  ListChecks,
  Database,
  Layers,
  PlusCircle,
  AlertCircle,
  Sparkles,
  MessageSquare,
  X,
  Plus,
  Check,
  ChevronDown,
} from "lucide-react";

export type DashboardInterfaceHandle = {
  handleNewChat: () => void;
  handleAskFavoriteQuestion: (
    question: string,
    connection: string,
    query?: string,
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

interface QueuedQuestion {
  question: string;
  connection: string;
  query?: string;
  forceNewSession?: boolean;
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

const getDashboardErrorState = (
  question: string,
  errorMsg: string,
  reaction: "like" | "dislike" | null = null,
  dislike_reason: string | null = null
) => ({
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
  reaction: reaction,
  dislike_reason: dislike_reason,
  isError: true,
});

const getErrorMessage = (error: any): string => {
  if (
    axiosInstance.isCancel(error) ||
    (error as Error).name === "CanceledError"
  ) {
    return "Operation cancelled by user request.";
  }
  let extractedErrorMessage =
    "An analytical discrepancy occurred. Please retry.";
  if (axiosInstance.isAxiosError(error)) {
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
  return extractedErrorMessage;
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

const sanitizeReaction = (reaction: any): "like" | "dislike" | null => {
  return reaction === "like" || reaction === "dislike" ? reaction : null;
};

const createDashboardItemFromMessages = (
  userMessage: Message,
  botMessage: Message | undefined,
  connectionName: string,
): DashboardItem | null => {
  const baseItem = {
    id: generateId(),
    question: userMessage.content,
    lastViewType: "table" as const,
    isFavorited: userMessage.isFavorited,
    questionMessageId: userMessage.id,
    connectionName: connectionName,
    reaction: botMessage ? sanitizeReaction(botMessage.reaction) : null,
    dislike_reason: botMessage ? (botMessage.dislike_reason ?? null) : null,
    botResponseId: botMessage ? botMessage.id : "",
    isError: false,
  };

  if (!botMessage) {
    return null;
  } else if (botMessage.status === "loading") {
    return { ...baseItem, ...getDashboardLoadingState(), isError: false };
  } else if (botMessage.status === "error") {
    return {
      ...baseItem,
      ...getDashboardErrorState(
        userMessage.content,
        botMessage.content,
        baseItem.reaction,
        baseItem.dislike_reason
      ),
      isError: true,
    };
  } else {
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
        parseError,
      );
      return {
        ...baseItem,
        ...getDashboardErrorState(
          userMessage.content,
          "Sorry, an error occurred. Please try again.",
          baseItem.reaction,
          baseItem.dislike_reason
        ),
        isError: true,
      };
    }
  }
};

const DashboardInterface = memo(
  forwardRef<DashboardInterfaceHandle, DashboardInterfaceProps>(
    (
      {
        onCreateConSelected,
        initialQuestion,
        onQuestionAsked,
        connections,
        selectedConnection,
        setSelectedConnection,
        connectionError,
        connectionsLoading,
        sessionId,
        messages,
        dispatchMessages,
        sessionConnection,
        loadSession,
        clearSession,
        recommendedQuestions,
      },
      ref,
    ) => {
      const { theme } = useTheme();
      const { currentView, setCurrentView } = useSettings();
      const token = sessionStorage.getItem("token") ?? "";

      const connectionDropdownRef = useRef<HTMLDivElement>(null);
      const dashboardViewRef = useRef<DashboardViewHandle>(null);

      const [input, setInput] = useState("");
      const [isDbExplorerOpen, setIsDbExplorerOpen] = useState(false);
      const [isInputFocused, setIsInputFocused] = useState(false);
      const [isConnectionDropdownOpen, setIsConnectionDropdownOpen] =
        useState(false);
      const [showCreateConnectionModal, setShowCreateConnectionModal] = useState(false);
      const [schemaData, setSchemaData] = useState<DatabaseSchema[] | null>(null);
      const [schemaLoading, setSchemaLoading] = useState(false);
      const [schemaError, setSchemaError] = useState<string | null>(null);
      const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(
        null,
      );
      const [graphSummary, setGraphSummary] = useState<string | null>(null);
      const [sessionConnectionError, setSessionConnectionError] = useState<
        string | null
      >(null);
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [activeRequestController, setActiveRequestController] =
        useState<AbortController | null>(null);
      const [queuedQuestion, setQueuedQuestion] =
        useState<QueuedQuestion | null>(null);

      const options = [
        { value: "create-con", label: "Create New Connection", isAdmin: false },
        ...connections.map((connection: Connection) => ({
          value: connection.connectionName,
          label: connection.connectionName,
          isAdmin: connection.isAdmin,
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
        [],
      );

      const [dashboardHistory, setDashboardHistory] = useState<DashboardItem[]>(
        [initialDashboardState],
      );
      const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
      const [currentMainViewType, setCurrentMainViewType] = useState<
        "graph" | "table" | "query"
      >("table");
      const [showPrevQuestionsModal, setShowPrevQuestionsModal] =
        useState(false);

      const currentDashboardView = dashboardHistory[currentHistoryIndex];

      useEffect(() => {
        setDashboardHistory((prevHistory) => {
          let hasChanges = false;
          const newHistory = prevHistory.map((item) => {
            const matchedQuestion = messages.find((m) => m.id === item.questionMessageId);
            const matchedResponse = messages.find((m) => m.id === item.botResponseId);
            
            if (matchedQuestion || matchedResponse) {
              const newIsFavorited = matchedQuestion ? matchedQuestion.isFavorited : item.isFavorited;
              const newReaction = matchedResponse ? matchedResponse.reaction : item.reaction;
              const newDislikeReason = matchedResponse ? matchedResponse.dislike_reason : item.dislike_reason;
              
              if (
                item.isFavorited !== newIsFavorited ||
                item.reaction !== newReaction ||
                item.dislike_reason !== newDislikeReason
              ) {
                hasChanges = true;
                return {
                  ...item,
                  isFavorited: newIsFavorited || false,
                  reaction: newReaction || null,
                  dislike_reason: newDislikeReason || null,
                };
              }
            }
            return item;
          });
          return hasChanges ? newHistory : prevHistory;
        });
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
              const response = await axiosInstance.post(
                `${API_URL}/api/getmessages/${msg.id}`,
                { token },
                { headers: { Authorization: `Bearer ${token}` } },
              );

              if (response.data.status !== "loading") {
                dispatchMessages({
                  type: "UPDATE_MESSAGE",
                  id: msg.id,
                  message: {
                    content: response.data.content,
                    timestamp: response.data.timestamp,
                    reaction: sanitizeReaction(response.data.reaction),
                    dislike_reason: response.data.dislike_reason ?? null,
                    status: response.data.status,
                  },
                });

                setDashboardHistory((prev) =>
                  prev.map((item) => {
                    if (item.botResponseId === msg.id) {
                      if (response.data.status === "error") {
                        return {
                          ...item,
                          ...getDashboardErrorState(
                            item.question,
                            response.data.content,
                            sanitizeReaction(response.data.reaction),
                            response.data.dislike_reason ?? null
                          ),
                          isError: true,
                        };
                      } else {
                        try {
                          const botResponseContent = JSON.parse(
                            response.data.content,
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
                            parseError,
                          );
                          return {
                            ...item,
                            ...getDashboardErrorState(
                              item.question,
                              "Sorry, an error occurred. Please try again.",
                              item.reaction,
                              item.dislike_reason
                            ),
                            isError: true,
                          };
                        }
                      }
                    }
                    return item;
                  }),
                );
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
            "This session was loaded but has no associated connection. You can view history or start a new chat.",
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
        const handleSessionLoad = async () => {
          if (currentView !== "dashboard") return;
          const storedSessionId = localStorage.getItem("currentSessionId");
          const storedCurrentQuestionId = localStorage.getItem(
            "currentDashboardQuestionId",
          );

          if (storedSessionId && connections.length > 0) {
            try {
              const response = await axiosInstance.get(
                `${API_URL}/api/sessions/${storedSessionId}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                },
              );
              const sessionData = response.data;
              await loadSession(storedSessionId);

              const userMessages = sessionData.messages
                .filter((msg: Message) => !msg.isBot)
                .sort(
                  (a: Message, b: Message) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime(),
                );

              const botMessagesByParentId = new Map<string, Message[]>();
              sessionData.messages
                .filter((msg: Message) => msg.isBot && msg.parentId)
                .forEach((msg: Message) => {
                  if (!botMessagesByParentId.has(msg.parentId!))
                    botMessagesByParentId.set(msg.parentId!, []);
                  botMessagesByParentId.get(msg.parentId!)!.push(msg);
                });

              const loadedDashboardHistory: DashboardItem[] = [];

              for (const userMessage of userMessages) {
                const correspondingBotMessages = botMessagesByParentId.get(
                  userMessage.id,
                );
                const latestBotMessage = correspondingBotMessages?.sort(
                  (a: Message, b: Message) =>
                    new Date(b.timestamp).getTime() -
                    new Date(a.timestamp).getTime(),
                )[0];

                const dashboardItem = createDashboardItemFromMessages(
                  userMessage,
                  latestBotMessage,
                  sessionData.connection,
                );
                if (dashboardItem) loadedDashboardHistory.push(dashboardItem);
              }

              if (loadedDashboardHistory.length > 0) {
                const foundIndex = loadedDashboardHistory.findIndex(
                  (item) => item.questionMessageId === storedCurrentQuestionId,
                );
                const restoredIndex =
                  foundIndex !== -1
                    ? foundIndex
                    : loadedDashboardHistory.length - 1;

                setDashboardHistory(loadedDashboardHistory);
                setCurrentHistoryIndex(restoredIndex);
                setCurrentQuestionId(
                  loadedDashboardHistory[restoredIndex].questionMessageId,
                );
                setCurrentMainViewType(
                  loadedDashboardHistory[restoredIndex].lastViewType || "table",
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
        currentView,
      ]);

      useEffect(() => {
        if (currentDashboardView?.questionMessageId) {
          localStorage.setItem(
            "currentDashboardQuestionId",
            currentDashboardView.questionMessageId,
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
        if (isConnectionDropdownOpen)
          document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }, [isConnectionDropdownOpen]);

      const toggleConnectionDropdown = useCallback(() => {
        if (isDbExplorerOpen) setIsDbExplorerOpen(false);
        setIsConnectionDropdownOpen((prev) => !prev);
      }, [isDbExplorerOpen]);

      const toggleDbExplorer = useCallback(() => {
        setIsDbExplorerOpen((prev) => !prev);
        setIsConnectionDropdownOpen(false);
      }, []);

      // Fetch real schema whenever the explorer is opened (or connection changes while open)
      useEffect(() => {
        if (!isDbExplorerOpen || !selectedConnection) return;
        const connectionObj = connections.find(
          (c) => c.connectionName === selectedConnection
        );
        if (!connectionObj?.id) return;

        setSchemaLoading(true);
        setSchemaError(null);
        setSchemaData(null);

        connectionService.getSchema(connectionObj.id as number)
          .then((schemas) => {
            setSchemaData(schemas);
          })
          .catch((err) => {
            const msg =
              err?.response?.data?.error ||
              err?.message ||
              "Failed to load schema";
            setSchemaError(msg);
          })
          .finally(() => {
            setSchemaLoading(false);
          });
      }, [isDbExplorerOpen, selectedConnection, connections]);

      // Clear schema when connection changes so stale data isn't shown
      useEffect(() => {
        setSchemaData(null);
        setSchemaError(null);
      }, [selectedConnection]);

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

      const askQuestion = useCallback(
        async (question: string, connection: string, query?: string, forceNewSession: boolean = false) => {
          if (!connection) {
            toast.error("No connection provided.");
            return;
          }

          setIsSubmitting(true);
          const tempUserMsgId = `temp-user-${Date.now()}`;
          const tempBotMsgId = `temp-bot-${Date.now()}`;
          const newLoadingEntryId = generateId();

          const newLoadingEntry: DashboardItem = {
            id: newLoadingEntryId,
            question: question,
            questionMessageId: tempUserMsgId,
            connectionName: connection,
            ...getDashboardLoadingState(),
            lastViewType: "table",
            isFavorited: false,
            reaction: null,
            dislike_reason: null,
            botResponseId: tempBotMsgId,
            isError: false,
          };

          setDashboardHistory((prev) => {
            return currentHistoryIndex === prev.length - 1
              ? [...prev, newLoadingEntry]
              : [...prev.slice(0, currentHistoryIndex + 1), newLoadingEntry];
          });
          setCurrentHistoryIndex((prevIndex) => prevIndex + 1);
          setGraphSummary(null);

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

          let currentSessionId = forceNewSession ? null : sessionId;

          if (currentSessionId && !sessionConnection) {
            const currentSessionInfo = connections.find(
              (c) => c.connectionName === selectedConnection,
            );
            if (!currentSessionInfo && messages.length > 0) {
              toast.error("This session does not have a valid connection.");
              setDashboardHistory((prev) =>
                prev.map((item) =>
                  item.id === newLoadingEntryId
                    ? {
                        ...item,
                        ...getDashboardErrorState(
                          question,
                          "Invalid connection",
                        ),
                        isError: true,
                      }
                    : item,
                ),
              );
              dispatchMessages({
                type: "UPDATE_MESSAGE",
                id: tempBotMsgId,
                message: {
                  content: "This session does not have a valid connection.",
                  timestamp: new Date().toISOString(),
                  status: "error",
                  reaction: null,
                  dislike_reason: null,
                },
              });
              setIsSubmitting(false);
              return;
            }
          }

          let realUserMsgId = "";
          let realBotMsgId = "";

          try {
            if (!currentSessionId) {
              try {
                const connectionObj = connections.find((c) => c.connectionName === connection);
                const response = await axiosInstance.post(
                  `${API_URL}/api/sessions`,
                  {
                    token,
                    currentConnection: connection,
                    con_id: connectionObj?.id ?? "",
                    title: question.substring(0, 50) + "...",
                  },
                  { headers: { "Content-Type": "application/json" } },
                );
                currentSessionId = response.data.id;
                localStorage.setItem(
                  "currentSessionId",
                  currentSessionId || "",
                );

                dispatchMessages({
                  type: "SET_SESSION",
                  sessionId: currentSessionId || "",
                  messages: [
                    {
                      id: tempUserMsgId,
                      content: question,
                      isBot: false,
                      timestamp: new Date().toISOString(),
                      isFavorited: false,
                      parentId: null,
                      status: "normal",
                    },
                    {
                      id: tempBotMsgId,
                      isBot: true,
                      content: "loading...",
                      timestamp: new Date().toISOString(),
                      isFavorited: false,
                      parentId: tempUserMsgId,
                      status: "loading",
                    },
                  ],
                  connection: connection,
                });
              } catch (error) {
                throw new Error(
                  "Failed to create session: " + getErrorMessage(error),
                );
              }
            }

            const userResponse = await axiosInstance.post(
              `${API_URL}/api/messages`,
              {
                token,
                session_id: currentSessionId,
                content: question,
                isBot: false,
                isFavorited: false,
                parentId: null,
                status: "normal",
              },
              { headers: { "Content-Type": "application/json" } },
            );
            realUserMsgId = userResponse.data.id;
            const isFavorited = userResponse.data.isFavorited;

            dispatchMessages({
              type: "REPLACE_MESSAGE_ID",
              oldId: tempUserMsgId,
              newId: realUserMsgId,
            });
            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.id === newLoadingEntryId
                  ? { ...item, questionMessageId: realUserMsgId, isFavorited }
                  : item,
              ),
            );

            const botLoadingResponse = await axiosInstance.post(
              `${API_URL}/api/messages`,
              {
                token,
                session_id: currentSessionId,
                content: "loading...",
                isBot: true,
                isFavorited: false,
                parentId: realUserMsgId,
                status: "loading",
              },
              { headers: { "Content-Type": "application/json" } },
            );
            realBotMsgId = botLoadingResponse.data.id;

            dispatchMessages({
              type: "REPLACE_MESSAGE_ID",
              oldId: tempBotMsgId,
              newId: realBotMsgId,
            });
            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.id === newLoadingEntryId
                  ? { ...item, botResponseId: realBotMsgId }
                  : item,
              ),
            );

            const connectionObj = connections.find(
              (conn) => conn.connectionName === connection,
            );
            if (!connectionObj) throw new Error("Connection not found.");

            const connectionPayload = {
              ...connectionObj,
              password: connectionObj.password || "",
            };

            const controller = new AbortController();
            setActiveRequestController(controller);

            const payload = query
              ? {
                  question,
                  sql_query: query,
                  connection: connectionPayload,
                  sessionId: currentSessionId,
                }
              : {
                  question,
                  connection: connectionPayload,
                  sessionId: currentSessionId,
                };

            const response = await axiosInstance.post(
              `${CHATBOT_API_URL}/ask`,
              payload,
              { signal: controller.signal },
            );
            setActiveRequestController(null);
            const responseData = response.data;

            let finalStatus: Message["status"] = "normal";
            let finalContent = "";

            if (
              responseData.execution_status === "Failed" ||
              responseData.data_availability === "Execution Error"
            ) {
              finalStatus = "error";
              let errorMsg = "Query execution failed.";
              if (responseData.answer && responseData.answer.error) {
                errorMsg = responseData.answer.error.message || errorMsg;
                if (responseData.answer.error.db2_raw)
                  errorMsg += `\n\nDetails: ${responseData.answer.error.db2_raw}`;
              }
              finalContent = errorMsg;
            } else {
              finalContent = JSON.stringify(responseData, null, 2);
            }

            const contentForBackend =
              finalStatus === "normal"
                ? JSON.stringify(limitDataForBackend(responseData), null, 2)
                : finalContent;

            await axiosInstance.put(
              `${API_URL}/api/messages/${realBotMsgId}`,
              {
                token,
                content: contentForBackend,
                timestamp: new Date().toISOString(),
                status: finalStatus,
              },
              { headers: { "Content-Type": "application/json" } },
            );
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: realBotMsgId,
              message: {
                content: finalContent,
                timestamp: new Date().toISOString(),
                status: finalStatus,
              },
            });

            if (finalStatus === "error") {
              setDashboardHistory((prev) =>
                prev.map((item) =>
                  item.botResponseId === realBotMsgId
                    ? {
                        ...item,
                        ...getDashboardErrorState(question, finalContent),
                        isError: true,
                      }
                    : item,
                ),
              );
            } else {
              const actualKpiData = responseData.kpiData || initialEmptyKpiData;
              const actualMainViewData = {
                chartData: Array.isArray(responseData.answer)
                  ? responseData.answer
                  : [],
                tableData: Array.isArray(responseData.answer)
                  ? responseData.answer
                  : [],
                queryData:
                  typeof responseData.sql_query === "string"
                    ? responseData.sql_query
                    : "No query available.",
              };
              const actualTextualSummary =
                responseData.textualSummary ||
                `Here is the analysis for: "${question}"`;

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
                    : item,
                ),
              );
            }
          } catch (error) {
            setActiveRequestController(null);
            if (
              axiosInstance.isCancel(error) ||
              (error as Error).name === "CanceledError"
            )
              return;

            console.error("AskQuestion Error:", error);
            const errorContent = getErrorMessage(error);
            const targetBotId = realBotMsgId || tempBotMsgId;

            if (realBotMsgId) {
              await axiosInstance
                .put(`${API_URL}/api/messages/${realBotMsgId}`, {
                  token,
                  content: errorContent,
                  timestamp: new Date().toISOString(),
                  status: "error",
                })
                .catch((e) =>
                  console.error("Failed to sync error to backend", e),
                );
            }

            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: targetBotId,
              message: {
                content: errorContent,
                timestamp: new Date().toISOString(),
                status: "error",
              },
            });
            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.id === newLoadingEntryId
                  ? {
                      ...item,
                      ...getDashboardErrorState(question, errorContent),
                      isError: true,
                      questionMessageId:
                        realUserMsgId || item.questionMessageId,
                      botResponseId: targetBotId,
                    }
                  : item,
              ),
            );
          } finally {
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
          currentHistoryIndex,
          messages.length,
        ],
      );

      useEffect(() => {
        if (queuedQuestion && !isSubmitting && connections.length > 0) {
          const connectionObj = connections.find(
            (conn) => conn.connectionName === queuedQuestion.connection,
          );
          if (connectionObj) {
            askQuestion(
              queuedQuestion.question,
              queuedQuestion.connection,
              queuedQuestion.query,
              queuedQuestion.forceNewSession
            );
          } else {
            toast.error(`Connection "${queuedQuestion.connection}" not found.`);
          }
          setQueuedQuestion(null);
        }
      }, [queuedQuestion, isSubmitting, connections, askQuestion]);

      const handleStopRequest = useCallback(async () => {
        if (!isSubmitting) return;

        if (activeRequestController) {
          activeRequestController.abort();
          setActiveRequestController(null);
        }

        const errorMessage = "Request cancelled by user.";
        const errorStatus = "error";

        const loadingMessage = messages.find(
          (msg) => msg.isBot && msg.status === "loading",
        );

        if (loadingMessage && loadingMessage.id) {
          const loadingBotMessageId = loadingMessage.id;
          try {
            await axiosInstance.put(
              `${API_URL}/api/messages/${loadingBotMessageId}`,
              {
                token,
                content: errorMessage,
                timestamp: new Date().toISOString(),
                status: errorStatus,
              },
              { headers: { "Content-Type": "application/json" } },
            );
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: loadingBotMessageId,
              message: {
                content: errorMessage,
                timestamp: new Date().toISOString(),
                status: errorStatus,
              },
            });
            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.botResponseId === loadingBotMessageId
                  ? {
                      ...item,
                      ...getDashboardErrorState(item.question, errorMessage),
                      isError: true,
                    }
                  : item,
              ),
            );
          } catch (error) {
            console.error("Error cancelling request:", error);
            toast.error("Failed to cancel request.");
          }
        } else {
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
                  : item,
              );
            }
            return prev;
          });
        }
        setIsSubmitting(false);
      }, [
        isSubmitting,
        messages,
        token,
        dispatchMessages,
        activeRequestController,
      ]);

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
          await new Promise((resolve) => setTimeout(resolve, 100));
          setSelectedConnection(connection);
          setQueuedQuestion({ question, connection, query, forceNewSession: true });
        },
        [connections, handleNewChat, setSelectedConnection],
      );

      useEffect(() => {
        if (initialQuestion && onQuestionAsked && !connectionsLoading) {
          handleAskFavoriteQuestion(
            initialQuestion.text,
            initialQuestion.connection,
            initialQuestion.query,
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
            setShowCreateConnectionModal(true);
          } else {
            if (selectedConnection !== value) {
              handleNewChat();
              setSelectedConnection(value);
              localStorage.setItem("selectedConnection", value);
            }
          }
          setIsConnectionDropdownOpen(false);
        },
        [setSelectedConnection, selectedConnection, handleNewChat],
      );

      const handlePdfClick = useCallback(
        async (connectionName: string, e: React.MouseEvent) => {
          e.stopPropagation();
          try {
            const response = await axiosInstance.get(
              `${API_URL}/api/connections/${connectionName}/atlas`,
              {
                headers: { Authorization: `Bearer ${token}` },
                responseType: "blob",
              },
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
        [token],
      );

      const handleSubmit = useCallback(
        (e: React.FormEvent) => {
          e.preventDefault();
          if (!input.trim() || !selectedConnection || isSubmitting) return;
          setIsSubmitting(true);
          askQuestion(input, selectedConnection);
          setInput("");
        },
        [askQuestion, input, selectedConnection, isSubmitting],
      );

      const handleToggleFavorite = useCallback(
        async (
          questionMessageId: string,
          questionContent: string,
          responseQuery: string,
          currentConnection: string,
          isCurrentlyFavorited: boolean,
        ) => {
          try {
            const favEndpoint = isCurrentlyFavorited
              ? "unfavorite"
              : "favorite";
            await axiosInstance.post(`${API_URL}/${favEndpoint}`, {
              token,
              questionId: questionMessageId,
              questionContent: questionContent,
              currentConnection: currentConnection,
              con_id: connections.find(
                (c) => c.connectionName === currentConnection,
              )?.id ?? "",
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
                  : item,
              ),
            );
          } catch (error) {
            console.error("Error toggling favorite:", error);
            toast.error("Failed to toggle favorite.");
          }
        },
        [token, dispatchMessages],
      );

      const handleUpdateReaction = useCallback(
        async (
          questionMessageId: string,
          reaction: "like" | "dislike" | null,
          dislike_reason: string | null,
        ) => {
          const item = dashboardHistory.find(
            (i) => i.questionMessageId === questionMessageId,
          );
          if (!item) return;
          try {
            await axiosInstance.post(
              `${API_URL}/api/messages/${item.botResponseId}/reaction`,
              { token, reaction, dislike_reason },
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
                  : i,
              ),
            );
          } catch (error) {
            console.error("Error updating reaction:", error);
            toast.error("Failed to update reaction.");
          }
        },
        [token, dispatchMessages, dashboardHistory],
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
          const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
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
      }, [currentDashboardView]);

      const handleEditQuestion = useCallback(
        async (questionMessageId: string, newQuestion: string) => {
          if (!newQuestion.trim() || !selectedConnection) return;
          const userMessage = messages.find((m) => m.id === questionMessageId);
          if (!userMessage) return;
          try {
            await axiosInstance.put(
              `${API_URL}/api/messages/${questionMessageId}`,
              {
                token,
                content: newQuestion,
                timestamp: new Date().toISOString(),
                status: "normal",
              },
            );
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: questionMessageId,
              message: {
                content: newQuestion,
                timestamp: new Date().toISOString(),
                status: "normal",
              },
            });
            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.questionMessageId === questionMessageId
                  ? {
                      ...item,
                      question: newQuestion,
                      ...getDashboardLoadingState(),
                      isError: false,
                    }
                  : item,
              ),
            );

            const botMessage = messages.find(
              (m) => m.isBot && m.parentId === questionMessageId,
            );
            let botMessageToUpdateId = botMessage?.id;

            if (botMessageToUpdateId) {
              await axiosInstance.put(
                `${API_URL}/api/messages/${botMessageToUpdateId}`,
                {
                  token,
                  content: "loading...",
                  timestamp: new Date().toISOString(),
                  status: "loading",
                },
              );
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
              const botLoadingResponse = await axiosInstance.post(
                `${API_URL}/api/messages`,
                {
                  token,
                  session_id: sessionId,
                  content: "loading...",
                  isBot: true,
                  isFavorited: false,
                  parentId: questionMessageId,
                  status: "loading",
                },
              );
              botMessageToUpdateId = botLoadingResponse.data.id;
              dispatchMessages({
                type: "ADD_MESSAGE",
                message: {
                  id: botMessageToUpdateId,
                  content: "loading...",
                  isBot: true,
                  timestamp: new Date().toISOString(),
                  isFavorited: false,
                  parentId: questionMessageId,
                  status: "loading",
                },
              });
            }

            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.questionMessageId === questionMessageId
                  ? { ...item, botResponseId: botMessageToUpdateId! }
                  : item,
              ),
            );

            try {
              const connectionObj = connections.find(
                (conn) => conn.connectionName === selectedConnection,
              );
              const connectionPayload = connectionObj ? {
                ...connectionObj,
                password: connectionObj.password || "",
              } : undefined;
              const controller = new AbortController();
              setActiveRequestController(controller);

              const payload = {
                question: newQuestion,
                connection: connectionPayload,
                sessionId,
              };
              const response = await axiosInstance.post(
                `${CHATBOT_API_URL}/ask`,
                payload,
                { signal: controller.signal },
              );
              setActiveRequestController(null);

              const botResponseContent = JSON.stringify(response.data, null, 2);
              const limitedResponseData = limitDataForBackend(response.data);
              const botResponseContentForBackend = JSON.stringify(
                limitedResponseData,
                null,
                2,
              );

              await axiosInstance.put(
                `${API_URL}/api/messages/${botMessageToUpdateId}`,
                {
                  token,
                  content: botResponseContentForBackend,
                  timestamp: new Date().toISOString(),
                  status: "normal",
                },
              );
              dispatchMessages({
                type: "UPDATE_MESSAGE",
                id: botMessageToUpdateId!,
                message: {
                  content: botResponseContent,
                  timestamp: new Date().toISOString(),
                  status: "normal",
                },
              });

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
                      : item,
                  ),
                );
              } catch (parseError) {
                console.error(
                  "Failed to parse bot response for edited question:",
                  parseError,
                );
                setDashboardHistory((prev) =>
                  prev.map((item) =>
                    item.questionMessageId === questionMessageId
                      ? {
                          ...item,
                          ...getDashboardErrorState(
                            newQuestion,
                            "Sorry, an error occurred. Please try again.",
                          ),
                          isError: true,
                        }
                      : item,
                  ),
                );
              }
            } catch (error) {
              setActiveRequestController(null);
              const errorContent = getErrorMessage(error);
              const errorStatus = "error";

              if (
                !axiosInstance.isCancel(error) &&
                (error as Error).name !== "CanceledError"
              ) {
                await axiosInstance.put(
                  `${API_URL}/api/messages/${botMessageToUpdateId}`,
                  {
                    token,
                    content: errorContent,
                    timestamp: new Date().toISOString(),
                    status: errorStatus,
                  },
                );
                dispatchMessages({
                  type: "UPDATE_MESSAGE",
                  id: botMessageToUpdateId!,
                  message: {
                    content: errorContent,
                    timestamp: new Date().toISOString(),
                    status: errorStatus,
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
                      : item,
                  ),
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
        ],
      );

      const handleRetry = useCallback(
        async (questionMessageId: string) => {
          const itemToRetry = dashboardHistory.find(
            (item) => item.questionMessageId === questionMessageId,
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
            (conn) => conn.connectionName === connectionName,
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
            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.questionMessageId === questionMessageId
                  ? { ...item, ...getDashboardLoadingState(), isError: false }
                  : item,
              ),
            );

            if (botMessageToUpdateId) {
              await axiosInstance.put(
                `${API_URL}/api/messages/${botMessageToUpdateId}`,
                {
                  token,
                  content: "loading...",
                  timestamp: new Date().toISOString(),
                  status: "loading",
                },
              );
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
              const botLoadingResponse = await axiosInstance.post(
                `${API_URL}/api/messages`,
                {
                  token,
                  session_id: sessionId,
                  content: "loading...",
                  isBot: true,
                  isFavorited: false,
                  parentId: questionMessageId,
                  status: "loading",
                },
              );
              botMessageToUpdateId = botLoadingResponse.data.id;
              dispatchMessages({
                type: "ADD_MESSAGE",
                message: {
                  id: botMessageToUpdateId,
                  content: "loading...",
                  isBot: true,
                  timestamp: new Date().toISOString(),
                  isFavorited: false,
                  parentId: questionMessageId,
                  status: "loading",
                },
              });
              setDashboardHistory((prev) =>
                prev.map((item) =>
                  item.questionMessageId === questionMessageId
                    ? { ...item, botResponseId: botMessageToUpdateId }
                    : item,
                ),
              );
            }

            try {
              const connectionPayload = {
                ...connectionObj,
                password: connectionObj.password || "",
              };
              const controller = new AbortController();
              setActiveRequestController(controller);

              const payload = {
                question: questionContent,
                connection: connectionPayload,
                sessionId,
              };
              const response = await axiosInstance.post(
                `${CHATBOT_API_URL}/ask`,
                payload,
                { signal: controller.signal },
              );
              setActiveRequestController(null);

              const botResponseContent = JSON.stringify(response.data, null, 2);
              const limitedResponseData = limitDataForBackend(response.data);
              const botResponseContentForBackend = JSON.stringify(
                limitedResponseData,
                null,
                2,
              );

              await axiosInstance.put(
                `${API_URL}/api/messages/${botMessageToUpdateId}`,
                {
                  token,
                  content: botResponseContentForBackend,
                  timestamp: new Date().toISOString(),
                  status: "normal",
                },
              );
              dispatchMessages({
                type: "UPDATE_MESSAGE",
                id: botMessageToUpdateId,
                message: {
                  content: botResponseContent,
                  timestamp: new Date().toISOString(),
                  status: "normal",
                },
              });

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
                    : item,
                ),
              );
            } catch (error) {
              setActiveRequestController(null);
              const errorContent = getErrorMessage(error);
              const errorStatus = "error";

              if (
                !axiosInstance.isCancel(error) &&
                (error as Error).name !== "CanceledError"
              ) {
                await axiosInstance.put(
                  `${API_URL}/api/messages/${botMessageToUpdateId}`,
                  {
                    token,
                    content: errorContent,
                    timestamp: new Date().toISOString(),
                    status: errorStatus,
                  },
                );
                dispatchMessages({
                  type: "UPDATE_MESSAGE",
                  id: botMessageToUpdateId,
                  message: {
                    content: errorContent,
                    timestamp: new Date().toISOString(),
                    status: errorStatus,
                  },
                });
                setDashboardHistory((prev) =>
                  prev.map((item) =>
                    item.questionMessageId === questionMessageId
                      ? {
                          ...item,
                          ...getDashboardErrorState(
                            questionContent,
                            errorContent,
                          ),
                          isError: true,
                        }
                      : item,
                  ),
                );
              }
            }
          } catch (error) {
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
                  : item,
              ),
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
        ],
      );

      const handleSelectPrevQuestion = useCallback(
        async (messageId: string) => {
          const targetIndex = dashboardHistory.findIndex(
            (item) => item.questionMessageId === messageId,
          );

          if (targetIndex !== -1) {
            setCurrentHistoryIndex(targetIndex);
            setCurrentQuestionId(messageId);
            localStorage.setItem("currentDashboardQuestionId", messageId);
            setCurrentMainViewType(
              dashboardHistory[targetIndex].lastViewType || "table",
            );
            setGraphSummary(null);
          } else {
            const selectedUserMessage = messages.find(
              (m) => m.id === messageId && !m.isBot,
            );

            if (selectedUserMessage) {
              const correspondingBotMessages = messages.filter(
                (m) => m.isBot && m.parentId === messageId,
              );
              const latestBotMessage = correspondingBotMessages.sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime(),
              )[0];

              const newEntry = createDashboardItemFromMessages(
                selectedUserMessage,
                latestBotMessage,
                selectedConnection,
              );

              if (newEntry) {
                setDashboardHistory((prev) => {
                  const newHistory = [...prev, newEntry];
                  setCurrentHistoryIndex(newHistory.length - 1);
                  return newHistory;
                });
                localStorage.setItem(
                  "currentDashboardQuestionId",
                  selectedUserMessage.id,
                );
                setCurrentQuestionId(selectedUserMessage.id);
              }
            } else {
              console.error(
                "User message not found in session by ID:",
                messageId,
              );
              toast.error("Could not load the selected previous question.");
            }
          }
          setShowPrevQuestionsModal(false);
        },
        [dashboardHistory, messages, selectedConnection],
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
              dashboardHistory[newIndex].questionMessageId,
            );
          }
        },
        [currentHistoryIndex, dashboardHistory],
      );

      const handleViewTypeChange = useCallback(
        (viewType: "graph" | "table" | "query") => {
          setCurrentMainViewType(viewType);
          if (currentDashboardView) {
            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.id === currentDashboardView.id
                  ? { ...item, lastViewType: viewType }
                  : item,
              ),
            );
          }
        },
        [currentDashboardView],
      );

      useImperativeHandle(ref, () => ({
        handleNewChat,
        handleAskFavoriteQuestion,
      }));

      const userQuestionsFromSession = useMemo(() => {
        return messages.filter((msg) => !msg.isBot).reverse();
      }, [messages]);

      const showDashboardContent = useMemo(() => {
        return (
          sessionId ||
          messages.length > 0 ||
          currentDashboardView.question !== initialDashboardState.question
        );
      }, [
        sessionId,
        messages.length,
        currentDashboardView.question,
        initialDashboardState.question,
      ]);

      return (
        <div
          className="flex flex-col h-full w-full min-h-0 flex-grow relative transition-colors duration-300 overflow-hidden"
          style={{
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
          }}
        >
          {sessionConnectionError && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[9999] animate-fade-down max-w-md w-full px-4 pointer-events-none">
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
                <button
                  onClick={() => setSessionConnectionError(null)}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-red-500/10 transition-colors duration-200 text-red-500/70 hover:text-red-500 mt-0.5 focus:outline-none"
                  aria-label="Close error message"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          <main className="flex-grow flex flex-col items-center overflow-hidden">
            <div className="w-full flex-grow flex flex-col min-h-0">
              {(() => {
                if (connectionsLoading) {
                  return (
                    <div className="flex justify-center items-center flex-grow flex-col animate-pulse">
                      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-sm font-medium opacity-70" style={{ color: theme.colors.text }}>Loading connections...</p>
                    </div>
                  );
                }
                if (connections.length === 0 && !connectionsLoading) {
                  return (
                    <div
                      className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto"
                      style={{ color: theme.colors.text }}
                    >
                      <p className="text-xl font-semibold mb-1">
                        No Connections Found
                      </p>
                      <p className="text-xs font-semibold opacity-70 mb-4">
                        Create a connection to start interacting with your data
                        assistant.
                      </p>
                      {localStorage.getItem("allowedToCreateConnection") !==
                        "false" && (
                        <button
                          onClick={onCreateConSelected}
                          className="px-4 py-2 text-xs font-semibold text-white transition-all shadow-xs"
                          style={{
                            backgroundColor: theme.colors.accent,
                            borderRadius: theme.borderRadius.default,
                          }}
                        >
                          Create Connection
                        </button>
                      )}
                    </div>
                  );
                }

                if (!currentDashboardView) {
                  return (
                    <div className="flex justify-center items-center flex-grow flex-col animate-pulse">
                      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-sm font-medium opacity-70" style={{ color: theme.colors.text }}>Loading dashboard view...</p>
                    </div>
                  );
                }

                if (showDashboardContent) {
                  if (
                    isSubmitting &&
                    currentDashboardView.textualSummary ===
                      "Processing your request..."
                  ) {
                    return (
                      <DashboardSkeletonLoader
                        question={currentDashboardView.question}
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
                            newQuestion,
                          )
                        }
                        onRetry={() =>
                          handleRetry(currentDashboardView.questionMessageId)
                        }
                        sessionConErr={!sessionConnection && !!sessionId}
                        botResponseId={currentDashboardView.botResponseId}
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
                      sessionConErr={!sessionConnection && !!sessionId}
                      graphSummary={graphSummary}
                      onEditQuestion={handleEditQuestion}
                      onUpdateReaction={handleUpdateReaction}
                    />
                  );
                }
                return (
                  <div
                    className="flex flex-col items-center justify-center h-full text-center px-4 max-w-xl mx-auto"
                    style={{ color: theme.colors.text }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 border animate-pulse"
                      style={{
                        background: `${theme.colors.accent}08`,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <Sparkles
                        size={18}
                        style={{ color: theme.colors.accent }}
                      />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
                      Studio Workspace Analyzer
                    </h1>
                    <p className="text-sm font-medium opacity-75 mb-8">
                      Ask a question or tap a recommended metrics rule below to
                      populate your analytics deck layouts.
                    </p>
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
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl pointer-events-auto">
              {schemaLoading ? (
                <div
                  className="flex items-center justify-center gap-3 px-6 py-5 rounded-2xl border"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.textSecondary,
                  }}
                >
                  <svg className="animate-spin" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                  </svg>
                  <span className="text-sm font-medium">Loading schema…</span>
                </div>
              ) : schemaError ? (
                <div
                  className="flex items-center justify-between gap-3 px-6 py-4 rounded-2xl border"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.error,
                  }}
                >
                  <span className="text-sm font-medium">{schemaError}</span>
                  <button
                    onClick={() => setIsDbExplorerOpen(false)}
                    className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <SchemaExplorer
                  schemas={schemaData}
                  onClose={() => setIsDbExplorerOpen(false)}
                  theme={theme}
                  onColumnClick={() => {}}
                  selectedConnection={selectedConnection ?? undefined}
                  connections={connections.map((c) => ({ id: c.id ?? c.connectionName, connectionName: c.connectionName }))}
                  onConnectionChange={(name) => {
                    setSelectedConnection(name);
                  }}
                />
              )}
            </div>
          )}

          {connections.length > 0 && (
            <footer className="absolute bottom-4 left-0 right-0 z-40 pointer-events-none px-4 flex justify-center">
              <div
                className="w-full max-w-4xl flex items-end gap-1.5 px-3 py-2 rounded-[24px] pointer-events-auto border transition-all duration-300 shadow-2xl"
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
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40"
                      style={{
                        borderColor: theme.colors.border,
                        color: theme.colors.text,
                        backgroundColor: theme.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)'
                      }}
                    >
                      <Database size={15} style={{ color: selectedConnection ? theme.colors.accent : theme.colors.textSecondary }} />
                      <span className="text-xs font-bold tracking-tight max-w-[120px] truncate">
                        {selectedConnection || "Select Node"}
                      </span>
                      <ChevronDown size={12} className="opacity-60" />
                    </button>
                  </CustomTooltip>

                  {isConnectionDropdownOpen && (
                    <div
                      className="absolute bottom-[calc(100%+0.5rem)] left-0 rounded-2xl border z-50 min-w-[240px] overflow-hidden py-2 shadow-2xl animate-fade-up backdrop-blur-xl"
                      style={{
                        background: theme.mode === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(30, 41, 59, 0.95)',
                        borderColor: theme.colors.border,
                      }}
                    >
                      {options.map((option) =>
                        option.value === "create-con" ? (
                          <div
                            key={option.value}
                            className="px-2 pb-2 mb-1.5 border-b"
                            style={{ borderColor: `${theme.colors.border}60` }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                handleConnectionSelect(option.value);
                                setIsConnectionDropdownOpen(false);
                              }}
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-98 shadow-xs"
                              style={{ backgroundColor: theme.colors.accent }}
                            >
                              <Plus size={14} />
                              <span>{option.label}</span>
                            </button>
                          </div>
                        ) : (
                          <div
                            key={option.value}
                            className="group flex items-center gap-2.5 px-3 py-2 mx-1.5 rounded-xl cursor-pointer transition-all duration-200"
                            style={{
                              color: theme.colors.text,
                              backgroundColor:
                                selectedConnection === option.value
                                  ? `${theme.colors.accent}12`
                                  : "transparent",
                            }}
                            onClick={() => {
                              handleConnectionSelect(option.value);
                              setIsConnectionDropdownOpen(false);
                            }}
                          >
                            <div
                              className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                              style={{
                                backgroundColor:
                                  selectedConnection === option.value
                                    ? `${theme.colors.accent}20`
                                    : theme.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                              }}
                            >
                              {selectedConnection === option.value ? (
                                <Check size={13} style={{ color: theme.colors.accent }} />
                              ) : (
                                <Database size={13} style={{ color: theme.colors.textSecondary }} />
                              )}
                            </div>
                            <span
                              className={`text-xs truncate flex-grow ${
                                selectedConnection === option.value
                                  ? "font-bold"
                                  : "font-semibold"
                              }`}
                            >
                              {option.label}
                            </span>
                            {option.isAdmin && (
                              <span
                                className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md"
                                style={{
                                  backgroundColor: `${theme.colors.accent}10`,
                                  color: theme.colors.accent,
                                }}
                              >
                                System
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePdfClick(option.value, e);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors ml-auto opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Data Atlas PDF"
                            >
                              <FaFilePdf size={13} />
                            </button>
                          </div>
                        )
                      )}
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
                <CustomTooltip title="Switch to Chat" position="top">
                  <button
                    type="button"
                    onClick={() => setCurrentView("chat")}
                    disabled={isSubmitting}
                    className="p-2 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    <MessageSquare size={19} />
                  </button>
                </CustomTooltip>
                <CustomTooltip title="New Chat Session" position="top">
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
                <DashboardInput
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
                    (!sessionConnection && !!sessionId) ||
                    (!selectedConnection && connections.length > 0)
                  }
                  isDbExplorerOpen={isDbExplorerOpen}
                  setIsDbExplorerOpen={setIsDbExplorerOpen}
                  onStopRequest={handleStopRequest}
                />
                <CustomTooltip
                  title="Historical Session Metrics"
                  position="top"
                >
                  <button
                    onClick={() => setShowPrevQuestionsModal(true)}
                    disabled={
                      isSubmitting || userQuestionsFromSession.length === 0
                    }
                    className="p-2 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    <ListChecks size={19} />
                  </button>
                </CustomTooltip>
              </div>
            </footer>
          )}

          <PreviousQuestionsDrawer
            showPrevQuestionsModal={showPrevQuestionsModal}
            onClose={() => setShowPrevQuestionsModal(false)}
            userQuestionsFromSession={userQuestionsFromSession}
            handleSelectPrevQuestion={handleSelectPrevQuestion}
            theme={theme}
            currentQuestionId={currentQuestionId}
          />

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
                  <ConnectionForm
                    isAdmin={false}
                    token={token}
                    onSuccess={() => {
                      setShowCreateConnectionModal(false);
                    }}
                  />
              </div>
            </div>
          )}

        </div>
      );
    },
  ),
);

const areEqual = (
  prevProps: DashboardInterfaceProps,
  nextProps: DashboardInterfaceProps,
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
