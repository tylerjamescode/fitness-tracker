import QRCode from "qrcode";
import { requireStaff } from "@/lib/auth";
import { getSiteUrl } from "@/lib/site-url";
import PrintButton from "./PrintButton";

// A printable sheet: one QR code card per machine. Cut them out and stick them on the machines.
export default async function QrSheetPage() {
  const { supabase } = await requireStaff();
  const { data: machines } = await supabase.from("machines").select("id, name").order("name");

  const siteUrl = await getSiteUrl();
  const cards = await Promise.all(
    (machines ?? []).map(async (m) => ({
      ...m,
      qr: await QRCode.toDataURL(`${siteUrl}/m/${m.id}`, { margin: 1, width: 600 }),
    })),
  );

  return (
    <main>
      <div className="no-print mb-4 flex items-center justify-between">
        <p className="text-slate-600">
          QR codes point to <strong>{siteUrl}</strong>. Print this page, then cut out each card.
        </p>
        <PrintButton />
      </div>
      <div className="grid grid-cols-2 gap-4 bg-white sm:grid-cols-3">
        {cards.map((m) => (
          <div
            key={m.id}
            className="flex break-inside-avoid flex-col items-center rounded-xl border-2 border-dashed border-slate-300 p-4 text-center"
          >
            <p className="text-lg font-bold">{m.name}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.qr} alt={`QR code for ${m.name}`} className="my-2 w-full max-w-[200px]" />
            <p className="text-sm">Scan to log your workout</p>
            <p className="text-xs text-slate-500">Fitness Incentive</p>
          </div>
        ))}
      </div>
    </main>
  );
}
