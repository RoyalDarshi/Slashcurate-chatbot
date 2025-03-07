import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ChatInterface from "./components/ChatInterface";
import LoginSignup from "./components/LoginSignup";
import ResetPassword from "./components/ResetPassword";
import Home from "./components/Home";
import ConnectionForm from "./components/ConnectionForm"; // Import ConnectionForm
import ExistingConnections from "./components/ExistingConnections";
import History from "./components/History";

function App() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

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
                <div className="min-h-screen flex h-screen bg-gray-100 dark:bg-gray-900">
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
