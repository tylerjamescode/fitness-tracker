"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { saveMachine } from "../actions";

// Add a machine (no `machine`) or edit one. Photos upload straight to Supabase Storage.
export default function MachineForm({
  machine,
}: {
  machine?: { id: string; name: string; photo_url: string | null };
}) {
  const router = useRouter();
  const [name, setName] = useState(machine?.name ?? "");
  const [photoUrl, setPhotoUrl] = useState(machine?.photo_url ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError("");

    let finalPhotoUrl = photoUrl;
    if (file) {
      const supabase = createClient();
      const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.]/g, "_")}`;
      const { error: uploadError } = await supabase.storage
        .from("machine-photos")
        .upload(path, file, { contentType: file.type });
      if (uploadError) {
        setBusy(false);
        setError(`Photo upload failed: ${uploadError.message}`);
        return;
      }
      finalPhotoUrl = supabase.storage.from("machine-photos").getPublicUrl(path).data.publicUrl;
    }

    const result = await saveMachine({ id: machine?.id, name, photo_url: finalPhotoUrl });
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (machine) {
      router.push("/staff/machines");
    } else {
      setName("");
      setFile(null);
      form.reset();
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-slate-600">Machine name</span>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Leg Press"
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-slate-600">Photo (optional)</span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>
      {photoUrl && !file && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
          <button type="button" className="text-sm text-red-600 underline" onClick={() => setPhotoUrl(null)}>
            Remove photo
          </button>
        </div>
      )}
      <button className="btn" disabled={busy}>
        {busy ? "Saving…" : machine ? "Save changes" : "Add machine"}
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </form>
  );
}
