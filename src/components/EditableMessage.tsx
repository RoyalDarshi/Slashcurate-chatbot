import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../ThemeContext";
import { motion } from "framer-motion";

interface EditableMessageProps {
  messageContent: string;
  onSave: () => void;
  onCancel: () => void;
  onContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  fontSize: string;
}

const EditableMessage: React.FC<EditableMessageProps> = ({
  messageContent,
  onSave,
  onCancel,
  onContentChange,
  fontSize,
}) => {
  const { theme } = useTheme();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [editedContent, setEditedContent] = useState<string>(messageContent);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  useEffect(() => {
    setEditedContent(messageContent);
  }, [messageContent]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      // Move cursor to the end of text
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, []);

  // Auto-grow height based on input content
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, 240)}px`;
    }
  }, [editedContent]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setEditedContent(value);
    setHasChanges(value.trim() !== messageContent.trim());
    onContentChange(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.15 }}
      className="w-full rounded-xl p-3 border transition-[border-color,box-shadow] duration-200 flex flex-col gap-3"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: isFocused ? theme.colors.accent : theme.colors.border,
        boxShadow: isFocused 
          ? `0 0 0 2px ${theme.colors.accent}15` 
          : "none",
      }}
    >
      <textarea
        ref={inputRef}
        placeholder="Edit message..."
        value={editedContent}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        rows={1}
        className="w-full bg-transparent resize-none border-none focus:outline-none focus:ring-0 p-0 text-[15px] placeholder-slate-400 dark:placeholder-slate-500 custom-scrollbar"
        style={{
          fontSize: fontSize,
          color: theme.colors.text,
          lineHeight: "1.5",
          fontFamily: theme.typography.fontFamily,
          minHeight: "40px",
          maxHeight: "240px",
          outline: "none",
        }}
      />

      <div className="flex justify-end items-center gap-2">
        <button
          type="button"
          className="rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors duration-150 border"
          style={{
            borderColor: theme.colors.border,
            backgroundColor: "transparent",
            color: theme.colors.textSecondary,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.hover;
            e.currentTarget.style.color = theme.colors.text;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = theme.colors.textSecondary;
          }}
          onClick={onCancel}
        >
          Cancel
        </button>
        
        <button
          type="button"
          className="rounded-lg px-4 py-1.5 text-xs font-semibold transition-all duration-150 shadow-sm cursor-pointer"
          style={{
            backgroundColor: theme.colors.accent,
            color: "white",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.accentHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.accent;
          }}
          onClick={onSave}
        >
          Retry
        </button>
      </div>
    </motion.div>
  );
};

export default EditableMessage;
