import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { formatDate, formatPhone, type WorkoutSession } from "@/lib/format";
import SessionCard from "@/components/SessionCard";

type SessionWithMachine = WorkoutSession & { machines: { name: string } | null };

// One member's personal records and full workout history.
export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireStaff();

  const [{ data: member }, { data: records }, { data: sessions }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone, created_at").eq("id", id).maybeSingle(),
    supabase
      .from("personal_records")
      .select("machine_id, machine_name, weight, reps, performed_at")
      .eq("user_id", id)
      .order("machine_name"),
    supabase
      .from("workout_sessions")
      .select("id, performed_at, machines(name), workout_sets(set_number, weight, reps)")
      .eq("user_id", id)
      .order("performed_at", { ascending: false })
      .returns<SessionWithMachine[]>(),
  ]);
  if (!member) notFound();

  return (
    <main className="flex flex-col gap-6">
      <Link href="/staff/members" className="text-slate-500">
        ← All members
      </Link>
      <div className="card">
        <h1 className="text-2xl font-bold">{member.full_name ?? "(no name)"}</h1>
        <p className="text-slate-600">
          {formatPhone(member.phone)} · Joined {formatDate(member.created_at)} ·{" "}
          {sessions?.length ?? 0} workouts
        </p>
      </div>

      <section className="card">
        <h2 className="text-xl font-bold">Personal records</h2>
        {!records || records.length === 0 ? (
          <p className="mt-4 text-slate-600">No workouts logged yet.</p>
        ) : (
          <table className="mt-4 w-full text-left">
            <thead className="text-sm text-slate-500">
              <tr>
                <th className="py-2 font-normal">Machine</th>
                <th className="font-normal">Best set</th>
                <th className="font-normal">Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.machine_id} className="border-t border-slate-100">
                  <td className="py-2 font-medium">{r.machine_name}</td>
                  <td>
                    {r.weight} lb × {r.reps}
                  </td>
                  <td>{formatDate(r.performed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2 className="text-xl font-bold">Full history</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {sessions?.map((s) => (
            <SessionCard key={s.id} session={s} title={s.machines?.name ?? "Deleted machine"} />
          ))}
        </div>
      </section>
    </main>
  );
}
