import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { signOut } from "@/app/actions";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  await requireStaff();

  return (
    <div className="mx-auto min-h-dvh max-w-5xl p-4">
      <nav className="no-print mb-6 flex flex-wrap items-center gap-4 rounded-2xl bg-slate-900 px-5 py-3 text-white">
        <span className="font-bold">Fitness Incentive Staff</span>
        <Link href="/staff" className="hover:underline">
          Dashboard
        </Link>
        <Link href="/staff/members" className="hover:underline">
          Members
        </Link>
        <Link href="/staff/machines" className="hover:underline">
          Machines
        </Link>
        <form action={signOut} className="ml-auto">
          <button className="text-sm text-slate-300 hover:underline">Log out</button>
        </form>
      </nav>
      {children}
    </div>
  );
}
