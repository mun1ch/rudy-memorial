import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Create response with success
    const response = NextResponse.json({ success: true });

    // Clear the admin authentication cookie
    response.cookies.delete("rudy-admin-auth");

    return response;
  } catch (error) {
    console.error("Admin logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
