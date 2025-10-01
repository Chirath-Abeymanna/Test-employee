// components/attendance/MonthlyChart.tsx
import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AttendanceData, ChartType } from "@/types/attendance";

interface MonthlyChartProps {
  data: AttendanceData[];
  type: ChartType;
}

const COLORS = ["#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6"];

const MonthlyChart: React.FC<MonthlyChartProps> = ({ data, type }) => {
  // Aggregate monthly data for pie chart
  const getPieData = () => {
    let pieData: { name: string; value: number }[] = [];
    switch (type) {
      case "attendance": {
        const totalPresent = data.reduce((sum, item) => sum + item.present, 0);
        const totalAbsent = data.reduce((sum, item) => sum + item.absent, 0);
        const totalHalfDay = data.reduce((sum, item) => sum + item.halfDay, 0);
        pieData = [
          { name: "Present", value: totalPresent },
          { name: "Half Day", value: totalHalfDay },
          { name: "Absent", value: totalAbsent },
        ];
        break;
      }
      case "hours": {
        const totalRegular = data.reduce(
          (sum, item) =>
            sum + Math.max(0, item.totalHours - item.overtimeHours),
          0
        );
        const totalOvertime = data.reduce(
          (sum, item) => sum + item.overtimeHours,
          0
        );
        pieData = [
          { name: "Regular Hours", value: totalRegular },
          { name: "Overtime Hours", value: totalOvertime },
        ];
        break;
      }
      case "location": {
        const totalWFH = data.reduce((sum, item) => sum + item.workFromHome, 0);
        const totalWFO = data.reduce(
          (sum, item) => sum + item.workFromOffice,
          0
        );
        pieData = [
          { name: "Work From Home", value: totalWFH },
          { name: "Work From Office", value: totalWFO },
        ];
        break;
      }
      case "overtime": {
        const totalOvertime = data.reduce(
          (sum, item) => sum + item.overtimeHours,
          0
        );
        pieData = [{ name: "Overtime Hours", value: totalOvertime }];
        break;
      }
      default:
        pieData = [];
    }
    // Filter out zero-value slices
    return pieData.filter((entry) => entry.value > 0);
  };

  const pieData = getPieData();

  // Custom color mapping for attendance
  const getAttendanceColor = (name: string) => {
    if (name === "Present") return "#10B981"; // green
    if (name === "Half Day") return "#F59E0B"; // yellow
    if (name === "Absent") return "#EF4444"; // red
    return "#3B82F6"; // fallback blue
  };

  const getChartTitle = () => {
    switch (type) {
      case "attendance":
        return "Monthly Attendance Distribution";
      case "hours":
        return "Monthly Hours Breakdown";
      case "location":
        return "Monthly Work Location Split";
      case "overtime":
        return "Monthly Overtime Total";
      default:
        return "Monthly Chart";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {getChartTitle()}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent }) =>
              `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
            }
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  type === "attendance"
                    ? getAttendanceColor(entry.name)
                    : COLORS[index % COLORS.length]
                }
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyChart;
