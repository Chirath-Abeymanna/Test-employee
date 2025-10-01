import { NextResponse } from "next/server";
import Leave from "@/models/leave";
import { connectDB } from "@/utils/database";
import { getEmployeeIdFromToken } from "@/utils/jwt";

// GET: /api/leave?employeeId=xxx
export async function GET(request: Request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");
  if (!employeeId) {
    return NextResponse.json({ error: "Missing employeeId" }, { status: 400 });
  }
  const leave = await Leave.findOne({ employee: employeeId });
  if (!leave) {
    return NextResponse.json({ sickLeaves: 0, halfDayLeaves: 0 });
  }
  return NextResponse.json({
    sickLeaves: leave.sickLeaves,
    halfDayLeaves: leave.halfDayLeaves,
  });
}

// POST: /api/leave
// Body: { employeeId: string, type: "sick" | "half" }
export async function POST(request: Request) {
  await connectDB();
  const body = await request.json();
  const { employeeId, type } = body;
  if (!employeeId || !type) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }
  let leave = await Leave.findOne({ employee: employeeId });
  if (!leave) {
    leave = new Leave({
      employee: employeeId,
      sickLeaves: 0,
      halfDayLeaves: 0,
    });
  }
  if (type === "sick") {
    leave.sickLeaves += 1;
  } else if (type === "half") {
    leave.halfDayLeaves += 1;
  } else {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  await leave.save();
  return NextResponse.json({
    success: true,
    sickLeaves: leave.sickLeaves,
    halfDayLeaves: leave.halfDayLeaves,
  });
}

// PATCH: /api/leave
// Body: { type: "sick" | "half" }
export async function PATCH(request: Request) {
  await connectDB();
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  const employeeId = getEmployeeIdFromToken(token || "");
  const body = await request.json();
  console.log("body", body);
  const { type } = body;

  if (!employeeId || !type) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const leave = await Leave.findOne({ employee: employeeId });
  if (!leave) {
    return NextResponse.json(
      { error: "Leave record not found" },
      { status: 404 }
    );
  }
  if (type === "sick") {
    leave.sickLeaves += 1;
  } else if (type === "half") {
    leave.halfDayLeaves += 1;
  } else {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  await leave.save();
  return NextResponse.json({
    success: true,
    sickLeaves: leave.sickLeaves,
    halfDayLeaves: leave.halfDayLeaves,
  });
}
