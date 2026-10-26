import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Shown once after a member's first login to collect their name.
export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: rawNext } = await searchParams;
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  if (profile?.full_name) redirect(next);

  async function saveName(formData: FormData) {
    "use server";
    const fullName = String(formData.get("full_name") ?? "").trim();
    if (!fullName) return;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
    revalidatePath("/", "layout");
    redirect(next);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center p-6">
      <form action={saveName} className="card flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Welcome!</h1>
        <label className="flex flex-col gap-2">
          <span className="text-slate-600">What&apos;s your name?</span>
          <input className="input" name="full_name" autoComplete="name" required autoFocus />
        </label>
        <button className="btn">Continue</button>
      </form>
    </main>
  );
}
