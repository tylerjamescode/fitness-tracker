import { formatDate, sortedSets, type WorkoutSession } from "@/lib/format";

// One past workout: the date and a row per set.
export default function SessionCard({
  session,
  title,
}: {
  session: WorkoutSession;
  title?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold">{title ?? formatDate(session.performed_at)}</span>
        {title && <span className="text-sm text-slate-500">{formatDate(session.performed_at)}</span>}
      </div>
      <table className="mt-2 w-full text-left">
        <thead className="text-sm text-slate-500">
          <tr>
            <th className="font-normal">Set</th>
            <th className="font-normal">Weight</th>
            <th className="font-normal">Reps</th>
          </tr>
        </thead>
        <tbody className="text-lg">
          {sortedSets(session.workout_sets).map((set) => (
            <tr key={set.set_number}>
              <td>{set.set_number}</td>
              <td>{set.weight} lb</td>
              <td>{set.reps}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
