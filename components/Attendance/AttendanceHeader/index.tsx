"use client";
import React from "react";
import { formatSriLankaTime, getCurrentSriLankaTime } from "@/utils/timezone";

type Status = "idle" | "signedIn" | "signedOut";

interface AttendanceHeaderProps {
  status: Status;
  currentDate: Date;
}

const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
  status,
  currentDate,
}) => {
  const formatTime = (date: Date) => {
    return formatSriLankaTime(date);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Colombo",
    });
  };

  const getStatusColor = () => {
    switch (status) {
      case "signedIn":
        return "text-green-600";
      case "signedOut":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "signedIn":
        return "Signed In";
      case "signedOut":
        return "Signed Out";
      default:
        return "Not Signed In";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Team member Attendance
        </h1>
        <p className="text-gray-600 mb-4">{formatDate(currentDate)}</p>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div
            className={`w-3 h-3 rounded-full ${
              status === "signedIn"
                ? "bg-green-500"
                : status === "signedOut"
                ? "bg-blue-500"
                : "bg-gray-400"
            }`}
          ></div>
          <span className={`font-semibold ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        <p className="text-sm text-gray-500">
          Current Time: {formatTime(currentDate)}
        </p>
      </div>
    </div>
  );
};

export default AttendanceHeader;
