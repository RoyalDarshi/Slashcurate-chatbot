// DynamicBarGraph.tsx
import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTheme } from "../../ThemeContext";

interface DynamicBarGraphProps {
  data: any[];
  showTable: (setTable:boolean) => void;
  isValidGraph: (validData:boolean) => void;
}

const DynamicBarGraph: React.FC<DynamicBarGraphProps> = ({ data,showTable,isValidGraph }) => {
  const { theme } = useTheme();
  const [graphData, setGraphData] = useState<any[]>([]);
  const [xKey, setXKey] = useState<string | null>(null);
  const [yKeys, setYKeys] = useState<string[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [isValidGraphData, setIsValidGraphData] = useState<boolean>(true);

  const colors = [
    theme.colors.accent,
    "#4CAF50",
    "#FF9800",
    "#03A9F4",
    "#E91E63",
    "#9C27B0",
    "#FFC107",
    "#2196F3",
    "#673AB7",
  ];

  useEffect(() => {
    processApiData(data);
  }, [data]);

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
        if (foundBranchId && key === "branch_id") {
          return false;
        }
        return (
          typeof firstItem[key] === "number" ||
          (typeof firstItem[key] === "string" && !isNaN(Number(firstItem[key])))
        );
      });

      if (numericKeys.length >= 1) {
        if (!foundBranchId) {
          setXKey(numericKeys[0]);
        }

        const filteredNumericKeys = numericKeys.filter(
          (key) =>
            !key.toLowerCase().endsWith("id") &&
            !key.toLowerCase().endsWith("code")
        );

        setYKeys(filteredNumericKeys);
        setSelectedMetric(filteredNumericKeys[0]);

        const normalizedData = data.map((item) => {
          const newItem: { [key: string]: string | number } = {};
          keys.forEach((key) => {
            if (
              typeof item[key] === "number" ||
              (typeof item[key] === "string" && !isNaN(Number(item[key])))
            ) {
              newItem[key] =
                typeof item[key] === "string"
                  ? parseFloat(item[key])
                  : item[key];
            } else if (typeof item[key] === "string") {
              newItem[key] = item[key];
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            padding: "8px",
            borderRadius: "4px",
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <p>
            <strong>{label}</strong>
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index}>
              <span
                style={{
                  display: "inline-block",
                  width: "10px",
                  height: "10px",
                  backgroundColor: entry.color,
                  marginRight: "5px",
                }}
              ></span>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!isValidGraphData) {
    showTable(true)
    isValidGraph(false)
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

  return (
    <div style={{ width: "55vw" }}>
      <ResponsiveContainer height={400}>
        <BarChart
          data={graphData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} />
          <XAxis
            dataKey={xKey}
            tick={{ fill: theme.colors.textSecondary }}
            axisLine={{ stroke: theme.colors.border }}
          />
          <YAxis
            domain={[0, "dataMax + 10"]}
            tick={{ fill: theme.colors.textSecondary }}
            axisLine={{ stroke: theme.colors.border }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            onClick={({ dataKey }) => setSelectedMetric(dataKey)}
            formatter={(value: string, entry: any) => (
              <span
                style={{
                  color:
                    selectedMetric === value
                      ? theme.colors.accent
                      : theme.colors.textSecondary,
                }}
              >
                {value}
              </span>
            )}
          />
          {yKeys.map((yKey, index) => (
            <Bar
              key={yKey}
              dataKey={yKey}
              fill={colors[index % colors.length]}
              opacity={selectedMetric ? (selectedMetric === yKey ? 1 : 0.3) : 1}
            >
              {graphData.map((_, idx) => (
                <Cell key={`cell-${idx}`} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DynamicBarGraph;
