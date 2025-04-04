// GraphDownloadControls.tsx
import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import CustomTooltip from "./CustomTooltip";
import { Download } from "lucide-react";
import { Theme } from "../types";

interface GraphDownloadControlsProps {
  graphRef: React.RefObject<HTMLDivElement>;
  theme: Theme;
}

const GraphDownloadControls: React.FC<GraphDownloadControlsProps> = ({
  graphRef,
  theme,
}) => {
  const [showResolutionOptions, setShowResolutionOptions] = useState(false);
  const resolutionOptionsRef = useRef<HTMLDivElement>(null);

  const handleDownloadGraph = async (resolution: "low" | "high") => {
    if (graphRef.current) {
      try {
        const scale = resolution === "high" ? 2 : 1;
        const canvas = await html2canvas(graphRef.current, {
          scale,
          useCORS: true,
          logging: false,
        });
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = `graph_${resolution}.png`;
        link.click();
      } catch (error) {
        console.error("Error downloading graph:", error);
      }
    }
    setShowResolutionOptions(false);
  };

  return (
    <div className="relative">
      <CustomTooltip title="Download Graph" position="top">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowResolutionOptions(!showResolutionOptions)}
          className="rounded-full p-2 shadow-sm transition-colors duration-200 hover:opacity-85"
          style={{ background: theme.colors.surface }}
        >
          <Download size={20} style={{ color: theme.colors.accent }} />
        </motion.button>
      </CustomTooltip>

      {showResolutionOptions && (
        <motion.div
          ref={resolutionOptionsRef}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-2 right-0 shadow-lg rounded-md p-2 z-10"
          style={{ background: theme.colors.surface }}
        >
          <button
            onClick={() => handleDownloadGraph("low")}
            className="block w-full text-left px-2 py-1 hover:opacity-85"
            style={{ color: theme.colors.text }}
          >
            Low Resolution
          </button>
          <button
            onClick={() => handleDownloadGraph("high")}
            className="block w-full text-left px-2 py-1 hover:opacity-85"
            style={{ color: theme.colors.text }}
          >
            High Resolution
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default React.memo(GraphDownloadControls);
