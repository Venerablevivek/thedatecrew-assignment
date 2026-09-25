"use client";
import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, LockKeyhole, Sparkles } from "lucide-react";
import {
  useResource,
  Loading,
  ErrorState,
  Avatar,
  Badge,
  SectionTitle,
  Empty,
  statusTone,
} from "@/components/ui";
import { preferenceLabel, pretty } from "@/lib/matching";
import SignalCard from "@/components/SignalCard";
export default function ClientPage({ params }) {
  const { id } = use(params);
  const { data, loading, error, refresh } = useResource(`/api/clients/${id}`);
  const [tab, setTab] = useState("Intelligence");
  if (loading && !data) return <Loading />;
  if (error) return <ErrorState message={error} retry={refresh} />;
  if (!data) return null;
  const c = data.client;
  return (
    <>
      <Link href="/clients" className="back-link">
        <ArrowLeft size={15} />
        All clients
      </Link>
      <div className="client-heading">
        <Avatar name={c.name} large />
        <div>
          <h1>{c.name}</h1>
          <p>
            {c.age} · {c.occupation} · {c.city}
          </p>
          <p className="client-meta">
            <span className="status-dot" />
            Managed by {c.matchmaker.name.split(" · ")[0]}
          </p>
        </div>
        <div className="header-actions">
          <Link href={`/assistant?clientId=${c.id}`} className="button">
            <Sparkles size={15} />
            Ask assistant
          </Link>
          <Link href={`/match-queue?clientId=${c.id}`} className="button primary">
            Find matches
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
      <div className="tabs">
        {["Intelligence", "Recommendations", "Feedback"].map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t}
            {t === "Feedback" && <span>{c.feedback.length}</span>}
          </button>
        ))}
      </div>
      {tab === "Intelligence" ? (
        <div className="intelligence-grid">
          <div className="stack">
            <section className="card">
              <SectionTitle title="Must-haves" subtitle="Every recommendation must meet these." />
              <div className="preference-list">
                {c.preferences
                  .filter((p) => p.type === "HARD")
                  .map((p) => (
                    <div className="preference-row" key={p.id}>
                      <span className="preference-icon">
                        <LockKeyhole size={15} />
                      </span>
                      <strong>{preferenceLabel(p)}</strong>
                      <Badge>Strict</Badge>
                    </div>
                  ))}
              </div>
            </section>
            <section className="card">
              <SectionTitle title="Nice-to-haves" subtitle="These guide ranking, never exclude." />
              <div className="preference-list">
                {c.preferences
                  .filter((p) => p.type === "SOFT")
                  .map((p) => (
                    <div className="preference-row" key={p.id}>
                      <span className="preference-icon soft">
                        <Sparkles size={15} />
                      </span>
                      <div>
                        <strong>{preferenceLabel(p)}</strong>
                        <small>
                          {p.source === "HUMAN_CONFIRMED"
                            ? "Updated after human confirmation"
                            : "Client-stated preference"}
                        </small>
                      </div>
                      <Badge tone={p.weight < 0.5 ? "neutral" : "sky"}>
                        {p.weight < 0.5 ? "Flexible" : "High priority"}
                      </Badge>
                    </div>
                  ))}
              </div>
            </section>
            <section className="card">
              <SectionTitle
                title="Recent introductions"
                link="Match queue"
                href={`/match-queue?clientId=${id}`}
              />
              <RecommendationTable records={c.recommendations.slice(0, 5)} />
            </section>
          </div>
          <aside className="stack">
            <SectionTitle title="Signals" subtitle="Patterns from feedback, for you to confirm." />
            {c.signals.map((s) => (
              <SignalCard key={s.id} signal={s} onChange={refresh} />
            ))}
            {!c.signals.length && (
              <Empty title="Still getting to know this client">
                Signals appear when enough reviewed decisions support a pattern.
              </Empty>
            )}
          </aside>
        </div>
      ) : tab === "Recommendations" ? (
        <section className="card">
          <SectionTitle title="Recommendation history" />
          <RecommendationTable records={c.recommendations} />
        </section>
      ) : (
        <section className="card">
          <SectionTitle title="Feedback in their words" />
          {c.feedback.map((f) => (
            <div className="feedback-entry" key={f.id}>
              <blockquote>“{f.rawText}”</blockquote>
              <div className="chip-row">
                {f.structured.reasons.map((r, i) => (
                  <Badge key={i} tone="sky">
                    {pretty(r.category)} · {r.label}
                  </Badge>
                ))}
              </div>
              <small className="muted">
                {["GEMINI", "OPENAI"].includes(f.source)
                  ? "AI draft reviewed"
                  : f.source === "DEMO_RULES"
                    ? "Demo rule draft reviewed"
                    : "Manually reviewed"}
              </small>
            </div>
          ))}
          {!c.feedback.length && <Empty title="No feedback yet" />}
        </section>
      )}
    </>
  );
}
function RecommendationTable({ records }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Profile</th>
            <th>Location</th>
            <th>Latest outcome</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id}>
              <td>
                <strong>{r.profile.name}</strong>
                <small>
                  {r.profile.age} · {r.profile.occupation}
                </small>
              </td>
              <td>{r.profile.city}</td>
              <td>
                <Badge tone={r.acceptedAt ? "green" : statusTone(r.status)}>
                  {pretty(r.status)}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
