import React, { useMemo, useState } from "react";
import { useTheme } from "../ThemeContext";
import { Copy, Check, Code, Database } from "lucide-react";
import CustomTooltip from "./CustomTooltip";
import { motion, AnimatePresence } from "framer-motion";

interface QueryDisplayProps {
  query: string | object | null | undefined;
  title?: string;
  language?: string;
  fontSize: string;
}

const QueryDisplay: React.FC<QueryDisplayProps> = React.memo(
  ({ query, title, language = "sql", fontSize }) => {
    const { theme } = useTheme();

    const formattedQuery = useMemo(() => {
      if (query === null || query === undefined) {
        return "";
      } else if (typeof query === "string") {
        return query;
      } else if (typeof query === "object") {
        try {
          return JSON.stringify(query, null, 2);
        } catch (error) {
          console.error("Error formatting query (JSON.stringify):", error);
          return "Error: Invalid JSON";
        }
      }
      return String(query);
    }, [query]);

    const colorizedQuery = useMemo(() => {
      if (!formattedQuery) {
        return null;
      }

      if (language === "sql") {
        // Enhanced SQL lexical analysis with better token handling
        const lexSQL = (sql: string) => {
          const escapedSql = sql
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

          const tokens = [];

          // Enhanced keywords list with more SQL functions and operators
          const keywords = [
            "SELECT",
            "FROM",
            "WHERE",
            "AND",
            "OR",
            "INSERT",
            "UPDATE",
            "DELETE",
            "JOIN",
            "INNER",
            "LEFT",
            "RIGHT",
            "OUTER",
            "FULL",
            "CROSS",
            "GROUP",
            "BY",
            "ORDER",
            "HAVING",
            "LIMIT",
            "OFFSET",
            "TOP",
            "AS",
            "ON",
            "DISTINCT",
            "UNION",
            "ALL",
            "EXCEPT",
            "INTERSECT",
            "COUNT",
            "AVG",
            "SUM",
            "MIN",
            "MAX",
            "STDDEV",
            "VARIANCE",
            "DESC",
            "ASC",
            "BETWEEN",
            "IN",
            "LIKE",
            "ILIKE",
            "IS",
            "NULL",
            "NOT",
            "EXISTS",
            "CASE",
            "WHEN",
            "THEN",
            "ELSE",
            "END",
            "IF",
            "COALESCE",
            "NULLIF",
            "CAST",
            "CONVERT",
            "SUBSTRING",
            "TRIM",
            "UPPER",
            "LOWER",
            "LENGTH",
            "CONCAT",
            "REPLACE",
            "WITH",
            "RECURSIVE",
            "OVER",
            "PARTITION",
            "ROW_NUMBER",
            "RANK",
            "DENSE_RANK",
            "LEAD",
            "LAG",
            "FIRST_VALUE",
            "LAST_VALUE",
            "CREATE",
            "ALTER",
            "DROP",
            "TABLE",
            "VIEW",
            "INDEX",
            "TRIGGER",
            "PROCEDURE",
            "FUNCTION",
            "DATABASE",
            "SCHEMA",
            "PRIMARY",
            "KEY",
            "FOREIGN",
            "REFERENCES",
            "UNIQUE",
            "CHECK",
            "DEFAULT",
            "CONSTRAINT",
          ];

          const keywordPattern = new RegExp(
            `\\b(${keywords.join("|")})\\b`,
            "gi"
          );

          let i = 0;
          let currentToken = "";
          let state = "normal";

          while (i < escapedSql.length) {
            const char = escapedSql[i];

            if (state === "normal") {
              if (char === '"') {
                if (currentToken) {
                  tokens.push(
                    processToken(currentToken, keywordPattern, theme)
                  );
                  currentToken = "";
                }
                state = "identifier";
                currentToken = char;
              } else if (char === "'") {
                if (currentToken) {
                  tokens.push(
                    processToken(currentToken, keywordPattern, theme)
                  );
                  currentToken = "";
                }
                state = "string";
                currentToken = char;
              } else if (
                char === "-" &&
                i + 1 < escapedSql.length &&
                escapedSql[i + 1] === "-"
              ) {
                if (currentToken) {
                  tokens.push(
                    processToken(currentToken, keywordPattern, theme)
                  );
                  currentToken = "";
                }
                // Handle SQL comments
                let comment = "--";
                i += 2;
                while (i < escapedSql.length && escapedSql[i] !== "\n") {
                  comment += escapedSql[i];
                  i++;
                }
                tokens.push({
                  type: "comment",
                  value: comment,
                  color: theme.colors.textSecondary,
                });
                continue;
              } else if (/[.,;()=<>!+\-*/%]/.test(char)) {
                if (currentToken) {
                  tokens.push(
                    processToken(currentToken, keywordPattern, theme)
                  );
                  currentToken = "";
                }
                tokens.push({
                  type: "operator",
                  value: char,
                  color: theme.colors.accent,
                });
              } else if (/\s/.test(char)) {
                if (currentToken) {
                  tokens.push(
                    processToken(currentToken, keywordPattern, theme)
                  );
                  currentToken = "";
                }
                tokens.push({
                  type: "whitespace",
                  value: char,
                  color: null,
                });
              } else {
                currentToken += char;
              }
            } else if (state === "string") {
              currentToken += char;
              if (char === "'" && (i === 0 || escapedSql[i - 1] !== "\\")) {
                tokens.push({
                  type: "string",
                  value: currentToken,
                  color: theme.colors.warning,
                });
                currentToken = "";
                state = "normal";
              }
            } else if (state === "identifier") {
              currentToken += char;
              if (char === '"' && (i === 0 || escapedSql[i - 1] !== "\\")) {
                tokens.push({
                  type: "quotedIdentifier",
                  value: currentToken,
                  color: theme.colors.success,
                });
                currentToken = "";
                state = "normal";
              }
            }

            i++;
          }

          if (currentToken) {
            tokens.push(processToken(currentToken, keywordPattern, theme));
          }

          return tokens;
        };

        const processToken = (
          token: string,
          keywordPattern: RegExp,
          theme: any
        ) => {
          if (keywordPattern.test(token)) {
            return {
              type: "keyword",
              value: token,
              color: theme.colors.accent,
            };
          } else if (/^\d+(\.\d+)?$/.test(token)) {
            return {
              type: "number",
              value: token,
              color: theme.colors.error,
            };
          } else if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(token)) {
            return {
              type: "identifier",
              value: token,
              color: theme.colors.success,
            };
          } else {
            return {
              type: "text",
              value: token,
              color: null,
            };
          }
        };

        const lexedTokens = lexSQL(formattedQuery);

        let html = "";
        for (const token of lexedTokens) {
          if (token.color) {
            html += `<span style="color: ${token.color}; font-weight: ${
              token.type === "keyword" ? "600" : "normal"
            }">${token.value}</span>`;
          } else {
            html += token.value;
          }
        }

        return <span dangerouslySetInnerHTML={{ __html: html }} />;
      }

      return <span>{formattedQuery}</span>;
    }, [formattedQuery, language, theme.colors]);

    const getLanguageIcon = () => {
      switch (language) {
        case "sql":
          return <Database size={16} />;
        default:
          return <Code size={16} />;
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        {formattedQuery ? (
          <div className="query-content relative">
            {title && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 mb-3 pb-2 border-b"
                style={{
                  borderColor: `${theme.colors.accent}20`,
                  color: theme.colors.text,
                }}
              >
                <div style={{ color: theme.colors.accent }}>
                  {getLanguageIcon()}
                </div>
                <h3 className="text-lg font-semibold tracking-tight">
                  {title}
                </h3>
                <div
                  className="ml-auto text-xs px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: `${theme.colors.accent}15`,
                    color: theme.colors.accent,
                    fontWeight: "500",
                  }}
                >
                  {language.toUpperCase()}
                </div>
              </motion.div>
            )}

            <div className="relative group">
              {/* Enhanced Copy Button */}
              {formattedQuery && (
                <div className="absolute top-13 right-3 z-10 transition-opacity duration-200">
                  <CopyButton query={formattedQuery} />
                </div>
              )}

              {/* Code Block with enhanced styling */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="relative overflow-hidden rounded-xl shadow-lg"
                style={{
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.accent}20`,
                }}
              >
                {/* Top bar with subtle gradient */}
                <div
                  className="h-8 flex items-center px-4 border-b"
                  style={{
                    background: `linear-gradient(90deg, ${theme.colors.accent}08, ${theme.colors.accent}03)`,
                    borderColor: `${theme.colors.accent}15`,
                  }}
                >
                  <div className="flex space-x-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: `${theme.colors.error}` }}
                    />
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: `${theme.colors.warning}` }}
                    />
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: `${theme.colors.success}` }}
                    />
                  </div>
                </div>

                {/* Code content */}
                <pre
                  className="p-4 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed"
                  style={{
                    fontSize: fontSize,
                    lineHeight: "1.6",
                    background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.surface}f8 100%)`,
                  }}
                >
                  <code className="block">
                    {colorizedQuery || formattedQuery}
                  </code>
                </pre>
              </motion.div>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center p-8 rounded-xl border-2 border-dashed"
            style={{
              borderColor: `${theme.colors.textSecondary}30`,
              backgroundColor: `${theme.colors.surface}50`,
              color: theme.colors.textSecondary,
              fontSize: fontSize,
            }}
          >
            <div className="text-center">
              <Code size={32} className="mx-auto mb-2 opacity-50" />
              <p className="italic font-medium">No query to display</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }
);

const areEqual = (
  prevProps: QueryDisplayProps,
  nextProps: QueryDisplayProps
) => {
  return (
    prevProps.query === nextProps.query &&
    prevProps.title === nextProps.title &&
    prevProps.language === nextProps.language &&
    prevProps.fontSize === nextProps.fontSize
  );
};

export default React.memo(QueryDisplay, areEqual);

// Enhanced Copy Button Component
const CopyButton = ({ query }: { query: string }) => {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [copyTooltipText, setCopyTooltipText] = useState("Copy to clipboard");
  const [canCopy, setCanCopy] = useState(true);

  const handleCopy = () => {
    if (!canCopy) return;
    setCanCopy(false);

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(query)
        .then(() => {
          setCopied(true);
          setCopyTooltipText("Copied!");
        })
        .catch((error) => {
          console.error("Copy failed:", error);
          setCopyTooltipText("Copy failed");
        })
        .finally(() => {
          setTimeout(() => {
            setCopied(false);
            setCopyTooltipText("Copy to clipboard");
            setCanCopy(true);
          }, 2000);
        });
    } else {
      // Fallback for browsers that don't support clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = query;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        const success = document.execCommand("copy");
        if (success) {
          setCopied(true);
          setCopyTooltipText("Copied!");
        } else {
          setCopyTooltipText("Copy failed");
        }
      } catch (err) {
        console.error("Copy failed:", err);
        setCopyTooltipText("Copy failed");
      }
      document.body.removeChild(textarea);
      setTimeout(() => {
        setCopied(false);
        setCopyTooltipText("Copy to clipboard");
        setCanCopy(true);
      }, 2000);
    }
  };

  return (
    <CustomTooltip title={copyTooltipText} position="left">
      <motion.button
        whileHover={{
          scale: 1.05,
          // boxShadow: `0 4px 12px ${theme.colors.accent}25`,
        }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCopy}
        className="relative p-2.5  transition-all duration-200"
        style={{
          // backgroundColor: copied
          //   ? `${theme.colors.success}25`
          //   : `${theme.colors.surface}95`,
          color: copied ? theme.colors.success : theme.colors.accent,
          // border: `1px solid ${
          //   copied ? theme.colors.success : theme.colors.accent
          // }30`,
          // boxShadow: `0 2px 8px ${theme.colors.accent}15`,
        }}
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div
              key="check"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <Check size={16} />
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={{ scale: 0, rotate: 90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -90 }}
              transition={{ duration: 0.2 }}
            >
              <Copy size={16} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </CustomTooltip>
  );
};
