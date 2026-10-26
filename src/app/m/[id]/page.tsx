import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { daysAgo, sortedSets, type WorkoutSession } from "@/lib/format";
import SessionCard from "@/components/SessionCard";
import LogWorkoutForm from "./LogWorkoutForm";
import { signOut } from "@/app/actions";

// The page a machine's QR code opens.
export default async function MachinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/m/${id}`);

  const [{ data: machine }, { data: profile }, { data: lastSession }] = await Promise.all([
    supabase.from("machines").select("id, name, photo_url").eq("id", id).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("workout_sessions")
      .select("id, performed_at, workout_sets(set_number, weight, reps)")
      .eq("user_id", user.id)
      .eq("machine_id", id)
      .order("performed_at", { ascending: false })
      .limit(1)
      .maybeSingle<WorkoutSession>(),
  ]);

  if (!machine) notFound();
  if (!profile?.full_name) redirect(`/welcome?next=/m/${id}`);

  const prefill = lastSession
    ? sortedSets(lastSession.workout_sets).map(({ weight, reps }) => ({ weight, reps }))
    : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-3 p-3">
      <header className="flex items-center gap-3 px-2 pt-2">
        {machine.photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={machine.photo_url}
            alt=""
            className="h-14 w-14 rounded-xl object-cover"
          />
        )}
        <div>
          <p className="text-sm text-slate-500">Hi {profile.full_name.split(" ")[0]}</p>
          <h1 className="text-2xl font-bold leading-tight">{machine.name}</h1>
        </div>
      </header>

      {/* Top half: last session */}
      <section className="card flex flex-1 flex-col">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold">Last time</h2>
          {lastSession && (
            <span className="text-sm text-slate-500">{daysAgo(lastSession.performed_at)}</span>
          )}
        </div>
        {lastSession ? (
          <>
            <div className="mt-3">
              <SessionCard session={lastSession} />
            </div>
            <Link href={`/m/${id}/history`} className="btn-secondary mt-3">
              Full history
            </Link>
          </>
        ) : (
          <p className="mt-3 text-slate-600">
            No workouts on this machine yet. Log your first one below!
          </p>
        )}
      </section>

      {/* Bottom half: log today */}
      <section className="card flex flex-1 flex-col">
        <h2 className="text-lg font-bold">Today</h2>
        <LogWorkoutForm machineId={id} prefill={prefill} />
      </section>

      <form action={signOut} className="pb-4 text-center">
        <button className="text-sm text-slate-500 underline">Not you? Log out</button>
      </form>
    </main>
  );
}
