import { cookies } from "next/headers";
// PATCH /api/company - set company cookie from provided data, do not save to DB
// ...existing code...
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  // Only set cookie, do not save to DB
  console.log("Setting company cookie with data:", body);
  const cookieData = {
    company_id: body.company_id,
    company_name: body.company_name,
    company_email: body.company_email,
    company_start_time: body.company_start_time,
    company_end_time: body.company_out_time,
    accept_lunch: body.accept_lunch,
    lunch_start_time: body.lunch_start_time,
    lunch_duration_minutes: body.lunch_duration_minutes,
  };
  (await cookies()).set("company", JSON.stringify(cookieData), {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
  return NextResponse.json({
    success: true,
    message: "Company cookie set",
    data: cookieData,
  });
}
// ...existing code...
export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  try {
    const existing = await Company.findOne({
      company_email: body.company_email,
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Company already exists" },
        { status: 409 }
      );
    }
    const company = new Company(body);
    await company.save();
    // Set cookie with company details (only safe fields)
    const cookieData = {
      company_id: company.company_id,
      company_name: company.company_name,
      company_email: company.company_email,
      company_start_time: company.company_start_time,
      company_end_time: company.company_end_time,
    };
    (await cookies()).set("company", JSON.stringify(cookieData), {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    return NextResponse.json({ success: true, data: company });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import Company from "@/models/company";
import { connectDB } from "@/utils/database";

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("id");
  if (!companyId) {
    return NextResponse.json(
      { success: false, message: "Company ID required" },
      { status: 400 }
    );
  }
  try {
    const company = await Company.findOne({ _id: companyId });
    if (!company) {
      return NextResponse.json(
        { success: false, message: "Company not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: company });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
