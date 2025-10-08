"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import { getEmployeeIdFromToken } from "@/utils/jwt";
import { Toaster, toast } from "sonner";
import { formatSriLankaTime } from "@/utils/timezone";

// Import all the components
import AttendanceHeader from "@/components/Attendance/AttendanceHeader";
import ActivityDisplay from "@/components/Attendance/ActivityDisplay";
import ActiveSessionDisplay from "@/components/Attendance/ActivitySessionDisplay";
import AttendanceActions from "@/components/Attendance/AttendanceActions";
import LeaveManagement from "@/components/Attendance/LeaveManagement";
import NoticeBanner from "@/components/NoticeBanner";
import QuickStats from "@/components/Attendance/QuickStats";
import Overtime from "@/components/Attendance/Overtime";

// ==================== TYPE DEFINITIONS ====================
type Status = "idle" | "signedIn" | "signedOut";
type Location = "WFH" | "WFO" | "";
type LeaveType = "sick" | "half";

interface LeaveCount {
  sick: number;
  half: number;
}

interface AttendanceDetails {
  signInTime?: string;
  signOutTime?: string;
  lunchBreakStart?: string;
  lunchBreakEnd?: string;
  lunchBreakTaken?: boolean;
  location?: Location;
  status?: Status;
  presentAbsentStatus?: "present" | "absent";
  leaveType?: LeaveType;
  overtimeHours?: number;
  halfDay?: boolean;
}

type CompanyObjType = {
  company_start_time?: string;
  company_out_time?: string;
  [key: string]: unknown;
};

type CompanyCookieType = CompanyObjType & {
  accept_lunch?: boolean;
  lunch_start_time?: string;
  lunch_duration_minutes?: number;
};

// ==================== MAIN COMPONENT ====================
export default function AttendancePage() {
  const router = useRouter();

  // ==================== STATE DEFINITIONS ====================
  // Attendance States
  const [status, setStatus] = useState<Status>("idle");
  const [signInTime, setSignInTime] = useState<Date | null>(null);
  const [signOutTime, setSignOutTime] = useState<Date | null>(null);
  const [location, setLocation] = useState<Location>("");
  const [hours, setHours] = useState<number>(0);
  const [attendanceDetails, setAttendanceDetails] =
    useState<AttendanceDetails | null>(null);

  // User & Company States
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [companyCookieData, setCompanyCookieData] =
    useState<CompanyCookieType | null>(null);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  // Company Time Settings
  const [allowedSignInStart, setAllowedSignInStart] = useState<Date | null>(
    null
  );
  const [allowedSignInEnd, setAllowedSignInEnd] = useState<Date | null>(null);
  const [companySignOutHour, setCompanySignOutHour] = useState<number | null>(
    null
  );
  const [companySignOutMinute, setCompanySignOutMinute] = useState<
    number | null
  >(null);

  // Leave Management States
  const [leaveCount, setLeaveCount] = useState<LeaveCount | null>(null);
  const [isAbsentToday, setIsAbsentToday] = useState(false);
  const [leaveDate] = useState<string | null>(null);
  const [approvedSick, setApprovedSick] = useState<number>(0);

  // UI States
  const [showLocationChoice, setShowLocationChoice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, setRedirecting] = useState(false);
  const [isWeekend, setIsWeekend] = useState(false);

  // Lunch Break States
  const [lunchBreakStart, setLunchBreakStart] = useState<Date | null>(null);
  const [lunchBreakEnd, setLunchBreakEnd] = useState<Date | null>(null);
  const [isOnLunchBreak, setIsOnLunchBreak] = useState(false);
  const [lunchBreakTaken, setLunchBreakTaken] = useState(false);
  const [companyAcceptsLunch, setCompanyAcceptsLunch] = useState(false);
  const [lunchStartTime, setLunchStartTime] = useState<string | null>(null);
  const [lunchDuration, setLunchDuration] = useState<number | null>(null);

  // Overtime States
  const [overtimeLoading, setOvertimeLoading] = useState(false);
  const [overtimeMessage, setOvertimeMessage] = useState<string | null>(null);

  // ==================== COMPUTED VALUES ====================
  const overtimeHours = attendanceDetails?.overtimeHours ?? 0;
  const overtimeSubmitted = overtimeHours > 0;
  const halfDayRequested = !!attendanceDetails?.halfDay;
  const todayStr = new Date().toISOString().split("T")[0];
  const completedAttendanceToday = !!(signInTime && signOutTime);

  // ==================== UTILITY FUNCTIONS ====================
  const setCompanySignOutTime = (hour: number, minute: number) => {
    setCompanySignOutHour(hour);
    setCompanySignOutMinute(minute);
  };

  const getCompanyCookie = () => {
    const match = document.cookie.match(/(?:^|; )company=([^;]*)/);

    if (match) {
      try {
        const decoded = decodeURIComponent(match[1]);
        const data = JSON.parse(decoded);
        setCompanyCookieData(data);
      } catch (error) {
        console.error("Error parsing company cookie:", error);
        setCompanyCookieData(null);
      }
    } else {
      console.log("No company cookie found");
      setCompanyCookieData(null);
    }
  };

  // ==================== API FUNCTIONS ====================
  const fetchLeaveCount = async (empId: string) => {
    try {
      // Get allowed leaves from employee table
      const empRes = await fetch(`/api/employee`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("employee_token")}`,
        },
      });

      let allowedSick = 0;
      let allowedHalf = Infinity;

      if (empRes.ok) {
        const empData = await empRes.json();
        allowedSick = empData.sickDaysPerMonth ?? 0;
        allowedHalf = empData.halfDaysPerMonth ?? Infinity;
        setApprovedSick(allowedSick);
      }

      // Get taken leaves from leave API
      const leaveRes = await fetch(`/api/leave?employeeId=${empId}`);
      let takenSick = 0;
      let takenHalf = 0;

      if (leaveRes.ok) {
        const leaveData = await leaveRes.json();
        takenSick = leaveData.sickLeaves ?? 0;
        takenHalf = leaveData.halfDayLeaves ?? 0;
      }

      setLeaveCount({
        sick: Math.max(0, allowedSick - takenSick),
        half:
          allowedHalf === Infinity
            ? Infinity
            : Math.max(0, allowedHalf - takenHalf),
      });
    } catch (error) {
      console.error("Failed to fetch leave data:", error);
    }
  };

  const fetchAttendance = async () => {
    if (!employeeId) return;

    const today = new Date().toISOString().split("T")[0];
    console.log("Fetching attendance for", today);
    try {
      const token = localStorage.getItem("employee_token");
      const res = await fetch(`/api/attendance?date=${today}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setAttendanceDetails(data);

        // Set lunch break data - only if company accepts lunch breaks
        if (data.lunchBreakStart) {
          setLunchBreakStart(new Date(data.lunchBreakStart));
        }
        if (data.lunchBreakEnd) {
          setLunchBreakEnd(new Date(data.lunchBreakEnd));
        }
        setLunchBreakTaken(data.lunchBreakTaken || false);

        // Only set lunch break status if company accepts lunch breaks
        const shouldBeOnLunchBreak =
          companyAcceptsLunch && !!data.lunchBreakStart && !data.lunchBreakEnd;
        setIsOnLunchBreak(shouldBeOnLunchBreak);

        if (data.presentAbsentStatus === "absent" || data.leaveType) {
          setIsAbsentToday(true);
          setStatus("idle");
          setSignInTime(null);
          setSignOutTime(null);
          setLocation("");
          setShowLocationChoice(false);
          return;
        } else {
          setIsAbsentToday(false);
        }

        // Always set signInTime and signOutTime if present
        setSignInTime(data.signInTime ? new Date(data.signInTime) : null);
        setSignOutTime(data.signOutTime ? new Date(data.signOutTime) : null);

        // Update status based on lunch break
        if (isOnLunchBreak) {
          setStatus("idle");
        } else if (data.status === "signedIn") {
          setStatus("signedIn");
          setLocation(data.location || "");
          setShowLocationChoice(false);
        } else if (data.status === "signedOut") {
          setStatus("signedOut");
          setLocation(data.location || "");
          setShowLocationChoice(false);
        } else {
          setStatus("idle");
          setLocation("");
          setShowLocationChoice(false);
        }
      }
    } catch (error) {
      console.error("Failed to fetch attendance record:", error);
    }
  };

  // ==================== EVENT HANDLERS ====================
  const handleSignIn = async (loc: Location, isHalfDay = false) => {
    if (isAbsentToday) return;

    const nowTime = new Date();
    if (allowedSignInStart && allowedSignInEnd) {
      if (nowTime < allowedSignInStart || nowTime > allowedSignInEnd) {
        toast.error(
          "Sign in is only allowed from " +
            formatSriLankaTime(allowedSignInStart) +
            " to " +
            formatSriLankaTime(allowedSignInEnd)
        );
        return;
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("employee_token");
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: "signIn",
          time: nowTime.toISOString(),
          location: loc,
          date: nowTime.toISOString().split("T")[0],
          ...(isHalfDay ? { halfDay: true } : {}),
        }),
      });

      if (response.ok) {
        setSignInTime(nowTime);
        setLocation(loc);
        setStatus("signedIn");
        setShowLocationChoice(false);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to sign in");
      }
    } catch (error) {
      toast.error(
        "Failed to sign in: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    const now = new Date();

    try {
      const token = localStorage.getItem("employee_token");
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: "signOut",
          time: now.toISOString(),
          hours: parseFloat(hours.toFixed(2)),
          date: now.toISOString().split("T")[0],
        }),
      });

      if (response.ok) {
        setSignOutTime(now);
        setStatus("signedOut");
      }
    } catch (error) {
      console.error("Failed to sign out:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSignOut = async () => {
    if (status === "signedIn") {
      const now = new Date();
      setSignOutTime(now);
      setStatus("signedOut");

      try {
        const token = localStorage.getItem("employee_token");
        await fetch("/api/attendance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            type: "autoSignOut",
            time: now.toISOString(),
            hours: parseFloat(hours.toFixed(2)),
            date: now.toISOString().split("T")[0],
          }),
        });
      } catch (error) {
        console.error("Failed to auto sign out:", error);
      }
    }
  };

  const handleLeave = async (leaveType: "sick" | "half", leaveDate: Date) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("employee_token");
      const pad = (n: number) => String(n).padStart(2, "0");
      const dateStr = `${leaveDate.getFullYear()}-${pad(
        leaveDate.getMonth() + 1
      )}-${pad(leaveDate.getDate())}`;
      const todayStr = new Date().toISOString().split("T")[0];

      if (leaveType === "half") {
        // Check if the request is for today and employee has signed in
        const isToday = dateStr === todayStr;
        let attendanceRes = null;
        let attendanceData = null;

        if (isToday) {
          attendanceRes = await fetch(`/api/attendance?date=${dateStr}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (attendanceRes.ok) {
            attendanceData = await attendanceRes.json();
          }
        }

        // If today and signed in, PATCH; else POST
        const method =
          isToday && attendanceData && attendanceData.signInTime
            ? "PATCH"
            : "POST";

        const res = await fetch("/api/attendance/halfday", {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ date: dateStr }),
        });

        if (!res.ok) {
          const error = await res.json();
          toast.error(error.error || "Failed to request half day.");
        } else {
          toast.success("Half day successfully requested!");
          await fetchAttendance();
        }
      } else {
        // PATCH to leave API to increment sick leave count
        const leaveRes = await fetch("/api/leave", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: "sick",
            date: dateStr,
          }),
        });

        // POST to attendance API to mark absent for the given date
        const attendanceRes = await fetch("/api/attendance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: "absent",
            date: dateStr,
          }),
        });

        if (!leaveRes.ok || !attendanceRes.ok) {
          const error =
            (!leaveRes.ok && (await leaveRes.json()).error) ||
            (!attendanceRes.ok && (await attendanceRes.json()).error);
          toast.error(error || "Failed to request leave.");
        } else {
          toast.success("Leave successfully requested!");
          await fetchAttendance();
        }
      }
    } catch (err) {
      toast.error("An error occurred while requesting leave.");
    }
    setLoading(false);
  };

  const handleOvertimeSubmit = async (hours: number) => {
    setOvertimeLoading(true);
    setOvertimeMessage(null);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("employee_token")
          : null;
      const today = new Date().toISOString().split("T")[0];

      const res = await fetch("/api/attendance/overtime", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          employeeId,
          date: today,
          hours,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setOvertimeMessage(`Overtime submitted: ${data.overtimeHours} hours`);
      } else {
        setOvertimeMessage(data.error || "Error submitting overtime");
      }
    } catch (err) {
      setOvertimeMessage("Network error");
    } finally {
      setOvertimeLoading(false);
    }
  };

  // Auto lunch break handlers
  const handleAutoLunchBreakStart = async () => {
    if (status !== "signedIn" || isOnLunchBreak || lunchBreakTaken) {
      console.log("Cannot start lunch break:", {
        status,
        isOnLunchBreak,
        lunchBreakTaken,
      });
      return;
    }

    // Check if there's a valid attendance record for today with sign-in time
    if (!attendanceDetails || !signInTime || !attendanceDetails.signInTime) {
      console.log("Cannot start lunch break: No valid attendance record", {
        attendanceDetails: !!attendanceDetails,
        signInTime: !!signInTime,
        attendanceSignInTime: !!attendanceDetails?.signInTime,
      });
      return;
    }

    // Use company's fixed lunch start time, not current time
    if (!lunchStartTime) {
      console.log("No lunch start time configured");
      return;
    }

    console.log("Starting lunch break with company schedule");

    const [lunchHour, lunchMinute] = lunchStartTime.split(":").map(Number);
    const lunchStart = new Date();
    lunchStart.setHours(lunchHour, lunchMinute, 0, 0);

    // Update state first to prevent re-triggers
    setLunchBreakStart(lunchStart);
    setIsOnLunchBreak(true);
    setLunchBreakTaken(true); // Mark as taken to prevent re-triggers
    setStatus("idle"); // Set to idle during lunch

    toast.info("Lunch break started automatically", {
      description: `You'll be signed back in after ${lunchDuration} minutes`,
    });

    try {
      const token = localStorage.getItem("employee_token");
      const today = lunchStart.toISOString().split("T")[0];

      // First, fetch today's attendance to ensure record exists
      console.log("Fetching attendance record before lunch break API call");
      const attendanceRes = await fetch(`/api/attendance?date=${today}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!attendanceRes.ok) {
        console.error("Failed to fetch attendance record for lunch break");
        return;
      }

      const attendanceData = await attendanceRes.json();
      if (!attendanceData || !attendanceData.signInTime) {
        console.error("No valid attendance record found for lunch break");
        return;
      }

      console.log(
        "Attendance record confirmed, proceeding with lunch break API"
      );

      // Now call the lunch break API
      const response = await fetch("/api/attendance/lunch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: today,
          lunchStartTime: lunchStart.toISOString(),
        }),
      });

      if (!response.ok) {
        console.error(
          "Failed to record lunch break start:",
          await response.text()
        );
        // Don't revert state to prevent infinite loops, just log the error
      } else {
        console.log("Lunch break started successfully");
      }
    } catch (error) {
      console.error("Failed to record lunch break start:", error);
      // Don't revert state to prevent infinite loops, just log the error
    }
  };

  const handleAutoLunchBreakEnd = async () => {
    if (!isOnLunchBreak || !lunchBreakStart || !lunchDuration) {
      return;
    }

    // Calculate lunch end time based on company lunch start time + duration
    const lunchEnd = new Date(
      lunchBreakStart.getTime() + lunchDuration * 60 * 1000
    );

    // Update state first to prevent re-triggers
    setLunchBreakEnd(lunchEnd);
    setIsOnLunchBreak(false);
    setStatus("signedIn"); // Resume signed in status

    toast.success("Lunch break ended - You're signed back in!", {
      description: "Your work session has resumed automatically",
    });

    try {
      const token = localStorage.getItem("employee_token");
      const response = await fetch("/api/attendance/lunch", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: lunchEnd.toISOString().split("T")[0],
          lunchEndTime: lunchEnd.toISOString(),
        }),
      });

      if (!response.ok) {
        console.error(
          "Failed to record lunch break end:",
          await response.text()
        );
        // Don't revert state to prevent infinite loops, just log the error
      }
    } catch (error) {
      console.error("Failed to record lunch break end:", error);
      // Don't revert state to prevent infinite loops, just log the error
    }
  };

  const handleTimerTick = (seconds: number) => {
    setHours(Number((seconds / 3600).toFixed(2)));
  };

  const handleSignInClick = () => {
    setShowLocationChoice(true);
  };

  // ==================== USE EFFECTS ====================
  // Initialize authentication
  useEffect(() => {
    const token = localStorage.getItem("employee_token");
    if (token) {
      setEmployeeId(getEmployeeIdFromToken(token));
    } else {
      setRedirecting(true);
      router.push("/SignIn");
    }
  }, [router]);

  // Calculate worked hours
  useEffect(() => {
    if (signInTime && signOutTime) {
      const diffMs = signOutTime.getTime() - signInTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      setHours(Number(diffHours.toFixed(2)));
    } else {
      setHours(0);
    }
  }, [signInTime, signOutTime]);

  // Current date timer
  useEffect(() => {
    setCurrentDate(new Date());
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Company cookie management
  useEffect(() => {
    getCompanyCookie();
  }, []);

  // Company time settings
  useEffect(() => {
    if (!companyCookieData) {
      console.log("No company cookie data available, returning");
      return;
    }

    // companyCookieData is already parsed in getCompanyCookie, so we can use it directly
    const companyObj = companyCookieData;

    const startTime = companyObj.company_start_time;
    const endTime = companyObj.company_end_time;
    if (
      !startTime ||
      typeof startTime !== "string" ||
      !endTime ||
      typeof endTime !== "string"
    )
      return;

    // Parse times (assume format "HH:mm" or "HH:mm:ss")
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    // Set allowed sign in window (30 minutes before start)
    const signInStart = new Date();
    signInStart.setHours(startHour, startMinute - 30, 0, 0);

    // If minute subtraction goes negative, adjust hour and minute
    if (signInStart.getMinutes() < 0) {
      signInStart.setHours(signInStart.getHours() - 1);
      signInStart.setMinutes(60 + signInStart.getMinutes());
    }

    const signInEnd = new Date();
    signInEnd.setHours(endHour, endMinute, 0, 0);

    setAllowedSignInStart(signInStart);
    setAllowedSignInEnd(signInEnd);
    setCompanySignOutTime(endHour, endMinute);
    setCompanyAcceptsLunch(companyObj.accept_lunch || false);
    setLunchStartTime(companyObj.lunch_start_time || null);
    setLunchDuration(companyObj.lunch_duration_minutes || null);
  }, [companyCookieData]);

  // Fetch leave count
  useEffect(() => {
    if (!employeeId) return;
    fetchLeaveCount(employeeId);
  }, [employeeId]); // Only re-fetch when employeeId changes

  // Fetch attendance data
  useEffect(() => {
    fetchAttendance();
  }, [employeeId, companyAcceptsLunch]);

  // Re-evaluate lunch break status when company settings change
  useEffect(() => {
    if (attendanceDetails) {
      const shouldBeOnLunchBreak =
        companyAcceptsLunch &&
        !!attendanceDetails.lunchBreakStart &&
        !attendanceDetails.lunchBreakEnd;
      setIsOnLunchBreak(shouldBeOnLunchBreak);
    }
  }, [
    companyAcceptsLunch,
    attendanceDetails?.lunchBreakStart,
    attendanceDetails?.lunchBreakEnd,
  ]);

  // Weekend detection
  useEffect(() => {
    const today = new Date();
    const day = today.getDay(); // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) {
      setIsWeekend(false);
      toast.info(
        "It's the weekend! Enjoy your Saturday/Sunday and recharge for the week ahead.",
        {
          description:
            "Attendance is not required on weekends. See you on Monday!",
          duration: 6000,
        }
      );
    }
  }, []);

  // Auto sign-out is now handled by server-side cron job
  // See /api/cron route and CRON_SETUP.md for configuration
  // This ensures employees are signed out even if they don't visit the page

  // Optional: Show notification if employee should have been signed out
  useEffect(() => {
    if (
      status === "signedIn" &&
      signInTime &&
      companySignOutHour !== null &&
      companySignOutMinute !== null
    ) {
      const now = new Date();
      const signOutDeadline = new Date();

      if (halfDayRequested && companyCookieData) {
        // Calculate halfway point for half-day
        const companyObj = companyCookieData;
        let startHour = 9,
          startMinute = 0,
          endHour = 18,
          endMinute = 0;

        if (companyObj.company_start_time && companyObj.company_out_time) {
          [startHour, startMinute] = companyObj.company_start_time
            .split(":")
            .map(Number);
          [endHour, endMinute] = companyObj.company_out_time
            .split(":")
            .map(Number);
        }

        const start = new Date(signInTime);
        start.setHours(startHour, startMinute, 0, 0);
        const end = new Date(signInTime);
        end.setHours(endHour, endMinute, 0, 0);
        const halfMs = (end.getTime() - start.getTime()) / 2;
        signOutDeadline.setTime(start.getTime() + halfMs);
      } else {
        signOutDeadline.setHours(
          companySignOutHour,
          companySignOutMinute,
          0,
          0
        );
        if (signInTime.getTime() > signOutDeadline.getTime()) {
          signOutDeadline.setDate(signOutDeadline.getDate() + 1);
        }
      }

      // Show reminder if past sign-out time (only once per session)
      if (now > signOutDeadline) {
        const timePast = Math.floor(
          (now.getTime() - signOutDeadline.getTime()) / (1000 * 60)
        );
        if (timePast < 60 && timePast > 0) {
          // Only show for first hour to avoid spam
          toast.info(
            `Your work day has ended. Please sign out manually or it will be done automatically.`,
            {
              description: `You were scheduled to sign out ${timePast} minutes ago.`,
              duration: 10000,
            }
          );
        }
      }
    }
  }, [
    status,
    signInTime,
    companySignOutHour,
    companySignOutMinute,
    halfDayRequested,
    companyCookieData,
  ]);

  // Auto lunch break timer - START
  useEffect(() => {
    if (
      status === "signedIn" &&
      !isOnLunchBreak &&
      !lunchBreakTaken &&
      companyAcceptsLunch &&
      lunchStartTime &&
      lunchDuration &&
      attendanceDetails && // Attendance record exists
      signInTime && // Employee has signed in locally
      attendanceDetails.signInTime // Attendance record has sign-in time
    ) {
      const [lunchHour, lunchMinute] = lunchStartTime.split(":").map(Number);
      const lunchStart = new Date();
      lunchStart.setHours(lunchHour, lunchMinute, 0, 0);

      const now = new Date();
      const msUntilLunch = lunchStart.getTime() - now.getTime();

      if (msUntilLunch > 0 && msUntilLunch < 24 * 60 * 60 * 1000) {
        // Only set timer if it's within 24 hours to prevent infinite loops
        const lunchTimer = setTimeout(() => {
          console.log("Starting lunch break automatically");
          handleAutoLunchBreakStart();
        }, msUntilLunch);

        return () => clearTimeout(lunchTimer);
      } else if (
        msUntilLunch <= 0 &&
        msUntilLunch > -60 * 60 * 1000 &&
        !lunchBreakTaken
      ) {
        // Only trigger if within 1 hour of lunch time and not already taken
        console.log("Starting lunch break immediately (past lunch time)");
        handleAutoLunchBreakStart();
      }
    }
  }, [
    status,
    isOnLunchBreak,
    lunchBreakTaken,
    companyAcceptsLunch,
    lunchStartTime,
    lunchDuration,
    attendanceDetails,
    signInTime,
  ]);

  // Auto lunch break timer - END
  // Auto lunch break end timer - use company's fixed schedule
  useEffect(() => {
    if (isOnLunchBreak && lunchStartTime && lunchDuration) {
      // Calculate lunch end based on company's fixed lunch start time + duration
      const [lunchHour, lunchMinute] = lunchStartTime.split(":").map(Number);
      const lunchStart = new Date();
      lunchStart.setHours(lunchHour, lunchMinute, 0, 0);

      const lunchEnd = new Date(
        lunchStart.getTime() + lunchDuration * 60 * 1000
      );
      const now = new Date();
      const msUntilLunchEnd = lunchEnd.getTime() - now.getTime();

      if (msUntilLunchEnd > 0 && msUntilLunchEnd < 24 * 60 * 60 * 1000) {
        // Only set timer if it's within 24 hours to prevent infinite loops
        const lunchEndTimer = setTimeout(() => {
          console.log("Ending lunch break automatically");
          handleAutoLunchBreakEnd();
        }, msUntilLunchEnd);

        return () => clearTimeout(lunchEndTimer);
      } else if (msUntilLunchEnd <= 0 && msUntilLunchEnd > -60 * 60 * 1000) {
        // Only trigger if within 1 hour past lunch end time
        handleAutoLunchBreakEnd();
      }
    }
  }, [isOnLunchBreak, lunchStartTime, lunchDuration]);

  // ==================== RENDER FUNCTIONS ====================

  const renderOvertimeSection = () => {
    if (status !== "signedIn") return null;

    if (halfDayRequested) {
      return (
        <div className="mt-6 mb-6 max-w-md mx-auto bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-3">
            <svg
              className="w-7 h-7 text-blue-600"
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
            <span className="text-lg font-semibold text-gray-900">
              Overtime Not Allowed for Half Day
            </span>
          </div>
          <p className="text-gray-700 mb-4 text-center">
            You have requested a half day for today. Overtime cannot be
            requested on half day attendance.
          </p>
          <button
            className="w-full py-2 px-4 bg-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
            disabled
          >
            Overtime Disabled
          </button>
        </div>
      );
    }

    if (overtimeSubmitted && !signOutTime) {
      return (
        <div className="mt-6 mb-6 max-w-md mx-auto bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-3">
            <svg
              className="w-7 h-7 text-blue-600"
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
            <span className="text-lg font-semibold text-gray-900">
              Overtime Already Submitted
            </span>
          </div>
          <p className="text-gray-700 mb-4 text-center">
            You have already submitted your overtime for today. You cannot
            submit another overtime entry.
          </p>
          <button
            className="w-full py-2 px-4 bg-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
            disabled
          >
            Overtime Submitted
          </button>
        </div>
      );
    }

    if (!overtimeSubmitted) {
      return (
        <Overtime
          onSubmit={handleOvertimeSubmit}
          loading={overtimeLoading}
          overtimeMessage={overtimeMessage ?? undefined}
        />
      );
    }

    return null;
  };

  const renderLeaveDay = () => {
    if (isAbsentToday && leaveDate === todayStr) {
      return (
        <div className="min-h-screen bg-gray-50 py-4 px-4 sm:py-8 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold mb-4 text-red-600">
              You have taken a leave today
            </h2>
            <p className="text-gray-700">
              Enjoy your day off! You cannot sign in or perform attendance
              actions today.
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // ==================== MAIN RETURN ====================
  // Show loading spinner until leaveCount is fetched
  if (leaveCount === null) {
    return <Loading message="Loading attendance data..." />;
  }

  // Show leave day message if applicable
  const leaveDayContent = renderLeaveDay();
  if (leaveDayContent) {
    return leaveDayContent;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:py-8">
      <Toaster position="top-center" />
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        {currentDate && (
          <AttendanceHeader status={status} currentDate={currentDate} />
        )}

        {/* Lunch Break Status */}
        {isOnLunchBreak && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-orange-600 font-medium">
                🍽️ Lunch Break
              </span>
            </div>
            <p className="text-orange-700 text-sm">
              You&apos;re currently on lunch break. You&apos;ll be automatically
              signed back in when lunch time ends.
            </p>
            {lunchBreakStart && lunchDuration && (
              <p className="text-orange-600 text-xs mt-1">
                Started at {formatSriLankaTime(lunchBreakStart)} - Ends at{" "}
                {formatSriLankaTime(
                  new Date(
                    lunchBreakStart.getTime() + lunchDuration * 60 * 1000
                  )
                )}
              </p>
            )}
          </div>
        )}

        {/* Activity Display */}
        <ActivityDisplay
          signInTime={signInTime}
          signOutTime={signOutTime}
          location={location}
          hours={hours}
        />

        {/* Active Session Display */}
        <ActiveSessionDisplay
          status={status}
          signInTime={signInTime}
          location={location}
          onTimerTick={handleTimerTick}
        />

        {/* Main Actions */}
        {!isWeekend && !isOnLunchBreak && (
          <AttendanceActions
            status={status}
            loading={loading}
            showLocationChoice={showLocationChoice}
            signOutTime={signOutTime}
            hours={hours}
            onSignInClick={handleSignInClick}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
          />
        )}

        {/* Leave Management */}
        <LeaveManagement
          status={status}
          loading={loading}
          leaveCount={leaveCount}
          onLeave={handleLeave}
          completedAttendanceToday={completedAttendanceToday}
          halfDayRequested={!!attendanceDetails?.halfDay}
        />

        {/* Overtime Section */}
        {renderOvertimeSection()}

        {/* Notice Banner */}
        <NoticeBanner signedOutTime={allowedSignInEnd ?? new Date()} />

        {/* Quick Stats */}
        <QuickStats
          hours={hours}
          location={location}
          leaveCount={{
            sick: approvedSick,
            half: leaveCount?.half ?? Infinity,
          }}
        />
      </div>
    </div>
  );
}
