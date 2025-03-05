// Sidebar.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  LogOut,
  Menu,
  User,
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
      setActiveMenuItem(id);
    } else {
      setActiveMenuItem(id);
      onMenuClick(id);
      setIsOpen(false);
      setIsConnectionsOpen(false);
      setIsProfileOpen(false);
    }
  };

  const handleSubMenuClick = (id: string) => {
    setActiveMenuItem(id);
    onMenuClick(id);
    setIsOpen(false);
    setIsConnectionsOpen(false);
    setIsProfileOpen(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("userId");
    window.location.reload();
  };

  const handleProfileClick = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
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
        className={`h-screen bg-gray-900 text-white p-4 flex flex-col justify-between w-64 md:static fixed top-0 left-0 transform ${
          isOpen ? "translate-x-0" : "-translate-x-64"
        } md:translate-x-0 transition-transform duration-300 ease-in-out z-20 shadow-lg`}
      >
        <div>
          <div className="flex items-center space-x-2 mb-6">
            <MessageCircle size={28} className="text-blue-400" />
            <h1 className="text-xl font-bold">Ask Your Data</h1>
          </div>

          <nav className="flex flex-col space-y-1">
            {menuItems.map(({ id, icon: Icon, label, subMenu }) => (
              <React.Fragment key={id}>
                <button
                  className={`flex items-center justify-between p-3 rounded-md w-full transition-colors duration-200 ${
                    activeMenuItem === id ? "bg-gray-800" : "hover:bg-gray-800"
                  }`}
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
                {isConnectionsOpen && id === "connections" && subMenu && (
                  <div id="sub-menu" className="ml-4 space-y-1">
                    {subMenu.map(
                      ({ id: subId, label: subLabel, icon: SubIcon }) => (
                        <button
                          key={subId}
                          className={`flex items-center p-3 rounded-md w-full transition-colors duration-200 ${
                            activeMenuItem === subId
                              ? "bg-gray-800"
                              : "hover:bg-gray-800"
                          }`}
                          onClick={() => handleSubMenuClick(subId)}
                        >
                          <SubIcon size={20} />
                          <span className="ml-3">{subLabel}</span>
                        </button>
                      )
                    )}
                  </div>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>

        <div>
          <div className="mt-auto py-4 text-center text-gray-400 text-sm border-t border-gray-700">
            © /curate. All rights reserved.
          </div>
          <button
            className="flex items-center p-3 hover:bg-gray-800 rounded-md w-full mt-2 transition-colors duration-200"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span className="ml-3">Logout</span>
          </button>
        </div>
      </div>
      {/* User icon at the top right (outside sidebar) */}
      <div className="absolute top-4 right-4 z-30" ref={profileDropdownRef}>
        <button
          className="p-2 rounded-full hover:bg-gray-800 bg-gray-900 transition-colors duration-200"
          onClick={handleProfileClick}
          aria-haspopup="true"
          aria-expanded={isProfileOpen}
        >
          <User size={24} className="text-white" />
        </button>
        {isProfileOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg">
            <button
              className="block w-full text-left p-2 hover:bg-gray-700 text-white transition-colors duration-200"
              onClick={() => {
                setIsProfileOpen(false);
              }}
            >
              Settings
            </button>
            <button
              className="block w-full text-left p-2 hover:bg-gray-700 text-white transition-colors duration-200"
              onClick={() => {
                setIsProfileOpen(false);
              }}
            >
              Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
