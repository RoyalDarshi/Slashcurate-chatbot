import React, { useState } from "react";
import { useTheme } from "../ThemeContext";
import {
  Bell,
  PlusCircle,
  ArrowRightLeft,
  FileText,
  BarChart,
  DownloadCloud,
  Copy,
  History,
  Heart,
  Star,
  Search,
  Settings,
  Trash2,
  Edit2,
  HelpCircle,
  Menu,
  ChevronDown,
  X,
  BookOpen,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Database,
  Rocket,
  Info
} from "lucide-react";

interface HelpPageProps {
  onCreateConSelected: () => void;
  onNewChat: () => void;
}

const HelpPage: React.FC<HelpPageProps> = ({ onCreateConSelected, onNewChat }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { theme } = useTheme();

  const isDark = theme.mode === 'dark';

  const categoryDetails: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
    "getting-started": { label: "Getting Started", color: "#EC4899", bgColor: "rgba(236, 72, 153, 0.12)", icon: Sparkles },
    "connections": { label: "Connections", color: "#10B981", bgColor: "rgba(16, 185, 129, 0.12)", icon: Database },
    "queries": { label: "Chat & Queries", color: "#6366F1", bgColor: "rgba(99, 102, 241, 0.12)", icon: MessageSquare },
    "settings": { label: "System Settings", color: "#8B5CF6", bgColor: "rgba(139, 92, 246, 0.12)", icon: Settings },
  };

  const featureIcons: Record<string, React.ReactNode> = {
    notification: <Bell className="h-4 w-4" />,
    connectionCreate: <PlusCircle className="h-4 w-4" />,
    connectionSwitch: <ArrowRightLeft className="h-4 w-4" />,
    query: <FileText className="h-4 w-4" />,
    results: <BarChart className="h-4 w-4" />,
    download: <DownloadCloud className="h-4 w-4" />,
    sql: <Copy className="h-4 w-4" />,
    sessionNew: <PlusCircle className="h-4 w-4" />,
    history: <History className="h-4 w-4" />,
    favorite: <Heart className="h-4 w-4" />,
    recommendation: <Star className="h-4 w-4" />,
    tableSearch: <Search className="h-4 w-4" />,
    settings: <Settings className="h-4 w-4" />,
    connectionManage: <Trash2 className="h-4 w-4" />,
    renameSession: <Edit2 className="h-4 w-4" />,
    help: <HelpCircle className="h-4 w-4" />,
    closeSidebar: <Menu className="h-4 w-4" />,
  };

  const faqs = [
    {
      question: "Tips of the Day Notification",
      answer: "After login, a 'Tip of the Day' pops up. You can disable or re-enable it anytime from Settings > Notifications.",
      category: "notification",
      categoryGroup: "getting-started",
      solution: [
        "Go to Settings > Notifications",
        "Toggle 'Tip of the Day' on or off",
      ],
    },
    {
      question: "Creating a Connection",
      answer: "Navigate to the 'Create Connection' tab, enter your database details, test, and save to establish a new connection.",
      category: "connectionCreate",
      categoryGroup: "connections",
      tips: [
        "Provide a unique connection name",
        "Test connection before saving",
      ],
      cta: "Create Connection",
      fn: onCreateConSelected,
    },
    {
      question: "Switching Between Connections",
      answer: "Use the connection dropdown on the Home page to switch the active connection before asking questions.",
      category: "connectionSwitch",
      categoryGroup: "connections",
      tips: [
        "Only one connection can be active at a time",
        "Switch back any time to run queries on another DB",
      ],
    },
    {
      question: "Asking Natural Language Questions",
      answer: "Type your question about the data in human language. Our AI generates SQL and fetches results from the selected database.",
      category: "query",
      categoryGroup: "queries",
      tips: [
        "Be specific: e.g., 'Show monthly sales by region'",
        "Include filters like date ranges",
      ],
    },
    {
      question: "Viewing Results",
      answer: "Results appear as interactive graphs by default. Switch to table view or SQL view to inspect raw data or the generated query.",
      category: "results",
      categoryGroup: "queries",
      preview: ["Graph View", "Table View", "SQL Query"],
    },
    {
      question: "Downloading Results",
      answer: "Download graphs as PNG or tables as XLSX using the download icons in the result pane.",
      category: "download",
      categoryGroup: "queries",
      tips: [
        "Click the download icon in graph view to download draph as PNG",
        "Click the download button in table view to download graph as XLSX",
      ],
    },
    {
      question: "Viewing & Copying SQL Queries",
      answer: "Click on shoq Query button to see the exact query. Use the copy icon to copy it to your clipboard for advanced use.",
      category: "sql",
      categoryGroup: "queries",
      solution: ["Goto Query view", "Click copy icon to copy query"],
    },
    {
      question: "Starting a New Chat Session",
      answer: "Click 'New Chat' to begin a fresh session. Each session has its own chat history and favorites.",
      category: "sessionNew",
      categoryGroup: "getting-started",
      cta: "New Chat",
      fn: onNewChat,
    },
    {
      question: "Session History",
      answer: "View past sessions under History, organized by Today, Yesterday, Last 7 Days, and Last 1 Month.",
      category: "history",
      categoryGroup: "queries",
      preview: ["Search history", "Rename/Delete sessions"],
    },
    {
      question: "Favoriting Questions",
      answer: "Click the heart icon on messages to save queries and SQL for quick access in Favorites.",
      category: "favorite",
      categoryGroup: "queries",
      preview: ["Run in current session", "Run in new session"],
    },
    {
      question: "Recommendations",
      answer: "Frequently favorited (5+ times) questions appear as Recommendations at login or when starting a new session.",
      category: "recommendation",
      categoryGroup: "getting-started",
    },
    {
      question: "Searching Table Data",
      answer: "Use the search bar in table view to filter rows and find specific records quickly.",
      category: "tableSearch",
      categoryGroup: "queries",
    },
    {
      question: "Customizing Settings",
      answer: "In Settings, change text size, switch Light/Dark theme, and manage notifications.",
      category: "settings",
      categoryGroup: "settings",
      solution: [
        "Toggle Light/Dark theme",
        "Adjust text size",
        "Enable/disable notifications",
      ],
    },
    {
      question: "Managing Connections",
      answer: "View all created connections in Existing Connections. Delete non-admin connections here.",
      category: "connectionManage",
      categoryGroup: "connections",
      tips: [
        "Admin-created connections cannot be deleted",
        "Delete stale connections to clean up",
      ],
    },
    {
      question: "Closing Sidebar",
      answer: "Click the menu icon to collapse or expand the sidebar and increase chat area space.",
      category: "closeSidebar",
      categoryGroup: "settings",
    },
    {
      question: "Renaming Sessions",
      answer: "In History, click the edit icon next to a session to rename it for easier retrieval.",
      category: "renameSession",
      categoryGroup: "queries",
    },
    {
      question: "Help & FAQs",
      answer: "Find all FAQs here under the Help tab. Contact support if you need further assistance.",
      category: "help",
      categoryGroup: "getting-started",
      cta: "Contact Support",
    },
  ];

  const categories = [
    { id: "all", label: "All Guides", icon: BookOpen },
    { id: "getting-started", label: "Getting Started", icon: Sparkles },
    { id: "connections", label: "Connections", icon: Database },
    { id: "queries", label: "Chat & Queries", icon: MessageSquare },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = 
      selectedCategory === "all" || faq.categoryGroup === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div
      className="p-6 h-full overflow-y-auto"
      style={{
        backgroundColor: theme.colors.background,
      }}
    >
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Modern Hero Search Banner */}
        <div 
          className="relative overflow-hidden rounded-3xl p-8 md:p-12 border shadow-sm flex flex-col items-center text-center gap-4 transition-all duration-300"
          style={{
            backgroundImage: isDark
              ? 'radial-gradient(circle at center, rgba(99, 102, 241, 0.12) 0%, rgba(19, 28, 46, 0.2) 100%)'
              : 'radial-gradient(circle at center, rgba(79, 70, 229, 0.06) 0%, rgba(241, 245, 249, 0.2) 100%)',
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          }}
        >
          {/* Subtle floating glow dots */}
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full blur-[80px]" style={{ backgroundColor: `${theme.colors.accent}15` }} />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-[80px]" style={{ backgroundColor: `${theme.colors.accent}10` }} />

          <div 
            className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
            style={{ 
              backgroundColor: `${theme.colors.accent}12`,
              color: theme.colors.accent
            }}
          >
            <BookOpen size={14} />
            TalkToData Knowledge Base
          </div>

          <h1 
            className="text-3xl md:text-4xl font-extrabold tracking-tight"
            style={{ color: theme.colors.text }}
          >
            How can we help you today?
          </h1>

          <p 
            className="text-sm max-w-lg leading-relaxed"
            style={{ color: theme.colors.textSecondary }}
          >
            Search our user manuals, diagnostic steps, database connection setup instructions, and conversational interface guides.
          </p>

          {/* Search Box Input */}
          <div className="relative w-full max-w-xl mt-4 select-none">
            <Search 
              className="absolute left-4 top-1/2 -translate-y-1/2"
              size={18}
              style={{ color: theme.colors.textSecondary }}
            />
            <input
              type="text"
              placeholder="Search help articles, diagnostics, shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-2xl border text-sm transition-all focus:outline-hidden"
              style={{
                backgroundColor: isDark ? 'rgba(9, 13, 22, 0.5)' : '#FFFFFF',
                borderColor: theme.colors.border,
                color: theme.colors.text,
                boxShadow: `0 4px 12px ${isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)'}`,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = theme.colors.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = theme.colors.border)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                style={{ color: theme.colors.textSecondary }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Categorized Segment Switcher tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 -mx-2 px-2 select-none">
          {categories.map((cat) => {
            const IconComp = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setOpenIndex(null); // Close accordions on filter switch
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 border"
                style={{
                  backgroundColor: isSelected ? theme.colors.accent : theme.colors.surface,
                  color: isSelected ? "#FFFFFF" : theme.colors.textSecondary,
                  borderColor: isSelected ? theme.colors.accent : theme.colors.border,
                  boxShadow: isSelected ? `0 4px 12px ${theme.colors.accent}40` : theme.shadow.xs,
                }}
              >
                <IconComp size={14} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Help Cards List Grid */}
        {filteredFaqs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredFaqs.map((faq, idx) => {
              const catInfo = categoryDetails[faq.categoryGroup] || { label: "General", color: theme.colors.accent, bgColor: `${theme.colors.accent}15`, icon: Info };
              const CatIcon = catInfo.icon;
              const isExpanded = openIndex === idx;

              return (
                <div
                  key={idx}
                  className="rounded-3xl border transition-all duration-300 flex flex-col p-6 cursor-pointer group shadow-xs hover:shadow-md select-none"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: isExpanded ? theme.colors.accent : theme.colors.border,
                    transform: isExpanded ? 'scale(1.01)' : 'none',
                  }}
                  onClick={() => setOpenIndex(isExpanded ? null : idx)}
                >
                  {/* Card Header row: Category Badge & Chevron */}
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <span 
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
                      style={{
                        backgroundColor: catInfo.bgColor,
                        color: catInfo.color,
                      }}
                    >
                      <CatIcon size={11} />
                      {catInfo.label}
                    </span>

                    <div 
                      className="p-1 rounded-full border transition-all"
                      style={{ 
                        borderColor: isExpanded ? theme.colors.accent : theme.colors.border,
                        color: isExpanded ? theme.colors.accent : theme.colors.textSecondary,
                        transform: isExpanded ? 'rotate(180deg)' : 'none',
                      }}
                    >
                      <ChevronDown size={14} />
                    </div>
                  </div>

                  {/* Title & Short description preview */}
                  <div className="space-y-2">
                    <h3 
                      className="text-base font-bold tracking-tight transition-colors"
                      style={{ color: isExpanded ? theme.colors.accent : theme.colors.text }}
                    >
                      {faq.question}
                    </h3>
                    
                    {!isExpanded && (
                      <p 
                        className="text-xs leading-relaxed line-clamp-2"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        {faq.answer}
                      </p>
                    )}
                  </div>

                  {/* Expanded Content Panel */}
                  {isExpanded && (
                    <div 
                      className="mt-4 pt-4 border-t space-y-4 animate-fade-in"
                      style={{ borderColor: theme.colors.border }}
                      onClick={(e) => e.stopPropagation()} // Stop accordion click
                    >
                      <p 
                        className="text-xs leading-relaxed"
                        style={{ color: theme.colors.text }}
                      >
                        {faq.answer}
                      </p>

                      {/* Solutions blocks */}
                      {faq.solution && (
                        <div 
                          className="p-4 rounded-2xl space-y-2.5 border border-dashed"
                          style={{ 
                            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.04)' : 'rgba(79, 70, 229, 0.02)',
                            borderColor: `${theme.colors.accent}20`
                          }}
                        >
                          <div 
                            className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                            style={{ color: theme.colors.accent }}
                          >
                            <ArrowRight size={12} />
                            Action Steps
                          </div>
                          <ul className="space-y-1.5">
                            {faq.solution.map((sol, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
                                <span style={{ color: theme.colors.textSecondary }}>{sol}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Tips Blocks */}
                      {faq.tips && (
                        <div 
                          className="p-4 rounded-2xl space-y-2.5 border-l-2"
                          style={{ 
                            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.04)' : 'rgba(16, 185, 129, 0.02)',
                            borderLeftColor: '#10B981',
                          }}
                        >
                          <div 
                            className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                            style={{ color: '#10B981' }}
                          >
                            <Info size={12} />
                            Tips & Guidelines
                          </div>
                          <ul className="space-y-1.5">
                            {faq.tips.map((tip, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span style={{ color: theme.colors.textSecondary }}>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Previews / Features lists */}
                      {faq.preview && (
                        <div className="space-y-2">
                          <div 
                            className="text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            Available Actions
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {faq.preview.map((prev, i) => (
                              <span 
                                key={i}
                                className="px-2 py-0.5 rounded-md text-[10px] font-medium"
                                style={{
                                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                                  color: theme.colors.textSecondary,
                                }}
                              >
                                {prev}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action buttons (CTAs) */}
                      {faq.cta && (
                        <button
                          onClick={() => {
                            if (faq.fn) faq.fn();
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold text-white transition-all shadow-xs"
                          style={{
                            background: theme.gradients.primary,
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.filter = "brightness(1.05)")}
                          onMouseOut={(e) => (e.currentTarget.style.filter = "none")}
                        >
                          <span>{faq.cta}</span>
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty Search results state */
          <div 
            className="p-12 text-center rounded-3xl border flex flex-col items-center justify-center gap-3"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }}
          >
            <div className="p-4 rounded-full" style={{ backgroundColor: `${theme.colors.accent}12` }}>
              <HelpCircle size={32} style={{ color: theme.colors.accent }} />
            </div>
            <h3 
              className="text-lg font-bold"
              style={{ color: theme.colors.text }}
            >
              No articles found
            </h3>
            <p 
              className="text-xs max-w-xs leading-relaxed"
              style={{ color: theme.colors.textSecondary }}
            >
              We couldn't find any guides matching "{searchQuery}". Try using different keywords or filter by category group.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpPage;
