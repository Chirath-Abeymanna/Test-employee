import { NextResponse } from "next/server";
import { connectDB } from "@/utils/database";
import Attendance from "@/models/attendance";
import { getEmployeeIdFromToken } from "@/utils/jwt";

// PATCH: update today's half day
export async function PATCH(request: Request) {
  await connectDB();
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  const employeeId = getEmployeeIdFromToken(token || "");
  const { date } = await request.json();

  if (!employeeId || !date) {
    return NextResponse.json(
      { error: "Missing employeeId or date" },
      { status: 400 }
    );
  }

  const attendance = await Attendance.findOne({ employee: employeeId, date });

  if (!attendance) {
    return NextResponse.json(
      { error: "Attendance record not found" },
      { status: 404 }
    );
  }

  attendance.halfDay = true;
  attendance.presentAbsentStatus = "present";
  attendance.leaveType = null;

  await attendance.save();

  return NextResponse.json({
    success: true,
    halfDay: attendance.halfDay,
    presentAbsentStatus: attendance.presentAbsentStatus,
    leaveType: attendance.leaveType,
    signOutTime: attendance.signOutTime,
    action: "patch",
  });
}

// POST: create future half day attendance
export async function POST(request: Request) {
  await connectDB();
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  const employeeId = getEmployeeIdFromToken(token || "");
  const { date } = await request.json();

  console.log("date", date);

  if (!employeeId || !date) {
    return NextResponse.json(
      { error: "Missing employeeId or date" },
      { status: 400 }
    );
  }

  // Check if attendance already exists for that date
  const existing = await Attendance.findOne({ employee: employeeId, date });
  if (existing) {
    return NextResponse.json(
      { error: "Attendance already exists for this date" },
      { status: 409 }
    );
  }

  const newAttendance = await Attendance.create({
    employee: employeeId,
    date,
    halfDay: true,
    presentAbsentStatus: "present",
    leaveType: null,
  });

  return NextResponse.json({
    success: true,
    halfDay: newAttendance.halfDay,
    presentAbsentStatus: newAttendance.presentAbsentStatus,
    leaveType: newAttendance.leaveType,
    signOutTime: newAttendance.signOutTime,
    action: "post",
  });
}
