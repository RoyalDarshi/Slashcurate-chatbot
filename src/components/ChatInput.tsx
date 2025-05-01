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
  FileText,
} from "lucide-react";
import { ChatInputProps, Connection, DatabaseSchema } from "../types";
import { useTheme } from "../ThemeContext";
import MiniLoader from "./MiniLoader";
import { FaFilePdf } from "react-icons/fa";
import CustomTooltip from "./CustomTooltip";

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
  }) => {
    const { theme } = useTheme();
    const isDisabled = isSubmitting;
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const dbExplorerRef = useRef<HTMLDivElement>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDbExplorerOpen, setIsDbExplorerOpen] = useState(false);
    const [activeSchema, setActiveSchema] = useState<string | null>(null);
    const [activeTable, setActiveTable] = useState<string | null>(null);
    const MAX_CHARS = 500;

    // Mock database schema data - in a real application, you would fetch this from your API
    const [databaseSchemas, setDatabaseSchemas] = useState<DatabaseSchema[]>([
      {
        name: "public",
        tables: [
          {
            name: "users",
            columns: ["id", "username", "email", "created_at"],
          },
          {
            name: "orders",
            columns: ["id", "user_id", "product_id", "quantity", "order_date"],
          },
        ],
      },
      {
        name: "sales",
        tables: [
          {
            name: "products",
            columns: ["id", "name", "price", "category", "stock_quantity"],
          },
          {
            name: "transactions",
            columns: ["id", "product_id", "amount", "transaction_date"],
          },
        ],
      },
    ]);

    // Memoized connection options
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

    // Function to fetch database schema when a connection is selected
    // In a real app, you would implement this to fetch from your backend
    const fetchDatabaseSchema = useCallback(async (connectionName: string) => {
      // This would be replaced by an actual API call
      console.log(`Fetching schema for connection: ${connectionName}`);
      // The mock data is already set in state, so we don't need to do anything here
    }, []);

    // Memoized event handlers
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

          // Fetch database schema when a connection is selected
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

    const handleSchemaClick = useCallback(
      (schemaName: string) => {
        setActiveSchema(activeSchema === schemaName ? null : schemaName);
        setActiveTable(null);
      },
      [activeSchema]
    );

    const handleTableClick = useCallback(
      (tableName: string) => {
        setActiveTable(activeTable === tableName ? null : tableName);
      },
      [activeTable]
    );

    const handleColumnClick = useCallback(
      (columnName: string) => {
        // Insert column name into textarea at cursor position
        if (textareaRef.current) {
          const cursorPos = textareaRef.current.selectionStart;
          const textBefore = input.substring(0, cursorPos);
          const textAfter = input.substring(cursorPos);
          const newText = `${textBefore}${columnName}${textAfter}`;
          onInputChange(newText);

          // Close the explorer after selecting a column
          setIsDbExplorerOpen(false);
        }
      },
      [input, onInputChange]
    );

    // Textarea auto-resize effect
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(
          textareaRef.current.scrollHeight,
          120
        )}px`;
      }
    }, [input]);

    // Click outside dropdown handler
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsDropdownOpen(false);
        }

        if (
          dbExplorerRef.current &&
          !dbExplorerRef.current.contains(event.target as Node)
        ) {
          setIsDbExplorerOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Memoized dropdown toggle handler
    const toggleDropdown = useCallback(() => {
      if (!isDisabled) {
        setIsDropdownOpen((prev) => !prev);
      }
    }, [isDisabled]);

    // Toggle database explorer
    const toggleDbExplorer = useCallback(() => {
      if (!isDisabled) {
        setIsDbExplorerOpen((prev) => !prev);
        // Reset active selections when opening
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
                    onClick={() =>
                      !isDisabled && setIsDropdownOpen(!isDropdownOpen)
                    }
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
              <div className="relative" ref={dbExplorerRef}>
                <CustomTooltip title="Explore Database Schema" position="right">
                  <button
                    type="button"
                    onClick={toggleDbExplorer}
                    className="flex items-center gap-1 py-1.5 px-3 text-sm font-medium tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
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
                    <Layers size={16} style={{ color: theme.colors.accent }} />
                    <span className="hidden sm:inline">Schema Explorer</span>
                    {isDbExplorerOpen ? (
                      <ChevronDown
                        size={16}
                        style={{ color: theme.colors.accent }}
                        className="transition-transform duration-300 rotate-180 ml-1"
                      />
                    ) : (
                      <ChevronDown
                        size={16}
                        style={{ color: theme.colors.accent }}
                        className="transition-transform duration-300 ml-1"
                      />
                    )}
                  </button>
                </CustomTooltip>

                {/* Database Explorer Panel - Updated panel styling */}
                {isDbExplorerOpen && (
                  <div
                    className="absolute bottom-full left-0 mb-2 rounded-md shadow-lg z-20 overflow-hidden"
                    style={{
                      background: theme.colors.surface,
                      border: `1px solid ${theme.colors.border}`,
                      boxShadow: `0 8px 20px ${theme.colors.text}30`,
                      width: "320px",
                      maxHeight: "450px",
                      overflow: "auto",
                      borderRadius: theme.borderRadius.default,
                    }}
                  >
                    <div
                      style={{
                        padding: "12px 16px",
                        borderBottom: `1px solid ${theme.colors.border}`,
                        backgroundColor: theme.colors.accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <h3
                        style={{
                          color: "white",
                          fontSize: theme.typography.size.base,
                          fontWeight: theme.typography.weight.bold,
                        }}
                      >
                        Database Structure
                      </h3>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: "white",
                            color: theme.colors.accent,
                            fontWeight: theme.typography.weight.medium,
                          }}
                        >
                          {selectedConnection}
                        </span>
                      </div>
                    </div>
                    {databaseSchemas.length > 0 ? (
                      <div>
                        {databaseSchemas.map((schema) => (
                          <div key={schema.name} className="schema-section">
                            <div
                              className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-opacity-10 hover:bg-accent transition-all duration-200"
                              style={{
                                borderBottom: `1px solid ${theme.colors.border}20`,
                                backgroundColor:
                                  activeSchema === schema.name
                                    ? `${theme.colors.accent}15`
                                    : "transparent",
                              }}
                              onClick={() => handleSchemaClick(schema.name)}
                            >
                              <div
                                className="flex items-center justify-center rounded-md p-1"
                                style={{
                                  backgroundColor:
                                    activeSchema === schema.name
                                      ? theme.colors.accent + "20"
                                      : theme.colors.background,
                                }}
                              >
                                <Layers
                                  size={16}
                                  style={{
                                    color:
                                      activeSchema === schema.name
                                        ? theme.colors.accent
                                        : theme.colors.text + "80",
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  color: theme.colors.text,
                                  fontWeight:
                                    activeSchema === schema.name
                                      ? theme.typography.weight.normal
                                      : theme.typography.weight.medium,
                                }}
                              >
                                {schema.name}
                              </span>
                              <ChevronDown
                                size={16}
                                style={{
                                  color: theme.colors.text,
                                  marginLeft: "auto",
                                  transform:
                                    activeSchema === schema.name
                                      ? "rotate(180deg)"
                                      : "rotate(0)",
                                  transition: "transform 0.3s ease",
                                }}
                              />
                            </div>

                            {/* Tables - with updated styling */}
                            {activeSchema === schema.name &&
                              schema.tables.map((table) => (
                                <div
                                  key={table.name}
                                  className="table-section ml-4"
                                >
                                  <div
                                    className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-opacity-10 hover:bg-accent transition-all duration-200"
                                    style={{
                                      borderBottom: `1px solid ${theme.colors.border}10`,
                                      backgroundColor:
                                        activeTable === table.name
                                          ? `${theme.colors.accent}08`
                                          : "transparent",
                                      borderLeft: `2px solid ${
                                        activeTable === table.name
                                          ? theme.colors.accent
                                          : theme.colors.border + "40"
                                      }`,
                                    }}
                                    onClick={() => handleTableClick(table.name)}
                                  >
                                    <Table2
                                      size={14}
                                      style={{
                                        color:
                                          activeTable === table.name
                                            ? theme.colors.accent
                                            : theme.colors.text + "70",
                                      }}
                                    />
                                    <span
                                      style={{
                                        color: theme.colors.text,
                                        fontSize: theme.typography.size.sm,
                                        fontWeight:
                                          activeTable === table.name
                                            ? theme.typography.weight.medium
                                            : theme.typography.weight.normal,
                                      }}
                                    >
                                      {table.name}
                                    </span>
                                    <div
                                      className="px-1.5 py-0.5 text-xs rounded-sm ml-1"
                                      style={{
                                        backgroundColor:
                                          theme.colors.background,
                                        color: theme.colors.text + "70",
                                      }}
                                    >
                                      {table.columns.length}
                                    </div>
                                    <ChevronDown
                                      size={14}
                                      style={{
                                        color: theme.colors.text,
                                        opacity: 0.7,
                                        marginLeft: "auto",
                                        transform:
                                          activeTable === table.name
                                            ? "rotate(180deg)"
                                            : "rotate(0)",
                                        transition: "transform 0.3s ease",
                                      }}
                                    />
                                  </div>

                                  {/* Columns - with updated styling */}
                                  {activeTable === table.name && (
                                    <div
                                      className="columns-section ml-4 py-1"
                                      style={{
                                        backgroundColor:
                                          theme.colors.background + "40",
                                        borderLeft: `2px solid ${theme.colors.accent}50`,
                                      }}
                                    >
                                      {table.columns.map((column) => (
                                        <div
                                          key={column}
                                          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-opacity-15 hover:bg-accent transition-all duration-200"
                                          style={{
                                            borderBottom: `1px solid ${theme.colors.border}05`,
                                          }}
                                          onClick={() =>
                                            handleColumnClick(column)
                                          }
                                        >
                                          <FileText
                                            size={12}
                                            style={{
                                              color: theme.colors.text,
                                              opacity: 0.6,
                                            }}
                                          />
                                          <span
                                            style={{
                                              color: theme.colors.text,
                                              fontSize:
                                                theme.typography.size.sm,
                                            }}
                                          >
                                            {column}
                                          </span>
                                          <div
                                            className="ml-auto px-1.5 py-0.5 text-xs rounded-sm opacity-0 hover:opacity-100 transition-opacity duration-200"
                                            style={{
                                              backgroundColor:
                                                theme.colors.accent + "15",
                                              color: theme.colors.accent,
                                            }}
                                          >
                                            insert
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className="p-4 text-center"
                        style={{
                          color: theme.colors.text,
                          opacity: 0.7,
                        }}
                      >
                        No database schema available
                      </div>
                    )}
                  </div>
                )}
              </div>

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
      </form>
    );
  }
);

// Custom comparison function for props
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
