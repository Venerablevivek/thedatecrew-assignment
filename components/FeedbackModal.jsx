"use client";
import { useEffect, useRef, useState } from "react";
import { X, Sparkles, Plus, Trash2, MessageSquareText } from "lucide-react";
import { request, BusyButton, Badge } from "./ui";
import { CATEGORIES } from "@/lib/validation";
import { pretty } from "@/lib/matching";
export default function FeedbackModal({ client, match, onClose, onSaved }) {
  const dialog = useRef(null);
  const [text, setText] = useState(""),
    [result, setResult] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [edited, setEdited] = useState(false),
    [reviewed, setReviewed] = useState(false);
  useEffect(() => {
    dialog.current.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
  const blank = () => ({
    category: "OTHER",
    label: "",
    strength: "MEDIUM",
    knownPreference: false,
    evidence: "",
  });
  async function analyze() {
    setBusy(true);
    setError("");
    setResult(null);
    setReviewed(false);
    setEdited(false);
    try {
      setResult(
        await request("/api/feedback/analyze", "POST", {
          clientId: client.id,
          profileId: match.profile.id,
          feedback: text,
        }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function manual() {
    setResult({
      source: "MANUAL",
      notice: "Manual review • no AI request is required.",
      analysis: {
        decision: "REJECTED",
        summary: "Client feedback reviewed by matchmaker",
        reasons: [blank()],
        suggestPreferenceReview: true,
      },
    });
    setReviewed(false);
    setEdited(true);
  }
  function update(index, key, value) {
    setEdited(true);
    setReviewed(false);
    setResult((r) => ({
      ...r,
      analysis: {
        ...r.analysis,
        reasons: r.analysis.reasons.map((reason, i) =>
          i === index
            ? { ...reason, [key]: value, ...(key === "category" ? { knownPreference: false } : {}) }
            : reason,
        ),
      },
    }));
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      await request("/api/feedback", "POST", {
        clientId: client.id,
        profileId: match.profile.id,
        rawText: text,
        structured: result.analysis,
        source: result.source,
        wasEdited: edited,
      });
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="feedback-dialog"
      onCancel={(e) => {
        if (busy) e.preventDefault();
        else onClose();
      }}
    >
      <div className="modal-header">
        <span className="icon-tile">
          <MessageSquareText size={21} />
        </span>
        <button
          className="icon-button"
          disabled={busy}
          aria-label="Close feedback"
          onClick={onClose}
        >
          <X size={21} />
        </button>
      </div>
      <h2>Why wasn’t this profile a fit?</h2>
      <p className="muted">
        {match.profile.name} · Recommendation for {client.name.split(" ")[0]}
      </p>
      <div className="feedback-steps" aria-label="Feedback progress">
        <span className={!result ? "current" : ""}>1. Add feedback</span>
        <span className={result ? "current" : ""}>2. Review & save</span>
      </div>
      {!match.recommendation?.sharedAt && (
        <div className="notice">
          This profile has not been marked as shared. This saves an internal screening decision and
          will not count as a client rejection in the funnel.
        </div>
      )}
      <details className="feedback-source" open={!result}>
        <summary>{result ? "View or edit the original feedback" : "Client feedback"}</summary>
        <label className="field-label" htmlFor="raw-feedback">
          Feedback in their own words
        </label>
        <textarea
          autoFocus
          id="raw-feedback"
          value={text}
          disabled={busy}
          maxLength={4000}
          onChange={(e) => {
            setText(e.target.value);
            setResult(null);
            setReviewed(false);
          }}
          placeholder="Nice profile, but feels too traditional for me and Mumbai makes things difficult."
          rows={4}
        />
        <div className="spread">
          <small>{text.length}/4,000 characters</small>
          <button
            className="text-button"
            disabled={busy}
            onClick={() => {
              setText(
                "Nice profile, but feels too traditional for me and Mumbai makes things difficult.",
              );
              setResult(null);
              setReviewed(false);
            }}
          >
            Use demo example
          </button>
        </div>
      </details>
      {!result && (
        <div className="modal-actions">
          <button className="button" disabled={text.trim().length < 5 || busy} onClick={manual}>
            Categorize manually
          </button>
          <BusyButton
            busy={busy}
            disabled={text.trim().length < 5}
            className="button primary"
            onClick={analyze}
          >
            <Sparkles size={16} />
            Analyze feedback
          </BusyButton>
        </div>
      )}
      {result && (
        <div className="analysis-results">
          <div className="notice sky-notice">
            <Sparkles size={16} />
            {result.notice}
          </div>
          <h3>Review the interpretation</h3>
          <label className="field-label" htmlFor="summary">
            Summary
          </label>
          <input
            id="summary"
            value={result.analysis.summary}
            maxLength={500}
            onChange={(e) => {
              setEdited(true);
              setReviewed(false);
              setResult({ ...result, analysis: { ...result.analysis, summary: e.target.value } });
            }}
          />
          {result.analysis.reasons.map((reason, i) => (
            <fieldset className="reason-editor" key={i}>
              <legend>Reason {i + 1}</legend>
              <div className="reason-editor-top">
                <label>
                  Category
                  <select
                    aria-label={`Category ${i + 1}`}
                    value={reason.category}
                    onChange={(e) => update(i, "category", e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {pretty(c)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Strength
                  <select
                    aria-label={`Strength ${i + 1}`}
                    value={reason.strength}
                    onChange={(e) => update(i, "strength", e.target.value)}
                  >
                    {["LOW", "MEDIUM", "HIGH"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                {result.analysis.reasons.length > 1 && (
                  <button
                    className="icon-button"
                    aria-label={`Remove reason ${i + 1}`}
                    onClick={() => {
                      setEdited(true);
                      setReviewed(false);
                      setResult({
                        ...result,
                        analysis: {
                          ...result.analysis,
                          reasons: result.analysis.reasons.filter((_, index) => i !== index),
                        },
                      });
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <label>
                Interpretation
                <input
                  aria-label={`Interpretation ${i + 1}`}
                  value={reason.label}
                  maxLength={180}
                  onChange={(e) => update(i, "label", e.target.value)}
                />
              </label>
              <label>
                Supporting quote
                <input
                  aria-label={`Evidence ${i + 1}`}
                  value={reason.evidence}
                  placeholder="Exact words from the feedback (optional for manual entry)"
                  onChange={(e) => update(i, "evidence", e.target.value)}
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={reason.knownPreference}
                  onChange={(e) => update(i, "knownPreference", e.target.checked)}
                />
                Supported by a preference recorded before this recommendation
              </label>
            </fieldset>
          ))}
          <button
            className="text-button"
            disabled={result.analysis.reasons.length >= 8}
            onClick={() => {
              setEdited(true);
              setReviewed(false);
              setResult({
                ...result,
                analysis: { ...result.analysis, reasons: [...result.analysis.reasons, blank()] },
              });
            }}
          >
            <Plus size={14} />
            Add a reason
          </button>
          <label className="checkbox-label review-checkbox">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
            />
            I reviewed the interpretation against the client’s words.
          </label>
          <div className="modal-actions">
            <button className="button" disabled={busy} onClick={onClose}>
              Cancel
            </button>
            <BusyButton
              busy={busy}
              disabled={
                !reviewed ||
                !result.analysis.summary.trim() ||
                result.analysis.reasons.some((r) => !r.label.trim())
              }
              className="button primary"
              onClick={save}
            >
              Confirm & save
            </BusyButton>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <small className="modal-footnote">
        The original feedback is preserved. No preference changes automatically.
      </small>
    </dialog>
  );
}
