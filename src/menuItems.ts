import { MessageCircle, Home, History, Bookmark, Settings, HelpCircle, Link } from "lucide-react";

// ✅ Define menu items separately
export const menuItems = [
  { id: "home", icon: Home, label: "Home" },
  {id: "connections", icon: Link, label: "Connections"},
  { id: "new-chat", icon: MessageCircle, label: "New Chat" },
  { id: "history", icon: History, label: "History" },
  { id: "saved", icon: Bookmark, label: "Saved" },
  { id: "settings", icon: Settings, label: "Settings" },
  { id: "help", icon: HelpCircle, label: "Help" },
];
