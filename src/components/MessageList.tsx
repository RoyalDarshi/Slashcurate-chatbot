import React from 'react';
import ChatMessage from './ChatMessage';
import { MessageListProps } from '../types';

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  loadingMessageId,
  onEditMessage,
  onDeleteMessage,
  selectedConnection,
  messagesEndRef,
}) => {
  // ...component logic
  return (
    <div className="flex-1 overflow-y-auto px-4">
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          loading={message.id === loadingMessageId}
          onEditMessage={onEditMessage}
          onDeleteMessage={onDeleteMessage}
          selectedConnection={selectedConnection}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};