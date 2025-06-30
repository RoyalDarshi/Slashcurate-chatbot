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

interface DashboardItem {
  id: string;
  question: string;
  kpiData: KpiData;
  mainViewData: MainViewData;
  textualSummary: string;
  lastViewType: "graph" | "table" | "query";
  isFavorited: boolean;
  questionMessageId: string;
  connectionName: string;
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
  textualSummary: `Error: ${errorMsg}`,
  question: question,
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
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [isDbExplorerOpen, setIsDbExplorerOpen] = useState(false);
      const [isConnectionDropdownOpen, setIsConnectionDropdownOpen] =
        useState(false);
      const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(
        null
      );
      const [graphSummary, setGraphSummary] = useState<string | null>(null);

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
          }
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

      const isErrorState =
        currentDashboardView.textualSummary.startsWith("Error:");

      useEffect(() => {
        if (currentDashboardView?.questionMessageId) {
          setCurrentQuestionId(currentDashboardView.questionMessageId);
        }
      }, [currentDashboardView]);

      useEffect(() => {
        if (
          currentDashboardView?.textualSummary === "Processing your request..."
        ) {
          setIsSubmitting(true);
        } else if (
          isSubmitting &&
          currentDashboardView?.textualSummary !== "Processing your request..."
        ) {
          setIsSubmitting(false);
        }
      }, [currentDashboardView, isSubmitting]);

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

              const loadedDashboardHistory: DashboardItem[] = [];
              const userMessages = sessionData.messages
                .filter((msg: Message) => !msg.isBot)
                .sort(
                  (a: Message, b: Message) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime()
                );

              let restoredIndex = 0;

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
                  )[0];

                if (
                  correspondingBotMessage &&
                  correspondingBotMessage.content !== "loading..."
                ) {
                  if (
                    correspondingBotMessage.content.startsWith("Error:") ||
                    !correspondingBotMessage.content.trim().startsWith("{")
                  ) {
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
                        lastViewType: "table",
                        isFavorited: userMessage.isFavorited,
                        questionMessageId: userMessage.id,
                        connectionName: sessionData.connection,
                      });
                    } catch (parseError) {
                      console.error(
                        "Failed to parse bot response content from session:",
                        parseError
                      );
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
              }

              if (loadedDashboardHistory.length > 0) {
                const foundIndex = loadedDashboardHistory.findIndex(
                  (item) => item.questionMessageId === storedCurrentQuestionId
                );

                if (foundIndex !== -1) {
                  restoredIndex = foundIndex;
                } else {
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
            questionMessageId: "",
            connectionName: connection,
            ...getDashboardLoadingState(),
            lastViewType: "table",
            isFavorited: false,
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
                        textualSummary:
                          "Error: No valid session connection found.",
                        isFavorited: false,
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
                localStorage.removeItem("currentDashboardQuestionId");
              }
            }
          }

          if (!currentSessionId) {
            try {
              const newSessId: string = await startNewSession(
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
                          textualSummary: "Error: Could not create session.",
                          isFavorited: false,
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
                        ),
                        textualSummary: `Error: ${getErrorMessage(error)}`,
                        isFavorited: false,
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
            botMessageId = botLoadingResponse?.data?.id;
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
              const errorContent = getErrorMessage(error);

              setDashboardHistory((prev) =>
                prev.map((item) =>
                  item.id === newLoadingEntryId
                    ? {
                        ...item,
                        ...getDashboardErrorState(question, errorContent),
                        textualSummary: `Error: ${errorContent}`,
                        isFavorited: item.isFavorited,
                        questionMessageId: item.questionMessageId,
                        connectionName: item.connectionName,
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

      const handleEditQuestion = useCallback(
        async (questionMessageId: string, newQuestion: string) => {
          if (!sessionId) {
            toast.error("No active session to edit the question.");
            return;
          }

          const dashboardItemIndex = dashboardHistory.findIndex(
            (item) => item.questionMessageId === questionMessageId
          );
          if (dashboardItemIndex === -1) {
            toast.error("Dashboard item not found for the given question.");
            return;
          }

          console.log("Starting edit question:", {
            questionMessageId,
            newQuestion,
          });

          // Immediately set submitting and loading state
          setIsSubmitting(true);
          console.log("Set isSubmitting to true");
          setDashboardHistory((prev) => {
            const newHistory = prev.map((item, index) =>
              index === dashboardItemIndex
                ? {
                    ...item,
                    question: newQuestion,
                    ...getDashboardLoadingState(),
                  }
                : item
            );
            console.log(
              "Updated dashboardHistory to loading state:",
              newHistory[dashboardItemIndex]
            );
            return newHistory;
          });

          // Minimum delay to ensure skeleton is visible
          const minLoadingTime = new Promise((resolve) =>
            setTimeout(resolve, 500)
          );

          try {
            // Update user message on server and in state
            await axios.put(
              `${API_URL}/api/messages/${questionMessageId}`,
              {
                token,
                content: newQuestion,
                timestamp: new Date().toISOString(),
              },
              { headers: { "Content-Type": "application/json" } }
            );
            console.log("User message updated on server");

            dispatchMessages({
              type: "UPDATE_MESSAGE",
              id: questionMessageId,
              message: {
                content: newQuestion,
                timestamp: new Date().toISOString(),
              },
            });
            console.log("User message updated in state");

            const botMessage = messages.find(
              (msg) => msg.isBot && msg.parentId === questionMessageId
            );

            if (botMessage) {
              // Set bot message to loading
              await axios.put(
                `${API_URL}/api/messages/${botMessage.id}`,
                {
                  token,
                  content: "loading...",
                  timestamp: new Date().toISOString(),
                },
                { headers: { "Content-Type": "application/json" } }
              );
              console.log("Bot message set to loading on server");

              dispatchMessages({
                type: "UPDATE_MESSAGE",
                id: botMessage.id,
                message: {
                  content: "loading...",
                  timestamp: new Date().toISOString(),
                },
              });
              console.log("Bot message set to loading in state");

              try {
                const connectionObj = connections.find(
                  (conn) => conn.connectionName === selectedConnection
                );
                if (!connectionObj) {
                  throw new Error("Selected connection not found.");
                }

                const payload = {
                  question: newQuestion,
                  connection: connectionObj,
                  sessionId,
                };
                const response = await axios.post(
                  `${CHATBOT_API_URL}/ask`,
                  payload
                );
                console.log("Received bot response:", response.data);
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
                  "Here is the analysis for the updated question.";

                const botResponseContent = JSON.stringify(
                  botResponseData,
                  null,
                  2
                );
                await axios.put(
                  `${API_URL}/api/messages/${botMessage.id}`,
                  {
                    token,
                    content: botResponseContent,
                    timestamp: new Date().toISOString(),
                  },
                  { headers: { "Content-Type": "application/json" } }
                );
                console.log("Bot message updated with response on server");

                dispatchMessages({
                  type: "UPDATE_MESSAGE",
                  id: botMessage.id,
                  message: {
                    content: botResponseContent,
                    timestamp: new Date().toISOString(),
                  },
                });
                console.log("Bot message updated with response in state");

                // Update dashboard item with new data
                setDashboardHistory((prev) => {
                  const newHistory = prev.map((item, index) =>
                    index === dashboardItemIndex
                      ? {
                          ...item,
                          kpiData: actualKpiData,
                          mainViewData: actualMainViewData,
                          textualSummary: actualTextualSummary,
                        }
                      : item
                  );
                  console.log(
                    "Updated dashboardHistory with new data:",
                    newHistory[dashboardItemIndex]
                  );
                  return newHistory;
                });
              } catch (error) {
                console.error(
                  "Error getting bot response for edited question:",
                  error
                );
                const errorContent = getErrorMessage(error);

                await axios.put(
                  `${API_URL}/api/messages/${botMessage.id}`,
                  {
                    token,
                    content: `Error: ${errorContent}`,
                    timestamp: new Date().toISOString(),
                  },
                  { headers: { "Content-Type": "application/json" } }
                );
                console.log("Bot message updated with error on server");

                dispatchMessages({
                  type: "UPDATE_MESSAGE",
                  id: botMessage.id,
                  message: {
                    content: `Error: ${errorContent}`,
                    timestamp: new Date().toISOString(),
                  },
                });
                console.log("Bot message updated with error in state");

                // Update dashboard item to error state
                setDashboardHistory((prev) => {
                  const newHistory = prev.map((item, index) =>
                    index === dashboardItemIndex
                      ? {
                          ...item,
                          question: newQuestion,
                          ...getDashboardErrorState(newQuestion, errorContent),
                          textualSummary: `Error: ${errorContent}`,
                        }
                      : item
                  );
                  console.log(
                    "Updated dashboardHistory to error state:",
                    newHistory[dashboardItemIndex]
                  );
                  return newHistory;
                });
              }
            } else {
              toast.error(
                "No corresponding bot response found for the question."
              );
            }
          } catch (error) {
            console.error("Error updating user message:", error);
            toast.error(`Failed to update message: ${getErrorMessage(error)}`);
            // Update dashboard to error state
            setDashboardHistory((prev) => {
              const newHistory = prev.map((item, index) =>
                index === dashboardItemIndex
                  ? {
                      ...item,
                      question: newQuestion,
                      ...getDashboardErrorState(
                        newQuestion,
                        getErrorMessage(error)
                      ),
                      textualSummary: `Error: ${getErrorMessage(error)}`,
                    }
                  : item
              );
              console.log(
                "Updated dashboardHistory to error state (user message error):",
                newHistory[dashboardItemIndex]
              );
              return newHistory;
            });
          } finally {
            // Ensure minimum loading time and reset submitting
            await minLoadingTime;
            setIsSubmitting(false);
            console.log("Set isSubmitting to false");
          }
        },
        [
          sessionId,
          dashboardHistory,
          token,
          connections,
          selectedConnection,
          dispatchMessages,
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
                  uid: "user1",
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
                  uid: "user1",
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );
            }

            setDashboardHistory((prevHistory) =>
              prevHistory.map((item) =>
                item.questionMessageId === questionMessageId
                  ? { ...item, isFavorited: !isCurrentlyFavorited }
                  : item
              )
            );

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
          handleNewChat,
          setSelectedConnection,
          sessionId,
          selectedConnection,
          connections,
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
        setGraphSummary(null);
        toast.info("Summarizing graph...", { autoClose: false });

        try {
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
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: theme.colors.surface,
          });
          const imageData = canvas.toDataURL("image/png");

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
          const apiKey = "AIzaSyCN_i1Fmhs1B5Sx7YxdTOZvJChG-uB6oFA";

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
          toast.dismiss();
          const errorMessage = getErrorMessage(error);
          toast.error(`Failed to summarize graph: ${errorMessage}`);
          setGraphSummary(`Error: ${errorMessage}`);
        } finally {
          setIsSubmitting(false);
        }
      }, [currentDashboardView, theme.colors.surface]);

      const handleSelectPrevQuestion = useCallback(
        async (messageId: string) => {
          if (!selectedConnection) {
            toast.error(
              "No connection selected. Please select a connection first."
            );
            return;
          }

          setInput("");
          setShowPrevQuestionsModal(false);
          setGraphSummary(null);

          const selectedUserMessage = messages.find(
            (msg) => !msg.isBot && msg.id === messageId
          );

          if (selectedUserMessage) {
            const correspondingBotMessage = messages.find(
              (msg) => msg.isBot && msg.parentId === selectedUserMessage.id
            );

            if (
              correspondingBotMessage &&
              correspondingBotMessage.content !== "loading..."
            ) {
              if (
                correspondingBotMessage.content.startsWith("Error:") ||
                !correspondingBotMessage.content.trim().startsWith("{")
              ) {
                const newEntry: DashboardItem = {
                  id: generateId(),
                  question: selectedUserMessage.content,
                  ...getDashboardErrorState(
                    selectedUserMessage.content,
                    correspondingBotMessage.content.replace("Error: ", "")
                  ),
                  lastViewType: "table",
                  isFavorited: selectedUserMessage.isFavorited,
                  questionMessageId: selectedUserMessage.id,
                  connectionName: selectedConnection,
                };

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
              } else {
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
                    `Here is the analysis for: "${selectedUserMessage.content}"`;

                  const newEntry: DashboardItem = {
                    id: generateId(),
                    question: selectedUserMessage.content,
                    kpiData: actualKpiData,
                    mainViewData: actualMainViewData,
                    textualSummary: actualTextualSummary,
                    lastViewType: "table",
                    isFavorited: selectedUserMessage.isFavorited,
                    questionMessageId: selectedUserMessage.id,
                    connectionName: selectedConnection,
                  };

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
                } catch (parseError) {
                  console.error(
                    "Failed to parse bot response content for previous question:",
                    parseError
                  );
                  await askQuestion(
                    selectedUserMessage.content,
                    selectedConnection
                  );
                }
              }
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
                  if (isErrorState) {
                    return (
                      <DashboardError
                        question={currentDashboardView.question}
                        errorMessage={currentDashboardView.textualSummary.replace(
                          "Error: ",
                          ""
                        )}
                        theme={theme}
                        onEditQuestion={(newQuestion) =>
                          handleEditQuestion(
                            currentDashboardView.questionMessageId,
                            newQuestion
                          )
                        }
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
                      currentConnection={selectedConnection || ""}
                      graphSummary={graphSummary}
                      onEditQuestion={handleEditQuestion}
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
                onSelect={handleConnectionSelect}
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