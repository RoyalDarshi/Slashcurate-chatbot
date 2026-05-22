import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { HelpCircle, Heart, Database, Table, DollarSign, Users, TrendingUp as TrendingUpIcon, Activity } from "lucide-react";
import KPICard from "./KPICard";
import {
  BsHandThumbsDown,
  BsHandThumbsDownFill,
  BsHandThumbsUp,
  BsHandThumbsUpFill,
} from "react-icons/bs";
import {
  FaChartBar,
  FaChartLine,
  FaChartPie,
  FaTable,
  FaTerminal,
} from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "axios";
import { useTheme } from "../ThemeContext";
import { DashboardItem, MainViewData } from "./DashboardInterface";
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
          className="flex flex-col items-center justify-center h-full p-4 w-full"
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

    if (dashboardItem.isError) {
      return (
        <div
          className="flex flex-col items-center justify-center h-full p-4 w-full"
          style={{ backgroundColor: theme.colors.background }}
        >
          <HelpCircle
            size={48}
            style={{ color: theme.colors.error }}
            className="mb-3"
          />
          <h2
            className="text-xl font-semibold"
            style={{ color: theme.colors.text }}
          >
            Error: {dashboardItem.question}
          </h2>
          <p className="mt-1 text-center" style={{ color: theme.colors.error }}>
            {dashboardItem.textualSummary.replace("Error: ", "")}
          </p>
          {!sessionConErr && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-md"
                style={{ backgroundColor: theme.colors.accent, color: "white" }}
              >
                Edit Question
              </button>
              <button
                onClick={() =>
                  onEditQuestion(
                    dashboardItem.questionMessageId,
                    dashboardItem.question,
                  )
                }
                className="px-4 py-2 rounded-md"
                style={{
                  backgroundColor: theme.colors.accent,
                  color: "white",
                }}
              >
                Retry
              </button>
            </div>
          )}
          {isEditing && (
            <div className="mt-4 w-full max-w-md">
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
              <div className="flex justify-end mt-2 gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedQuestion(dashboardItem.question);
                  }}
                  className="px-4 py-2 rounded-md"
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
                        editedQuestion,
                      );
                      setIsEditing(false);
                    }
                  }}
                  className="px-4 py-2 rounded-md"
                  style={{
                    backgroundColor: theme.colors.accent,
                    color: "white",
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
      if (lower.includes("user") || lower.includes("customer") || lower.includes("visitor") || lower.includes("client") || lower.includes("count")) {
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
      if (lower.includes("rate") || lower.includes("percent") || lower.includes("growth") || lower.includes("trend")) {
        return <TrendingUpIcon size={16} />;
      }
      return <Activity size={16} />;
    };

    const kpis = dashboardItem?.kpiData;
    const hasKpis = kpis && kpis.kpi1 && kpis.kpi1.value !== null && kpis.kpi1.value !== undefined;

    return (
      <div className="flex-1 w-full flex flex-col min-h-0 overflow-hidden">
        {isSubmitting ? (
          <DashboardSkeletonLoader question={dashboardItem.question} />
        ) : (
          <div
            className="flex flex-col flex-grow min-h-0 w-full lg:overflow-hidden overflow-y-auto"
            style={{ backgroundColor: theme.colors.background }}
          >
            <div
              className="w-full px-3 py-2 mb-2 flex-shrink-0 flex items-center justify-between gap-3"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderBottom: `1px solid ${theme.colors.border}40`,
              }}
            >
              {isEditing ? (
                <div className="flex-grow flex items-center gap-2">
                  <input
                    type="text"
                    value={editedQuestion}
                    onChange={(e) => setEditedQuestion(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-md text-sm"
                    style={{
                      backgroundColor: theme.colors.background,
                      color: theme.colors.text,
                      border: `1px solid ${theme.colors.border}`,
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedQuestion(dashboardItem.question);
                    }}
                    className="px-3 py-1 rounded-md text-xs"
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
                          editedQuestion,
                        );
                        setIsEditing(false);
                      }
                    }}
                    className="px-3 py-1 rounded-md text-xs"
                    style={{
                      backgroundColor: theme.colors.accent,
                      color: "white",
                    }}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <h3
                    className="text-sm font-semibold truncate flex-1"
                    style={{ color: theme.colors.text }}
                    title={dashboardItem.question}
                  >
                    {dashboardItem.question}
                  </h3>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!sessionConErr && (
                      <>
                        <CustomTooltip
                          title={
                            dashboardItem.isFavorited
                              ? "Remove from Favorites"
                              : "Add to Favorites"
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
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            style={{
                              color: dashboardItem.isFavorited
                                ? "#FF4D4D"
                                : theme.colors.textSecondary,
                            }}
                          >
                            <Heart
                              size={16}
                              fill={
                                dashboardItem.isFavorited ? "currentColor" : "none"
                              }
                            />
                          </button>
                        </CustomTooltip>
 
                        <CustomTooltip
                          title={isLiked ? "Remove like" : "Like this response"}
                          position="bottom"
                        >
                          <button
                            onClick={handleLike}
                            disabled={isSubmitting}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            {isLiked ? (
                              <BsHandThumbsUpFill
                                size={16}
                                style={{ color: theme.colors.success }}
                              />
                            ) : (
                              <BsHandThumbsUp
                                size={16}
                                style={{ color: theme.colors.textSecondary }}
                              />
                            )}
                          </button>
                        </CustomTooltip>
 
                        <div className="relative" ref={dislikeRef}>
                          <CustomTooltip
                            title={
                              isDisliked
                               ? "Remove dislike"
                                : "Dislike this response"
                            }
                            position="bottom"
                          >
                            <button
                              onClick={handleDislike}
                              disabled={isSubmitting}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              {isDisliked ? (
                                <BsHandThumbsDownFill
                                  size={16}
                                  style={{ color: theme.colors.error }}
                                />
                              ) : (
                                <BsHandThumbsDown
                                  size={16}
                                  style={{ color: theme.colors.textSecondary }}
                                />
                              )}
                            </button>
                          </CustomTooltip>
 
                          {showDislikeOptions && (
                            <div
                              className="absolute top-full right-0 mt-1 rounded-md shadow-lg z-50 min-w-[180px]"
                              style={{
                                background: theme.colors.surface,
                                border: `1px solid ${theme.colors.border}`,
                                boxShadow: theme.shadow.md,
                              }}
                            >
                              {showCustomInput ? (
                                <div className="p-3">
                                  <textarea
                                    value={customReason}
                                    onChange={(e) =>
                                      setCustomReason(e.target.value)
                                    }
                                    placeholder="Enter your reason"
                                    rows={3}
                                    className="w-full p-2 rounded resize-none text-xs focus:outline-none"
                                    style={{
                                      background: theme.colors.background,
                                      color: theme.colors.text,
                                      border: `1px solid ${theme.colors.border}`,
                                    }}
                                  />
                                  <div className="flex justify-end mt-2 gap-2">
                                    <button
                                      onClick={() => {
                                        setShowCustomInput(false);
                                        setCustomReason("");
                                      }}
                                      className="px-2 py-1 rounded text-[10px]"
                                      style={{
                                        background: theme.colors.surface,
                                        color: theme.colors.text,
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
                                      className="px-2 py-1 rounded text-[10px]"
                                      style={{
                                        background: theme.colors.accent,
                                        color: "white",
                                      }}
                                    >
                                      Submit
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {[
                                    "Incorrect data",
                                    "Takes too long",
                                    "Irrelevant response",
                                    "Confusing answer",
                                    "Other",
                                  ].map((reason) => (
                                    <button
                                      key={reason}
                                      onClick={() => {
                                        if (reason === "Other")
                                          setShowCustomInput(true);
                                        else handleDislikeOption(reason);
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-xs transition-colors"
                                      style={{ color: theme.colors.text }}
                                      onMouseEnter={(e) =>
                                        (e.currentTarget.style.backgroundColor = `${theme.colors.accent}15`)
                                      }
                                      onMouseLeave={(e) =>
                                        (e.currentTarget.style.backgroundColor =
                                          "transparent")
                                      }
                                    >
                                      {reason}
                                    </button>
                                  ))}
                                </>
                              )}
                            </div>
                          )}
                        </div>
 
                        {/* Separator between reactions and edit */}
                        <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
 
                        <button
                          onClick={() => setIsEditing(true)}
                          disabled={isSubmitting}
                          className="px-2.5 py-1 rounded-md text-xs font-medium"
                          style={{
                            backgroundColor: `${theme.colors.accent}15`,
                            color: theme.colors.accent,
                            border: `1px solid ${theme.colors.accent}30`,
                          }}
                        >
                          Edit
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {hasKpis && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 px-3 mb-4 flex-shrink-0">
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
 
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] items-start lg:items-stretch w-full gap-5 pb-20 lg:pb-16 flex-1 min-h-0 px-3 lg:h-full">
              <div
                ref={graphContainerRef}
                className="w-full flex flex-col overflow-hidden min-w-0"
                style={{
                  maxHeight: "100%",
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}40`,
                  borderRadius: "1.5rem",
                  boxShadow: theme.shadow.md,
                }}
              >
                <div
                  className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0 min-h-[45px]"
                  style={{
                    borderColor: `${theme.colors.border}30`,
                    backgroundColor: theme.mode === 'light' ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)',
                  }}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider flex-shrink-0" style={{ color: theme.colors.textSecondary }}>
                    Visualization
                  </span>
                  {dashboardItem.mainViewData.chartData?.length > 0 && (
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5 max-w-[75%]">
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <label
                          htmlFor="graph-type-select"
                          className="text-[11px] font-medium"
                          style={{ color: theme.colors.textSecondary }}
                        >
                          Type:
                        </label>
                        <select
                          id="graph-type-select"
                          value={graphType}
                          onChange={(e) =>
                            setGraphType(e.target.value as SmartChartType)
                          }
                          className="px-2 py-0.5 text-xs rounded border outline-none cursor-pointer transition-all duration-150"
                          style={{
                            backgroundColor: theme.colors.background,
                            color: theme.colors.text,
                            borderColor: `${theme.colors.border}50`,
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
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <label
                            className="text-[11px] font-medium"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            Orient:
                          </label>
                          <select
                            value={isVertical ? "vertical" : "horizontal"}
                            onChange={(e) =>
                              setIsVertical(e.target.value === "vertical")
                            }
                            className="px-2 py-0.5 text-xs rounded border outline-none cursor-pointer transition-all duration-150"
                            style={{
                              backgroundColor: theme.colors.background,
                              color: theme.colors.text,
                              borderColor: `${theme.colors.border}50`,
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
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <label
                                className="text-[11px] font-medium"
                                style={{ color: theme.colors.textSecondary }}
                              >
                                Group:
                              </label>
                              <select
                                value={groupBy || ""}
                                onChange={(e) => setGroupBy(e.target.value)}
                                className="px-2 py-0.5 text-xs rounded border outline-none cursor-pointer transition-all duration-150"
                                style={{
                                  backgroundColor: theme.colors.background,
                                  color: theme.colors.text,
                                  borderColor: `${theme.colors.border}50`,
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
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <label
                                className="text-[11px] font-medium"
                                style={{ color: theme.colors.textSecondary }}
                              >
                                Agg:
                              </label>
                              <select
                                value={aggregate}
                                onChange={(e) =>
                                  setAggregate(e.target.value as SmartAggregation)
                                }
                                className="px-2 py-0.5 text-xs rounded border outline-none cursor-pointer transition-all duration-150"
                                style={{
                                  backgroundColor: theme.colors.background,
                                  color: theme.colors.text,
                                  borderColor: `${theme.colors.border}50`,
                                }}
                              >
                                <option value="count">Count</option>
                                <option value="sum">Sum</option>
                                <option value="avg">Average</option>
                                <option value="min">Minimum</option>
                                <option value="max">Maximum</option>
                              </select>
                            </div>
                            {(aggregate === "sum" ||
                              aggregate === "avg" ||
                              aggregate === "min" ||
                              aggregate === "max") && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <label
                                  className="text-[11px] font-medium"
                                  style={{ color: theme.colors.textSecondary }}
                                >
                                  Value:
                                </label>
                                <select
                                  value={valueKey || ""}
                                  onChange={(e) => setValueKey(e.target.value)}
                                  className="px-2 py-0.5 text-xs rounded border outline-none cursor-pointer transition-all duration-150"
                                  style={{
                                    backgroundColor: theme.colors.background,
                                    color: theme.colors.text,
                                    borderColor: `${theme.colors.border}50`,
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
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <label style={{ color: theme.colors.textSecondary }} className="text-[11px] font-medium">
                              X-Axis:
                            </label>
                            <select
                              value={groupBy || ""}
                              onChange={(e) => setGroupBy(e.target.value)}
                              className="px-2 py-0.5 text-xs rounded border outline-none cursor-pointer transition-all duration-150"
                              style={{
                                backgroundColor: theme.colors.background,
                                color: theme.colors.text,
                                borderColor: `${theme.colors.border}50`,
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
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <label style={{ color: theme.colors.textSecondary }} className="text-[11px] font-medium">
                              Y-Axis:
                            </label>
                            <select
                              value={valueKey || ""}
                              onChange={(e) => setValueKey(e.target.value)}
                              className="px-2 py-0.5 text-xs rounded border outline-none cursor-pointer transition-all duration-150"
                              style={{
                                backgroundColor: theme.colors.background,
                                color: theme.colors.text,
                                borderColor: `${theme.colors.border}50`,
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
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <label style={{ color: theme.colors.textSecondary }} className="text-[11px] font-medium">
                              {graphType === "radar"
                                ? "Category:"
                                : "Stage:"}
                            </label>
                            <select
                              value={groupBy || ""}
                              onChange={(e) => setGroupBy(e.target.value)}
                              className="px-2 py-0.5 text-xs rounded border outline-none cursor-pointer transition-all duration-150"
                              style={{
                                backgroundColor: theme.colors.background,
                                color: theme.colors.text,
                                borderColor: `${theme.colors.border}50`,
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
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <label style={{ color: theme.colors.textSecondary }} className="text-[11px] font-medium">
                              Value:
                            </label>
                            <select
                              value={valueKey || ""}
                              onChange={(e) => setValueKey(e.target.value)}
                              className="px-2 py-0.5 text-xs rounded border outline-none cursor-pointer transition-all duration-150"
                              style={{
                                backgroundColor: theme.colors.background,
                                color: theme.colors.text,
                                borderColor: `${theme.colors.border}50`,
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
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <label style={{ color: theme.colors.textSecondary }} className="text-[11px] font-medium">
                              Agg:
                            </label>
                            <select
                              value={aggregate}
                              onChange={(e) =>
                                setAggregate(e.target.value as SmartAggregation)
                              }
                              className="px-2 py-0.5 text-xs rounded border outline-none cursor-pointer transition-all duration-150"
                              style={{
                                backgroundColor: theme.colors.background,
                                color: theme.colors.text,
                                borderColor: `${theme.colors.border}50`,
                              }}
                            >
                              <option value="count">Count</option>
                              <option value="sum">Sum</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col items-stretch justify-end">
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

              <div
                className="w-full flex flex-col min-w-0 overflow-hidden"
                style={{
                  maxHeight: "100%",
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}40`,
                  borderRadius: "1.5rem",
                  boxShadow: theme.shadow.md,
                }}
              >
                <div
                  className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0 min-h-[45px]"
                  style={{
                    borderColor: `${theme.colors.border}30`,
                    backgroundColor: theme.mode === 'light' ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)',
                  }}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                    {activeViewType === "query" ? "SQL Query" : "Data Table"}
                  </span>
                  
                  {/* Segmented Switcher Control */}
                  <div
                    className="flex p-0.5 rounded-lg border"
                    style={{
                      backgroundColor: theme.mode === 'light' ? '#f1f5f9' : '#0f172a',
                      borderColor: theme.colors.border,
                    }}
                  >
                    {(["table", "query"] as const).map((viewType) => (
                      <button
                        key={viewType}
                        onClick={() => onViewTypeChange(viewType)}
                        disabled={isSubmitting}
                        className="px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150"
                        style={{
                          backgroundColor: activeViewType === viewType ? theme.colors.surface : "transparent",
                          color: activeViewType === viewType ? theme.colors.text : theme.colors.textSecondary,
                          boxShadow: activeViewType === viewType ? theme.shadow.sm : "none",
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
