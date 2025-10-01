import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "mysecret";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/utils/database";
import Employee from "../../../../models/employee";
import bcryptjs from "bcryptjs";

export async function POST(request: Request) {
  await connectDB();
  const { email, password } = await request.json();
  console.log("SignIn attempt with email:", email);
  console.log("Provided password:", password);
  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: "Email and password required" },
      { status: 400 }
    );
  }
  try {
    const employee = await Employee.findOne({ email }).select("+password");
    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Invalid email" },
        { status: 401 }
      );
    }
    // No encryption: compare plain text
    if (typeof employee.password !== "string") {
      return NextResponse.json(
        { success: false, message: "Password is in invalid format" },
        { status: 401 }
      );
    }
    const verifiedPassword = await bcryptjs.compare(
      password,
      employee.password
    );
    if (!verifiedPassword) {
      return NextResponse.json(
        { success: false, message: "Invalid password" },
        { status: 401 }
      );
    }
    // Generate JWT token with employee ID
    const token = jwt.sign({ employeeId: employee._id }, JWT_SECRET, {
      expiresIn: "1d",
    });
    return NextResponse.json({
      success: true,
      message: "Sign in successful",
      token,
      employee: {
        name: employee.name,
        email: employee.email,
        image: employee.image,
        role: employee.role,
        salary: employee.salary,
      },
    });
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
