import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  LogOut,
  Menu,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { menuItems } from "../menuItems";
import { useTheme } from "../ThemeContext";

interface SidebarProps {
  onMenuClick: (id: string) => void;
  activeMenu: string | null;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onMenuClick,
  activeMenu,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState<string>("home");
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

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
    } else {
      onMenuClick(id);
      setActiveMenuItem(id);
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("userId");
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        // setIsProfileOpen(false); // Placeholder for future profile dropdown
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
        className="md:hidden p-3 fixed top-4 left-4 rounded-full shadow-lg hover:opacity-90 transition-opacity"
        style={{
          background: theme.colors.accent,
          color: theme.colors.text,
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu size={24} />
      </button>

      <div
        className={`h-screen p-4 flex flex-col w-64 md:static fixed top-0 left-0 transform ${
          isOpen ? "translate-x-0" : "-translate-x-64"
        } md:translate-x-0 transition-transform duration-300 ease-in-out z-20 shadow-lg`}
        style={{
          background:
            theme.colors.background === "#f9f9f9" ? "#ffffff" : "#1e1e1e",
          borderRight: `1px solid ${theme.colors.text}20`,
        }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center space-x-2 mb-6">
            <MessageCircle size={28} style={{ color: theme.colors.accent }} />
            <h1
              className="text-xl font-bold"
              style={{ color: theme.colors.text }}
            >
              Ask Your Data
            </h1>
          </div>

          <nav className="flex flex-col space-y-1 flex-grow">
            {menuItems.map(({ id, icon: Icon, label, subMenu }) => (
              <React.Fragment key={id}>
                <button
                  className={`flex items-center justify-between p-3 rounded-md w-full transition-colors duration-200 ${
                    activeMenuItem === id
                      ? "bg-opacity-20"
                      : "hover:bg-opacity-10"
                  }`}
                  style={{
                    backgroundColor:
                      activeMenuItem === id
                        ? `${theme.colors.accent}33` // 20% opacity for active
                        : undefined,
                    color: theme.colors.text,
                  }}
                  onClick={() => handleMenuClick(id)}
                  aria-expanded={isConnectionsOpen && id === "connections"}
                  aria-controls={
                    id === "connections" ? "connections-sub-menu" : undefined
                  }
                >
                  <div className="flex items-center">
                    <Icon size={20} style={{ color: theme.colors.text }} />
                    <span className="ml-3">{label}</span>
                  </div>
                  {id === "connections" &&
                    (isConnectionsOpen ? (
                      <ChevronUp
                        size={16}
                        style={{ color: theme.colors.text }}
                      />
                    ) : (
                      <ChevronDown
                        size={16}
                        style={{ color: theme.colors.text }}
                      />
                    ))}
                </button>
                {subMenu && isConnectionsOpen && id === "connections" && (
                  <div className="pl-6 space-y-1" id="connections-sub-menu">
                    {subMenu.map((subItem) => (
                      <button
                        key={subItem.id}
                        className="flex items-center p-2 rounded-md w-full hover:bg-opacity-10 transition-colors duration-200"
                        style={{
                          backgroundColor:
                            activeMenuItem === subItem.id
                              ? `${theme.colors.accent}33`
                              : undefined,
                          color: theme.colors.text,
                        }}
                        onClick={() => handleMenuClick(subItem.id)}
                      >
                        <subItem.icon
                          size={18}
                          style={{ color: theme.colors.text }}
                        />
                        <span className="ml-3 text-sm">{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Company Logo at Bottom */}
          <div
            className="mt-auto pt-4 flex items-center space-x-2"
            style={{ borderTop: `1px solid ${theme.colors.text}20` }}
          >
            {/* Replace with your actual logo image */}
            {/* <img src="/assets/logo.png" alt="Slash Curate Logo" className="h-8 w-auto" /> */}
            <svg
              className="h-8 w-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.colors.accent}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span
              className="text-sm font-semibold"
              style={{ color: theme.colors.text }}
            >
              Slash Curate
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
