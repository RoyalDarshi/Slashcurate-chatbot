import React, { useState } from "react";
import { BarChart, Table } from "lucide-react";
import DataTable from "./DataTable";
import BankBarChart from "./Graphs/DynamicGraph";
import BankLineChart from "./Graphs/BankLineChart";
import BankAreaChart from "./Graphs/BankAreaChart";
import BankPieChart from "./Graphs/BankPieChart";

// Define props
interface CustomDataViewProps {
  data: any[];
  graphType: "pie" | "bar" | "line" | "area"; // Graph selection
}

const CustomDataView: React.FC<CustomDataViewProps> = ({ data, graphType }) => {
  const [showGraph, setShowGraph] = useState(false);

  return (
    <div className="rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Data View</h2>
      </div>

      {/* Table/Graph with Button Beside */}
      <div className="flex items-center space-x-4">
        {/* Data/Table or Graph */}
        <div className="flex-1 p-4 rounded-lg shadow-md over">
          {!showGraph ? (
            <DataTable data={data} />
          ) : graphType === "pie" ? (
            <BankPieChart data={data} />
          ) : graphType === "bar" ? (
            <BankBarChart data={data} />
          ) : graphType === "line" ? (
            <BankLineChart data={data} />
          ) : graphType === "area" ? (
            <BankAreaChart data={data} />
          ) : null}
        </div>

        {/* Toggle Button Beside */}
        <button
          onClick={() => setShowGraph(!showGraph)}
          className="p-3 text-white bg-blue-500 hover:bg-blue-700 rounded-full shadow-md transition-all flex items-center justify-center"
          aria-label="Toggle View"
        >
          {showGraph ? <Table size={24} /> : <BarChart size={24} />}
        </button>
      </div>
    </div>
  );
};

export default CustomDataView;
