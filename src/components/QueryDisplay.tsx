import React, { useMemo } from "react";
import { useTheme } from "../ThemeContext";

interface QueryDisplayProps {
  query: string | object | null;
  title?: string;
  language?: string;
}

const QueryDisplay: React.FC<QueryDisplayProps> = React.memo(
  ({ query, title, language = "sql" }) => {
    const { theme } = useTheme();

    const formattedQuery = useMemo(() => {
      if (typeof query === "string") {
        return query;
      } else if (typeof query === "object" && query !== null) {
        try {
          return JSON.stringify(query, null, 2);
        } catch (error) {
          console.error("Error formatting query:", error);
          return String(query);
        }
      }
      return "";
    }, [query]);

    const colorizedQuery = useMemo(() => {
      if (formattedQuery && typeof formattedQuery === "string") {
        if (language === "sql") {
          // Improved regex patterns
          const keywords =
            /\b(SELECT|FROM|WHERE|AND|OR|INSERT|UPDATE|DELETE|JOIN|LEFT|RIGHT|INNER|OUTER|GROUP\s+BY|ORDER\s+BY|LIMIT|OFFSET|AS|ON|DISTINCT|COUNT|AVG|SUM|MIN|MAX)\b/gi;
          const columns =
            /\b([a-zA-Z_][a-zA-Z0-9_]*)\b(?=\s*(?:,|\s+FROM|\s+WHERE|\s+AND|\s+OR|\s*\)))/gi;
          const tables =
            /\b([a-zA-Z_][a-zA-Z0-9_]*)\b(?=\s+(?:FROM|JOIN|UPDATE|DELETE)(?:\s|$))/gi;
          const strings = /'([^']*)'/g;
          const numbers = /\b\d+\b/g;

          // Escape special characters first to prevent HTML issues
          let escapedQuery = formattedQuery
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

          // Apply replacements in a specific order to avoid overlap
          let coloredQuery = escapedQuery;

          // Strings first (highest specificity)
          coloredQuery = coloredQuery.replace(
            strings,
            `<span style="color: ${theme.colors.warning};">'$1'</span>`
          );

          // Numbers
          coloredQuery = coloredQuery.replace(
            numbers,
            `<span style="color: ${theme.colors.error};">$&</span>`
          );

          // Keywords (avoid overlapping with columns/tables)
          coloredQuery = coloredQuery.replace(
            keywords,
            `<span style="color: ${theme.colors.accent};">$1</span>`
          );

          // Tables (after keywords to avoid overlap)
          coloredQuery = coloredQuery.replace(tables, (match, p1) =>
            keywords.test(match)
              ? match
              : `<span style="color: ${theme.colors.accent};">${p1}</span>`
          );

          // Columns (last, to avoid overlap with tables)
          coloredQuery = coloredQuery.replace(columns, (match, p1) =>
            keywords.test(match) || tables.test(match)
              ? match
              : `<span style="color: ${theme.colors.success};">${p1}</span>`
          );

          console.log("Colorized Query:", coloredQuery); // Debug output

          return <span dangerouslySetInnerHTML={{ __html: coloredQuery }} />;
        }
        return <span>{formattedQuery}</span>;
      }
      return null;
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
              style={{ backgroundColor: theme.colors.surface }}
            >
              <code>{colorizedQuery}</code>
            </pre>
          </div>
        ) : (
          <div className="italic" style={{ color: theme.colors.textSecondary }}>
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
    prevProps.language === nextProps.language
  );
};

export default React.memo(QueryDisplay, areEqual);
