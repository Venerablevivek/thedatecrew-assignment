"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import {
  useResource,
  PageHeader,
  Loading,
  ErrorState,
  SectionTitle,
  Badge,
  Empty,
} from "@/components/ui";
import { ReasonChart } from "@/components/Charts";
import { pretty } from "@/lib/matching";
export default function Feedback() {
  const { data, loading, error, refresh } = useResource("/api/dashboard");
  const [category, setCategory] = useState("ALL"),
    [search, setSearch] = useState("");
  if (loading && !data) return <Loading />;
  if (error) return <ErrorState message={error} retry={refresh} />;
  if (!data) return null;
  const entries = data.feedback.filter(
    (f) =>
      (category === "ALL" || f.structured.reasons.some((r) => r.category === category)) &&
      `${f.client.name} ${f.rawText}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        title="Learn from client feedback"
        description="Spot rejection themes and preferences worth a conversation."
      >
        <Badge tone="sky">
          {data.aiMode === "GEMINI"
            ? "Gemini categorization"
            : data.aiMode === "DEMO_RULES"
              ? "Demo rules"
              : "Manual categorization"}
        </Badge>
      </PageHeader>
      <div className="feedback-overview">
        <section className="card">
          <SectionTitle
            title="Rejection themes"
            subtitle="Updates after each confirmed decision."
          />
          <ReasonChart data={data.rejectionReasons} />
        </section>
        <section className="opportunity-card">
          <span className="eyebrow">Avoidable rejections</span>
          <div className="opportunity-number">
            {data.metrics.avoidableRejectionRate}
            <span>%</span>
          </div>
          <p>
            {data.metrics.knownRejections} of {data.metrics.rejected} client rejections referenced a
            preference we already knew.
          </p>
          <Link href="/match-queue" className="button white">
            Open match queue
            <ArrowUpRight size={16} />
          </Link>
        </section>
      </div>
      <section className="card">
        <SectionTitle title="Signals to review" subtitle="Patterns awaiting your judgment." />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Observed pattern</th>
                <th>Evidence</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.signals.slice(0, 12).map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.client.name}</strong>
                  </td>
                  <td>{s.title}</td>
                  <td>{s.evidence.count} decisions</td>
                  <td>
                    <Badge tone={s.status === "PENDING_REVIEW" ? "sky" : "neutral"}>
                      {pretty(s.status)}
                    </Badge>
                  </td>
                  <td>
                    <Link href={`/clients/${s.clientId}`} className="text-link">
                      Review
                      <ArrowUpRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card feedback-library">
        <SectionTitle title="Feedback library" subtitle="Client words and reviewed categories." />
        <div className="list-toolbar">
          <label className="search-box">
            <Search size={16} />
            <input
              aria-label="Search feedback"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients or feedback"
            />
          </label>
          <select
            aria-label="Filter feedback category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="ALL">All categories</option>
            {data.rejectionReasons.map((r) => (
              <option value={r.category} key={r.category}>
                {pretty(r.category)}
              </option>
            ))}
          </select>
        </div>
        {entries.slice(0, 30).map((f) => (
          <div className="feedback-entry" key={f.id}>
            <div className="spread">
              <strong>
                {f.client.name}
                <span className="muted"> on {f.recommendation.profile.name}</span>
              </strong>
              <small className="muted">
                {["GEMINI", "OPENAI"].includes(f.source)
                  ? "AI + human review"
                  : f.source === "DEMO_RULES"
                    ? "Demo rules + human review"
                    : "Manual review"}
              </small>
            </div>
            <blockquote>“{f.rawText}”</blockquote>
            <div className="chip-row">
              {f.structured.reasons.map((r, i) => (
                <Badge key={i} tone={r.knownPreference ? "amber" : "sky"}>
                  {pretty(r.category)}
                  {r.knownPreference ? " · Known preference" : ""}
                </Badge>
              ))}
            </div>
          </div>
        ))}
        {!entries.length && (
          <Empty title="No matching feedback">Try another category or search.</Empty>
        )}
        {entries.length > 30 && (
          <p className="caption">Showing the 30 most recent matching records.</p>
        )}
      </section>
    </>
  );
}
