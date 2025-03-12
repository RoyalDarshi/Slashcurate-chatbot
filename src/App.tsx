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
import "./index.css";

function App() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [theme, setTheme] = useState<string>(
    localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    console.log("Theme useEffect triggered:", theme);
    // Update both HTML element class and data-theme attribute
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    console.log("toggleTheme called, newTheme:", newTheme);
    setTheme(newTheme);
  };

  useEffect(() => {
    const userId = sessionStorage.getItem("userId");
    if (userId) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = (userId: string) => {
    sessionStorage.setItem("userId", userId);
    setIsAuthenticated(true);
  };

  const handleHomeButtonClick = () => {
    setActiveMenu("new-chat");
  };

  const handleCreateConSelected = () => {
    setActiveMenu("new-connection");
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <>
              {isAuthenticated ? (
                <div
                  className={`min-h-screen flex h-screen bg-gray-100 dark:bg-gray-900`}
                >
                  <Sidebar
                    onMenuClick={setActiveMenu}
                    activeMenu={activeMenu}
                  />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {activeMenu === "home" && (
                      <Home onBtnClick={handleHomeButtonClick} />
                    )}
                    {activeMenu === "new-chat" && (
                      <ChatInterface
                        onCreateConSelected={handleCreateConSelected}
                      />
                    )}
                    {activeMenu === "new-connection" && <ConnectionForm />}
                    {activeMenu === "existing-connection" && (
                      <ExistingConnections />
                    )}
                    {activeMenu === "history" && <History />}
                    {activeMenu === "settings" && (
                      <Settings toggleTheme={toggleTheme} theme={theme} />
                    )}
                  </div>
                </div>
              ) : (
                <LoginSignup onLoginSuccess={handleLoginSuccess} />
              )}
            </>
          }
        />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
