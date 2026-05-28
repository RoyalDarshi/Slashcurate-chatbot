import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  HelpCircle,
  Heart,
  Database,
  Table,
  DollarSign,
  Users,
  TrendingUp as TrendingUpIcon,
  Activity,
} from "lucide-react";
import KPICard from "./KPICard";
import {
  BsHandThumbsDown,
  BsHandThumbsDownFill,
  BsHandThumbsUp,
  BsHandThumbsUpFill,
} from "react-icons/bs";
import { toast } from "react-toastify";
import axios from "axios";
import { useTheme } from "../ThemeContext";
import { DashboardItem } from "./DashboardInterface";
import DashboardSkeletonLoader from "./DashboardSkeletonLoader";
import DynamicGraph from "./Graphs/DynamicGraph";
import DataTable from "./DataTable";
import QueryDisplay from "./QueryDisplay";
import SummaryModal from "./SummaryModal";
import CustomTooltip from "./CustomTooltip";
import { Theme } from "../types";
import { API_URL } from "../config";
import {
  getSmartChartConfig,
  toFiniteNumber,
  type SmartAggregation,
  type SmartChartType,
} from "../utils/smartChart";

export interface DashboardViewHandle {
  getGraphContainer: () => HTMLDivElement | null;
}

interface DashboardViewProps {
  dashboardItem: DashboardItem | null;
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
    isCurrentlyFavorited: boolean,
  ) => Promise<void>;
  sessionConErr: boolean;
  graphSummary: string | null;
  onEditQuestion: (
    questionMessageId: string,
    newQuestion: string,
  ) => Promise<void>;
  onUpdateReaction: (
    questionMessageId: string,
    reaction: "like" | "dislike" | null,
    dislike_reason: string | null,
  ) => void;
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
      sessionConErr,
      graphSummary,
      onEditQuestion,
      onUpdateReaction,
    },
    ref,
  ) => {
    const [graphType, setGraphType] = useState<SmartChartType>("bar");
    const [groupBy, setGroupBy] = useState<string | null>(null);
    const [aggregate, setAggregate] = useState<SmartAggregation>("sum");
    const [valueKey, setValueKey] = useState<string | null>(null);
    const [isVertical, setIsVertical] = useState(true);
    const [syncedTableRows, setSyncedTableRows] = useState<
      Record<string, unknown>[] | null
    >(null);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedQuestion, setEditedQuestion] = useState(
      dashboardItem?.question || "",
    );

    const [showDislikeOptions, setShowDislikeOptions] = useState(false);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customReason, setCustomReason] = useState("");

    const graphContainerRef = useRef<HTMLDivElement>(null);
    const dislikeRef = useRef<HTMLDivElement>(null);

    const isKeyExcluded = (key: string): boolean => {
      const lowerKey = key.toLowerCase();
      return (
        /(id|code|number)$/.test(lowerKey) ||
        lowerKey.includes("email") ||
        lowerKey.includes("address") ||
        lowerKey === "first_name" ||
        lowerKey === "last_name" ||
        lowerKey === "name" ||
        lowerKey.length < 3
      );
    };

    const getValidValueKeys = (data: any[]): string[] => {
      if (!data || data.length === 0) return [];
      return Object.keys(data[0]).filter(
        (key) => !isKeyExcluded(key) && toFiniteNumber(data[0][key]) !== null,
      );
    };

    const getValidCategoricalKeys = (data: any[]): string[] => {
      if (!data || data.length === 0) return [];
      return Object.keys(data[0]).filter(
        (key) =>
          !isKeyExcluded(key) &&
          (typeof data[0][key] === "string" ||
            typeof data[0][key] === "boolean" ||
            key.toLowerCase().includes("date") ||
            key.toLowerCase().includes("month") ||
            key.toLowerCase().includes("year") ||
            key.toLowerCase().includes("time")),
      );
    };

    const lastProcessedItemId = useRef<string | null>(null);

    useEffect(() => {
      if (
        dashboardItem?.mainViewData?.chartData &&
        dashboardItem.mainViewData.chartData.length > 0
      ) {
        if (lastProcessedItemId.current !== dashboardItem.id) {
          const chartData = dashboardItem.mainViewData.chartData;
          const smartDefaults = getSmartChartConfig(chartData);

          setGroupBy(smartDefaults.groupBy);
          setValueKey(smartDefaults.valueKey);
          setAggregate(smartDefaults.aggregation);
          setGraphType(smartDefaults.chartType);
          setIsVertical(smartDefaults.orientation === "vertical");

          lastProcessedItemId.current = dashboardItem.id;
        }
      } else {
        if (lastProcessedItemId.current !== dashboardItem?.id) {
          setGroupBy(null);
          setValueKey(null);
          lastProcessedItemId.current = dashboardItem?.id || null;
        }
      }
    }, [dashboardItem?.mainViewData?.chartData, dashboardItem?.id]);

    useEffect(() => {
      if (graphSummary) setShowSummaryModal(true);
    }, [graphSummary]);

    useEffect(() => {
      setSyncedTableRows(null);
    }, [dashboardItem?.id]);

    useImperativeHandle(ref, () => ({
      getGraphContainer: () => graphContainerRef.current,
    }));

    useEffect(() => {
      if (dashboardItem) {
        setEditedQuestion(dashboardItem.question);
      }
    }, [dashboardItem]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dislikeRef.current &&
          !dislikeRef.current.contains(event.target as Node)
        ) {
          setShowDislikeOptions(false);
          setShowCustomInput(false);
        }
      };
      if (showDislikeOptions) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [showDislikeOptions]);

    const isLiked = dashboardItem?.reaction === "like";
    const isDisliked = dashboardItem?.reaction === "dislike";

    const handleLike = async () => {
      if (!dashboardItem) return;
      const newReaction = isLiked ? null : "like";
      try {
        await axios.post(
          `${API_URL}/api/messages/${dashboardItem.botResponseId}/reaction`,
          {
            token: sessionStorage.getItem("token"),
            reaction: newReaction,
            dislike_reason: null,
          },
        );
        onUpdateReaction(dashboardItem.questionMessageId, newReaction, null);
      } catch (error) {
        console.error("Error setting like reaction:", error);
        toast.error("Failed to set like reaction.");
      }
    };

    const handleDislike = async () => {
      if (!dashboardItem) return;
      if (isDisliked) {
        try {
          await axios.post(
            `${API_URL}/api/messages/${dashboardItem.botResponseId}/reaction`,
            {
              token: sessionStorage.getItem("token"),
              reaction: null,
              dislike_reason: null,
            },
          );
          onUpdateReaction(dashboardItem.questionMessageId, null, null);
        } catch (error) {
          console.error("Error removing dislike reaction:", error);
          toast.error("Failed to remove dislike reaction.");
        }
      } else {
        setShowDislikeOptions(true);
      }
    };

    const handleDislikeOption = async (reason: string) => {
      if (!dashboardItem) return;
      try {
        await axios.post(
          `${API_URL}/api/messages/${dashboardItem.botResponseId}/reaction`,
          {
            token: sessionStorage.getItem("token"),
            reaction: "dislike",
            dislike_reason: reason,
          },
        );
        onUpdateReaction(dashboardItem.questionMessageId, "dislike", reason);
        setShowDislikeOptions(false);
        setShowCustomInput(false);
      } catch (error) {
        console.error("Error setting dislike reaction:", error);
        toast.error("Failed to set dislike reaction.");
      }
    };

    if (!dashboardItem) {
      return (
        <div
          className="flex flex-col items-center justify-center h-full p-6 w-full text-center"
          style={{ backgroundColor: "transparent" }}
        >
          <HelpCircle
            size={44}
            style={{ color: theme.colors.textSecondary }}
            className="mb-3 opacity-50"
          />
          <h2
            className="text-base font-semibold tracking-tight"
            style={{ color: theme.colors.text }}
          >
            Dashboard workspace staged
          </h2>
          <p
            className="text-xs font-semibold max-w-xs mx-auto mt-1"
            style={{ color: theme.colors.textSecondary }}
          >
            Staging environment calibrated. Fire an query parameter below to
            load analytics modules.
          </p>
        </div>
      );
    }

    if (dashboardItem.isError) {
      return (
        <div
          className="flex flex-col items-center justify-center h-full p-6 w-full text-center"
          style={{ backgroundColor: "transparent" }}
        >
          <HelpCircle
            size={44}
            style={{ color: theme.colors.error }}
            className="mb-3 opacity-85"
          />
          <h2
            className="text-base font-semibold tracking-tight"
            style={{ color: theme.colors.text }}
          >
            Error Captured: {dashboardItem.question}
          </h2>
          <p
            className="text-xs font-semibold mt-1.5 max-w-md mx-auto"
            style={{ color: theme.colors.error }}
          >
            {dashboardItem.textualSummary.replace("Error: ", "")}
          </p>
          {!sessionConErr && (
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }}
              >
                Modify Question
              </button>
              <button
                onClick={() =>
                  onEditQuestion(
                    dashboardItem.questionMessageId,
                    dashboardItem.question,
                  )
                }
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs"
                style={{
                  backgroundColor: theme.colors.accent,
                }}
              >
                Retry
              </button>
            </div>
          )}
          {isEditing && (
            <div
              className="mt-4 w-full max-w-md p-4 rounded-xl border bg-white dark:bg-slate-900 shadow-xl"
              style={{ borderColor: theme.colors.border }}
            >
              <input
                type="text"
                value={editedQuestion}
                onChange={(e) => setEditedQuestion(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs border focus:outline-none font-semibold"
                style={{
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                }}
              />
              <div className="flex justify-end mt-3 gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedQuestion(dashboardItem.question);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{
                    backgroundColor: theme.colors.error,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (editedQuestion.trim()) {
                      onEditQuestion(
                        dashboardItem.questionMessageId,
                        editedQuestion,
                      );
                      setIsEditing(false);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{
                    backgroundColor: theme.colors.accent,
                  }}
                >
                  Update
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    const getKpiIcon = (label: string) => {
      const lower = label.toLowerCase();
      if (
        lower.includes("user") ||
        lower.includes("customer") ||
        lower.includes("visitor") ||
        lower.includes("client") ||
        lower.includes("count")
      ) {
        return <Users size={16} />;
      }
      if (
        lower.includes("price") ||
        lower.includes("amount") ||
        lower.includes("revenue") ||
        lower.includes("sales") ||
        lower.includes("cost") ||
        lower.includes("income") ||
        lower.includes("profit") ||
        lower.includes("tax") ||
        lower.includes("fee") ||
        lower.includes("dollar") ||
        lower.includes("rupee") ||
        lower.includes("currency") ||
        lower.includes("total")
      ) {
        return <DollarSign size={16} />;
      }
      if (
        lower.includes("rate") ||
        lower.includes("percent") ||
        lower.includes("growth") ||
        lower.includes("trend")
      ) {
        return <TrendingUpIcon size={16} />;
      }
      return <Activity size={16} />;
    };

    const kpis = dashboardItem?.kpiData;
    const hasKpis =
      kpis &&
      kpis.kpi1 &&
      kpis.kpi1.value !== null &&
      kpis.kpi1.value !== undefined;

    return (
      <div className="flex-1 w-full flex flex-col min-h-0 overflow-hidden">
        {isSubmitting ? (
          <DashboardSkeletonLoader question={dashboardItem.question} />
        ) : (
          <div
            className="flex flex-col flex-grow min-h-0 w-full lg:overflow-hidden overflow-y-auto"
            style={{ backgroundColor: "transparent" }}
          >
            {/* Core Workspace Header Deck Panel */}
            <div
              className="mx-4 mt-2 mb-2 px-4 py-2 flex-shrink-0 flex items-center justify-between gap-3 rounded-xl border shadow-sm transition-all duration-300 relative overflow-hidden"
              style={{
                backgroundColor: theme.mode === "light" ? "#FFFFFF" : "rgba(30, 41, 59, 0.5)",
                borderColor: theme.mode === "light" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
                backdropFilter: "blur(12px)",
              }}
            >
              {/* Subtle decorative glow */}
              <div
                className="absolute top-0 left-0 w-1/3 h-full opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                style={{
                  background: `linear-gradient(90deg, ${theme.colors.accent}, transparent)`,
                }}
              />

              {isEditing ? (
                <div className="flex-grow flex items-center gap-2 relative z-10">
                  <input
                    type="text"
                    value={editedQuestion}
                    onChange={(e) => setEditedQuestion(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border text-sm focus:outline-none font-medium transition-shadow focus:ring-2"
                    style={{
                      backgroundColor: theme.mode === "light" ? "#F8FAFC" : "rgba(0,0,0,0.2)",
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                      ringColor: theme.colors.accent + "40",
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedQuestion(dashboardItem.question);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: theme.colors.error }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (editedQuestion.trim()) {
                        onEditQuestion(
                          dashboardItem.questionMessageId,
                          editedQuestion,
                        );
                        setIsEditing(false);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: theme.colors.accent }}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 relative z-10">
                    <div 
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${theme.colors.accent}15` }}
                    >
                      <HelpCircle size={14} style={{ color: theme.colors.accent }} />
                    </div>
                    <h3
                      className="text-sm font-semibold truncate tracking-tight"
                      style={{
                        color: theme.mode === "light" ? "#0F172A" : theme.colors.text,
                      }}
                      title={dashboardItem.question}
                    >
                      {dashboardItem.question}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!sessionConErr && (
                      <>
                        <CustomTooltip
                          title={
                            dashboardItem.isFavorited
                              ? "Remove Favorite"
                              : "Bookmark Metric Layout"
                          }
                          position="bottom"
                        >
                          <button
                            onClick={() =>
                              onToggleFavorite(
                                dashboardItem.questionMessageId,
                                dashboardItem.question,
                                dashboardItem.mainViewData.queryData,
                                dashboardItem.connectionName,
                                dashboardItem.isFavorited,
                              )
                            }
                            disabled={isSubmitting}
                            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-slate-400"
                          >
                            <Heart
                              size={15}
                              fill={
                                dashboardItem.isFavorited ? "#EF4444" : "none"
                              }
                              className={
                                dashboardItem.isFavorited
                                  ? "text-red-500"
                                  : "text-slate-400"
                              }
                            />
                          </button>
                        </CustomTooltip>

                        <CustomTooltip
                          title={isLiked ? "Remove Like" : "Like Response"}
                          position="bottom"
                        >
                          <button
                            onClick={handleLike}
                            disabled={isSubmitting}
                            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400"
                          >
                            {isLiked ? (
                              <BsHandThumbsUpFill
                                size={15}
                                style={{ color: theme.colors.success }}
                              />
                            ) : (
                              <BsHandThumbsUp size={15} />
                            )}
                          </button>
                        </CustomTooltip>

                        <div className="relative" ref={dislikeRef}>
                          <CustomTooltip
                            title={
                              isDisliked ? "Remove Dislike" : "Dislike Response"
                            }
                            position="bottom"
                          >
                            <button
                              onClick={handleDislike}
                              disabled={isSubmitting}
                              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400"
                            >
                              {isDisliked ? (
                                <BsHandThumbsDownFill
                                  size={15}
                                  style={{ color: theme.colors.error }}
                                />
                              ) : (
                                <BsHandThumbsDown size={15} />
                              )}
                            </button>
                          </CustomTooltip>

                          {showDislikeOptions && (
                            <div
                              className="absolute top-full right-0 mt-1 rounded-xl border z-50 min-w-[180px] overflow-hidden py-1 shadow-lg animate-fade-up"
                              style={{
                                background: theme.colors.surface,
                                borderColor: theme.colors.border,
                              }}
                            >
                              {showCustomInput ? (
                                <div className="p-2.5 flex flex-col gap-2">
                                  <textarea
                                    value={customReason}
                                    onChange={(e) =>
                                      setCustomReason(e.target.value)
                                    }
                                    placeholder="Enter structural error description..."
                                    rows={2}
                                    className="w-full p-2 rounded-lg border text-xs focus:outline-none resize-none font-semibold"
                                    style={{
                                      background: theme.colors.background,
                                      color: theme.colors.text,
                                      borderColor: theme.colors.border,
                                    }}
                                  />
                                  <div className="flex justify-end gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
                                    <button
                                      onClick={() => {
                                        setShowCustomInput(false);
                                        setCustomReason("");
                                      }}
                                      style={{
                                        color: theme.colors.textSecondary,
                                      }}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (customReason.trim()) {
                                          handleDislikeOption(customReason);
                                          setCustomReason("");
                                        }
                                      }}
                                      className="px-2 py-0.5 rounded text-white bg-indigo-600"
                                    >
                                      Submit
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {[
                                    "Incorrect data layout",
                                    "Execution threshold delay",
                                    "Irrelevant response frame",
                                    "Confusing answer grid",
                                    "Other Deviation",
                                  ].map((reason) => (
                                    <button
                                      key={reason}
                                      onClick={() =>
                                        reason === "Other"
                                          ? setShowCustomInput(true)
                                          : handleDislikeOption(reason)
                                      }
                                      className="w-full text-left px-3 py-2 text-xs font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                      style={{ color: theme.colors.text }}
                                    >
                                      {reason}
                                    </button>
                                  ))}
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-1" />

                        <button
                          onClick={() => setIsEditing(true)}
                          disabled={isSubmitting}
                          className="px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors"
                          style={{
                            backgroundColor: `${theme.colors.accent}12`,
                            borderColor: `${theme.colors.accent}30`,
                            color: theme.colors.accent,
                          }}
                        >
                          Modify
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {hasKpis && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-3 mb-3 flex-shrink-0">
                <KPICard
                  title={kpis.kpi1.label}
                  value={kpis.kpi1.value}
                  change={kpis.kpi1.change}
                  icon={getKpiIcon(kpis.kpi1.label)}
                />
                <KPICard
                  title={kpis.kpi2.label}
                  value={kpis.kpi2.value}
                  change={kpis.kpi2.change}
                  icon={getKpiIcon(kpis.kpi2.label)}
                />
                <KPICard
                  title={kpis.kpi3.label}
                  value={kpis.kpi3.value}
                  change={kpis.kpi3.change}
                  icon={getKpiIcon(kpis.kpi3.label)}
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch w-full gap-4 pb-28 lg:pb-24 flex-1 min-h-0 px-3">
              {/* Left Visualization Panel Island */}
              <div
                ref={graphContainerRef}
                className="lg:col-span-5 w-full flex flex-col overflow-visible min-w-0 animate-fade-up z-20"
                style={{
                  maxHeight: "100%",
                  backgroundColor: "transparent",
                  borderRadius: theme.borderRadius.large,
                }}
              >
                <div
                  className="flex items-center justify-center py-1 flex-shrink-0"
                  style={{ borderColor: "transparent" }}
                >
                  {dashboardItem.mainViewData.chartData?.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 w-full flex-wrap justify-start">
                      <div className="flex items-center flex-shrink-0">

                        <select
                          id="graph-type-select"
                          value={graphType}
                          onChange={(e) =>
                            setGraphType(e.target.value as SmartChartType)
                          }
                          className="px-2 py-0.5 text-xs rounded border font-semibold outline-none cursor-pointer"
                          style={{
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.text,
                            borderColor: theme.colors.border,
                          }}
                        >
                          <option value="bar">Bar</option>
                          <option value="line">Line</option>
                          <option value="area">Area</option>
                          <option value="pie">Pie</option>
                          <option value="scatter">Scatter</option>
                          <option value="radar">Radar</option>
                          <option value="funnel">Funnel</option>
                          <option value="treemap">Treemap</option>
                        </select>
                      </div>

                      {["bar", "line", "area"].includes(graphType) && (
                        <div className="flex items-center flex-shrink-0">

                          <select
                            value={isVertical ? "vertical" : "horizontal"}
                            onChange={(e) =>
                              setIsVertical(e.target.value === "vertical")
                            }
                            className="px-2 py-0.5 text-xs rounded border font-semibold outline-none cursor-pointer"
                            style={{
                              backgroundColor: theme.colors.surface,
                              color: theme.colors.text,
                              borderColor: theme.colors.border,
                            }}
                          >
                            <option value="vertical">Vertical</option>
                            <option value="horizontal">Horizontal</option>
                          </select>
                        </div>
                      )}

                      {["bar", "line", "area", "pie", "treemap"].includes(
                        graphType,
                      ) &&
                        groupBy && (
                          <>
                            <div className="flex items-center flex-shrink-0">

                              <select
                                value={groupBy || ""}
                                onChange={(e) => setGroupBy(e.target.value)}
                                className="px-2 py-0.5 text-xs rounded border font-semibold outline-none cursor-pointer max-w-[120px]"
                                style={{
                                  backgroundColor: theme.colors.surface,
                                  color: theme.colors.text,
                                  borderColor: theme.colors.border,
                                }}
                              >
                                {getValidCategoricalKeys(
                                  dashboardItem.mainViewData.chartData,
                                ).map((key) => (
                                  <option key={key} value={key}>
                                    {key.replace(/_/g, " ")}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center flex-shrink-0">

                              <select
                                value={aggregate}
                                onChange={(e) =>
                                  setAggregate(
                                    e.target.value as SmartAggregation,
                                  )
                                }
                                className="px-2 py-0.5 text-xs rounded border font-semibold outline-none cursor-pointer"
                                style={{
                                  backgroundColor: theme.colors.surface,
                                  color: theme.colors.text,
                                  borderColor: theme.colors.border,
                                }}
                              >
                                <option value="count">Count</option>
                                <option value="sum">Sum</option>
                                <option value="avg">Avg</option>
                                <option value="min">Min</option>
                                <option value="max">Max</option>
                              </select>
                            </div>
                            {(aggregate === "sum" ||
                              aggregate === "avg" ||
                              aggregate === "min" ||
                              aggregate === "max") && (
                              <div className="flex items-center flex-shrink-0">

                                <select
                                  value={valueKey || ""}
                                  onChange={(e) => setValueKey(e.target.value)}
                                  className="px-2 py-0.5 text-xs rounded border font-semibold outline-none cursor-pointer max-w-[120px]"
                                  style={{
                                    backgroundColor: theme.colors.surface,
                                    color: theme.colors.text,
                                    borderColor: theme.colors.border,
                                  }}
                                >
                                  {getValidValueKeys(
                                    dashboardItem.mainViewData.chartData,
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
                          <div className="flex items-center flex-shrink-0">

                            <select
                              value={groupBy || ""}
                              onChange={(e) => setGroupBy(e.target.value)}
                              className="px-2 py-0.5 text-xs rounded border font-semibold outline-none cursor-pointer"
                              style={{
                                backgroundColor: theme.colors.surface,
                                color: theme.colors.text,
                                borderColor: theme.colors.border,
                              }}
                            >
                              {getValidValueKeys(
                                dashboardItem.mainViewData.chartData,
                              ).map((key) => (
                                <option key={key} value={key}>
                                  {key.replace(/_/g, " ")}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center flex-shrink-0">

                            <select
                              value={valueKey || ""}
                              onChange={(e) => setValueKey(e.target.value)}
                              className="px-2 py-0.5 text-xs rounded border font-semibold outline-none cursor-pointer"
                              style={{
                                backgroundColor: theme.colors.surface,
                                color: theme.colors.text,
                                borderColor: theme.colors.border,
                              }}
                            >
                              {getValidValueKeys(
                                dashboardItem.mainViewData.chartData,
                              ).map((key) => (
                                <option key={key} value={key}>
                                  {key.replace(/_/g, " ")}
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}

                      {["radar", "funnel"].includes(graphType) && (
                        <>
                          <div className="flex items-center flex-shrink-0">

                            <select
                              value={groupBy || ""}
                              onChange={(e) => setGroupBy(e.target.value)}
                              className="px-2 py-0.5 text-xs rounded border font-semibold outline-none cursor-pointer"
                              style={{
                                backgroundColor: theme.colors.surface,
                                color: theme.colors.text,
                                borderColor: theme.colors.border,
                              }}
                            >
                              {getValidCategoricalKeys(
                                dashboardItem.mainViewData.chartData,
                              ).map((key) => (
                                <option key={key} value={key}>
                                  {key.replace(/_/g, " ")}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center flex-shrink-0">

                            <select
                              value={valueKey || ""}
                              onChange={(e) => setValueKey(e.target.value)}
                              className="px-2 py-0.5 text-xs rounded border font-semibold outline-none cursor-pointer"
                              style={{
                                backgroundColor: theme.colors.surface,
                                color: theme.colors.text,
                                borderColor: theme.colors.border,
                              }}
                            >
                              {getValidValueKeys(
                                dashboardItem.mainViewData.chartData,
                              ).map((key) => (
                                <option key={key} value={key}>
                                  {key.replace(/_/g, " ")}
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-h-0 w-full overflow-visible flex flex-col items-stretch justify-end">
                  <DynamicGraph
                    data={
                      syncedTableRows ?? dashboardItem.mainViewData.chartData
                    }
                    graphType={graphType}
                    groupBy={groupBy}
                    setGroupBy={setGroupBy}
                    aggregate={aggregate}
                    setAggregate={setAggregate}
                    valueKey={valueKey}
                    setValueKey={setValueKey}
                    isVertical={isVertical}
                  />
                </div>
              </div>

              {/* Right Tabular Query Log Island */}
              <div
                className="lg:col-span-7 w-full flex flex-col overflow-hidden min-w-0 animate-fade-up"
                style={{
                  maxHeight: "100%",
                  backgroundColor: "transparent",
                  borderRadius: theme.borderRadius.large,
                }}
              >
                <div
                  className="flex items-center justify-between py-2 flex-shrink-0 min-h-[45px]"
                  style={{ borderColor: "transparent" }}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {activeViewType === "query"
                      ? "SQL Query Log"
                      : "Data Matrix Grid"}
                  </span>

                  {/* Segmented Light High Contrast Switcher Controls */}
                  <div
                    className="flex p-0.5 rounded-lg border font-semibold"
                    style={{
                      backgroundColor:
                        theme.mode === "light" ? "#E2E8F0" : "#0F172A",
                      borderColor: theme.colors.border,
                    }}
                  >
                    {(["table", "query"] as const).map((viewType) => (
                      <button
                        key={viewType}
                        onClick={() => onViewTypeChange(viewType)}
                        disabled={isSubmitting}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md transition-all"
                        style={{
                          backgroundColor:
                            activeViewType === viewType
                              ? theme.colors.surface
                              : "transparent",
                          color:
                            activeViewType === viewType
                              ? theme.colors.text
                              : theme.colors.textSecondary,
                          boxShadow:
                            activeViewType === viewType
                              ? "0 1px 3px rgba(0,0,0,0.06)"
                              : "none",
                        }}
                      >
                        {viewType === "table" ? "Table" : "SQL"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-3 min-h-0">
                  {activeViewType === "query" ? (
                    <QueryDisplay
                      query={dashboardItem.mainViewData.queryData}
                      fontSize="text-sm"
                      flat
                    />
                  ) : (
                    <DataTable
                      data={dashboardItem.mainViewData.tableData}
                      onRowsChange={setSyncedTableRows}
                      variant="dashboard-flat"
                    />
                  )}
                </div>
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
  },
);

export default DashboardView;
