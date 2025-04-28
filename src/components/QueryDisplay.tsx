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
        // This is a complete rewrite of the colorization logic using a token-based approach
        // instead of complex regex replacements

        // Escape HTML special characters first
        const escapedQuery = formattedQuery
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

        // Create a tokenizer to properly handle SQL components
        const sqlTokenizer = () => {
          // Define token types with their patterns and colors
          const tokenTypes = [
            {
              type: "keyword",
              regex:
                /\b(SELECT|FROM|WHERE|AND|OR|INSERT|UPDATE|DELETE|JOIN|LEFT|RIGHT|INNER|OUTER|GROUP BY|ORDER BY|LIMIT|OFFSET|AS|ON|DISTINCT|COUNT|AVG|SUM|MIN|MAX|DESC|ASC)\b/i,
              color: theme.colors.accent,
            },
            {
              type: "string",
              regex: /'([^']*)'/g,
              color: theme.colors.warning,
            },
            {
              type: "number",
              regex: /\b\d+(\.\d+)?\b/g,
              color: theme.colors.error,
            },
            {
              type: "column",
              regex: /"([^"]*)"/g, // Handle double-quoted identifiers
              color: theme.colors.success,
            },
            {
              type: "bareColumn",
              regex: /\b[a-zA-Z][a-zA-Z0-9_]*\b/g, // Handle bare (unquoted) column names
              color: theme.colors.success,
              test: (word, context) => {
                // Only color as column in the right context, not keywords
                if (
                  /\b(SELECT|FROM|WHERE|AND|OR|INSERT|UPDATE|DELETE|JOIN|LEFT|RIGHT|INNER|OUTER|GROUP BY|ORDER BY|LIMIT|OFFSET|AS|ON|DISTINCT|COUNT|AVG|SUM|MIN|MAX|DESC|ASC)\b/i.test(
                    word
                  )
                ) {
                  return false;
                }

                // If we're in a SELECT list or appropriate context
                return (
                  context.inSelect ||
                  context.inWhere ||
                  context.inGroupBy ||
                  context.inOrderBy
                );
              },
            },
          ];

          // Split the query into meaningful parts
          const tokens = [];
          let currentPos = 0;
          const context = {
            inSelect: false,
            inFrom: false,
            inWhere: false,
            inGroupBy: false,
            inOrderBy: false,
          };

          // Simple SQL parser to update context
          const parts = escapedQuery.split(
            /\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY)\b/i
          );
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (/SELECT/i.test(part)) {
              context.inSelect = true;
              context.inFrom =
                context.inWhere =
                context.inGroupBy =
                context.inOrderBy =
                  false;
            } else if (/FROM/i.test(part)) {
              context.inFrom = true;
              context.inSelect =
                context.inWhere =
                context.inGroupBy =
                context.inOrderBy =
                  false;
            } else if (/WHERE/i.test(part)) {
              context.inWhere = true;
              context.inSelect =
                context.inFrom =
                context.inGroupBy =
                context.inOrderBy =
                  false;
            } else if (/GROUP BY/i.test(part)) {
              context.inGroupBy = true;
              context.inSelect =
                context.inFrom =
                context.inWhere =
                context.inOrderBy =
                  false;
            } else if (/ORDER BY/i.test(part)) {
              context.inOrderBy = true;
              context.inSelect =
                context.inFrom =
                context.inWhere =
                context.inGroupBy =
                  false;
            }

            // Tokenize the current part based on token types
            let text = part;
            let textPos = 0;

            // Process text against all token types
            while (textPos < text.length) {
              let matched = false;

              for (const tokenType of tokenTypes) {
                tokenType.regex.lastIndex = 0;
                const match = tokenType.regex.exec(text.substring(textPos));

                if (match && match.index === 0) {
                  const value = match[0];
                  // For bareColumns, test if it's in the right context
                  if (
                    tokenType.type === "bareColumn" &&
                    tokenType.test &&
                    !tokenType.test(value, context)
                  ) {
                    continue;
                  }

                  tokens.push({
                    type: tokenType.type,
                    value: value,
                    color: tokenType.color,
                  });

                  textPos += value.length;
                  matched = true;
                  break;
                }
              }

              // If no token matched, add the character as plain text
              if (!matched) {
                tokens.push({
                  type: "text",
                  value: text[textPos],
                  color: null,
                });
                textPos++;
              }
            }
          }

          return tokens;
        };

        // Generate HTML based on tokens
        const tokens = sqlTokenizer();
        let html = "";
        for (const token of tokens) {
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
