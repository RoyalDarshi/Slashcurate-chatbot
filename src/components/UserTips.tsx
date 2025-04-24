import React, { useEffect,useRef } from "react";
import { useTheme } from "../ThemeContext";
import { toast } from "react-toastify";

interface UserTipsProps {
  show: boolean;
  onClose: () => void;
}

const tips = [
  "Welcome to Ask Your Data! Start by asking a question about your data in the chat interface.",
  "Toggle between Graph, Table, and Query views to explore your data in different formats.",
  "Need to save your results? Click the download button to export graphs as images or tables as XLSX files.",
  "Copy SQL queries with a single click to use them in other tools or share with your team.",
  "Switch to dark mode in the Settings tab for a sleek, eye-friendly experience.",
  "Love a question? Click the heart icon to mark it as a favorite and access it later.",
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
let globalToastId: string | number | null = null;
  const { theme } = useTheme();
  const isMounted = useRef(false);
  const localToastId = useRef<string | number | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (localToastId.current && toast.isActive(localToastId.current)) {
        toast.dismiss(localToastId.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!show || !isMounted.current) return;

    // Clear any existing toast globally
    if (globalToastId && toast.isActive(globalToastId)) {
      toast.dismiss(globalToastId);
    }

    const tipIndex = parseInt(localStorage.getItem("tipIndex") || "0", 10) || 0;
    console.log(tipIndex)
    const currentTip = tips[tipIndex];

    const newToastId = `user-tip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    globalToastId = newToastId;
    localToastId.current = newToastId;

    toast.info(
      <div>
        <p className="font-semibold">Tip of the Day</p>
        <p className="mt-1">{currentTip}</p>
      </div>,
      {
        toastId: newToastId,
        position: "top-center",
        autoClose: 7000,
        onClose: () => {
          if (isMounted.current) {
            setTimeout(() => onClose(), 100);
          }
        },
        style: {
          backgroundColor: theme.colors.accent || "#3b82f6",
          color: "#ffffff",
          maxWidth: "320px",
        },
        className: "md:max-w-sm",
      }
    );

    localStorage.setItem("tipIndex", ((tipIndex + 1) % tips.length).toString());

    return () => {
      if (localToastId.current === newToastId && toast.isActive(newToastId)) {
        toast.dismiss(newToastId);
      }
    };
  }, [show, theme, onClose]);

  return null;
};

export default UserTips;
