import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { daysAgo, formatPhone } from "@/lib/format";
import { updateInactiveDays } from "./actions";

export default async function StaffDashboard() {
  const { supabase } = await requireStaff();

  const [{ data: settings }, { data: members }, { data: machines }] = await Promise.all([
    supabase.from("settings").select("inactive_days").eq("id", 1).single(),
    supabase
      .from("member_activity")
      .select("id, full_name, phone, created_at, last_workout_at, session_count"),
    supabase
      .from("machine_usage")
      .select("id, name, session_count, sessions_last_30_days, member_count")
      .order("session_count", { ascending: false }),
  ]);

  const inactiveDays = settings?.inactive_days ?? 14;
  const cutoff = Date.now() - inactiveDays * 86_400_000;
  // Members who joined recently and haven't trained yet aren't flagged until the window passes.
  const inactive = (members ?? [])
    .filter((m) => new Date(m.last_workout_at ?? m.created_at).getTime() < cutoff)
    .sort(
      (a, b) =>
        new Date(a.last_workout_at ?? a.created_at).getTime() -
        new Date(b.last_workout_at ?? b.created_at).getTime(),
    );

  return (
    <main className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Members" value={members?.length ?? 0} />
        <Stat label={`Inactive ${inactiveDays}+ days`} value={inactive.length} />
        <Stat label="Machines" value={machines?.length ?? 0} />
      </div>

      <section className="card">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-xl font-bold">Inactive members</h2>
          <form action={updateInactiveDays} className="flex items-center gap-2 text-sm">
            <label htmlFor="inactive_days">No workout in</label>
            <input
              id="inactive_days"
              name="inactive_days"
              type="number"
              min={1}
              defaultValue={inactiveDays}
              className="w-20 rounded-lg border border-slate-300 px-2 py-1"
            />
            <span>days</span>
            <button className="rounded-lg bg-slate-900 px-3 py-1 text-white">Update</button>
          </form>
        </div>
        {inactive.length === 0 ? (
          <p className="mt-4 text-slate-600">Everyone has trained recently.</p>
        ) : (
          <table className="mt-4 w-full text-left">
            <thead className="text-sm text-slate-500">
              <tr>
                <th className="py-2 font-normal">Member</th>
                <th className="font-normal">Phone</th>
                <th className="font-normal">Last workout</th>
              </tr>
            </thead>
            <tbody>
              {inactive.map((m) => (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="py-2">
                    <Link href={`/staff/members/${m.id}`} className="font-medium hover:underline">
                      {m.full_name ?? "(no name)"}
                    </Link>
                  </td>
                  <td>{formatPhone(m.phone)}</td>
                  <td>{m.last_workout_at ? daysAgo(m.last_workout_at) : "Never"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2 className="text-xl font-bold">Most-used machines</h2>
        {!machines || machines.length === 0 ? (
          <p className="mt-4 text-slate-600">
            No machines yet. <Link href="/staff/machines" className="underline">Add one</Link>.
          </p>
        ) : (
          <table className="mt-4 w-full text-left">
            <thead className="text-sm text-slate-500">
              <tr>
                <th className="py-2 font-normal">Machine</th>
                <th className="text-right font-normal">Workouts (all time)</th>
                <th className="text-right font-normal">Last 30 days</th>
                <th className="text-right font-normal">Members</th>
              </tr>
            </thead>
            <tbody>
              {machines.map((m) => (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="py-2 font-medium">{m.name}</td>
                  <td className="text-right">{m.session_count}</td>
                  <td className="text-right">{m.sessions_last_30_days}</td>
                  <td className="text-right">{m.member_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
