import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { deleteMachine } from "../../actions";
import MachineForm from "../MachineForm";

export default async function EditMachinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireStaff();
  const { data: machine } = await supabase
    .from("machines")
    .select("id, name, photo_url")
    .eq("id", id)
    .maybeSingle();
  if (!machine) notFound();

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6">
      <Link href="/staff/machines" className="text-slate-500">
        ← All machines
      </Link>
      <section className="card">
        <h1 className="text-xl font-bold">Edit machine</h1>
        <div className="mt-4">
          <MachineForm machine={machine} />
        </div>
      </section>
      <form action={deleteMachine} className="card border border-red-200">
        <input type="hidden" name="id" value={machine.id} />
        <h2 className="font-bold text-red-700">Delete machine</h2>
        <p className="mt-1 text-sm text-slate-600">
          This also deletes every workout members logged on it, and its QR code stops working.
        </p>
        <button className="mt-3 rounded-xl bg-red-600 px-4 py-2 font-semibold text-white">
          Delete {machine.name}
        </button>
      </form>
    </main>
  );
}
