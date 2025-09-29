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

interface MainViewData {
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
  } else if (botMessage.content === "loading...") {
    return {
      ...baseItem,
      ...getDashboardLoadingState(),
      isError: false,
    };
  } else if (
    botMessage.content === "Sorry, an error occurred. Please try again."
  ) {
    return {
      ...baseItem,
      ...getDashboardErrorState(
        userMessage.content,
        "Sorry, an error occurred. Please try again."
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
                dispatchMessages({
                  type: "UPDATE_MESSAGE",
                  id: msg.id,
                  message: {
                    content: response.data.content,
                    timestamp: response.data.timestamp,
                    reaction: sanitizeReaction(response.data.reaction),
                    dislike_reason: response.data.dislike_reason ?? null,
                  },
                });
                // Update dashboardHistory based on the new bot content
                setDashboardHistory((prev) =>
                  prev.map((item) => {
                    if (item.botResponseId === msg.id) {
                      if (
                        response.data.content ===
                        "Sorry, an error occurred. Please try again."
                      ) {
                        return {
                          ...item,
                          ...getDashboardErrorState(
                            item.question,
                            "Sorry, an error occurred. Please try again."
                          ),
                          isError: true,
                        };
                      } else {
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
        }, 2000);
        return () => clearInterval(interval);
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
        } else if (
          dashboardHistory.length === 1 &&
          currentDashboardView.id === initialDashboardState.id
        ) {
          localStorage.removeItem("currentDashboardQuestionId");
        }
      }, [currentDashboardView, dashboardHistory, initialDashboardState]);

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
          if (!connection) {
            toast.error("No connection provided.");
            return;
          }

          const newLoadingEntryId = generateId();
          const newLoadingEntry: DashboardItem = {
            id: newLoadingEntryId,
            question: question,
            questionMessageId: "",
            connectionName: connection,
            ...getDashboardLoadingState(),
            lastViewType: "table",
            isFavorited: false,
            reaction: null,
            dislike_reason: null,
            botResponseId: "",
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
                        isError: true,
                      }
                    : item
                )
              );
              return;
            }
          }

          if (!currentSessionId) {
            try {
              const newSessId: any = await startNewSession(
                connection,
                question
              );
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
                          isError: true,
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
                        ),
                        isError: true,
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
            isFavorited: false,
            parentId: null,
          };

          let finalUserMessageId: string = "";
          let botMessageId: string = "";

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
              isFavorited: userResponse.data.isFavorited,
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

            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.id === newLoadingEntryId
                  ? {
                      ...item,
                      questionMessageId: finalUserMessageId,
                      botResponseId: botMessageId,
                    }
                  : item
              )
            );

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

              // Update dashboard item with response
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
                  `Here is the analysis for: "${question}"`;

                setDashboardHistory((prev) =>
                  prev.map((item) =>
                    item.id === newLoadingEntryId
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
                  "Failed to parse bot response content:",
                  parseError
                );
                setDashboardHistory((prev) =>
                  prev.map((item) =>
                    item.id === newLoadingEntryId
                      ? {
                          ...item,
                          ...getDashboardErrorState(
                            question,
                            "Sorry, an error occurred. Please try again."
                          ),
                          isError: true,
                        }
                      : item
                  )
                );
              }
            } catch (error) {
              console.error("Error getting bot response:", error);
              const errorContent = getErrorMessage(error);

              await axios.put(
                `${API_URL}/api/messages/${botMessageId}`,
                {
                  token,
                  content: errorContent,
                  timestamp: new Date().toISOString(),
                },
                { headers: { "Content-Type": "application/json" } }
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
              setDashboardHistory((prev) =>
                prev.map((item) =>
                  item.id === newLoadingEntryId
                    ? {
                        ...item,
                        ...getDashboardErrorState(question, errorContent),
                        isError: true,
                      }
                    : item
                )
              );
            }
          } catch (error) {
            console.error(
              "Error saving user message or creating bot loading message:",
              error
            );
            toast.error(`Failed to send message: ${getErrorMessage(error)}`);
            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.id === newLoadingEntryId
                  ? {
                      ...item,
                      ...getDashboardErrorState(
                        question,
                        getErrorMessage(error)
                      ),
                      isError: true,
                    }
                  : item
              )
            );
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
            await askQuestion(question, connection, query);
          } else {
            handleNewChat();
            await new Promise<void>((resolve) => setTimeout(resolve, 0));
            setSelectedConnection(connection);
            await askQuestion(question, connection, query);
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
            await axios.post(`${API_URL}/api/favorites`, {
              token,
              question: questionContent,
              connection: currentConnection,
              query: responseQuery,
              isFavorited: !isCurrentlyFavorited,
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
        setIsSubmitting(true);
        try {
          const canvas = await html2canvas(graphContainer, { scale: 2 });
          const imageData = canvas.toDataURL("image/png");
          const prompt = `Summarize the key insights from this graph image for the question: "${currentDashboardView.question}".`;
          const apiKey = "AIzaSyCN_i1Fmhs1B5Sx7YxdTOZvJChG-uB6oFA"; // Replace with your actual API key
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
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
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
        } finally {
          setIsSubmitting(false);
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
            });
            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: questionMessageId,
              message: {
                content: newQuestion,
                timestamp: new Date().toISOString(),
              },
            });
            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.questionMessageId === questionMessageId
                  ? { ...item, question: newQuestion }
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
                }
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
                  parentId: questionMessageId,
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
              };
              dispatchMessages({
                type: "ADD_MESSAGE",
                message: newBotLoadingMessage,
              });
            }

            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.questionMessageId === questionMessageId
                  ? { ...item, textualSummary: "Processing your request..." }
                  : item
              )
            );

            try {
              const connectionObj = connections.find(
                (conn) => conn.connectionName === selectedConnection
              );
              const payload = {
                question: newQuestion,
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
                }
              );
              dispatchMessages({
                type: "UPDATE_MESSAGE",
                id: botMessageToUpdateId!,
                message: {
                  content: botResponseContent,
                  timestamp: new Date().toISOString(),
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
              const errorContent = getErrorMessage(error);
              await axios.put(
                `${API_URL}/api/messages/${botMessageToUpdateId}`,
                {
                  token,
                  content: errorContent,
                  timestamp: new Date().toISOString(),
                }
              );
              dispatchMessages({
                type: "UPDATE_MESSAGE",
                id: botMessageToUpdateId!,
                message: {
                  content: errorContent,
                  timestamp: new Date().toISOString(),
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

      const handleRetry = useCallback(
        async (questionMessageId: string) => {
          const userMessage = messages.find((m) => m.id === questionMessageId);
          if (!userMessage) return;
          askQuestion(
            userMessage.content,
            selectedConnection,
            userMessage.isFavorited
          );
        },
        [askQuestion, selectedConnection, messages]
      );

      const handleSelectPrevQuestion = useCallback(
        async (messageId: string) => {
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
                const newHistory =
                  currentHistoryIndex === prev.length - 1
                    ? [...prev, newEntry]
                    : [...prev.slice(0, currentHistoryIndex + 1), newEntry];
                return newHistory;
              });
              setCurrentHistoryIndex((prevIndex) => prevIndex + 1);
              localStorage.setItem(
                "currentDashboardQuestionId",
                selectedUserMessage.id
              );
              setCurrentQuestionId(selectedUserMessage.id);
            } else {
              await askQuestion(
                selectedUserMessage.content,
                selectedConnection
              );
            }
          } else {
            console.error(
              "User message not found in session by ID:",
              messageId
            );
            toast.error("Could not load the selected previous question.");
          }
        },
        [messages, selectedConnection, askQuestion, currentHistoryIndex]
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
                  );
                }
                if (showDashboardContent) {
                  if (isSubmitting) {
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
                onSelect={handleConnectionSelect}
                onNewChat={handleNewChat}
                disabled={
                  isSubmitting ||
                  !!sessionConnectionError ||
                  (!selectedConnection && connections.length > 0)
                }
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
                currentDashboardView.mainViewData.chartData.length > 0 && (
                  <CustomTooltip title="Summarize Graph" position="top">
                    <button
                      type="button"
                      title="Summarize Graph"
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
