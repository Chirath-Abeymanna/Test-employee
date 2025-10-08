import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export const revalidate = 0; // Disable caching for cron routes

export const GET = async (reqeust: NextRequest) => {
  console.log("[CRON] Auto sign-out cron job started");
  return NextResponse.json(
    { message: "Test cron job executed" },
    { status: 200 }
  );
};
