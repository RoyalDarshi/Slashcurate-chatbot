import React, { useReducer, useRef, useEffect, useCallback, useState } from "react";
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

interface ChatInterfaceProps {
  onCreateConSelected: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onCreateConSelected }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const messagesRef = useRef<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const forceUpdate = useReducer(() => ({}), {})[1];
  const [connections, setConnections] = useState<string[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [connectionSelected, setConnectionSelected] = useState(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messagesRef.current.length, scrollToBottom]);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        setConnections(["db2", "mysql"]);
      } catch (error) {
        console.error("Error fetching connections:", error);
      } finally {
        setLoadingConnections(false);
      }
    };

    fetchConnections();
  }, []);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "create-con") {
      onCreateConSelected();
      setSelectedConnection(null);
      setConnectionSelected(false);
    } else {
      setSelectedConnection(value);
      setConnectionSelected(true);
    }
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!state.input.trim() || state.isLoading || !selectedConnection) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        content: state.input,
        isBot: false,
        timestamp: new Date().toISOString(),
      };

      messagesRef.current = [...messagesRef.current, userMessage];
      dispatch({ type: "SET_INPUT", payload: "" });
      forceUpdate();

      dispatch({ type: "SET_LOADING", payload: true });

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
          connection: selectedConnection,
        });

        const botResponseMessage: Message = {
          id: Date.now() + 2 + "",
          content: JSON.stringify(response.data, null, 2),
          isBot: true,
          timestamp: new Date().toISOString(),
        };

        messagesRef.current = [
          ...messagesRef.current.filter((msg) => msg.id !== botMessage.id),
          botResponseMessage,
        ];
        forceUpdate();
      } catch {
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
    [state.input, state.isLoading, forceUpdate, selectedConnection]
  );

  if (loadingConnections) {
    return <div>Loading connections...</div>;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-100 dark:bg-gray-800">
      <div className="p-4 flex items-center justify-between">
        {connectionSelected ? (
          <div className="flex items-center">
            <span className="font-semibold text-lg mr-2">Current Connection:</span>
            <span className="text-lg">{selectedConnection}</span>
          </div>
        ) : (
          <div className="flex items-center">
            <label htmlFor="connectionSelect" className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Connection:
            </label>
            <select
              id="connectionSelect"
              className="mt-1 block py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selectedConnection || ""}
              onChange={handleSelect}
            >
              <option disabled value="">
                Select a Connection
              </option>
              <option value="create-con">Create Connection</option>
              {connections.map((connection) => (
                <option key={connection} value={connection}>
                  {connection}
                </option>
              ))}
            </select>
          </div>
        )}
        <div></div>
      </div>
      {connectionSelected && (
        <>
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
            onInputChange={(value) => dispatch({ type: "SET_INPUT", payload: value })}
            onSubmit={handleSubmit}
          />
        </>
      )}
    </div>
  );
};

export default ChatInterface;