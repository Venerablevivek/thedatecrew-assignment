"use client";
import { useEffect, useState, useCallback } from "react";
import { AlertCircle, ChevronRight, LoaderCircle, CheckCircle2, Inbox } from "lucide-react";
import Link from "next/link";
export async function request(url, method = "GET", payload) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });
  let result;
  try {
    result = await res.json();
  } catch {
    throw new Error("The server did not return a valid response. Please try again.");
  }
  if (!result.ok) throw new Error(result.error?.message || "Request failed");
  return result.data;
}
export function useResource(url) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((n) => n + 1), []);
  useEffect(() => {
    if (!url) return;
    let alive = true;
    setLoading(true);
    setError("");
    request(url)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [url, version]);
  return { data, error, loading, refresh };
}
export function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="header-actions">{children}</div>}
    </div>
  );
}
export function Loading() {
  return (
    <div aria-label="Loading workspace" className="skeleton-grid">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div className="skeleton" key={i} />
      ))}
    </div>
  );
}
export function ErrorState({ message, retry }) {
  return (
    <div role="alert" className="empty">
      <AlertCircle />
      <h2>We couldn’t load this view</h2>
      <p>{message}</p>
      <button className="button" onClick={retry}>
        Try again
      </button>
    </div>
  );
}
export function Empty({ title = "Nothing here yet", children }) {
  return (
    <div className="empty">
      <Inbox size={24} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function Badge({ children, tone = "neutral" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Avatar({ name, index = 0, large = false }) {
  return (
    <span className={`avatar ${large ? "large" : ""} tone-${index % 4}`}>
      {name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")}
    </span>
  );
}
export function SectionTitle({ title, subtitle, link, href }) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {link && (
        <Link href={href} className="text-link">
          {link}
          <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}
// Soft two-colour glass shades; each card gets its own pair by index.
const SHADES = [
  ["#00bfff", "#7dd3fc"],
  ["#34d399", "#00bfff"],
  ["#f9a8d4", "#a5b4fc"],
  ["#fcd34d", "#fb923c"],
  ["#a78bfa", "#00bfff"],
  ["#5eead4", "#a3e635"],
  ["#fda4af", "#fdba74"],
  ["#93c5fd", "#c4b5fd"],
];
export function shade(index = 0) {
  const [c1, c2] = SHADES[index % SHADES.length];
  return { "--c1": c1, "--c2": c2 };
}
// One tone per recommendation status, so a status reads the same everywhere.
export function statusTone(status) {
  if (status === "REJECTED") return "rose";
  if (status === "SHARED") return "sky";
  if (!status || status === "SUGGESTED") return "neutral";
  return "green";
}
export function MetricCard({ title, value, detail, icon: Icon, tone = "sky", suffix, index = 0 }) {
  return (
    <div className="metric-card glass" style={shade(index)}>
      <div className="metric-top">
        <span className={`metric-icon ${tone}`}>
          <Icon size={16} />
        </span>
        <span>{title}</span>
      </div>
      <div className="metric-number">
        {value}
        <span>{suffix}</span>
      </div>
      <p>{detail}</p>
    </div>
  );
}
export function BusyButton({ busy, children, ...props }) {
  return (
    <button {...props} disabled={busy || props.disabled}>
      {busy ? <LoaderCircle size={16} className="spin" /> : null}
      {children}
    </button>
  );
}
export function Toast({ message }) {
  return message ? (
    <div className="toast" role="status">
      <CheckCircle2 size={16} />
      {message}
    </div>
  ) : null;
}
