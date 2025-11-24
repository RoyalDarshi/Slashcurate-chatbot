import React, { useState, useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { AreaChart as AreaChartIconLucide, Download } from "lucide-react";
import { useTheme } from "../../ThemeContext";
import html2canvas from "html2canvas";
import { useGraphData } from "../../hooks/useGraphData";
import { useGraphOptions } from "../../hooks/useGraphOptions";

interface ModernAreaGraphProps {
  data: any[];
  groupBy: string | null;
  setGroupBy: React.Dispatch<React.SetStateAction<string | null>>;
  aggregate: "sum" | "count" | "avg" | "min" | "max";
  setAggregate: React.Dispatch<React.SetStateAction<"sum" | "count" | "avg" | "min" | "max">>;
  valueKey: string | null;
  setValueKey: React.Dispatch<React.SetStateAction<string | null>>;
}

const DynamicAreaGraph: React.FC<ModernAreaGraphProps> = React.memo(
  ({
    data,
    groupBy,
    aggregate,
    setAggregate,
    setGroupBy,
    setValueKey,
    valueKey,
  }) => {
    const { theme } = useTheme();
    const [showResolutionOptions, setShowResolutionOptions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Use shared hooks
    const {
      graphData,
      isValidGraphData,
      autoGroupBy,
      autoValueKey,
      xKey,
      yKeys,
    } = useGraphData({
      data,
      groupBy,
      aggregate,
      valueKey,
      chartType: "area",
    });

    const option = useGraphOptions({
      graphData,
      xKey,
      yKeys,
      chartType: "area",
      isVertical: true,
    });

    // Sync auto-detected keys back to parent state if needed
    useEffect(() => {
      if (!groupBy && autoGroupBy) {
        setGroupBy(autoGroupBy);
      }
      if (!valueKey && autoValueKey && aggregate === "sum") {
        setValueKey(autoValueKey);
      }
    }, [groupBy, valueKey, autoGroupBy, autoValueKey, setGroupBy, setValueKey, aggregate]);

    // Function to handle graph download
    const handleDownloadGraph = async (resolution: "low" | "high") => {
      if (containerRef.current) {
        try {
          const scale = resolution === "high" ? 2 : 1;
          const canvas = await html2canvas(containerRef.current, {
            scale,
            useCORS: true,
            logging: false,
            backgroundColor: theme.colors.surface,
            onclone: (document, element) => {
              const svgElements = element.querySelectorAll("svg");
              svgElements.forEach((svg) => {
                svg.setAttribute(
                  "width",
                  svg.getBoundingClientRect().width.toString()
                );
                svg.setAttribute(
                  "height",
                  svg.getBoundingClientRect().height.toString()
                );
              });
            },
          });
          const image = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = image;
          link.download = `area_graph_${resolution}.png`;
          link.click();
        } catch (error) {
          console.error("Error downloading graph:", error);
        }
      }
      setShowResolutionOptions(false);
    };

    // Close resolution options when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          showResolutionOptions &&
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setShowResolutionOptions(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [showResolutionOptions]);

    if (!isValidGraphData) {
      return (
        <div
          className="flex flex-col items-center justify-center h-full p-12"
          style={{
            background: theme.colors.surface,
            backdropFilter: "blur(20px)",
            boxShadow: theme.shadow.lg,
          }}
        >
          <div
            style={{
              width: "100px",
              height: "100px",
              background: theme.gradients.primary,
              borderRadius: "50%",
              margin: "0 auto 32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: theme.shadow.md,
            }}
          >
            <AreaChartIconLucide size={48} color="white" />
          </div>
          <h3
            style={{
              color: theme.colors.text,
              fontSize: "28px",
              fontWeight: theme.typography.weight.bold,
              margin: "0 0 16px 0",
              textAlign: "center",
              fontFamily: theme.typography.fontFamily,
              background: theme.gradients.primary,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            No Data Visualization
          </h3>
          <p
            style={{
              color: theme.colors.textSecondary,
              fontSize: "18px",
              textAlign: "center",
              margin: 0,
              fontFamily: theme.typography.fontFamily,
              lineHeight: 1.6,
            }}
          >
            Configure your data grouping and aggregation settings to create
            stunning visualizations
          </p>
        </div>
      );
    }

    return (
      <div>
        <div
          className="flex flex-col"
          style={{
            background: theme.colors.surface,
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            overflow: "hidden",
            transition: "all 0.4s ease",
          }}
        >
          {/* Header managed by DashboardView */}
          <div
            style={{
              background: theme.gradients.glass,
              backdropFilter: "blur(20px)",
              borderBottom: `1px solid ${theme.colors.border}`,
            }}
          ></div>

          {/* Export Button */}
          <div className="flex justify-end mb-2">
            <div className="relative">
              <button
                onClick={() => setShowResolutionOptions(!showResolutionOptions)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg rounded-t-none rounded-br-none text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: `${theme.colors.accent}1A`,
                  color: theme.colors.accent,
                  border: `1px solid ${theme.colors.accent}33`,
                }}
                title="Export Graph"
              >
                <Download size={16} />
                <span>Export</span>
              </button>

              {showResolutionOptions && (
                <div
                  ref={dropdownRef}
                  className="absolute right-0 mt-1 py-1 rounded-lg shadow-lg z-10"
                  style={{
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                    minWidth: "120px",
                  }}
                >
                  <button
                    onClick={() => handleDownloadGraph("low")}
                    className="w-full text-left px-3 py-1.5 text-sm hover:opacity-80 transition-opacity"
                    style={{ color: theme.colors.text }}
                  >
                    Standard Quality
                  </button>
                  <button
                    onClick={() => handleDownloadGraph("high")}
                    className="w-full text-left px-3 py-1.5 text-sm hover:opacity-80 transition-opacity"
                    style={{ color: theme.colors.text }}
                  >
                    High Quality
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Chart Container */}
          <div className="flex-1" ref={containerRef}>
            <div
              style={{
                height: "calc(100vh - 265px)",
                width: "100%",
                minHeight: "300px",
                flex: 1,
                position: "relative",
              }}
            >
              <ReactECharts
                option={option}
                style={{ height: "100%", width: "100%" }}
                notMerge={true}
                lazyUpdate={true}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default DynamicAreaGraph;
