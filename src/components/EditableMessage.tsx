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
  const [editedContent, setEditedContent] = useState(messageContent);
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
    <div className="w-screen max-w-2xl mx-auto bg-gradient-to-br from-blue-100 to-purple-100 p-5 rounded-3xl shadow-xl">
      <Textarea
        variant="static"
        placeholder="Edit your message..."
        value={editedContent}
        onChange={handleTextareaChange}
        rows={4}
        style={{ fontSize: "17px" }}
        className="focus:outline-none border-none text-gray-900 text-lg placeholder-gray-500 bg-white"
        ref={inputRef}
      />
      <div className="flex justify-end mt-4 space-x-3">
        <Button
          size="sm"
          className="rounded-2xl bg-red-400 text-white hover:bg-red-500 px-5 py-2 transition-all duration-200"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 transition-all duration-200 hover:shadow-md disabled:opacity-50"
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
