import React, { useState, useEffect } from "react";
import { MessageCircle, LogOut, Menu } from "lucide-react";
import { menuItems } from "../menuItems";

interface SidebarProps {
  onMenuClick: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onMenuClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState<string>("home");

  useEffect(() => {
    onMenuClick("home");
  }, [onMenuClick]);

  const handleMenuClick = (id: string) => {
    setActiveMenuItem(id);
    onMenuClick(id);
    setIsOpen(false); // Close sidebar on mobile selection
  };

  const handleLogout = () => {
    sessionStorage.removeItem("userId");
    window.location.reload();
  };

  return (
    <div className="flex">
      {/* Overlay to close sidebar when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Mobile Toggle Button */}
      <button
        className="md:hidden p-3 text-white bg-gray-900 fixed top-4 left-4 rounded-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <div
        className={`h-screen bg-gray-900 text-white p-4 flex flex-col justify-between w-64 md:static fixed top-0 left-0 transform ${
          isOpen ? "translate-x-0" : "-translate-x-64"
        } md:translate-x-0 transition-transform duration-300 ease-in-out z-20`}
      >
        {/* Header */}
        <div>
          <div className="flex items-center space-x-2 mb-6">
            <MessageCircle size={28} className="text-blue-400" />
            <h1 className="text-xl font-bold">Ask Your Data</h1>
          </div>

          {/* Menu Items */}
          <nav className="flex flex-col space-y-2">
            {menuItems.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                className={`flex items-center p-3 rounded-lg w-full transition-colors duration-200 ${
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

        {/* Footer */}
        <div>
          <div className="mt-auto py-4 text-center text-gray-400 text-sm border-t border-gray-700">
            © /curate. All rights reserved.
          </div>
          <button
            className="flex items-center p-3 hover:bg-gray-800 rounded-lg w-full mt-4"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span className="ml-3">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
