import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE_NAME = "rudy-admin-auth";
const ADMIN_COOKIE_VALUE = "authenticated";

export async function requireAdmin() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME);
  
  if (!adminCookie || adminCookie.value !== ADMIN_COOKIE_VALUE) {
    redirect("/admin-login");
  }
  
  return { email: "admin@rudy-memorial.com" };
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME);
  
  return adminCookie?.value === ADMIN_COOKIE_VALUE;
}

export async function setAdminAuth() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearAdminAuth() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
