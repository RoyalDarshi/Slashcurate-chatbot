import React from "react";
import {
  BarChart,
  Bar,
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
  loans: number;
}

// Define props interface
interface BankBarChartProps {
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


const BankBarChart: React.FC<BankBarChartProps> = ({ data }) => {
  console.log(data);
  return (
    <ResponsiveContainer className={"w-4/5"} height={350}>
      <BarChart data={bankData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="loans" fill="#2196F3" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BankBarChart;
