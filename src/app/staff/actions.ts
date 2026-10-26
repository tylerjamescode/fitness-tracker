"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";

export async function updateInactiveDays(formData: FormData) {
  const days = Number(formData.get("inactive_days"));
  if (!Number.isInteger(days) || days < 1) return;
  const { supabase } = await requireStaff();
  await supabase.from("settings").update({ inactive_days: days }).eq("id", 1);
  revalidatePath("/staff");
}

export async function saveMachine(input: { id?: string; name: string; photo_url: string | null }) {
  const name = input.name.trim();
  if (!name) return { error: "Machine name is required." };
  const { supabase } = await requireStaff();

  const { error } = input.id
    ? await supabase.from("machines").update({ name, photo_url: input.photo_url }).eq("id", input.id)
    : await supabase.from("machines").insert({ name, photo_url: input.photo_url });
  if (error) return { error: error.message };

  revalidatePath("/staff/machines");
  return { error: null };
}

export async function deleteMachine(formData: FormData) {
  const id = String(formData.get("id"));
  const { supabase } = await requireStaff();
  await supabase.from("machines").delete().eq("id", id);
  revalidatePath("/staff/machines");
  redirect("/staff/machines");
}
