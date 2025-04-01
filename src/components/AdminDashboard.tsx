import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import ConnectionForm from "./ConnectionForm";
import LDAPForm from "./LDAPForm";
import Setting from "./Settings";
import ExistingConnections from "./ExistingConnections";
import { useTheme } from "../ThemeContext";
import { Database, Key, Settings, LogOut, Link, Server } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LDAPConfigDisplay from "./LDAPConfigDisplay";

interface AdminDashboardProps {
  onLogout: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  subMenu?: MenuItem[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeMenu, setActiveMenu] = useState<string>("create-connection");
  const { theme } = useTheme();
  const [token, setToken] = useState<string | null>(
    sessionStorage.getItem("token")
  );

  const adminMenuItems: MenuItem[] = [
    { id: "create-connection", label: "Create Connection", icon: Database },
    { id: "create-ldap", label: "Create LDAP Details", icon: Key },
    { id: "existing-connection", label: "Existing Connection", icon: Link },
    // { id: "users", label: "Manage Users", icon: User },
    { id: "ldap-config", label: "LDAP Config", icon: Server },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "logout", label: "Logout", icon: LogOut },
  ];

  const mode = theme.colors.background === "#0F172A" ? "dark" : "light";

  useEffect(() => {
    if (!token) {
      toast.error("Admin token not found. Please log in again.", {
        theme: mode,
      });
      onLogout();
    }
  }, [token, onLogout, mode]);

  const handleMenuClick = (id: string) => {
    if (id === "logout") {
      sessionStorage.removeItem("token"); // Match key from AdminLogin
      setToken(null);
      onLogout();
    } else {
      setActiveMenu(id);
    }
  };

  const handleCreateConnection = () => {
    setActiveMenu("create-connection");
  };

  if (!token) {
    return null; // Render nothing if token is invalid; onLogout will redirect
  }

  return (
    <div
      className="flex h-screen"
      style={{ backgroundColor: theme.colors.background }}
    >
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar
        closeOnClick
        pauseOnHover
        theme={mode}
      />
      <Sidebar
        onMenuClick={handleMenuClick}
        activeMenu={activeMenu}
        menuItems={adminMenuItems}
      />
      <main
        className="flex-1 overflow-y-auto"
        style={{ backgroundColor: theme.colors.surface }}
      >
        {activeMenu === "create-connection" && (
          <ConnectionForm
            token={token}
            isAdmin={true}
            onSuccess={() => {
              toast.success("Connection created successfully!", {
                theme: mode,
              });
            }}
          />
        )}
        {activeMenu === "create-ldap" && <LDAPForm adminId={token} />}
        {activeMenu === "existing-connection" && (
          <ExistingConnections
            isAdmin={true}
            createConnection={handleCreateConnection}
          />
        )}
        {activeMenu === "ldap-config" && <LDAPConfigDisplay />}
        {activeMenu === "users" && (
          <div
            className="p-6 rounded-lg shadow-md"
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
            }}
          >
            Manage Users (Placeholder)
          </div>
        )}
        {activeMenu === "settings" && <Setting />}
      </main>
    </div>
  );
};

export default AdminDashboard;
