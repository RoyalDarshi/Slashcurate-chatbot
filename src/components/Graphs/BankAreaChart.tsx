import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Define the expected structure of data
interface BankData {
  month: string;
  transactions: number;
}

// Define props interface
interface BankAreaChartProps {
  data: BankData[];
}

const BankAreaChart: React.FC<BankAreaChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="transactions"
          stroke="#FFC107"
          fill="#FFC107"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default BankAreaChart;
