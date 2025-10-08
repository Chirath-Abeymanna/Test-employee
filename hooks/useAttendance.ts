/**
 * ATTENDANCE REACT HOOKS
 *
 * Custom React hooks for managing attendance state and checking employee status
 */

import { useState, useEffect, useCallback } from "react";
import {
  AttendanceStatus,
  fetchEmployeeAttendance,
  getEmployeeInfo,
  hasEmployeeSignedInToday,
  hasEmployeeSignedOutToday,
  getEmployeeWorkStatus,
} from "@/utils/attendanceHelpers";

// ==================== HOOKS ====================

/**
 * Hook to get current employee's attendance status
 */
export function useAttendanceStatus(date?: string) {
  const [attendance, setAttendance] = useState<AttendanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchEmployeeAttendance(date);
      setAttendance(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch attendance"
      );
      setAttendance(null);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  return {
    attendance,
    loading,
    error,
    refetch: fetchAttendance,
  };
}

/**
 * Hook to check if employee has signed in today
 */
export function useSignInStatus() {
  const [hasSignedIn, setHasSignedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSignInStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const signedIn = await hasEmployeeSignedInToday();
      setHasSignedIn(signedIn);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check sign-in status"
      );
      setHasSignedIn(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSignInStatus();
  }, [checkSignInStatus]);

  return {
    hasSignedIn,
    loading,
    error,
    checkAgain: checkSignInStatus,
  };
}

/**
 * Hook to get employee work status (signed in, out, break, hours)
 */
export function useWorkStatus() {
  const [workStatus, setWorkStatus] = useState({
    isSignedIn: false,
    isSignedOut: false,
    isOnBreak: false,
    workingHours: 0,
    status: "idle",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const status = await getEmployeeWorkStatus();
      setWorkStatus(status);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch work status"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkStatus();
  }, [fetchWorkStatus]);

  return {
    workStatus,
    loading,
    error,
    refresh: fetchWorkStatus,
  };
}

/**
 * Hook for real-time attendance monitoring with auto-refresh
 */
export function useRealTimeAttendance(refreshInterval: number = 30000) {
  const [attendance, setAttendance] = useState<AttendanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAttendance = useCallback(async () => {
    try {
      setError(null);

      const data = await fetchEmployeeAttendance();
      setAttendance(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch attendance"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchAttendance();

    // Set up interval for auto-refresh
    const interval = setInterval(fetchAttendance, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchAttendance, refreshInterval]);

  return {
    attendance,
    loading,
    error,
    lastUpdated,
    refresh: fetchAttendance,
  };
}

/**
 * Hook to check employee authentication status
 */
export function useEmployeeAuth() {
  const [authStatus, setAuthStatus] = useState({
    employeeId: null as string | null,
    token: null as string | null,
    isAuthenticated: false,
  });

  useEffect(() => {
    const checkAuth = () => {
      const info = getEmployeeInfo();
      setAuthStatus(info);
    };

    checkAuth();

    // Listen for storage changes (in case token changes in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "employee_token") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return authStatus;
}

// ==================== UTILITY HOOKS ====================

/**
 * Hook for polling attendance status at regular intervals
 */
export function useAttendancePolling(interval: number = 60000) {
  const [data, setData] = useState<{
    hasSignedIn: boolean;
    hasSignedOut: boolean;
    workingHours: number;
  }>({
    hasSignedIn: false,
    hasSignedOut: false,
    workingHours: 0,
  });

  useEffect(() => {
    const pollAttendance = async () => {
      try {
        const [signedIn, signedOut, workStatus] = await Promise.all([
          hasEmployeeSignedInToday(),
          hasEmployeeSignedOutToday(),
          getEmployeeWorkStatus(),
        ]);

        setData({
          hasSignedIn: signedIn,
          hasSignedOut: signedOut,
          workingHours: workStatus.workingHours,
        });
      } catch (error) {
        console.error("Error polling attendance:", error);
      }
    };

    // Initial poll
    pollAttendance();

    // Set up interval
    const intervalId = setInterval(pollAttendance, interval);
    return () => clearInterval(intervalId);
  }, [interval]);

  return data;
}
