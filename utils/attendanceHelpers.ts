/**
 * ATTENDANCE HELPER UTILITIES
 *
 * Helper functions to check employee attendance status from localStorage/cookies
 * and fetch current attendance data from the API
 */

import { getEmployeeIdFromToken } from "./jwt";

// ==================== TYPE DEFINITIONS ====================
export interface AttendanceStatus {
  isSignedIn: boolean;
  signInTime: Date | null;
  signOutTime: Date | null;
  location: string | null;
  status: "idle" | "signedIn" | "signedOut";
  totalHoursWorked?: number;
  lunchBreakTaken?: boolean;
  isOnLunchBreak?: boolean;
  presentAbsentStatus?: "present" | "absent";
  leaveType?: "sick" | "half" | null;
  halfDay?: boolean;
  overtimeHours?: number;
}

export interface EmployeeInfo {
  employeeId: string | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ==================== EMPLOYEE ID UTILITIES ====================

/**
 * Get employee ID from localStorage token
 */
export function getEmployeeIdFromStorage(): string | null {
  try {
    const token = localStorage.getItem("employee_token");
    if (!token) return null;

    return getEmployeeIdFromToken(token);
  } catch (error) {
    console.error("Error getting employee ID from storage:", error);
    return null;
  }
}

/**
 * Get employee token and ID info
 */
export function getEmployeeInfo(): EmployeeInfo {
  try {
    const token = localStorage.getItem("employee_token");
    const employeeId = token ? getEmployeeIdFromToken(token) : null;

    return {
      employeeId,
      token,
      isAuthenticated: !!(token && employeeId),
    };
  } catch (error) {
    console.error("Error getting employee info:", error);
    return {
      employeeId: null,
      token: null,
      isAuthenticated: false,
    };
  }
}

// ==================== ATTENDANCE API FUNCTIONS ====================

/**
 * Fetch current employee's attendance data for a specific date
 */
export async function fetchEmployeeAttendance(
  date?: string
): Promise<AttendanceStatus> {
  const { token, employeeId, isAuthenticated } = getEmployeeInfo();

  if (!isAuthenticated) {
    throw new Error("Employee not authenticated");
  }

  const targetDate = date || new Date().toISOString().split("T")[0];

  try {
    const response = await fetch(`/api/attendance?date=${targetDate}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch attendance: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      isSignedIn: data.status === "signedIn",
      signInTime: data.signInTime ? new Date(data.signInTime) : null,
      signOutTime: data.signOutTime ? new Date(data.signOutTime) : null,
      location: data.location || null,
      status: data.status || "idle",
      totalHoursWorked: data.totalHoursWorked,
      lunchBreakTaken: data.lunchBreakTaken || false,
      isOnLunchBreak: !!(data.lunchBreakStart && !data.lunchBreakEnd),
      presentAbsentStatus: data.presentAbsentStatus,
      leaveType: data.leaveType || null,
      halfDay: data.halfDay || false,
      overtimeHours: data.overtimeHours || 0,
    };
  } catch (error) {
    console.error("Error fetching attendance:", error);
    throw error;
  }
}

/**
 * Check if employee has signed in today (simplified check)
 */
export async function hasEmployeeSignedInToday(): Promise<boolean> {
  try {
    const attendance = await fetchEmployeeAttendance();
    return attendance.isSignedIn || !!attendance.signInTime;
  } catch (error) {
    console.error("Error checking sign-in status:", error);
    return false;
  }
}

/**
 * Check if employee has signed out today
 */
export async function hasEmployeeSignedOutToday(): Promise<boolean> {
  try {
    const attendance = await fetchEmployeeAttendance();
    return !!attendance.signOutTime;
  } catch (error) {
    console.error("Error checking sign-out status:", error);
    return false;
  }
}

/**
 * Get employee's current work status
 */
export async function getEmployeeWorkStatus(): Promise<{
  isSignedIn: boolean;
  isSignedOut: boolean;
  isOnBreak: boolean;
  workingHours: number;
  status: string;
}> {
  try {
    const attendance = await fetchEmployeeAttendance();

    let workingHours = 0;
    if (attendance.signInTime) {
      const endTime = attendance.signOutTime || new Date();
      workingHours =
        (endTime.getTime() - attendance.signInTime.getTime()) /
        (1000 * 60 * 60);
    }

    return {
      isSignedIn: attendance.isSignedIn,
      isSignedOut: !!attendance.signOutTime,
      isOnBreak: attendance.isOnLunchBreak || false,
      workingHours: Math.max(0, workingHours),
      status: attendance.status,
    };
  } catch (error) {
    console.error("Error getting work status:", error);
    return {
      isSignedIn: false,
      isSignedOut: false,
      isOnBreak: false,
      workingHours: 0,
      status: "idle",
    };
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format attendance time for display
 */
export function formatAttendanceTime(date: Date | null): string {
  if (!date) return "--:--";

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Calculate working hours between two dates
 */
export function calculateWorkingHours(
  signIn: Date | null,
  signOut: Date | null
): number {
  if (!signIn) return 0;

  const endTime = signOut || new Date();
  const diffMs = endTime.getTime() - signIn.getTime();
  return Math.max(0, diffMs / (1000 * 60 * 60));
}

/**
 * Check if current time is within company working hours
 */
export function isWithinWorkingHours(
  companyStartTime: string,
  companyEndTime: string
): boolean {
  try {
    const now = new Date();
    const [startHour, startMinute] = companyStartTime.split(":").map(Number);
    const [endHour, endMinute] = companyEndTime.split(":").map(Number);

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const currentTime = currentHour * 60 + currentMinute;
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    return currentTime >= startTime && currentTime <= endTime;
  } catch (error) {
    console.error("Error checking working hours:", error);
    return false;
  }
}
