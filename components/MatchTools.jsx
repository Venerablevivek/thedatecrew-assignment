"use client";
import { useState } from "react";
import AIStatus from "./AIStatus";
import ToolDialog from "./ToolDialog";
import { request, BusyButton, Badge } from "./ui";
import { pretty, preferenceLabel, preferenceMatch } from "@/lib/matching";
import { reciprocalCheck, simulateMatches } from "@/lib/match-tools";
import { freshness, STALE_DAYS } from "@/lib/freshness";
export function CompareDialog({ client, matches, onClose }) {
  const rows = [
    ["Age", (m) => m.profile.age],
    ["City", (m) => m.profile.city],
    ["Occupation", (m) => m.profile.occupation || "Unknown"],
    ["Ranking score", (m) => (m.score === null ? "Not eligible" : `${m.score}/100`)],
    ["Client requirements", (m) => (m.eligible ? "Pass" : m.warnings.join("; "))],
    ["Two-sided check", (m) => pretty(reciprocalCheck(client, m.profile).status)],
    ["Profile freshness", (m) => freshness(m.profile.lastConfirmedAt).label],
    ...client.preferences.map((p) => [
      preferenceLabel(p),
      (m) => {
        const fit = preferenceMatch(p, m.profile);
        return `${p.type === "HARD" ? "Required" : "Preferred"} · ${fit === null ? "Unknown" : fit ? "Matches" : "Does not match"}`;
      },
    ]),
    ["Open questions", (m) => m.warnings.join("; ") || "None in recorded preferences"],
  ];
  return (
    <ToolDialog
      title="Compare your possibilities"
      subtitle="The same criteria, side by side. Scores are ranking aids, not probabilities."
      onClose={onClose}
      wide
    >
      <div
        className="comparison-scroll"
        tabIndex={0}
        aria-label="Profile comparison, scroll horizontally"
      >
        <table className="comparison-table">
          <thead>
            <tr>
              <th scope="col">Criteria</th>
              {matches.map((m) => (
                <th scope="col" key={m.profile.id}>
                  {m.profile.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, value], i) => (
              <tr key={i}>
                <th scope="row">{label}</th>
                {matches.map((m) => (
                  <td key={m.profile.id}>{value(m)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ToolDialog>
  );
}
export function WhatIfDialog({ client, matches, onClose }) {
  const [weights, setWeights] = useState({});
  const ranked = simulateMatches(
    client,
    matches.map((m) => m.profile),
    weights,
    client.recommendations,
  );
  const original = matches.filter((m) => m.eligible),
    preview = ranked.filter((m) => m.eligible);
  const changed = preview.filter((m, i) => original[i]?.profile.id !== m.profile.id).length;
  return (
    <ToolDialog
      title="What if priorities changed?"
      subtitle="Simulation only · saved preferences and hard requirements stay unchanged."
      onClose={onClose}
      wide
    >
      <div className="simulation-layout">
        <section>
          <h3>Soft preference importance</h3>
          <p className="muted">
            Adjust importance from 0 (ignore) to 2 (strong). Eligibility stays the same because
            deal-breakers are locked.
          </p>
          {client.preferences
            .filter((p) => p.type === "SOFT")
            .map((p) => (
              <label className="slider-field" key={p.id}>
                <span>
                  {preferenceLabel(p)}
                  <strong>{weights[p.id] ?? p.weight}×</strong>
                </span>
                <input
                  type="range"
                  aria-label={`Importance: ${preferenceLabel(p)}`}
                  min="0"
                  max="2"
                  step="0.05"
                  value={weights[p.id] ?? p.weight}
                  onChange={(e) => setWeights({ ...weights, [p.id]: Number(e.target.value) })}
                />
              </label>
            ))}
          {!client.preferences.some((p) => p.type === "SOFT") && (
            <p>No soft preferences recorded.</p>
          )}
          <button className="button" onClick={() => setWeights({})}>
            Reset preview
          </button>
          <details className="tool-details">
            <summary>Locked hard requirements</summary>
            {client.preferences
              .filter((p) => p.type === "HARD")
              .map((p) => (
                <p key={p.id}>{preferenceLabel(p)}</p>
              ))}
          </details>
        </section>
        <section>
          <div className="notice">
            {preview.length} eligible profiles · {changed} ranking positions changed
          </div>
          <h3>Preview ranking</h3>
          {preview.slice(0, 8).map((m, i) => {
            const old = original.findIndex((o) => o.profile.id === m.profile.id);
            return (
              <div className="preview-row" key={m.profile.id}>
                <span className="preview-rank">{i + 1}</span>
                <div>
                  <strong>{m.profile.name}</strong>
                  <small>
                    Previously #{old + 1} · {m.profile.city}
                  </small>
                </div>
                <Badge>
                  {matches.find((o) => o.profile.id === m.profile.id).score} → {m.score}
                </Badge>
              </div>
            );
          })}
          <p className="caption">
            Full eligible pool recalculated; top eight shown. Close to discard the simulation.
          </p>
        </section>
      </div>
    </ToolDialog>
  );
}
export function IntroductionDialog({ client, match, onClose }) {
  const [result, setResult] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [reviewed, setReviewed] = useState(false),
    [copied, setCopied] = useState(false);
  async function generate() {
    setBusy(true);
    setError("");
    setReviewed(false);
    setCopied(false);
    try {
      setResult(
        await request("/api/introductions", "POST", {
          clientId: client.id,
          profileId: match.profile.id,
        }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <ToolDialog
      title={`Introduce ${match.profile.name}`}
      subtitle={`Draft for ${client.name}. Review, edit, then copy when ready.`}
      onClose={onClose}
    >
      <AIStatus />
      <p className="muted">
        An introduction should open a conversation, without promising compatibility or mutual
        interest.
      </p>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      {!result ? (
        <BusyButton className="button primary" busy={busy} onClick={generate}>
          Generate introduction draft
        </BusyButton>
      ) : (
        <div className="form-stack">
          <div className="notice">{result.notice}</div>
          <label>
            Subject
            <input
              value={result.subject}
              onChange={(e) => {
                setResult({ ...result, subject: e.target.value });
                setReviewed(false);
                setCopied(false);
              }}
            />
          </label>
          <label>
            Introduction
            <textarea
              rows={9}
              value={result.message}
              onChange={(e) => {
                setResult({ ...result, message: e.target.value });
                setReviewed(false);
                setCopied(false);
              }}
            />
          </label>
          <details className="tool-details" open>
            <summary>Profile facts to verify against</summary>
            <ul>
              {result.facts.map((f) => (
                <li key={f.id}>{f.text}</li>
              ))}
            </ul>
          </details>
          <label className="check-label">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
            />
            I checked the draft against the recorded facts.
          </label>
          <button
            className="button primary"
            disabled={!reviewed || !result.message.trim()}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(`${result.subject}\n\n${result.message}`);
                setCopied(true);
              } catch {
                setError("Clipboard unavailable. Select and copy the reviewed text manually.");
              }
            }}
          >
            {copied ? "Copied to clipboard" : "Copy reviewed draft"}
          </button>
          <small>No message is sent and no introduction is marked shared.</small>
        </div>
      )}
    </ToolDialog>
  );
}
const choices = [
  ["UNKNOWN", "Not recorded"],
  ["YES", "Yes"],
  ["NO", "No"],
];
function SelectField({ label, value, onChange, options = choices }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
export function CompatibilityDialog({ client, match, onClose, onSaved }) {
  const profile = match.profile,
    record = profile.partnerRequirements,
    prefs = record?.preferences || [],
    value = (k) => prefs.find((p) => p.key === k)?.value;
  const [form, setForm] = useState({
    minAge: value("age_range")?.min ?? "",
    maxAge: value("age_range")?.max ?? "",
    cities: value("location")?.cities.join(", ") || "",
    smoking: value("smoking") ? (value("smoking").allowed ? "YES" : "NO") : "UNKNOWN",
    children: value("children")?.desired || "UNKNOWN",
    intent: value("relationshipIntent")?.desired || "UNKNOWN",
    openToIntroductions: record?.openToIntroductions || "UNKNOWN",
    clientSmoking: client.facts?.smoking || "UNKNOWN",
    clientChildren: client.facts?.children || "UNKNOWN",
    clientIntent: client.facts?.relationshipIntent || "UNKNOWN",
  });
  const [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const check = reciprocalCheck(client, profile),
    set = (key, v) => {
      setForm({ ...form, [key]: v });
      setConfirmed(false);
    };
  const intent = [
    ["UNKNOWN", "Not recorded"],
    ["MARRIAGE", "Marriage"],
    ["LONG_TERM", "Long-term relationship"],
  ];
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request("/api/compatibility", "POST", {
        ...form,
        clientId: client.id,
        profileId: profile.id,
        minAge: form.minAge === "" ? null : Number(form.minAge),
        maxAge: form.maxAge === "" ? null : Number(form.maxAge),
        cities: form.cities
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        confirmed,
      });
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <ToolDialog
      title="Two-sided compatibility"
      subtitle={`${client.name} ↔ ${profile.name} · based on recorded requirements, not predicted chemistry.`}
      onClose={onClose}
    >
      <div className="notice">
        <strong>{pretty(check.status)}</strong>
        <p>
          Client → candidate:{" "}
          {check.forward.status === "ELIGIBLE"
            ? "Hard requirements met"
            : check.forward.status === "BLOCKED"
              ? "Known conflict"
              : "Missing required information"}
          .
        </p>
        <p>
          Candidate → client:{" "}
          {check.rows.length
            ? check.rows
                .map(
                  (r) =>
                    `${r.label}: ${r.match === null ? "unknown" : r.match ? "matches" : "conflict"}`,
                )
                .join(" · ")
            : "Requirements not yet recorded."}
        </p>
        {check.unknowns.map((t) => (
          <p key={t}>{t}</p>
        ))}
        {check.unavailable && <p>Candidate is not open to introductions.</p>}
      </div>
      <form className="form-stack" onSubmit={save}>
        <h3>Record candidate requirements</h3>
        <p className="muted">
          Use confirmed information only. Empty fields remain unknown. Candidate requirements apply
          across clients.
        </p>
        <div className="form-grid">
          <label>
            Minimum partner age
            <input
              type="number"
              min={18}
              max={100}
              value={form.minAge}
              onChange={(e) => set("minAge", e.target.value)}
            />
          </label>
          <label>
            Maximum partner age
            <input
              type="number"
              min={18}
              max={100}
              value={form.maxAge}
              onChange={(e) => set("maxAge", e.target.value)}
            />
          </label>
        </div>
        <label>
          Preferred partner cities (comma-separated)
          <input
            value={form.cities}
            onChange={(e) => set("cities", e.target.value)}
            placeholder="Delhi NCR, Mumbai"
          />
        </label>
        <div className="form-grid">
          <SelectField
            label="Partner smoking requirement"
            value={form.smoking}
            onChange={(v) => set("smoking", v)}
            options={[
              ["UNKNOWN", "Not recorded"],
              ["NO", "Non-smoker"],
              ["YES", "Smoker"],
            ]}
          />
          <SelectField
            label="Partner wants children"
            value={form.children}
            onChange={(v) => set("children", v)}
          />
          <SelectField
            label="Partner relationship intent"
            value={form.intent}
            options={intent}
            onChange={(v) => set("intent", v)}
          />
          <SelectField
            label="Open to introductions"
            value={form.openToIntroductions}
            onChange={(v) => set("openToIntroductions", v)}
          />
        </div>
        <h3>{client.name}’s own facts</h3>
        <p className="muted">These describe the client. Their partner preferences are separate.</p>
        <div className="form-grid">
          <SelectField
            label="Client smokes"
            value={form.clientSmoking}
            onChange={(v) => set("clientSmoking", v)}
          />
          <SelectField
            label="Client wants children"
            value={form.clientChildren}
            onChange={(v) => set("clientChildren", v)}
          />
          <SelectField
            label="Client relationship intent"
            value={form.clientIntent}
            options={intent}
            onChange={(v) => set("clientIntent", v)}
          />
        </div>
        <label className="check-label">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          I verified the recorded information with the relevant people.
        </label>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <BusyButton className="button primary" busy={busy} disabled={!confirmed} type="submit">
          Save verified information
        </BusyButton>
        {check.reviewedAt && (
          <small>Last reviewed {new Date(check.reviewedAt).toLocaleDateString()}</small>
        )}
      </form>
    </ToolDialog>
  );
}
export function StaleProfileDialog({ match, onClose, onReconfirm, onShareAnyway }) {
  const fresh = freshness(match.profile.lastConfirmedAt);
  const [checked, setChecked] = useState(false);
  return (
    <ToolDialog
      title="This profile may be out of date"
      subtitle={`${match.profile.name} was last confirmed ${fresh.days} days ago.`}
      onClose={onClose}
    >
      <div className="notice warn-notice">
        Profiles not confirmed in the last {STALE_DAYS} days may have a new city, job or
        relationship status, or the person may no longer be open to introductions.
      </div>
      <ul className="stale-checklist">
        <li>Still single and open to introductions</li>
        <li>City and occupation are unchanged</li>
        <li>Partner requirements still apply</li>
      </ul>
      <label className="check-label">
        <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />I
        confirmed these details with {match.profile.name.split(" ")[0]} recently.
      </label>
      <div className="modal-actions">
        <button className="button subtle-plain" onClick={onShareAnyway}>
          Share without confirming
        </button>
        <button className="button primary" disabled={!checked} onClick={onReconfirm}>
          Re-confirm &amp; mark shared
        </button>
      </div>
    </ToolDialog>
  );
}
