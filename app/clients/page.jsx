"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, Sparkles, ArrowRight, UsersRound, TrendingUp, Layers3 } from "lucide-react";
import {
  useResource,
  PageHeader,
  Loading,
  ErrorState,
  Avatar,
  Badge,
  Empty,
  shade,
} from "@/components/ui";
const since = (date) => {
  if (!date) return "No activity yet";
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  return days <= 0 ? "Active today" : days === 1 ? "Active yesterday" : `Active ${days} days ago`;
};
const sorters = {
  attention: (a, b) => b.pendingSignals - a.pendingSignals || a.name.localeCompare(b.name),
  acceptance: (a, b) => b.acceptanceRate - a.acceptanceRate,
  recent: (a, b) => new Date(b.lastActivity || 0) - new Date(a.lastActivity || 0),
  name: (a, b) => a.name.localeCompare(b.name),
};
export default function Clients() {
  const { data, loading, error, refresh } = useResource("/api/clients");
  const [search, setSearch] = useState(""),
    [onlyReview, setOnlyReview] = useState(false),
    [sort, setSort] = useState("attention"),
    [owner, setOwner] = useState("all");
  const input = useRef(null);
  // "/" jumps to search, like most productivity tools.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  if (loading && !data) return <Loading />;
  if (error) return <ErrorState message={error} retry={refresh} />;
  const all = (data?.clients || []).map((c) => ({
    ...c,
    owner: c.matchmaker.name.split(" · ")[0],
    lastActivity: c.recommendations.reduce(
      (latest, r) => (!latest || new Date(r.updatedAt) > new Date(latest) ? r.updatedAt : latest),
      null,
    ),
  }));
  const owners = [...new Set(all.map((c) => c.owner))];
  const toReview = all.filter((c) => c.pendingSignals > 0).length;
  const totalSignals = all.reduce((n, c) => n + c.pendingSignals, 0);
  const totalRecs = all.reduce((n, c) => n + c.recommendations.length, 0);
  const avgAcceptance = all.length
    ? Math.round((all.reduce((n, c) => n + c.acceptanceRate, 0) / all.length) * 10) / 10
    : 0;
  const clients = all
    .filter(
      (c) =>
        (!onlyReview || c.pendingSignals > 0) &&
        (owner === "all" || c.owner === owner) &&
        `${c.name} ${c.city} ${c.occupation}`.toLowerCase().includes(search.toLowerCase()),
    )
    .sort(sorters[sort]);
  return (
    <>
      <PageHeader title="Clients" description="Everyone you’re matching, and who needs you next.">
        <Link href="/match-queue" className="button primary">
          Open match queue
          <ArrowRight size={15} />
        </Link>
      </PageHeader>
      <div className="summary-strip">
        {[
          [UsersRound, all.length, "Active clients"],
          [TrendingUp, `${avgAcceptance}%`, "Avg. acceptance"],
          [Sparkles, totalSignals, "Signals to review"],
          [Layers3, totalRecs, "Recommendations"],
        ].map(([Icon, value, label]) => (
          <div key={label}>
            <Icon size={16} />
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="list-toolbar">
        <label className="search-box">
          <Search size={16} />
          <input
            ref={input}
            aria-label="Search clients"
            placeholder="Search name, city or profession"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <kbd>/</kbd>
        </label>
        <div className="segmented">
          <button className={!onlyReview ? "selected" : ""} onClick={() => setOnlyReview(false)}>
            All
          </button>
          <button className={onlyReview ? "selected" : ""} onClick={() => setOnlyReview(true)}>
            Needs review <span className="count">{toReview}</span>
          </button>
        </div>
        <div className="toolbar-actions">
          <select
            aria-label="Filter by matchmaker"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          >
            <option value="all">All matchmakers</option>
            {owners.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <select aria-label="Sort clients" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="attention">Needs attention</option>
            <option value="recent">Recently active</option>
            <option value="acceptance">Acceptance rate</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>
      <div className="client-grid">
        {clients.map((c, i) => {
          const hard = c.preferences.filter((p) => p.type === "HARD").length;
          return (
            <article className="card client-card glass" style={shade(i)} key={c.id}>
              <div className="client-card-head">
                <Avatar name={c.name} index={i} large />
                <div>
                  <h2>
                    <Link href={`/clients/${c.id}`} className="stretched">
                      {c.name}
                    </Link>
                  </h2>
                  <p>
                    {c.age} · {c.occupation}
                  </p>
                  <p className="muted">{c.city}</p>
                </div>
                {c.pendingSignals > 0 ? (
                  <Badge tone="sky">
                    <Sparkles size={12} />
                    {c.pendingSignals} to review
                  </Badge>
                ) : (
                  <Badge tone="green">Up to date</Badge>
                )}
              </div>
              <div className="client-acceptance">
                <div className="spread">
                  <span>Acceptance</span>
                  <strong>{c.acceptanceRate}%</strong>
                </div>
                <div className="acceptance-track">
                  <div style={{ width: `${Math.min(100, c.acceptanceRate)}%` }} />
                </div>
              </div>
              <div className="client-facts">
                <span>
                  <strong>{c.recommendations.length}</strong> recommendations
                </span>
                <span>
                  <strong>{hard}</strong> must-haves ·{" "}
                  <strong>{c.preferences.length - hard}</strong> nice-to-haves
                </span>
              </div>
              <div className="client-card-foot">
                <small className="muted">
                  {c.owner} · {since(c.lastActivity)}
                </small>
                <Link href={`/match-queue?clientId=${c.id}`} className="text-link raised">
                  Find matches
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      {!clients.length && <Empty title="No clients found">Try a different name or filter.</Empty>}
    </>
  );
}
