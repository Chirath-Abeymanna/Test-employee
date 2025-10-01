import React from "react";
import AttendanceTimer from "../AttendanceTimer";
import { formatSriLankaTime } from "@/utils/timezone";

type Location = "WFH" | "WFO" | "";
type Status = "idle" | "signedIn" | "signedOut";

interface ActiveSessionDisplayProps {
  status: Status;
  signInTime: Date | null;
  location: Location;
  onTimerTick: (seconds: number) => void;
}

const ActiveSessionDisplay: React.FC<ActiveSessionDisplayProps> = ({
  status,
  signInTime,
  location,
  onTimerTick,
}) => {
  const formatTime = (date: Date) => {
    return formatSriLankaTime(date);
  };

  if (status !== "signedIn" || !signInTime) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
        Active Session
      </h3>
      <AttendanceTimer signInTime={signInTime} onTick={onTimerTick} />
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-1">
          Started at {formatTime(signInTime)}
        </p>
        <p className="text-xs text-gray-500">
          Working {location === "WFH" ? "from Home" : "from Office"}
        </p>
      </div>
    </div>
  );
};

export default ActiveSessionDisplay;
