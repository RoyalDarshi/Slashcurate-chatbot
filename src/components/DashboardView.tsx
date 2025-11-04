import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { HelpCircle, Heart, Database, Table } from "lucide-react";
import {
  BsHandThumbsDown,
  BsHandThumbsDownFill,
  BsHandThumbsUp,
  BsHandThumbsUpFill,
} from "react-icons/bs";
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
import { DashboardItem } from "./DashboardInterface";
import SummaryModal from "./SummaryModal";
import CustomTooltip from "./CustomTooltip";
import { toast } from "react-toastify";
import axios from "axios";
import { API_URL } from "../config";

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
    isCurrentlyFavorited: boolean
  ) => Promise<void>;
  sessionConErr: boolean;
  graphSummary: string | null;
  onEditQuestion: (
    questionMessageId: string,
    newQuestion: string
  ) => Promise<void>;
  onUpdateReaction: (
    questionMessageId: string,
    reaction: "like" | "dislike" | null,
    dislike_reason: string | null
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

    const [showDislikeOptions, setShowDislikeOptions] = useState(false);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customReason, setCustomReason] = useState("");

    const graphContainerRef = useRef<HTMLDivElement>(null);
    const dislikeRef = useRef<HTMLDivElement>(null);

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

    const getValidValueKeys = (data: any[]): string[] => {
      if (!data || data.length === 0) return [];
      return Object.keys(data[0]).filter(
        (key) => !isKeyExcluded(key) && typeof data[0][key] === "number"
      );
    };

    const getValidCategoricalKeys = (data: any[]): string[] => {
      if (!data || data.length === 0) return [];
      return Object.keys(data[0]).filter(
        (key) =>
          !isKeyExcluded(key) &&
          (typeof data[0][key] === "string" ||
            typeof data[0][key] === "boolean")
      );
    };

    useEffect(() => {
      const chartData = dashboardItem.mainViewData.chartData;
      if (chartData && chartData.length > 0) {
        const validKeys = getValidValueKeys(chartData);
        setGroupBy(getValidCategoricalKeys(chartData)[0] || null);
        setValueKey(validKeys[0] || null);
        setAggregate("sum");
        setGraphType("bar");
      } else {
        setGroupBy(null);
        setValueKey(null);
      }
    }, [dashboardItem.mainViewData.chartData]);

    useEffect(() => {
      if (graphSummary) setShowSummaryModal(true);
    }, [graphSummary]);

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
          }
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
            }
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
          }
        );
        onUpdateReaction(dashboardItem.questionMessageId, "dislike", reason);
      } catch (error) {
        console.error("Error setting dislike reaction:", error);
        toast.error("Failed to set dislike reaction.");
      }
    };

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

    // **FIX 1: Use the `isError` flag passed in the dashboard item**
    const isErrorState = dashboardItem.isError;

    if (isErrorState) {
      return (
        <div
          className="flex flex-col items-center justify-center h-full p-4"
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
                    dashboardItem.question
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
                        editedQuestion
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
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }


    return (
      <div>
        {isSubmitting ? (
          <DashboardSkeletonLoader
            theme={theme}
            question={dashboardItem.question}
          />
        ) : (
          <div
            className="flex flex-col flex-grow h-full min-h-[500px] px-2 pt-2"
            style={{ backgroundColor: theme.colors.background }}
          >
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
                            editedQuestion
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
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3
                    className="text-xl font-bold w-full text-center"
                    style={{ color: theme.colors.text }}
                  >
                    Question: {dashboardItem.question}
                  </h3>
                  <div className="flex items-center gap-2">
                    {!sessionConErr && (
                      <button
                        onClick={() => setIsEditing(true)}
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-md"
                        style={{
                          backgroundColor: theme.colors.accent,
                          color: "white",
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </>
              )}
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
                }}
              >
                {dashboardItem.mainViewData.chartData?.length > 0 && (
                  <div className="p-2 flex flex-wrap gap-3">
                    {["bar", "line", "area", "pie"].includes(graphType) &&
                      groupBy && (
                        <>
                          <div className="flex items-center gap-2">
                            <label
                              htmlFor="graph-type-select"
                              style={{ color: theme.colors.textSecondary }}
                            >
                              Graph Type:
                            </label>
                            <select
                              id="graph-type-select"
                              value={graphType}
                              onChange={(e) => setGraphType(e.target.value)}
                              className="px-2 py-1 rounded-md border"
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
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <label
                              style={{ color: theme.colors.textSecondary }}
                            >
                              Group By:
                            </label>
                            <select
                              value={groupBy || ""}
                              onChange={(e) => setGroupBy(e.target.value)}
                              className="px-2 py-1 rounded-md border"
                              style={{
                                backgroundColor: theme.colors.surface,
                                color: theme.colors.text,
                                borderColor: theme.colors.border,
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
                              style={{ color: theme.colors.textSecondary }}
                            >
                              Aggregate:
                            </label>
                            <select
                              value={aggregate}
                              onChange={(e) =>
                                setAggregate(e.target.value as "sum" | "count")
                              }
                              className="px-2 py-1 rounded-md border"
                              style={{
                                backgroundColor: theme.colors.surface,
                                color: theme.colors.text,
                                borderColor: theme.colors.border,
                              }}
                            >
                              <option value="count">Count</option>
                              <option value="sum">Sum</option>
                            </select>
                          </div>
                          {aggregate === "sum" && (
                            <div className="flex items-center gap-2">
                              <label
                                style={{ color: theme.colors.textSecondary }}
                              >
                                Value Key:
                              </label>
                              <select
                                value={valueKey || ""}
                                onChange={(e) => setValueKey(e.target.value)}
                                className="px-2 py-1 rounded-md border"
                                style={{
                                  backgroundColor: theme.colors.surface,
                                  color: theme.colors.text,
                                  borderColor: theme.colors.border,
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
                          <label style={{ color: theme.colors.textSecondary }}>
                            X-Axis:
                          </label>
                          <select
                            value={groupBy || ""}
                            onChange={(e) => setGroupBy(e.target.value)}
                            className="px-2 py-1 rounded-md border"
                            style={{
                              backgroundColor: theme.colors.surface,
                              color: theme.colors.text,
                              borderColor: theme.colors.border,
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
                          <label style={{ color: theme.colors.textSecondary }}>
                            Y-Axis:
                          </label>
                          <select
                            value={valueKey || ""}
                            onChange={(e) => setValueKey(e.target.value)}
                            className="px-2 py-1 rounded-md border"
                            style={{
                              backgroundColor: theme.colors.surface,
                              color: theme.colors.text,
                              borderColor: theme.colors.border,
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
                    {["radar", "funnel"].includes(graphType) && (
                      <>
                        <div className="flex items-center gap-2">
                          <label style={{ color: theme.colors.textSecondary }}>
                            {graphType === "radar"
                              ? "Category By:"
                              : "Stage By:"}
                          </label>
                          <select
                            value={groupBy || ""}
                            onChange={(e) => setGroupBy(e.target.value)}
                            className="px-2 py-1 rounded-md border"
                            style={{
                              backgroundColor: theme.colors.surface,
                              color: theme.colors.text,
                              borderColor: theme.colors.border,
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
                          <label style={{ color: theme.colors.textSecondary }}>
                            Value:
                          </label>
                          <select
                            value={valueKey || ""}
                            onChange={(e) => setValueKey(e.target.value)}
                            className="px-2 py-1 rounded-md border"
                            style={{
                              backgroundColor: theme.colors.surface,
                              color: theme.colors.text,
                              borderColor: theme.colors.border,
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
                          <label style={{ color: theme.colors.textSecondary }}>
                            Aggregate:
                          </label>
                          <select
                            value={aggregate}
                            onChange={(e) =>
                              setAggregate(e.target.value as "sum" | "count")
                            }
                            className="px-2 py-1 rounded-md border"
                            style={{
                              backgroundColor: theme.colors.surface,
                              color: theme.colors.text,
                              borderColor: theme.colors.border,
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
                <div className="flex-1">
                  {graphType === "bar" && (
                    <DynamicBarGraph
                      graphKey={dashboardItem.questionMessageId}
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

              <div className="lg:w-[40%] w-full mx-2 overflow-hidden">
                {activeViewType === "table" && (
                  <DataTable data={dashboardItem.mainViewData.tableData} />
                )}
                {activeViewType === "query" && (
                  <QueryDisplay
                    query={dashboardItem.mainViewData.queryData}
                    fontSize="text-base"
                  />
                )}
              </div>

              <div className="flex flex-col justify-between items-center flex-shrink-0 mt-4 lg:mt-0">
                {/* Table and Query buttons at the top */}
                <div className="flex flex-row lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2">
                  {(["table", "query"] as const).map((viewType) => (
                    <button
                      key={viewType}
                      onClick={() => onViewTypeChange(viewType)}
                      disabled={isSubmitting}
                      title={
                        viewType.charAt(0).toUpperCase() + viewType.slice(1)
                      }
                      className={`p-2.5 shadow-lg rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50`}
                      style={{
                        backgroundColor:
                          activeViewType === viewType
                            ? theme.colors.accent
                            : theme.colors.surface,
                        color:
                          activeViewType === viewType
                            ? "white"
                            : theme.colors.accent,
                        border: `1px solid ${theme.colors.text}10`,
                        boxShadow: theme.shadow.lg,
                      }}
                    >
                      {viewType === "table" && <Table size={24} />}
                      {viewType === "query" && <Database size={24} />}
                    </button>
                  ))}
                </div>

                {/* Favorite, Like, and Dislike buttons at the bottom */}
                {!sessionConErr && (
                  <div className="flex flex-row lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 mt-4">
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
                            dashboardItem.isFavorited
                          )
                        }
                        disabled={isSubmitting}
                        className="pl-2 pb-2 rounded-full"
                        style={{
                          color: dashboardItem.isFavorited
                            ? "#FF4D4D"
                            : theme.colors.textSecondary,
                          backgroundColor: "transparent",
                        }}
                      >
                        <Heart
                          size={32}
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
                        className="pl-2 pb-2 rounded-md"
                      >
                        {isLiked ? (
                          <BsHandThumbsUpFill
                            size={32}
                            style={{ color: theme.colors.success }}
                          />
                        ) : (
                          <BsHandThumbsUp
                            size={32}
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
                          className="pl-2 rounded-md"
                        >
                          {isDisliked ? (
                            <BsHandThumbsDownFill
                              size={32}
                              style={{ color: theme.colors.error }}
                            />
                          ) : (
                            <BsHandThumbsDown
                              size={32}
                              style={{ color: theme.colors.textSecondary }}
                            />
                          )}
                        </button>
                      </CustomTooltip>
                      {showDislikeOptions && (
                        <div
                          className="absolute bottom-full right-0 mb-2 rounded-md shadow-lg z-10 min-w-[180px]"
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
                                className="w-full p-2 rounded resize-none focus:outline-none"
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
                                  className="px-2 py-1 rounded"
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
                                  className="px-2 py-1 rounded"
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
                                  className="w-full text-left px-3 py-2 text-sm"
                                  style={{ color: theme.colors.text }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.backgroundColor = `${theme.colors.accent}20`)
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
                  </div>
                )}
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
