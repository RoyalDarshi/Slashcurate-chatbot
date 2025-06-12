import React, { useCallback } from "react";
import { X } from "lucide-react";
import { Theme } from "../types";
import { Message } from "../types"; // Import necessary types

// Define the props for the PreviousQuestionsModal component
interface PreviousQuestionsModalProps {
  showPrevQuestionsModal: boolean;
  onClose: () => void;
  userQuestionsFromSession: Message[];
  handleSelectPrevQuestion: (questionContent: string) => void;
  theme: Theme;
}

const PreviousQuestionsModal: React.FC<PreviousQuestionsModalProps> = ({
  showPrevQuestionsModal,
  onClose,
  userQuestionsFromSession,
  handleSelectPrevQuestion,
  theme,
}) => {
  if (!showPrevQuestionsModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <style>
        {`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }

        .animate-slide-up {
          animation: slideUp 0.3s ease-out forwards;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        `}
      </style>
      <div
        className={`rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col transform transition-all duration-300 animate-slide-up`}
        style={{
          backgroundColor: theme.colors.surface,
          boxShadow: theme.shadow.xl,
          borderRadius: theme.borderRadius.large, // Use large border radius for a softer look
          fontFamily: theme.typography.fontFamily,
        }}
      >
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: theme.colors.border }}
        >
          <h3
            className={`font-semibold`}
            style={{
              color: theme.colors.text,
              fontSize: theme.typography.size.lg,
            }}
          >
            Previous Questions
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2`}
            style={{
              color: theme.colors.textSecondary,
              backgroundColor: theme.colors.surface,
              transition: theme.transition.default,
              boxShadow: theme.shadow.xs,
              borderColor: theme.colors.border,
            }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-2">
          {userQuestionsFromSession.length > 0 ? (
            userQuestionsFromSession.map((msg) => (
              <button
                key={msg.id}
                onClick={() => handleSelectPrevQuestion(msg.content)}
                className={`w-full text-left p-2.5 rounded-md transition-all duration-200 text-sm
                hover:opacity-90 focus:outline-none focus:ring-2`}
                style={{
                  backgroundColor: theme.colors.bubbleBot,
                  color: theme.colors.bubbleBotText,
                  borderRadius: theme.borderRadius.default,
                  boxShadow: theme.shadow.xs,
                  fontSize: theme.typography.size.sm,
                  fontWeight: theme.typography.weight.normal,
                  transition: theme.transition.default,
                  borderColor: theme.colors.border,
                }}
              >
                {msg.content}
              </button>
            ))
          ) : (
            <p
              className="text-center py-4"
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.base,
              }}
            >
              No previous questions in this session.
            </p>
          )}
        </div>
        <div
          className="p-3 border-t flex justify-end"
          style={{ borderColor: theme.colors.border }}
        >
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200
            hover:opacity-90 focus:outline-none focus:ring-2`}
            style={{
              backgroundColor: theme.colors.accent, // Use accent for primary action
              color: theme.colors.surface,
              borderRadius: theme.borderRadius.default,
              boxShadow: theme.shadow.sm,
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.medium,
              transition: theme.transition.default,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviousQuestionsModal;
