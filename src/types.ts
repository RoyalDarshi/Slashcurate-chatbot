

export interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: string;
}

export interface Connection {
  connectionName: string;
  value: string;
  isAdmin: boolean;
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
  connections: Connection[];
  selectedConnection: string | null;
  onSelect: (option: any) => void;
  onNewChat: () => void; // New prop
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


export interface Theme {
  colors: {
    // Core UI Colors
    background: string; // App background
    surface: string; // Chat container, cards, input areas
    text: string; // Primary text
    textSecondary: string; // Subtle text (timestamps, placeholders)
    accent: string; // Buttons, links, highlights
    accentHover: string; // Hover state for accent
    success: string; // Success messages or indicators
    error: string; // Error messages or indicators
    warning: string; // Warning states
    border: string; // Dividers, borders

    // Chat-Specific Colors
    bubbleUser: string; // User message background
    bubbleBot: string; // Bot message background
    bubbleUserText: string; // User message text
    bubbleBotText: string; // Bot message text

    // Interactive States
    hover: string; // General hover background
    disabled: string; // Disabled elements background
    disabledText: string; // Disabled elements text
  };
  spacing: {
    xs: string; // Extra small spacing (padding/margin)
    sm: string; // Small spacing
    md: string; // Medium spacing
    lg: string; // Large spacing
    xl: string; // Extra large spacing
  };
  typography: {
    fontFamily: string; // Primary font stack
    size: {
      xs: string; // Extra small text (e.g., fine print)
      sm: string; // Small text (e.g., timestamps)
      base: string; // Default text size
      lg: string; // Larger text (e.g., headings)
    };
    weight: {
      normal: string; // Normal font weight
      medium: string; // Medium font weight
      bold: string; // Bold font weight
    };
  };
  borderRadius: {
    none: string; // No radius
    default: string; // Standard radius (buttons, cards)
    large: string; // Larger radius (modals, containers)
    pill: string; // Fully rounded (pills, circular buttons)
  };
  shadow: {
    none: string; // No shadow
    sm: string; // Subtle shadow (inputs, buttons)
    md: string; // Medium shadow (cards, elevated elements)
    lg: string; // Large shadow (popups, modals)
  };
  transition: {
    default: string; // Default transition timing (e.g., hover effects)
  };
}