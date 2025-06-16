import React, { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import { motion } from "framer-motion"; // Assuming framer-motion is installed
import { useTheme } from "../ThemeContext.tsx"; // Corrected import path

// --- Placeholder CustomTooltip Component ---
// In a real application, this would be in a separate file (e.g., CustomTooltip.tsx)
interface CustomTooltipProps {
  title: string;
  children: React.ReactElement;
  position?: "top" | "bottom" | "left" | "right";
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  title,
  children,
  position = "top",
}) => {
  const [show, setShow] = useState(false);
  const { theme } = useTheme();

  const getPositionClasses = (pos: string) => {
    switch (pos) {
      case "top":
        return "bottom-full left-1/2 -translate-x-1/2 mb-2";
      case "bottom":
        return "top-full left-1/2 -translate-x-1/2 mt-2";
      case "left":
        return "right-full top-1/2 -translate-y-1/2 mr-2";
      case "right":
        return "left-full top-1/2 -translate-y-1/2 ml-2";
      default:
        return "bottom-full left-1/2 -translate-x-1/2 mb-2";
    }
  };

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className={`absolute z-20 px-2 py-1 text-xs rounded shadow-lg whitespace-nowrap
                      ${getPositionClasses(position)}`}
          style={{
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
          }}
        >
          {title}
        </div>
      )}
    </div>
  );
};

// --- Original QueryDisplay Component ---
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

      // SQL Syntax Highlighting Logic
      if (language === "sql") {
        const lexSQL = (sql: string) => {
          const escapedSql = sql
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

          const tokens = [];
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
            "GROUP",
            "BY",
            "ORDER",
            "HAVING",
            "LIMIT",
            "OFFSET",
            "AS",
            "ON",
            "DISTINCT",
            "COUNT",
            "AVG",
            "SUM",
            "MIN",
            "MAX",
            "DESC",
            "ASC",
            "BETWEEN",
            "IN",
            "LIKE",
            "IS",
            "NULL",
            "NOT",
            "EXISTS",
            "CASE",
            "WHEN",
            "THEN",
            "ELSE",
            "END",
          ];

          const keywordPattern = new RegExp(
            `\\b(${keywords.join("|")})\\b`,
            "i"
          );

          let i = 0;
          let currentToken = "";
          let state = "normal"; // States: normal, string, identifier

          while (i < escapedSql.length) {
            const char = escapedSql[i];

            if (state === "normal") {
              if (char === '"') {
                if (currentToken) {
                  // Process accumulated token before starting quoted identifier
                  if (keywordPattern.test(currentToken)) {
                    tokens.push({
                      type: "keyword",
                      value: currentToken,
                      color: theme.colors.accent,
                    });
                  } else if (/^\d+(\.\d+)?$/.test(currentToken)) {
                    tokens.push({
                      type: "number",
                      value: currentToken,
                      color: theme.colors.error,
                    });
                  } else if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(currentToken)) {
                    tokens.push({
                      type: "identifier",
                      value: currentToken,
                      color: theme.colors.text, // Use theme's text color for identifiers
                    });
                  } else {
                    tokens.push({
                      type: "text",
                      value: currentToken,
                      color: null,
                    });
                  }
                  currentToken = "";
                }
                state = "identifier";
                currentToken = char;
              } else if (char === "'") {
                if (currentToken) {
                  tokens.push({
                    type: "text",
                    value: currentToken,
                    color: null,
                  });
                  currentToken = "";
                }
                state = "string";
                currentToken = char;
              } else if (/[.,;()=<>!+\-*/%]/.test(char)) {
                if (currentToken) {
                  if (keywordPattern.test(currentToken)) {
                    tokens.push({
                      type: "keyword",
                      value: currentToken,
                      color: theme.colors.accent,
                    });
                  } else if (/^\d+(\.\d+)?$/.test(currentToken)) {
                    tokens.push({
                      type: "number",
                      value: currentToken,
                      color: theme.colors.error,
                    });
                  } else if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(currentToken)) {
                    tokens.push({
                      type: "identifier",
                      value: currentToken,
                      color: theme.colors.text, // Use theme's text color for identifiers
                    });
                  } else {
                    tokens.push({
                      type: "text",
                      value: currentToken,
                      color: null,
                    });
                  }
                  currentToken = "";
                }
                tokens.push({ type: "operator", value: char, color: null });
              } else if (/\s/.test(char)) {
                if (currentToken) {
                  if (keywordPattern.test(currentToken)) {
                    tokens.push({
                      type: "keyword",
                      value: currentToken,
                      color: theme.colors.accent,
                    });
                  } else if (/^\d+(\.\d+)?$/.test(currentToken)) {
                    tokens.push({
                      type: "number",
                      value: currentToken,
                      color: theme.colors.error,
                    });
                  } else if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(currentToken)) {
                    tokens.push({
                      type: "identifier",
                      value: currentToken,
                      color: theme.colors.text, // Use theme's text color for identifiers
                    });
                  } else {
                    tokens.push({
                      type: "text",
                      value: currentToken,
                      color: null,
                    });
                  }
                  currentToken = "";
                }
                tokens.push({ type: "whitespace", value: char, color: null });
              } else {
                currentToken += char;
              }
            } else if (state === "string") {
              currentToken += char;
              if (char === "'" && i > 0) {
                // Check i > 0 to prevent issues with leading single quote
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
              if (char === '"' && i > 0) {
                // Check i > 0 to prevent issues with leading double quote
                tokens.push({
                  type: "quotedIdentifier",
                  value: currentToken,
                  color: theme.colors.text, // Use theme's text color for identifiers
                });
                currentToken = "";
                state = "normal";
              }
            }
            i++;
          }

          if (currentToken) {
            if (keywordPattern.test(currentToken)) {
              tokens.push({
                type: "keyword",
                value: currentToken,
                color: theme.colors.accent,
              });
            } else if (/^\d+(\.\d+)?$/.test(currentToken)) {
              tokens.push({
                type: "number",
                value: currentToken,
                color: theme.colors.error,
              });
            } else if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(currentToken)) {
              tokens.push({
                type: "identifier",
                value: currentToken,
                color: theme.colors.text, // Use theme's text color for identifiers
              });
            } else {
              tokens.push({ type: "text", value: currentToken, color: null });
            }
          }
          return tokens;
        };

        const processTokens = (tokens: any[]) => {
          let inFrom = false;
          let inOn = false;

          const handleCompoundKeywords = () => {
            for (let i = 0; i < tokens.length; i++) {
              // Handle "INNER JOIN", "LEFT JOIN", etc.
              if (
                ["INNER", "LEFT", "RIGHT", "FULL"].includes(
                  tokens[i].value.toUpperCase()
                ) &&
                i + 1 < tokens.length &&
                tokens[i + 1].type === "whitespace" &&
                i + 2 < tokens.length &&
                tokens[i + 2].value.toUpperCase() === "JOIN"
              ) {
                tokens[i].color = theme.colors.accent; // Color the first part (INNER, LEFT, etc.)
                tokens[i + 2].color = theme.colors.accent; // Color "JOIN"
              }
              // Handle "ORDER BY", "GROUP BY"
              else if (
                ["ORDER", "GROUP"].includes(tokens[i].value.toUpperCase()) &&
                i + 1 < tokens.length &&
                tokens[i + 1].type === "whitespace" &&
                i + 2 < tokens.length &&
                tokens[i + 2].value.toUpperCase() === "BY"
              ) {
                tokens[i].color = theme.colors.accent; // Color "ORDER" or "GROUP"
                tokens[i + 2].color = theme.colors.accent; // Color "BY"
              }
            }
          };

          for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (token.type === "keyword") {
              const upperValue = token.value.toUpperCase();

              if (upperValue === "FROM" || upperValue === "JOIN") {
                inFrom = true;
                inOn = false;
              } else if (upperValue === "ON") {
                inFrom = false;
                inOn = true;
              } else if (
                [
                  "WHERE",
                  "GROUP",
                  "ORDER",
                  "HAVING",
                  "LIMIT",
                  "SELECT",
                ].includes(upperValue)
              ) {
                inFrom = false;
                inOn = false;
              }
              token.color = theme.colors.accent;
            }

            // Identify table names and qualified columns
            if (
              token.type === "identifier" ||
              token.type === "quotedIdentifier"
            ) {
              if (inFrom) {
                token.color = theme.colors.warning; // Highlight as a table name
                token.type = "table";
              } else if (i > 0 && tokens[i - 1].value === ".") {
                // This is a column name after a dot, so the previous token was a table/alias
                // Ensure the previous token (table/alias) is also highlighted if not already
                if (
                  i - 2 >= 0 &&
                  (tokens[i - 2].type === "identifier" ||
                    tokens[i - 2].type === "quotedIdentifier")
                ) {
                  tokens[i - 2].color = theme.colors.warning;
                  tokens[i - 2].type = "table"; // Mark it as a table too
                }
                token.color = theme.colors.text; // Use theme's text color for column names
                token.type = "column";
              } else if (i + 1 < tokens.length && tokens[i + 1].value === ".") {
                // This is a table/alias before a dot, highlight it
                token.color = theme.colors.warning;
                token.type = "table";
              }
            }
          }

          handleCompoundKeywords(); // Apply compound keyword coloring after initial pass

          return tokens;
        };

        const lexedTokens = lexSQL(formattedQuery);
        const processedTokens = processTokens(lexedTokens);

        let html = "";
        for (const token of processedTokens) {
          if (token.color) {
            html += `<span style="color: ${token.color}">${token.value}</span>`;
          } else {
            html += token.value;
          }
        }
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
      }
      return <span>{formattedQuery}</span>;
    }, [formattedQuery, language, theme.colors]);

    return (
      // Wrap the QueryDisplay in AppThemeProvider to provide theme context
      <div>
        {formattedQuery ? (
          <div className="query-content relative">
            {title && (
              <h3
                className="mb-3 text-lg font-semibold"
                style={{ color: theme.colors.text }}
              >
                {title}
              </h3>
            )}
            <div className="relative rounded-md overflow-hidde">
              {/* Copy Button */}
              {formattedQuery && (
                <div className="absolute top-2 right-2 z-10">
                  <CopyButton query={formattedQuery} />
                </div>
              )}
              <pre
                className="p-4 overflow-x-auto whitespace-pre-wrap font-mono relative pr-12 rounded-md" // Added pr-12 for copy button spacing
                style={{
                  backgroundColor: theme.colors.surface,
                  fontSize: fontSize,
                  color: theme.colors.text, // Default text color for the code block
                }}
              >
                <code>{colorizedQuery || formattedQuery}</code>
              </pre>
            </div>
          </div>
        ) : (
          <div
            className="italic p-4 text-center rounded-md"
            style={{
              color: theme.colors.textSecondary,
              fontSize: fontSize,
              backgroundColor: theme.colors.surface,
            }}
          >
            No query to display.
          </div>
        )}
      </div>
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

// Copy Button Component
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
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCopy}
        className="p-2 rounded-full transition-colors duration-200 ease-in-out flex items-center justify-center shadow-md"
        style={{
          backgroundColor: copied ? theme.colors.success : theme.colors.accent, // Use accent for uncopied state
          color: theme.colors.onPrimary, // Text color for the button
        }}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </motion.button>
    </CustomTooltip>
  );
};
