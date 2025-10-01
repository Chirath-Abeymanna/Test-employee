// types/attendance.ts
export interface AttendanceData {
  date: string;
  present: number;
  absent: number;
  halfDay: number;
  workFromHome: number;
  workFromOffice: number;
  totalHours: number;
  overtimeHours: number;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  workFromHome: number;
  workFromOffice: number;
  totalHoursWorked: number;
  averageHoursPerDay: number;
  overtimeHours: number;
  attendanceRate: number;
  totalOfficeHours: number;
  totalHomeHours: number;
}

export interface Employee {
  _id: string;
  name: string;
  email: string;
  department: string;
}

export interface AttendanceRecord {
  _id: string;
  employee: Employee;
  signInTime?: Date;
  signOutTime?: Date;
  presentAbsentStatus: "present" | "absent";
  halfDay: boolean;
  date: Date;
  workLocation: "work_from_home" | "work_from_office";
  totalHoursWorked: number;
  leaveType?: "sick" | "casual" | "other" | null;
  overtimeHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ChartType =
  | "attendance"
  | "hours"
  | "location"
  | "overtime"
  | "trend";
