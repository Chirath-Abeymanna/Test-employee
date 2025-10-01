import { NextRequest, NextResponse } from "next/server";
import Attendance from "@/models/attendance";
import { connectDB } from "@/utils/database";
import jwt from "jsonwebtoken";
import { getEmployeeIdFromToken } from "@/utils/jwt";
const JWT_SECRET = process.env.JWT_SECRET || "mysecret";

// PATCH: Add overtime hours for today
export async function PATCH(req: NextRequest) {
  await connectDB();
  // Get JWT from Authorization header
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "");
  const userId = getEmployeeIdFromToken(token);
  if (!userId) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
  const { hours, date } = await req.json();
  if (typeof hours !== "number" || hours <= 0 || hours > 12) {
    return NextResponse.json({ error: "Invalid hours" }, { status: 400 });
  }
  // Find attendance for the given date
  if (!date) {
    return NextResponse.json({ error: "Missing date" }, { status: 400 });
  }
  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  const tomorrow = new Date(dateObj);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const attendance = await Attendance.findOne({
    employee: userId,
    date: { $gte: dateObj, $lt: tomorrow },
  });
  if (!attendance) {
    return NextResponse.json(
      { error: "Attendance not found for this date" },
      { status: 404 }
    );
  }
  attendance.overtimeHours = hours;
  await attendance.save();
  return NextResponse.json({
    success: true,
    overtimeHours: attendance.overtimeHours,
  });
}

// GET: Get overtime hours for today
export async function GET(req: NextRequest) {
  await connectDB();
  // Get JWT from cookies
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let userId = null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    userId = decoded.id;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
  // Find today's attendance
  const attendance = await Attendance.findTodayAttendance(userId);
  if (!attendance) {
    return NextResponse.json(
      { error: "Attendance not found for today" },
      { status: 404 }
    );
  }
  return NextResponse.json({ overtimeHours: attendance.overtimeHours ?? 0 });
}
