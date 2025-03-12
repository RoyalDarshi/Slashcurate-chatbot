import { ReactNode } from "react";

export interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: string;
}

export interface Connection {
  connectionName: string;
  value: string;
}

// Chat Interface Types
export interface ChatInterfaceProps {
  onCreateConSelected: () => void;
}

export interface ChatState {
  isLoading: boolean;
  input: string;
  isSubmitting: boolean;
}

export type ChatAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_INPUT"; payload: string }
  | { type: "SET_SUBMITTING"; payload: boolean };

// Message List Types
export interface MessageListProps {
  messages: Message[];
  loadingMessageId: string | null;
  onEditMessage: (id: string, content: string, botResponse?: string) => void;
  onDeleteMessage: (id: string) => void;
  selectedConnection: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

// Chat Message Types
export interface ChatMessageProps {
  message: Message;
  loading: boolean;
  onEditMessage: (id: string, newContent: string, botResponse?: string) => void;
  onDeleteMessage: (id: string) => void;
  selectedConnection: string | null;
}

// Chat Input Types
export interface ChatInputProps {
  input: string;
  isLoading: boolean;
  isSubmitting: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

// Connection Selector Types
export interface ConnectionSelectorProps {
  connections: Connection[];
  onSelect: (option: any) => void;
  onCreateConSelected: () => void;
}

// Current Connection Types
export interface CurrentConnectionProps {
  connectionName: string;
  onChangeConnection: () => void;
}

// Editable Message Types
export interface EditableMessageProps {
  messageContent: string;
  isUpdating: boolean;
  hasChanges: boolean;
  formattedTime: string;
  onSave: () => void;
  onCancel: () => void;
  onContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export interface MarkdownComponentProps {
  node?: any;
  children?: React.ReactNode;
  [key: string]: any;
}

// DataTable Types
export interface DataTableProps {
  data: any;
  darkMode?: boolean;
}

export interface TableColumn {
  id: string;
  header: React.ReactNode;
  cell: (info: any) => React.ReactNode;
  sortingFn?: string;
}

export interface TableHeaderProps {
  column: any;
  header: string;
}
