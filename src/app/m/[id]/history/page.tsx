import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { WorkoutSession } from "@/lib/format";
import SessionCard from "@/components/SessionCard";

// Every past session on one machine for the logged-in member.
export default async function HistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/m/${id}/history`);

  const [{ data: machine }, { data: sessions }] = await Promise.all([
    supabase.from("machines").select("name").eq("id", id).maybeSingle(),
    supabase
      .from("workout_sessions")
      .select("id, performed_at, workout_sets(set_number, weight, reps)")
      .eq("user_id", user.id)
      .eq("machine_id", id)
      .order("performed_at", { ascending: false })
      .returns<WorkoutSession[]>(),
  ]);
  if (!machine) notFound();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-3 p-3">
      <Link href={`/m/${id}`} className="px-2 pt-2 text-slate-500">
        ← Back
      </Link>
      <h1 className="px-2 text-2xl font-bold">{machine.name} history</h1>
      <div className="card flex flex-col gap-3">
        {sessions && sessions.length > 0 ? (
          sessions.map((s) => <SessionCard key={s.id} session={s} />)
        ) : (
          <p className="text-slate-600">No workouts yet.</p>
        )}
      </div>
    </main>
  );
}
