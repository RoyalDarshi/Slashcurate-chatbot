import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import {
  BarChartIcon as BarChartIconLucide,
  Database,
  HelpCircle,
  PieChartIcon as PieChartIconLucide,
  Table,
  TrendingUp,
  Heart, // Import Star icon for favoriting
  ScatterChartIcon as ScatterChartIconLucide, // Import ScatterChartIcon
  AreaChart as AreaChartIconLucide, // Import AreaChartIcon
  Snowflake as RadarChartIconLucide, // Import RadarChartIcon
  List as FunnelChartIconLucide, // Import FunnelChartIcon (using List for now)
} from "lucide-react";
import KPICard from "./KPICard";
import DynamicBarGraph from "./Graphs/DynamicBarGraph";
import DynamicLineGraph from "./Graphs/DynamicLineGraph";
import DynamicPieGraph from "./Graphs/DynamicPieGraph";
import DynamicScatterGraph from "./Graphs/DynamicScatterGraph";
import DynamicAreaGraph from "./Graphs/DynamicAreaGraph";
import DynamicRadarGraph from "./Graphs/DynamicRadarGraph";
import DynamicFunnelGraph from "./Graphs/DynamicFunnelGraph";
import DataTable from "./DataTable";
import QueryDisplay from "./QueryDisplay";
import { Theme } from "../types";
import { useTheme } from "../ThemeContext";
import SummaryModal from "./SummaryModal";

// Placeholder types (unchanged)
declare function generateKpiData(): {
  kpi1: { label: string; value: string | number; change: string };
  kpi2: { label: string; value: string | number; change: string };
  kpi3: { label: string; value: string | number; change: string };
};
declare function generateMainViewData(): {
  chartData: any;
  tableData: any;
  queryData: string;
};

// Define the handle interface for DashboardView
export interface DashboardViewHandle {
  getGraphContainer: () => HTMLDivElement | null;
}

interface DashboardViewProps {
  dashboardItem: {
    id: string; // Dashboard item's unique ID
    question: string;
    kpiData: ReturnType<typeof generateKpiData>;
    mainViewData: ReturnType<typeof generateMainViewData>;
    textualSummary: string;
    lastViewType?: "graph" | "table" | "query";
    isFavorited: boolean; // Indicates if the question message for this item is favorited
    questionMessageId: string; // The actual message ID from the backend
    connectionName: string; // The connection associated with this dashboard item
  } | null;
  theme: Theme;
  isSubmitting: boolean;
  activeViewType: "graph" | "table" | "query";
  onViewTypeChange: (viewType: "graph" | "table" | "query") => void;
  onNavigateHistory: (direction: "prev" | "next") => void;
  historyIndex: number;
  historyLength: number;
  // New prop for handling favorite toggle
  onToggleFavorite: (
    questionMessageId: string, // Pass the actual message ID
    questionContent: string,
    responseQuery: string,
    currentConnection: string,
    isCurrentlyFavorited: boolean
  ) => Promise<void>;
  currentConnection: string; // Current active connection name
  graphSummary: string | null; // New prop to receive summarized graph text
}

const DashboardView = forwardRef<DashboardViewHandle, DashboardViewProps>(
  (
    {
      dashboardItem,
      theme,
      isSubmitting,
      activeViewType,
      onViewTypeChange,
      onToggleFavorite,
      currentConnection,
      graphSummary, // Destructure the new prop
    },
    ref
  ) => {
    // Add state for graph type, defaulting to 'bar'
    const [graphType, setGraphType] = useState("bar");
    const [groupBy, setGroupBy] = useState<string | null>(null);
    const [aggregate, setAggregate] = useState<"sum" | "count">("sum");
    const [valueKey, setValueKey] = useState<string | null>(null);
    const [showSummaryModal, setShowSummaryModal] = useState(false); // New state for modal visibility

    // Ref for the entire graph container (which holds the actual chart)
    const graphContainerRef = useRef<HTMLDivElement>(null);

    // Effect to automatically show the SummaryModal when graphSummary is received
    useEffect(() => {
      if (graphSummary) {
        setShowSummaryModal(true);
      }
    }, [graphSummary]);

    // Expose the graph container ref to the parent component
    useImperativeHandle(ref, () => ({
      getGraphContainer: () => graphContainerRef.current,
    }));

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

    const isKeyExcluded = (key: string): boolean => {
      const lowerKey = key.toLowerCase();
      return (
        /(id|code|number)$/.test(lowerKey) ||
        lowerKey.includes("date") ||
        lowerKey.includes("email") ||
        lowerKey.includes("address") ||
        lowerKey === "first_name" ||
        lowerKey === "last_name" ||
        lowerKey === "name" ||
        lowerKey.length < 3
      );
    };

    const getValidValueKeys = (data: any[]) => {
      if (!data || data.length === 0) return [];
      const keys = Object.keys(data[0]);
      return keys.filter((key) => {
        const sampleVal = data.find(
          (d) => d[key] !== null && d[key] !== undefined
        )?.[key];
        return (
          !isKeyExcluded(key) &&
          (typeof sampleVal === "number" || !isNaN(Number(sampleVal)))
        );
      });
    };

    const getValidCategoricalKeys = (data: any[]) => {
      if (!data || data.length === 0) return [];
      const keys = Object.keys(data[0]);
      return keys.filter((key) => {
        const sampleVal = data.find(
          (d) => d[key] !== null && d[key] !== undefined
        )?.[key];
        return (
          !isKeyExcluded(key) &&
          (typeof sampleVal === "string" || typeof sampleVal === "boolean")
        );
      });
    };

    // Function to auto-detect the best key to group by
    const autoDetectBestGroupBy = (
      rows: any[],
      excludeFn: (key: string) => boolean
    ): string | null => {
      if (!rows.length) return null;

      const sampleSize = Math.min(100, rows.length);
      const sample = rows.slice(0, sampleSize);
      const scores: Record<string, number> = {};

      const keys = Object.keys(sample[0]);

      keys.forEach((key) => {
        if (excludeFn(key)) return;

        const values = sample.map((row) => row[key]).filter(Boolean);
        const uniqueCount = new Set(values).size;

        // Skip if mostly unique or mostly same
        if (uniqueCount <= 1 || uniqueCount > sampleSize * 0.6) return;

        const nullCount =
          values.length < sampleSize ? sampleSize - values.length : 0;
        const nullPenalty = nullCount / sampleSize;

        scores[key] = 1 / (uniqueCount + nullPenalty * 10); // lower uniqueCount is better
      });

      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      return sorted.length ? sorted[0][0] : null;
    };

    // Effect to reset groupBy and valueKey when dashboardItem.mainViewData.chartData changes
    useEffect(() => {
      const chartData = dashboardItem.mainViewData.chartData;
      if (chartData && chartData.length > 0) {
        const bestGroupBy = autoDetectBestGroupBy(chartData, isKeyExcluded);
        setGroupBy(bestGroupBy || null);

        const validKeysForValue = getValidValueKeys(chartData);
        setValueKey(validKeysForValue.length > 0 ? validKeysForValue[0] : null); // Reset valueKey to a suitable default
      } else {
        setGroupBy(null);
        setValueKey(null);
      }
      setAggregate("sum"); // Reset aggregate as well if needed, or keep it sticky
      setGraphType("bar"); // Reset graph type to default
    }, [dashboardItem.mainViewData.chartData]); // Depend on chartData changing

    useEffect(() => {
      if (aggregate === "sum" && !valueKey && dashboardItem) {
        const validKeys = getValidValueKeys(
          dashboardItem.mainViewData.chartData
        );
        if (validKeys.length > 0) setValueKey(validKeys[0]);
      }
    }, [aggregate, dashboardItem?.mainViewData.chartData, valueKey]);

    return (
      <div
        className="flex flex-col flex-grow h-full min-h-[500px] p-2"
        style={{ backgroundColor: theme.colors.background }}
      >
        {/* Top section: Current Question and KPI Cards */}
        <div className="lg:flex-row items-start">
          <div
            className="w-full p-2 mb-2 rounded-xl shadow-md flex items-center justify-between" // Added flex and justify-between for button
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              boxShadow: theme.shadow.md,
              borderRadius: theme.borderRadius.large,
            }}
          >
            <h3
              className="text-xl font-bold text-center flex-grow" // flex-grow to center text
              style={{ color: theme.colors.text }}
            >
              Question: {dashboardItem.question}
            </h3>
            {/* Favorite Button */}
            {dashboardItem.questionMessageId && ( // Only show if we have a message ID to favorite
              <button
                onClick={() =>
                  onToggleFavorite(
                    dashboardItem.questionMessageId, // Pass the actual message ID
                    dashboardItem.question,
                    dashboardItem.mainViewData.queryData,
                    dashboardItem.connectionName, // Use connectionName from dashboardItem
                    dashboardItem.isFavorited
                  )
                }
                title={
                  dashboardItem.isFavorited
                    ? "Remove from Favorites"
                    : "Add to Favorites"
                }
                className="px-1 rounded-full transition-colors duration-200"
                style={{
                  color: dashboardItem.isFavorited
                    ? theme.colors.accent
                    : theme.colors.textSecondary,
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
                disabled={isSubmitting} // Disable during submission
              >
                {dashboardItem.isFavorited ? (
                  <Heart size={24} fill={theme.colors.accent} />
                ) : (
                  <Heart size={24} />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area: Graph on left, Table/Query on right */}
        <div className="flex  flex-grow">
          {/* Graph Section */}
          <div
            ref={graphContainerRef} // Assign ref here to the main graph container
            className="flex-1 rounded-xl flex flex-col overflow-hidden"
            style={{
              backgroundColor: theme.colors.surface,
              boxShadow: theme.shadow.md,
              borderRadius: theme.borderRadius.large,
              minHeight: "300px", // Ensure some visible base
              maxHeight: "calc(100vh - 130px)", // Prevent overflow
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Shared Filters Panel */}
            <div className="p-2 flex flex-wrap gap-3 items-center">
              {/* Select Dropdown for Graph Type */}

              {/* Conditionally render filters if groupBy is available */}
              {dashboardItem.mainViewData.chartData &&
                dashboardItem.mainViewData.chartData.length > 0 && (
                  <>
                    <div className="p-2 flex items-center gap-2">
                      <label
                        htmlFor="graph-type-select"
                        className="font-semibold text-sm"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        Graph Type:
                      </label>
                      <select
                        id="graph-type-select"
                        value={graphType}
                        onChange={(e) => setGraphType(e.target.value)}
                        className="px-2 py-1 rounded-md border shadow-sm"
                        style={{
                          backgroundColor: theme.colors.surface,
                          color: theme.colors.text,
                          borderColor: theme.colors.border,
                          borderRadius: theme.borderRadius.default,
                        }}
                      >
                        <option value="bar">Bar</option>
                        <option value="line">Line</option>
                        <option value="area">Area</option>
                        <option value="pie">Pie</option>
                        <option value="scatter">Scatter</option>
                        <option value="radar">Radar</option>
                        <option value="funnel">Funnel</option>{" "}
                        {/* Added Funnel option */}
                      </select>
                    </div>
                    {/* Group By and Aggregate are not typically used for scatter/radar/funnel,
                      but we'll keep them visible for other graph types. */}
                    {graphType !== "scatter" &&
                      graphType !== "radar" &&
                      graphType !== "funnel" &&
                      groupBy && (
                        <>
                          {/* Group By */}
                          <div className="flex items-center gap-2">
                            <label
                              className="font-semibold text-sm"
                              style={{ color: theme.colors.textSecondary }}
                            >
                              Group By:
                            </label>
                            <select
                              className="px-2 py-1 rounded-md border shadow-sm"
                              value={groupBy || ""}
                              onChange={(e) => setGroupBy(e.target.value)}
                              style={{
                                backgroundColor: theme.colors.surface,
                                color: theme.colors.text,
                                borderColor: theme.colors.border,
                                borderRadius: theme.borderRadius.default,
                              }}
                            >
                              {Object.keys(
                                dashboardItem.mainViewData.chartData[0] || {}
                              )
                                .filter((key) => !isKeyExcluded(key))
                                .map((key) => (
                                  <option key={key} value={key}>
                                    {key.replace(/_/g, " ")}
                                  </option>
                                ))}
                            </select>
                          </div>

                          {/* Aggregate */}
                          <div className="flex items-center gap-2">
                            <label
                              className="font-semibold text-sm"
                              style={{ color: theme.colors.textSecondary }}
                            >
                              Aggregate:
                            </label>
                            <select
                              className="px-2 py-1 rounded-md border shadow-sm"
                              value={aggregate}
                              onChange={(e) =>
                                setAggregate(e.target.value as "sum" | "count")
                              }
                              style={{
                                backgroundColor: theme.colors.surface,
                                color: theme.colors.text,
                                borderColor: theme.colors.border,
                                borderRadius: theme.borderRadius.default,
                              }}
                            >
                              <option value="count">Count</option>
                              <option value="sum">Sum</option>
                            </select>
                          </div>

                          {/* Value Key — only if "sum" is selected */}
                          {aggregate === "sum" && (
                            <div className="flex items-center gap-2">
                              <label
                                className="font-semibold text-sm"
                                style={{ color: theme.colors.textSecondary }}
                              >
                                Value Key:
                              </label>
                              <select
                                className="px-2 py-1 rounded-md border shadow-sm"
                                value={valueKey || ""}
                                onChange={(e) => setValueKey(e.target.value)}
                                style={{
                                  backgroundColor: theme.colors.surface,
                                  color: theme.colors.text,
                                  borderColor: theme.colors.border,
                                  borderRadius: theme.borderRadius.default,
                                }}
                              >
                                {getValidValueKeys(
                                  dashboardItem.mainViewData.chartData
                                ).map((key) => (
                                  <option key={key} value={key}>
                                    {key.replace(/_/g, " ")}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </>
                      )}
                    {graphType === "scatter" && (
                      <>
                        <div className="flex items-center gap-2">
                          <label
                            className="font-semibold text-sm"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            X-Axis:
                          </label>
                          <select
                            className="px-2 py-1 rounded-md border shadow-sm"
                            value={groupBy || ""} // Reusing groupBy state for X-axis for simplicity
                            onChange={(e) => setGroupBy(e.target.value)}
                            style={{
                              backgroundColor: theme.colors.surface,
                              color: theme.colors.text,
                              borderColor: theme.colors.border,
                              borderRadius: theme.borderRadius.default,
                            }}
                          >
                            {getValidValueKeys(
                              dashboardItem.mainViewData.chartData
                            ).map((key) => (
                              <option key={key} value={key}>
                                {key.replace(/_/g, " ")}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <label
                            className="font-semibold text-sm"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            Y-Axis:
                          </label>
                          <select
                            className="px-2 py-1 rounded-md border shadow-sm"
                            value={valueKey || ""} // Reusing valueKey state for Y-axis for simplicity
                            onChange={(e) => setValueKey(e.target.value)}
                            style={{
                              backgroundColor: theme.colors.surface,
                              color: theme.colors.text,
                              borderColor: theme.colors.border,
                              borderRadius: theme.borderRadius.default,
                            }}
                          >
                            {getValidValueKeys(
                              dashboardItem.mainViewData.chartData
                            ).map((key) => (
                              <option key={key} value={key}>
                                {key.replace(/_/g, " ")}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                    {graphType === "radar" && (
                      <>
                        <div className="flex items-center gap-2">
                          <label
                            className="font-semibold text-sm"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            Category By:
                          </label>
                          <select
                            className="px-2 py-1 rounded-md border shadow-sm"
                            value={groupBy || ""}
                            onChange={(e) => setGroupBy(e.target.value)}
                            style={{
                              backgroundColor: theme.colors.surface,
                              color: theme.colors.text,
                              borderColor: theme.colors.border,
                              borderRadius: theme.borderRadius.default,
                            }}
                          >
                            {getValidCategoricalKeys(
                              dashboardItem.mainViewData.chartData
                            ).map((key) => (
                              <option key={key} value={key}>
                                {key.replace(/_/g, " ")}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <label
                            className="font-semibold text-sm"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            Value:
                          </label>
                          <select
                            className="px-2 py-1 rounded-md border shadow-sm"
                            value={valueKey || ""}
                            onChange={(e) => setValueKey(e.target.value)}
                            style={{
                              backgroundColor: theme.colors.surface,
                              color: theme.colors.text,
                              borderColor: theme.colors.border,
                              borderRadius: theme.borderRadius.default,
                            }}
                          >
                            {getValidValueKeys(
                              dashboardItem.mainViewData.chartData
                            ).map((key) => (
                              <option key={key} value={key}>
                                {key.replace(/_/g, " ")}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <label
                            className="font-semibold text-sm"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            Aggregate:
                          </label>
                          <select
                            className="px-2 py-1 rounded-md border shadow-sm"
                            value={aggregate}
                            onChange={(e) =>
                              setAggregate(e.target.value as "sum" | "count")
                            }
                            style={{
                              backgroundColor: theme.colors.surface,
                              color: theme.colors.text,
                              borderColor: theme.colors.border,
                              borderRadius: theme.borderRadius.default,
                            }}
                          >
                            <option value="count">Count</option>
                            <option value="sum">Sum</option>
                          </select>
                        </div>
                      </>
                    )}
                    {graphType === "funnel" && (
                      <>
                        <div className="flex items-center gap-2">
                          <label
                            className="font-semibold text-sm"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            Stage By:
                          </label>
                          <select
                            className="px-2 py-1 rounded-md border shadow-sm"
                            value={groupBy || ""}
                            onChange={(e) => setGroupBy(e.target.value)}
                            style={{
                              backgroundColor: theme.colors.surface,
                              color: theme.colors.text,
                              borderColor: theme.colors.border,
                              borderRadius: theme.borderRadius.default,
                            }}
                          >
                            {getValidCategoricalKeys(
                              dashboardItem.mainViewData.chartData
                            ).map((key) => (
                              <option key={key} value={key}>
                                {key.replace(/_/g, " ")}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <label
                            className="font-semibold text-sm"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            Value:
                          </label>
                          <select
                            className="px-2 py-1 rounded-md border shadow-sm"
                            value={valueKey || ""}
                            onChange={(e) => setValueKey(e.target.value)}
                            style={{
                              backgroundColor: theme.colors.surface,
                              color: theme.colors.text,
                              borderColor: theme.colors.border,
                              borderRadius: theme.borderRadius.default,
                            }}
                          >
                            {getValidValueKeys(
                              dashboardItem.mainViewData.chartData
                            ).map((key) => (
                              <option key={key} value={key}>
                                {key.replace(/_/g, " ")}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <label
                            className="font-semibold text-sm"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            Aggregate:
                          </label>
                          <select
                            className="px-2 py-1 rounded-md border shadow-sm"
                            value={aggregate}
                            onChange={(e) =>
                              setAggregate(e.target.value as "sum" | "count")
                            }
                            style={{
                              backgroundColor: theme.colors.surface,
                              color: theme.colors.text,
                              borderColor: theme.colors.border,
                              borderRadius: theme.borderRadius.default,
                            }}
                          >
                            <option value="count">Count</option>
                            <option value="sum">Sum</option>
                          </select>
                        </div>
                      </>
                    )}
                  </>
                )}
            </div>

            {/* Graph Rendering */}
            <div className="flex flex-col flex-1 min-h-[400px]">
              {graphType === "bar" && (
                <DynamicBarGraph
                  data={dashboardItem.mainViewData.chartData}
                  groupBy={groupBy}
                  setGroupBy={setGroupBy}
                  aggregate={aggregate}
                  setAggregate={setAggregate}
                  valueKey={valueKey}
                  setValueKey={setValueKey}
                />
              )}
              {graphType === "line" && (
                <DynamicLineGraph
                  data={dashboardItem.mainViewData.chartData}
                  groupBy={groupBy}
                  setGroupBy={setGroupBy}
                  aggregate={aggregate}
                  setAggregate={setAggregate}
                  valueKey={valueKey}
                  setValueKey={setValueKey}
                />
              )}
              {graphType === "area" && (
                <DynamicAreaGraph
                  data={dashboardItem.mainViewData.chartData}
                  groupBy={groupBy}
                  setGroupBy={setGroupBy}
                  aggregate={aggregate}
                  setAggregate={setAggregate}
                  valueKey={valueKey}
                  setValueKey={setValueKey}
                />
              )}
              {graphType === "pie" && (
                <DynamicPieGraph
                  data={dashboardItem.mainViewData.chartData}
                  groupBy={groupBy}
                  setGroupBy={setGroupBy}
                  aggregate={aggregate}
                  setAggregate={setAggregate}
                  valueKey={valueKey}
                  setValueKey={setValueKey}
                />
              )}
              {graphType === "scatter" && (
                <DynamicScatterGraph
                  data={dashboardItem.mainViewData.chartData}
                  groupBy={groupBy}
                  setGroupBy={setGroupBy}
                  aggregate={aggregate}
                  setAggregate={setAggregate}
                  valueKey={valueKey}
                  setValueKey={setValueKey}
                />
              )}
              {graphType === "radar" && (
                <DynamicRadarGraph
                  data={dashboardItem.mainViewData.chartData}
                  groupBy={groupBy}
                  setGroupBy={setGroupBy}
                  aggregate={aggregate}
                  setAggregate={setAggregate}
                  valueKey={valueKey}
                  setValueKey={setValueKey}
                />
              )}
              {graphType === "funnel" && (
                <DynamicFunnelGraph
                  data={dashboardItem.mainViewData.chartData}
                  groupBy={groupBy} // Used as stage name
                  setGroupBy={setGroupBy}
                  aggregate={aggregate}
                  setAggregate={setAggregate}
                  valueKey={valueKey} // Used as stage value
                  setValueKey={setValueKey}
                />
              )}
            </div>
          </div>

          {/* Right Section: KPI Cards + Table/Query */}
          <div className="flex flex-col lg:w-[40%] w-full overflow-hidden">
            {/* KPI Cards */}
            {/* <div className="grid m-2 grid-cols-3 gap-2">
              <KPICard
                title={dashboardItem.kpiData.kpi1.label}
                value={dashboardItem.kpiData.kpi1.value}
                change={dashboardItem.kpiData.kpi1.change}
                icon={
                  <TrendingUp
                    size={24}
                    style={{ color: theme.colors.accent }}
                  />
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
            </div> */}

            {/* Table/Query Section */}
            <div
              className="flex-1 overflow-y-auto mx-2 rounded-xl"
              style={{
                // backgroundColor: theme.colors.surface,
                // boxShadow: theme.shadow.lg,
                // borderRadius: theme.borderRadius.large,
                minHeight: "300px", // optional min height
                maxHeight: "100%", // limits table height
              }}
            >
              {activeViewType === "table" && (
                <DataTable data={dashboardItem.mainViewData.tableData} />
              )}
              {activeViewType === "query" && (
                <div className="flex justify-center items-center relative">
                  <QueryDisplay
                    query={dashboardItem.mainViewData.queryData}
                    fontSize="text-base"
                  />
                </div>
              )}
            </div>

            {/* Summarized Graph Text Section - No explicit button needed here
            {graphSummary && (
              <div
                className="mt-2 p-2 mx-2 rounded-xl shadow-md"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  boxShadow: theme.shadow.md,
                  borderRadius: theme.borderRadius.large,
                }}
              >
                <h4
                  className="text-lg font-bold mb-2"
                  style={{ color: theme.colors.text }}
                >
                  Graph Summary:
                </h4>
                <p className="text-sm" style={{ color: theme.colors.text }}>
                  {graphSummary}
                </p>
              </div>
            )} */}
          </div>

          {/* View Toggle Buttons */}
          <div className="flex flex-row self-start lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 flex-shrink-0 mt-4 lg:mt-0 justify-center">
            {(["table", "query"] as const).map((viewType) => (
              <button
                key={viewType}
                onClick={() => onViewTypeChange(viewType)}
                disabled={isSubmitting}
                title={viewType.charAt(0).toUpperCase() + viewType.slice(1)}
                className="p-2 transition-all duration-200 ease-in-out disabled:opacity-60"
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
                  borderRadius: theme.borderRadius.pill,
                }}
              >
                {viewType === "table" && <Table size={24} />}
                {viewType === "query" && <Database size={24} />}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Modal */}
        {showSummaryModal && graphSummary && (
          <SummaryModal
            summaryText={graphSummary}
            onClose={() => setShowSummaryModal(false)}
            theme={theme}
          />
        )}
      </div>
    );
  }
);

export default DashboardView;
