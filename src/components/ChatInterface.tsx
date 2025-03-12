import React, { useReducer, useRef, useEffect, useCallback, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { 
  Message, 
  Connection, 
  ChatState, 
  ChatAction, 
  ChatInterfaceProps 
} from "../types";
import { CHATBOT_API_URL, API_URL, CHATBOT_CON_DETAILS_API_URL } from "../config";
import { ConnectionSelector } from "./ConnectionSelector";
import { CurrentConnection } from "./CurrentConnection";
import { MessageList } from "./MessageList";
import ChatInput from "./ChatInput";

const initialState: ChatState = {
  isLoading: false,
  input: "",
  isSubmitting: false,
};

const reducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_INPUT":
      return { ...state, input: action.payload };
    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.payload };
    default:
      return state;
  }
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onCreateConSelected }) => {
  const [loadingMessageId, setLoadingMessageId] = useState<string | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const messagesRef = useRef<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [connectionSelected, setConnectionSelected] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const saveMessages = useCallback(() => {
    try {
      const existingMessages = JSON.parse(
        localStorage.getItem("chatMessages") ?? "[]"
      );
      console.log("existingMessages", existingMessages);
      const allMessages = [...existingMessages, ...messagesRef.current];

      const limitedMessages = allMessages.slice(-10);
      localStorage.setItem("chatMessages", JSON.stringify(limitedMessages));
    } catch (error) {
      console.error("Failed to save messages to local storage", error);
    }
  }, []);

  useEffect(() => {
    const fetchConnections = async () => {
      const userId = sessionStorage.getItem("userId");
      if (!userId) {
        toast.error("User ID not found. Please log in again.");
        return;
      }
      try {
        const response = await axios.post(`${API_URL}/getuserconnections`, {
          userId,
        });
        setConnections(response.data.connections);
      } catch (error) {
        console.error("Error fetching connections:", error);
      }
    };
    fetchConnections();
  }, []);

  const handleSelect = async (option: any) => {
    if (option && option.value === "create-con") {
      onCreateConSelected();
      setSelectedConnection(null);
      setConnectionSelected(false);
    } else if (option) {
      try {
        await axios.post(`${CHATBOT_CON_DETAILS_API_URL}/connection_details`, {
          connection: option.value,
        });
        setSelectedConnection(option.value.connectionName);
        setConnectionSelected(true);
      } catch (error) {
        console.error("Error fetching connection details:", error);
      }
    } else {
      setSelectedConnection(null);
      setConnectionSelected(false);
    }
  };

  const handleChangeConnection = () => {
    setConnectionSelected(false);
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!state.input.trim() || state.isLoading || !selectedConnection) return;
      dispatch({ type: "SET_SUBMITTING", payload: true });

      const userMessage: Message = {
        id: Date.now().toString(),
        content: state.input,
        isBot: false,
        timestamp: new Date().toISOString(),
      };

      const botLoadingMessage: Message = {
        id: `loading-${Date.now()}`,
        isBot: true,
        timestamp: new Date().toISOString(),
      };

      setLoadingMessageId(botLoadingMessage.id);

      messagesRef.current = [
        ...messagesRef.current,
        userMessage,
        botLoadingMessage,
      ];
      setMessages([...messagesRef.current]);
      dispatch({ type: "SET_INPUT", payload: "" });
      scrollToBottom();
      try {
        const response = await axios.post(`${CHATBOT_API_URL}/ask`, {
          question: state.input,
          connection: selectedConnection,
        });

        const botResponseMessage: Message = {
          id: Date.now().toString(),
          content: JSON.stringify(response.data, null, 2),
          isBot: true,
          timestamp: new Date().toISOString(),
        };

        messagesRef.current = messagesRef.current.map((msg) =>
          msg.id === botLoadingMessage.id ? botResponseMessage : msg
        );
      } catch (error) {
        console.error("Error getting bot response:", error);

        const errorMessage: Message = {
          id: Date.now().toString(),
          content: "Sorry, an error occurred. Please try again.",
          isBot: true,
          timestamp: new Date().toISOString(),
        };

        messagesRef.current = messagesRef.current.map((msg) =>
          msg.id === botLoadingMessage.id ? errorMessage : msg
        );
      } finally {
        setLoadingMessageId(null);
        setMessages([...messagesRef.current]);
        dispatch({ type: "SET_SUBMITTING", payload: false });
        saveMessages();
      }
    },
    [state.input, state.isLoading, selectedConnection, saveMessages]
  );
  const handleEditMessage = async (
    id: string,
    newContent: string,
    botResponse?: string
  ) => {
    const messageIndex = messagesRef.current.findIndex((msg) => msg.id === id);
    if (messageIndex === -1) return;

    messagesRef.current = messagesRef.current.map((msg) =>
      msg.id === id ? { ...msg, content: newContent } : msg
    );
    setMessages([...messagesRef.current]);

    const editedMessage = messagesRef.current[messageIndex];
    if (!editedMessage.isBot && selectedConnection) {
      const botLoadingMessage: Message = {
        id: `loading-${Date.now()}`,
        content: "loading...",
        isBot: true,
        timestamp: new Date().toISOString(),
      };

      setLoadingMessageId(botLoadingMessage.id);

      if (
        messageIndex + 1 < messagesRef.current.length &&
        messagesRef.current[messageIndex + 1].isBot
      ) {
        messagesRef.current[messageIndex + 1] = botLoadingMessage;
      } else {
        messagesRef.current.splice(messageIndex + 1, 0, botLoadingMessage);
      }
      setMessages([...messagesRef.current]);

      try {
        const response = await axios.post(`${CHATBOT_API_URL}/ask`, {
          question: newContent,
          connection: selectedConnection,
        });

        const botResponse = JSON.stringify(response.data, null, 2);

        if (messageIndex + 1 < messagesRef.current.length) {
          const botMessageId = messagesRef.current[messageIndex + 1].id;
          messagesRef.current = messagesRef.current.map((msg) =>
            msg.id === botMessageId ? { ...msg, content: botResponse } : msg
          );
        }
      } catch (error) {
        console.error("Error updating message:", error);

        const errorMessage: Message = {
          id: Date.now().toString(),
          content: "Sorry, an error occurred. Please try again.",
          isBot: true,
          timestamp: new Date().toISOString(),
        };

        messagesRef.current = messagesRef.current.map((msg) =>
          msg.id === botLoadingMessage.id ? errorMessage : msg
        );
      } finally {
        setLoadingMessageId(null);
        setMessages([...messagesRef.current]);
        saveMessages();
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-200 dark:bg-gray-900">
      <ToastContainer />
      <div className="p-4 flex items-center justify-between">
        {connectionSelected ? (
          <CurrentConnection
            connectionName={selectedConnection!}
            onChangeConnection={handleChangeConnection}
          />
        ) : (
          <ConnectionSelector
            connections={connections}
            onSelect={handleSelect}
            onCreateConSelected={onCreateConSelected}
          />
        )}
      </div>
      {connectionSelected && (
        <>
          <MessageList
            messages={messages}
            loadingMessageId={loadingMessageId}
            onEditMessage={handleEditMessage}
            onDeleteMessage={(id) => {
              messagesRef.current = messagesRef.current.filter(
                (msg) => msg.id !== id
              );
              setMessages([...messagesRef.current]);
              saveMessages();
            }}
            selectedConnection={selectedConnection}
            messagesEndRef={messagesEndRef}
          />
          <ChatInput
            input={state.input}
            isLoading={state.isLoading}
            onInputChange={(value) =>
              dispatch({ type: "SET_INPUT", payload: value })
            }
            isSubmitting={state.isSubmitting}
            onSubmit={handleSubmit}
          />
        </>
      )}
    </div>
  );
};

export default ChatInterface;
