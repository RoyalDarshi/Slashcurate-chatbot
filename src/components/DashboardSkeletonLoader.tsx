import React from "react";
import { useTheme } from "../ThemeContext";

interface DashboardSkeletonProps {
  question?: string;
}

const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({ question }) => {
  const { theme } = useTheme();

  return (
    <div
      className="flex flex-col h-full w-full flex-grow min-h-0 p-3 animate-pulse"
      style={{ backgroundColor: "transparent" }}
    >
      {/* Elevated Question Header Skeleton */}
      <div
        className="w-full p-4 mb-4 rounded-xl border flex items-center justify-center flex-shrink-0 min-h-[50px]"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          boxShadow:
            theme.mode === "light"
              ? "0 4px 18px -4px rgba(15,23,42,0.03)"
              : theme.shadow.sm,
        }}
      >
        <h3
          className="text-sm font-bold text-center truncate max-w-2xl"
          style={{ color: theme.colors.text }}
        >
          Question: {question || "Evaluating context criteria..."}
        </h3>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 flex-shrink-0">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }}
          />
        ))}
      </div>

      {/* Main Grid Splitting Workspace Layout Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch w-full gap-4 pb-28 lg:pb-24 flex-1 min-h-0">
        {/* Left Visualization Panel Skeleton */}
        <div
          className="lg:col-span-5 w-full rounded-2xl border p-5 flex flex-col justify-between"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
        >
          <div
            className="flex items-center justify-between mb-4 pb-2 border-b"
            style={{ borderColor: `${theme.colors.border}40` }}
          >
            <div className="h-3 w-28 rounded-md bg-slate-200/80 dark:bg-slate-800/60" />
            <div className="h-6 w-32 rounded-lg bg-slate-200/60 dark:bg-slate-800/40" />
          </div>

          {/* Mock Graph Bars Skeleton */}
          <div className="flex-1 flex items-end justify-center gap-4 px-4 py-6">
            <div className="w-10 h-32 rounded-t-lg bg-slate-200/60 dark:bg-slate-800/40" />
            <div className="w-10 h-48 rounded-t-lg bg-slate-200/70 dark:bg-slate-800/50" />
            <div className="w-10 h-24 rounded-t-lg bg-slate-200/50 dark:bg-slate-800/30" />
            <div className="w-10 h-40 rounded-t-lg bg-slate-200/60 dark:bg-slate-800/40" />
          </div>

          <div className="h-3 w-full rounded-md mt-4 bg-slate-200/50 dark:bg-slate-800/30" />
        </div>

        {/* Right Tabular/Query Control Panel Skeleton */}
        <div
          className="lg:col-span-7 w-full rounded-2xl border p-4 flex flex-col gap-3.5"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
        >
          <div
            className="flex items-center justify-between pb-2 border-b min-h-[45px]"
            style={{ borderColor: `${theme.colors.border}40` }}
          >
            <div className="h-3 w-24 rounded-md bg-slate-200/80 dark:bg-slate-800/60" />
            <div className="h-8 w-32 rounded-lg bg-slate-200/60 dark:bg-slate-800/40" />
          </div>

          {/* Dummy Rows Skeleton */}
          <div className="space-y-3 mt-2 flex-1 overflow-hidden p-3">
            {[...Array(8)].map((_, idx) => (
              <div key={idx} className="flex gap-3 items-center">
                <div className="h-3.5 w-1/4 rounded bg-slate-200/70 dark:bg-slate-800/50" />
                <div className="h-3.5 w-2/4 rounded bg-slate-200/50 dark:bg-slate-800/30" />
                <div className="h-3.5 w-1/4 rounded bg-slate-200/60 dark:bg-slate-800/40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
