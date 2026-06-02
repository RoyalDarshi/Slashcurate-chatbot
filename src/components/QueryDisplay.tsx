import React, { useMemo, useState } from "react";
import { useTheme } from "../ThemeContext";
import { Copy, Check, Code, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { copyToClipboard } from "../utils";
import CustomTooltip from "./CustomTooltip";

interface QueryDisplayProps {
  query: string | object | null | undefined;
  title?: string;
  language?: string;
  fontSize: string;
  flat?: boolean;
}

const QueryDisplay: React.FC<QueryDisplayProps> = React.memo(
  ({ query, title, language = "sql", fontSize, flat = false }) => {
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
            "gi",
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
                    processToken(currentToken, keywordPattern, theme),
                  );
                  currentToken = "";
                }
                state = "identifier";
                currentToken = char;
              } else if (char === "'") {
                if (currentToken) {
                  tokens.push(
                    processToken(currentToken, keywordPattern, theme),
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
                    processToken(currentToken, keywordPattern, theme),
                  );
                  currentToken = "";
                }
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
              } else if (/[a-zA-Z_][a-zA-Z0-9_]*\(/.test(currentToken + char)) {
                const fnName = currentToken;
                tokens.push({
                  type: "function",
                  value: fnName,
                  color: theme.colors.warning,
                });
                tokens.push({
                  type: "operator",
                  value: "(",
                  color: theme.colors.accent,
                });
                currentToken = "";
                i++;
                continue;
              } else if (/[.,;()=<>!+\-*/%]/.test(char)) {
                if (currentToken) {
                  tokens.push(
                    processToken(currentToken, keywordPattern, theme),
                  );
                  currentToken = "";
                }
                tokens.push({ type: "operator", value: char, color: null });
              } else if (/\s/.test(char)) {
                if (currentToken) {
                  tokens.push(
                    processToken(currentToken, keywordPattern, theme),
                  );
                  currentToken = "";
                }
                tokens.push({ type: "whitespace", value: char, color: null });
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
          if (currentToken)
            tokens.push(processToken(currentToken, keywordPattern, theme));
          return tokens;
        };

        const processToken = (
          token: string,
          keywordPattern: RegExp,
          theme: any,
        ) => {
          if (keywordPattern.test(token.toUpperCase())) {
            return {
              type: "keyword",
              value: token,
              color: theme.colors.accent,
            };
          } else if (/^\d+(\.\d+)?$/.test(token)) {
            return { type: "number", value: token, color: theme.colors.error };
          } else if (/^[a-zA-Z_][a-zA-Z0-9_]*\($/.test(token)) {
            return {
              type: "function",
              value: token,
              color: theme.colors.warning,
            };
          } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
            return {
              type: "identifier",
              value: token,
              color: theme.colors.success,
            };
          } else {
            return { type: "text", value: token, color: null };
          }
        };

        const processTokens = (tokens: any[]) => {
          let inFrom = false;
          const isTableReference = (index: number) => {
            if (inFrom)
              return (
                tokens[index].type === "identifier" ||
                tokens[index].type === "quotedIdentifier"
              );
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
              if (upperValue === "FROM" || upperValue === "JOIN") inFrom = true;
              else if (
                ["WHERE", "GROUP", "ORDER", "HAVING", "LIMIT", "ON"].includes(
                  upperValue,
                )
              )
                inFrom = false;
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
            const opacity = [
              "identifier",
              "table",
              "quotedIdentifier",
            ].includes(token.type)
              ? "0.75"
              : ["string", "number", "function"].includes(token.type)
                ? "0.85"
                : ["keyword"].includes(token.type)
                  ? "0.9"
                  : "1";
            html += `<span style="color: ${token.color}; opacity: ${opacity};">${token.value}</span>`;
          } else {
            html += `<span style="opacity: 0.75">${token.value}</span>`;
          }
        }
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
      }
      return <span>{formattedQuery}</span>;
    }, [formattedQuery, language, theme.colors]);

    const getLanguageIcon = () => {
      switch (language.toLowerCase()) {
        case "sql":
          return <Database size={14} />;
        default:
          return <Code size={14} />;
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full flex flex-col group my-2"
      >
        {formattedQuery ? (
          <div
            className={`flex flex-col relative overflow-hidden transition-all duration-300 ${flat ? "" : "rounded-xl"}`}
            style={{
              backgroundColor: flat
                ? "transparent"
                : theme.mode === "light"
                  ? "rgba(15, 23, 42, 0.03)"
                  : "rgba(255, 255, 255, 0.04)",
            }}
          >
            {/* Integrated Toolbar */}
            <div
              className="flex items-center justify-between px-4 py-2"
              style={{
                backgroundColor: flat
                  ? "transparent"
                  : theme.mode === "light"
                    ? "rgba(15, 23, 42, 0.02)"
                    : "rgba(255, 255, 255, 0.02)",
              }}
            >
              <div className="flex items-center gap-2">
                <div style={{ color: theme.colors.accent, opacity: 0.8 }}>
                  {getLanguageIcon()}
                </div>
                {title && (
                  <span
                    className="text-xs font-medium tracking-wide"
                    style={{ color: theme.colors.text, opacity: 0.9 }}
                  >
                    {title}
                  </span>
                )}
                <span
                  className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ml-1"
                  style={{
                    backgroundColor:
                      theme.mode === "light"
                        ? "rgba(15, 23, 42, 0.04)"
                        : "rgba(255, 255, 255, 0.05)",
                    color: theme.colors.textSecondary,
                  }}
                >
                  {language}
                </span>
              </div>
              <div className="transition-opacity duration-200">
                <CopyButton query={formattedQuery} />
              </div>
            </div>

            {/* Query Content */}
            <pre
              className="px-4 py-3 m-0 overflow-x-auto whitespace-pre-wrap font-mono custom-scrollbar"
              style={{
                fontSize: fontSize || "13px",
                lineHeight: "1.7",
                color:
                  theme.mode === "light"
                    ? "rgba(15, 23, 42, 0.85)"
                    : "rgba(255, 255, 255, 0.85)",
              }}
            >
              <code className="block w-full">
                {colorizedQuery || formattedQuery}
              </code>
            </pre>
          </div>
        ) : (
          <div
            className="flex items-center justify-center p-6 rounded-xl border border-dashed transition-colors duration-300"
            style={{
              borderColor:
                theme.mode === "light"
                  ? "rgba(15, 23, 42, 0.1)"
                  : "rgba(255, 255, 255, 0.1)",
              backgroundColor:
                theme.mode === "light"
                  ? "rgba(15, 23, 42, 0.01)"
                  : "rgba(255, 255, 255, 0.01)",
            }}
          >
            <div className="text-center opacity-40">
              <Code
                size={20}
                className="mx-auto mb-2"
                style={{ color: theme.colors.textSecondary }}
              />
              <p
                className="italic text-xs font-medium tracking-wide"
                style={{ color: theme.colors.textSecondary }}
              >
                No active query
              </p>
            </div>
          </div>
        )}
      </motion.div>
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
    prevProps.fontSize === nextProps.fontSize &&
    prevProps.flat === nextProps.flat
  );
};

export default React.memo(QueryDisplay, areEqual);

const CopyButton = ({ query }: { query: string }) => {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [canCopy, setCanCopy] = useState(true);

  const handleCopy = () => {
    if (!canCopy) return;
    setCanCopy(false);

    copyToClipboard(query).then((success) => {
      if (success) {
        setCopied(true);
      }
      setTimeout(() => {
        setCopied(false);
        setCanCopy(true);
      }, 2000);
    });
  };

  return (
    <CustomTooltip title={copied ? "Copied" : "Copy"} position="left">
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-md transition-all duration-200 hover:bg-slate-500/10 active:scale-95 flex items-center justify-center"
        style={{
          color: copied ? theme.colors.success : theme.colors.textSecondary,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.div
              key="check"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Check size={14} strokeWidth={2.5} />
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Copy size={14} strokeWidth={2} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </CustomTooltip>
  );
};
