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
      if (hasChanges && editedContent.trim()) {
        onSave();
      } else if (!hasChanges) {
        onCancel();
      }
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div
      className="w-full rounded-[2rem] rounded-tr-none p-4 md:p-5 shadow-floating transition-all duration-300 border backdrop-blur-md flex flex-col gap-3 group/editor focus-within:shadow-lg"
      style={{
        backgroundColor: theme.colors.surfaceGlass,
        borderColor: theme.colors.border,
      }}
    >
      <textarea
        ref={inputRef}
        placeholder="Edit your message..."
        value={editedContent}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        rows={1}
        className="w-full bg-transparent resize-none border-none focus:outline-none focus:ring-0 p-0 text-base placeholder-opacity-50"
        style={{
          fontSize: fontSize,
          color: theme.colors.text,
          lineHeight: "1.6",
          fontFamily: theme.typography.fontFamily,
          minHeight: "36px",
          maxHeight: "240px",
          outline: "none",
        }}
      />
      <div className="flex justify-end gap-2 border-t pt-3 border-slate-100 dark:border-slate-800/60">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          className="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-200 border"
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
        </motion.button>
        <motion.button
          whileHover={hasChanges ? { scale: 1.02 } : {}}
          whileTap={hasChanges ? { scale: 0.98 } : {}}
          type="button"
          disabled={!hasChanges}
          className="rounded-full px-5 py-1.5 text-xs font-semibold transition-all duration-200 shadow-sm"
          style={{
            backgroundColor: hasChanges
              ? theme.colors.accent
              : `${theme.colors.text}10`,
            color: hasChanges ? "white" : theme.colors.textSecondary,
            opacity: hasChanges ? 1 : 0.6,
            cursor: hasChanges ? "pointer" : "not-allowed",
          }}
          onMouseEnter={(e) => {
            if (hasChanges) {
              e.currentTarget.style.backgroundColor = theme.colors.accentHover;
            }
          }}
          onMouseLeave={(e) => {
            if (hasChanges) {
              e.currentTarget.style.backgroundColor = theme.colors.accent;
            }
          }}
          onClick={onSave}
        >
          Save
        </motion.button>
      </div>
    </div>
  );
};

export default EditableMessage;
