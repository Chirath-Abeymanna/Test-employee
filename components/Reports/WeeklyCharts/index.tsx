// components/attendance/WeeklyChart.tsx
import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AttendanceData, ChartType } from "@/types/attendance";

interface WeeklyChartProps {
  data: AttendanceData[];
  type: ChartType;
}

interface LocationChartData {
  name: string;
  value: number;
  color: string;
}

const WeeklyChart: React.FC<WeeklyChartProps> = ({ data, type }) => {
  // Defensive: ensure data is always an array
  // Transform data for different chart types
  const transformData = () => {
    switch (type) {
      case "attendance":
        if (!safeData || safeData.length === 0) return [];
        return safeData.slice(-7).map((item) => ({
          date:
            item && item.date
              ? new Date(item.date).toLocaleDateString("en-US", {
                  weekday: "short",
                })
              : "",
          present: item?.present ?? 0,
          absent: item?.absent ?? 0,
          halfDay: item?.halfDay ?? 0,
        }));

      case "hours":
        return data.slice(-7).map((item) => ({
          date: new Date(item.date).toLocaleDateString("en-US", {
            weekday: "short",
          }),
          totalHours: item.totalHours,
          overtimeHours: item.overtimeHours,
        }));

      case "location":
        const totalWFH = data
          .slice(-7)
          .reduce((sum, item) => sum + item.workFromHome, 0);
        const totalWFO = data
          .slice(-7)
          .reduce((sum, item) => sum + item.workFromOffice, 0);
        return [
          { name: "Work From Home", value: totalWFH, color: "#3B82F6" },
          { name: "Work From Office", value: totalWFO, color: "#8B5CF6" },
        ];

      case "overtime":
        return data.slice(-7).map((item) => ({
          date: new Date(item.date).toLocaleDateString("en-US", {
            weekday: "short",
          }),
          overtimeHours: item.overtimeHours,
        }));

      default:
        return [];
    }
  };

  // Defensive: ensure data is always an array
  const safeData = Array.isArray(data) ? data : [];
  const chartData = transformData();

  const renderChart = () => {
    if (
      !Array.isArray(chartData) ||
      chartData.length === 0 ||
      chartData[0] === undefined
    ) {
      return <div className="text-gray-500">No data available for chart.</div>;
    }
    switch (type) {
      case "attendance":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="present"
                stackId="a"
                fill="#10B981"
                name="Present"
              />
              <Bar
                dataKey="halfDay"
                stackId="a"
                fill="#F59E0B"
                name="Half Day"
              />
              <Bar dataKey="absent" stackId="a" fill="#EF4444" name="Absent" />
            </BarChart>
          </ResponsiveContainer>
        );

      case "hours":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalHours"
                stroke="#3B82F6"
                strokeWidth={3}
                name="Total Hours"
              />
              <Line
                type="monotone"
                dataKey="overtimeHours"
                stroke="#F59E0B"
                strokeWidth={2}
                name="Overtime Hours"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "location":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(chartData as LocationChartData[]).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case "overtime":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="overtimeHours"
                fill="#F59E0B"
                name="Overtime Hours"
              />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Chart type not supported</div>;
    }
  };

  const getChartTitle = () => {
    switch (type) {
      case "attendance":
        return "Weekly Attendance Overview";
      case "hours":
        return "Weekly Hours Worked";
      case "location":
        return "Work Location Distribution";
      case "overtime":
        return "Weekly Overtime Hours";
      default:
        return "Chart";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {getChartTitle()}
      </h3>
      {renderChart()}
    </div>
  );
};

export default WeeklyChart;
