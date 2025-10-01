"use client";
import React, { useState, useEffect } from "react";
import WeeklyChart from "@/components/Reports/WeeklyCharts";
import MonthlyChart from "@/components/Reports/MonthlyCharts";
import AttendanceStats from "@/components/Reports/AttendanceStats";
import {
  AttendanceData,
  AttendanceStats as IAttendanceStats,
  AttendanceRecord,
} from "@/types/attendance";
import Loading from "@/components/Loading";

// Helper to get last week's Monday to Friday dates
function getLastWeekDates() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  // If today is Friday (5), get current week; else get last week
  let monday;
  if (dayOfWeek === 5) {
    // Current week's Monday
    monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek - 1));
  } else {
    // Last week's Monday
    monday = new Date(today);
    // Go back to last week's Friday, then to last week's Monday
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    monday.setDate(today.getDate() - daysSinceMonday - 7);
  }
  const dates = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(new Date(d));
  }
  return dates;
}

// Helper to get last month's weekdays (Mon-Fri)
function getLastMonthDates() {
  const today = new Date();
  let year, month;
  // If today is >= 28th, show current month; else show last month
  if (today.getDate() >= 28) {
    year = today.getFullYear();
    month = today.getMonth();
  } else {
    year =
      today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
    month = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
  }
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const dates = [];
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    if (d.getDay() >= 1 && d.getDay() <= 5) {
      dates.push(new Date(d));
    }
  }
  return dates;
}

// Chart types for attendance and hours
const ATTENDANCE_TYPE = "attendance";
const HOURS_TYPE = "hours";

const AttendanceDashboard = () => {
  // Always show weekly view first
  const [selectedView, setSelectedView] = useState<"weekly" | "monthly">(
    "weekly"
  );
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [attendanceStats, setAttendanceStats] =
    useState<IAttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("employee_token");
        if (!token) {
          setLoading(false);
          return;
        }

        let dates: Date[] = [];
        // On initial load or weekly view, always get last week's Monday to Friday
        if (selectedView === "weekly") {
          dates = getLastWeekDates();
        } else {
          dates = getLastMonthDates();
        }

        const startStr = dates[0].toISOString().split("T")[0];
        const endStr = dates[dates.length - 1].toISOString().split("T")[0];

        const res = await fetch(
          `/api/reports/attendance?dateRange=${startStr}_to_${endStr}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const records = await res.json();

        // Map records by date for quick lookup
        const recordMap: { [date: string]: AttendanceRecord } = {};
        (records as AttendanceRecord[]).forEach((rec) => {
          const dateStr = new Date(rec.date).toISOString().split("T")[0];
          recordMap[dateStr] = rec;
        });

        // Build attendanceDataArr for all weekdays in range
        let presentDays = 0,
          absentDays = 0,
          halfDays = 0,
          totalHoursWorked = 0,
          overtimeHours = 0,
          workFromHome = 0,
          workFromOffice = 0;

        const attendanceDataArr: AttendanceData[] = dates.map((d) => {
          const dateStr = d.toISOString().split("T")[0];
          const rec = recordMap[dateStr];

          if (rec) {
            // Use real record
            if (rec.presentAbsentStatus === "present") presentDays++;
            else absentDays++;
            if (rec.halfDay) halfDays++;
            if (rec.workLocation === "work_from_home") workFromHome++;
            if (rec.workLocation === "work_from_office") workFromOffice++;
            totalHoursWorked += rec.totalHoursWorked || 0;
            overtimeHours += rec.overtimeHours || 0;

            return {
              date: dateStr,
              present: rec.presentAbsentStatus === "present" ? 1 : 0,
              absent: rec.presentAbsentStatus === "absent" ? 1 : 0,
              halfDay: rec.halfDay ? 1 : 0,
              workFromHome: rec.workLocation === "work_from_home" ? 1 : 0,
              workFromOffice: rec.workLocation === "work_from_office" ? 1 : 0,
              totalHours: rec.totalHoursWorked || 0,
              overtimeHours: rec.overtimeHours || 0,
            };
          } else {
            // No record found - mark as absent
            absentDays++;
            return {
              date: dateStr,
              present: 0,
              absent: 1,
              halfDay: 0,
              workFromHome: 0,
              workFromOffice: 0,
              totalHours: 0,
              overtimeHours: 0,
            };
          }
        });

        const totalDays = attendanceDataArr.length;
        const averageHoursPerDay =
          totalDays > 0 ? Number((totalHoursWorked / totalDays).toFixed(2)) : 0;
        const attendanceRate =
          totalDays > 0
            ? Number(((presentDays / totalDays) * 100).toFixed(2))
            : 0;

        const totalOfficeHours = dates
          .map((d) => {
            const dateStr = d.toISOString().split("T")[0];
            const rec = recordMap[dateStr];
            return rec && rec.workLocation === "work_from_office"
              ? rec.totalHoursWorked || 0
              : 0;
          })
          .reduce((sum, h) => sum + h, 0);

        const totalHomeHours = dates
          .map((d) => {
            const dateStr = d.toISOString().split("T")[0];
            const rec = recordMap[dateStr];
            return rec && rec.workLocation === "work_from_home"
              ? rec.totalHoursWorked || 0
              : 0;
          })
          .reduce((sum, h) => sum + h, 0);

        setAttendanceData(attendanceDataArr);
        setAttendanceStats({
          totalDays,
          presentDays,
          absentDays,
          halfDays,
          workFromHome,
          workFromOffice,
          totalHoursWorked,
          averageHoursPerDay,
          overtimeHours,
          attendanceRate,
          totalOfficeHours,
          totalHomeHours,
        });
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      }
      setLoading(false);
    };

    fetchAttendance();
  }, [selectedView]);

  if (loading) {
    return <Loading message="Loading report data..." />;
  }

  // Match Attendance page layout
  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:py-8">
      <div className="max-w-7xl mx-auto">
        <div className="p-6 space-y-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Attendance Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSelectedView("weekly")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedView === "weekly"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setSelectedView("monthly")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedView === "monthly"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {attendanceStats && <AttendanceStats stats={attendanceStats} />}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {selectedView === "weekly" ? (
              <>
                <WeeklyChart
                  data={attendanceData as AttendanceData[]}
                  type={ATTENDANCE_TYPE}
                />
                <WeeklyChart
                  data={attendanceData as AttendanceData[]}
                  type={HOURS_TYPE}
                />
              </>
            ) : (
              <>
                <MonthlyChart
                  data={attendanceData as AttendanceData[]}
                  type={ATTENDANCE_TYPE}
                />
                <MonthlyChart
                  data={attendanceData as AttendanceData[]}
                  type={HOURS_TYPE}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDashboard;
