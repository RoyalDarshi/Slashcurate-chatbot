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
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { handleLogout } from "./utils";
import "./index.css";
import { API_URL, DBCON_API_URL, ADMIN_API_URL } from "./config"; // Added ADMIN_API_URL
import axios from "axios";
import { menuItems } from "./menuItems";

function App() {
  const [activeMenu, setActiveMenu] = useState<string | null>("home");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // Changed back to false for initial state
  const [isAdminAuthenticated, setIsAdminAuthenticated] =
    useState<boolean>(false);

  const validateUser = async (type: "user" | "admin") => {
    const key = type === "user" ? "userId" : "adminId";
    const userId = sessionStorage.getItem(key);
    if (userId) {
      try {
        // Use different API URLs based on type
        const validationUrl = type === "user" ? API_URL : ADMIN_API_URL;
        const response = await axios.post(`${validationUrl}/validate-token`, {
          token: userId,
        });
        if (response.status === 200) {
          type === "user"
            ? setIsAuthenticated(true)
            : setIsAdminAuthenticated(true);
          if (type === "user") setActiveMenu("home");
        } else {
          sessionStorage.removeItem(key);
          type === "user"
            ? setIsAuthenticated(false)
            : setIsAdminAuthenticated(false);
        }
      } catch (error) {
        console.error(`Error validating ${type} token:`, error);
        sessionStorage.removeItem(key);
        type === "user"
          ? setIsAuthenticated(false)
          : setIsAdminAuthenticated(false);
      }
    }
  };

  useEffect(() => {
    validateUser("user");
    validateUser("admin");
  }, []);

  const handleLoginSuccess = (userId: string, isAdmin: boolean = false) => {
    console.log(
      "handleLoginSuccess called, userId:",
      userId,
      "isAdmin:",
      isAdmin
    );
    const key = isAdmin ? "adminId" : "userId";
    sessionStorage.setItem(key, userId);
    if (isAdmin) {
      setIsAdminAuthenticated(true);
    } else {
      setIsAuthenticated(true);
      setActiveMenu("home");
    }
  };

  const handleCreateConSelected = () => {
    console.log("handleCreateConSelected called");
    setActiveMenu("new-connection");
  };

  const handleHomePage = () => {
    setActiveMenu("home");
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
                onHomePage={handleHomePage}
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
                <AdminLogin
                  onLoginSuccess={(userId) => handleLoginSuccess(userId, true)}
                />
              )
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
  onLoginSuccess: (userId: string, isAdmin?: boolean) => void;
  onLogout: () => void;
  onCreateConSelected: () => void;
  onHomePage: () => void;
}> = ({
  isAuthenticated,
  activeMenu,
  setActiveMenu,
  onLoginSuccess,
  onLogout,
  onCreateConSelected,
  onHomePage,
}) => {
  const { theme } = useTheme();
  const userId = sessionStorage.getItem("userId") || "";

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
            defaultMenuItems={menuItems}
            onLogout={onLogout}
          />
          <main
            className="flex-1 flex flex-col overflow-y-auto"
            style={{ backgroundColor: theme.colors.surface }}
          >
            {activeMenu === "home" && (
              <ChatInterface onCreateConSelected={onCreateConSelected} />
            )}
            {activeMenu === "new-connection" && (
              <ConnectionForm
                baseUrl={DBCON_API_URL} // Regular user endpoint
                userId={userId}
                isAdmin={false}
                onSuccess={() => setActiveMenu("existing-connection")}
              />
            )}
            {activeMenu === "existing-connection" && <ExistingConnections />}
            {activeMenu === "history" && (
              <History onSessionClicked={onHomePage} />
            )}
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
