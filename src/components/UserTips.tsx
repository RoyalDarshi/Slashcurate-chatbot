import React, { useEffect, useRef } from "react";
import { useTheme } from "../ThemeContext";
import { toast } from "react-toastify";

interface UserTipsProps {
  show: boolean;
  onClose: () => void;
}

const tips = [
  "Check out your favorite questions in the Favourites tab to quickly re-ask them.",
  "Asked a favorite question more than 5 times? It might appear as a recommended question on new chats!",
  "View all your past sessions in the History tab to revisit your data conversations.",
  "Click a session in the History tab to see all chats and make it active for new questions.",
  "In the Favourites tab, delete a favorite to remove it from all related messages.",
  "Re-ask a favorite question by clicking it in the Favourites tab—it’ll start a new session or use the current one.",
  "Customize your experience by adjusting settings like theme or notifications in the Settings tab.",
  "Need help understanding your data? Ask detailed questions, and we’ll generate graphs or tables to clarify.",
  "Use the sidebar to quickly navigate between Home, History, Favourites, and Settings.",
  "Want to create a new data connection? Head to the Create Connection menu to link your data source.",
  "Review your existing data connections in the Existing Connections menu to manage them.",
  "Keep your chats organized—start a new session anytime by clicking “New Chat.”",
  "Recommended questions appear when you start a new chat, based on your most-used favorites.",
  "Light mode more your style? Switch themes in Settings to find the perfect look.",
  "Save time by copying SQL queries directly from the Query view with one click.",
  "Download a graph to share your insights in presentations or reports.",
  "Explore your data visually—toggle to the Graph view for instant charts.",
  "Need to dive deeper? Toggle to the Table view for a detailed look at your data.",
  "Your active session is highlighted in the History tab—click to continue where you left off.",
];

const UserTips: React.FC<UserTipsProps> = ({ show, onClose }) => {
  const { theme } = useTheme();
  const toastId = useRef<string | number | null>(null);

  useEffect(() => {
    // Check if notifications are enabled
    const notificationsEnabled = JSON.parse(
      localStorage.getItem("notificationsEnabled") || "true"
    );
    if (show && notificationsEnabled) {
      const tipIndex =
        parseInt(localStorage.getItem("tipIndex") || "0", 10) % tips.length;
      const currentTip = tips[tipIndex];

      toastId.current = toast.info(
        <div>
          <p className="font-semibold">Tip of the Day</p>
          <p className="mt-1">{currentTip}</p>
        </div>,
        {
          toastId: `user-tip-${tipIndex}`, // Unique toastId per tip
          position: "top-center",
          autoClose: 7000,
          theme: theme.colors.accent === "#7C3AED" ? "dark" : "light",
          onClose: () => setTimeout(onClose, 100),
          style: {
            maxWidth: "320px",
            zIndex: 99999, // Ensure high z-index
          },
          className: "md:max-w-sm",
        }
      );

      // Update tipIndex after displaying the tip
      localStorage.setItem(
        "tipIndex",
        ((tipIndex + 1) % tips.length).toString()
      );
    }
  }, [show, theme.colors.accent]);

  return null;
};

export default UserTips;
