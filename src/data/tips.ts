
export interface Tip {
  id: number;
  title: string;
  content: string;
  category: string;
  icon: string;
}

export const tips: Tip[] = [
  {
    id: 1,
    title: "Getting Started",
    content:
      "Welcome to Ask Your Data! Start by asking a question about your data in the chat interface.",
    category: "Welcome",
    icon: "home",
  },
  {
    id: 2,
    title: "Data Visualization",
    content:
      "Toggle between Graph, Table, and Query views to explore your data in different formats.",
    category: "Analysis",
    icon: "layout-dashboard",
  },
  {
    id: 3,
    title: "Export Results",
    content:
      "Need to save your results? Click the download button to export graphs as images or tables as XLSX files.",
    category: "Sharing",
    icon: "download",
  },
  {
    id: 4,
    title: "Query Reuse",
    content:
      "Copy SQL queries with a single click to use them in other tools or share with your team.",
    category: "Development",
    icon: "copy",
  },
  {
    id: 5,
    title: "Dark Mode",
    content:
      "Switch to dark mode in the Settings tab for a sleek, eye-friendly experience.",
    category: "Preferences",
    icon: "moon",
  },
  {
    id: 6,
    title: "Save Favorites",
    content:
      "Love a question? Click the heart icon to mark it as a favorite and access it later.",
    category: "Efficiency",
    icon: "heart",
  },
  {
    id: 7,
    title: "Favorite Access",
    content:
      "Check out your favorite questions in the Favourites tab to quickly re-ask them.",
    category: "Efficiency",
    icon: "bookmark",
  },
  {
    id: 8,
    title: "Smart Recommendations",
    content:
      "Asked a favorite question more than 5 times? It might appear as a recommended question on new chats!",
    category: "Intelligence",
    icon: "list-checks",
  },
  {
    id: 9,
    title: "Session History",
    content:
      "View all your past sessions in the History tab to revisit your data conversations.",
    category: "Organization",
    icon: "clock",
  },
  {
    id: 10,
    title: "Session Management",
    content:
      "Click a session in the History tab to see all chats and make it active for new questions.",
    category: "Organization",
    icon: "clock",
  },
  {
    id: 11,
    title: "Manage Favorites",
    content:
      "In the Favourites tab, delete a favorite to remove it from all related messages.",
    category: "Efficiency",
    icon: "trash2",
  },
  {
    id: 12,
    title: "Re-ask Questions",
    content:
      "Re-ask a favorite question by clicking it in the Favourites tab—it’ll start a new session or use the current one.",
    category: "Efficiency",
    icon: "bookmark",
  },
  {
    id: 13,
    title: "Customization",
    content:
      "Customize your experience by adjusting settings like theme or notifications in the Settings tab.",
    category: "Preferences",
    icon: "settings",
  },
  {
    id: 14,
    title: "Data Clarification",
    content:
      "Need help understanding your data? Ask detailed questions, and we’ll generate graphs or tables to clarify.",
    category: "Analysis",
    icon: "help-circle",
  },
  {
    id: 15,
    title: "Quick Navigation",
    content:
      "Use the sidebar to quickly navigate between Home, History, Favourites, and Settings.",
    category: "Navigation",
    icon: "home",
  },
  {
    id: 16,
    title: "New Connections",
    content:
      "Want to create a new data connection? Head to the Create Connection menu to link your data source.",
    category: "Integration",
    icon: "database",
  },
  {
    id: 17,
    title: "Manage Connections",
    content:
      "Review your existing data connections in the Existing Connections menu to manage them.",
    category: "Integration",
    icon: "git-branch",
  },
  {
    id: 18,
    title: "Session Organization",
    content:
      "Keep your chats organized—start a new session anytime by clicking “New Chat.”",
    category: "Organization",
    icon: "clock",
  },
  {
    id: 19,
    title: "Smart Suggestions",
    content:
      "Recommended questions appear when you start a new chat, based on your most-used favorites.",
    category: "Intelligence",
    icon: "list-checks",
  },
  {
    id: 20,
    title: "Light Mode",
    content:
      "Light mode more your style? Switch themes in Settings to find the perfect look.",
    category: "Preferences",
    icon: "sun",
  },
  {
    id: 21,
    title: "Quick Sharing",
    content:
      "Download a graph to share your insights in presentations or reports.",
    category: "Sharing",
    icon: "share2",
  },
  {
    id: 22,
    title: "Visual Exploration",
    content:
      "Explore your data visually—toggle to the Graph view for instant charts.",
    category: "Analysis",
    icon: "eye",
  },
  {
    id: 23,
    title: "Detailed Analysis",
    content:
      "Need to dive deeper? Toggle to the Table view for a detailed look at your data.",
    category: "Analysis",
    icon: "table",
  },
  {
    id: 24,
    title: "Continue Sessions",
    content:
      "Your active session is highlighted in the History tab—click to continue where you left off.",
    category: "Organization",
    icon: "clock",
  },
];

// Utility functions
export const getRandomTip = (): Tip => {
  const randomIndex = Math.floor(Math.random() * tips.length);
  return tips[randomIndex];
};

export const getTipById = (id: number): Tip | undefined => {
  return tips.find((tip) => tip.id === id);
};

export const getAllTips = (): Tip[] => [...tips];
