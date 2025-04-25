import { memo, useCallback } from "react";
import { useTheme } from "../ThemeContext";

interface RecommendedQuestion {
  question_id: string;
  question: string;
  query?: string;
}

interface RecommendedQuestionsProps {
  questions: RecommendedQuestion[];
  onQuestionClick: (question: string, query?: string) => void;
}

const RecommendedQuestions = ({
  questions,
  onQuestionClick,
}: RecommendedQuestionsProps) => {
  const { theme } = useTheme();

  const handleClick = useCallback(
    (question: string, query?: string) => {
      onQuestionClick(question, query);
    },
    [onQuestionClick]
  );

  return (
    <section
      aria-label="Recommended Questions"
      className="w-full mt-12 mx-auto px-4"
      style={{ fontFamily: theme.typography.fontFamily }}
    >
      <h2
        className="text-2xl mb-8 tracking-tight"
        style={{
          color: theme.colors.text,
          fontWeight: theme.typography.weight.bold,
        }}
      >
        Would you like to ask your frequently asked questions?
      </h2>
      {questions.length === 0 ? (
        <p
          className="text-base"
          style={{
            color: theme.colors.textSecondary,
            fontWeight: theme.typography.weight.normal,
          }}
        >
          No recommended questions are available at this time.
        </p>
      ) : (
        <ul
          className="grid gap-3 w-full"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          }}
        >
          {questions.map((q) => (
            <li key={q.question_id}>
              <button
                className="w-full flex items-center p-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 hover:shadow-md transform hover:-translate-y-0.5"
                style={{
                  background: theme.colors.surface,
                  color: theme.colors.text,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.default,
                  boxShadow: theme.shadow.sm,
                  transition: theme.transition.default,
                }}
                onClick={() => handleClick(q.question, q.query)}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = theme.colors.hover;
                  e.currentTarget.style.borderColor = theme.colors.accent;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = theme.colors.surface;
                  e.currentTarget.style.borderColor = theme.colors.border;
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.accent}40`;
                  e.currentTarget.style.borderColor = theme.colors.accent;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = theme.shadow.sm;
                  e.currentTarget.style.borderColor = theme.colors.border;
                }}
                aria-label={`Ask: ${q.question}`}
              >
                <span
                  className="text-base font-medium truncate"
                  style={{
                    color: theme.colors.text,
                    fontWeight: theme.typography.weight.medium,
                  }}
                  title={q.question}
                >
                  {q.question}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default memo(RecommendedQuestions);
