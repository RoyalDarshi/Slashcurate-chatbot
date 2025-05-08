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

const ChatInput: React.FC<ChatInputProps> = React.memo(
  ({
    input,
    isSubmitting,
    onInputChange,
    onSubmit,
    connections = [],
    selectedConnection,
    onSelect,
    onNewChat,
    disabled,
  }) => {
    const { theme } = useTheme();
    const isDisabled = isSubmitting || disabled;
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const dbExplorerRef = useRef<HTMLDivElement>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDbExplorerOpen, setIsDbExplorerOpen] = useState(false);
    const [activeSchema, setActiveSchema] = useState<string | null>(null);
    const [activeTable, setActiveTable] = useState<string | null>(null);
    const MAX_CHARS = 500;

    const [databaseSchemas, setDatabaseSchemas] =
      useState<DatabaseSchema[]>(schemaSampleData);

    const options = useMemo(
      () =>
        connections.length === 0
          ? [{ value: "create-con", label: "Create Connection" }]
          : [
              { value: "create-con", label: "Create Connection" },
              ...connections.map((connection: Connection) => ({
                value: connection.connectionName,
                label: connection.connectionName,
                isAdmin: connection.isAdmin,
              })),
            ],
      [connections]
    );

    const fetchDatabaseSchema = useCallback(async (connectionName: string) => {
      console.log(`Fetching schema for connection: ${connectionName}`);
    }, []);

    const handleConnectionSelect = useCallback(
      (connection: string | null) => {
        if (connection === "create-con") {
          onSelect({ value: "create-con" });
        } else {
          const selectedConnectionObj = connections.find(
            (conn) => conn.connectionName === connection
          );
          onSelect(
            selectedConnectionObj
              ? { value: selectedConnectionObj }
              : { value: null }
          );
          if (selectedConnectionObj) {
            fetchDatabaseSchema(selectedConnectionObj.connectionName);
          }
        }
        setIsDropdownOpen(false);
      },
      [onSelect, connections, fetchDatabaseSchema]
    );

    const handlePdfClick = useCallback(
      async (connectionName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
          const response = await fetch(
            `/api/getPdf?connection=${connectionName}`
          );
          const data = await response.json();
          if (data.pdfUrl) {
            window.open(data.pdfUrl, "_blank");
          }
        } catch (error) {
          console.error("Error fetching PDF:", error);
        }
      },
      []
    );

    const handleColumnClick = useCallback(
      (columnName: string) => {
        if (textareaRef.current) {
          const cursorPos = textareaRef.current.selectionStart;
          const textBefore = input.substring(0, cursorPos);
          const textAfter = input.substring(cursorPos);
          const newText = `${textBefore}${columnName}${textAfter}`;
          onInputChange(newText);
          // Keep schema explorer open to allow for multiple column selections
        }
      },
      [input, onInputChange]
    );

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(
          textareaRef.current.scrollHeight,
          120
        )}px`;
      }
    }, [input]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsDropdownOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleDropdown = useCallback(() => {
      if (!isDisabled) {
        setIsDropdownOpen((prev) => !prev);
      }
    }, [isDisabled]);

    const toggleDbExplorer = useCallback(() => {
      if (!isDisabled) {
        setIsDbExplorerOpen((prev) => !prev);
        if (!isDbExplorerOpen) {
          setActiveSchema(null);
          setActiveTable(null);
        }
      }
    }, [isDisabled, isDbExplorerOpen]);

    return (
      <form
        onSubmit={onSubmit}
        style={{ background: theme.colors.background, width: "100%" }}
      >
        <div
          className="w-full max-w-4xl mx-auto flex flex-col gap-3"
          style={{
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.large,
            border: `1px solid ${theme.colors.border}`,
            boxShadow: `0 2px 10px ${theme.colors.text}10`,
            padding: "10px",
          }}
        >
          {/* Schema Explorer - Shown when open */}
          {isDbExplorerOpen && (
            <div
              ref={dbExplorerRef}
              className="schema-explorer-container"
              style={{
                marginBottom: theme.spacing.md,
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

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHARS) {
                onInputChange(e.target.value);
              }
            }}
            placeholder="Ask about your data..."
            className="w-full min-h-[40px] max-h-32 px-3 py-2 text-base border-none rounded-lg focus:ring-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed resize-none overflow-y-auto placeholder-opacity-50"
            rows={1}
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

          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Connection Dropdown */}
              <div
                className="flex items-center gap-2 max-w-[250px] relative"
                ref={dropdownRef}
              >
                <Database
                  size={20}
                  style={{ color: theme.colors.accent, opacity: 0.9 }}
                  className="transition-transform duration-300 hover:scale-105 flex-shrink-0"
                />
                <CustomTooltip
                  title="Change or create a connection"
                  position="left"
                >
                  <button
                    type="button"
                    onClick={toggleDropdown}
                    className="flex items-center justify-between w-full max-w-[180px] py-1.5 text-sm font-medium tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                    style={{
                      color: theme.colors.text,
                      backgroundColor: "transparent",
                      border: `1px solid ${theme.colors.accent}`,
                      borderRadius: theme.borderRadius.pill,
                      padding: "6px 10px",
                    }}
                    onMouseOver={(e) =>
                      !isDisabled &&
                      (e.currentTarget.style.backgroundColor =
                        theme.colors.accentHover + "20")
                    }
                    onMouseOut={(e) =>
                      !isDisabled &&
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                    disabled={isDisabled}
                  >
                    <span className="truncate max-w-[130px]">
                      {selectedConnection || "Select Connection"}
                    </span>
                    <ChevronDown
                      size={16}
                      style={{ color: theme.colors.accent }}
                      className={`transition-transform duration-200 ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </CustomTooltip>

                {isDropdownOpen && (
                  <div
                    className="absolute bottom-full left-0 rounded-md shadow-lg z-30 transition-all duration-300 mb-2"
                    style={{
                      background: theme.colors.surface,
                      border: `1px solid ${theme.colors.border}`,
                      boxShadow: `0 4px 12px ${theme.colors.text}20`,
                      width: "min-content",
                      maxWidth: "min-content",
                    }}
                  >
                    {options.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center justify-between px-3 py-2 hover:bg-opacity-10 hover:bg-accent cursor-pointer transition-all duration-300"
                        style={{
                          color: theme.colors.text,
                          background:
                            selectedConnection === option.value
                              ? `${theme.colors.accent}10`
                              : "transparent",
                        }}
                        onClick={() => handleConnectionSelect(option.value)}
                      >
                        <span
                          className="truncate"
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {option.label}
                        </span>
                        {option.isAdmin && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              backgroundColor: theme.colors.background,
                              color: theme.colors.accent,
                              fontSize: theme.typography.size.sm,
                              fontWeight: theme.typography.weight.normal,
                              padding: `0 ${theme.spacing.sm}`,
                              borderRadius: theme.borderRadius.default,
                              marginLeft: theme.spacing.sm,
                              textTransform: "lowercase",
                            }}
                          >
                            Default
                          </span>
                        )}
                        {option.value !== "create-con" && (
                          <div className="relative group">
                            <button
                              type="button"
                              onClick={(e) => handlePdfClick(option.value, e)}
                              className="p-1"
                            >
                              <FaFilePdf
                                size={16}
                                style={{ color: theme.colors.error }}
                                className="hover:scale-105 transition-transform duration-300"
                              />
                            </button>
                            <span
                              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mt-1 text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap"
                              style={{
                                background: theme.colors.accent,
                                color: theme.colors.surface,
                                boxShadow: `0 0 6px ${theme.colors.accent}40`,
                              }}
                            >
                              View Data Atlas
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Database Explorer Button */}
              <CustomTooltip title="Explore Database Schema" position="right">
                <button
                  type="button"
                  onClick={toggleDbExplorer}
                  className={`flex items-center gap-1 py-1.5 px-3 text-sm font-medium tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group ${
                    isDbExplorerOpen ? "schema-active" : ""
                  }`}
                  style={{
                    color: theme.colors.text,
                    backgroundColor: isDbExplorerOpen
                      ? `${theme.colors.accent}20`
                      : "transparent",
                    border: `1px solid ${theme.colors.accent}`,
                    borderRadius: theme.borderRadius.pill,
                  }}
                  onMouseOver={(e) =>
                    !isDisabled &&
                    (e.currentTarget.style.backgroundColor =
                      theme.colors.accentHover + "20")
                  }
                  onMouseOut={(e) =>
                    !isDisabled &&
                    (e.currentTarget.style.backgroundColor = isDbExplorerOpen
                      ? `${theme.colors.accent}20`
                      : "transparent")
                  }
                  disabled={isDisabled || !selectedConnection}
                >
                  <Layers
                    size={16}
                    style={{
                      color: theme.colors.accent,
                      transform: isDbExplorerOpen
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.3s ease",
                    }}
                  />
                  <span className="hidden sm:inline">Schema Explorer</span>
                  <ChevronDown
                    size={16}
                    style={{
                      color: theme.colors.accent,
                      transform: isDbExplorerOpen
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.3s ease",
                    }}
                    className="ml-1"
                  />
                </button>
              </CustomTooltip>

              {/* New Chat Button */}
              <CustomTooltip title="Create a new session" position="bottom">
                <button
                  type="button"
                  onClick={onNewChat}
                  className="flex items-center gap-1 py-1.5 px-3 text-sm font-medium tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    color: theme.colors.text,
                    backgroundColor: "transparent",
                    border: `1px solid ${theme.colors.accent}`,
                    borderRadius: theme.borderRadius.pill,
                  }}
                  onMouseOver={(e) =>
                    !isSubmitting &&
                    (e.currentTarget.style.backgroundColor =
                      theme.colors.accentHover + "20")
                  }
                  onMouseOut={(e) =>
                    !isSubmitting &&
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                  disabled={isSubmitting}
                >
                  <PlusCircle
                    size={16}
                    style={{ color: theme.colors.accent }}
                  />
                  <span className="hidden sm:inline">New Chat</span>
                </button>
              </CustomTooltip>
            </div>

            <CustomTooltip title="Ask Question" position="bottom">
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

          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 ${theme.colors.accent}40;
            }
            70% {
              box-shadow: 0 0 0 6px ${theme.colors.accent}00;
            }
            100% {
              box-shadow: 0 0 0 0 ${theme.colors.accent}00;
            }
          }

          .schema-active::before {
            content: "";
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 9999px;
            animation: pulse 2s infinite;
          }
        `}</style>
      </form>
    );
  }
);

const areEqual = (prevProps: ChatInputProps, nextProps: ChatInputProps) => {
  return (
    prevProps.input === nextProps.input &&
    prevProps.isSubmitting === nextProps.isSubmitting &&
    prevProps.selectedConnection === nextProps.selectedConnection &&
    prevProps.connections === nextProps.connections &&
    prevProps.onSubmit === nextProps.onSubmit &&
    prevProps.onInputChange === nextProps.onInputChange &&
    prevProps.onSelect === nextProps.onSelect &&
    prevProps.onNewChat === nextProps.onNewChat
  );
};

export default React.memo(ChatInput, areEqual);
