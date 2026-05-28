import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import ConnectionForm from "./ConnectionForm";
import LDAPManager from "./LDAPManager";
import Setting from "./Settings";
import ExistingConnections from "./ExistingConnections";
import UserManagement from "./UserManagement";
import PermissionControl from "./PermissionControl";
import { useTheme } from "../ThemeContext";
// <-- ADD 'User' to the lucide-react imports
import { Database, Key, Settings, LogOut, Link, Server, User, Shield } from "lucide-react"; 
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { authService } from "../services/authService";

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
  const [activeMenu, setActiveMenu] = useState<string>("existing-connection");
  const { theme } = useTheme();
  const [token, setToken] = useState<string | null>(
    authService.getToken(true)
  );

  const adminMenuItems: MenuItem[] = [
    { id: "existing-connection", label: "Connections", icon: Link },
    { id: "users", label: "Manage Users", icon: User },
    { id: "permission-control", label: "Permission Control", icon: Shield },
    { id: "ldap-settings", label: "LDAP Settings", icon: Server },
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
      authService.clearTokens();
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
        {activeMenu === "existing-connection" && (
          <ExistingConnections
            isAdmin={true}
            createConnection={handleCreateConnection}
          />
        )}
        {activeMenu === "ldap-settings" && <LDAPManager />}
        {activeMenu === "users" && (
          <UserManagement token={token} />
        )}
        {activeMenu === "permission-control" && (
          <PermissionControl token={token} />
        )}
        
        {activeMenu === "settings" && <Setting />}
      </main>
    </div>
  );
};

export default AdminDashboard;