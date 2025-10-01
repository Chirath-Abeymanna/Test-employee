import React from "react";

// Accept any string for location
interface LeaveCount {
  sick: number;
  half: number;
}

interface QuickStatsProps {
  hours: number;
  location: string;
  leaveCount: LeaveCount;
}

const QuickStats: React.FC<QuickStatsProps> = ({
  hours,
  location,
  leaveCount,
}) => {
  // Convert location value if needed
  let displayLocation = location;
  if (location === "work_from_home") displayLocation = "WFH";
  if (location === "work_from_office") displayLocation = "WFO";

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Quick Overview
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Today&apos;s Hours</p>
          <p className="text-lg font-bold text-blue-600">{hours.toFixed(1)}</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Location</p>
          <p className="text-lg font-bold text-green-600">
            {displayLocation || "Not Set"}
          </p>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Approved Leaves</p>
          <p className="text-lg font-bold text-red-600">{leaveCount.sick}</p>
        </div>
      </div>
    </div>
  );
};

export default QuickStats;
