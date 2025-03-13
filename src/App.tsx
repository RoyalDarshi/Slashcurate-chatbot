import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ChatInterface from "./components/ChatInterface";
import LoginSignup from "./components/LoginSignup";
import ResetPassword from "./components/ResetPassword";
import Home from "./components/Home";
import ConnectionForm from "./components/ConnectionForm";
import ExistingConnections from "./components/ExistingConnections";
import History from "./components/History";
import Settings from "./components/Settings";
import { ThemeProvider, useTheme } from "./ThemeContext";
import "./index.css";

function App() {
  const [activeMenu, setActiveMenu] = useState<string | null>("home"); // Default to "home"
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
  };

  const handleLogout = () => {
    sessionStorage.removeItem("userId");
    setIsAuthenticated(false);
    setActiveMenu("home");
  };

  const handleHomeButtonClick = () => {
    console.log("handleHomeButtonClick called");
    setActiveMenu("new-chat");
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
                onLoginSuccess={handleLoginSuccess} // Pass the function as a prop
                onLogout={handleLogout}
                onHomeButtonClick={handleHomeButtonClick}
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
  onLoginSuccess: (userId: string) => void; // Define prop type
  onLogout: () => void;
  onHomeButtonClick: () => void;
  onCreateConSelected: () => void;
}> = ({
  isAuthenticated,
  activeMenu,
  setActiveMenu,
  onLoginSuccess, // Use the prop here
  onLogout,
  onHomeButtonClick,
  onCreateConSelected,
}) => {
  const { theme } = useTheme();

  return (
    <>
      {isAuthenticated ? (
        <div
          className="min-h-screen flex h-screen"
          style={{ background: theme.colors.background }}
        >
          <Sidebar
            onMenuClick={setActiveMenu}
            activeMenu={activeMenu}
            onLogout={onLogout}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeMenu === "home" && <Home onBtnClick={onHomeButtonClick} />}
            {activeMenu === "new-chat" && (
              <ChatInterface onCreateConSelected={onCreateConSelected} />
            )}
            {activeMenu === "new-connection" && <ConnectionForm />}
            {activeMenu === "existing-connection" && <ExistingConnections />}
            {activeMenu === "history" && <History />}
            {activeMenu === "settings" && <Settings />}
          </div>
        </div>
      ) : (
        <LoginSignup onLoginSuccess={onLoginSuccess} /> // Use the prop, not handleLoginSuccess
      )}
    </>
  );
};

export default App;
