// components/attendance/AttendanceStats.tsx
import React from "react";
import { Calendar, Clock, TrendingUp, Users } from "lucide-react";
import { AttendanceStats as IAttendanceStats } from "@/types/attendance";

interface AttendanceStatsProps {
  stats: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    halfDays: number;
    workFromHome: number;
    workFromOffice: number;
    totalHoursWorked: number;
    averageHoursPerDay: number;
    overtimeHours: number;
    attendanceRate: number;
    totalOfficeHours: number;
    totalHomeHours: number;
  };
}

const AttendanceStats: React.FC<AttendanceStatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: "Work From Home Days",
      value: `${stats.workFromHome ?? 0}`,
      icon: Calendar,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      change: "",
      changeType: "positive" as const,
    },
    {
      title: "Work From Office Days",
      value: `${stats.workFromOffice ?? 0}`,
      icon: Calendar,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      change: "",
      changeType: "positive" as const,
    },
    {
      title: "Half Days",
      value: `${stats.halfDays ?? 0}`,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      change: "",
      changeType: "positive" as const,
    },
    {
      title: "Total Office Hours",
      value: `${stats.totalOfficeHours ?? 0}`,
      icon: Users,
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      change: "",
      changeType: "positive" as const,
    },
    {
      title: "Total Home Hours",
      value: `${stats.totalHomeHours ?? 0}`,
      icon: Users,
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      change: "",
      changeType: "positive" as const,
    },
    {
      title: "Total Hours Worked",
      value: `${stats.totalHoursWorked}`,
      icon: Users,
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      change: "",
      changeType: "positive" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <div className="flex items-center mt-2">
                  <span
                    className={`text-sm font-medium ${
                      stat.changeType === "positive"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    vs last period
                  </span>
                </div>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AttendanceStats;
