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
        // A more accurate lexical analysis approach for SQL
        const lexSQL = (sql: string) => {
          // First, escape HTML special characters
          const escapedSql = sql
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

          // Tokenize the SQL into parts with proper coloring
          const tokens = [];

          // Keywords list - case insensitive
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

          // Create a regex pattern for keywords with word boundaries
          const keywordPattern = new RegExp(
            `\\b(${keywords.join("|")})\\b`,
            "i"
          );

          // Process the SQL character by character to handle all edge cases
          let i = 0;
          let currentToken = "";
          let state = "normal"; // States: normal, string, identifier, comment

          while (i < escapedSql.length) {
            const char = escapedSql[i];
            const nextChar = i < escapedSql.length - 1 ? escapedSql[i + 1] : "";

            // Handle different states
            if (state === "normal") {
              // Check for the start of a quoted identifier
              if (char === '"') {
                // Process any accumulated token if needed
                if (currentToken) {
                  // Check if it's a keyword
                  if (keywordPattern.test(currentToken)) {
                    tokens.push({
                      type: "keyword",
                      value: currentToken,
                      color: theme.colors.accent,
                    });
                  } else if (/^\d+(\.\d+)?$/.test(currentToken)) {
                    // It's a number
                    tokens.push({
                      type: "number",
                      value: currentToken,
                      color: theme.colors.error,
                    });
                  } else if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(currentToken)) {
                    // It's an unquoted identifier/name
                    tokens.push({
                      type: "identifier",
                      value: currentToken,
                      color: theme.colors.success,
                    });
                  } else {
                    // Regular text
                    tokens.push({
                      type: "text",
                      value: currentToken,
                      color: null,
                    });
                  }
                  currentToken = "";
                }

                // Start of a quoted identifier
                state = "identifier";
                currentToken = char;
              }
              // Check for string literal
              else if (char === "'") {
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
              }
              // Check for operators and punctuation
              else if (/[.,;()=<>!+\-*/%]/.test(char)) {
                // Process any accumulated token
                if (currentToken) {
                  // Check if it's a keyword
                  if (keywordPattern.test(currentToken)) {
                    tokens.push({
                      type: "keyword",
                      value: currentToken,
                      color: theme.colors.accent,
                    });
                  } else if (/^\d+(\.\d+)?$/.test(currentToken)) {
                    // It's a number
                    tokens.push({
                      type: "number",
                      value: currentToken,
                      color: theme.colors.error,
                    });
                  } else if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(currentToken)) {
                    // It's an unquoted identifier/name
                    tokens.push({
                      type: "identifier",
                      value: currentToken,
                      color: theme.colors.success,
                    });
                  } else {
                    // Regular text
                    tokens.push({
                      type: "text",
                      value: currentToken,
                      color: null,
                    });
                  }
                  currentToken = "";
                }

                // Add operator/punctuation
                tokens.push({
                  type: "operator",
                  value: char,
                  color: null,
                });
              }
              // Handle spaces
              else if (/\s/.test(char)) {
                // Process any accumulated token
                if (currentToken) {
                  // Check if it's a keyword
                  if (keywordPattern.test(currentToken)) {
                    tokens.push({
                      type: "keyword",
                      value: currentToken,
                      color: theme.colors.accent,
                    });
                  } else if (/^\d+(\.\d+)?$/.test(currentToken)) {
                    // It's a number
                    tokens.push({
                      type: "number",
                      value: currentToken,
                      color: theme.colors.error,
                    });
                  } else if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(currentToken)) {
                    // It's an unquoted identifier/name
                    tokens.push({
                      type: "identifier",
                      value: currentToken,
                      color: theme.colors.success,
                    });
                  } else {
                    // Regular text
                    tokens.push({
                      type: "text",
                      value: currentToken,
                      color: null,
                    });
                  }
                  currentToken = "";
                }

                // Add whitespace
                tokens.push({
                  type: "whitespace",
                  value: char,
                  color: null,
                });
              }
              // Regular character, accumulate
              else {
                currentToken += char;
              }
            }
            // Handle string literal state
            else if (state === "string") {
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
            }
            // Handle quoted identifier state
            else if (state === "identifier") {
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

          // Handle any remaining token
          if (currentToken) {
            // Check if it's a keyword
            if (keywordPattern.test(currentToken)) {
              tokens.push({
                type: "keyword",
                value: currentToken,
                color: theme.colors.accent,
              });
            } else if (/^\d+(\.\d+)?$/.test(currentToken)) {
              // It's a number
              tokens.push({
                type: "number",
                value: currentToken,
                color: theme.colors.error,
              });
            } else if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(currentToken)) {
              // It's an unquoted identifier/name
              tokens.push({
                type: "identifier",
                value: currentToken,
                color: theme.colors.success,
              });
            } else {
              // Regular text
              tokens.push({
                type: "text",
                value: currentToken,
                color: null,
              });
            }
          }

          return tokens;
        };

        // Process the lexed tokens for second-pass context analysis
        const processTokens = (tokens) => {
          let inFrom = false;
          let inOn = false;
          let afterFrom = false;
          let lastTableName = null;

          // Function to identify a token sequence as a table reference
          const isTableReference = (index) => {
            // In the FROM clause, any identifier is a table
            if (inFrom) {
              return (
                tokens[index].type === "identifier" ||
                tokens[index].type === "quotedIdentifier"
              );
            }

            // Check for table.column pattern
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

          // Special handling for compound keywords like INNER JOIN and ORDER BY
          const handleCompoundKeywords = () => {
            for (let i = 0; i < tokens.length - 2; i++) {
              // Handle "INNER JOIN"
              if (
                tokens[i].type === "keyword" &&
                tokens[i].value.toUpperCase() === "INNER" &&
                i + 2 < tokens.length &&
                tokens[i + 2].type === "keyword" &&
                tokens[i + 2].value.toUpperCase() === "JOIN"
              ) {
                // Ensure INNER has the same color as other keywords
                tokens[i].color = theme.colors.accent;
              }

              // Handle "ORDER BY"
              if (
                tokens[i].type === "keyword" &&
                tokens[i].value.toUpperCase() === "ORDER" &&
                i + 2 < tokens.length &&
                tokens[i + 2].type === "keyword" &&
                tokens[i + 2].value.toUpperCase() === "BY"
              ) {
                // Ensure ORDER has the same color as other keywords
                tokens[i].color = theme.colors.accent;
                tokens[i + 2].color = theme.colors.accent;
              }
            }
          };

          // Second pass - identify tables and mark qualified columns
          for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            // Track context
            if (token.type === "keyword") {
              const upperValue = token.value.toUpperCase();

              if (upperValue === "FROM") {
                inFrom = true;
                afterFrom = true;
                inOn = false;
              } else if (upperValue === "JOIN") {
                inFrom = true;
                inOn = false;
              } else if (upperValue === "ON") {
                inFrom = false;
                inOn = true;
              } else if (
                ["WHERE", "GROUP", "ORDER", "HAVING", "LIMIT"].includes(
                  upperValue
                )
              ) {
                inFrom = false;
                inOn = false;
              }

              // Force all keywords to have the accent color
              token.color = theme.colors.accent;
            }

            // Identify table references in FROM/JOIN
            if (isTableReference(i)) {
              if (inFrom) {
                // This is a table name
                tokens[i].color = theme.colors.warning;
                tokens[i].type = "table";
                lastTableName = tokens[i].value;
              } else if (i + 2 < tokens.length && tokens[i + 1].value === ".") {
                // This is a table name in a qualified column reference
                tokens[i].color = theme.colors.warning;
                tokens[i].type = "table";
              }
            }
          }

          // Handle compound keywords like INNER JOIN and ORDER BY
          handleCompoundKeywords();

          return tokens;
        };

        // Tokenize the SQL query
        const lexedTokens = lexSQL(formattedQuery);
        // Process tokens for contextual highlighting
        const processedTokens = processTokens(lexedTokens);

        // Generate HTML
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
      <div style={{ backgroundColor: theme.colors.surface }}>
        {formattedQuery ? (
          <div className="query-content">
            {title && (
              <h3 className="mb-2" style={{ color: theme.colors.text }}>
                {title}
              </h3>
            )}
            <pre
              className="p-1 rounded overflow-x-auto whitespace-pre-wrap font-mono"
              style={{
                backgroundColor: theme.colors.surface,
                fontSize: fontSize,
              }}
            >
              <code>{colorizedQuery || formattedQuery}</code>
            </pre>
          </div>
        ) : (
          <div
            className="italic"
            style={{ color: theme.colors.textSecondary, fontSize: fontSize }}
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
