import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface DynamicBarGraphProps {
  data: any[];
}

const DynamicBarGraph: React.FC<DynamicBarGraphProps> = ({ data }) => {
  const [graphData, setGraphData] = useState<any[]>([]);
  const [xKey, setXKey] = useState<string | null>(null);
  const [yKeys, setYKeys] = useState<string[]>([]);
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

      // Filter out keys ending with "id" or "code" for Y-axis
      const filteredNumericKeys = numericKeys.filter(
        (key) =>
          !key.toLowerCase().endsWith("id") &&
          !key.toLowerCase().endsWith("code")
      );

      setYKeys(
        foundBranchId ? filteredNumericKeys : filteredNumericKeys.slice(1)
      );

      const normalizedData = data.map((item) => {
        const newItem: { [key: string]: string | number } = {};
        keys.forEach((key) => {
          if (
            typeof item[key] === "number" ||
            (typeof item[key] === "string" && !isNaN(Number(item[key])))
          ) {
            newItem[key] =
              typeof item[key] === "string" ? Number(item[key]) : item[key];
          } else if (typeof item[key] === "string") {
            newItem[key] = item[key];
          }
        });
        return newItem;
      });
      setGraphData(normalizedData);
    }
  };

  if (graphData.length === 0 || !xKey || yKeys.length === 0) {
    return <div>Loading... or No valid data for graph.</div>;
  }
  return (
    <BarChart width={730} height={250} data={graphData}>
      {console.log(graphData)}
      {console.log(yKeys)}
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={xKey} />
      <YAxis />
      <Tooltip />
      <Legend />
      {yKeys.map((yKey, index) => (
        <Bar key={yKey} dataKey={yKey} fill={colors[index % colors.length]} />
      ))}
    </BarChart>
  );
};

export default DynamicBarGraph;
