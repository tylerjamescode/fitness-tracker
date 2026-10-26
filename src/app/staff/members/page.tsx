import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { daysAgo, formatPhone } from "@/lib/format";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const { supabase } = await requireStaff();

  const { data: members } = await supabase
    .from("member_activity")
    .select("id, full_name, phone, last_workout_at, session_count")
    .order("full_name");

  const query = q.trim().toLowerCase();
  const digits = query.replace(/\D/g, "");
  const shown = (members ?? []).filter(
    (m) =>
      !query ||
      m.full_name?.toLowerCase().includes(query) ||
      (digits && m.phone?.includes(digits)),
  );

  return (
    <main className="card">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold">Members ({members?.length ?? 0})</h1>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name or phone"
            className="rounded-lg border border-slate-300 px-3 py-1"
          />
          <button className="rounded-lg bg-slate-900 px-3 py-1 text-white">Search</button>
        </form>
      </div>
      <table className="mt-4 w-full text-left">
        <thead className="text-sm text-slate-500">
          <tr>
            <th className="py-2 font-normal">Name</th>
            <th className="font-normal">Phone</th>
            <th className="text-right font-normal">Workouts</th>
            <th className="text-right font-normal">Last workout</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((m) => (
            <tr key={m.id} className="border-t border-slate-100">
              <td className="py-2">
                <Link href={`/staff/members/${m.id}`} className="font-medium hover:underline">
                  {m.full_name ?? "(no name)"}
                </Link>
              </td>
              <td>{formatPhone(m.phone)}</td>
              <td className="text-right">{m.session_count}</td>
              <td className="text-right">{m.last_workout_at ? daysAgo(m.last_workout_at) : "Never"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {shown.length === 0 && <p className="mt-4 text-slate-600">No members found.</p>}
    </main>
  );
}
