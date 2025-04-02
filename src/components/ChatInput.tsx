import React, { useRef, useEffect, useState } from "react";
import { Send, Database, ChevronDown, PlusCircle } from "lucide-react";
import { ChatInputProps, Connection } from "../types";
import { useTheme } from "../ThemeContext";
import MiniLoader from "./MiniLoader";
import { FaFilePdf } from "react-icons/fa";
import CustomTooltip from "./CustomTooltip";

const ChatInput: React.FC<ChatInputProps> = ({
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const MAX_CHARS = 500;

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConnectionSelect = (connection: string | null) => {
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
    }
    setIsDropdownOpen(false);
  };

  const handlePdfClick = async (
    connectionName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/getPdf?connection=${connectionName}`);
      const data = await response.json();
      if (data.pdfUrl) {
        window.open(data.pdfUrl, "_blank");
      } else {
        console.error("No PDF URL found in the response");
      }
    } catch (error) {
      console.error("Error fetching PDF:", error);
    }
  };

  const options =
    connections.length === 0
      ? [{ value: "create-con", label: "Create Connection" }]
      : [
          { value: "create-con", label: "Create Connection" },
          ...connections.map((connection: Connection) => ({
            value: connection.connectionName,
            label: connection.connectionName,
            isAdmin: connection.isAdmin,
          })),
        ];

  return (
    <form
      onSubmit={onSubmit}
      style={{
        background: theme.colors.background,
        width: "100%",
      }}
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

        <div className="flex items-center justify-between gap-3">
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
                className="absolute bottom-full left-0 rounded-md shadow-lg z-20 transition-all duration-300 mb-2"
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
                          View PDF
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <CustomTooltip title="Create a new session" position="bottom">
              <button
                type="button"
                onClick={onNewChat}
                className="flex min-w-[120px] items-center gap-1 py-1.5 px-3 text-sm font-medium tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <PlusCircle size={16} style={{ color: theme.colors.accent }} />
                New Chat
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
                <Send size={18} className="transition-transform duration-300" />
              )}
            </button>
          </CustomTooltip>
        </div>
      </div>
    </form>
  );
};

export default React.memo(ChatInput);
