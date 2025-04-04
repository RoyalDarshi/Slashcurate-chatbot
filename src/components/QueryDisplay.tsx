import React, { useMemo } from "react";
import { useTheme } from "../ThemeContext"; 

interface QueryDisplayProps {
  query: string | object | null;
  title?: string;
  language?: string;
}

const QueryDisplay: React.FC<QueryDisplayProps> = ({
  query,
  title,
  language = "sql",
}) => {
  const {theme} = useTheme(); // Use the theme context

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

  const colorizeQuery = (query: string) => {
    if (language === "sql") {
      const keywords =
        /\b(SELECT|FROM|WHERE|AND|OR|INSERT|UPDATE|DELETE|JOIN|LEFT|RIGHT|INNER|OUTER|GROUP BY|ORDER BY|LIMIT|OFFSET|AS|ON|DISTINCT|COUNT|AVG|SUM|MIN|MAX)\b/gi;
      const columns =
        /\b([a-zA-Z_][a-zA-Z0-9_]*)\b(?=\s*(?:,|\s+FROM|WHERE|AND|OR))/gi;
      const tables =
        /\b([a-zA-Z_][a-zA-Z0-9_]*)\b(?=\s+(?:FROM|JOIN|UPDATE|DELETE))/gi;
      const strings = /'([^']*)'/g;
      const numbers = /\b\d+\b/g;

      let coloredQuery = query.replace(
        keywords,
        `<span style="color: ${theme.colors.accent};">$1</span>`
      );
      coloredQuery = coloredQuery.replace(
        columns,
        `<span style="color: ${theme.colors.success};">$1</span>`
      );
      coloredQuery = coloredQuery.replace(
        tables,
        `<span style="color: ${theme.colors.accent};">$1</span>`
      );
      coloredQuery = coloredQuery.replace(
        strings,
        `<span style="color: ${theme.colors.warning};">'$1'</span>`
      );
      coloredQuery = coloredQuery.replace(
        numbers,
        `<span style="color: ${theme.colors.error};">$1</span>`
      );

      return <span dangerouslySetInnerHTML={{ __html: coloredQuery }} />;
    }
    return <span>{query}</span>;
  };

  return (
    <div
      style={{
        backgroundColor: theme.colors.surface,
      }}
    >
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
            <code>{colorizeQuery(formattedQuery)}</code>
          </pre>
        </div>
      ) : (
        <div className="italic" style={{ color: theme.colors.textSecondary }}>
          No query to display.
        </div>
      )}
    </div>
  );
};

export default QueryDisplay;
