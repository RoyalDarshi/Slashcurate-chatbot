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
  Heart,
  ScatterChartIcon as ScatterChartIconLucide,
  AreaChart as AreaChartIconLucide,
  Snowflake as RadarChartIconLucide,
  List as FunnelChartIconLucide,
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
import DashboardSkeletonLoader from "./DashboardSkeletonLoader";
import { Theme } from "../types";
import { useTheme } from "../ThemeContext";
import SummaryModal from "./SummaryModal";

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

export interface DashboardViewHandle {
  getGraphContainer: () => HTMLDivElement | null;
}

interface DashboardViewProps {
  dashboardItem: {
    id: string;
    question: string;
    kpiData: ReturnType<typeof generateKpiData>;
    mainViewData: ReturnType<typeof generateMainViewData>;
    textualSummary: string;
    lastViewType?: "graph" | "table" | "query";
    isFavorited: boolean;
    questionMessageId: string;
    connectionName: string;
  } | null;
  theme: Theme;
  isSubmitting: boolean;
  activeViewType: "graph" | "table" | "query";
  onViewTypeChange: (viewType: "graph" | "table" | "query") => void;
  onNavigateHistory: (direction: "prev" | "next") => void;
  historyIndex: number;
  historyLength: number;
  onToggleFavorite: (
    questionMessageId: string,
    questionContent: string,
    responseQuery: string,
    currentConnection: string,
    isCurrentlyFavorited: boolean
  ) => Promise<void>;
  currentConnection: string;
  graphSummary: string | null;
  onEditQuestion: (questionMessageId: string, newQuestion: string) => Promise<void>;
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
      graphSummary,
      onEditQuestion,
    },
    ref
  ) => {
    const [graphType, setGraphType] = useState("bar");
    const [groupBy, setGroupBy] = useState<string | null>(null);
    const [aggregate, setAggregate] = useState<"sum" | "count">("sum");
    const [valueKey, setValueKey] = useState<string | null>(null);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedQuestion, setEditedQuestion] = useState(
      dashboardItem?.question || ""
    );

    const graphContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (graphSummary) {
        setShowSummaryModal(true);
      }
    }, [graphSummary]);

    useImperativeHandle(ref, () => ({
      getGraphContainer: () => graphContainerRef.current,
    }));

    useEffect(() => {
      if (dashboardItem) {
        setEditedQuestion(dashboardItem.question);
      }
    }, [dashboardItem]);

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

        if (uniqueCount <= 1 || uniqueCount > sampleSize * 0.6) return;

        const nullCount =
          values.length < sampleSize ? sampleSize - values.length : 0;
        const nullPenalty = nullCount / sampleSize;

        scores[key] = 1 / (uniqueCount + nullPenalty * 10);
      });

      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      return sorted.length ? sorted[0][0] : null;
    };

    useEffect(() => {
      const chartData = dashboardItem.mainViewData.chartData;
      if (chartData && chartData.length > 0) {
        const bestGroupBy = autoDetectBestGroupBy(chartData, isKeyExcluded);
        setGroupBy(bestGroupBy || null);

        const validKeysForValue = getValidValueKeys(chartData);
        setValueKey(validKeysForValue.length > 0 ? validKeysForValue[0] : null);
      } else {
        setGroupBy(null);
        setValueKey(null);
      }
      setAggregate("sum");
      setGraphType("bar");
    }, [dashboardItem.mainViewData.chartData]);

    useEffect(() => {
      if (aggregate === "sum" && !valueKey && dashboardItem) {
        const validKeys = getValidValueKeys(
          dashboardItem.mainViewData.chartData
        );
        if (validKeys.length > 0) setValueKey(validKeys[0]);
      }
    }, [aggregate, dashboardItem?.mainViewData.chartData, valueKey]);

    return (
      <div>
        {isSubmitting ? (
          <DashboardSkeletonLoader />
        ) : (
          <div
            className="flex flex-col flex-grow h-full min-h-[500px] p-2"
            style={{ backgroundColor: theme.colors.background }}
          >
            <div className="lg:flex-row items-start">
              <div
                className="w-full p-2 mb-2 rounded-xl shadow-md flex items-center justify-between"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  boxShadow: theme.shadow.md,
                  borderRadius: theme.borderRadius.large,
                }}
              >
                {isEditing ? (
                  <div className="flex-grow">
                    <input
                      type="text"
                      value={editedQuestion}
                      onChange={(e) => setEditedQuestion(e.target.value)}
                      className="w-full p-2 rounded-md"
                      style={{
                        backgroundColor: theme.colors.background,
                        color: theme.colors.text,
                      }}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditedQuestion(dashboardItem.question);
                        }}
                        className="px-2 py-1 mr-2 rounded-md"
                        style={{
                          backgroundColor: theme.colors.error,
                          color: "white",
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (editedQuestion.trim()) {
                            onEditQuestion(
                              dashboardItem.questionMessageId,
                              editedQuestion
                            );
                            setIsEditing(false);
                          }
                        }}
                        className="px-2 py-1 rounded-md"
                        style={{
                          backgroundColor: theme.colors.accent,
                          color: "white",
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3
                      className="text-xl font-bold text-center flex-grow"
                      style={{ color: theme.colors.text }}
                    >
                      Question: {dashboardItem.question}
                    </h3>
                    {dashboardItem.questionMessageId && (
                      <button
                        onClick={() => setIsEditing(true)}
                        disabled={isSubmitting}
                        className="px-2 py-1 rounded-md"
                        style={{
                          backgroundColor: theme.colors.accent,
                          color: "white",
                        }}
                      >
                        Edit
                      </button>
                    )}
                    {dashboardItem.questionMessageId && (
                      <button
                        onClick={() =>
                          onToggleFavorite(
                            dashboardItem.questionMessageId,
                            dashboardItem.question,
                            dashboardItem.mainViewData.queryData,
                            dashboardItem.connectionName,
                            dashboardItem.isFavorited
                          )
                        }
                        title={
                          dashboardItem.isFavorited
                            ? "Remove from Favorites"
                            : "Add to Favorites"
                        }
                        className="px-1 rounded-full transition-colors duration-200 ml-2"
                        style={{
                          color: dashboardItem.isFavorited
                            ? theme.colors.accent
                            : theme.colors.textSecondary,
                          backgroundColor: "transparent",
                          border: "none",
                          cursor: "pointer",
                        }}
                        disabled={isSubmitting}
                      >
                        {dashboardItem.isFavorited ? (
                          <Heart size={24} fill={theme.colors.accent} />
                        ) : (
                          <Heart size={24} />
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-grow">
              <div
                ref={graphContainerRef}
                className="flex-1 rounded-xl flex flex-col overflow-hidden"
                style={{
                  backgroundColor: theme.colors.surface,
                  boxShadow: theme.shadow.md,
                  borderRadius: theme.borderRadius.large,
                  minHeight: "300px",
                  maxHeight: "calc(100vh - 130px)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div className="p-2 flex flex-wrap gap-3 items-center">
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
                            <option value="funnel">Funnel</option>
                          </select>
                        </div>
                        {graphType !== "scatter" &&
                          graphType !== "radar" &&
                          graphType !== "funnel" &&
                          groupBy && (
                            <>
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
                                    dashboardItem.mainViewData.chartData[0] ||
                                      {}
                                  )
                                    .filter((key) => !isKeyExcluded(key))
                                    .map((key) => (
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
                                    setAggregate(
                                      e.target.value as "sum" | "count"
                                    )
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
                              {aggregate === "sum" && (
                                <div className="flex items-center gap-2">
                                  <label
                                    className="font-semibold text-sm"
                                    style={{
                                      color: theme.colors.textSecondary,
                                    }}
                                  >
                                    Value Key:
                                  </label>
                                  <select
                                    className="px-2 py-1 rounded-md border shadow-sm"
                                    value={valueKey || ""}
                                    onChange={(e) =>
                                      setValueKey(e.target.value)
                                    }
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
                                value={groupBy || ""}
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
                                  setAggregate(
                                    e.target.value as "sum" | "count"
                                  )
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
                                  setAggregate(
                                    e.target.value as "sum" | "count"
                                  )
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
                      groupBy={groupBy}
                      setGroupBy={setGroupBy}
                      aggregate={aggregate}
                      setAggregate={setAggregate}
                      valueKey={valueKey}
                      setValueKey={setValueKey}
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-col lg:w-[40%] w-full overflow-hidden">
                <div
                  className="flex-1 overflow-y-auto mx-2 rounded-xl"
                  style={{
                    minHeight: "300px",
                    maxHeight: "100%",
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
              </div>

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
                          : theme.colors.surface,
                      color:
                        activeViewType === viewType
                          ? "white"
                          : theme.colors.accent,
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

            {showSummaryModal && graphSummary && (
              <SummaryModal
                summaryText={graphSummary}
                onClose={() => setShowSummaryModal(false)}
                theme={theme}
              />
            )}
          </div>
        )}
      </div>
    );
  }
);

export default DashboardView;
