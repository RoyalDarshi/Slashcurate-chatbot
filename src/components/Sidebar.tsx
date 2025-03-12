import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  LogOut,
  Menu,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { menuItems } from "../menuItems";

interface SidebarProps {
  onMenuClick: (id: string) => void;
  activeMenu: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ onMenuClick, activeMenu }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState<string>("home");
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);
  // const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onMenuClick("home");
  }, [onMenuClick]);

  useEffect(() => {
    if (activeMenu) {
      setActiveMenuItem(activeMenu);
    }
  }, [activeMenu]);

  const handleMenuClick = (id: string) => {
    if (id === "connections") {
      setIsConnectionsOpen(!isConnectionsOpen);
    } else if (id === "logout") {
      handleLogout();
      return;
    }
    onMenuClick(id);
    setActiveMenuItem(id);
    setIsOpen(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("userId");
    window.location.reload();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        // setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileDropdownRef]);

  return (
    <div className="flex">
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <button
        title="Toggle Sidebar"
        className="md:hidden p-3 text-white bg-gray-900 fixed top-4 left-4 rounded-full shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu size={24} />
      </button>

      <div
        className={`h-screen bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-200 p-4 flex flex-col w-64 md:static fixed top-0 left-0 transform ${
          isOpen ? "translate-x-0" : "-translate-x-64"
        } md:translate-x-0 transition-transform duration-300 ease-in-out z-20 shadow-lg`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center space-x-2 mb-6">
            <MessageCircle size={28} className="text-blue-400" />
            <h1 className="text-xl font-bold">Ask Your Data</h1>
          </div>

          <nav className="flex flex-col space-y-1 flex-grow">
            {menuItems.map(({ id, icon: Icon, label, subMenu, className }) => (
              <React.Fragment key={id}>
                <button
                  className={`flex items-center justify-between p-3 rounded-md w-full transition-colors duration-200 ${
                    activeMenuItem === id
                      ? "bg-gray-600 dark:bg-gray-600"
                      : "hover:bg-gray-700 dark:hover:bg-gray-700"
                  } ${className || ""}`}
                  onClick={() => handleMenuClick(id)}
                  aria-expanded={isConnectionsOpen && id === "connections"}
                  aria-controls={id === "connections" ? "sub-menu" : undefined}
                >
                  <div className="flex items-center">
                    <Icon size={20} />
                    <span className="ml-3">{label}</span>
                  </div>
                  {id === "connections" &&
                    (isConnectionsOpen ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    ))}
                </button>
                {subMenu && isConnectionsOpen && id === "connections" && (
                  <div className="pl-4 space-y-1">
                    {subMenu.map((subItem) => (
                      <button
                        key={subItem.id}
                        className="flex items-center p-3 rounded-md w-full hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors duration-200"
                        onClick={() => handleMenuClick(subItem.id)}
                      >
                        <subItem.icon size={20} />
                        <span className="ml-3">{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Add company logo at bottom */}
          <div className="mt-auto border-t border-gray-700">
            <div className="flex my-2 items-center justify-start ml-2 text-white">
              <span className="text-sm">Slash Curate Technologies PVT LTD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
