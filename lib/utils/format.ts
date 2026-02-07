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

export function formatTimeHMS(ms: number): string {
  const totalSec = Math.floor(ms / 1_000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h.toString().padStart(2, '0')}:${Math.abs(m).toString().padStart(2, '0')}:${Math.abs(s).toString().padStart(2, '0')}`;
}

export function formatTimeHM(ms: number): string {
  const totalMin = Math.floor(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h.toString().padStart(2, '0')}:${Math.abs(m).toString().padStart(2, '0')}`;
}