"use client";
import { useState } from "react";
import ToolDialog from "./ToolDialog";
import { request, BusyButton } from "./ui";
const localDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export default function MeetingDialog({ recommendation: r, onClose, onSaved }) {
  const m = r.meeting;
  const [form, setForm] = useState({
    recommendationId: r.id,
    version: m?.version || 0,
    clientAvailability: m?.clientAvailability || "",
    candidateAvailability: m?.candidateAvailability || "",
    scheduledAt: localDate(m?.scheduledAt),
    durationMinutes: m?.durationMinutes || 60,
    location: m?.location || "",
    status: m?.status || "PLANNING",
    followUpAt: localDate(m?.followUpAt),
    followUpDone: m?.followUpDone || false,
    notes: m?.notes || "",
    confirmed: false,
  });
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const set = (k, v) =>
    setForm({
      ...form,
      [k]: v,
      ...(["scheduledAt", "location", "durationMinutes"].includes(k) ? { confirmed: false } : {}),
    });
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request("/api/meetings", "POST", {
        ...form,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
        followUpAt: form.followUpAt ? new Date(form.followUpAt).toISOString() : null,
        durationMinutes: Number(form.durationMinutes),
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
      title="Coordinate a meeting"
      subtitle={`${r.client.name} & ${r.profile.name}`}
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={save}>
        <div className="notice">
          Times use your device timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}. This
          is an internal plan; invitations and reminders are not sent automatically.
        </div>
        <div className="form-grid">
          <label>
            Client availability
            <textarea
              rows={3}
              maxLength={1000}
              value={form.clientAvailability}
              onChange={(e) => set("clientAvailability", e.target.value)}
              placeholder="Saturday after 4 pm"
            />
          </label>
          <label>
            Candidate availability
            <textarea
              rows={3}
              maxLength={1000}
              value={form.candidateAvailability}
              onChange={(e) => set("candidateAvailability", e.target.value)}
              placeholder="Saturday 4–7 pm"
            />
          </label>
          <label>
            Meeting time
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => set("scheduledAt", e.target.value)}
            />
          </label>
          <label>
            Duration (minutes)
            <input
              type="number"
              min={15}
              max={480}
              value={form.durationMinutes}
              onChange={(e) => set("durationMinutes", e.target.value)}
            />
          </label>
        </div>
        <label>
          Location or call link
          <input
            maxLength={300}
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Agreed café or video call link"
          />
        </label>
        <label>
          Meeting status
          <select value={form.status} onChange={(e) => set("status", e.target.value)}>
            {["PLANNING", "SCHEDULED", "COMPLETED", "CANCELLED"].map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        {["SCHEDULED", "COMPLETED"].includes(form.status) && (
          <label className="check-label">
            <input
              type="checkbox"
              checked={form.confirmed}
              onChange={(e) => set("confirmed", e.target.checked)}
            />
            Both participants confirmed this time and location.
          </label>
        )}
        <label>
          Follow-up due
          <input
            type="datetime-local"
            value={form.followUpAt}
            onChange={(e) => set("followUpAt", e.target.value)}
          />
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={form.followUpDone}
            onChange={(e) => set("followUpDone", e.target.checked)}
          />
          Follow-up completed
        </label>
        <label>
          Coordination notes
          <textarea
            rows={3}
            maxLength={3000}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </label>
        <small>
          Meeting plans are tracked separately from the introduction milestones in the match queue.
        </small>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <BusyButton className="button primary" busy={busy} type="submit">
          Save meeting plan
        </BusyButton>
      </form>
    </ToolDialog>
  );
}
