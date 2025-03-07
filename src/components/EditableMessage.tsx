import React, { useState, useRef, useEffect } from "react";
import { Textarea, Button } from "@material-tailwind/react";

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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [editedContent, setEditedContent] = useState();
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditedContent(messageContent);
  }, [messageContent]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
    setHasChanges(e.target.value !== messageContent);
    onContentChange(e);
  };

  return (
    <div className="w-screen max-w-2xl rounded-2xl rounded-tr-none bg-gradient-to-r from-blue-500 to-blue-600 p-4 shadow-lg dark:from-blue-600 dark:to-blue-700">
      <Textarea
        variant="static"
        placeholder="Edit your message..."
        value={editedContent}
        onChange={handleTextareaChange}
        rows={4}
        style={{ fontSize: "17px", resize: "none" }}
        className="outline-none border-none text-white text-lg placeholder-gray-100 bg-transparent w-full"
        autoFocus={true}
        ref={inputRef}
      />
      <div className="flex justify-end mt-4 space-x-3">
        <Button
          size="sm"
          className="rounded-2xl bg-red-400 text-white hover:bg-red-500 px-5 py-2 transition-all duration-200 shadow-md"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="rounded-2xl bg-white hover:bg-slate-200  text-blue-600 px-6 py-2 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
