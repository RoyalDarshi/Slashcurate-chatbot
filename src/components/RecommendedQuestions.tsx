import { memo, useCallback, useState, useEffect } from "react";
import { useTheme } from "../ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

interface RecommendedQuestion {
  question_id: string;
  question: string;
  query?: string;
  connection: string;
}

interface RecommendedQuestionsProps {
  questions: RecommendedQuestion[];
  onQuestionClick: (
    question: string,
    connection: string,
    query?: string,
  ) => void;
}

const ModernizedRecommendedQuestions = ({
  questions,
  onQuestionClick,
}: RecommendedQuestionsProps) => {
  const { theme } = useTheme();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = useCallback(
    (question: string, connection: string, query?: string) => {
      onQuestionClick(question, connection, query);
    },
    [onQuestionClick],
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 12 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full mt-6 text-left"
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <Sparkles size={14} style={{ color: theme.colors.accent }} />
        <h2
          className="text-xs font-semibold uppercase tracking-wider opacity-60"
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          Suggested Analytical Parameters
        </h2>
      </div>

      <div className="max-w-2xl">
        <ul className="flex flex-col gap-2 m-0 p-0 list-none">
          <AnimatePresence>
            {questions.map((q, idx) => (
              <motion.li
                key={q.question_id || idx}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <button
                  type="button"
                  onClick={() => handleClick(q.question, q.connection, q.query)}
                  onMouseEnter={() => setHoveredId(q.question_id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="w-full flex items-center justify-between text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 shadow-xs group"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor:
                      hoveredId === q.question_id
                        ? `${theme.colors.accent}40`
                        : theme.colors.border,
                  }}
                >
                  <span
                    className="truncate pr-4 transition-colors"
                    style={{
                      color:
                        hoveredId === q.question_id
                          ? theme.colors.accent
                          : theme.colors.text,
                    }}
                  >
                    {q.question}
                  </span>

                  <ArrowRight
                    size={14}
                    className="flex-shrink-0 transition-transform duration-200"
                    style={{
                      color: theme.colors.accent,
                      transform:
                        hoveredId === q.question_id
                          ? "translateX(4px)"
                          : "translateX(0)",
                    }}
                  />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </motion.section>
  );
};

export default memo(ModernizedRecommendedQuestions);
