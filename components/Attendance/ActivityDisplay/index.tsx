"use client";
import React from "react";
import { formatSriLankaTime } from "@/utils/timezone";

type Location = "WFH" | "WFO" | "";

interface ActivityDisplayProps {
  signInTime: Date | null;
  signOutTime: Date | null;
  location: Location;
  hours: number;
}

const ActivityDisplay: React.FC<ActivityDisplayProps> = ({
  signInTime,
  signOutTime,
  location,
  hours,
}) => {
  const formatTime = (date: Date) => {
    return formatSriLankaTime(date);
  };

  if (!signInTime && !signOutTime) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Today&apos;s Activity
      </h3>
      <div className="space-y-3">
        {signInTime && (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">Sign In</p>
                <p className="text-xs text-gray-600">
                  {location === "WFH" ? "Work From Home" : "Work From Office"}
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold text-green-600">
              {formatTime(signInTime)}
            </span>
          </div>
        )}

        {signOutTime && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m10 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">Sign Out</p>
                <p className="text-xs text-gray-600">
                  Total: {hours.toFixed(2)} hours
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold text-blue-600">
              {formatTime(signOutTime)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityDisplay;
