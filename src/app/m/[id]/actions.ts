"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SetInput = { weight: number; reps: number };

export async function logWorkout(machineId: string, sets: SetInput[]) {
  const clean = sets.filter(
    (s) => Number.isFinite(s.weight) && s.weight >= 0 && Number.isInteger(s.reps) && s.reps > 0,
  );
  if (clean.length === 0 || clean.length !== sets.length) {
    return { error: "Each set needs a weight and at least 1 rep." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("log_workout", {
    p_machine_id: machineId,
    p_sets: clean,
  });
  if (error) return { error: error.message };

  revalidatePath(`/m/${machineId}`);
  return { error: null };
}
