import { memo, useCallback, useState, useEffect } from "react";
import { useTheme } from "../ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

interface RecommendedQuestion {
  question_id: string;
  question: string;
  query?: string;
  connection: string;
}

interface RecommendedQuestionsProps {
  questions: RecommendedQuestion[];
  onQuestionClick: (question: string,connection:string, query?: string) => void;
}

const ModernizedRecommendedQuestions = ({
  questions,
  onQuestionClick,
}: RecommendedQuestionsProps) => {
  const { theme } = useTheme();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Animation to fade in the component when it mounts
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = useCallback(
    (question: string, connection: string, query?: string) => {
      onQuestionClick(question, connection, query);
    },
    [onQuestionClick]
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      aria-label="Recommended Questions"
      className="w-full mt-12 mx-auto px-4"
      style={{ fontFamily: theme.typography.fontFamily }}
    >
      {questions.length > 0 && (
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-2xl mb-8 tracking-tight"
          style={{
            color: theme.colors.text,
            fontWeight: theme.typography.weight.bold,
          }}
        >
          Would you like to ask your frequently asked questions?
        </motion.h2>
      )}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <ul
          className="grid gap-4 w-full"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          }}
        >
          <AnimatePresence>
            {questions.map((q, index) => (
              <motion.li
                key={q.question_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.02 }}
              >
                <motion.button
                  className="w-full flex items-center p-5 rounded-lg focus:outline-none"
                  style={{
                    background:
                      hoveredId === q.question_id
                        ? theme.colors.hover
                        : theme.colors.surface,
                    color: theme.colors.text,
                    border: `1px solid ${
                      hoveredId === q.question_id
                        ? theme.colors.accent
                        : theme.colors.border
                    }`,
                    borderRadius: theme.borderRadius.default,
                    boxShadow:
                      hoveredId === q.question_id
                        ? theme.shadow.md
                        : theme.shadow.sm,
                    transition: theme.transition.default,
                  }}
                  onClick={() => handleClick(q.question, q.connection, q.query)}
                  onMouseEnter={() => setHoveredId(q.question_id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(q.question_id)}
                  onBlur={() => setHoveredId(null)}
                  aria-label={`Ask: ${q.question}`}
                >
                  <div className="flex items-center w-full">
                    <motion.span
                      className={`text-base truncate flex-grow ${
                        hoveredId === q.question_id ? "font-medium" : ""
                      }`}
                      style={{
                        color:
                          hoveredId === q.question_id
                            ? theme.colors.accent
                            : theme.colors.text,
                        fontWeight:
                          hoveredId === q.question_id
                            ? theme.typography.weight.medium
                            : theme.typography.weight.normal,
                      }}
                      title={q.question}
                    >
                      {q.question}
                    </motion.span>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        opacity: hoveredId === q.question_id ? 1 : 0,
                        scale: hoveredId === q.question_id ? 1 : 0.8,
                      }}
                      transition={{ duration: 0.2 }}
                      className="ml-2 flex-shrink-0"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={theme.colors.accent}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </motion.div>
                  </div>
                </motion.button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </motion.div>
    </motion.section>
  );
};

export default memo(ModernizedRecommendedQuestions);
