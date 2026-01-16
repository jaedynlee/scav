/**
 * Format a duration in milliseconds as "X hr Y min Z sec" (omitting zero parts).
 * Examples: "45 min 30 sec", "1 hr 23 min 45 sec", "30 sec"
 */
export function formatElapsedMs(ms: number): string {
  const totalSec = Math.floor(ms / 1_000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} hr`);
  if (m > 0) parts.push(`${m} min`);
  parts.push(`${s} sec`);
  return parts.join(" ");
}
