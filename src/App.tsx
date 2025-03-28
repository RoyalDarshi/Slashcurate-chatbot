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
import "@fontsource/inter";
import "./index.css";
import { validateToken } from "./api";
import { menuItems } from "./menuItems";
import Favourites from "./components/Favourites";

function App() {
  const [activeMenu, setActiveMenu] = useState<string | null>("home");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] =
    useState<boolean>(false);

  const validateUser = async () => {
    const key = "token";
    const token = sessionStorage.getItem(key);
    if (token) {
      // try {
      //   const response = await validateToken(token);
      //   if (response.status === 200) {
      //     !response.data.isAdmin
      //       ? setIsAuthenticated(true)
      //       : setIsAdminAuthenticated(true);
      //     setActiveMenu("home");
      //   } else {
      //     sessionStorage.removeItem(key);
      //     setIsAuthenticated(false);
      //     setIsAdminAuthenticated(false);
      //   }
      // } catch (error) {
      //   console.error(`Error validating token:`, error);
      //   sessionStorage.removeItem(key);
      //   setIsAuthenticated(false);
      //   setIsAdminAuthenticated(false);
      // }
      setIsAuthenticated(true);
    }
  };

  // useEffect(() => {
  //   validateUser();
  // }, []);

  const handleLoginSuccess = (token: string, isAdmin: boolean = false) => {
    sessionStorage.setItem("token", token);
    if (isAdmin) {
      setIsAdminAuthenticated(true);
    } else {
      setIsAuthenticated(true);
      setActiveMenu("home");
    }
  };

  const handleCreateConSelected = () => {
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
                onLogout={() => handleLogout(setIsAuthenticated)}
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
                  onLoginSuccess={(token) => handleLoginSuccess(token, true)}
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
  onLoginSuccess: (token: string, isAdmin?: boolean) => void;
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
  const userToken = sessionStorage.getItem("token") || "";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
      }}
    >
      {isAuthenticated ? (
        <div className="flex flex-col md:flex-row h-screen bg-transparent">
          {/* Mobile header spacer */}
          <div className="md:hidden h-16 w-full" />

          <Sidebar
            onMenuClick={setActiveMenu}
            activeMenu={activeMenu}
            defaultMenuItems={menuItems}
            onLogout={onLogout}
          />

          <main
            className="flex-1 flex flex-col overflow-y-auto md:mt-0 mt-16"
            style={{
              backgroundColor: theme.colors.surface,
              minHeight: "calc(100vh - 64px)", // Ensure full height
            }}
          >
            {activeMenu === "home" && (
              <ChatInterface onCreateConSelected={onCreateConSelected} />
            )}
            {activeMenu === "new-connection" && (
              <ConnectionForm
                userId={userToken}
                isAdmin={false}
                onSuccess={() => setActiveMenu("existing-connection")}
              />
            )}
            {activeMenu === "existing-connection" && (
              <ExistingConnections isAdmin={false} />
            )}
            {activeMenu === "history" && (
              <History onSessionClicked={onHomePage} />
            )}
            {activeMenu === "favourite" && (
              <Favourites onSessionClicked={onHomePage} />
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
