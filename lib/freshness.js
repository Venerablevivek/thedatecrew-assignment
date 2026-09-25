// How recently a matchmaker confirmed a profile is current and the person is open to introductions.
export const FRESH_DAYS = 30;
export const STALE_DAYS = 90;
const DAY = 86400000;
export function freshness(lastConfirmedAt, now = Date.now()) {
  if (!lastConfirmedAt) return { status: "UNKNOWN", days: null, label: "Not confirmed yet" };
  const days = Math.max(0, Math.floor((now - new Date(lastConfirmedAt).getTime()) / DAY));
  const status = days > STALE_DAYS ? "STALE" : days > FRESH_DAYS ? "AGING" : "FRESH";
  const ago = days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
  return { status, days, label: `Confirmed ${ago}` };
}
export const isStale = (profile, now) =>
  freshness(profile?.lastConfirmedAt, now).status === "STALE";
