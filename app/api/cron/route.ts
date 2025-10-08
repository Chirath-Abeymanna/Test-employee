import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/utils/database";
import Attendance from "@/models/attendance";
import Employee from "@/models/employee";
import Company from "@/models/company";
import { Types } from "mongoose";

/**
 * AUTO SIGN-OUT CRON JOB
 *
 * This endpoint should be called by a cron service (like cron-job.org) to automatically
 * sign out employees who haven't signed out by their company's specified end time.
 *
 * Recommended cron schedule: Every 30 minutes during work hours
 * Example: "0,30 8-23 * * 1-5" (every 30 minutes from 8 AM to 11 PM, Monday to Friday)
 *
 * URL: https://your-domain.vercel.app/api/cron
 * Method: GET
 *
 * Security: Add a secret token for authentication when deploying
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication for production
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized. Invalid cron secret." },
        { status: 401 }
      );
    }

    await connectDB();

    const results = {
      processedCompanies: 0,
      autoSignedOutEmployees: 0,
      errors: [] as string[],
      timestamp: new Date().toISOString(),
    };

    // Get all companies with their work time settings
    const companies = await Company.find({
      company_out_time: { $exists: true, $ne: null },
    }).select(
      "_id company_name company_out_time company_start_time accept_lunch lunch_start_time lunch_duration_minutes"
    );

    console.log(companies);

    console.log(
      `[CRON] Processing ${companies.length} companies for auto sign-out `
    );

    for (const company of companies) {
      try {
        results.processedCompanies++;

        // Parse company end time
        const [endHour, endMinute] = (company.company_out_time || "18:00")
          .split(":")
          .map(Number);

        // Get current date and set the sign-out deadline
        const now = new Date();
        const signOutDeadline = new Date();
        signOutDeadline.setHours(endHour, endMinute, 0, 0);

        // Only process if current time is past the company's end time
        if (now <= signOutDeadline) {
          console.log(
            `[CRON] Skipping ${company.company_name} - not past end time yet`
          );
          continue;
        }

        // Get today's date string for database queries
        const todayStr = now.toISOString().split("T")[0];
        const todayStart = new Date(todayStr);
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);

        console.log("Processing date:", todayStart);

        // Step 1: Get all employees for this company
        const employees = await Employee.find({
          company: company._id,
        }).select("_id name email");

        console.log(
          `[CRON] Found ${employees.length} employees in ${company.company_name}`
        );

        if (employees.length === 0) {
          console.log(`[CRON] No employees found for ${company.company_name}`);
          continue;
        }

        console.log(todayStart, todayEnd);
        console.log(
          "Employee IDs:",
          employees.map((e) => e._id)
        );

        // Step 2: Get employee IDs for attendance query
        const employeeIds = employees.map((emp) => emp._id);

        // Step 3: Find attendance records for these employees who are signed in but not signed out
        const attendanceRecords = await Attendance.find({
          employee: { $in: employeeIds },
          date: {
            $gte: todayStart,
          },
          signInTime: { $exists: true, $ne: null },
          signOutTime: null,
        }).populate("employee", "name email");

        console.log(
          `[CRON] Found ${attendanceRecords} employees to auto sign-out for ${company.company_name}`
        );

        const validRecords = attendanceRecords;

        for (const attendance of validRecords) {
          try {
            // Type guard to ensure employee is populated
            const employee = attendance.employee as unknown as {
              _id: Types.ObjectId;
              name: string;
              email: string;
            };

            if (!employee.name || !employee.email) {
              console.error("[CRON] Employee data not properly populated");
              continue;
            }

            // Calculate hours worked up to the deadline
            const signInTime = new Date(attendance.signInTime!);
            const hoursWorked =
              (signOutDeadline.getTime() - signInTime.getTime()) /
              (1000 * 60 * 60);

            // Handle half-day logic
            let actualSignOutTime = signOutDeadline;
            let finalHours = hoursWorked;

            if (attendance.halfDay) {
              // For half-day, calculate sign-out time as midpoint between start and end
              const [startHour, startMinute] = (
                company.company_start_time || "09:00"
              )
                .split(":")
                .map(Number);
              const startTime = new Date(signInTime);
              startTime.setHours(startHour, startMinute, 0, 0);

              const endTime = new Date(signInTime);
              endTime.setHours(endHour, endMinute, 0, 0);

              const halfDayMs = (endTime.getTime() - startTime.getTime()) / 2;
              actualSignOutTime = new Date(startTime.getTime() + halfDayMs);
              finalHours =
                (actualSignOutTime.getTime() - signInTime.getTime()) /
                (1000 * 60 * 60);
            }

            // Adjust for lunch break if applicable
            if (company.accept_lunch && company.lunch_duration_minutes) {
              // Check if lunch break was taken
              if (attendance.lunchBreakStart && attendance.lunchBreakEnd) {
                const lunchDurationHours = company.lunch_duration_minutes / 60;
                finalHours = Math.max(0, finalHours - lunchDurationHours);
              } else if (
                attendance.lunchBreakStart &&
                !attendance.lunchBreakEnd
              ) {
                // Lunch started but not ended - end it automatically
                const lunchEndTime = new Date(
                  attendance.lunchBreakStart.getTime() +
                    company.lunch_duration_minutes * 60 * 1000
                );
                attendance.lunchBreakEnd = lunchEndTime;
                attendance.lunchBreakTaken = true;

                const lunchDurationHours = company.lunch_duration_minutes / 60;
                finalHours = Math.max(0, finalHours - lunchDurationHours);
              }
            }

            // Update attendance record
            attendance.signOutTime = actualSignOutTime;
            attendance.totalHoursWorked = Math.max(
              0,
              parseFloat(finalHours.toFixed(2))
            );
            attendance.presentAbsentStatus = "present";

            await attendance.save();

            console.log(
              `[CRON] Auto signed-out ${employee.name} (${
                employee.email
              }) at ${actualSignOutTime.toISOString()}, Hours: ${finalHours.toFixed(
                2
              )}`
            );
            results.autoSignedOutEmployees++;
          } catch (error) {
            const errorMsg = `Failed to auto sign-out employee ${
              attendance.employee
            }: ${error instanceof Error ? error.message : "Unknown error"}`;
            console.error(`[CRON] ${errorMsg}`);
            results.errors.push(errorMsg);
          }
        }
      } catch (error) {
        const errorMsg = `Failed to process company ${company.company_name}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        console.error(`[CRON] ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }

    console.log(`[CRON] Completed auto sign-out process:`, results);

    return NextResponse.json({
      success: true,
      message: "Auto sign-out cron job completed successfully",
      results,
    });
  } catch (error) {
    console.error("[CRON] Fatal error in auto sign-out cron job:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during cron job execution",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for manual testing
 * Use this to test the cron job functionality manually
 */
export async function POST(request: NextRequest) {
  try {
    // This is the same logic as GET but for manual testing
    const { testMode } = await request.json();

    if (!testMode) {
      return NextResponse.json(
        { error: "Test mode must be enabled for POST requests" },
        { status: 400 }
      );
    }

    // Call the same logic as GET
    const getRequest = new NextRequest(request.url, {
      method: "GET",
      headers: request.headers,
    });

    return await GET(getRequest);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to run test cron job",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
