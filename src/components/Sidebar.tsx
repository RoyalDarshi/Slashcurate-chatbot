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
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; // Icon as React component
  subMenu?: MenuItem[];
}

interface SidebarProps {
  onMenuClick: (id: string) => void;
  activeMenu: string | null;
  onLogout?: () => void;
  menuItems?: MenuItem[]; // Optional custom menu items
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
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Default menu items for regular users
  const defaultItems = defaultMenuItems;

  const items = menuItems ?? defaultItems;

  useEffect(() => {
    localStorage.setItem(
      "isDesktopSidebarOpen",
      isDesktopSidebarOpen.toString(),
    );
  }, [isDesktopSidebarOpen]);

  useEffect(() => {
    if (!menuItems) onMenuClick("home"); // Only set default for regular users
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
    <div className="flex h-full">
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
            color: "white",
          }}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Sidebar"
          aria-expanded={isOpen}
        >
          <Menu size={24} />
        </button>
      )}

      <aside
        className={`h-full p-4 flex flex-col ${
          isDesktopSidebarOpen ? "md:w-64 w-64" : "md:w-20 w-16"
        } md:static fixed top-0 left-0 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-all duration-300 ease-in-out z-20 rounded-none md:rounded-2xl border-0 md:border shadow-none md:shadow-md`}
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2 overflow-hidden">
            {isDesktopSidebarOpen && (
              <>
                <MessageCircle
                  size={26}
                  style={{ color: theme.colors.accent }}
                  className="flex-shrink-0"
                />
                <h1
                  className="text-lg font-bold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis"
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamily,
                    fontWeight: theme.typography.weight.bold,
                  }}
                >
                  {menuItems ? "Admin Panel" : "Ask Your Data"}
                </h1>
              </>
            )}
            {!isDesktopSidebarOpen && (
              <MessageCircle
                size={26}
                style={{ color: theme.colors.accent }}
                className="mx-auto"
              />
            )}
          </div>
          <div className="relative group hidden md:block">
            <button
              className="p-1.5 rounded-lg transition-all duration-200 hover:bg-opacity-10 flex items-center justify-center"
              style={{ backgroundColor: theme.colors.accent, color: "white" }}
              onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
              aria-label="Toggle Sidebar"
              aria-expanded={isDesktopSidebarOpen}
            >
              {isDesktopSidebarOpen ? (
                <PanelLeftClose size={18} />
              ) : (
                <PanelLeftOpen size={18} />
              )}
            </button>
            <div
              className="absolute left-12 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap"
              style={{ zIndex: 100 }}
            >
              {isDesktopSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            </div>
          </div>
        </div>

        <nav className="flex flex-col space-y-1.5 flex-grow">
          {items?.map(({ id, icon: Icon, label, subMenu }) => (
            <React.Fragment key={id}>
              <button
                className={`relative flex items-center ${
                  isDesktopSidebarOpen ? "justify-between" : "justify-center"
                } rounded-xl w-full transition-all duration-300 group ${
                  activeMenuItem === id
                    ? "shadow-sm"
                    : "hover:bg-opacity-10"
                }`}
                style={{
                  backgroundColor:
                    activeMenuItem === id
                      ? `${theme.colors.accent}14` // 8% opacity for cleaner feel
                      : "transparent",
                  color: activeMenuItem === id ? theme.colors.accent : theme.colors.text,
                  transition: theme.transition.default,
                  padding: "0.6rem 0.8rem",
                }}
                onMouseOver={(e) => {
                  if (activeMenuItem !== id) {
                    e.currentTarget.style.backgroundColor = theme.colors.hover;
                  }
                }}
                onMouseOut={(e) => {
                  if (activeMenuItem !== id) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
                onClick={() => handleMenuClick(id)}
                aria-expanded={id === "connections" && isConnectionsOpen}
                aria-controls={
                  id === "connections" ? "connections-sub-menu" : undefined
                }
              >
                <div className="flex items-center relative w-full justify-start">
                  {/* Left Accent indicator pill */}
                  {activeMenuItem === id && (
                    <div
                      className="absolute left-0 w-1 h-5 rounded-r-full"
                      style={{
                        backgroundColor: theme.colors.accent,
                        marginLeft: "-0.8rem",
                      }}
                    />
                  )}

                  <Icon
                    size={18}
                    style={{
                      color:
                        activeMenuItem === id
                          ? theme.colors.accent
                          : theme.colors.textSecondary,
                    }}
                    className={`transition-colors duration-200 group-hover:text-current ${
                      !isDesktopSidebarOpen ? "mx-auto" : ""
                    }`}
                  />
                  {!isDesktopSidebarOpen && (
                    <div
                      className="absolute left-12 top-1/2 transform -translate-y-1/2 text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-lg border border-slate-200/80 dark:border-slate-800/80"
                      style={{
                        zIndex: 100,
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                      }}
                    >
                      {label}
                    </div>
                  )}
                  {isDesktopSidebarOpen && (
                    <span
                      className="ml-3 truncate"
                      style={{
                        fontSize: theme.typography.size.sm,
                        fontWeight:
                          activeMenuItem === id
                            ? theme.typography.weight.semibold
                            : theme.typography.weight.medium,
                      }}
                    >
                      {label}
                    </span>
                  )}
                </div>
                {isDesktopSidebarOpen &&
                  id === "connections" &&
                  (isConnectionsOpen ? (
                    <ChevronUp size={14} style={{ color: theme.colors.textSecondary }} />
                  ) : (
                    <ChevronDown
                      size={14}
                      style={{ color: theme.colors.textSecondary }}
                    />
                  ))}
              </button>

              {subMenu &&
                id === "connections" &&
                isConnectionsOpen &&
                isDesktopSidebarOpen && (
                  <div
                    className="pl-4 space-y-1 border-l ml-3 mb-1 mt-0.5 border-slate-100 dark:border-slate-800"
                    id="connections-sub-menu"
                    style={{ transition: theme.transition.default }}
                  >
                    {subMenu.map((subItem) => (
                      <button
                        key={subItem.id}
                        className="relative flex items-center p-2 rounded-lg w-full transition-colors duration-200 hover:bg-opacity-10"
                        style={{
                          backgroundColor:
                            activeMenuItem === subItem.id
                              ? theme.colors.hover
                              : "transparent",
                          color:
                            activeMenuItem === subItem.id
                              ? theme.colors.accent
                              : theme.colors.textSecondary,
                          borderRadius: theme.borderRadius.default,
                        }}
                        onClick={() => handleMenuClick(subItem.id)}
                      >
                        {activeMenuItem === subItem.id && (
                          <div
                            className="absolute left-0 w-1 h-4 rounded-r-full"
                            style={{
                              backgroundColor: theme.colors.accent,
                              marginLeft: "-1rem",
                            }}
                          />
                        )}
                        <subItem.icon
                          size={15}
                          style={{
                            color:
                              activeMenuItem === subItem.id
                                ? theme.colors.accent
                                : theme.colors.textSecondary,
                          }}
                        />
                        <span
                          className="ml-2.5 text-xs truncate"
                          style={{
                            fontSize: theme.typography.size.xs,
                            fontWeight:
                              activeMenuItem === subItem.id
                                ? theme.typography.weight.semibold
                                : theme.typography.weight.normal,
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
          className={`mt-auto pt-4 flex items-center ${
            isDesktopSidebarOpen ? "space-x-2.5 justify-start" : "justify-center space-x-0"
          }`}
          style={{ borderTop: `1px solid ${theme.colors.border}` }}
        >
          <svg
            className="h-6 w-6 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.accent}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          {isDesktopSidebarOpen && (
            <span
              className="text-xs font-bold tracking-wider uppercase opacity-80"
              style={{
                color: theme.colors.text,
                fontFamily: theme.typography.fontFamily,
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
