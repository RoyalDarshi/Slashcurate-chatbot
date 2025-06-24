import React, { useState, useEffect, useRef } from 'react';

interface SummaryModalProps {
  summaryText: string;
  onClose: () => void;
  theme: any; // Assuming theme is passed for styling
}

const SummaryModal: React.FC<SummaryModalProps> = ({ summaryText, onClose, theme }) => {
  const [displayedText, setDisplayedText] = useState('');
  // useRef to hold the interval ID, ensuring it's stable across renders
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  console.log('SummaryModal rendered with summaryText:', summaryText);

  useEffect(() => {
    // Clear any existing interval when summaryText changes or component unmounts
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null; // Reset the ref
    }

    setDisplayedText(''); // Always reset displayed text when summaryText changes

    // Ensure summaryText is a valid string before starting the animation
    if (!summaryText || typeof summaryText !== 'string') {
      return;
    }

    let currentIdx = 0;
    // Store the new interval ID in the ref
    intervalRef.current = setInterval(() => {
      // Only append if there are still characters left in the summaryText
      if (currentIdx < summaryText.length) {
        setDisplayedText((prev) => prev + summaryText[currentIdx]);
        currentIdx += 1;
      } else {
        // All characters displayed, clear the interval and reset the ref
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 1); // Typing speed: 1 milliseconds per character (faster)

    // Cleanup function: This runs when the component unmounts OR when summaryText changes
    // It ensures that the current interval is cleared properly.
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [summaryText]); // Re-run effect only when summaryText changes

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
          {displayedText}
        </p>
      </div>
    </div>
  );
};

export default SummaryModal;
