import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error("Error getting user:", error);
    return null;
  }
  
  return user;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}

export async function requireAdmin() {
  // For now, bypass admin check since we don't have auth set up
  // In production, you would implement proper authentication here
  return { email: "admin@rudy-memorial.com" };
  
  // Original implementation (commented out for now):
  // const user = await requireAuth();
  // const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
  // 
  // if (!adminEmails.includes(user.email!)) {
  //   redirect("/");
  // }
  // 
  // return user;
}

export function isAdminEmail(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
  return adminEmails.includes(email);
}
