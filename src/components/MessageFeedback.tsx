// MessageFeedback.tsx
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  BsHandThumbsDown,
  BsHandThumbsDownFill,
  BsHandThumbsUp,
  BsHandThumbsUpFill,
} from "react-icons/bs";
import CustomTooltip from "./CustomTooltip";
import GraphDownloadControls from "./GraphDownloadControls";
import TableDownloadControls from "./TableDownloadControls";
import { useTheme } from "../ThemeContext";
import { LineChart, Table } from "lucide-react";

interface MessageFeedbackProps {
  graphRef: React.RefObject<HTMLDivElement>;
  csvData: any[];
  showTable: boolean;
  hasNumericData: boolean;
  selectedConnection: any;
}

const MessageFeedback: React.FC<MessageFeedbackProps> = ({
  graphRef,
  csvData,
  showTable,
  hasNumericData,
  selectedConnection,
}) => {
  const { theme } = useTheme();
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showDislikeOptions, setShowDislikeOptions] = useState(false);
  const [dislikeReason, setDislikeReason] = useState<string | null>(null);
  const dislikeRef = useRef<HTMLDivElement>(null);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setIsDisliked(false);
    setShowDislikeOptions(false);
    setDislikeReason(null);
  };

  const handleDislike = () => {
    setShowDislikeOptions(!showDislikeOptions);
    setIsLiked(false);
  };

  const handleDislikeOption = (reason: string) => {
    setDislikeReason(reason);
    setIsDisliked(true);
    setShowDislikeOptions(false);
  };

  return (
    <div className="flex justify-end items-center gap-2">
      <ViewToggleControls
        showTable={showTable}
        hasNumericData={hasNumericData}
        onToggle={() => hasNumericData && setShowTable((prev) => !prev)}
      />

      <div className="flex gap-2">
        <FeedbackButton
          isActive={isLiked}
          activeIcon={<BsHandThumbsUpFill />}
          inactiveIcon={<BsHandThumbsUp />}
          tooltip={isLiked ? "Remove like" : "Like this response"}
          onClick={handleLike}
        />

        <div className="relative" ref={dislikeRef}>
          <FeedbackButton
            isActive={isDisliked}
            activeIcon={<BsHandThumbsDownFill />}
            inactiveIcon={<BsHandThumbsDown />}
            tooltip={isDisliked ? "Remove dislike" : "Dislike this response"}
            onClick={handleDislike}
          />

          {showDislikeOptions && (
            <DislikeOptions onSelect={handleDislikeOption} theme={theme} />
          )}
        </div>
      </div>

      {!showTable && hasNumericData && (
        <GraphDownloadControls graphRef={graphRef} theme={theme} />
      )}

      {showTable && <TableDownloadControls csvData={csvData} theme={theme} />}
    </div>
  );
};

// Sub-components
const ViewToggleControls = ({ showTable, hasNumericData, onToggle }) => {
  const { theme } = useTheme();
  return (
    <CustomTooltip
      title={
        !hasNumericData
          ? "No graph available"
          : showTable
          ? "Switch to Graph"
          : "Switch to Table"
      }
      position="top"
    >
      <motion.button
        whileHover={{ scale: hasNumericData ? 1.1 : 1 }}
        whileTap={{ scale: hasNumericData ? 0.95 : 1 }}
        onClick={onToggle}
        className={`rounded-full p-2 shadow-sm transition-colors duration-200 ${
          !hasNumericData ? "opacity-50 cursor-not-allowed" : "hover:opacity-85"
        }`}
        style={{ background: theme.colors.surface }}
        disabled={!hasNumericData}
      >
        {showTable ? (
          <LineChart size={20} style={{ color: theme.colors.accent }} />
        ) : (
          <Table size={20} style={{ color: theme.colors.accent }} />
        )}
      </motion.button>
    </CustomTooltip>
  );
};

const FeedbackButton = ({
  isActive,
  activeIcon,
  inactiveIcon,
  tooltip,
  onClick,
}) => (
  <CustomTooltip title={tooltip} position="bottom">
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="rounded-md transition-colors duration-200"
    >
      {isActive ? activeIcon : inactiveIcon}
    </motion.button>
  </CustomTooltip>
);

const DislikeOptions = ({ onSelect, theme }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="absolute bottom-full right-0 mb-2 rounded-md shadow-lg z-10 min-w-[180px]"
    style={{
      background: theme.colors.surface,
      border: `1px solid ${theme.colors.border}`,
      boxShadow: `0 4px 12px ${theme.colors.text}20`,
    }}
  >
    {[
      "Incorrect data",
      "Takes too long",
      "Irrelevant response",
      "Confusing answer",
      "Other",
    ].map((reason) => (
      <button
        key={reason}
        onClick={() => onSelect(reason)}
        className="w-full text-left px-3 py-2 text-sm transition-all duration-200"
        style={{ color: theme.colors.text }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = `${theme.colors.accent}20`)
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "transparent")
        }
      >
        {reason}
      </button>
    ))}
  </motion.div>
);

export default React.memo(MessageFeedback);
