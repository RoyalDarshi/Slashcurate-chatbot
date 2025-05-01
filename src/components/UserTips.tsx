import React, { useEffect, useState } from "react";
import { useTheme } from "../ThemeContext";
import { Tip, getRandomTip } from "../data/tips";
import {
  Home,
  LayoutDashboard,
  Bookmark,
  Clock,
  ListChecks,
  Eye,
  GitBranch,
  Download,
  Copy,
  Moon,
  Heart,
  Trash2,
  Settings,
  HelpCircle,
  Database,
  Sun,
  Share2,
  Table,
  ClipboardList,
  Lightbulb,
  MessageSquare,
  X,
} from "lucide-react";

interface UserTipsProps {
  show: boolean;
  onClose: () => void;
}

const UserTips: React.FC<UserTipsProps> = ({ show, onClose }) => {
  const { theme } = useTheme();
  const [isExiting, setIsExiting] = useState(false);
  const [tip, setTip] = useState<Tip>(getRandomTip());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (show) {
      setTip(getRandomTip());
      setIsExiting(false);
    }
  }, [show]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (show) {
      setTip(getRandomTip());
      setIsExiting(false);
      setIsMounted(true);

      // Auto-close after 7 seconds
      timer = setTimeout(() => {
        handleClose();
      }, 7000);
    }

    return () => {
      clearTimeout(timer);
      setIsMounted(false);
    };
  }, [show]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  const IconComponent = () => {
    const iconStyle = "h-5 w-5";
    const iconColor = theme.colors.accent;

    switch (tip.icon) {
      case "clock":
        return <Clock className={iconStyle} style={{ color: iconColor }} />;
      case "bookmark":
        return <Bookmark className={iconStyle} style={{ color: iconColor }} />;
      case "git-branch":
        return <GitBranch className={iconStyle} style={{ color: iconColor }} />;
      case "layout-dashboard":
        return (
          <LayoutDashboard className={iconStyle} style={{ color: iconColor }} />
        );
      case "home":
        return <Home className={iconStyle} style={{ color: iconColor }} />;
      case "clipboard-list":
        return (
          <ClipboardList className={iconStyle} style={{ color: iconColor }} />
        );
      case "lightbulb":
        return <Lightbulb className={iconStyle} style={{ color: iconColor }} />;
      case "message-square":
        return (
          <MessageSquare className={iconStyle} style={{ color: iconColor }} />
        );
      case "eye":
        return <Eye className={iconStyle} style={{ color: iconColor }} />;
      case "list-checks":
        return (
          <ListChecks className={iconStyle} style={{ color: iconColor }} />
        );
      // New icons added below
      case "download":
        return <Download className={iconStyle} style={{ color: iconColor }} />;
      case "copy":
        return <Copy className={iconStyle} style={{ color: iconColor }} />;
      case "moon":
        return <Moon className={iconStyle} style={{ color: iconColor }} />;
      case "heart":
        return <Heart className={iconStyle} style={{ color: iconColor }} />;
      case "trash2":
        return <Trash2 className={iconStyle} style={{ color: iconColor }} />;
      case "settings":
        return <Settings className={iconStyle} style={{ color: iconColor }} />;
      case "help-circle":
        return (
          <HelpCircle className={iconStyle} style={{ color: iconColor }} />
        );
      case "database":
        return <Database className={iconStyle} style={{ color: iconColor }} />;
      case "sun":
        return <Sun className={iconStyle} style={{ color: iconColor }} />;
      case "share2":
        return <Share2 className={iconStyle} style={{ color: iconColor }} />;
      case "table":
        return <Table className={iconStyle} style={{ color: iconColor }} />;
      default:
        return <Lightbulb className={iconStyle} style={{ color: iconColor }} />;
    }
  };

  if (!show) return null;

  return (
    <div
      className={`
        fixed top-8 right-8 max-w-md w-full
        rounded-lg shadow-lg border
        transition-all duration-300 ease-in-out transform
        ${
          isExiting
            ? "translate-x-full opacity-0"
            : isMounted
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"
        }
      `}
      style={{
        backgroundColor: theme.colors.surface,
        color: theme.colors.text,
        borderColor: theme.colors.border,
        zIndex: 10000,
      }}
    >
      <div className="relative p-5">
        <div className="absolute top-3 right-3 flex space-x-2">
          <button
            onClick={handleClose}
            className="hover:text-red-500 focus:outline-none"
            title="Close"
          >
            <X
              className="h-5 w-5"
              style={{ color: theme.colors.textSecondary }}
            />
          </button>
        </div>

        <div className="flex items-start space-x-4">
          <div
            className="flex-shrink-0 p-2 rounded-full"
            style={{ backgroundColor: theme.colors.accent + "20" }}
          >
            <IconComponent />
          </div>
          <div>
            <h3
              className="font-semibold text-lg mb-1"
              style={{ color: theme.colors.text }}
            >
              Tip: {tip.title}
            </h3>
            <p style={{ color: theme.colors.textSecondary }}>{tip.content}</p>

            <div
              className="mt-3 pt-3"
              style={{ borderColor: theme.colors.border }}
            >
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: theme.colors.accent + "20",
                  color: theme.colors.accent,
                }}
              >
                {tip.category}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTips;
