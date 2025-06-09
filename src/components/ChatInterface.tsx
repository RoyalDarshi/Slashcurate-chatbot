import React, {
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
import Loader from "./Loader";
import { useTheme } from "../ThemeContext";
import RecommendedQuestions from "./RecommendedQuestions";
import CustomTooltip from "./CustomTooltip";
import { useConnections, useSession, useRecommendedQuestions } from "../hooks";
import DashboardView from "./DashboardView";
import SchemaExplorer from "./SchemaExplorer";
import schemaSampleData from "../data/sampleSchemaData";
import {
  ListChecks,
  HelpCircle,
  Database,
  Layers,
  PlusCircle,
  ChevronDown,
  X, // Import X icon for close button
} from "lucide-react"; // Import necessary icons
import { FaFilePdf } from "react-icons/fa";

export type ChatInterfaceHandle = {
  handleNewChat: () => void;
  handleAskFavoriteQuestion: (
    question: string,
    connection: string,
    query?: string
  ) => void;
};

// --- Mock Data Generation Helpers ---
// These helpers are used to simulate KPI and main view data for the dashboard.
// In a real application, this data would come from your backend API.
const generateId = () => Math.random().toString(36).substr(2, 9);
const generateRandomNumber = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const generateKpiData = (questionSeed = "") => {
  const seed = questionSeed.length + generateRandomNumber(0, 10);
  return {
    kpi1: {
      value: 1000 + seed * 10 + generateRandomNumber(0, 500),
      label: "Key Metric A",
      change: generateRandomNumber(-10, 15),
    },
    kpi2: {
      value: 50 + seed + generateRandomNumber(0, 100),
      label: "Key Metric B",
      change: generateRandomNumber(-5, 20),
    },
    kpi3: {
      value: 750 + seed * 5 + generateRandomNumber(0, 250),
      label: "Key Metric C",
      change: generateRandomNumber(-12, 12),
    },
  };
};

/**
 * Generates dummy data for a stacked bar graph.
 * Each object in the array represents a category (e.g., a month)
 * and contains multiple metrics that can be stacked.
 *
 * @param {number} numCategories - The number of categories (e.g., months) to generate.
 * @param {number} seedOffset - An additional offset to influence random number generation.
 * @returns {Array<Object>} An array of data objects for a stacked bar graph.
 */
function generateStackedBarGraphData(numCategories = 8, seedOffset = 0) {
  const categories = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Ensure we don't try to generate more categories than available names
  const actualCategories = categories.slice(0, numCategories);

  const data = actualCategories.map((category, index) => {
    // Generate random numbers for each series, influenced by the seedOffset
    // The seedOffset helps make the data slightly different based on the question seed.
    const seriesA =
      Math.floor(Math.random() * (250 - 100 + 1)) + 100 + seedOffset;
    const seriesB =
      Math.floor(Math.random() * (180 - 50 + 1)) + 50 + seedOffset / 2;
    const seriesC =
      Math.floor(Math.random() * (120 - 20 + 1)) + 20 + seedOffset / 4;

    return {
      name: category,
      seriesA: Math.max(0, Math.round(seriesA)), // Ensure non-negative and round
      seriesB: Math.max(0, Math.round(seriesB)),
      seriesC: Math.max(0, Math.round(seriesC)),
    };
  });

  return data;
}

// Updated function to generate data suitable for a stacked view
const generateMainViewData = (questionSeed = "") => {
  const categories = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const baseSeed = questionSeed.length + generateRandomNumber(0, 10);

  // Use the new generateStackedBarGraphData function for chartData
  const chartData = generateStackedBarGraphData(categories.length, baseSeed);

  const tableData = Array.from(
    { length: generateRandomNumber(3, 7) },
    (_, i) => ({
      id: `ID-${1001 + i + baseSeed}`,
      category: `Category ${String.fromCharCode(65 + (i % 5))}`,
      value: generateRandomNumber(1000, 10000),
      status: ["Active", "Pending", "Closed"][generateRandomNumber(0, 2)],
      lastUpdated: `2023-0${generateRandomNumber(1, 9)}-${generateRandomNumber(
        10,
        28
      )}`,
    })
  );
  const queryData = `SELECT\n    column1,\n    column2,\n    SUM(value) AS total_value\nFROM\n    your_table\nWHERE\n    condition LIKE '%${
    questionSeed.split(" ")[0] || "example"
  }%'\nGROUP BY\n    column1, column2\nORDER BY\n    total_value DESC;`;

  return { chartData, tableData, queryData };
};

// Helper function to extract error messages from Axios errors or generic errors
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
      else if (error.message) extractedErrorMessage = error.message;
    } else if (error.message) extractedErrorMessage = error.message;
  } else if (error instanceof Error && error.message)
    extractedErrorMessage = error.message;
  return (
    extractedErrorMessage || "An unknown error occurred. Please try again."
  );
};

// --- Main ChatInterface Component ---
const ChatInterface = memo(
  forwardRef<ChatInterfaceHandle, ChatInterfaceProps>(
    ({ onCreateConSelected, initialQuestion, onQuestionAsked }, ref) => {
      const { theme } = useTheme(); // Access the current theme (dark/light mode, colors, etc.)
      const token = sessionStorage.getItem("token") ?? ""; // Retrieve authentication token

      // Hooks for managing connections, sessions, and recommended questions
      const {
        connections,
        selectedConnection,
        setSelectedConnection,
        connectionError,
        connectionsLoading,
      } = useConnections(token);

      const {
        sessionId,
        messages, // 'messages' are still used for the "Previous Questions" modal
        dispatchMessages,
        sessionConnection,
        loadSession,
        clearSession,
      } = useSession(token);

      const recommendedQuestions = useRecommendedQuestions(token, sessionId);

      // State for the chat input field and submission status
      const [input, setInput] = useState("");
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [isDbExplorerOpen, setIsDbExplorerOpen] = useState(false); // State for Schema Explorer visibility
      const [isConnectionDropdownOpen, setIsConnectionDropdownOpen] =
        useState(false); // State for Connection dropdown visibility

      // Initial mock data for the dashboard when no questions have been asked
      const initialDashboardKpis = generateKpiData("Welcome!");
      const initialMainViewData = generateMainViewData("Welcome!");

      // State for managing the dashboard history (each entry is a dashboard state for a question)
      const [dashboardHistory, setDashboardHistory] = useState([
        {
          id: generateId(),
          question: "Initial Dashboard View",
          kpiData: initialDashboardKpis,
          mainViewData: initialMainViewData,
          textualSummary:
            "Welcome to your interactive analytics dashboard! Ask a question to get started.",
          lastViewType: "graph" as "graph" | "table" | "query", // Default view type
        },
      ]);
      // State to track the currently displayed dashboard history item
      const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
      // State to track the active view type (graph, table, or query) within the main dashboard view
      const [currentMainViewType, setCurrentMainViewType] = useState<
        "graph" | "table" | "query"
      >("table");
      // State to control the visibility of the "Previous Questions" modal
      const [showPrevQuestionsModal, setShowPrevQuestionsModal] =
        useState(false);

      // Get the currently active dashboard view from the history
      const currentDashboardView = dashboardHistory[currentHistoryIndex];

      // Effect to handle initial question prop (e.g., from a deep link or favorite question)
      useEffect(() => {
        if (initialQuestion && !connectionsLoading && connections.length > 0) {
          const questionText = initialQuestion.text;
          // Generate mock data for the initial question
          const kpiData = generateKpiData(questionText);
          const mainViewData = generateMainViewData(questionText);
          const newEntry = {
            id: generateId(),
            question: questionText,
            kpiData,
            mainViewData,
            textualSummary: `Displaying analysis for: ${questionText}`,
            lastViewType: "graph" as "graph" | "table" | "query",
          };
          setDashboardHistory([newEntry]); // Replace history with this single entry
          setCurrentHistoryIndex(0); // Set to the first (and only) entry
          setCurrentMainViewType("graph"); // Default to graph view
        }
      }, [initialQuestion, connectionsLoading, connections]);

      // Effect to manage the `isSubmitting` state based on the dashboard's processing status
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

      // Effect to validate and load the session on tab visibility change
      useEffect(() => {
        const handleVisibilityChange = async () => {
          if (document.visibilityState === "visible") {
            const storedSessionId = localStorage.getItem("currentSessionId");
            if (storedSessionId) {
              try {
                // Validate session with backend API
                await axios.get(`${API_URL}/api/sessions/${storedSessionId}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                loadSession(storedSessionId); // Load the session into the application state
              } catch (error) {
                console.error("Session validation failed:", error);
                localStorage.removeItem("currentSessionId"); // Clear invalid session
                clearSession(); // Reset session state
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

      // Callback to handle starting a new chat session
      const handleNewChat = useCallback(() => {
        clearSession(); // Clear the current session
        setInput(""); // Clear the input field
        // Reset dashboard history to its initial state
        setDashboardHistory([
          {
            id: generateId(),
            question: "Initial Dashboard View",
            kpiData: initialDashboardKpis,
            mainViewData: initialMainViewData,
            textualSummary: "Welcome! Ask a question to analyze your data.",
            lastViewType: "graph",
          },
        ]);
        setCurrentHistoryIndex(0); // Reset to the first history item
        setCurrentMainViewType("graph"); // Reset main view type
      }, [clearSession, initialDashboardKpis, initialMainViewData]);

      // Function to create a new session via API (simulated here)
      const startNewSession = useCallback(
        async (connectionName: string, question: string) => {
          try {
            // Simulate API call to create a new session with a delay
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
            localStorage.setItem("currentSessionId", newSessionId); // Store session ID in local storage
            toast.success("New session created!");
            return newSessionId;
          } catch (error) {
            console.error("Error creating new session:", error);
            toast.error(
              `Failed to start new session: ${getErrorMessage(error)}`
            );
            return null;
          }
        },
        []
      );

      // Callback to ask a question and update the dashboard view
      const askQuestionAndUpdateDashboard = useCallback(
        async (question: string, connectionName: string) => {
          if (!connectionName) {
            toast.error("No connection selected.");
            return;
          }
          setIsSubmitting(true); // Set submission state to true

          const processingEntryId = generateId();
          const processingEntry = {
            id: processingEntryId,
            question: question,
            kpiData: {
              kpi1: { value: "...", label: "Processing...", change: 0 },
              kpi2: { value: "...", label: "Processing...", change: 0 },
              kpi3: { value: "...", label: "Processing...", change: 0 },
            },
            mainViewData: {
              chartData: [],
              tableData: [],
              queryData: "Fetching query...",
            },
            textualSummary: "Processing your request...",
            lastViewType: currentMainViewType, // Keep current view type preference
          };

          // Add a temporary "Processing" entry to dashboard history
          const newHistory = [
            ...dashboardHistory.slice(0, currentHistoryIndex + 1), // Keep current and previous history
            processingEntry, // Add the new processing entry
          ];
          setDashboardHistory(newHistory);
          setCurrentHistoryIndex(newHistory.length - 1); // Navigate to the new processing entry

          let currentSessionId = sessionId;

          // If no session exists, create one
          if (!currentSessionId) {
            currentSessionId = await startNewSession(connectionName, question);
            if (!currentSessionId) {
              setIsSubmitting(false);
              // Remove the processing entry if session creation failed
              setDashboardHistory((prev) =>
                prev.filter((item) => item.id !== processingEntryId)
              );
              setCurrentHistoryIndex((prev) => Math.max(0, prev - 1));
              return;
            }
          }

          try {
            // Add user message to session messages (for "Previous Questions" modal)
            if (currentSessionId) {
              const userMessageForHistory: Message = {
                id: generateId(),
                content: question,
                isBot: false,
                timestamp: new Date().toISOString(),
                isFavorited: false,
                parentId: null,
              };
              dispatchMessages({
                type: "ADD_MESSAGE",
                message: userMessageForHistory,
              });

              // Send user message to backend (simulated)
              await axios.post(
                `${API_URL}/api/messages`,
                {
                  session_id: currentSessionId,
                  content: question,
                  isBot: false,
                  parentId: null,
                  isFavorited: false,
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );
            }

            const connectionObj = connections.find(
              (con) => con.connectionName === connectionName
            );
            if (!connectionObj) {
              toast.error("Selected connection does not exist.");
              return;
            }
            const query = "";

            // Simulate API call for dashboard data with a delay
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
            await new Promise((resolve) => setTimeout(resolve, 1500));
            const kpiData = generateKpiData(question);
            const mainViewData = generateMainViewData(question); // Use the updated generator
            const textualSummary = `Insights for "${question}": Metric A showed significant activity. Refer to the detailed views for more information.`;

            const newDashboardEntry = {
              id: processingEntryId, // Update the existing processing entry
              question: question,
              kpiData,
              mainViewData,
              textualSummary,
              lastViewType: currentMainViewType, // Persist current view type preference
            };

            // Update the dashboard history with the actual data
            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.id === processingEntryId ? newDashboardEntry : item
              )
            );

            // After successful response, add bot message to session messages (for "Previous Questions" modal)
            if (currentSessionId) {
              const botMessageForHistory: Message = {
                id: generateId(),
                content: textualSummary,
                isBot: true,
                timestamp: new Date().toISOString(),
                isFavorited: false,
                parentId: userMessageForHistory.id, // Link to user's question
              };
              dispatchMessages({
                type: "ADD_MESSAGE",
                message: botMessageForHistory,
              });

              // Also send bot message to backend (simulated)
              await axios.post(
                `${API_URL}/api/messages`,
                {
                  session_id: currentSessionId,
                  content: textualSummary,
                  isBot: true,
                  parentId: userMessageForHistory.id,
                  isFavorited: false,
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );
            }
          } catch (error) {
            console.error("Error fetching dashboard data:", error);
            toast.error(`Failed to get analysis: ${getErrorMessage(error)}`);
            // Update the processing entry with error details
            const errorEntry = {
              ...processingEntry,
              kpiData: {
                kpi1: { value: "Error1", label: "Error1", change: 0 },
                kpi2: { value: "Error", label: "Error", change: 0 },
                kpi3: { value: "Error", label: "Error", change: 0 },
              },
              mainViewData: {
                chartData: [],
                tableData: [],
                queryData: "Error fetching data.",
              },
              textualSummary: `Error processing "${question}": ${getErrorMessage(
                error
              )}`,
            };
            setDashboardHistory((prev) =>
              prev.map((item) =>
                item.id === processingEntryId ? errorEntry : item
              )
            );
          } finally {
            setIsSubmitting(false); // Reset submission state
          }
        },
        [
          dashboardHistory,
          currentHistoryIndex,
          currentMainViewType,
          sessionId,
          dispatchMessages,
          startNewSession,
          API_URL,
          CHATBOT_API_URL,
          token,
          connections,
        ]
      );

      // Callback for handling the main chat input submission
      const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
          e.preventDefault();
          if (!input.trim() || isSubmitting) return; // Prevent empty or multiple submissions
          if (!selectedConnection) {
            toast.error("No connection selected.");
            return;
          }

          const questionToAsk = input;
          setInput(""); // Clear the input field immediately
          await askQuestionAndUpdateDashboard(
            questionToAsk,
            selectedConnection
          );
        },
        [input, isSubmitting, selectedConnection, askQuestionAndUpdateDashboard]
      );

      // Callback for handling a favorite question being asked
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
          handleNewChat(); // Start a new chat session for the favorite question
          // Allow state update to propagate before asking new question
          await new Promise<void>((resolve) => setTimeout(resolve, 0));
          setSelectedConnection(connectionName); // Set the selected connection
          setInput(question); // Pre-fill the input with the favorite question
          // Ask the question, which will update the dashboard
          await askQuestionAndUpdateDashboard(question, connectionName);
        },
        [
          connections,
          handleNewChat,
          setSelectedConnection,
          askQuestionAndUpdateDashboard,
        ]
      );

      // Effect to synchronize selectedConnection with sessionConnection if a session is loaded
      useEffect(() => {
        if (sessionConnection) {
          if (selectedConnection !== sessionConnection)
            setSelectedConnection(sessionConnection);
        }
      }, [sessionConnection, setSelectedConnection, selectedConnection]);

      // Effect to load/validate session from local storage on component mount
      useEffect(() => {
        const storedSessionId = localStorage.getItem("currentSessionId");
        if (storedSessionId) {
          axios
            .get(`${API_URL}/api/sessions/${storedSessionId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then(() => loadSession(storedSessionId)) // Load session if valid
            .catch((error) => {
              console.error("Stored session invalid or error loading:", error);
              localStorage.removeItem("currentSessionId"); // Clear invalid session
              clearSession(); // Reset session state
            });
        } else if (sessionId) {
          // If there's a sessionId in state but not in localStorage, clear it.
          clearSession();
        }
      }, [loadSession, token, clearSession, sessionId]);

      // Effect to handle initial question prop from outside the component
      useEffect(() => {
        if (initialQuestion && !connectionsLoading && connections.length > 0) {
          let targetConnection = initialQuestion.connection;
          // Fallback to first connection if the specified one isn't found
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
          setSelectedConnection(targetConnection); // Set the connection for the initial question
          // Ask the initial question, which will update the dashboard
          askQuestionAndUpdateDashboard(initialQuestion.text, targetConnection);
          if (onQuestionAsked) onQuestionAsked();
        }
      }, [
        initialQuestion,
        connections,
        connectionsLoading,
        askQuestionAndUpdateDashboard,
        onQuestionAsked,
        setSelectedConnection,
      ]);

      // Effect to manage dashboard history index when history changes
      useEffect(() => {
        if (
          dashboardHistory.length > 0 &&
          currentHistoryIndex >= dashboardHistory.length
        ) {
          setCurrentHistoryIndex(dashboardHistory.length - 1);
        } else if (dashboardHistory.length === 0 && currentHistoryIndex !== 0) {
          setCurrentHistoryIndex(0);
          // Re-initialize dashboard history if it becomes empty
          setDashboardHistory([
            {
              id: generateId(),
              question: "Initial Dashboard View",
              kpiData: initialDashboardKpis,
              mainViewData: initialMainViewData,
              textualSummary: "Welcome! Ask a question to analyze your data.",
              lastViewType: "graph",
            },
          ]);
        }
      }, [
        dashboardHistory,
        currentHistoryIndex,
        initialDashboardKpis,
        initialMainViewData,
      ]);

      // Callback for handling connection selection from the dropdown
      const handleSelect = useCallback(
        (option: any) => {
          if (option?.value === "create-con") {
            onCreateConSelected(); // Trigger action to create a new connection
            if (sessionId) handleNewChat(); // Start a new chat if a session is active
            setSelectedConnection(null); // Clear selected connection
            localStorage.removeItem("selectedConnection"); // Remove from local storage
          } else if (option) {
            const newSelectedConnection = option.value.connectionName;
            if (selectedConnection !== newSelectedConnection || !sessionId) {
              // If connection changes or no session, start new chat/session
              handleNewChat();
              setSelectedConnection(newSelectedConnection); // Set the new selected connection
              localStorage.setItem("selectedConnection", newSelectedConnection); // Store in local storage
            }
          } else {
            // Option is null (cleared selection)
            if (selectedConnection) {
              // Only call new chat if there was a selection before
              handleNewChat();
            }
            setSelectedConnection(null); // Clear selected connection
            localStorage.removeItem("selectedConnection"); // Remove from local storage
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

      // Callback for handling PDF click (mock function)
      const handlePdfClick = useCallback(
        (connectionName: string, e: React.MouseEvent) => {
          e.stopPropagation(); // Prevent dropdown from closing
          toast.info(
            `Generating Data Atlas for ${connectionName}... (Mock Action)`
          );
          // In a real app, you'd trigger PDF generation or navigation here
        },
        []
      );

      // Callback for selecting a previous question from the modal
      const handleSelectPrevQuestion = useCallback(
        (questionContent: string) => {
          setInput(questionContent); // Set the input field with the selected question
          setShowPrevQuestionsModal(false); // Close the modal
        },
        []
      );

      // Callback to navigate through dashboard history (prev/next)
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
          setCurrentHistoryIndex(newIndex); // Update the history index
          // Set the main view type based on the last saved preference for that history item
          setCurrentMainViewType(
            dashboardHistory[newIndex]?.lastViewType || "graph"
          );
        },
        [currentHistoryIndex, dashboardHistory]
      );

      // Callback to change the active view type within the main dashboard view
      const handleViewTypeChange = useCallback(
        (viewType: "graph" | "table" | "query") => {
          setCurrentMainViewType(viewType); // Update the active view type
          // Optionally, save this preference to the current history item
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

      // Expose functions to parent components via ref
      useImperativeHandle(ref, () => ({
        handleNewChat,
        handleAskFavoriteQuestion,
      }));

      // Filter user questions from session messages for the "Previous Questions" modal
      const userQuestionsFromSession = messages
        .filter((msg) => !msg.isBot)
        .reverse();

      // Determine if the dashboard should be shown (based on active session or existing messages)
      const showDashboard = sessionId || messages.length > 0;

      return (
        <div
          className={`flex flex-col h-screen transition-colors duration-300 overflow-hidden`}
          style={{
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
          }}
        >
          {/* ToastContainer for displaying notifications */}
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

          {/* Main content area */}
          <main className="flex-grow flex flex-col items-center overflow-y-auto">
            <div className="w-full flex-grow flex flex-col">
              {" "}
              {/* Fixed width container, added flex-grow and flex-col */}
              {connectionsLoading ? (
                // Display loader while connections are loading
                <div className="flex justify-center items-center flex-grow">
                  <Loader text="Loading connections..." />
                </div>
              ) : connections.length === 0 && !connectionsLoading ? (
                // Case 1: No connections exist at all, prompt to create one
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
              ) : !selectedConnection && connections.length > 0 ? (
                // Case 2: Connections exist, but none is selected, prompt to select one
                <div className="flex flex-col items-center justify-center flex-grow text-center">
                  <h1
                    className={`text-2xl font-semibold mb-4 ${
                      theme.mode === "dark"
                        ? "text-slate-300"
                        : "text-slate-700"
                    }`}
                  >
                    Welcome to Your Analytics Dashboard
                  </h1>
                  <p
                    className={`${
                      theme.mode === "dark"
                        ? "text-slate-400"
                        : "text-slate-600"
                    } mb-6`}
                  >
                    Please select a data connection to begin your analysis.
                  </p>
                </div>
              ) : showDashboard ? (
                // Case 3: User has asked a question or has an active session, show the DashboardView
                <DashboardView
                  dashboardItem={currentDashboardView} // Pass the current dashboard data
                  theme={theme} // Pass theme for consistent styling
                  isSubmitting={isSubmitting} // Indicate if data is being processed
                  activeViewType={currentMainViewType} // Current active view (graph, table, query)
                  onViewTypeChange={handleViewTypeChange} // Callback to change view type
                  onNavigateHistory={navigateDashboardHistory} // Callback for history navigation
                  historyIndex={currentHistoryIndex} // Current position in history
                  historyLength={dashboardHistory.length} // Total number of history items
                />
              ) : (
                // Case 4: No questions asked yet, but a connection is selected. Show initial prompt and recommended questions.
                <div className="flex flex-col items-center justify-center flex-grow px-4 text-center">
                  <h1
                    className={`text-2xl font-semibold mb-4 ${
                      theme.mode === "dark"
                        ? "text-slate-300"
                        : "text-slate-700"
                    }`}
                  >
                    Ask a question to get started!
                  </h1>
                  <p
                    className={`${
                      theme.mode === "dark"
                        ? "text-slate-400"
                        : "text-slate-600"
                    } mb-8 max-w-md`}
                  >
                    Enter your query in the input box below to analyze your data
                    and generate insights.
                  </p>
                  {recommendedQuestions.length > 0 && (
                    <div className="w-full max-w-2xl">
                      <RecommendedQuestions
                        questions={recommendedQuestions}
                        onQuestionSelect={handleAskFavoriteQuestion}
                        theme={theme}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>

          {/* Schema Explorer Modal */}
          {isDbExplorerOpen && selectedConnection && (
            <div className="w-3/4  backdrop-blur-lg self-center absolute bottom-16 z-50 flex items-center justify-center">
              <SchemaExplorer
                schemas={schemaSampleData}
                onClose={() => setIsDbExplorerOpen(false)}
                theme={theme}
                onColumnClick={() => console.log("Column clicked")}
                selectedConnection={selectedConnection}
              />
            </div>
          )}

          {/* Footer with buttons and ChatInput */}
          <footer
            className={`shadow-top flex justify-center pb-2`} /* Added padding to footer */
            style={{
              background: theme.colors.background,
            }}
          >
            <div className="w-full max-w-4xl flex items-center gap-2 px-2">
              {" "}
              {/* Fixed width container and horizontal padding */}
              {/* Connection Dropdown Button */}
              <div className="relative">
                <CustomTooltip
                  title="Change or create a connection"
                  position="top"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsConnectionDropdownOpen((prev) => !prev);
                      setIsDbExplorerOpen(false); // Close schema explorer when opening connection dropdown
                    }}
                    disabled={isSubmitting}
                    className={`p-2.5 shadow-lg rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50
                            `}
                    style={{
                      background: theme.colors.surface,
                      color: theme.colors.accent,
                    }}
                    aria-label="Select Connection"
                  >
                    <Database size={20} />
                    {/* <ChevronDown
                      size={16}
                      className={`absolute bottom-0 right-0 transition-transform duration-200 ${
                        isConnectionDropdownOpen ? "rotate-180" : ""
                      }`}
                      style={{ color: theme.colors.accent }}
                    /> */}
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
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
              {/* Database Explorer Button */}
              <CustomTooltip title="Explore Database Schema" position="top">
                <button
                  type="button"
                  onClick={() => {
                    setIsDbExplorerOpen((prev) => !prev);
                    setIsConnectionDropdownOpen(false); // Close connection dropdown when opening schema explorer
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
              {/* New Chat Button */}
              <CustomTooltip title="Create a new session" position="top">
                <button
                  type="button"
                  onClick={handleNewChat}
                  disabled={isSubmitting}
                  className={`p-2.5 shadow-lg rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50
                            `}
                  style={{
                    background: theme.colors.surface,
                    color: theme.colors.accent,
                  }}
                  aria-label="New Chat"
                >
                  <PlusCircle size={20} />
                </button>
              </CustomTooltip>
              {/* ChatInput component */}
              <ChatInput
                input={input}
                isSubmitting={isSubmitting}
                onInputChange={setInput}
                onSubmit={handleSubmit}
                connections={connections}
                selectedConnection={selectedConnection}
                onSelect={handleSelect}
                onNewChat={handleNewChat} // This is no longer directly used by ChatInput for its button, but kept for consistency
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
                  className={`p-2.5 shadow-lg rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50
                            `}
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

          {/* Modal for displaying previous questions */}
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
                    &times;
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

          {/* Connection error display */}
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

// Memoization to optimize re-renders
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
