import React from "react";
import { TriangleAlert } from "lucide-react"; // Using Lucide icon for alerts
import { Theme } from "../types";

interface DashboardErrorProps {
  question: string;
  errorMessage: string;
  theme: Theme; // Assuming theme prop will be passed from ChatInterface
}

const DashboardError: React.FC<DashboardErrorProps> = ({
  question,
  errorMessage,
  theme,
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center h-full p-4 text-center rounded-xl shadow-lg m-4"
      style={{
        backgroundColor: theme.colors.surface,
        color: theme.colors.text,
        boxShadow: theme.shadow.lg,
      }}
    >
      <TriangleAlert
        size={48}
        className="mb-4"
        style={{ color: theme.colors.error }}
      />
      <h2
        className="text-2xl font-bold mb-2"
        style={{ color: theme.colors.error }}
      >
        Dashboard Error
      </h2>
      <p className="text-lg mb-4" style={{ color: theme.colors.textSecondary }}>
        Sorry, something went wrong while processing your request.
      </p>
      <div
        className="p-4 rounded-md w-full max-w-md"
        style={{
          backgroundColor: `${theme.colors.error}10`, // Light tint of error color
          border: `1px solid ${theme.colors.error}`,
          color: theme.colors.error,
        }}
      >
        <p className="font-semibold mb-2">Your Question:</p>
        <p className="italic mb-2 break-words">"{question}"</p>
        <p className="font-semibold mt-4">Error Details:</p>
        <p className="break-words">{errorMessage}</p>
      </div>
    </div>
  );
};

export default DashboardError;
