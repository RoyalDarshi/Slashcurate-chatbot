import { useState, useEffect, useCallback, useReducer, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_URL } from "./config";
import { Connection, Message } from "./types";
import { getUserConnections, getRecommendedQuestions } from "./api";


// Messages Reducer
type MessagesAction =
  | { type: "SET_MESSAGES"; messages: Message[] }
  | { type: "ADD_MESSAGE"; message: Message }
  | { type: "UPDATE_MESSAGE"; id: string; message: Partial<Message> }
  | { type: "REMOVE_MESSAGE"; id: string }
  | { type: "REPLACE_MESSAGE_ID"; oldId: string; newId: string };

export const messagesReducer = (
  state: Message[],
  action: MessagesAction
): Message[] => {
  const { oldId, newId } = action as {
    oldId: string;
    newId: string;
  };
  switch (action.type) {
    case "SET_MESSAGES":
      return action.messages;

    case "ADD_MESSAGE":
      return [...state, action.message];

    case "UPDATE_MESSAGE":
      return state.map((msg) =>
        msg.id === action.id ? { ...msg, ...action.message } : msg
      );

    case "REMOVE_MESSAGE":
      // Remove a placeholder or message by ID
      return state.filter((msg) => msg.id !== action.id);

    case "REPLACE_MESSAGE_ID":
      return state.map((msg) => {
        if (msg.id === oldId) {
          // Rename the message itself
          return { ...msg, id: newId };
        }
        if (msg.parentId === oldId) {
          // Fix any parent-child reference
          return { ...msg, parentId: newId };
        }
        return msg;
      });

    default:
      return state;
  }
};

// Hook for managing connections
export function useConnections(token: string) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(
    localStorage.getItem("selectedConnection") || null
  );
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionsLoading, setConnectionsLoading] = useState(true);

  useEffect(() => {
    const fetchConnections = async () => {
      setConnectionsLoading(true);
      if (!token) {
        toast.error("User ID not found. Please log in again.");
        setConnectionsLoading(false);
        return;
      }
      try {
        const response = await getUserConnections(token);
        setConnections(response.data.connections);
        if (response.data.connections.length === 0) {
          setSelectedConnection(null);
          localStorage.removeItem("selectedConnection");
        } else {
          const storedConnection = localStorage.getItem("selectedConnection");
          const defaultConnection =
            response.data.connections.find(
              (conn: Connection) => conn.connectionName === storedConnection
            ) || response.data.connections[0];
          setSelectedConnection(defaultConnection?.connectionName || null);
          localStorage.setItem(
            "selectedConnection",
            defaultConnection?.connectionName || ""
          );
        }
        setConnectionError(null);
      } catch (error) {
        console.error("Error fetching connections:", error);
        setConnectionError("Failed to make connection. Please try again.");
        setSelectedConnection(null);
      } finally {
        setConnectionsLoading(false);
      }
    };
    fetchConnections();
  }, [token]);

  return {
    connections,
    selectedConnection,
    setSelectedConnection,
    connectionError,
    connectionsLoading,
  };
}

interface SessionState {
  sessionId: string | null;
  messages: Message[];
  sessionConnection: string | null;
}

type SessionAction =
  | {
      type: "SET_SESSION";
      sessionId: string;
      messages: Message[];
      connection: string | null;
    }
  | { type: "CLEAR_SESSION" }
  | { type: "ADD_MESSAGE"; message: Message }
  | { type: "UPDATE_MESSAGE"; id: string; message: Partial<Message> };

  const sessionReducer = (
    state: SessionState,
    action: SessionAction
  ): SessionState => {
    switch (action.type) {
      case "SET_SESSION":
        console.log(
          "Setting session: ID=",
          action.sessionId,
          "Messages=",
          action.messages.length,
          "Connection=",
          action.connection
        );
        return {
          sessionId: action.sessionId,
          messages: action.messages,
          sessionConnection: action.connection,
        };
      case "CLEAR_SESSION":
        console.log(
          "Clearing session: Resetting sessionId, messages, and connection"
        );
        return {
          sessionId: null,
          messages: [],
          sessionConnection: null,
        };
      case "ADD_MESSAGE":
        console.log(
          "Adding message:",
          action.message.id,
          action.message.content
        );
        return {
          ...state,
          messages: [...state.messages, action.message],
        };
      case "UPDATE_MESSAGE":
        console.log("Updating message:", action.id, action.message);
        return {
          ...state,
          messages: state.messages.map((msg) =>
            msg.id === action.id ? { ...msg, ...action.message } : msg
          ),
        };
      default:
        return state;
    }
  };

  export const useSession = (token: string) => {
    const [state, dispatch] = useReducer(sessionReducer, {
      sessionId: null,
      messages: [],
      sessionConnection: null,
    });

    const loadSession = useCallback(
      async (sessionId: string) => {
        try {
          console.log("Fetching session:", sessionId);
          const response = await axios.get(
            `${API_URL}/api/sessions/${sessionId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const { messages, connection } = response.data;
          console.log("Session fetched, messages:", messages.length);
          dispatch({
            type: "SET_SESSION",
            sessionId,
            messages: messages.map((msg: any) => ({
              id: msg.id,
              content: msg.content,
              isBot: msg.isBot,
              timestamp: msg.timestamp,
              isFavorited: msg.isFavorited,
              parentId: msg.parentId,
              reaction: msg.reaction,
              dislike_reason: msg.dislike_reason,
            })),
            connection,
          });
        } catch (error) {
          console.error("Error loading session:", error);
          dispatch({ type: "CLEAR_SESSION" });
          console.log("Session load failed, cleared session state");
        }
      },
      [token]
    );

    const clearSession = useCallback(() => {
      console.log("Clearing session, resetting messages and sessionId");
      dispatch({ type: "CLEAR_SESSION" });
      localStorage.removeItem("currentSessionId");
    }, []);

    return {
      sessionId: state.sessionId,
      messages: state.messages,
      sessionConnection: state.sessionConnection,
      loadSession,
      clearSession,
      dispatchMessages: dispatch,
    };
  };

// Hook for fetching recommended questions
export function useRecommendedQuestions(
  token: string,
  currentSessionId: string | null
) {
  const [recommendedQuestions, setRecommendedQuestions] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecQuestions = async () => {
      if (token && !currentSessionId) {
        try {
          const data = await getRecommendedQuestions(token);
          setRecommendedQuestions(data);
        } catch (error) {
          console.error("Failed to fetch recommended questions:", error);
        }
      }
    };
    fetchRecQuestions();
  }, [token, currentSessionId]);

  return recommendedQuestions;
}

// Hook for managing scroll behavior
export function useChatScroll() {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const scrollToMessage = useCallback((messageId: string) => {
    const messageRef = messageRefs.current[messageId];
    if (messageRef)
      messageRef.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!chatContainerRef.current) return;
      const { scrollTop, clientHeight, scrollHeight } =
        chatContainerRef.current;
      setUserHasScrolledUp(scrollTop + clientHeight < scrollHeight - 10);
    };
    const chatContainer = chatContainerRef.current;
    if (chatContainer) chatContainer.addEventListener("scroll", handleScroll);
    return () => chatContainer?.removeEventListener("scroll", handleScroll);
  }, []);

  return {
    chatContainerRef,
    messagesEndRef,
    messageRefs,
    scrollToBottom,
    scrollToMessage,
    userHasScrolledUp,
  };
}
