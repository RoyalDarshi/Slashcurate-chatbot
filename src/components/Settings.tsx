import React, { useState } from "react";
import { useTheme } from "../ThemeContext";
import { useSettings } from "../SettingsContext";
import ChangePasswordModal from "./ChangePasswordModal"; // Import the new component

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const {
    chatFontSize,
    setChatFontSize,
    notificationsEnabled,
    setNotificationsEnabled,
    currentView,
    setCurrentView,
  } = useSettings();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleSetNotification = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setChatFontSize(e.target.value as "small" | "medium" | "large");
  };

  const handleViewChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentView(e.target.value as "chat" | "dashboard");
  };

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div 
      className="mb-8 overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg"
      style={{
        backgroundColor: theme.mode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
        borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        boxShadow: theme.mode === 'dark' ? '0 4px 20px -2px rgba(0,0,0,0.4)' : '0 4px 20px -2px rgba(0,0,0,0.05)',
        backdropFilter: 'blur(12px)'
      }}
    >
      <div 
        className="px-6 py-4 border-b font-semibold text-lg flex items-center"
        style={{ 
            borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            color: theme.colors.text 
        }}
      >
        {title}
      </div>
      <div className="p-6 space-y-6">
        {children}
      </div>
    </div>
  );

  const SettingRow = ({ label, description, control }: { label: string, description?: string, control: React.ReactNode }) => (
    <div className="flex items-center justify-between group">
      <div>
        <p className="font-medium text-base transition-colors" style={{ color: theme.colors.text }}>{label}</p>
        {description && <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>{description}</p>}
      </div>
      <div className="ml-4 flex-shrink-0">
        {control}
      </div>
    </div>
  );

  return (
    <div 
      className="min-h-full py-10 px-4 sm:px-6 lg:px-8 w-full overflow-y-auto"
      style={{ backgroundColor: theme.colors.background }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: theme.colors.text }}>
            Settings
          </h2>
          <p className="text-base" style={{ color: theme.colors.textSecondary }}>
            Manage your preferences and configure your workspace experience.
          </p>
        </div>

        <Section title="Appearance">
          <SettingRow 
            label="Dark Mode" 
            description="Toggle between light and dark themes."
            control={
              <label className="relative inline-flex items-center cursor-pointer group-hover:scale-105 transition-transform">
                <input
                  type="checkbox"
                  className="sr-only"
                  onChange={toggleTheme}
                  checked={theme.mode === "dark"}
                  aria-label="Toggle dark mode"
                />
                <span
                  className="w-12 h-6 rounded-full transition-colors duration-300 ease-in-out"
                  style={{
                    backgroundColor: theme.mode === "dark" ? theme.colors.accent : (theme.mode === 'dark' ? '#334155' : '#e2e8f0'),
                  }}
                />
                <span
                  className="absolute w-5 h-5 bg-white rounded-full transition-transform duration-300 ease-in-out top-0.5 left-[3px] shadow-sm"
                  style={{ transform: theme.mode === "dark" ? "translateX(22px)" : "translateX(0)" }}
                />
              </label>
            }
          />

          <SettingRow 
            label="Chat Font Size" 
            description="Adjust the text size in the chat interface."
            control={
              <select
                value={chatFontSize}
                onChange={handleFontSizeChange}
                className="pl-3 pr-8 py-2 rounded-xl focus:outline-none appearance-none cursor-pointer border border-transparent hover:border-gray-300 transition-all shadow-sm"
                style={{
                  backgroundColor: theme.mode === 'dark' ? 'rgba(0,0,0,0.2)' : '#f8fafc',
                  color: theme.colors.text,
                  border: `1px solid ${theme.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                }}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            }
          />
        </Section>

        <Section title="Workspace">
          <SettingRow 
            label="Default View" 
            description="Choose which view opens first when you log in."
            control={
              <select
                value={currentView}
                onChange={handleViewChange}
                className="pl-3 pr-8 py-2 rounded-xl focus:outline-none appearance-none cursor-pointer border border-transparent hover:border-gray-300 transition-all shadow-sm"
                style={{
                  backgroundColor: theme.mode === 'dark' ? 'rgba(0,0,0,0.2)' : '#f8fafc',
                  color: theme.colors.text,
                  border: `1px solid ${theme.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                }}
              >
                <option value="chat">Chat View</option>
                <option value="dashboard">Dashboard View</option>
              </select>
            }
          />
        </Section>

        <Section title="Notifications & Tips">
          <SettingRow 
            label="Quick Tips" 
            description="Show helpful hints and tips across the application."
            control={
              <label className="relative inline-flex items-center cursor-pointer group-hover:scale-105 transition-transform">
                <input
                  type="checkbox"
                  className="sr-only"
                  onChange={handleSetNotification}
                  checked={notificationsEnabled}
                  aria-label="Toggle notifications"
                />
                <span
                  className="w-12 h-6 rounded-full transition-colors duration-300 ease-in-out"
                  style={{
                    backgroundColor: notificationsEnabled ? theme.colors.accent : (theme.mode === 'dark' ? '#334155' : '#e2e8f0'),
                  }}
                />
                <span
                  className="absolute w-5 h-5 bg-white rounded-full transition-transform duration-300 ease-in-out top-0.5 left-[3px] shadow-sm"
                  style={{ transform: notificationsEnabled ? "translateX(22px)" : "translateX(0)" }}
                />
              </label>
            }
          />
        </Section>

        <Section title="Account Security">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium text-base" style={{ color: theme.colors.text }}>Password Management</p>
              <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>Update your password to keep your account secure.</p>
            </div>
            <button
              className="px-6 py-2.5 rounded-xl font-medium transition-all duration-200 hover:-translate-y-0.5 shadow-md flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentHover || theme.colors.accent})`,
                color: "white",
                boxShadow: `0 8px 15px -5px ${theme.colors.accent}60`,
              }}
              onClick={() => setIsPasswordModalOpen(true)} 
            >
              Change Password
            </button>
          </div>
        </Section>
      </div>

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </div>
  );
};

export default Settings;