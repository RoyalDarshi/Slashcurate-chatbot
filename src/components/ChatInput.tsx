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
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
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
      }}
    >
      <div
        className="relative flex items-center w-full max-w-3xl mx-auto transition-all duration-300"
        style={{
          background: theme.colors.surface,
          padding: theme.spacing.sm,
          borderRadius: theme.borderRadius.pill,
          boxShadow: `0 2px 8px ${theme.colors.text}20`,
          border: `1px solid ${theme.colors.text}10`,
        }}
      >
        {/* Custom Connection Dropdown */}
        <div
          className="flex items-center mr-1 relative"
          style={{ gap: theme.spacing.sm }}
          ref={dropdownRef}
        >
          <Database
            size={18}
            style={{ color: theme.colors.textSecondary }}
            className="transition-colors duration-200"
          />
          <div className="relative">
            {/* Dropdown Trigger */}
            <button
              type="button"
              onClick={() => !isDisabled && setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center text-sm bg-transparent transition-all duration-200 hover:text-opacity-90 cursor-pointer"
              style={{
                color: theme.colors.text,
                opacity: isDisabled ? 0.5 : 1,
                padding: "8px",
                borderRadius: theme.borderRadius.default,
              }}
              disabled={isDisabled}
            >
              <span className="mr-2">
                {selectedConnection || "Select Connection"}
              </span>
              <ChevronDown
                size={16}
                style={{ color: theme.colors.textSecondary }}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div
                className="absolute left-0 bottom-full mb-2 w-48 bg-white rounded-md shadow-lg z-10"
                style={{
                  background: theme.colors.surface,
                }}
              >
                {options.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 cursor-pointer transition-colors duration-200"
                    style={{
                      color: theme.colors.text,
                      background:
                        selectedConnection === option.value
                          ? `${theme.colors.accent}20`
                          : "transparent",
                    }}
                    onClick={() => handleConnectionSelect(option.value)}
                  >
                    <span>{option.label}</span>
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
                            className="hover:text-opacity-80 transition-colors duration-200"
                          />
                        </button>
                        {/* Tooltip */}
                        <span
                          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap"
                          style={{ zIndex: 10 }}
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
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) {
              onInputChange(e.target.value);
            }
          }}
          placeholder="Ask me anything..."
          className="flex-1 min-h-[44px] max-h-32 px-3 py-2 mr-2 text-base font-medium bg-transparent focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 resize-none overflow-y-auto placeholder-opacity-70"
          style={{
            color: theme.colors.text,
            opacity: isDisabled ? 0.5 : 1,
            "--tw-ring-color": `${theme.colors.accent}50`,
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

        {/* Character Count */}
        {/* <p
          className="text-xs mr-4 self-end transition-opacity duration-200"
          style={{
            color:
              input.length > MAX_CHARS
                ? theme.colors.error
                : theme.colors.textSecondary,
            opacity: input.length > 0 ? 1 : 0,
          }}
        >
          {input.length}/{MAX_CHARS}
        </p> */}

        {/* Send Button */}
        <button
          type="submit"
          disabled={isDisabled}
          className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:opacity-85 active:scale-95"
          style={{
            background: isDisabled
              ? `${theme.colors.text}20`
              : theme.colors.accent,
            color: "white",
            boxShadow: isDisabled
              ? "none"
              : `0 2px 6px ${theme.colors.accent}50`,
          }}
          aria-label="Send message"
        >
          {isSubmitting ? <MiniLoader /> : <Send size={18} />}
        </button>
      </div>

      {/* Mobile-Specific Styles */}
      <style jsx>{`
        @media (max-width: 640px) {
          .relative button {
            font-size: 14px;
            padding: 6px;
          }
          .relative div.absolute {
            width: 100%;
            left: 0;
          }
        }
      `}</style>
    </form>
  );
};

export default React.memo(ChatInput);
