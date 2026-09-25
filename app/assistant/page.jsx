"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowUpRight,
  Send,
  ShieldCheck,
  SearchCheck,
  ListChecks,
  MessageSquareText,
  RotateCcw,
  LoaderCircle,
} from "lucide-react";
import {
  useResource,
  request,
  PageHeader,
  Loading,
  ErrorState,
  Badge,
  Avatar,
} from "@/components/ui";
const tasks = [
  {
    mode: "brief",
    label: "Prepare my client brief",
    description: "Know the priorities before you start.",
    icon: ListChecks,
  },
  {
    mode: "matches",
    label: "Who should I review next?",
    description: "Find suitable, unintroduced profiles.",
    icon: SearchCheck,
  },
  {
    mode: "gaps",
    label: "What needs clarification?",
    description: "Spot unknowns before an introduction.",
    icon: ShieldCheck,
  },
  {
    mode: "feedback",
    label: "What have we learned?",
    description: "Review the client’s recent feedback.",
    icon: MessageSquareText,
  },
];
function Answer({ answer }) {
  return (
    <article className="assistant-answer">
      <div className="assistant-answer-label">
        <Sparkles size={16} />
        <span>{answer.source === "GEMINI" ? "Gemini assistant" : "Guided assistant"}</span>
        <small>
          {new Date(answer.generatedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </small>
      </div>
      <h2>{answer.title}</h2>
      <p className="caption">{answer.notice}</p>
      <div className="answer-points">
        {answer.points.map((point, i) => (
          <section key={i}>
            <p>{point.text}</p>
            <details>
              <summary>View supporting records ({point.evidenceIds.length})</summary>
              {point.evidenceIds.map((id) => {
                const e = answer.evidence.find((e) => e.id === id);
                return e ? (
                  <div className="assistant-evidence" key={id}>
                    <Link href={e.href}>
                      {e.label}
                      <ArrowUpRight size={12} />
                    </Link>
                    <p>{e.text}</p>
                  </div>
                ) : null;
              })}
            </details>
          </section>
        ))}
      </div>
      {!!answer.candidates.length && (
        <div className="assistant-candidates">
          {answer.candidates.map((c, i) => (
            <Link href={c.href} className="assistant-profile" key={c.id}>
              <div className="spread">
                <Avatar name={c.name} index={i} />
                <Badge>{c.score}/100</Badge>
              </div>
              <h3>{c.name}</h3>
              <p>
                {c.age} · {c.city}
              </p>
              <small>{c.matched.join(" · ")}</small>
              <span className="assistant-open-question">
                {c.reciprocal === "ALIGNED"
                  ? "Recorded requirements align"
                  : "Two-sided information needs clarification"}
              </span>
              {c.warnings.length > 0 && <small>{c.warnings[0]}</small>}
              <strong>
                Review profile <ArrowUpRight size={14} />
              </strong>
            </Link>
          ))}
        </div>
      )}
      <Link href={answer.action.href} className="button">
        {answer.action.label}
        <ArrowUpRight size={14} />
      </Link>
      <p className="assistant-followup">Consider next: {answer.followUp}</p>
    </article>
  );
}
function Conversation({ context }) {
  const [turns, setTurns] = useState([]),
    [question, setQuestion] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [failed, setFailed] = useState(null);
  const inFlight = useRef(false),
    alive = useRef(true),
    reply = useRef(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  async function send(mode, text, guided = false) {
    if (inFlight.current || !text.trim()) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    setFailed(null);
    try {
      const answer = await request("/api/assistant", "POST", {
        clientId: context.client.id,
        mode,
        question: text,
        history: turns.slice(-6).map((t) => ({ question: t.question })),
        guided,
      });
      if (!alive.current) return;
      setTurns((old) => [...old, { question: text, answer }].slice(-12));
      setQuestion("");
      // Focus the beginning of the new response, not the end of a long answer.
      requestAnimationFrame(() => reply.current?.focus({ preventScroll: true }));
    } catch (e) {
      if (alive.current) {
        setError(e.message);
        setFailed({ mode, text });
      }
    } finally {
      inFlight.current = false;
      if (alive.current) setBusy(false);
    }
  }
  return (
    <div className="assistant-layout">
      <section className="assistant-chat" aria-label="Matchmaker conversation">
        <div className="assistant-chat-top">
          <div>
            <span className={`provider-pill ${context.configured ? "ready" : ""}`}>
              <Sparkles size={13} />
              {context.configured ? "Gemini" : "Guided mode"}
            </span>
            <small>Read-only · you decide what happens next</small>
          </div>
          <button
            className="button subtle"
            disabled={busy || !turns.length}
            onClick={() => {
              setTurns([]);
              setError("");
              setFailed(null);
            }}
          >
            <RotateCcw size={14} />
            Clear chat
          </button>
        </div>
        {!turns.length && (
          <div className="assistant-welcome">
            <div className="assistant-orb">
              <Sparkles size={24} />
            </div>
            <h2>How can I help with {context.client.name.split(" ")[0]}?</h2>
            <p>Pick a task or ask a question. Every answer links to its source records.</p>
          </div>
        )}
        <div className={`assistant-prompts ${turns.length ? "compact" : ""}`}>
          {tasks.map(({ mode, label, description, icon: Icon }) => (
            <button key={mode} disabled={busy} onClick={() => send(mode, label)}>
              <Icon size={18} />
              <div>
                <strong>{label}</strong>
                <small>{description}</small>
              </div>
            </button>
          ))}
        </div>
        <div className="assistant-transcript" aria-label="Conversation history">
          {turns.map((turn, i) => (
            <div className="assistant-turn" key={i}>
              <div className="assistant-question">{turn.question}</div>
              <div tabIndex={-1} ref={i === turns.length - 1 ? reply : null}>
                <Answer answer={turn.answer} />
              </div>
            </div>
          ))}
        </div>
        <div role="status" className="assistant-live-status">
          {busy ? (
            <>
              <LoaderCircle size={16} className="spin" />
              Reviewing the current client records…
            </>
          ) : turns.length ? (
            "Answer ready. Supporting records are available below each point."
          ) : (
            ""
          )}
        </div>
        {error && (
          <div className="notice error-text" role="alert">
            <p>{error}</p>
            <div className="chip-row">
              <button className="button" onClick={() => send(failed.mode, failed.text)}>
                Retry
              </button>
              <button
                className="button"
                onClick={() =>
                  send(
                    failed.mode === "question" ? "brief" : failed.mode,
                    failed.mode === "question" ? "Prepare my client brief" : failed.text,
                    true,
                  )
                }
              >
                Use guided summary
              </button>
            </div>
          </div>
        )}
        <form
          className="assistant-composer"
          onSubmit={(e) => {
            e.preventDefault();
            send("question", question);
          }}
        >
          <label htmlFor="assistant-question">Ask about this client</label>
          <div>
            <textarea
              id="assistant-question"
              rows={2}
              maxLength={1200}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={
                context.configured
                  ? "For example: why does location affect this shortlist?"
                  : "Add a Gemini key for free-form questions, or use a guided task above."
              }
            />
            <button className="button primary" disabled={busy || !question.trim()} type="submit">
              <Send size={16} />
              <span>Ask</span>
            </button>
          </div>
          <small>{question.length}/1200 · Switching clients clears the chat.</small>
        </form>
      </section>
      <aside className="assistant-context">
        <section className="card">
          <div className="assistant-client">
            <Avatar name={context.client.name} />
            <div>
              <h2>{context.client.name}</h2>
              <p>
                {context.client.age || "Age unknown"} · {context.client.city || "City unknown"}
              </p>
            </div>
          </div>
          <div className="assistant-stats">
            <div>
              <strong>{context.counts.available}</strong>
              <small>To review</small>
            </div>
            <div>
              <strong>{context.counts.hard}</strong>
              <small>Hard requirements</small>
            </div>
          </div>
          <details open>
            <summary>Priorities</summary>
            {context.preferences.map((p, i) => (
              <p className="assistant-priority" key={i}>
                {p.label}
              </p>
            ))}
          </details>
          <Link href={`/clients/${encodeURIComponent(context.client.id)}`} className="text-link">
            Client profile <ArrowUpRight size={14} />
          </Link>
        </section>
        <p className="assistant-boundaries">
          <ShieldCheck size={15} />
          Can’t send introductions or change preferences.
        </p>
      </aside>
    </div>
  );
}
export default function Assistant() {
  const clients = useResource("/api/clients"),
    [clientId, setClientId] = useState("ananya");
  const resource = useResource(`/api/assistant?clientId=${encodeURIComponent(clientId)}`);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("clientId");
    if (id) setClientId(id);
  }, []);
  return (
    <>
      <PageHeader
        title="Your matchmaking assistant"
        description="Evidence-backed answers about a client’s preferences, matches and feedback."
      >
        <label className="field-inline">
          <span>Client</span>
          <select
            aria-label="Assistant client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            {clients.data?.clients.map((c) => (
              <option value={c.id} key={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </PageHeader>
      {resource.error ? (
        <ErrorState message={resource.error} retry={resource.refresh} />
      ) : !resource.data || resource.data.client.id !== clientId ? (
        <Loading />
      ) : (
        <Conversation key={clientId} context={resource.data} />
      )}
    </>
  );
}
