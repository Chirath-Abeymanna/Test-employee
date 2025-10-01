// components/attendance/AttendanceOverview.tsx
import React from "react";
import { CheckCircle, XCircle, Clock, Home, Building } from "lucide-react";
import { AttendanceData } from "@/types/attendance";

interface AttendanceOverviewProps {
  data: AttendanceData[];
}

const AttendanceOverview: React.FC<AttendanceOverviewProps> = ({ data }) => {
  const latestData = data[data.length - 1] || {
    present: 0,
    absent: 0,
    halfDay: 0,
    workFromHome: 0,
    workFromOffice: 0,
    totalHours: 0,
    overtimeHours: 0,
  };

  const total = latestData.present + latestData.absent + latestData.halfDay;

  const overviewCards = [
    {
      title: "Present Today",
      value: latestData.present,
      total: total,
      percentage:
        total > 0 ? ((latestData.present / total) * 100).toFixed(1) : 0,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      title: "Absent Today",
      value: latestData.absent,
      total: total,
      percentage:
        total > 0 ? ((latestData.absent / total) * 100).toFixed(1) : 0,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
    {
      title: "Half Day",
      value: latestData.halfDay,
      total: total,
      percentage:
        total > 0 ? ((latestData.halfDay / total) * 100).toFixed(1) : 0,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    },
    {
      title: "Work From Home",
      value: latestData.workFromHome,
      total: latestData.workFromHome + latestData.workFromOffice,
      percentage:
        latestData.workFromHome + latestData.workFromOffice > 0
          ? (
              (latestData.workFromHome /
                (latestData.workFromHome + latestData.workFromOffice)) *
              100
            ).toFixed(1)
          : 0,
      icon: Home,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      title: "Work From Office",
      value: latestData.workFromOffice,
      total: latestData.workFromHome + latestData.workFromOffice,
      percentage:
        latestData.workFromHome + latestData.workFromOffice > 0
          ? (
              (latestData.workFromOffice /
                (latestData.workFromHome + latestData.workFromOffice)) *
              100
            ).toFixed(1)
          : 0,
      icon: Building,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {overviewCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`bg-white rounded-lg shadow-sm border-2 ${card.borderColor} p-4 hover:shadow-md transition-all duration-200`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`${card.bgColor} p-2 rounded-lg`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <span className={`text-sm font-medium ${card.color}`}>
                {card.percentage}%
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-600">
                {card.title}
              </h3>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-gray-900">
                  {card.value}
                </span>
                {card.total > 0 && (
                  <span className="text-sm text-gray-500">/ {card.total}</span>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${card.color.replace(
                    "text-",
                    "bg-"
                  )}`}
                  style={{
                    width: `${Math.min(
                      100,
                      parseFloat(card.percentage.toString())
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AttendanceOverview;
