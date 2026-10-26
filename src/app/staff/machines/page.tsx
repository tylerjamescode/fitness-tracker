import Link from "next/link";
import QRCode from "qrcode";
import { requireStaff } from "@/lib/auth";
import { getSiteUrl } from "@/lib/site-url";
import MachineForm from "./MachineForm";

export default async function MachinesPage() {
  const { supabase } = await requireStaff();
  const { data: machines } = await supabase
    .from("machines")
    .select("id, name, photo_url")
    .order("name");

  const siteUrl = await getSiteUrl();
  const withQr = await Promise.all(
    (machines ?? []).map(async (m) => ({
      ...m,
      qr: await QRCode.toDataURL(`${siteUrl}/m/${m.id}`, { margin: 1, width: 160 }),
    })),
  );

  return (
    <main className="grid gap-6 md:grid-cols-[1fr_2fr]">
      <section className="card h-fit">
        <h2 className="text-xl font-bold">Add a machine</h2>
        <div className="mt-4">
          <MachineForm />
        </div>
      </section>

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">Machines ({withQr.length})</h2>
          {withQr.length > 0 && (
            <Link href="/staff/machines/qr" className="btn-secondary py-2">
              Print all QR codes
            </Link>
          )}
        </div>
        {withQr.length === 0 && <p className="mt-4 text-slate-600">No machines yet.</p>}
        <ul className="mt-4 flex flex-col divide-y divide-slate-100">
          {withQr.map((m) => (
            <li key={m.id} className="flex items-center gap-4 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.qr} alt={`QR code for ${m.name}`} className="h-20 w-20" />
              <div className="flex-1">
                <p className="font-semibold">{m.name}</p>
                <a href={`/m/${m.id}`} target="_blank" className="text-sm text-slate-500 underline">
                  Open machine page
                </a>
              </div>
              <Link href={`/staff/machines/${m.id}`} className="btn-secondary py-2">
                Edit
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
