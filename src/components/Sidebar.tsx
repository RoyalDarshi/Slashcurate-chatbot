import React, { useState, useEffect } from "react";
import { MessageCircle, LogOut } from "lucide-react";
import { menuItems } from "../menuItems"; // ✅ Import modular menu items
import ConnectionManager from "./ConnectionManager";

interface SidebarProps {
  onMenuClick: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onMenuClick }) => {
  const [showConnectionManager, setShowConnectionManager] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState<string>("home");

  useEffect(() => {
    onMenuClick("home");
  }, [onMenuClick]);

  const handleMenuClick = (id: string) => {
    setActiveMenuItem(id);
    if (id === "connections") {
      setShowConnectionManager(true);
    } else {
      setShowConnectionManager(false);
      onMenuClick(id);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("userId");
    window.location.reload();
  };

  return (
    <div className="w-64 bg-gray-900 h-screen p-4 text-white flex flex-col justify-between">
      {/* ✅ Header (Logo + App Name) */}
      <div>
        <div className="flex items-center space-x-2 mb-6">
          <MessageCircle size={28} className="text-blue-400" />
          <h1 className="text-xl font-bold">Ask Your Data</h1>
        </div>

        {/* ✅ Menu Items */}
        <nav className="flex flex-col space-y-2">
          {menuItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              className={`flex items-center p-3 rounded-lg w-full ${
                activeMenuItem === id ? "bg-gray-800" : "hover:bg-gray-800"
              }`}
              onClick={() => handleMenuClick(id)}
            >
              <Icon size={20} />
              <span className="ml-3">{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ✅ Footer (Styled Text) */}
      <div className="mt-auto py-4 text-center text-gray-400 text-sm border-t border-gray-700">
        © /curate. All rights reserved.
      </div>

      {/* Logout Button */}
      <button
        className="flex items-center p-3 hover:bg-gray-800 rounded-lg w-full mt-4"
        onClick={handleLogout}
      >
        <LogOut size={20} />
        <span className="ml-3">Logout</span>
      </button>

      {/* Connection Manager */}
      {showConnectionManager && (
        <div className="absolute top-0 left-64 w-[calc(100%-16rem)] h-full bg-gray-900 p-4 overflow-auto">
          <ConnectionManager />
        </div>
      )}
    </div>
  );
};

export default Sidebar;
