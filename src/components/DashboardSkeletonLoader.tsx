import React from "react";
import { useTheme } from "../ThemeContext";

interface DashboardSkeletonProps {
 question?: string;
}

const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({question}) => {
    const {theme}= useTheme();
  return (
    <div
      className="flex flex-col h-full p-2"
      style={{ backgroundColor: theme.colors.background }}
    >
      {/* Question Section Skeleton */}
      <div className="l lg:flex-row items-start">
        {/* Current Question - made full width and uses theme colors */}
        <div
          className="w-full p-2 mb-2 rounded-xl shadow-md" // Added w-full here
          style={{
            backgroundColor: theme.colors.surface, // Using surface for question background
            color: theme.colors.text, // Using text for question color
            boxShadow: theme.shadow.md, // Using theme shadow
            borderRadius: theme.borderRadius.large, // Using theme border radius
          }}
        >
          <h3
            className="text-xl font-bold text-center"
            style={{ color: theme.colors.text }}
          >
            Question: {question}
          </h3>
        </div>
      </div>

      {/* Main Content Area Skeleton */}
      <div className="flex flex-col lg:flex-row gap-2 flex-grow overflow-hidden">
        {/* Graph Section Skeleton */}
        <div
          className="flex-1 rounded-xl shadow-lg flex justify-center items-center overflow-hidden"
          style={{
            backgroundColor: theme.colors.surface,
            boxShadow: theme.shadow.lg,
            borderRadius: theme.borderRadius.large,
            minHeight: "400px",
          }}
        >
          {/* Graph skeleton */}
          <div className="w-full h-full p-6 flex flex-col justify-end">
            <div className="flex items-end justify-between h-64 space-x-3">
              {/* Bar chart skeleton */}
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t"
                  style={{
                    backgroundColor: theme.colors.textSecondary + "30",
                    height: `${Math.random() * 60 + 40}%`,
                  }}
                ></div>
              ))}
            </div>
            {/* X-axis labels skeleton */}
            <div className="flex justify-between mt-3 space-x-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-3 rounded flex-1"
                  style={{ backgroundColor: theme.colors.textSecondary + "40" }}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section: KPI Cards + Table/Query Skeleton */}
        <div className="flex flex-col lg:w-[40%] w-full overflow-hidden">
          {/* KPI Cards Skeleton */}
          <div className="grid m-2 grid-cols-3 gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-3 rounded-xl shadow-md"
                style={{
                  backgroundColor: theme.colors.surface,
                  boxShadow: theme.shadow.md,
                  borderRadius: theme.borderRadius.large,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-6 h-6 rounded"
                    style={{
                      backgroundColor: theme.colors.textSecondary + "40",
                    }}
                  ></div>
                </div>
                <div
                  className="h-4 bg-gray-300 rounded mb-2 w-3/4"
                  style={{ backgroundColor: theme.colors.textSecondary + "40" }}
                ></div>
                <div
                  className="h-6 bg-gray-300 rounded mb-1 w-1/2"
                  style={{ backgroundColor: theme.colors.textSecondary + "30" }}
                ></div>
                <div
                  className="h-3 bg-gray-300 rounded w-1/3"
                  style={{ backgroundColor: theme.colors.textSecondary + "40" }}
                ></div>
              </div>
            ))}
          </div>

          {/* Table/Query Section Skeleton */}
          <div
            className="flex-1 overflow-y-auto m-2 rounded-xl p-4"
            style={{
              backgroundColor: theme.colors.surface,
              boxShadow: theme.shadow.lg,
              borderRadius: theme.borderRadius.large,
              minHeight: "300px",
              maxHeight: "100%",
            }}
          >
            {/* Table header skeleton */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-4 rounded"
                  style={{ backgroundColor: theme.colors.textSecondary + "40" }}
                ></div>
              ))}
            </div>

            {/* Table rows skeleton */}
            {[...Array(8)].map((_, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-4 gap-4 mb-3">
                {[...Array(4)].map((_, colIndex) => (
                  <div
                    key={colIndex}
                    className="h-3 rounded"
                    style={{
                      backgroundColor: theme.colors.textSecondary + "30",
                    }}
                  ></div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* View Toggle Buttons Skeleton */}
        <div className="flex flex-row self-start lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 flex-shrink-0 mt-4 lg:mt-0 justify-center">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="w-12 h-12 rounded-full"
              style={{
                backgroundColor: theme.colors.bubbleBot,
                boxShadow: theme.shadow.md,
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
