/** Shared display formatters used across pages. */

/** Format a number as AUD currency. Renders an em dash for null/undefined. */
export function money(n: number | string | null | undefined): string {
  if (n == null || n === "") return "—";
  return Number(n).toLocaleString(undefined, { style: "currency", currency: "AUD" });
}

/** Format a duration in seconds as mm:ss. */
export function fmtClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
