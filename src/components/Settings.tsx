import React from "react";

interface SettingsProps {
  toggleTheme: () => void;
  theme: string;
}

const Settings: React.FC<SettingsProps> = ({ toggleTheme, theme }) => {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
        Settings
      </h2>
      <div className="flex items-center justify-between">
        <p className="text-gray-600 dark:text-gray-400">Dark Mode</p>
        <label className="switch">
          <input
            type="checkbox"
            onChange={toggleTheme}
            checked={theme === "dark"}
          />
          <span className="slider round"></span>
        </label>
      </div>
    </div>
  );
};

export default Settings;
