import React, { useReducer, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import ChatMessage from "./ChatMessage";
import { Message } from "../types";
import ChatInput from "./ChatInput";
import { CHATBOT_API_URL } from "../config";

interface State {
  isLoading: boolean;
  input: string;
}

type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_INPUT"; payload: string }
  | { type: "ADD_BOT_MESSAGE"; payload: Message };

const initialState: State = {
  isLoading: false,
  input: "",
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_INPUT":
      return { ...state, input: action.payload };
    case "ADD_BOT_MESSAGE":
      return { ...state, isLoading: false };
    default:
      return state;
  }
};

const ChatInterface: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const messagesRef = useRef<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const forceUpdate = useReducer(() => ({}), {})[1];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messagesRef.current.length, scrollToBottom]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!state.input.trim() || state.isLoading) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        content: state.input,
        isBot: false,
        timestamp: new Date().toISOString(),
      };

      // Add user message to chat
      messagesRef.current = [...messagesRef.current, userMessage];
      dispatch({ type: "SET_INPUT", payload: "" });
      forceUpdate();

      // Show loading state for bot
      dispatch({ type: "SET_LOADING", payload: true });

      // Add a bot message with spinner placeholder
      const botMessage: Message = {
        id: Date.now() + 1 + "",
        content: "loading...",
        isBot: true,
        timestamp: new Date().toISOString(),
      };

      messagesRef.current = [...messagesRef.current, botMessage];
      forceUpdate();

      try {
        const response = await axios.post(`${CHATBOT_API_URL}/ask`, {
          question: state.input,
        });

        const botResponseMessage: Message = {
          id: Date.now() + 2 + "",
          content: JSON.stringify(response.data, null, 2),
          isBot: true,
          timestamp: new Date().toISOString(),
        };

        // Replace the "loading" message with actual response
        messagesRef.current = [
          ...messagesRef.current.filter((msg) => msg.id !== botMessage.id), // Remove the loading message
          botResponseMessage, // Add the actual response
        ];
        forceUpdate();
      } catch {
        // Handle error
        const errorMessage: Message = {
          id: Date.now() + 3 + "",
          content: "Sorry, an error occurred. Please try again.",
          isBot: true,
          timestamp: new Date().toISOString(),
        };
        messagesRef.current = [
          ...messagesRef.current.filter((msg) => msg.id !== botMessage.id),
          errorMessage,
        ];
        forceUpdate();
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [state.input, state.isLoading, forceUpdate]
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-100 dark:bg-gray-800">
      <div className="overflow-y-auto flex-1 p-4 space-y-4">
        {messagesRef.current.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            loading={state.isLoading && message.isBot}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput
        input={state.input}
        isLoading={state.isLoading}
        onInputChange={(value) =>
          dispatch({ type: "SET_INPUT", payload: value })
        }
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default ChatInterface;
