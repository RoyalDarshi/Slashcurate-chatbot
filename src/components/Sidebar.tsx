import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Menu,
  ChevronDown,
  ChevronUp,
  PanelLeftOpen,
  PanelLeftClose,
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
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem("isDesktopSidebarOpen");
    return savedState !== null ? savedState === "true" : true;
  });
  const [activeMenuItem, setActiveMenuItem] = useState<string>("home");
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    localStorage.setItem(
      "isDesktopSidebarOpen",
      isDesktopSidebarOpen.toString()
    );
  }, [isDesktopSidebarOpen]);

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
        // setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex">
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {!isOpen && (
        <button
          title="Toggle Sidebar"
          className="md:hidden p-3 fixed top-4 left-4 rounded-full shadow-lg transition-opacity hover:opacity-90 z-30"
          style={{
            backgroundColor: theme.colors.accent,
            color: theme.colors.surface,
          }}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Sidebar"
          aria-expanded={isOpen}
        >
          <Menu size={24} />
        </button>
      )}

      <aside
        className={`h-screen p-4 flex flex-col ${
          isDesktopSidebarOpen ? "w-64" : "w-16"
        } md:static fixed top-0 left-0 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-all duration-300 ease-in-out z-20 shadow-lg`}
        style={{
          backgroundColor: theme.colors.surface,
          borderRight: `1px solid ${theme.colors.border}`,
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            {isDesktopSidebarOpen && (
              <>
                <MessageCircle
                  size={28}
                  style={{ color: theme.colors.accent }}
                />
                <h1
                  className="text-xl font-bold"
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamily,
                    fontWeight: theme.typography.weight.bold,
                  }}
                >
                  Ask Your Data
                </h1>
              </>
            )}
          </div>
          <div className="relative group hidden md:block">
            <button
              className="p-1 rounded-md transition-all duration-200 hover:bg-opacity-10"
              style={{
                backgroundColor: theme.colors.accent,
                color: "white",
              }}
              onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
              aria-label="Toggle Sidebar"
              aria-expanded={isDesktopSidebarOpen}
            >
              {isDesktopSidebarOpen ? (
                <PanelLeftClose size={24} />
              ) : (
                <PanelLeftOpen size={24} />
              )}
            </button>
            <div
              className="absolute left-12 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
              style={{ zIndex: 100 }}
            >
              {isDesktopSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            </div>
          </div>
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
                      ? `${theme.colors.accent}40`
                      : undefined,
                  color: theme.colors.text,
                  borderRadius: theme.borderRadius.default,
                  transition: theme.transition.default,
                  padding: isDesktopSidebarOpen
                    ? "0.75rem"
                    : "0.5rem 1.75rem 0.5rem 0.5rem",
                }}
                onClick={() => handleMenuClick(id)}
                aria-expanded={id === "connections" && isConnectionsOpen}
                aria-controls={
                  id === "connections" ? "connections-sub-menu" : undefined
                }
              >
                <div className="flex items-center relative group">
                  <Icon
                    size={20}
                    style={{
                      color: theme.colors.text,
                    }}
                  />
                  {/* Tooltip only when sidebar is collapsed */}
                  {!isDesktopSidebarOpen && (
                    <div
                      className="absolute left-10 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                      style={{ zIndex: 100 }}
                    >
                      {label}
                    </div>
                  )}
                  {isDesktopSidebarOpen && (
                    <span
                      className="ml-3"
                      style={{
                        fontSize: theme.typography.size.base,
                        fontWeight: theme.typography.weight.medium,
                      }}
                    >
                      {label}
                    </span>
                  )}
                </div>
                {isDesktopSidebarOpen &&
                  id === "connections" &&
                  (isConnectionsOpen ? (
                    <ChevronUp size={16} style={{ color: theme.colors.text }} />
                  ) : (
                    <ChevronDown
                      size={16}
                      style={{ color: theme.colors.text }}
                    />
                  ))}
              </button>

              {subMenu &&
                id === "connections" &&
                isConnectionsOpen &&
                isDesktopSidebarOpen && (
                  <div
                    className="pl-6 space-y-1"
                    id="connections-sub-menu"
                    style={{ transition: theme.transition.default }}
                  >
                    {subMenu.map((subItem) => (
                      <button
                        key={subItem.id}
                        className="flex items-center p-2 rounded-md w-full transition-colors duration-200 hover:bg-opacity-10"
                        style={{
                          backgroundColor:
                            activeMenuItem === subItem.id
                              ? theme.colors.hover
                              : undefined,
                          color: theme.colors.text,
                          borderRadius: theme.borderRadius.default,
                        }}
                        onClick={() => handleMenuClick(subItem.id)}
                      >
                        <subItem.icon
                          size={18}
                          style={{ color: theme.colors.text }}
                        />
                        <span
                          className="ml-3 text-sm"
                          style={{
                            fontSize: theme.typography.size.sm,
                            fontWeight: theme.typography.weight.normal,
                          }}
                        >
                          {subItem.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
            </React.Fragment>
          ))}
        </nav>

        <div
          className="mt-auto pt-4 flex items-center space-x-2"
          style={{ borderTop: `1px solid ${theme.colors.border}` }}
        >
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
          {isDesktopSidebarOpen && (
            <span
              className="text-sm font-semibold"
              style={{
                color: theme.colors.text,
                fontFamily: theme.typography.fontFamily,
                fontWeight: theme.typography.weight.bold,
              }}
            >
              SlashCurate
            </span>
          )}
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;
