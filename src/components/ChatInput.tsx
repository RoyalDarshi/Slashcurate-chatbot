import React, { useRef, useEffect, useState } from "react";
import { Send, Database, ChevronDown } from "lucide-react";
import { ChatInputProps, Connection } from "../types";
import { useTheme } from "../ThemeContext";
import MiniLoader from "./MiniLoader";
import { FaFilePdf } from "react-icons/fa";

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  isLoading,
  isSubmitting,
  onInputChange,
  onSubmit,
  connections = [],
  selectedConnection,
  onSelect,
}) => {
  const { theme } = useTheme();
  const isDisabled = isLoading || isSubmitting;
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
      )}px`; // Cap at 120px
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
          })),
        ];

  return (
    <form
      onSubmit={onSubmit}
      style={{
        background: theme.colors.background,
        padding: "16px",
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
          padding: "12px",
        }}
      >
        {/* Textarea (No Background, No Border, No Shadow) */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) {
              onInputChange(e.target.value);
            }
          }}
          placeholder="Type your message..."
          className="w-full min-h-[40px] max-h-32 px-3 py-2 text-base bg-transparent border-none outline-none  transition-all duration-300 resize-none overflow-y-auto placeholder-opacity-50"
          style={{
            color: theme.colors.text,
            opacity: isDisabled ? 0.5 : 1,
            "--tw-ring-color": theme.colors.accent,
            boxShadow: "none", // Remove shadow
            background: "transparent", // Remove background color
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

        {/* Connection Dropdown and Send Button */}
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
            <button
              type="button"
              onClick={() => !isDisabled && setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center text-sm transition-all duration-300 hover:bg-opacity-10 hover:bg-accent w-full"
              style={{
                color: theme.colors.text,
                background: isDisabled
                  ? `${theme.colors.text}10`
                  : "transparent",
                opacity: isDisabled ? 0.5 : 1,
                padding: "6px 10px",
                borderRadius: "6px",
                border: `1px solid ${theme.colors.accent}30`,
                fontFamily: "monospace",
              }}
              disabled={isDisabled}
            >
              <span className="truncate max-w-[150px] mr-2">
                {selectedConnection || "Select Connection"}
              </span>
              <ChevronDown
                size={16}
                style={{ color: theme.colors.accent }}
                className={`transition-transform duration-300 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu (Positioned at the Top, Width Based on Content) */}
            {isDropdownOpen && (
              <div
                className="absolute bottom-full left-0 rounded-md shadow-lg z-20 transition-all duration-300 mb-2"
                style={{
                  background: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  boxShadow: `0 4px 12px ${theme.colors.text}20`,
                  width: "min-content", // Set width to content size
                  maxWidth: "min-content", // Optional: Set a max-width to prevent overflow
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
                          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap"
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
          </div>

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
        </div>
      </div>
    </form>
  );
};

export default React.memo(ChatInput);
