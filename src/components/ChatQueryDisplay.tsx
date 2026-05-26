import React, { useMemo } from "react";
import { useTheme } from "../ThemeContext";

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
        return query.trim();
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
            "i",
          );

          let i = 0;
          let currentToken = "";
          let state = "normal";

          while (i < escapedSql.length) {
            const char = escapedSql[i];

            if (state === "normal") {
              if (char === '"') {
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
                      color: theme.colors.success,
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
                      color: theme.colors.success,
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
                      color: theme.colors.success,
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
                color: theme.colors.success,
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

          const isTableReference = (index: number) => {
            if (inFrom) {
              return (
                tokens[index].type === "identifier" ||
                tokens[index].type === "quotedIdentifier"
              );
            }
            if (index + 2 < tokens.length) {
              const isIdentifier =
                tokens[index].type === "identifier" ||
                tokens[index].type === "quotedIdentifier";
              const isDot = tokens[index + 1].value === ".";
              const isNextIdentifier =
                tokens[index + 2].type === "identifier" ||
                tokens[index + 2].type === "quotedIdentifier";
              return isIdentifier && isDot && isNextIdentifier;
            }
            return false;
          };

          const handleCompoundKeywords = () => {
            for (let i = 0; i < tokens.length - 2; i++) {
              if (
                tokens[i].type === "keyword" &&
                tokens[i].value.toUpperCase() === "INNER" &&
                i + 2 < tokens.length &&
                tokens[i + 2].type === "keyword" &&
                tokens[i + 2].value.toUpperCase() === "JOIN"
              ) {
                tokens[i].color = theme.colors.accent;
              }
              if (
                tokens[i].type === "keyword" &&
                tokens[i].value.toUpperCase() === "ORDER" &&
                i + 2 < tokens.length &&
                tokens[i + 2].type === "keyword" &&
                tokens[i + 2].value.toUpperCase() === "BY"
              ) {
                tokens[i].color = theme.colors.accent;
                tokens[i + 2].color = theme.colors.accent;
              }
            }
          };

          for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (token.type === "keyword") {
              const upperValue = token.value.toUpperCase();
              if (upperValue === "FROM") {
                inFrom = true;
                inOn = false;
              } else if (upperValue === "JOIN") {
                inFrom = true;
                inOn = false;
              } else if (upperValue === "ON") {
                inFrom = false;
                inOn = true;
              } else if (
                ["WHERE", "GROUP", "ORDER", "HAVING", "LIMIT"].includes(
                  upperValue,
                )
              ) {
                inFrom = false;
                inOn = false;
              }
              token.color = theme.colors.accent;
            }

            if (isTableReference(i)) {
              if (inFrom) {
                tokens[i].color = theme.colors.warning;
                tokens[i].type = "table";
              } else if (i + 2 < tokens.length && tokens[i + 1].value === ".") {
                tokens[i].color = theme.colors.warning;
                tokens[i].type = "table";
              }
            }
          }

          handleCompoundKeywords();
          return tokens;
        };

        const lexedTokens = lexSQL(formattedQuery);
        const processedTokens = processTokens(lexedTokens);

        let html = "";
        for (const token of processedTokens) {
          if (token.color) {
            const opacity = ["identifier", "table", "quotedIdentifier"].includes(token.type) ? "0.75" : ["string", "number", "function"].includes(token.type) ? "0.85" : ["keyword"].includes(token.type) ? "0.9" : "1";
            html += `<span style="color: ${token.color}; opacity: ${opacity};">${token.value}</span>`;
          } else {
            html += `<span style="opacity: 0.75">${token.value}</span>`;
          }
        }
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
      }
      return <span>{formattedQuery}</span>;
    }, [formattedQuery, language, theme.colors]);

    return (
      <div
        className="w-full mt-3 relative overflow-hidden transition-all duration-300 pl-4 border-l-2"
        style={{
          borderColor: theme.mode === 'light' ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.15)',
          backgroundColor: "transparent",
        }}
      >
        {/* Integrated Toolbar */}
        {(title || language) && (
          <div 
            className="flex items-center justify-between py-1"
          >
            <div className="flex items-center gap-2">
              {title && (
                <span className="text-xs font-medium tracking-wide" style={{ color: theme.colors.text, opacity: 0.9 }}>
                  {title}
                </span>
              )}
            </div>
            {language && (
              <span 
                className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ml-1"
                style={{ 
                  backgroundColor: theme.mode === 'light' ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.05)',
                  color: theme.colors.textSecondary 
                }}
              >
                {language}
              </span>
            )}
          </div>
        )}

        {formattedQuery ? (
          <div className="query-content relative mt-1">
            <pre
              className="py-1 m-0 overflow-x-auto whitespace-pre-wrap font-mono custom-scrollbar"
              style={{
                fontSize: fontSize || "13px",
                color: theme.mode === 'light' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                lineHeight: "1.7",
              }}
            >
              <code className="block w-full">{colorizedQuery || formattedQuery}</code>
            </pre>
          </div>
        ) : (
          <div
            className="italic px-4 py-3 text-xs opacity-50 text-center"
            style={{ color: theme.colors.textSecondary, fontSize: fontSize || "13px" }}
          >
            No query to display.
          </div>
        )}
      </div>
    );
  },
);

const areEqual = (
  prevProps: QueryDisplayProps,
  nextProps: QueryDisplayProps,
) => {
  return (
    prevProps.query === nextProps.query &&
    prevProps.title === nextProps.title &&
    prevProps.language === nextProps.language &&
    prevProps.fontSize === nextProps.fontSize
  );
};

export default React.memo(QueryDisplay, areEqual);
