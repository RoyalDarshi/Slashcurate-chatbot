import React, { useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { ChatInputProps } from "../types";
import { useTheme } from "../ThemeContext";
import MiniLoader from "./MiniLoader";
import CustomTooltip from "./CustomTooltip";

const ChatInput: React.FC<ChatInputProps> = React.memo(
  ({ input, isSubmitting, onInputChange, onSubmit, disabled }) => {
    const { theme } = useTheme();
    const isDisabled = isSubmitting || disabled;
    const inputRef = useRef<HTMLInputElement>(null);
    const MAX_CHARS = 500;

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, []);

    return (
      <form
        onSubmit={onSubmit}
        style={{ background: theme.colors.background, width: "100%" }}
        className="flex-grow"
      >
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
                <Send size={18} className="transition-transform duration-300" />
              )}
            </button>
          </CustomTooltip>
        </div>
      </form>
    );
  }
);

const areEqual = (prevProps: ChatInputProps, nextProps: ChatInputProps) => {
  return (
    prevProps.input === nextProps.input &&
    prevProps.isSubmitting === nextProps.isSubmitting &&
    prevProps.onSubmit === nextProps.onSubmit &&
    prevProps.onInputChange === nextProps.onInputChange &&
    prevProps.disabled === nextProps.disabled
  );
};

export default React.memo(ChatInput, areEqual);
