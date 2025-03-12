import React from "react";
import { Send } from "lucide-react";
import { ChatInputProps } from "../types";

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  isLoading,
  isSubmitting,
  onInputChange,
  onSubmit,
}) => {
  const isDisabled = isLoading || isSubmitting;

  return (
    <form
      onSubmit={onSubmit}
      className="p-4 bg-gray-200 dark:bg-gray-900 shadow-realistic-dark"
    >
      <div className="flex items-center space-x-3">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Type your message..."
          className={`flex-1 px-4 py-3 border rounded-lg shadow-sm transition-all duration-200 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
            disabled:bg-gray-100 
            disabled:text-gray-400 disabled:border-gray-300 
            disabled:dark:bg-gray-700 
            disabled:dark:text-gray-300 disabled:dark:border-gray-500 disabled:cursor-not-allowed
            hover:border-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 
            dark:focus:ring-blue-400 dark:focus:border-blue-400`}
          disabled={isDisabled}
          aria-disabled={isDisabled}
        />
        <button
          type="submit"
          disabled={isDisabled}
          className={`px-4 py-3 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-realistic ${
            isDisabled
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 shadow-realistic-hover"
          }`}
          title="Send"
          aria-disabled={isDisabled}
        >
          <Send size={20} />
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
