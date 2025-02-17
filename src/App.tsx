import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ConnectionManager from "./components/ConnectionManager";
import ChatInterface from "./components/ChatInterface";
import LoginSignup from "./components/LoginSignup";

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

  return (
    <>
      {isAuthenticated ? (
        <div className="min-h-screen flex h-screen bg-gray-100 dark:bg-gray-900">
          <Sidebar onMenuClick={setActiveMenu} />
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeMenu === "connections" ? (
              <ConnectionManager />
            ) : (
              <ChatInterface />
            )}
          </div>
        </div>
      ) : (
        <LoginSignup onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}

export default App;
