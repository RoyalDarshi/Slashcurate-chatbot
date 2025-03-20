import React, { useState } from "react";
import Sidebar from "./Sidebar";
import ConnectionForm from "./ConnectionForm";
import LDAPForm from "./LDAPForm";
import { useTheme } from "../ThemeContext";
import { Database, Key, User, Settings, LogOut } from "lucide-react";
import { ADMIN_API_URL } from "../config";

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeMenu, setActiveMenu] = useState<string>("create-connection");
  const { theme } = useTheme();
  const adminId = sessionStorage.getItem("adminId") || "";

  const adminMenuItems = [
    { id: "create-connection", label: "Create Connection", icon: Database },
    { id: "create-ldap", label: "Create LDAP Details", icon: Key },
    { id: "users", label: "Manage Users", icon: User },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "logout", label: "Logout", icon: LogOut },
  ];

  const handleMenuClick = (id: string) => {
    if (id === "logout") {
      sessionStorage.removeItem("adminId");
      onLogout();
    } else {
      setActiveMenu(id);
    }
  };

  return (
    <div
      className="flex h-screen"
      style={{ backgroundColor: theme.colors.background }}
    >
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
            baseUrl={ADMIN_API_URL} // Admin endpoint
            userId={adminId}
            isAdmin={true}
            onSuccess={() => console.log("Admin connection created")}
          />
        )}
        {activeMenu === "create-ldap" && <LDAPForm adminId={adminId} />}
        {activeMenu === "users" && <div>Manage Users (Placeholder)</div>}
        {activeMenu === "settings" && <div>Settings (Placeholder)</div>}
      </main>
    </div>
  );
};

export default AdminDashboard;
