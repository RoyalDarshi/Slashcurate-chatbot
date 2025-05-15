import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  PropsWithChildren,
} from "react";
import axios from "axios";
import { API_URL } from "./config";

// Define the shape of your settings
interface Settings {
  chatFontSize: "small" | "medium" | "large";
  notificationsEnabled: boolean;
}

// Define the context type, including setters
interface SettingsContextType extends Settings {
  setChatFontSize: (size: Settings["chatFontSize"]) => void;
  setNotificationsEnabled: (on: boolean) => void;
}

// Create the context with an initial undefined value
const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

// PropsWithChildren gives us the `children` prop
type SettingsProviderProps = PropsWithChildren<{}>;

// SettingsProvider component
export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
}) => {
  const [settings, setSettings] = useState<Settings>({
    chatFontSize: "medium",
    notificationsEnabled: true,
  });

  // Fetch user settings from the server on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res = await axios.post(
          `${API_URL}/api/user/settings`,
          {token},
        );
        setSettings({
          chatFontSize: res.data.chatFontSize,
          notificationsEnabled: res.data.notificationsEnabled,
        });
      } catch (error) {
        console.error("Failed to load settings", error);
      }
    };
    loadSettings();
  }, []);

  // Helper to persist changes to the server
  const persistSettings = async (newSettings: Partial<Settings>) => {
    try {
      const token = sessionStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/user/createsettings`,
        { settings: newSettings, token },
      );
    } catch (error) {
      console.error("Failed to save settings", error);
    }
  };

  // Setter for chatFontSize
  const setChatFontSize = (chatFontSize: Settings["chatFontSize"]) => {
    setSettings((prev) => ({ ...prev, chatFontSize }));
    persistSettings({ chatFontSize });
  };

  // Setter for notificationsEnabled
  const setNotificationsEnabled = (notificationsEnabled: boolean) => {
    setSettings((prev) => ({ ...prev, notificationsEnabled }));
    persistSettings({ notificationsEnabled });
  };

  return (
    <SettingsContext.Provider
      value={{ ...settings, setChatFontSize, setNotificationsEnabled }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook for consuming the settings
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
