import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ConnectionForm from "./components/ConnectionForm";
import type { ChatInterfaceHandle } from "./components/ChatInterface";
import type { DashboardInterfaceHandle } from "./components/DashboardInterface";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { SettingsProvider, useSettings } from "./SettingsContext";
import { handleLogout } from "./utils";
import "@fontsource/inter";
import "./index.css";
import { authService } from "./services/authService";
import { menuItems } from "./menuItems";
import UserTips from "./components/UserTips";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Lazy-loaded routes
const ChatInterface = React.lazy(() => import("./components/ChatInterface"));
const DashboardInterface = React.lazy(() => import("./components/DashboardInterface"));
const LoginSignup = React.lazy(() => import("./components/LoginSignup"));
const ResetPassword = React.lazy(() => import("./components/ResetPassword"));
const ExistingConnections = React.lazy(() => import("./components/ExistingConnections"));
const History = React.lazy(() => import("./components/History"));
const Favourites = React.lazy(() => import("./components/Favourites"));
const Settings = React.lazy(() => import("./components/Settings"));
const HelpPage = React.lazy(() => import("./components/HelpPage"));
const AdminDashboard = React.lazy(() => import("./components/AdminDashboard"));
import { MessageSquare } from "lucide-react";
import { useConnections, useSession, useRecommendedQuestions } from "./hooks";
import { motion, AnimatePresence } from "framer-motion";

const LoadingFallback = () => (
  <div className="flex h-screen w-screen items-center justify-center transition-colors duration-300" style={{ backgroundColor: "#0F172A" }}>
    <div className="flex flex-col items-center gap-4 animate-fade-in">
      <div className="w-8 h-8 border-4 border-t-transparent border-indigo-500 rounded-full animate-spin"></div>
      <p className="text-white opacity-70 text-xs font-semibold tracking-wider animate-pulse uppercase">Loading Workspace...</p>
    </div>
  </div>
);

function App() {
  const [activeMenu, setActiveMenu] = useState<string | null>("home");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [questionToAsk, setQuestionToAsk] = useState<{
    text: string;
    connection: string;
    query?: string;
  } | null>(null);
  const [showTip, setShowTip] = useState<boolean>(false);
  const chatRef = useRef<ChatInterfaceHandle>(null);
  const dashboardRef = useRef<DashboardInterfaceHandle>(null);

  const triggerChatFunction = () => {
    if (chatRef.current) {
      chatRef.current.handleNewChat();
    }
    if (dashboardRef.current) {
      dashboardRef.current.handleNewChat();
    }
  };

  const validateUser = async () => {
    const adminToken = authService.getToken(true);
    const userToken = authService.getToken(false);
    
    try {
      if (adminToken) {
        const { valid, isAdmin } = await authService.validateToken(adminToken);
        if (valid && isAdmin) {
          setIsAdminAuthenticated(true);
        } else {
          authService.clearTokens();
          setIsAdminAuthenticated(false);
        }
      } else if (userToken) {
        const { valid, isAdmin } = await authService.validateToken(userToken);
        if (valid && !isAdmin) {
          setIsAuthenticated(true);
          setActiveMenu("home");
        } else {
          authService.clearTokens();
          setIsAuthenticated(false);
        }
      }
    } catch (e) {
      authService.clearTokens();
      setIsAdminAuthenticated(false);
      setIsAuthenticated(false);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    validateUser();
  }, []);

  const handleNewChat = () => {
    triggerChatFunction();
    localStorage.removeItem("currentSessionId");
    localStorage.removeItem("currentDashboardQuestionId");
    handleHomePage();
  };

  const handleUserLogout = () => {
    handleLogout();
    authService.logout();
    setIsAuthenticated(false);
    setIsAdminAuthenticated(false);
    localStorage.removeItem("currentSessionId");
    localStorage.removeItem("currentDashboardQuestionId");
  };

  const handleLoginSuccess = (token: string, isAdmin = false) => {
    // token is already saved by authService before this is called
    if (isAdmin) {
      setIsAdminAuthenticated(true);
      window.location.href = "/admin"; 
    } else {
      setIsAuthenticated(true);
      handleNewChat();
      setActiveMenu("home");
      setTimeout(() => setShowTip(true), 1500);
    }
  };

  const handleCreateConSelected = () => {
    setActiveMenu("existing-connection");
  };

  const handleHomePage = () => {
    setActiveMenu("home");
  };

  if (isInitializing) {
    return (
      <ThemeProvider>
        <div className="flex h-screen w-screen items-center justify-center transition-colors duration-300" style={{ backgroundColor: "#0F172A" }}>
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
            <p className="text-white opacity-70 text-sm font-semibold tracking-wider animate-pulse">VERIFYING SESSION</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SettingsProvider isAuthenticated={isAuthenticated}>
        <Router>
          <React.Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route
                path="/"
                element={
                  <AppContent
                    isAuthenticated={isAuthenticated}
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                    onLoginSuccess={handleLoginSuccess}
                    onLogout={handleUserLogout}
                    chatRef={chatRef}
                    dashboardRef={dashboardRef}
                    onCreateConSelected={handleCreateConSelected}
                    onHomePage={handleHomePage}
                    onNewChat={handleNewChat}
                    questionToAsk={questionToAsk}
                    setQuestionToAsk={setQuestionToAsk}
                    showTip={showTip}
                    setShowTip={setShowTip}
                  />
                }
              />
              <Route
                path="/admin"
                element={
                  isAdminAuthenticated ? (
                    <AdminDashboard
                      onLogout={() => setIsAdminAuthenticated(false)}
                    />
                  ) : (
                    <Navigate to="/?login=admin" replace />
                  )
                }
              />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
            </Routes>
          </React.Suspense>
        </Router>
      </SettingsProvider>
    </ThemeProvider>
  );
}

const AppContent: React.FC<{
  isAuthenticated: boolean;
  activeMenu: string | null;
  setActiveMenu: (menu: string | null) => void;
  onLoginSuccess: (token: string, isAdmin?: boolean) => void;
  onLogout: () => void;
  onCreateConSelected: () => void;
  onHomePage: () => void;
  chatRef: React.RefObject<ChatInterfaceHandle>;
  dashboardRef: React.RefObject<DashboardInterfaceHandle>;
  questionToAsk: { text: string; connection: string; query?: string } | null;
  setQuestionToAsk: (
    question: { text: string; connection: string; query?: string } | null,
  ) => void;
  showTip: boolean;
  setShowTip: (show: boolean) => void;
  onNewChat: () => void;
}> = ({
  isAuthenticated,
  activeMenu,
  setActiveMenu,
  onLoginSuccess,
  onLogout,
  onCreateConSelected,
  onHomePage,
  chatRef,
  dashboardRef,
  questionToAsk,
  setQuestionToAsk,
  showTip,
  setShowTip,
  onNewChat,
}) => {
  const { theme } = useTheme();
  const { notificationsEnabled, currentView } = useSettings();
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

  const handleSessionClicked = () => {
    onHomePage();
  };

  useEffect(() => {
    if (!notificationsEnabled && showTip) {
      setShowTip(false);
    }
  }, [notificationsEnabled, showTip, setShowTip]);

  return (
    <div
      className="min-h-screen flex flex-col antialiased transition-colors duration-300"
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
        theme={theme.mode === "dark" ? "dark" : "light"}
        style={{ zIndex: 10000 }}
      />
      <AnimatePresence mode="wait">
        {isAuthenticated ? (
          <motion.div
            key="authenticated"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-transparent"
          >
            {/* Mobile safe header gap */}
            <div className="md:hidden h-16 w-full flex-shrink-0" />

            <Sidebar
              onMenuClick={setActiveMenu}
              activeMenu={activeMenu}
              defaultMenuItems={
                localStorage.getItem("allowedToCreateConnection") !== "false"
                  ? menuItems
                  : menuItems // We don't filter out new-connection here since we removed it from menuItems.
              }
              onLogout={onLogout}
            />

            <main
              className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
              style={{
                backgroundColor: theme.colors.surface,
                boxShadow: "none",
                borderLeft: "none",
              }}
            >
              <UserTips show={showTip} onClose={() => setShowTip(false)} />
              <div className="flex-1 flex flex-col overflow-hidden relative">
                {activeMenu === "home" && (
                  <>
                    <div className={`absolute inset-0 flex flex-col ${currentView === "chat" ? "z-10" : "hidden"}`}>
                      <ChatInterface
                        ref={chatRef}
                        onCreateConSelected={onCreateConSelected}
                        initialQuestion={currentView === "chat" ? questionToAsk : null}
                        onQuestionAsked={() => setQuestionToAsk(null)}
                        connections={connections}
                        selectedConnection={selectedConnection}
                        setSelectedConnection={setSelectedConnection}
                        connectionError={connectionError}
                        connectionsLoading={connectionsLoading}
                        sessionId={sessionId}
                        messages={messages}
                        dispatchMessages={dispatchMessages}
                        sessionConnection={sessionConnection}
                        loadSession={loadSession}
                        clearSession={clearSession}
                        recommendedQuestions={recommendedQuestions}
                      />
                    </div>
                    <div className={`absolute inset-0 flex flex-col ${currentView === "dashboard" ? "z-10" : "hidden"}`}>
                      <DashboardInterface
                        ref={dashboardRef}
                        onCreateConSelected={onCreateConSelected}
                        initialQuestion={currentView === "dashboard" ? questionToAsk : null}
                        onQuestionAsked={() => setQuestionToAsk(null)}
                        connections={connections}
                        selectedConnection={selectedConnection}
                        setSelectedConnection={setSelectedConnection}
                        connectionError={connectionError}
                        connectionsLoading={connectionsLoading}
                        sessionId={sessionId}
                        messages={messages}
                        dispatchMessages={dispatchMessages}
                        sessionConnection={sessionConnection}
                        loadSession={loadSession}
                        clearSession={clearSession}
                        recommendedQuestions={recommendedQuestions}
                      />
                    </div>
                  </>
                )}
                {activeMenu === "existing-connection" && (
                  <div className="p-0 overflow-y-auto flex-1 custom-scrollbar">
                    <ExistingConnections
                      isAdmin={false}
                      createConnection={onCreateConSelected}
                    />
                  </div>
                )}
                {activeMenu === "history" && (
                  <div className="p-0 overflow-y-auto flex-1 custom-scrollbar">
                    <History onSessionClicked={handleSessionClicked} />
                  </div>
                )}
                {activeMenu === "favourite" && (
                  <div className="p-0 overflow-y-auto flex-1 custom-scrollbar">
                    <Favourites
                      onFavoriteSelected={(question, connection, query) => {
                        setQuestionToAsk({ text: question, connection, query });
                        setTimeout(() => setActiveMenu("home"), 0);
                      }}
                    />
                  </div>
                )}
                {activeMenu === "settings" && <Settings />}
                {activeMenu === "help" && (
                  <div className="p-0 overflow-y-auto flex-1 custom-scrollbar">
                   <HelpPage
                    onCreateConSelected={onCreateConSelected}
                    onNewChat={onNewChat}
                  />
                  </div>
                )}
              </div>
            </main>
          </motion.div>
        ) : (
          <motion.div
            key="unauthenticated"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full min-h-screen"
          >
            <LoginSignup onLoginSuccess={onLoginSuccess} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
