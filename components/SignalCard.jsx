"use client";
import { useState } from "react";
import { Sparkles, ShieldCheck } from "lucide-react";
import { request, BusyButton, Badge } from "./ui";
export default function SignalCard({ signal, onChange }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState(false);
  async function act(status) {
    setBusy(true);
    setError("");
    try {
      await request(`/api/signals/${signal.id}`, "PATCH", { status });
      onChange();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function apply() {
    setBusy(true);
    setError("");
    try {
      await request(`/api/signals/${signal.id}/apply`, "POST", { confirmedWithClient: true });
      onChange();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="signal-card">
      <div className="spread">
        <span className="signal-kicker">
          <Sparkles size={13} />
          {signal.type === "PREFERENCE_CONTRADICTION" ? "Possible blind spot" : "Pattern"}
        </span>
        <Badge tone={signal.status === "PENDING_REVIEW" ? "sky" : "neutral"}>
          {signal.appliedAt
            ? "Applied"
            : signal.status === "PENDING_REVIEW"
              ? "Review"
              : signal.status.toLowerCase()}
        </Badge>
      </div>
      <h3>{signal.title}</h3>
      <p>{signal.description}</p>
      <div className="signal-evidence">
        <strong>
          {signal.evidence.count}
          {signal.evidence.total
            ? ` of ${signal.evidence.total} accepted profiles`
            : ` reviewed decisions`}
        </strong>
        {signal.evidence.cities && <small>{signal.evidence.cities.join(" · ")}</small>}
      </div>
      {signal.status === "PENDING_REVIEW" ? (
        <div className="signal-actions">
          <BusyButton busy={busy} className="button compact" onClick={() => act("DISMISSED")}>
            Keep current preference
          </BusyButton>
          <BusyButton
            busy={busy}
            className="button primary compact"
            onClick={() => act("CONFIRMED")}
          >
            Confirm signal
          </BusyButton>
        </div>
      ) : signal.status === "CONFIRMED" &&
        !signal.appliedAt &&
        signal.type === "PREFERENCE_CONTRADICTION" ? (
        <div className="apply-box">
          <p>Confirming the signal has not changed the preference.</p>
          <label className="check-label">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
            />
            I confirmed location flexibility with the client.
          </label>
          <BusyButton
            busy={busy}
            disabled={!confirm}
            className="button primary compact"
            onClick={apply}
          >
            Apply flexible location
          </BusyButton>
          <small>Lowers location weight from 1 to 0.25. Must-haves stay intact.</small>
        </div>
      ) : (
        <small className="signal-status">
          <ShieldCheck size={14} />
          {signal.appliedAt
            ? "Location flexibility applied by a human."
            : "Preference unchanged. Review recorded."}
        </small>
      )}
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
    </article>
  );
}
