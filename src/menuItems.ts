// menuItems.ts
import {
  Home,
  History,
  Settings,
  HelpCircle,
  Link,
  Heart,
  PlusCircle,
  LogOut,
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType; // Icon as React component
  subMenu?: MenuItem[];
}

export const menuItems: MenuItem[] = [
  { id: "home", icon: Home, label: "Home" },
  // {
  //   id: "connections",
  //   icon: Link,
  //   label: "Connections",
  //   subMenu: [
  //     { id: "new-connection", label: "New Connection", icon: PlusCircle },
  //     { id: "existing-connection", label: "Existing Connection", icon: Link },
  //   ],
  // },
  { id: "new-connection", label: "Create Connection", icon: PlusCircle },
  { id: "existing-connection", label: "Existing Connection", icon: Link },
  // { id: "new-chat", icon: MessageCircle, label: "New Chat" },
  { id: "history", icon: History, label: "History" },
  { id: "favourite", icon: Heart, label: "Favourite" },
  { id: "settings", icon: Settings, label: "Settings" },
  { id: "help", icon: HelpCircle, label: "Help" },
  { id: "logout", icon: LogOut, label: "Logout" },
];
