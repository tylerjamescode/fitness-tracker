import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
      <div className="card text-center">
        <h1 className="text-2xl font-bold">Fitness Incentive</h1>
        <p className="mt-1 text-slate-600">Workout Tracker</p>
        <p className="mt-6 text-lg">
          Scan the QR code on any machine to see your last workout and log today&apos;s sets.
        </p>
        {user ? (
          <form action={signOut} className="mt-6">
            <p className="text-sm text-slate-500">You&apos;re logged in.</p>
            <button className="mt-2 text-sm text-slate-500 underline">Log out</button>
          </form>
        ) : (
          <Link href="/login" className="btn mt-6 w-full">
            Log in or sign up
          </Link>
        )}
      </div>
      <Link href="/staff" className="text-center text-sm text-slate-500 underline">
        Staff
      </Link>
    </main>
  );
}
