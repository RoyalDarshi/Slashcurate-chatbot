import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface DynamicGraphProps {
  data: any[];
}

const DynamicGraph: React.FC<DynamicGraphProps> = ({ data }) => {
  const [graphData, setGraphData] = useState<any[]>([]);
  const [xKey, setXKey] = useState<string | null>(null);
  const [yKeys, setYKeys] = useState<string[]>([]);

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
      setYKeys(foundBranchId ? numericKeys : numericKeys.slice(1));

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
    <LineChart width={730} height={250} data={graphData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={xKey} />
      <YAxis />
      <Tooltip />
      <Legend />
      {yKeys.map((yKey) => (
        <Line
          key={yKey}
          type="monotone"
          dataKey={yKey}
          stroke={`#${Math.floor(Math.random() * 16777215).toString(16)}`}
        />
      ))}
    </LineChart>
  );
};

export default DynamicGraph;
