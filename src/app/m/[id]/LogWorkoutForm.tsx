"use client";

import { useState, useTransition } from "react";
import { logWorkout, type SetInput } from "./actions";

type Row = { weight: string; reps: string };

const toRows = (sets: SetInput[] | null): Row[] =>
  sets && sets.length > 0
    ? sets.map((s) => ({ weight: String(s.weight), reps: String(s.reps) }))
    : [{ weight: "", reps: "" }];

// Today's sets, pre-filled from last time so members only change what's different.
export default function LogWorkoutForm({
  machineId,
  prefill,
}: {
  machineId: string;
  prefill: SetInput[] | null;
}) {
  const [rows, setRows] = useState<Row[]>(() => toRows(prefill));
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function update(index: number, field: keyof Row, value: string) {
    setMessage(null);
    setRows((current) => current.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addSet() {
    setMessage(null);
    // A new set copies the one above it, since that's usually what people do next.
    setRows((current) => [...current, { ...(current.at(-1) ?? { weight: "", reps: "" }) }]);
  }

  function removeSet(index: number) {
    setMessage(null);
    setRows((current) => current.filter((_, i) => i !== index));
  }

  function save() {
    const sets = rows.map((r) => ({ weight: Number(r.weight), reps: Number(r.reps) }));
    if (rows.some((r) => r.weight === "" || r.reps === "")) {
      setMessage({ kind: "error", text: "Fill in weight and reps for every set." });
      return;
    }
    startTransition(async () => {
      const result = await logWorkout(machineId, sets);
      setMessage(
        result.error
          ? { kind: "error", text: result.error }
          : { kind: "ok", text: "Saved! Nice work." },
      );
    });
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      <div className="grid grid-cols-[2.5rem_1fr_1fr_2.5rem] items-center gap-2 text-sm text-slate-500">
        <span>Set</span>
        <span>Weight (lb)</span>
        <span>Reps</span>
        <span />
      </div>
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-[2.5rem_1fr_1fr_2.5rem] items-center gap-2">
          <span className="text-center text-lg font-semibold">{i + 1}</span>
          <input
            className="input text-center"
            inputMode="decimal"
            value={row.weight}
            onChange={(e) => update(i, "weight", e.target.value.replace(/[^\d.]/g, ""))}
            aria-label={`Set ${i + 1} weight`}
          />
          <input
            className="input text-center"
            inputMode="numeric"
            value={row.reps}
            onChange={(e) => update(i, "reps", e.target.value.replace(/\D/g, ""))}
            aria-label={`Set ${i + 1} reps`}
          />
          <button
            type="button"
            onClick={() => removeSet(i)}
            disabled={rows.length === 1}
            className="h-10 w-10 rounded-full text-2xl text-slate-400 active:bg-slate-100 disabled:opacity-30"
            aria-label={`Remove set ${i + 1}`}
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" onClick={addSet} className="btn-secondary">
        + Add set
      </button>
      <button type="button" onClick={save} disabled={pending} className="btn">
        {pending ? "Saving…" : "Save workout"}
      </button>
      {message && (
        <p className={message.kind === "ok" ? "text-center font-semibold text-green-700" : "text-red-600"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
