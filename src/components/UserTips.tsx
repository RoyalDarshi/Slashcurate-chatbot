import React, { useEffect, useState } from "react";
import { useTheme } from "../ThemeContext";
import { Tip, getRandomTip } from "../data/tips";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronRight,
} from "lucide-react";

interface UserTipsProps {
  show: boolean;
  onClose: () => void;
}

const UserTips: React.FC<UserTipsProps> = ({ show, onClose }) => {
  const { theme } = useTheme();
  const [tip, setTip] = useState<Tip>(getRandomTip());
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);

  const AUTO_CLOSE_TIME = 8000; // 8 seconds

  useEffect(() => {
    if (show) {
      setTip(getRandomTip());
      setProgress(100);
    }
  }, [show]);

  useEffect(() => {
    if (!show || isHovered) return;

    const intervalTime = 50; // smooth progress bar reduction
    const decrement = (intervalTime / AUTO_CLOSE_TIME) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - decrement;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [show, isHovered, onClose]);

  const handleNextTip = () => {
    setProgress(100);
    setTip(getRandomTip());
  };

  const IconComponent = () => {
    const iconStyle = "h-5 w-5";
    const iconColor = theme.colors.accent;

    switch (tip.icon) {
      case "clock": return <Clock className={iconStyle} style={{ color: iconColor }} />;
      case "bookmark": return <Bookmark className={iconStyle} style={{ color: iconColor }} />;
      case "git-branch": return <GitBranch className={iconStyle} style={{ color: iconColor }} />;
      case "layout-dashboard": return <LayoutDashboard className={iconStyle} style={{ color: iconColor }} />;
      case "home": return <Home className={iconStyle} style={{ color: iconColor }} />;
      case "clipboard-list": return <ClipboardList className={iconStyle} style={{ color: iconColor }} />;
      case "lightbulb": return <Lightbulb className={iconStyle} style={{ color: iconColor }} />;
      case "message-square": return <MessageSquare className={iconStyle} style={{ color: iconColor }} />;
      case "eye": return <Eye className={iconStyle} style={{ color: iconColor }} />;
      case "list-checks": return <ListChecks className={iconStyle} style={{ color: iconColor }} />;
      case "download": return <Download className={iconStyle} style={{ color: iconColor }} />;
      case "copy": return <Copy className={iconStyle} style={{ color: iconColor }} />;
      case "moon": return <Moon className={iconStyle} style={{ color: iconColor }} />;
      case "heart": return <Heart className={iconStyle} style={{ color: iconColor }} />;
      case "trash2": return <Trash2 className={iconStyle} style={{ color: iconColor }} />;
      case "settings": return <Settings className={iconStyle} style={{ color: iconColor }} />;
      case "help-circle": return <HelpCircle className={iconStyle} style={{ color: iconColor }} />;
      case "database": return <Database className={iconStyle} style={{ color: iconColor }} />;
      case "sun": return <Sun className={iconStyle} style={{ color: iconColor }} />;
      case "share2": return <Share2 className={iconStyle} style={{ color: iconColor }} />;
      case "table": return <Table className={iconStyle} style={{ color: iconColor }} />;
      default: return <Lightbulb className={iconStyle} style={{ color: iconColor }} />;
    }
  };

  const isDark = theme.mode === "dark";
  const glassBg = isDark ? "rgba(19, 28, 46, 0.75)" : "rgba(255, 255, 255, 0.85)";
  const glassBorder = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(99, 102, 241, 0.08)";
  const glassShadow = isDark
    ? "0 20px 40px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)"
    : "0 20px 40px -5px rgba(99, 102, 241, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, x: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="fixed top-8 right-8 max-w-sm md:max-w-md w-[calc(100vw-4rem)] rounded-xl border backdrop-blur-xl transition-shadow duration-300"
          style={{
            background: glassBg,
            borderColor: glassBorder,
            boxShadow: glassShadow,
            color: theme.colors.text,
            zIndex: 10000,
          }}
        >
          <div className="relative p-5 flex flex-col gap-4">
            {/* Header: Category and Close */}
            <div className="flex items-center justify-between">
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${theme.colors.accent}15`,
                  color: theme.colors.accent,
                }}
              >
                {tip.category}
              </span>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none"
                title="Close"
              >
                <X
                  className="h-4 w-4"
                  style={{ color: theme.colors.textSecondary }}
                />
              </button>
            </div>

            {/* Content: Icon & Text */}
            <div className="flex items-start space-x-4">
              <div
                className="flex-shrink-0 p-3 rounded-xl flex items-center justify-center relative overflow-hidden"
                style={{
                  background: isDark
                    ? "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)"
                    : "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)",
                  boxShadow: `0 0 15px -3px ${theme.colors.accent}30`,
                }}
              >
                <div 
                  className="absolute inset-0 opacity-10 bg-indigo-500 blur-sm rounded-xl animate-pulse"
                />
                <IconComponent />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className="font-bold text-base md:text-lg tracking-tight mb-1"
                  style={{ color: theme.colors.text }}
                >
                  {tip.title}
                </h3>
                <p 
                  className="text-xs md:text-sm leading-relaxed font-normal" 
                  style={{ color: theme.colors.textSecondary }}
                >
                  {tip.content}
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div 
              className="flex items-center justify-between mt-1 pt-3 border-t border-dashed"
              style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
            >
              <button
                onClick={handleNextTip}
                className="flex items-center text-xs font-semibold gap-1 hover:translate-x-0.5 transition-transform focus:outline-none"
                style={{ color: theme.colors.accent }}
              >
                Next Tip
                <ChevronRight className="h-3 w-3" />
              </button>
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95 focus:outline-none"
                style={{
                  backgroundColor: theme.colors.accent,
                  color: "#FFFFFF",
                }}
              >
                Got it
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div 
            className="absolute bottom-0 left-0 h-[3px] rounded-b-xl transition-all duration-100 ease-linear"
            style={{ 
              width: `${progress}%`, 
              backgroundColor: theme.colors.accent,
              boxShadow: `0 -1px 4px 0 ${theme.colors.accent}50` 
            }} 
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserTips;
