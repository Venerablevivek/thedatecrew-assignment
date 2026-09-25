"use client";
import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  AlertTriangle,
  Bookmark,
  ArrowUpRight,
  Send,
  X,
} from "lucide-react";
import { Avatar, Badge, BusyButton, shade, statusTone } from "./ui";
import { reciprocalCheck } from "@/lib/match-tools";
import Link from "next/link";
import { pretty, WEIGHTS } from "@/lib/matching";
import { freshness } from "@/lib/freshness";
export default function CandidateCard({
  match,
  index,
  onAction,
  onReject,
  busy,
  client,
  compared,
  compareDisabled,
  onCompare,
  onTool,
  onConfirm,
}) {
  const [details, setDetails] = useState(false);
  const p = match.profile,
    status = match.recommendation?.status;
  const reciprocal = client ? reciprocalCheck(client, p) : null;
  const fresh = freshness(p.lastConfirmedAt);
  const next = {
    SHARED: ["ACCEPTED", "Record acceptance"],
    ACCEPTED: ["CONTACT_SHARED", "Mark contacts shared"],
    CONTACT_SHARED: ["CONVERSATION_STARTED", "Mark conversation started"],
    CONVERSATION_STARTED: ["MEETING_FIXED", "Mark meeting fixed"],
    MEETING_FIXED: ["MEETING_COMPLETED", "Mark meeting completed"],
  }[status];
  return (
    <article
      className={`card candidate-card glass soft ${!match.eligible ? "ineligible" : ""} ${compared ? "is-compared" : ""}`}
      style={shade(index)}
    >
      <div className="candidate-header">
        <Avatar name={p.name} index={index} large />
        <div className="candidate-name">
          <h2>{p.name}</h2>
          <p>
            {p.age} · {p.occupation} · {p.city}
          </p>
          <span
            className={`freshness ${fresh.status.toLowerCase()}`}
            title={
              p.lastConfirmedAt
                ? `Last confirmed ${new Date(p.lastConfirmedAt).toLocaleDateString()}`
                : "No confirmation recorded"
            }
          >
            <i />
            {fresh.label}
            {fresh.status === "STALE" && " · may be out of date"}
          </span>
        </div>
        {match.eligible ? (
          <div className="score" style={{ "--score": match.score }}>
            <div className="score-ring">
              <strong>{match.score}</strong>
            </div>
            <Badge tone={match.score >= 85 ? "green" : "sky"}>{match.label}</Badge>
          </div>
        ) : (
          <Badge tone={match.status === "BLOCKED" ? "rose" : "amber"}>{match.label}</Badge>
        )}
      </div>
      <div className={`eligibility ${match.eligible ? "pass" : "fail"}`}>
        {match.eligible ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
        <span>{match.eligible ? "Meets all must-haves" : match.warnings.join(" · ")}</span>
        {status && <Badge tone={statusTone(status)}>{pretty(status)}</Badge>}
      </div>
      {match.eligible && (
        <>
          <p className="candidate-why">{match.explanation}</p>
          {match.warnings.length > 0 && (
            <div className="candidate-warning">
              <AlertTriangle size={14} />
              <span>{match.warnings[0]}</span>
            </div>
          )}
          <button
            className="breakdown-toggle"
            onClick={() => setDetails(!details)}
            aria-expanded={details}
          >
            How this score was calculated
            {details ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {details && (
            <div className="score-breakdown">
              <div className="chip-row">
                {match.matched.slice(0, 5).map((t) => (
                  <span className="match-chip" key={t}>
                    <Check size={12} />
                    {t}
                  </span>
                ))}
              </div>
              {Object.entries(match.breakdown).map(([key, value]) => (
                <div className="breakdown-row" key={key}>
                  <span>{pretty(key)}</span>
                  <div className="score-track">
                    <div style={{ width: `${(value / WEIGHTS[key]) * 100}%` }} />
                  </div>
                  <strong>
                    {value}
                    <small>/{WEIGHTS[key]}</small>
                  </strong>
                </div>
              ))}
              <p>{match.historyNote}</p>
              <p>A transparent ranking aid, not a probability of compatibility.</p>
            </div>
          )}
        </>
      )}
      {reciprocal?.status === "CONFLICT" && (
        <p className="candidate-warning">
          <AlertTriangle size={14} />
          Two-sided requirements conflict. Review before sharing.
        </p>
      )}
      {onTool && (
        <div className="candidate-tools">
          <label className="check-label">
            <input
              type="checkbox"
              checked={compared}
              disabled={compareDisabled || busy}
              onChange={onCompare}
            />
            Compare<span className="sr-only"> {p.name}</span>
          </label>
          <button className="text-link" disabled={busy} onClick={() => onTool("compatibility")}>
            Two-sided: {pretty(reciprocal.status)}
          </button>
          {match.eligible && (
            <button
              className="text-link"
              disabled={busy || reciprocal.status === "CONFLICT"}
              onClick={() => onTool("draft")}
            >
              Draft introduction
            </button>
          )}
          {onConfirm && fresh.status !== "FRESH" && (
            <button className="text-link" disabled={busy} onClick={onConfirm}>
              Re-confirm profile
            </button>
          )}
          {match.recommendation?.acceptedAt && (
            <Link href="/meetings" className="text-link">
              Coordinate meeting
            </Link>
          )}
        </div>
      )}
      <div className="candidate-actions">
        {status === "REJECTED" ? (
          <Badge tone="rose">Feedback recorded</Badge>
        ) : status === "MEETING_COMPLETED" ? (
          <Badge tone="green">
            <Check size={13} />
            Meeting completed
          </Badge>
        ) : (
          <>
            {!match.recommendation?.acceptedAt && (
              <button className="button subtle" disabled={busy} onClick={onReject}>
                <X size={15} />
                Reject
              </button>
            )}
            <div className="candidate-primary-actions">
              {match.eligible && (!status || status === "SUGGESTED") && (
                <BusyButton className="button" busy={busy} onClick={() => onAction("SHORTLISTED")}>
                  <Bookmark size={14} />
                  Shortlist
                </BusyButton>
              )}
              {match.eligible && (!status || ["SUGGESTED", "SHORTLISTED"].includes(status)) && (
                <BusyButton
                  className="button primary"
                  busy={busy}
                  disabled={busy || reciprocal?.status === "CONFLICT"}
                  onClick={() => onAction("SHARED")}
                >
                  <Send size={14} />
                  Mark shared
                </BusyButton>
              )}
              {next && (
                <BusyButton
                  className="button primary"
                  busy={busy}
                  onClick={() => onAction(next[0])}
                >
                  {next[1]}
                  <ArrowUpRight size={14} />
                </BusyButton>
              )}
            </div>
          </>
        )}
      </div>
    </article>
  );
}
