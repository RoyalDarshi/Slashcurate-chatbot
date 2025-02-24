import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Define the expected structure of data
interface BankData {
  month: string;
  deposits: number;
  withdrawals: number;
}

// Define props interface
interface BankLineChartProps {
  data: BankData[];
}

export const bankData = [
  {
    month: "Jan",
    deposits: 5000,
    withdrawals: 2000,
    loans: 1500,
    transactions: 300,
  },
  {
    month: "Feb",
    deposits: 6000,
    withdrawals: 2500,
    loans: 1800,
    transactions: 340,
  },
  {
    month: "Mar",
    deposits: 5500,
    withdrawals: 2200,
    loans: 2000,
    transactions: 310,
  },
  {
    month: "Apr",
    deposits: 7000,
    withdrawals: 2800,
    loans: 2300,
    transactions: 400,
  },
  {
    month: "May",
    deposits: 7500,
    withdrawals: 3000,
    loans: 2500,
    transactions: 420,
  },
  {
    month: "Jun",
    deposits: 8000,
    withdrawals: 3200,
    loans: 2800,
    transactions: 450,
  },
];


const BankLineChart: React.FC<BankLineChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={bankData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="deposits"
          stroke="#4CAF50"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="withdrawals"
          stroke="#F44336"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default BankLineChart;
