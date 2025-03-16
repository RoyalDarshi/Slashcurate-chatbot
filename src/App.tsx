import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ChatInterface from "./components/ChatInterface";
import LoginSignup from "./components/LoginSignup";
import ResetPassword from "./components/ResetPassword";
import ConnectionForm from "./components/ConnectionForm";
import ExistingConnections from "./components/ExistingConnections";
import History from "./components/History";
import Settings from "./components/Settings";
import { ThemeProvider, useTheme } from "./ThemeContext";
import "./index.css";

function App() {
  const [activeMenu, setActiveMenu] = useState<string | null>("home");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const userId = sessionStorage.getItem("userId");
    if (userId) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = (userId: string) => {
    console.log("handleLoginSuccess called, userId:", userId);
    sessionStorage.setItem("userId", userId);
    setIsAuthenticated(true);
    setActiveMenu("home"); // Redirect to home after login
  };

  const handleLogout = () => {
    sessionStorage.removeItem("userId");
    setIsAuthenticated(false);
    setActiveMenu("home");
  };

  const handleCreateConSelected = () => {
    console.log("handleCreateConSelected called");
    setActiveMenu("new-connection");
  };

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <AppContent
                isAuthenticated={isAuthenticated}
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onLoginSuccess={handleLoginSuccess}
                onLogout={handleLogout}
                onCreateConSelected={handleCreateConSelected}
              />
            }
          />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

const AppContent: React.FC<{
  isAuthenticated: boolean;
  activeMenu: string | null;
  setActiveMenu: (menu: string | null) => void;
  onLoginSuccess: (userId: string) => void;
  onLogout: () => void;
  onCreateConSelected: () => void;
}> = ({
  isAuthenticated,
  activeMenu,
  setActiveMenu,
  onLoginSuccess,
  onLogout,
  onCreateConSelected,
}) => {
  const { theme } = useTheme();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
      }}
    >
      {isAuthenticated ? (
        <div className="flex h-screen">
          <Sidebar
            onMenuClick={setActiveMenu}
            activeMenu={activeMenu}
            onLogout={onLogout}
          />
          <main
            className="flex-1 flex flex-col overflow-y-auto"
            style={{ backgroundColor: theme.colors.surface }}
          >
            {activeMenu === "home" && (
              <ChatInterface onCreateConSelected={onCreateConSelected} />
            )}
            {activeMenu === "new-connection" && <ConnectionForm />}
            {activeMenu === "existing-connection" && <ExistingConnections />}
            {activeMenu === "history" && <History />}
            {activeMenu === "settings" && <Settings />}
          </main>
        </div>
      ) : (
        <LoginSignup onLoginSuccess={onLoginSuccess} />
      )}
    </div>
  );
};

export default App;
