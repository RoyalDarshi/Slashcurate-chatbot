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

interface DynamicBarGraphProps {
  data: any[];
}

const DynamicBarGraph: React.FC<DynamicBarGraphProps> = ({ data }) => {
  const [graphData, setGraphData] = useState<any[]>([]);
  const [xKey, setXKey] = useState<string | null>(null);
  const [yKeys, setYKeys] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const colors = [
    "#6A0DAD", // Deep Purple
    "#1E90FF", // Bright Blue
    "#32CD32", // Lime Green
    "#FF4500", // Orange-Red
    "#FFA500", // Lavender
    "#4DB6AC", // Teal
    "#FFB74D", // Amber
    "#81D4FA", // Light Sky Blue
    "#CE93D8", // Light Purple
    "#A1887F", // Brown
  ];

  useEffect(() => {
    processApiData(data);
  }, [data]);

  const processApiData = (data: any[]) => {
    try {
      if (!data || data.length === 0) return;

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

        setYKeys(
          foundBranchId ? filteredNumericKeys : filteredNumericKeys.slice(1)
        );
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
      }
    } catch (error) {
      console.error("Error processing data:", error);
    }
  };

  const handleMouseEnter = (index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-elevation-medium border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full transition-colors"
                style={{ backgroundColor: entry.color }}
              />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {entry.name}: {entry.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        {payload.map((entry: any, index: number) => (
          <div
            key={index}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setSelectedMetric(entry.value)}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span
              className={`text-sm ${
                selectedMetric === entry.value
                  ? "font-semibold text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (graphData.length === 0 || !xKey || yKeys.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">
          No valid data for graph.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{ width: "55vw" }}
      className="w-full max-w-full overflow-hidden card bg-white dark:bg-gray-800 rounded-l"
    >
      <div className="relative w-full" style={{ minHeight: "400px" }}>
        <div className="absolute inset-0 flex flex-col">
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={graphData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                className="text-gray-800 dark:text-gray-200"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-gray-200 dark:stroke-gray-700"
                  opacity={0.5}
                />
                <XAxis
                  dataKey={xKey}
                  tick={{
                    fill: "currentColor",
                    fontSize: 12,
                  }}
                  tickLine={{ stroke: "currentColor" }}
                  axisLine={{ stroke: "currentColor" }}
                  interval={0}
                  angle={-45}
                  className="dark:text-gray-400"
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  domain={[0, "dataMax + 10"]}
                  tick={{
                    fill: "currentColor",
                    fontSize: 12,
                  }}
                  tickLine={{ stroke: "currentColor" }}
                  axisLine={{ stroke: "currentColor" }}
                  className="dark:text-gray-400"
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
                {yKeys.map((yKey, index) => (
                  <Bar
                    key={yKey}
                    dataKey={yKey}
                    fill={colors[index % colors.length]}
                    barSize={20}
                    onMouseEnter={() => handleMouseEnter(index)}
                    onMouseLeave={handleMouseLeave}
                    opacity={
                      selectedMetric ? (selectedMetric === yKey ? 1 : 0.3) : 1
                    }
                    className="transition-opacity duration-300"
                  >
                    {graphData.map((entry, entryIndex) => (
                      <Cell
                        key={`cell-${entryIndex}`}
                        fill={colors[index % colors.length]}
                        className="transition-all duration-300 hover:brightness-110"
                        opacity={
                          activeIndex === index || activeIndex === null
                            ? 1
                            : 0.3
                        }
                      />
                    ))}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicBarGraph;