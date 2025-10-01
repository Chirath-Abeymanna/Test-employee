import React from "react";
import ConfirmationModal from "./ConfirmationModal";
import CalendarModal from "./CalendarModal";

type Status = "idle" | "signedIn" | "signedOut";
type LeaveType = "sick" | "half";

interface LeaveCount {
  sick: number;
  half: number;
}

interface LeaveManagementProps {
  status: Status;
  loading: boolean;
  leaveCount: LeaveCount;
  onLeave: (leaveType: LeaveType, leaveDate: Date) => void;
  completedAttendanceToday: boolean;
  halfDayRequested?: boolean;
}

const LeaveManagement: React.FC<LeaveManagementProps> = ({
  loading,
  leaveCount,
  onLeave,
  completedAttendanceToday,
  halfDayRequested = false,
}) => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [pendingLeaveType, setPendingLeaveType] =
    React.useState<LeaveType | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

  const handleLeaveClick = (leaveType: LeaveType) => {
    setPendingLeaveType(leaveType);
    setCalendarOpen(true);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCalendarOpen(false);
    setModalOpen(true);
  };

  const handleConfirm = () => {
    if (pendingLeaveType && selectedDate) {
      if (pendingLeaveType === "half") {
        // For half day, do not set absent status, just set halfDay: true
        onLeave(pendingLeaveType, selectedDate);
      } else {
        // For sick leave, use normal leave logic
        onLeave(pendingLeaveType, selectedDate);
      }
    }
    setModalOpen(false);
    setPendingLeaveType(null);
    setSelectedDate(null);
  };

  const handleCancel = () => {
    setModalOpen(false);
    setPendingLeaveType(null);
    setSelectedDate(null);
    setCalendarOpen(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm mb-6 p-6 relative">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Leave Management
      </h3>

      {/* Calendar Modal for selecting leave date */}
      <CalendarModal
        open={calendarOpen}
        selectedDate={selectedDate}
        onSelect={handleDateSelect}
        onClose={handleCancel}
        disablePastDates={completedAttendanceToday}
      />

      {/* Confirmation Modal for confirming leave */}
      <ConfirmationModal
        open={modalOpen}
        message={
          pendingLeaveType && selectedDate
            ? `Are you sure you want to apply for a ${
                pendingLeaveType === "sick"
                  ? "Approved"
                  : "Half Day (You will be marked present)"
              } leave on ${selectedDate.toLocaleDateString()}?`
            : "Select a leave type and date."
        }
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Sick Leave */}
        <div className="p-4 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span className="font-medium text-gray-900">Approved Leave</span>
            </div>
            <span className="text-sm font-semibold text-red-600">
              {leaveCount.sick} remaining
            </span>
          </div>
          <button
            className="w-full py-2 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={() => handleLeaveClick("sick")}
            disabled={loading || leaveCount.sick <= 0}
          >
            {leaveCount.sick <= 0 ? "No Leaves Left" : "Apply for a Leave"}
          </button>
        </div>

        {/* Half Day Leave */}
        <div className="p-4 border border-amber-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium text-gray-900">Half Day</span>
            </div>
          </div>
          <button
            className="w-full py-2 px-4 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={() => handleLeaveClick("half")}
            disabled={loading || leaveCount.half <= 0 || halfDayRequested}
          >
            {halfDayRequested
              ? "Half Day Already Requested"
              : leaveCount.half <= 0
              ? "No Half Days Left"
              : "Apply Half Day"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;
