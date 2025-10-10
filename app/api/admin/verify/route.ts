import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE_NAME = "rudy-admin-auth";
const ADMIN_COOKIE_VALUE = "authenticated";

/**
 * Verify admin authentication cookie
 * Used by client-side components to check auth status
 */
export async function GET(request: NextRequest) {
  try {
    const adminCookie = request.cookies.get(ADMIN_COOKIE_NAME);
    
    if (!adminCookie || adminCookie.value !== ADMIN_COOKIE_VALUE) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error("Admin verify error:", error);
    return NextResponse.json(
      { authenticated: false },
      { status: 500 }
    );
  }
}

