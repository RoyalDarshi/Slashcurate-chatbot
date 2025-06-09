import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  Send,
  Database,
  ChevronDown,
  PlusCircle,
  Layers,
  Table2,
} from "lucide-react";
import { ChatInputProps, Connection, DatabaseSchema } from "../types";
import { useTheme } from "../ThemeContext";
import MiniLoader from "./MiniLoader";
import { FaFilePdf } from "react-icons/fa";
import CustomTooltip from "./CustomTooltip";
import SchemaExplorer from "./SchemaExplorer";
import schemaSampleData from "../data/sampleSchemaData";

interface Table {
  name: string;
  columns: string[];
  sampleData?: { [key: string]: any }[];
}

// Extend ChatInputProps to include new props for controlling SchemaExplorer visibility
interface ExtendedChatInputProps extends ChatInputProps {
  isDbExplorerOpen: boolean;
  setIsDbExplorerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatInput: React.FC<ExtendedChatInputProps> = React.memo(
  ({
    input,
    isSubmitting,
    onInputChange,
    onSubmit,
    connections = [], // Still passed, but not directly used for dropdown in this component
    selectedConnection, // Still passed, but not directly used for dropdown in this component
    onSelect, // Still passed, but not directly used for dropdown in this component
    disabled,
    isDbExplorerOpen, // New prop
    setIsDbExplorerOpen, // New prop
  }) => {
    const { theme } = useTheme();
    const isDisabled = isSubmitting || disabled;
    const inputRef = useRef<HTMLInputElement>(null);
    const dbExplorerRef = useRef<HTMLDivElement>(null); // Ref for SchemaExplorer

    const MAX_CHARS = 500;

    const [databaseSchemas, setDatabaseSchemas] =
      useState<DatabaseSchema[]>(schemaSampleData);

    // handleColumnClick is still relevant for inserting columns into the input
    const handleColumnClick = useCallback(
      (columnName: string) => {
        if (inputRef.current) {
          const cursorPos = inputRef.current.selectionStart;
          const textBefore = input.substring(0, cursorPos);
          const textAfter = input.substring(cursorPos);
          const newText = `${textBefore}${columnName}${textAfter}`;
          onInputChange(newText);
        }
      },
      [input, onInputChange]
    );

    return (
      <form
        onSubmit={onSubmit}
        style={{ background: theme.colors.background, width: "100%" }}
        className="flex-grow" // Allow ChatInput to take available width
      >
        <div className="w-full h-full flex flex-col">
          {/* Schema Explorer - Shown when open (positioned above the input) */}
          {isDbExplorerOpen && (
            <div
              ref={dbExplorerRef}
              className="schema-explorer-container mb-2" // Added margin-bottom
              style={{
                position: "relative",
                zIndex: 5,
              }}
            >
              <SchemaExplorer
                schemas={databaseSchemas}
                onClose={() => setIsDbExplorerOpen(false)}
                theme={theme}
                onColumnClick={handleColumnClick}
                selectedConnection={selectedConnection}
              />
            </div>
          )}

          {/* Input container with the single line input and send button */}
          <div
            className="flex items-center gap-2 w-full"
            style={{
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.pill,
              border: `1px solid ${theme.colors.border}`,
              boxShadow: `0 2px 10px ${theme.colors.text}10`,
              padding: "5px",
            }}
          >
            {/* Input field */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) {
                  onInputChange(e.target.value);
                }
              }}
              placeholder="Ask about your data..."
              className="flex-grow h-10 px-3 text-base border-none rounded-lg focus:ring-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed placeholder-opacity-50"
              style={{
                backgroundColor: "transparent",
                color: theme.colors.text,
                border:
                  theme.mode === "light"
                    ? `1px solid ${theme.colors.border}`
                    : "none",
                boxShadow: theme.mode === "dark" ? theme.shadow.sm : "none",
                borderRadius: theme.borderRadius.default,
                fontFamily: theme.typography.fontFamily,
                fontSize: theme.typography.size.base,
                transition: theme.transition.default,
                outline: "none",
                "--tw-ring-color": theme.colors.accent,
              }}
              disabled={isDisabled}
              aria-disabled={isDisabled}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
            />

            {/* Send Button */}
            <CustomTooltip title="Ask Question" position="top">
              <button
                type="submit"
                disabled={isDisabled}
                className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 flex-shrink-0"
                style={{
                  background: isDisabled
                    ? `${theme.colors.text}20`
                    : theme.colors.accent,
                  color: "white",
                  boxShadow: isDisabled
                    ? "none"
                    : `0 0 10px ${theme.colors.accent}40`,
                }}
                aria-label="Send message"
              >
                {isSubmitting ? (
                  <MiniLoader />
                ) : (
                  <Send
                    size={18}
                    className="transition-transform duration-300"
                  />
                )}
              </button>
            </CustomTooltip>
          </div>
        </div>

        <style jsx>{`
          .schema-active {
            position: relative;
          }

          .schema-active::before {
            content: "";
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 9999px;
          }
        `}</style>
      </form>
    );
  }
);

const areEqual = (
  prevProps: ExtendedChatInputProps, // Use ExtendedChatInputProps for comparison
  nextProps: ExtendedChatInputProps
) => {
  return (
    prevProps.input === nextProps.input &&
    prevProps.isSubmitting === nextProps.isSubmitting &&
    prevProps.selectedConnection === nextProps.selectedConnection &&
    prevProps.connections === nextProps.connections &&
    prevProps.onSubmit === nextProps.onSubmit &&
    prevProps.onInputChange === nextProps.onInputChange &&
    prevProps.onSelect === nextProps.onSelect &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.isDbExplorerOpen === nextProps.isDbExplorerOpen // Compare new prop
  );
};

export default React.memo(ChatInput, areEqual);
