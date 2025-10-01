// GET /api/employee/sickdays?id=<employeeId>

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Employee from "../../../models/employee";
import { connectDB } from "@/utils/database";
import { getEmployeeIdFromToken } from "@/utils/jwt";

export async function POST(request: Request) {
  await connectDB();
  const body = await request.json();
  delete body._id;
  delete body.createdAt;
  delete body.updatedAt;
  try {
    const existingEmployee = await Employee.findOne({
      email: body.email,
    });
    if (existingEmployee) {
      return NextResponse.json(
        { success: false, message: "Employee with this email already exists" },
        { status: 409 }
      );
    }
    const employee = new Employee(body);
    await employee.save();
    const employeeObj = employee.toObject();
    delete employeeObj.password;
    return NextResponse.json(
      {
        success: true,
        message: "Employee created successfully",
        data: employeeObj,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map(
        (err) => (err as mongoose.Error.ValidatorError).message
      );
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        },
        { status: 400 }
      );
    }
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

// PATCH /api/employee/sickdays?id=<employeeId>
export async function PATCH(request: Request) {
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
    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }
    if (employee.sickDaysPerMonth > 0) {
      employee.sickDaysPerMonth -= 1;
      await employee.save();
      return NextResponse.json({
        success: true,
        sickDaysPerMonth: employee.sickDaysPerMonth,
      });
    } else {
      return NextResponse.json(
        { success: false, message: "No sick days left" },
        { status: 409 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  await connectDB();
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }
  const token = authHeader.replace("Bearer ", "");
  const employeeId = getEmployeeIdFromToken(token);
  if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
    return NextResponse.json(
      { success: false, message: "Invalid employee ID in token" },
      { status: 400 }
    );
  }
  try {
    const employee = await Employee.findById(employeeId).select("-password");
    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      message: "Employee retrieved successfully",
      data: employee,
      sickDaysPerMonth: employee.sickDaysPerMonth,
      halfDaysPerMonth: employee.halfDaysPerMonth ?? Infinity,
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

export async function PUT(request: Request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, message: "Invalid employee ID format" },
      { status: 400 }
    );
  }
  const updates = await request.json();
  delete updates._id;
  delete updates.createdAt;
  delete updates.updatedAt;
  if (updates.email) {
    const existingEmployee = await Employee.findOne({
      email: updates.email,
      _id: { $ne: id },
    });
    if (existingEmployee) {
      return NextResponse.json(
        { success: false, message: "Employee with this email already exists" },
        { status: 409 }
      );
    }
  }
  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select("-employeePassword");
    if (!updatedEmployee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      message: "Employee updated successfully",
      data: updatedEmployee,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map(
        (err) => (err as mongoose.Error.ValidatorError).message
      );
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        },
        { status: 400 }
      );
    }
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

export async function DELETE(request: Request) {
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
    const deletedEmployee = await Employee.findByIdAndDelete(id);
    if (!deletedEmployee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      message: "Employee deleted successfully",
      data: { id: deletedEmployee._id },
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
