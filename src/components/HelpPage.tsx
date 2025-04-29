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
} from "lucide-react";
import { ChevronDown } from "lucide-react";

interface HelpPageProps {
  onCreateConSelected: () => void;
  onNewChat: () => void;
}

const HelpPage: React.FC<HelpPageProps> = ({onCreateConSelected,onNewChat}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { theme } = useTheme();

  const featureIcons: Record<string, React.ReactNode> = {
    notification: <Bell className="icon" />,
    connectionCreate: <PlusCircle className="icon" />,
    connectionSwitch: <ArrowRightLeft className="icon" />,
    query: <FileText className="icon" />,
    results: <BarChart className="icon" />,
    download: <DownloadCloud className="icon" />,
    sql: <Copy className="icon" />,
    sessionNew: <PlusCircle className="icon" />,
    history: <History className="icon" />,
    favorite: <Heart className="icon" />,
    recommendation: <Star className="icon" />,
    tableSearch: <Search className="icon" />,
    settings: <Settings className="icon" />,
    connectionManage: <Trash2 className="icon" />,
    renameSession: <Edit2 className="icon" />,
    help: <HelpCircle className="icon" />,
    closeSidebar: <Menu className="icon" />,
  };

  const faqs = [
    {
      question: "🔔 Tips of the Day Notification",
      answer:
        "After login, a 'Tip of the Day' pops up. You can disable or re-enable it anytime from Settings > Notifications.",
      category: "notification",
      solution: [
        "Go to Settings > Notifications",
        "Toggle 'Tip of the Day' on or off",
      ],
    },
    {
      question: "➕ Creating a Connection",
      answer:
        "Navigate to the 'Create Connection' tab, enter your database details, test, and save to establish a new connection.",
      category: "connectionCreate",
      tips: [
        "Provide a unique connection name",
        "Test connection before saving",
      ],
      cta: "Create Connection",
      fn: onCreateConSelected,
    },
    {
      question: "🔄 Switching Between Connections",
      answer:
        "Use the connection dropdown on the Home page to switch the active connection before asking questions.",
      category: "connectionSwitch",
      tips: [
        "Only one connection can be active at a time",
        "Switch back any time to run queries on another DB",
      ],
    },
    {
      question: "🗣️ Asking Natural Language Questions",
      answer:
        "Type your question about the data in human language. Our AI generates SQL and fetches results from the selected database.",
      category: "query",
      tips: [
        "Be specific: e.g., 'Show monthly sales by region'",
        "Include filters like date ranges",
      ],
    },
    {
      question: "📊 Viewing Results",
      answer:
        "Results appear as interactive graphs by default. Switch to table view or SQL view to inspect raw data or the generated query.",
      category: "results",
      preview: ["Graph View", "Table View", "SQL Query"],
    },
    {
      question: "📥 Downloading Results",
      answer:
        "Download graphs as PNG or tables as XLSX using the download icons in the result pane.",
      category: "download",
      tips: [
        "Click the download icon in graph view to download draph as PNG",
        "Click the download button in table view to download graph as XLSX",
      ],
    },
    {
      question: "💻 Viewing & Copying SQL Queries",
      answer:
        "Click on shoq Query button to see the exact query. Use the copy icon to copy it to your clipboard for advanced use.",
      category: "sql",
      solution: ["Goto Query view", "Click copy icon to copy query"],
    },
    {
      question: "🆕 Starting a New Chat Session",
      answer:
        "Click 'New Chat' to begin a fresh session. Each session has its own chat history and favorites.",
      category: "sessionNew",
      cta: "New Chat",
      fn: onNewChat,
    },
    {
      question: "📜 Session History",
      answer:
        "View past sessions under History, organized by Today, Yesterday, Last 7 Days, and Last 1 Month.",
      category: "history",
      preview: ["Search history", "Rename/Delete sessions"],
    },
    {
      question: "❤️ Favoriting Questions",
      answer:
        "Click the heart icon on messages to save queries and SQL for quick access in Favorites.",
      category: "favorite",
      preview: ["Run in current session", "Run in new session"],
    },
    {
      question: "⭐ Recommendations",
      answer:
        "Frequently favorited (5+ times) questions appear as Recommendations at login or when starting a new session.",
      category: "recommendation",
    },
    {
      question: "🔍 Searching Table Data",
      answer:
        "Use the search bar in table view to filter rows and find specific records quickly.",
      category: "tableSearch",
    },
    {
      question: "⚙️ Customizing Settings",
      answer:
        "In Settings, change text size, switch Light/Dark theme, and manage notifications",
      category: "settings",
      solution: [
        "Toggle Light/Dark theme",
        "Adjust text size",
        "Enable/disable notifications",
      ],
    },
    {
      question: "🗂️ Managing Connections",
      answer:
        "View all created connections in Existing Connections. Delete non-admin connections here.",
      category: "connectionManage",
      tips: [
        "Admin-created connections cannot be deleted",
        "Delete stale connections to clean up",
      ],
    },
    {
      question: "🗄️ Closing Sidebar",
      answer:
        "Click the menu icon to collapse or expand the sidebar and increase chat area space.",
      category: "closeSidebar",
    },
    {
      question: "✏️ Renaming Sessions",
      answer:
        "In History, click the edit icon next to a session to rename it for easier retrieval.",
      category: "renameSession",
    },
    {
      question: "❔ Help & FAQs",
      answer:
        "Find all FAQs here under the Help tab. Contact support if you need further assistance.",
      category: "help",
      cta: "Contact Support",
    },
  ];

  return (
    <div
      style={{
        backgroundColor: theme.colors.background,
        padding: `${theme.spacing.xl} ${theme.spacing.md}`,
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          position: "relative",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: theme.spacing.md,
            marginBottom: theme.spacing.xl,
          }}
        >
          <div
            style={{
              background: theme.colors.accent,
              borderRadius: theme.borderRadius.pill,
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              color: "white",
              fontWeight: theme.typography.weight.bold,
            }}
          >
            🤖 AI Assistant
          </div>
          <h1
            style={{
              fontFamily: theme.typography.fontFamily,
              fontSize: theme.typography.size.lg,
              color: theme.colors.text,
              margin: 0,
            }}
          >
            TalkToData Help Center
          </h1>
        </div>

        {/* FAQ Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: theme.spacing.md,
          }}
        >
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              style={{
                background: theme.colors.surface,
                borderRadius: theme.borderRadius.large,
                padding: theme.spacing.md,
                boxShadow: theme.shadow.md,
                transition: theme.transition.default,
                border: `1px solid ${theme.colors.border}`,
                cursor: "pointer",
                height: openIndex === idx ? "auto" : "150px",
                overflow: "hidden",
                position: "relative",
              }}
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: theme.spacing.sm,
                  marginBottom: theme.spacing.sm,
                }}
              >
                {featureIcons[faq.category]}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3
                  style={{
                    fontSize: theme.typography.size.base,
                    fontWeight: theme.typography.weight.medium,
                    color: theme.colors.text,
                    margin: 0,
                  }}
                >
                  {faq.question}
                </h3>
                <ChevronDown
                  style={{
                    transform: openIndex === idx ? "rotate(180deg)" : "none",
                    transition: theme.transition.default,
                    color: theme.colors.textSecondary,
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: theme.spacing.md,
                  paddingTop: theme.spacing.md,
                  borderTop: `1px solid ${theme.colors.border}`,
                  display: openIndex === idx ? "block" : "none",
                }}
              >
                <p
                  style={{
                    color: theme.colors.textSecondary,
                    lineHeight: 1.6,
                  }}
                >
                  {faq.answer}
                </p>
                {faq.tips && (
                  <div
                    style={{
                      background: theme.colors.background,
                      borderRadius: theme.borderRadius.default,
                      padding: theme.spacing.sm,
                      marginTop: theme.spacing.sm,
                    }}
                  >
                    <div
                      style={{
                        color: theme.colors.accent,
                        fontSize: theme.typography.size.sm,
                        fontWeight: theme.typography.weight.medium,
                        marginBottom: theme.spacing.xs,
                      }}
                    >
                      Pro Tips
                    </div>
                    {faq.tips.map((t: string, i: number) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: theme.spacing.sm,
                          padding: `${theme.spacing.xs} 0`,
                        }}
                      >
                        <div
                          style={{
                            width: "4px",
                            height: "4px",
                            background: theme.colors.textSecondary,
                            borderRadius: "50%",
                          }}
                        />
                        <span
                          style={{
                            fontSize: theme.typography.size.sm,
                            color: theme.colors.textSecondary,
                          }}
                        >
                          {t}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {faq.solution && (
                  <div
                    style={{
                      background: theme.colors.background,
                      borderRadius: theme.borderRadius.default,
                      padding: theme.spacing.sm,
                      marginTop: theme.spacing.sm,
                    }}
                  >
                    <div
                      style={{
                        color: theme.colors.accent,
                        fontSize: theme.typography.size.sm,
                        fontWeight: theme.typography.weight.medium,
                        marginBottom: theme.spacing.xs,
                      }}
                    >
                      Solutions
                    </div>
                    {faq.solution.map((s: string, i: number) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: theme.spacing.sm,
                          padding: `${theme.spacing.xs} 0`,
                        }}
                      >
                        <div
                          style={{
                            width: "4px",
                            height: "4px",
                            background: theme.colors.textSecondary,
                            borderRadius: "50%",
                          }}
                        />
                        <span
                          style={{
                            fontSize: theme.typography.size.sm,
                            color: theme.colors.textSecondary,
                          }}
                        >
                          {s}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {faq.preview && (
                  <div
                    style={{
                      background: theme.colors.background,
                      borderRadius: theme.borderRadius.default,
                      padding: theme.spacing.sm,
                      marginTop: theme.spacing.sm,
                    }}
                  >
                    <div
                      style={{
                        color: theme.colors.accent,
                        fontSize: theme.typography.size.sm,
                        fontWeight: theme.typography.weight.medium,
                        marginBottom: theme.spacing.xs,
                      }}
                    >
                      Features
                    </div>
                    {faq.preview.map((p: string, i: number) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: theme.spacing.sm,
                          padding: `${theme.spacing.xs} 0`,
                        }}
                      >
                        <div
                          style={{
                            width: "4px",
                            height: "4px",
                            background: theme.colors.textSecondary,
                            borderRadius: "50%",
                          }}
                        />
                        <span
                          style={{
                            fontSize: theme.typography.size.sm,
                            color: theme.colors.textSecondary,
                          }}
                        >
                          {p}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {faq.cta && (
                  <button
                    style={{
                      background: theme.colors.accent,
                      color: "white",
                      border: "none",
                      borderRadius: theme.borderRadius.default,
                      padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                      marginTop: theme.spacing.sm,
                      cursor: "pointer",
                      transition: theme.transition.default,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (faq.fn) faq.fn();
                    }}
                  >
                    {faq.cta}
                  </button>
                )}
              </div>
              {openIndex !== idx && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "50px",
                    background: `linear-gradient(to bottom, transparent, ${theme.colors.surface})`,
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
