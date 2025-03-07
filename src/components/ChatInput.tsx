import React from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  isLoading,
  onInputChange,
  onSubmit,
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className="p-4 bg-gray-200 dark:bg-gray-800 shadow-realistic-dark"
    >
      <div className="flex items-center space-x-3">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-3 border rounded-lg shadow-sm transition-all duration-200 
             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
             hover:border-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 
             dark:focus:ring-blue-400 dark:focus:border-blue-400"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className={`px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-realistic ${
            isLoading
              ? "opacity-50 cursor-not-allowed"
              : "shadow-realistic-hover"
          }`}
          title="Send"
        >
          <Send size={20} />
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
