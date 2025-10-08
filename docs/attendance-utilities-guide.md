# 📋 Attendance Utilities Documentation

## Overview

This documentation explains how to fetch attendance data and check if an employee has signed in using their ID from cookies or localStorage.

## 🚀 Quick Start

### 1. Simple Check - Has Employee Signed In Today?

```typescript
import { hasEmployeeSignedInToday } from "@/utils/attendanceHelpers";

// Basic usage
const checkSignInStatus = async () => {
  try {
    const hasSignedIn = await hasEmployeeSignedInToday();
    console.log("Employee signed in today:", hasSignedIn);
  } catch (error) {
    console.error("Error checking sign-in status:", error);
  }
};
```

### 2. Get Detailed Attendance Information

```typescript
import { fetchEmployeeAttendance } from "@/utils/attendanceHelpers";

// Get today's attendance details
const getAttendanceDetails = async () => {
  try {
    const attendance = await fetchEmployeeAttendance();
    console.log("Attendance Status:", {
      isSignedIn: attendance.isSignedIn,
      signInTime: attendance.signInTime,
      signOutTime: attendance.signOutTime,
      location: attendance.location,
      totalHours: attendance.totalHoursWorked,
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
  }
};

// Get specific date attendance
const getSpecificDateAttendance = async () => {
  const attendance = await fetchEmployeeAttendance("2024-10-05");
  console.log("October 5th attendance:", attendance);
};
```

### 3. Using React Hooks (Recommended)

```typescript
import { useSignInStatus, useAttendanceStatus } from "@/hooks/useAttendance";

function MyComponent() {
  // Simple sign-in check
  const { hasSignedIn, loading, error, checkAgain } = useSignInStatus();

  // Detailed attendance info
  const {
    attendance,
    loading: attendanceLoading,
    refetch,
  } = useAttendanceStatus();

  if (loading) return <div>Checking status...</div>;

  return (
    <div>
      <p>Signed in today: {hasSignedIn ? "Yes" : "No"}</p>
      {attendance && (
        <div>
          <p>Status: {attendance.status}</p>
          <p>Sign-in time: {attendance.signInTime?.toLocaleTimeString()}</p>
          <p>Location: {attendance.location}</p>
        </div>
      )}
      <button onClick={checkAgain}>Refresh Status</button>
    </div>
  );
}
```

## 🔧 Available Functions

### Core Functions

| Function                         | Description                             | Returns                     |
| -------------------------------- | --------------------------------------- | --------------------------- |
| `getEmployeeIdFromStorage()`     | Get employee ID from localStorage token | `string \| null`            |
| `fetchEmployeeAttendance(date?)` | Get attendance data for specific date   | `Promise<AttendanceStatus>` |
| `hasEmployeeSignedInToday()`     | Quick check if signed in today          | `Promise<boolean>`          |
| `hasEmployeeSignedOutToday()`    | Check if signed out today               | `Promise<boolean>`          |
| `getEmployeeWorkStatus()`        | Get comprehensive work status           | `Promise<WorkStatus>`       |

### React Hooks

| Hook                              | Description            | Use Case                 |
| --------------------------------- | ---------------------- | ------------------------ |
| `useSignInStatus()`               | Check sign-in status   | Simple status display    |
| `useAttendanceStatus(date?)`      | Full attendance data   | Detailed attendance info |
| `useWorkStatus()`                 | Work status with hours | Dashboard widgets        |
| `useRealTimeAttendance(interval)` | Auto-refreshing status | Live monitoring          |

## 📱 Usage Examples

### Example 1: Dashboard Widget

```typescript
import { WorkStatusWidget } from "@/components/AttendanceStatus";

function Dashboard() {
  return (
    <div className="dashboard">
      <h1>Employee Dashboard</h1>
      <WorkStatusWidget />
    </div>
  );
}
```

### Example 2: Conditional Rendering Based on Sign-In Status

```typescript
import { useSignInStatus } from "@/hooks/useAttendance";

function AttendanceActions() {
  const { hasSignedIn, loading } = useSignInStatus();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {hasSignedIn ? <button>Sign Out</button> : <button>Sign In</button>}
    </div>
  );
}
```

### Example 3: Real-time Status Monitoring

```typescript
import { useRealTimeAttendance } from "@/hooks/useAttendance";

function LiveAttendanceMonitor() {
  const { attendance, lastUpdated } = useRealTimeAttendance(30000); // Update every 30 seconds

  return (
    <div>
      <h3>Live Status</h3>
      <p>Status: {attendance?.status}</p>
      <p>Last updated: {lastUpdated?.toLocaleTimeString()}</p>
    </div>
  );
}
```

### Example 4: Check Specific Employee Conditions

```typescript
import { getEmployeeWorkStatus } from "@/utils/attendanceHelpers";

async function checkEmployeeForAutoSignOut() {
  try {
    const workStatus = await getEmployeeWorkStatus();

    // Check if employee should be auto signed-out
    if (
      workStatus.isSignedIn &&
      !workStatus.isSignedOut &&
      workStatus.workingHours > 8
    ) {
      console.log("Employee should be auto signed-out");
      // Trigger auto sign-out logic
    }
  } catch (error) {
    console.error("Error checking employee status:", error);
  }
}
```

## 🔐 Authentication Requirements

All functions require the employee to be authenticated with a valid token in localStorage:

```typescript
// Token is automatically retrieved from localStorage
const token = localStorage.getItem("employee_token");

// Functions will throw an error if:
// 1. No token exists
// 2. Token is invalid
// 3. Token has expired
```

## 🎯 Integration with Your Cron Job

To check which employees need auto sign-out:

```typescript
import { fetchEmployeeAttendance } from '@/utils/attendanceHelpers';

async function checkEmployeesForAutoSignOut(employeeIds: string[]) {
  const results = [];

  for (const employeeId of employeeIds) {
    try {
      // You'd need to modify fetchEmployeeAttendance to accept employeeId parameter
      // Or create a server-side version of this function
      const attendance = await fetchEmployeeAttendance();

      if (attendance.isSignedIn && !attendance.signOutTime) {
        results.push({
          employeeId,
          needsAutoSignOut: true,
          signInTime: attendance.signInTime,
          workingHours: attendance.totalHoursWorked
        });
      }
    } catch (error) {
      console.error(\`Error checking employee \${employeeId}:\`, error);
    }
  }

  return results;
}
```

## 🚨 Error Handling

All functions include proper error handling:

```typescript
import { fetchEmployeeAttendance } from "@/utils/attendanceHelpers";

try {
  const attendance = await fetchEmployeeAttendance();
  // Use attendance data
} catch (error) {
  if (error.message.includes("not authenticated")) {
    // Redirect to login
    router.push("/signin");
  } else {
    // Handle other errors
    console.error("Failed to fetch attendance:", error);
  }
}
```

## 🔄 Refresh and Real-time Updates

For real-time updates, use the provided hooks or set up polling:

```typescript
// Option 1: Use real-time hook
const { attendance } = useRealTimeAttendance(30000); // 30 seconds

// Option 2: Manual polling
useEffect(() => {
  const interval = setInterval(async () => {
    try {
      const status = await hasEmployeeSignedInToday();
      setSignedIn(status);
    } catch (error) {
      console.error("Polling error:", error);
    }
  }, 60000); // 1 minute

  return () => clearInterval(interval);
}, []);
```

## 📊 Return Types

### AttendanceStatus Interface

```typescript
interface AttendanceStatus {
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
```

This provides a complete solution for checking employee attendance status using their ID from localStorage/cookies! 🎉
