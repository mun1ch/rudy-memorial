import { NextResponse } from "next/server";

export async function GET() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  return NextResponse.json({
    hasPassword: !!adminPassword,
    passwordLength: adminPassword?.length || 0,
    passwordValue: adminPassword ? `"${adminPassword}"` : "undefined",
    nodeEnv: process.env.NODE_ENV
  });
}
