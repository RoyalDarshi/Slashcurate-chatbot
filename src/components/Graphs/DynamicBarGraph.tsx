import React, { useState, useEffect } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { useTheme } from "../../ThemeContext";

interface DynamicBarGraphProps {
  data: any[];
  showTable: (setTable: boolean) => void;
  isValidGraph: (validData: boolean) => void;
}

const DynamicBarGraph: React.FC<DynamicBarGraphProps> = ({
  data,
  showTable,
  isValidGraph,
}) => {
  const { theme } = useTheme();
  const [graphData, setGraphData] = useState<any[]>([]);
  const [xKey, setXKey] = useState<string | null>(null);
  const [yKeys, setYKeys] = useState<string[]>([]);
  const [isValidGraphData, setIsValidGraphData] = useState<boolean>(true);

  useEffect(() => {
    processApiData(data);
  }, [data]);

  useEffect(() => {
    showTable(!isValidGraphData);
    isValidGraph(isValidGraphData);
  }, [isValidGraphData, showTable, isValidGraph]);

  const processApiData = (data: any[]) => {
    try {
      if (!data || data.length === 0) {
        setIsValidGraphData(false);
        return;
      }

      const firstItem = data[0];
      const keys = Object.keys(firstItem);

      let foundBranchId = false;

      if (keys.includes("branch_id")) {
        setXKey("branch_id");
        foundBranchId = true;
      } else if (keys.includes("customer_id")) {
        setXKey("customer_id");
        foundBranchId = true;
      }

      const numericKeys = keys.filter((key) => {
        if (foundBranchId && key === "branch_id") return false;
        const value = firstItem[key];
        return (
          typeof value === "number" ||
          (typeof value === "string" && !isNaN(Number(value)))
        );
      });

      if (numericKeys.length >= 1) {
        if (!foundBranchId) {
          const xCandidates = numericKeys.filter(
            (key) =>
              !key.toLowerCase().endsWith("id") &&
              !key.toLowerCase().endsWith("code") &&
              key.toLowerCase() !== "phone_number"
          );
          if (xCandidates.length > 0) {
            setXKey(xCandidates[0]);
          } else {
            setXKey(numericKeys[0]);
          }
        }

        const filteredNumericKeys = numericKeys.filter(
          (key) =>
            !key.toLowerCase().endsWith("id") &&
            !key.toLowerCase().endsWith("code") &&
            key.toLowerCase() !== "phone_number"
        );

        setYKeys(filteredNumericKeys);

        const normalizedData = data.map((item) => {
          const newItem: { [key: string]: string | number } = {};
          keys.forEach((key) => {
            const value = item[key];
            if (
              typeof value === "number" ||
              (typeof value === "string" && !isNaN(Number(value)))
            ) {
              newItem[key] =
                typeof value === "string" ? parseFloat(value) : value;
            } else if (typeof value === "string") {
              newItem[key] = value;
            }
          });
          return newItem;
        });
        setGraphData(normalizedData);
        setIsValidGraphData(filteredNumericKeys.length > 0);
      } else {
        setIsValidGraphData(false);
      }
    } catch (error) {
      console.error("Error processing data:", error);
      setIsValidGraphData(false);
    }
  };

  if (!isValidGraphData) {
    return (
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: "4px",
          border: `1px solid ${theme.colors.border}`,
          padding: "16px",
        }}
      >
        <p
          style={{
            color: theme.colors.textSecondary,
            textAlign: "center",
            marginTop: "8px",
          }}
        >
          Insufficient numeric data for graph visualization
        </p>
      </div>
    );
  }

  const stunningColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEEAD",
    "#D4A5A5",
    "#9B59B6",
    "#3498DB",
  ];

  return (
    <div
      style={{
        width: "55vw",
        height: 400,
        overflowX: "auto",
        overflowY: "hidden",
      }}
    >
      <div
        style={{
          width:
            graphData.length * 100 > (55 * window.innerWidth) / 100
              ? `${graphData.length * 100}px`
              : "100%",
          height: "100%",
        }}
      >
        <ResponsiveBar
          data={graphData}
          keys={yKeys}
          indexBy={xKey!}
          margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
          padding={0.1}
          groupMode="grouped"
          colors={stunningColors}
          borderRadius={4}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: xKey || "X-Axis",
            legendPosition: "middle",
            legendOffset: 36,
            tickColor: theme.colors.textSecondary,
            legendTextColor: theme.colors.textSecondary,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            tickColor: theme.colors.textSecondary,
            legendTextColor: theme.colors.textSecondary,
          }}
          gridYValues={5}
          enableLabel={false}
          animate={true}
          motionStiffness={90}
          motionDamping={15}
          theme={{
            textColor: theme.colors.text,
            fontSize: 12,
            grid: { line: { stroke: theme.colors.border, strokeWidth: 1 } },
            axis: {
              ticks: {
                line: { stroke: theme.colors.border },
                text: { fill: theme.colors.textSecondary },
              },
              legend: { text: { fill: theme.colors.textSecondary } },
              domain: {
                line: { stroke: theme.colors.textSecondary, strokeWidth: 1 },
              },
            },
            tooltip: {
              container: {
                background: theme.colors.surface,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
              },
            },
            background: theme.colors.surface,
          }}
          tooltip={({ id, value, color }) => (
            <div
              style={{
                padding: "8px",
                background: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.text,
              }}
            >
              <strong>{id}:</strong> {value}
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: color,
                  display: "inline-block",
                  marginLeft: "8px",
                }}
              />
            </div>
          )}
        />
      </div>
    </div>
  );
};

export default DynamicBarGraph;
