

export interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: string;
  isFavorited: boolean;
  sql_query?: string;
  reaction?: string | null;
  dislike_reason?: string | null;
  parentId: string | null;
}

export interface Connection {
  connectionName: string;
  value: string;
  isAdmin: boolean;
}

export interface DatabaseTable {
  name: string;
  columns: string[];
}

export interface DatabaseSchema {
  name: string;
  tables: DatabaseTable[];
}

export interface ChatInputProps {
  input: string;
  isSubmitting: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  connections: Connection[];
  selectedConnection: string | null;
  onSelect: (option: any) => void;
  disabled: boolean;
  onNewChat: () => void;
}

export interface ChatMessageProps {
  message: Message;
  loading: boolean;
  onEditMessage: (id: string, newContent: string) => void;
  selectedConnection: string | null;
  onFavorite: (messageId: string) => void;
  onUnfavorite: (messageId: string) => void;
  isFavorited: boolean;
  responseStatus: "loading" | "success" | "error" | null;
  disabled: boolean;
  onRetry?: (userMessageId: string) => void;
}

export interface ChatInterfaceProps {
  onCreateConSelected: () => void;
  onSessionSelected?: (session: any) => void;
  initialQuestion?: { text: string; connection: string; query?: string } | null;
  onQuestionAsked?: () => void;
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

    // New properties for bar graph
    barColors: string[]; // Array of colors for bars
    surfaceGlass: string; // Glassmorphism effect color
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
    xs: string; //
    sm: string; // Subtle shadow (inputs, buttons)
    md: string; // Medium shadow (cards, elevated elements)
    lg: string; // Large shadow (popups, modals)
    xl: string; //
  };
  transition: {
    default: string; // Default transition timing (e.g., hover effects)
  };
  // New gradients property
  gradients: {
    primary: string;
    surface: string;
    glass: string;
  };
}


export interface ColumnInfo {
  name: string;
  type: string;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  sampleData?: Record<string, any>[];
}

export interface DatabaseSchema {
  name: string;
  tables: TableInfo[];
}