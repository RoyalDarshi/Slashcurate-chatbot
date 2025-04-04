// UserMessage.tsx
import React, { useState } from "react";
import { User, Edit3 } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../ThemeContext";
import EditableMessage from "./EditableMessage";
import CustomTooltip from "./CustomTooltip";
import { ChatMessageProps } from "../types";

const UserMessage: React.FC<ChatMessageProps> = ({
  message,
  onEditMessage,
  selectedConnection,
}) => {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [hasChanges, setHasChanges] = useState(false);

  const handleEdit = () => setIsEditing(true);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setEditedContent(newContent);
    setHasChanges(newContent !== message.content);
  };

  const handleSave = async () => {
    setIsEditing(false);
    if (!selectedConnection || !editedContent.trim() || !hasChanges) return;
    try {
      onEditMessage(message.id, editedContent);
      setHasChanges(false);
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  const handleCancel = () => {
    setEditedContent(message.content);
    setHasChanges(false);
    setIsEditing(false);
  };

  return (
    <div
      className="ml-auto flex w-full items-start justify-end"
      style={{ gap: theme.spacing.md }}
    >
      {!isEditing ? (
        <div
          className="max-w-[80%] p-4 shadow-md relative"
          style={{
            background: theme.colors.accent,
            borderRadius: theme.borderRadius.large,
            borderTopRightRadius: "0",
            boxShadow: `0 2px 6px ${theme.colors.text}20`,
          }}
        >
          <p
            className="whitespace-pre-wrap break-words"
            style={{ color: "white" }}
          >
            {message.content}
          </p>
          <div
            className="mt-2 border-t pt-2 flex items-center justify-between"
            style={{ borderColor: `${theme.colors.surface}20` }}
          >
            <span
              className="text-xs"
              style={{ color: theme.colors.textSecondary }}
            >
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <CustomTooltip title="Edit message" position="bottom">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEdit}
                className="p-2 transition-colors duration-200 hover:opacity-80"
                style={{ color: "white" }}
              >
                <Edit3 size={16} />
              </motion.button>
            </CustomTooltip>
          </div>
        </div>
      ) : (
        <EditableMessage
          messageContent={editedContent}
          onSave={handleSave}
          onCancel={handleCancel}
          onContentChange={handleContentChange}
          theme={theme}
        />
      )}
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full shadow-md"
        style={{ background: theme.colors.accent }}
      >
        <User size={20} style={{ color: "white" }} />
      </div>
    </div>
  );
};

export default React.memo(UserMessage);
