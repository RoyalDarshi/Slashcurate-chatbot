import React, { createContext, useState, useContext, ReactNode } from "react";

interface MessageContextType {
  messageUpdated: number;
  notifyMessageUpdate: () => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [messageUpdated, setMessageUpdated] = useState(0);

  const notifyMessageUpdate = () => {
    setMessageUpdated((prev) => prev + 1);
  };

  return (
    <MessageContext.Provider value={{ messageUpdated, notifyMessageUpdate }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessageContext = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("useMessageContext must be used within a MessageProvider");
  }
  return context;
};
