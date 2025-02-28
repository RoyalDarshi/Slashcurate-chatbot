import React, {
  useReducer,
  useRef,
  useEffect,
  useCallback,
  useState,
} from "react";
import axios from "axios";
import ChatMessage from "./ChatMessage";
import { Message } from "../types";
import ChatInput from "./ChatInput";
import {
  CHATBOT_API_URL,
  API_URL,
  CHATBOT_CON_DETAILS_API_URL,
} from "../config";
import { ToastContainer, toast } from "react-toastify";
import Select from "react-select";

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

interface Connection {
  connectionName: string;
  value: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onCreateConSelected,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const messagesRef = useRef<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const forceUpdate = useReducer(() => ({}), {})[1];
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(
    null
  );
  const [connectionSelected, setConnectionSelected] = useState(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messagesRef.current.length, scrollToBottom]);

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

  const handleSelect = async (
    option:
      | { value: Connection; label: string }
      | { value: { connectionName: string }; label: string }
      | { value: string; label: string }
      | null
  ) => {
    if (option && option.value === "create-con") {
      onCreateConSelected();
      setSelectedConnection(null);
      setConnectionSelected(false);
    } else if (option) {
      console.log(option.value);

      const response = await axios.post(
        `${CHATBOT_CON_DETAILS_API_URL}/connection_details`,
        {
          connection: option.value,
        }
      );
      console.log(response.data);
      setSelectedConnection(option.value.connectionName);
      setConnectionSelected(true);
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
  const options = [
    { value: "create-con", label: "Create Connection" },
    ...connections.map((connection) => ({
      value: connection,
      label: connection.connectionName,
    })),
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-100 dark:bg-gray-800">
      <ToastContainer />
      <div className="p-4 flex items-center justify-between">
        {connectionSelected ? (
          <div className="flex items-center">
            <span className="font-semibold text-lg mr-2">
              Current Connection:
            </span>
            <span className="text-lg">{selectedConnection}</span>
            <button
              className="ml-2 px-3 py-1 text-xs text-red-600 border border-red-600 rounded-full hover:bg-red-100"
              onClick={handleChangeConnection}
            >
              Edit
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <label
              htmlFor="connectionSelect"
              className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Select Connection:
            </label>
            <div className="w-64">
              <Select
                options={options}
                onChange={handleSelect}
                isClearable
                placeholder="Select a connection"
                styles={{
                  control: (provided) => ({
                    ...provided,
                    border: "1px solid #d1d5db",
                    boxShadow: "none",
                    "&:hover": {
                      borderColor: "#9ca3af",
                    },
                  }),
                }}
              />
            </div>
          </div>
        )}
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
            onInputChange={(value) =>
              dispatch({ type: "SET_INPUT", payload: value })
            }
            onSubmit={handleSubmit}
          />
        </>
      )}
    </div>
  );
};

export default ChatInterface;
