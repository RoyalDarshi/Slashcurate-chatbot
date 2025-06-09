import React from "react";
import {
  Activity,
  BarChartIcon as BarChartIconLucide,
  ChevronLeft,
  ChevronRight,
  Database,
  HelpCircle,
  LineChartIcon,
  PieChartIcon as PieChartIconLucide,
  RotateCcw,
  Table,
  TrendingUp,
} from "lucide-react";
import KPICard from "./KPICard";
import DynamicBarGraph from "./Graphs/DynamicBarGraph";
import DataTable from "./DataTable";
import QueryDisplay from "./QueryDisplay";

// Placeholder for generateKpiData and generateMainViewData types if not defined elsewhere
// For now, using any, but ideally these would be properly typed.
declare function generateKpiData(): {
  kpi1: { label: string; value: string | number; change: string };
  kpi2: { label: string; value: string | number; change: string };
  kpi3: { label: string; value: string | number; change: string };
};
declare function generateMainViewData(): {
  chartData: any; // Replace with actual chart data type
  tableData: any; // Replace with actual table data type
  queryData: string;
};

interface DashboardViewProps {
  dashboardItem: {
    id: string;
    question: string;
    kpiData: ReturnType<typeof generateKpiData>;
    mainViewData: ReturnType<typeof generateMainViewData>;
    textualSummary: string;
    lastViewType?: "graph" | "table" | "query";
  } | null;
  theme: any; // Replace with your actual theme type
  isSubmitting: boolean;
  activeViewType: "graph" | "table" | "query";
  onViewTypeChange: (viewType: "graph" | "table" | "query") => void;
  onNavigateHistory: (direction: "prev" | "next") => void;
  historyIndex: number;
  historyLength: number;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  dashboardItem,
  theme,
  isSubmitting,
  activeViewType,
  onViewTypeChange,
  onNavigateHistory,
  historyIndex,
  historyLength,
}) => {
  if (!dashboardItem) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full p-4"
        style={{ backgroundColor: theme.colors.background }}
      >
        <HelpCircle
          size={48}
          style={{ color: theme.colors.textSecondary }}
          className="mb-3"
        />
        <h2
          className="text-xl font-semibold"
          style={{ color: theme.colors.text }}
        >
          Dashboard is ready
        </h2>
        <p
          className="mt-1 text-center"
          style={{ color: theme.colors.textSecondary }}
        >
          Ask a question below to populate the dashboard with insights.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full p-2"
      style={{ backgroundColor: theme.colors.background }}
    >
      {/* Top section: Current Question and KPI Cards */}
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
            Question: {dashboardItem.question}
          </h3>
        </div>
      </div>

      {/* Main Content Area: Graph on left, Table/Query on right */}
      <div className="flex flex-col lg:flex-row gap-2 flex-grow overflow-hidden">
        {/* Graph Section */}
        <div
          className="flex-1 rounded-xl shadow-lg flex justify-center items-center overflow-hidden"
          style={{
            backgroundColor: theme.colors.surface,
            boxShadow: theme.shadow.lg,
            borderRadius: theme.borderRadius.large,
            minHeight: "400px", // ensure height for graph
          }}
        >
          <DynamicBarGraph
            data={dashboardItem.mainViewData.chartData}
            isValidGraph={() => true}
          />
        </div>

        {/* Right Section: KPI Cards + Table/Query */}
        <div className="flex flex-col lg:w-[40%] w-full overflow-hidden">
          {/* KPI Cards */}
          <div className="grid m-2 grid-cols-3 gap-2">
            <KPICard
              title={dashboardItem.kpiData.kpi1.label}
              value={dashboardItem.kpiData.kpi1.value}
              change={dashboardItem.kpiData.kpi1.change}
              icon={
                <TrendingUp size={24} style={{ color: theme.colors.accent }} />
              }
              theme={theme}
            />
            <KPICard
              title={dashboardItem.kpiData.kpi2.label}
              value={dashboardItem.kpiData.kpi2.value}
              change={dashboardItem.kpiData.kpi2.change}
              icon={
                <BarChartIconLucide
                  size={24}
                  style={{ color: theme.colors.accent }}
                />
              }
              theme={theme}
            />
            <KPICard
              title={dashboardItem.kpiData.kpi3.label}
              value={dashboardItem.kpiData.kpi3.value}
              change={dashboardItem.kpiData.kpi3.change}
              icon={
                <PieChartIconLucide
                  size={24}
                  style={{ color: theme.colors.accent }}
                />
              }
              theme={theme}
            />
          </div>

          {/* Table/Query Section */}
          <div
            className="flex-1 overflow-y-auto m-2 rounded-xl"
            style={{
              backgroundColor: theme.colors.surface,
              boxShadow: theme.shadow.lg,
              borderRadius: theme.borderRadius.large,
              minHeight: "300px", // optional min height
              maxHeight: "100%", // limits table height
            }}
          >
            {activeViewType === "table" && (
              <div className="p-2">
                <DataTable data={dashboardItem.mainViewData.tableData} />
              </div>
            )}
            {activeViewType === "query" && (
              <div className="p-6">
                <QueryDisplay
                  query={dashboardItem.mainViewData.queryData}
                  fontSize="text-base"
                />
              </div>
            )}
          </div>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex flex-row self-start lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 flex-shrink-0 mt-4 lg:mt-0 justify-center">
          {(["table", "query"] as const).map((viewType) => (
            <button
              key={viewType}
              onClick={() => onViewTypeChange(viewType)}
              disabled={isSubmitting}
              title={viewType.charAt(0).toUpperCase() + viewType.slice(1)}
              className="p-2 rounded-full transition-all duration-200 ease-in-out disabled:opacity-60"
              style={{
                backgroundColor:
                  activeViewType === viewType
                    ? theme.colors.accent
                    : theme.colors.bubbleBot,
                color:
                  activeViewType === viewType
                    ? "white"
                    : theme.colors.bubbleBotText,
                boxShadow: theme.shadow.md,
                borderRadius: theme.borderRadius.large,
              }}
            >
              {viewType === "table" && <Table size={24} />}
              {viewType === "query" && <Database size={24} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
