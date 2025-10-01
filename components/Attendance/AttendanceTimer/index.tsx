import React, { useState, useEffect } from "react";

interface AttendanceTimerProps {
  signInTime: Date | null;
  onTick: (seconds: number) => void;
}

const AttendanceTimer: React.FC<AttendanceTimerProps> = ({
  signInTime,
  onTick,
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!signInTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const signInMs = signInTime.getTime();
      const nowMs = now.getTime();
      const diffSeconds = Math.floor((nowMs - signInMs) / 1000);

      // If the difference is negative, it means the sign-in time is in the future
      // This can happen due to timezone issues - treat it as 0 for now
      const validDiffSeconds = Math.max(0, diffSeconds);

      setSeconds(validDiffSeconds);
      onTick(validDiffSeconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [signInTime, onTick]);
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-blue-50 rounded-lg p-4 text-center mb-4">
      <p className="text-sm text-gray-600 mb-1">Time Elapsed</p>
      <p className="text-2xl font-bold text-blue-600">{formatTime(seconds)}</p>
      <p className="text-xs text-gray-500">
        {(seconds / 3600).toFixed(2)} hours
      </p>
    </div>
  );
};

export default AttendanceTimer;
