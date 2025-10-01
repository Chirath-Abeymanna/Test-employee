import { NextResponse } from "next/server";
import { connectDB } from "@/utils/database";
import Attendance from "@/models/attendance";
import { getEmployeeIdFromToken } from "@/utils/jwt";

// POST: Start lunch break
export async function POST(request: Request) {
  await connectDB();
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  const employeeId = getEmployeeIdFromToken(token || "");
  const { date } = await request.json();

  console.log(
    "Starting lunch break for employee:",
    employeeId,
    "on date:",
    date
  );

  if (!employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fix date handling to match GET route pattern
  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  const tomorrow = new Date(dateObj);
  tomorrow.setDate(tomorrow.getDate() + 1);

  console.log(
    "Employee ID:",
    employeeId,
    "Date:",
    dateObj,
    "Tomorrow:",
    tomorrow
  );

  try {
    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: { $gte: dateObj, $lt: tomorrow },
    });
    console.log("Found attendance record:", attendance);
    if (!attendance) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    attendance.lunchBreakStart = new Date();
    attendance.lunchBreakTaken = true;
    await attendance.save();

    return NextResponse.json({
      success: true,
      lunchBreakStart: attendance.lunchBreakStart,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to start lunch break" },
      { status: 500 }
    );
  }
}

// PATCH: End lunch break
export async function PATCH(request: Request) {
  await connectDB();
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  const employeeId = getEmployeeIdFromToken(token || "");
  const { date } = await request.json();

  if (!employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fix date handling to match GET route pattern
  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  const tomorrow = new Date(dateObj);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: { $gte: dateObj, $lt: tomorrow },
    });
    if (!attendance) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    attendance.lunchBreakEnd = new Date();
    await attendance.save();

    return NextResponse.json({
      success: true,
      lunchBreakEnd: attendance.lunchBreakEnd,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to end lunch break" },
      { status: 500 }
    );
  }
}
