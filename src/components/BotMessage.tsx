// BotMessage.tsx
import React, { useState, useRef } from "react";
import { Bot } from "lucide-react";
import { useTheme } from "../ThemeContext";
import BotResponseRenderer from "./BotResponseRenderer";
import MessageControls from "./MessageControls";
import { ChatMessageProps } from "../types";

const BotMessage: React.FC<ChatMessageProps> = ({ message, loading }) => {
  const { theme } = useTheme();
  const graphRef = useRef<HTMLDivElement>(null);
  const [hasNumericData, setHasNumericData] = useState(false);
  const [showTable, setShowTable] = useState(false);

  const handleDataCompatibility = (isValid: boolean) => {
    setHasNumericData(isValid);
    if (!isValid) setShowTable(true);
  };

  return (
    <div className="flex w-full items-start" style={{ gap: theme.spacing.md }}>
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full shadow-md"
        style={{ background: theme.colors.accent }}
      >
        <Bot size={20} style={{ color: "white" }} />
      </div>

      <div className="max-w-[80%] flex flex-col gap-2 relative">
        <BotResponseRenderer
          message={message}
          loading={loading}
          graphRef={graphRef}
          showTable={showTable}
          onShowTableChange={setShowTable}
          onDataCompatibility={handleDataCompatibility}
          hasNumericData={hasNumericData}
        />

        {!loading && (
          <MessageControls
            showTable={showTable}
            hasNumericData={hasNumericData}
            onViewToggle={() => setShowTable(!showTable)}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
};

export default React.memo(BotMessage);
