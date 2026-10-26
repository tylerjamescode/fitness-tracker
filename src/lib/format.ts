export type WorkoutSet = { set_number: number; weight: number; reps: number };

export type WorkoutSession = {
  id: string;
  performed_at: string;
  workout_sets: WorkoutSet[];
};

const TIME_ZONE = "America/New_York";

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function daysAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export function sortedSets(sets: WorkoutSet[]) {
  return [...sets].sort((a, b) => a.set_number - b.set_number);
}

// Turns "(555) 123-4567" into "+15551234567". Assumes US numbers unless a + is given.
export function normalizePhone(input: string) {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export function formatPhone(phone: string | null) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  const local = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (local.length !== 10) return phone;
  return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
}
