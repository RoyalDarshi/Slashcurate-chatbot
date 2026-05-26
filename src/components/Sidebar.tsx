import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Menu,
  ChevronDown,
  ChevronUp,
  PanelLeftOpen,
  PanelLeftClose,
} from "lucide-react";
import { useTheme } from "../ThemeContext";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  subMenu?: MenuItem[];
}

interface SidebarProps {
  onMenuClick: (id: string) => void;
  activeMenu: string | null;
  onLogout?: () => void;
  menuItems?: MenuItem[];
  defaultMenuItems?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({
  onMenuClick,
  activeMenu,
  onLogout,
  menuItems,
  defaultMenuItems,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem("isDesktopSidebarOpen");
    return savedState !== null ? savedState === "true" : false;
  });
  const [activeMenuItem, setActiveMenuItem] = useState<string>("home");
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);
  const { theme } = useTheme();

  const items = menuItems ?? defaultMenuItems;

  useEffect(() => {
    localStorage.setItem(
      "isDesktopSidebarOpen",
      isDesktopSidebarOpen.toString(),
    );
  }, [isDesktopSidebarOpen]);

  useEffect(() => {
    if (!menuItems) onMenuClick("home");
  }, [onMenuClick, menuItems]);

  useEffect(() => {
    if (activeMenu) setActiveMenuItem(activeMenu);
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
    sessionStorage.removeItem("token");
    if (onLogout) onLogout();
    else window.location.reload();
  };

  return (
    <div className="flex h-full flex-shrink-0">
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {!isOpen && (
        <button
          title="Toggle Sidebar"
          className="md:hidden p-3 fixed top-4 left-4 rounded-full shadow-md transition-all active:scale-95 z-50 flex items-center justify-center text-white"
          style={{ backgroundColor: theme.colors.accent }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Menu size={20} />
        </button>
      )}

      <aside
        className={`h-full p-4 flex flex-col ${
          isDesktopSidebarOpen ? "md:w-64 w-64" : "md:w-20 w-16"
        } md:static fixed top-0 left-0 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-all duration-300 ease-in-out z-40 bg-transparent overflow-x-hidden`}
      >
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <MessageCircle
              size={22}
              style={{ color: theme.colors.accent }}
              className="flex-shrink-0"
            />
            {isDesktopSidebarOpen && (
              <h1
                className="text-base font-semibold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis"
                style={{
                  color: theme.colors.text,
                  fontFamily: theme.typography.fontFamily,
                }}
              >
                {menuItems ? "Admin Panel" : "Ask Your Data"}
              </h1>
            )}
          </div>
          <div className="relative group hidden md:block">
            <button
              className="p-1.5 rounded-lg transition-colors flex items-center justify-center text-white hover:opacity-90"
              style={{ backgroundColor: theme.colors.accent }}
              onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
              title={isDesktopSidebarOpen ? "Collapse Frame" : "Expand Frame"}
            >
              {isDesktopSidebarOpen ? (
                <PanelLeftClose size={16} />
              ) : (
                <PanelLeftOpen size={16} />
              )}
            </button>
          </div>
        </div>

        <nav className="flex flex-col space-y-1 flex-grow overflow-y-auto overflow-x-hidden custom-scrollbar">
          {items?.map(({ id, icon: Icon, label, subMenu }) => {
            const isMenuSelected = activeMenuItem === id;
            const itemBg = isMenuSelected
              ? theme.mode === "light"
                ? "rgba(79, 70, 229, 0.06)"
                : "rgba(255, 255, 255, 0.07)"
              : "transparent";
            const itemColor = isMenuSelected
              ? theme.colors.accent
              : theme.colors.text;

            return (
              <React.Fragment key={id}>
                <button
                  className={`relative flex items-center ${isDesktopSidebarOpen ? "justify-between" : "justify-center"} rounded-xl w-full transition-all group`}
                  style={{
                    backgroundColor: itemBg,
                    color: itemColor,
                    padding: "0.5rem 0.625rem",
                  }}
                  onMouseOver={(e) => {
                    if (!isMenuSelected) {
                      e.currentTarget.style.backgroundColor = theme.colors.hover;
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isMenuSelected) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                  onClick={() => handleMenuClick(id)}
                >
                  <div className="flex items-center relative w-full justify-start">
                    <div
                      className={`absolute left-0 w-1 rounded-r-full transition-all duration-200 ${
                        isMenuSelected
                          ? "h-5 opacity-100 scale-y-100"
                          : "h-0 opacity-0 scale-y-50"
                      }`}
                      style={{
                        backgroundColor: theme.colors.accent,
                        marginLeft: "-0.625rem",
                      }}
                    />

                    <Icon
                      size={18}
                      style={{
                        color: isMenuSelected
                          ? theme.colors.accent
                          : theme.colors.textSecondary,
                      }}
                      className="flex-shrink-0 group-hover:text-current animate-none"
                    />

                    {!isDesktopSidebarOpen && (
                      <div
                        className="absolute left-12 top-1/2 transform -translate-y-1/2 text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-lg border"
                        style={{
                          zIndex: 100,
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      >
                        {label}
                      </div>
                    )}

                    {isDesktopSidebarOpen && (
                      <span
                        className="ml-3 truncate text-sm font-semibold tracking-tight"
                        style={{
                          color: isMenuSelected
                            ? theme.colors.text
                            : theme.colors.textSecondary,
                        }}
                      >
                        {label}
                      </span>
                    )}
                  </div>

                  {isDesktopSidebarOpen && id === "connections" && (
                    <div
                      style={{ color: theme.colors.textSecondary }}
                      className="ml-auto"
                    >
                      {isConnectionsOpen ? (
                        <ChevronUp size={13} />
                      ) : (
                        <ChevronDown size={13} />
                      )}
                    </div>
                  )}
                </button>

                {subMenu &&
                  id === "connections" &&
                  isConnectionsOpen &&
                  isDesktopSidebarOpen && (
                    <div className="pl-4 space-y-0.5 border-l ml-3 mb-1 mt-0.5 border-slate-200/50 dark:border-slate-800/50">
                      {subMenu.map((subItem) => {
                        const isSubSelected = activeMenuItem === subItem.id;
                        const subBg = isSubSelected
                          ? theme.mode === "light"
                            ? "rgba(79, 70, 229, 0.05)"
                            : "rgba(255, 255, 255, 0.05)"
                          : "transparent";

                        return (
                          <button
                            key={subItem.id}
                            className="relative flex items-center rounded-lg w-full transition-colors"
                            style={{
                              backgroundColor: subBg,
                              padding: "0.375rem 0.5rem",
                            }}
                            onMouseOver={(e) => {
                              if (!isSubSelected)
                                e.currentTarget.style.backgroundColor =
                                  theme.colors.hover;
                            }}
                            onMouseOut={(e) => {
                              if (!isSubSelected)
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                            }}
                            onClick={() => handleMenuClick(subItem.id)}
                          >
                            <subItem.icon
                              size={14}
                              style={{
                                color: isSubSelected
                                  ? theme.colors.accent
                                  : theme.colors.textSecondary,
                              }}
                            />
                            <span
                              className="ml-2.5 text-xs font-semibold truncate"
                              style={{
                                color: isSubSelected
                                  ? theme.colors.text
                                  : theme.colors.textSecondary,
                              }}
                            >
                              {subItem.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
              </React.Fragment>
            );
          })}
        </nav>

        <div
          className={`mt-auto pt-4 flex items-center ${isDesktopSidebarOpen ? "space-x-2.5 justify-start" : "justify-center"}`}
          style={{ borderTop: "none" }}
        >
          <svg
            className="h-5 w-5 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.accent}
            strokeWidth="2.5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          {isDesktopSidebarOpen && (
            <span
              className="text-xs font-semibold tracking-wider uppercase opacity-70"
              style={{ color: theme.colors.text }}
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
