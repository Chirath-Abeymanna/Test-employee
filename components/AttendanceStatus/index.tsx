/**
 * ATTENDANCE STATUS COMPONENT EXAMPLE
 *
 * Example component showing how to use the attendance utilities and hooks
 */

"use client";
import React from "react";
import {
  useAttendanceStatus,
  useSignInStatus,
  useWorkStatus,
} from "@/hooks/useAttendance";
import { formatAttendanceTime } from "@/utils/attendanceHelpers";

// ==================== SIMPLE STATUS CHECKER ====================

/**
 * Simple component to check if employee has signed in
 */
export function SignInStatusChecker() {
  const { hasSignedIn, loading, error, checkAgain } = useSignInStatus();

  if (loading) return <div>Checking sign-in status...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-2">Today's Sign-In Status</h3>
      <div className="flex items-center gap-2">
        <span
          className={`w-3 h-3 rounded-full ${
            hasSignedIn ? "bg-green-500" : "bg-red-500"
          }`}
        ></span>
        <span>{hasSignedIn ? "Signed In" : "Not Signed In"}</span>
        <button
          onClick={checkAgain}
          className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

// ==================== DETAILED ATTENDANCE DISPLAY ====================

/**
 * Detailed attendance status component
 */
export function AttendanceStatusDisplay() {
  const { attendance, loading, error, refetch } = useAttendanceStatus();

  if (loading) return <div>Loading attendance data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!attendance) return <div>No attendance data found</div>;

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Today's Attendance</h3>
        <button
          onClick={refetch}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {/* Status */}
        <div className="flex justify-between">
          <span className="text-gray-600">Status:</span>
          <span
            className={`font-semibold ${
              attendance.status === "signedIn"
                ? "text-green-600"
                : attendance.status === "signedOut"
                ? "text-blue-600"
                : "text-gray-600"
            }`}
          >
            {attendance.status === "signedIn"
              ? "Signed In"
              : attendance.status === "signedOut"
              ? "Signed Out"
              : "Not Started"}
          </span>
        </div>

        {/* Sign In Time */}
        <div className="flex justify-between">
          <span className="text-gray-600">Sign In:</span>
          <span className="font-mono">
            {formatAttendanceTime(attendance.signInTime)}
          </span>
        </div>

        {/* Sign Out Time */}
        <div className="flex justify-between">
          <span className="text-gray-600">Sign Out:</span>
          <span className="font-mono">
            {formatAttendanceTime(attendance.signOutTime)}
          </span>
        </div>

        {/* Location */}
        {attendance.location && (
          <div className="flex justify-between">
            <span className="text-gray-600">Location:</span>
            <span className="font-semibold">
              {attendance.location === "WFH"
                ? "Work From Home"
                : "Work From Office"}
            </span>
          </div>
        )}

        {/* Working Hours */}
        {attendance.totalHoursWorked && (
          <div className="flex justify-between">
            <span className="text-gray-600">Hours Worked:</span>
            <span className="font-semibold">
              {attendance.totalHoursWorked.toFixed(2)} hours
            </span>
          </div>
        )}

        {/* Lunch Break */}
        <div className="flex justify-between">
          <span className="text-gray-600">Lunch Break:</span>
          <span
            className={`font-semibold ${
              attendance.lunchBreakTaken ? "text-green-600" : "text-gray-600"
            }`}
          >
            {attendance.isOnLunchBreak
              ? "On Break"
              : attendance.lunchBreakTaken
              ? "Completed"
              : "Not Taken"}
          </span>
        </div>

        {/* Special Status */}
        {attendance.halfDay && (
          <div className="flex justify-between">
            <span className="text-gray-600">Day Type:</span>
            <span className="font-semibold text-orange-600">Half Day</span>
          </div>
        )}

        {(attendance.overtimeHours ?? 0) > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Overtime:</span>
            <span className="font-semibold text-purple-600">
              {attendance.overtimeHours} hours
            </span>
          </div>
        )}

        {attendance.leaveType && (
          <div className="flex justify-between">
            <span className="text-gray-600">Leave Type:</span>
            <span className="font-semibold text-red-600">
              {attendance.leaveType === "sick"
                ? "Sick Leave"
                : "Half Day Leave"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== WORK STATUS WIDGET ====================

/**
 * Compact work status widget
 */
export function WorkStatusWidget() {
  const { workStatus, loading, error, refresh } = useWorkStatus();

  if (loading) return <div className="text-sm text-gray-500">Loading...</div>;
  if (error)
    return <div className="text-sm text-red-500">Error loading status</div>;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
      {/* Status Indicator */}
      <div
        className={`w-2 h-2 rounded-full ${
          workStatus.isSignedIn && !workStatus.isSignedOut
            ? "bg-green-500"
            : workStatus.isSignedOut
            ? "bg-blue-500"
            : "bg-gray-400"
        }`}
      ></div>

      {/* Status Text */}
      <span className="text-sm font-medium">
        {workStatus.isOnBreak
          ? "On Break"
          : workStatus.isSignedIn && !workStatus.isSignedOut
          ? "Working"
          : workStatus.isSignedOut
          ? "Finished"
          : "Not Started"}
      </span>

      {/* Working Hours */}
      {workStatus.workingHours > 0 && (
        <span className="text-xs text-gray-600">
          ({workStatus.workingHours.toFixed(1)}h)
        </span>
      )}

      {/* Refresh Button */}
      <button
        onClick={refresh}
        className="text-xs text-blue-600 hover:text-blue-800"
        title="Refresh status"
      >
        ↻
      </button>
    </div>
  );
}

// ==================== QUICK STATUS CHECK ====================

/**
 * Utility function component for quick status checks
 */
export function QuickAttendanceCheck({
  onStatusChange,
}: {
  onStatusChange?: (status: any) => void;
}) {
  const { attendance, loading } = useAttendanceStatus();

  React.useEffect(() => {
    if (attendance && onStatusChange) {
      onStatusChange({
        hasSignedIn: !!attendance.signInTime,
        hasSignedOut: !!attendance.signOutTime,
        isWorking: attendance.status === "signedIn",
        workingHours: attendance.totalHoursWorked || 0,
      });
    }
  }, [attendance, onStatusChange]);

  if (loading) return null;

  return (
    <div className="text-xs text-gray-500">
      Last checked: {new Date().toLocaleTimeString()}
    </div>
  );
}
