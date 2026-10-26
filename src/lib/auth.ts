import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Use at the top of any staff page or action. Sends non-staff to the staff login.
export async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/staff-login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "staff") redirect("/staff-login?error=not-staff");

  return { supabase, user };
}
