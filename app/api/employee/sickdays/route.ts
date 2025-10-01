import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Employee from "../../../../models/employee";
import { connectDB } from "@/utils/database";

export async function GET(request: Request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, message: "Invalid employee ID format" },
      { status: 400 }
    );
  }
  try {
    const employee = await Employee.findById(id).select("sickDaysPerMonth");
    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      sickDaysPerMonth: employee.sickDaysPerMonth,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
