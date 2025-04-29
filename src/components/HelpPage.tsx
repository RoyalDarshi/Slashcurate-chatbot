import { useTheme } from "../ThemeContext";
import { useState } from "react";
import {
  ChevronDown,
  Star,
  History,
  PieChart,
  Lock,
  Code,
  Zap,
} from "lucide-react";

const HelpPage = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { theme } = useTheme();

  const featureIcons = {
    general: <Zap className="icon" />,
    security: <Lock className="icon" />,
    integration: <Code className="icon" />,
    data: <PieChart className="icon" />,
    history: <History className="icon" />,
  };

  const faqs = [
    {
      question: "🚀 Getting Started with Data Chat",
      answer:
        "Learn how to ask natural language questions, save favorite queries, and interpret results.",
      category: "general",
      tips: [
        "Try questions like 'Show sales trends' or 'Compare regions'",
        "Click the heart icon to save queries",
      ],
    },
    {
      question: "📊 When Graphs Don't Show Up",
      answer:
        "Graphs might not appear if the data format isn't compatible. Try simplifying your question or check your data structure.",
      category: "data",
      solution: [
        "Use specific time ranges",
        "Ask for aggregated data",
        "Check data column names",
      ],
    },
    {
      question: "⭐ Saving & Organizing Favorites",
      answer:
        "Mark important queries as favorites to access them quickly from your profile dashboard.",
      category: "history",
      icon: <Star />,
    },
    {
      question: "🛡️ Data Privacy & Security",
      answer:
        "All data interactions are encrypted end-to-end. We never store raw data beyond your session.",
      category: "security",
      badge: "GDPR Compliant",
    },
    {
      question: "🔌 API & Custom Integrations",
      answer:
        "Connect TalkToData with your BI tools using our REST API or pre-built connectors.",
      category: "integration",
      cta: "View API Docs",
    },
    {
      question: "🕒 Understanding Query History",
      answer:
        "Access your last 30 days of queries with auto-generated summaries and visual thumbnails.",
      category: "history",
      preview: ["Searchable history", "Export results", "Session tagging"],
    },
  ];

  return (
    <div
      style={{
        backgroundColor: theme.colors.background,
        minHeight: "100vh",
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
        {/* Header Section */}
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
              color: theme.colors.surface,
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
          {faqs.map((faq, index) => (
            <div
              key={index}
              style={{
                background: theme.colors.surface,
                borderRadius: theme.borderRadius.large,
                padding: theme.spacing.md,
                boxShadow: theme.shadow.md,
                transition: theme.transition.default,
                border: `1px solid ${theme.colors.border}`,
                cursor: "pointer",
                ":hover": {
                  transform: "translateY(-2px)",
                  boxShadow: theme.shadow.lg,
                },
              }}
            >
              <div
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                {/* Category Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: theme.spacing.sm,
                    marginBottom: theme.spacing.sm,
                  }}
                >
                  <span
                    style={{
                      color: theme.colors.accent,
                    }}
                  >
                    {featureIcons[faq.category]}
                  </span>
                  {faq.badge && (
                    <span
                      style={{
                        background: theme.colors.warning + "20",
                        color: theme.colors.warning,
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        borderRadius: theme.borderRadius.pill,
                        fontSize: theme.typography.size.sm,
                      }}
                    >
                      {faq.badge}
                    </span>
                  )}
                </div>

                {/* Question */}
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
                      transform:
                        openIndex === index ? "rotate(180deg)" : "none",
                      transition: theme.transition.default,
                      color: theme.colors.textSecondary,
                    }}
                  />
                </div>

                {/* Expanded Content */}
                {openIndex === index && (
                  <div
                    style={{
                      marginTop: theme.spacing.md,
                      paddingTop: theme.spacing.md,
                      borderTop: `1px solid ${theme.colors.border}`,
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

                    {/* Additional Content Blocks */}
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
                        {faq.tips.map((tip, i) => (
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
                              {tip}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {faq.cta && (
                      <button
                        style={{
                          background: theme.colors.accent,
                          color: theme.colors.surface,
                          border: "none",
                          borderRadius: theme.borderRadius.default,
                          padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                          marginTop: theme.spacing.sm,
                          cursor: "pointer",
                          transition: theme.transition.default,
                          ":hover": {
                            background: theme.colors.accentHover,
                          },
                        }}
                      >
                        {faq.cta}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
