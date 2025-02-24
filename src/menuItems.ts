import {
  MessageCircle,
  Home,
  History,
  Settings,
  HelpCircle,
  Link,
  Heart,
} from "lucide-react";

// ✅ Define menu items separately
export const menuItems = [
  { id: "home", icon: Home, label: "Home" },
  { id: "connections", icon: Link, label: "Connections" },
  { id: "new-chat", icon: MessageCircle, label: "New Chat" },
  { id: "history", icon: History, label: "History" },
  { id: "saved", icon: Heart, label: "Favourite" },
  { id: "settings", icon: Settings, label: "Settings" },
  { id: "help", icon: HelpCircle, label: "Help" },
];
