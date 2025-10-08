import { NextResponse } from "next/server";
import Attendance from "../../../models/attendance";
import { connectDB } from "@/utils/database";
import { getEmployeeIdFromToken } from "@/utils/jwt";

// Helper functions - work with UTC times, frontend handles timezone display
function getCurrentSriLankaTime(): Date {
  // Return current UTC time - frontend will handle Sri Lankan timezone display
  return new Date();
}

function convertToSriLankaTime(timeString: string): Date {
  // Simply parse the input time as UTC - frontend handles timezone display
  return new Date(timeString);
}

function extractEmployeeIdFromAuth(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  return getEmployeeIdFromToken(token);
}

function getUTCDateForLocalDate(dateString: string): Date {
  const date = new Date(dateString); // e.g. "2025-10-01"
  // Set UTC so that it represents local midnight (UTC = local - 5:30)
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
  );
}

function localMidnightToUTC(dateISO: string): Date {
  // Parsing a fixed-offset timestamp creates the correct UTC instant.
  // Example: "2025-10-01T00:00:00+05:30"
  return new Date(`${dateISO}T00:00:00+05:30`);
}

/** Next local day midnight → UTC instant (exclusive upper bound) */
function nextLocalMidnightToUTC(dateISO: string): Date {
  const d = localMidnightToUTC(dateISO);
  // add 24h in UTC (we are stepping from one local midnight to the next)
  d.setUTCHours(d.getUTCHours() + 24);
  return d;
}

export async function GET(request: Request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");
  const employeeId = extractEmployeeIdFromAuth(request);
  if (!employeeId || !dateStr) {
    return NextResponse.json(
      { error: "Missing employeeId (token) or date" },
      { status: 400 }
    );
  }

  const UTCDate = localMidnightToUTC(dateStr);

  const attendance = await Attendance.findOne({
    employee: employeeId,
    date: { $gte: UTCDate },
  });

  console.log("Fetched attendance record:", attendance);

  if (!attendance) {
    return NextResponse.json({ status: "idle" });
  }

  if (attendance.signInTime && !attendance.signOutTime) {
    return NextResponse.json({
      status: "signedIn",
      signInTime: attendance.signInTime,
      location: attendance.workLocation,
      presentAbsentStatus: attendance.presentAbsentStatus,
      leaveType: attendance.leaveType || null,
      overtimeHours: attendance.overtimeHours ?? 0,
      halfDay: attendance.halfDay ?? false,
      lunchBreakStart: attendance.lunchBreakStart,
      lunchBreakEnd: attendance.lunchBreakEnd,
      lunchBreakTaken: attendance.lunchBreakTaken ?? false,
    });
  } else if (attendance.signOutTime) {
    return NextResponse.json({
      status: "signedOut",
      signInTime: attendance.signInTime,
      signOutTime: attendance.signOutTime,
      location: attendance.workLocation,
      totalHoursWorked: attendance.totalHoursWorked,
      presentAbsentStatus: attendance.presentAbsentStatus,
      leaveType: attendance.leaveType || null,
      overtimeHours: attendance.overtimeHours ?? 0,
      halfDay: attendance.halfDay ?? false,
      lunchBreakStart: attendance.lunchBreakStart,
      lunchBreakEnd: attendance.lunchBreakEnd,
      lunchBreakTaken: attendance.lunchBreakTaken ?? false,
    });
  } else {
    // If record exists but no signIn/signOut, return absent/leave info
    return NextResponse.json({
      status: "idle",
      presentAbsentStatus: attendance.presentAbsentStatus,
      leaveType: attendance.leaveType || null,
      overtimeHours: attendance.overtimeHours ?? 0,
      halfDay: attendance.halfDay ?? false,
    });
  }
}

export async function POST(request: Request) {
  await connectDB();
  const body = await request.json();
  const { type, time, location, date, hours, leaveType } = body;
  const employeeId = extractEmployeeIdFromAuth(request);
  if (!employeeId || !type) {
    return NextResponse.json(
      { error: "Missing required fields (token) or type" },
      { status: 400 }
    );
  }

  const dateObj = new Date(date);

  const UTCStartDate = localMidnightToUTC(date);
  const UTCEndDate = nextLocalMidnightToUTC(date);

  let attendance = await Attendance.findOne({
    employee: employeeId,
    date: { $gte: UTCStartDate, $lte: UTCEndDate },
  });

  console.log("Attendance record found:", attendance);

  if (type === "signIn") {
    if (attendance && attendance.signInTime) {
      return NextResponse.json({ error: "Already signed in" }, { status: 409 });
    }

    // Convert time to Sri Lankan timezone
    const sriLankaSignInTime = time
      ? convertToSriLankaTime(time)
      : getCurrentSriLankaTime();

    if (!attendance) {
      attendance = new Attendance({
        employee: employeeId,
        date: getUTCDateForLocalDate(date), // Store date in UTC
        workLocation:
          location === "WFH" ? "work_from_home" : "work_from_office",
        signInTime: sriLankaSignInTime,
        presentAbsentStatus: "present",
      });
    } else {
      attendance.signInTime = sriLankaSignInTime;
      attendance.workLocation =
        location === "WFH" ? "work_from_home" : "work_from_office";
      attendance.presentAbsentStatus = "present";
    }
    await attendance.save();
    return NextResponse.json({ success: true });
  }

  if (type === "signOut" || type === "autoSignOut") {
    console.log("Sign out attempt:", {
      attendance: !!attendance,
      signInTime: !!attendance?.signInTime,
    });

    if (!attendance || !attendance.signInTime) {
      return NextResponse.json({ error: "Not signed in" }, { status: 409 });
    }

    // Convert time to Sri Lankan timezone
    const sriLankaSignOutTime = time
      ? convertToSriLankaTime(time)
      : getCurrentSriLankaTime();

    attendance.signOutTime = sriLankaSignOutTime;
    attendance.totalHoursWorked = hours || 0;
    await attendance.save();
    return NextResponse.json({ success: true });
  }

  if (type === "absent") {
    if (!attendance) {
      attendance = new Attendance({
        employee: employeeId,
        date: dateObj, // Use the properly parsed dateObj
        presentAbsentStatus: "absent",
      });
      await attendance.save();
    }
    return NextResponse.json({ success: true });
  }

  if (type === "leave") {
    // Mark attendance as leave for the given date
    if (!attendance) {
      attendance = new Attendance({
        employee: employeeId,
        date: dateObj,
        presentAbsentStatus: "absent",
        leaveType: leaveType || "sick",
      });
    } else {
      attendance.presentAbsentStatus = "absent";
      attendance.leaveType = leaveType || "sick";
    }
    await attendance.save();
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

export async function PATCH(request: Request) {
  await connectDB();
  const body = await request.json();
  const { date, halfDay } = body;
  const employeeId = extractEmployeeIdFromAuth(request);
  if (!employeeId || !date) {
    return NextResponse.json(
      { error: "Missing employeeId (token) or date" },
      { status: 400 }
    );
  }
  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  const attendance = await Attendance.findOne({
    employee: employeeId,
    date: {
      $gte: dateObj,
      $lt: new Date(dateObj.getTime() + 24 * 60 * 60 * 1000),
    },
  });
  if (!attendance) {
    return NextResponse.json(
      { error: "Attendance record not found" },
      { status: 404 }
    );
  }
  if (typeof halfDay === "boolean") {
    attendance.halfDay = halfDay;
  }
  await attendance.save();
  return NextResponse.json({ success: true });
}
