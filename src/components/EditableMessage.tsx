import React, { useState, useRef, useEffect } from "react";
import { Textarea, Button } from "@material-tailwind/react";
import { useTheme } from "../ThemeContext"; // Import the theme context

interface EditableMessageProps {
  messageContent: string;
  onSave: () => void;
  onCancel: () => void;
  onContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const EditableMessage: React.FC<EditableMessageProps> = ({
  messageContent,
  onSave,
  onCancel,
  onContentChange,
}) => {
  const { theme } = useTheme(); // Access the theme from context
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [editedContent, setEditedContent] = useState<string>();
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  useEffect(() => {
    setEditedContent(messageContent); // Reset content when prop changes
  }, [messageContent]);

  useEffect(() => {
    inputRef.current?.focus(); // Auto-focus the textarea
  }, []);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setEditedContent(value);
    setHasChanges(value !== messageContent);
    onContentChange(e);
  };

  return (
    <div
      className="w-screen max-w-2xl rounded-2xl rounded-tr-none p-4 shadow-lg"
      style={{
        background: theme.colors.accent, // Use accent color from the theme
        color: theme.colors.text, // Use text color from the theme
      }}
    >
      <Textarea
        variant="static"
        placeholder="Edit your message..."
        value={editedContent}
        onChange={handleTextareaChange}
        rows={4}
        autoFocus={true}
        ref={inputRef}
        className="outline-none border-none w-full text-lg placeholder-gray-100 bg-transparent resize-none"
        style={{
          fontSize: theme.typography.size.lg,
          color: "white",
          placeholderColor: theme.colors.textSecondary,
        }}
      />
      <div className="flex justify-end mt-4 space-x-3">
        <Button
          size="sm"
          className="rounded-2xl px-4 py-2 transition-all duration-200 shadow-md normal-case"
          style={{
            backgroundColor: theme.colors.disabled,
            color: "white",
            cursor: "pointer",
            opacity: 1,
            ":hover": {
              backgroundColor: theme.colors.hover,
            },
          }}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="rounded-2xl px-5 py-2 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed normal-case"
          style={{
            backgroundColor: hasChanges
              ? theme.colors.success
              : theme.colors.disabled,
            color: "white",
            cursor: hasChanges ? "pointer" : "not-allowed",
            opacity: hasChanges ? 1 : 0.5,
            ":hover": {
              backgroundColor: hasChanges
                ? theme.colors.successHover
                : theme.colors.disabled,
            },
          }}
          onClick={onSave}
          disabled={!hasChanges}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default EditableMessage;
