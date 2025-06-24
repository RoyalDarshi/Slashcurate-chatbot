import React from 'react';

interface SummaryModalProps {
  summaryText: string;
  onClose: () => void;
  theme: any; // Assuming theme is passed for styling
}

const SummaryModal: React.FC<SummaryModalProps> = ({ summaryText, onClose, theme }) => {
  return (
    <div
      className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose} // Close modal when clicking outside
    >
      <div
        className="relative rounded-xl shadow-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
        style={{
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
          boxShadow: theme.shadow.xl,
          borderRadius: theme.borderRadius.large,
        }}
        onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
      >
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
          onClick={onClose}
        >
          &times;
        </button>
        <h2
          className="text-2xl font-bold mb-4"
          style={{ color: theme.colors.text }}
        >
          Graph Summary
        </h2>
        <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: theme.colors.text }}>
          {summaryText}
        </p>
      </div>
    </div>
  );
};

export default SummaryModal;
