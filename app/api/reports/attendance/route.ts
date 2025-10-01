import { NextRequest, NextResponse } from "next/server";
import Attendance from "@/models/attendance";
import { connectDB } from "@/utils/database";
import { getEmployeeIdFromToken } from "@/utils/jwt";

// GET /api/reports/attendance?dateRange=YYYY-MM-DD_to_YYYY-MM-DD
export async function GET(req: NextRequest) {
  await connectDB();
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const employeeId = getEmployeeIdFromToken(token);
  if (!employeeId) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Optional date range
  const { searchParams } = new URL(req.url);
  const dateRange = searchParams.get("dateRange");
  let startDate: Date | undefined;
  let endDate: Date | undefined;
  if (dateRange) {
    const [start, end] = dateRange.split("_to_");
    startDate = new Date(start);
    endDate = new Date(end);
  }

  const query: { employee: string; date?: { $gte: Date; $lte: Date } } = {
    employee: employeeId,
  };
  if (startDate && endDate) {
    query.date = { $gte: startDate, $lte: endDate };
  }

  try {
    const records = await Attendance.find(query).sort({ date: -1 });
    console.log("records", records);
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}
