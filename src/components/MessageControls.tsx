// MessageControls.tsx
import React,{useState,useRef} from "react";
import { motion } from "framer-motion";
import { Table, LineChart, Download } from "lucide-react";
import CustomTooltip from "./CustomTooltip";
import { Theme } from "../types";

interface MessageControlsProps {
  showTable: boolean;
  hasNumericData: boolean;
  onViewToggle: () => void;
  onDownload: (resolution?: "low" | "high") => void;
  theme: Theme;
}

const MessageControls: React.FC<MessageControlsProps> = ({
  showTable,
  hasNumericData,
  onViewToggle,
  onDownload,
  theme,
}) => {
  const [showResOptions, setShowResOptions] = useState(false);
  const resolutionRef = useRef<HTMLDivElement>(null);

  return (
    <div className="absolute -right-12 top-0 flex flex-col gap-2">
      {/* View Toggle Button */}
      <CustomTooltip
        title={
          hasNumericData
            ? showTable
              ? "Switch to Graph"
              : "Switch to Table"
            : "Graph not available for this data"
        }
        position="left"
      >
        <motion.button
          whileHover={{ scale: hasNumericData ? 1.1 : 1 }}
          whileTap={{ scale: hasNumericData ? 0.95 : 1 }}
          onClick={onViewToggle}
          className={`rounded-full p-2 shadow-sm transition-colors ${
            !hasNumericData
              ? "opacity-50 cursor-not-allowed"
              : "hover:opacity-85"
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

      {/* Download Controls */}
      {hasNumericData && !showTable && (
        <div className="relative" ref={resolutionRef}>
          <CustomTooltip title="Download Graph" position="left">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowResOptions(!showResOptions)}
              className="rounded-full p-2 shadow-sm hover:opacity-85"
              style={{ background: theme.colors.surface }}
            >
              <Download size={20} style={{ color: theme.colors.accent }} />
            </motion.button>
          </CustomTooltip>

          {showResOptions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full mt-2 right-0 shadow-lg rounded-md p-2 z-10"
              style={{ background: theme.colors.surface }}
            >
              <button
                onClick={() => onDownload("low")}
                className="block w-full text-left px-2 py-1 hover:opacity-85"
                style={{ color: theme.colors.text }}
              >
                Low Resolution
              </button>
              <button
                onClick={() => onDownload("high")}
                className="block w-full text-left px-2 py-1 hover:opacity-85"
                style={{ color: theme.colors.text }}
              >
                High Resolution
              </button>
            </motion.div>
          )}
        </div>
      )}

      {showTable && (
        <CustomTooltip title="Download Table" position="left">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDownload()}
            className="rounded-full p-2 shadow-sm hover:opacity-85"
            style={{ background: theme.colors.surface }}
          >
            <Download size={20} style={{ color: theme.colors.accent }} />
          </motion.button>
        </CustomTooltip>
      )}
    </div>
  );
};

export default React.memo(MessageControls);
