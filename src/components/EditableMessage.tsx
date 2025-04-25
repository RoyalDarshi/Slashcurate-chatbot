import React, { useState, useRef, useEffect } from "react";
import { Textarea, Button } from "@material-tailwind/react";
import { useTheme } from "../ThemeContext";

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
  const [editedContent, setEditedContent] = useState<string>();
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  useEffect(() => {
    setEditedContent(messageContent);
  }, [messageContent]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setEditedContent(value);
    setHasChanges(value !== messageContent);
    onContentChange(e);
  };

  return (
    <div
      className="w-screen max-w-xl rounded-2xl rounded-tr-none p-4 pt-0 shadow-lg"
      style={{
        background: theme.colors.accent,
        color: theme.colors.text,
      }}
    >
      <Textarea
        variant="static"
        placeholder="Edit your message..."
        value={editedContent}
        onChange={handleTextareaChange}
        rows={3}
        autoFocus={true}
        ref={inputRef}
        className="outline-none border-none w-full text-lg placeholder-gray-100 bg-transparent resize-none"
        style={{
          fontSize: fontSize,
          color: "white",
          placeholderColor: theme.colors.textSecondary,
        }}
      />
      <div className="flex justify-end space-x-3">
        <Button
          size="sm"
          className="rounded-2xl px-4 py-2 transition-all duration-300 shadow-md hover:shadow-lg active:scale-95" // Modern styles
          style={{
            backgroundColor: theme.colors.bubbleBot,
            color: theme.colors.text,
            cursor: "pointer",
          }}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="rounded-2xl px-5 py-2 transition-all duration-300 shadow-md hover:shadow-lg active:scale-95" // Modern styles
          style={{
            backgroundColor: hasChanges
              ? theme.colors.success
              : theme.colors.disabled,
            color: "white",
            cursor: hasChanges ? "pointer" : "not-allowed",
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