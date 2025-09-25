import React, { useState } from "react";
import { useTheme } from "../ThemeContext";
import { useSettings } from "../SettingsContext";

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const {
    chatFontSize,
    setChatFontSize,
    notificationsEnabled,
    setNotificationsEnabled,
    currentView, // Get currentView from settings context
    setCurrentView, // Get setCurrentView from settings context
  } = useSettings();
  const [autoSaveChats, setAutoSaveChats] = useState(true);

  const handleSetNotification = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setChatFontSize(e.target.value as "small" | "medium" | "large");
  };

  // Handler for view preference change
  const handleViewChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentView(e.target.value as "chat" | "dashboard");
  };

  const renderAppearanceSection = () => (
    <div className="space-y-4 mb-6">
      <h3
        className="text-lg font-semibold"
        style={{ color: theme.colors.text }}
      >
        Appearance
      </h3>
      <div className="flex items-center justify-between">
        <p style={{ color: theme.colors.textSecondary }}>Dark Mode</p>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only"
            onChange={toggleTheme}
            checked={theme.mode === "dark"} // Dark theme background color
            aria-label="Toggle dark mode"
          />
          <span
            className="w-10 h-5 rounded-full transition-colors duration-200 ease-in-out"
            style={{
              backgroundColor:
                theme.mode === "dark"
                  ? theme.colors.accent
                  : `${theme.colors.text}40`,
            }}
          ></span>
          <span
            className="absolute w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out top-0.5 left-0.5"
            style={{
              transform:
                theme.mode === "dark" ? "translateX(20px)" : "translateX(0)",
            }}
          ></span>
        </label>
      </div>
      <div className="flex items-center justify-between">
        <p style={{ color: theme.colors.textSecondary }}>Chat Font Size</p>
        <select
          value={chatFontSize}
          onChange={handleFontSizeChange}
          className="p-2 rounded-md focus:outline-none"
          style={{
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
            border: `1px solid ${theme.colors.text}20`,
            borderRadius: theme.borderRadius.default,
          }}
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>
    </div>
  );

  return (
    <div
      className="h-full px-4"
      style={{ backgroundColor: theme.colors.background }}
    >
      <div
        className="p-6 rounded-lg shadow-md w-full max-w-lg mx-auto mt-6"
        style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.text}20`,
          borderRadius: theme.borderRadius.default,
        }}
      >
        <h2
          className="text-2xl font-bold mb-6"
          style={{ color: theme.colors.text }}
        >
          Settings
        </h2>

        {/* Appearance Section */}
        {renderAppearanceSection()}

        {/* View Preference Section - New */}
        <div className="space-y-4 mb-6">
          <h3
            className="text-lg font-semibold"
            style={{ color: theme.colors.text }}
          >
            View Preference
          </h3>
          <div className="flex items-center justify-between">
            <p style={{ color: theme.colors.textSecondary }}>Default View</p>
            <select
              value={currentView}
              onChange={handleViewChange}
              className="p-2 rounded-md focus:outline-none"
              style={{
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.text}20`,
                borderRadius: theme.borderRadius.default,
              }}
            >
              <option value="chat">Chat View</option>
              <option value="dashboard">Dashboard View</option>
            </select>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="space-y-4 mb-6">
          <h3
            className="text-lg font-semibold"
            style={{ color: theme.colors.text }}
          >
            Notifications
          </h3>
          <div className="flex items-center justify-between">
            <p style={{ color: theme.colors.textSecondary }}>
              Enable Notifications
            </p>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                onChange={handleSetNotification}
                checked={notificationsEnabled}
                aria-label="Toggle notifications"
              />
              <span
                className="w-10 h-5 rounded-full transition-colors duration-200 ease-in-out"
                style={{
                  backgroundColor: notificationsEnabled
                    ? theme.colors.accent
                    : `${theme.colors.text}40`,
                }}
              ></span>
              <span
                className="absolute w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out top-0.5 left-0.5"
                style={{
                  transform: notificationsEnabled
                    ? "translateX(20px)"
                    : "translateX(0)",
                }}
              ></span>
            </label>
          </div>
        </div>

        {/* Account Section */}
        <div className="space-y-4">
          <h3
            className="text-lg font-semibold"
            style={{ color: theme.colors.text }}
          >
            Account
          </h3>
          <button
            className="w-full p-2 rounded-md hover:opacity-90 transition-all font-medium shadow-md"
            style={{
              backgroundColor: theme.colors.accent,
              color: "white",
              borderRadius: theme.borderRadius.default,
              boxShadow: `0 4px 6px ${theme.colors.text}20`,
            }}
            onClick={() => {
              /* Replaced alert with custom modal logic if needed later */
            }}
          >
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
