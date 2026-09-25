"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, SlidersHorizontal, Search, Info } from "lucide-react";
import {
  useResource,
  PageHeader,
  Loading,
  ErrorState,
  request,
  Toast,
  Empty,
} from "@/components/ui";
import {
  CompareDialog,
  WhatIfDialog,
  IntroductionDialog,
  CompatibilityDialog,
  StaleProfileDialog,
} from "@/components/MatchTools";
import { isStale } from "@/lib/freshness";
import CandidateCard from "@/components/CandidateCard";
import FeedbackModal from "@/components/FeedbackModal";
export default function MatchQueue() {
  const [compareIds, setCompareIds] = useState([]),
    [tool, setTool] = useState(null);
  const [clientId, setClientId] = useState("ananya"),
    [filter, setFilter] = useState("eligible"),
    [sort, setSort] = useState("score"),
    [limit, setLimit] = useState(8),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState(null),
    [busyId, setBusyId] = useState(null),
    [message, setMessage] = useState(""),
    [actionError, setActionError] = useState(""),
    [staleMatch, setStaleMatch] = useState(null);
  const clients = useResource("/api/clients"),
    resource = useResource(`/api/match-queue?clientId=${clientId}`);
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("clientId");
    if (value) setClientId(value);
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const profileId = params.get("profileId");
    if (!profileId || !resource.data || resource.data.client.id !== clientId) return;
    const match = resource.data.matches.find((m) => m.profile.id === profileId);
    if (!match) return;
    setSearch(match.profile.name);
    setFilter(
      match.recommendation && match.recommendation.status !== "SHORTLISTED"
        ? "history"
        : match.eligible
          ? "eligible"
          : "review",
    );
  }, [resource.data, clientId]);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 4500);
    return () => clearTimeout(t);
  }, [message]);
  async function action(match, action, { acknowledgeStale = false } = {}) {
    // Warn before introducing someone whose details may no longer be current.
    if (action === "SHARED" && !acknowledgeStale && isStale(match.profile)) {
      setStaleMatch(match);
      return;
    }
    setBusyId(match.profile.id);
    setActionError("");
    try {
      await request("/api/recommendations", "POST", {
        clientId,
        profileId: match.profile.id,
        action,
        ...(acknowledgeStale ? { acknowledgeStale: true } : {}),
      });
      setMessage(
        action === "SHARED"
          ? "Marked as shared. No email was sent."
          : "Decision saved. The client history is up to date.",
      );
      resource.refresh();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setBusyId(null);
    }
  }
  async function confirmProfile(match, { thenShare = false } = {}) {
    setBusyId(match.profile.id);
    setActionError("");
    try {
      await request(`/api/profiles/${encodeURIComponent(match.profile.id)}/confirm`, "POST");
      if (thenShare) {
        await action(match, "SHARED", { acknowledgeStale: true });
        return;
      }
      setMessage(`${match.profile.name}’s profile re-confirmed today.`);
      resource.refresh();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setBusyId(null);
    }
  }
  const { data, loading, error, refresh } = resource;
  if ((loading && !data) || (data && data.client.id !== clientId))
    return error ? <ErrorState message={error} retry={refresh} /> : <Loading />;
  if (error) return <ErrorState message={error} retry={refresh} />;
  if (!data) return null;
  const all = data.matches,
    available = all.filter((m) => !m.recommendation || m.recommendation.status === "SHORTLISTED"),
    eligible = available.filter((m) => m.eligible),
    blocked = available.filter((m) => !m.eligible);
  let shown =
    filter === "eligible"
      ? eligible
      : filter === "review"
        ? blocked
        : all.filter((m) => m.recommendation);
  shown = shown.filter((m) =>
    `${m.profile.name} ${m.profile.city} ${m.profile.occupation}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  if (sort === "name")
    shown = [...shown].sort((a, b) => a.profile.name.localeCompare(b.profile.name));
  if (sort === "fresh")
    shown = [...shown].sort(
      (a, b) => new Date(b.profile.lastConfirmedAt || 0) - new Date(a.profile.lastConfirmedAt || 0),
    );
  return (
    <>
      <PageHeader
        title="Find the next introduction"
        description="Must-haves are checked first. You make the final call."
      >
        <Link href={`/assistant?clientId=${encodeURIComponent(clientId)}`} className="button">
          <Sparkles size={15} />
          Ask assistant
        </Link>
      </PageHeader>
      <div className="queue-toolbar">
        <label className="field-inline">
          <span>Matching for</span>
          <select
            aria-label="Matching for"
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setCompareIds([]);
              setTool(null);
              setLimit(8);
              setActionError("");
            }}
          >
            {clients.data?.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="search-box">
          <Search size={16} />
          <input
            aria-label="Search candidate profiles"
            placeholder="Search name, city or profession"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setLimit(8);
            }}
          />
        </label>
        <label className="field-inline">
          <span>Sort</span>
          <select aria-label="Sort matches" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="score">Best match</option>
            <option value="fresh">Recently confirmed</option>
            <option value="name">Name</option>
          </select>
        </label>
        <div className="toolbar-actions">
          <button className="button" onClick={() => setTool({ type: "preview" })}>
            <SlidersHorizontal size={15} />
            What-if preview
          </button>
          <button
            className="button primary"
            disabled={compareIds.length < 2}
            title="Tick two or three profiles to compare"
            onClick={() => setTool({ type: "compare" })}
          >
            Compare profiles ({compareIds.length}/3)
          </button>
          {compareIds.length > 0 && (
            <button className="text-link" onClick={() => setCompareIds([])}>
              Clear
            </button>
          )}
        </div>
      </div>
      <div className="tabs-row">
        <div className="tabs queue-tabs">
          {[
            ["eligible", "Eligible queue", eligible.length],
            ["review", "Conflicts & unknowns", blocked.length],
            ["history", "Decision history", all.filter((m) => m.recommendation).length],
          ].map(([key, label, count]) => (
            <button
              key={key}
              className={filter === key ? "active" : ""}
              onClick={() => {
                setFilter(key);
                setLimit(8);
              }}
            >
              {label}
              <span>{count}</span>
            </button>
          ))}
        </div>
        <details className="ranking-help">
          <summary>
            <Info size={14} />
            How ranking works
          </summary>
          <div className="popover">
            <div className="weight-list">
              {[
                ["Soft preferences", 45],
                ["Values & lifestyle", 25],
                ["Reviewed history", 20],
                ["Profile completeness", 10],
              ].map(([label, weight]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{weight}%</strong>
                </div>
              ))}
            </div>
            <small>
              Transparent starting weights, not a trained model. Checked {all.length} profiles.
            </small>
          </div>
        </details>
      </div>
      {actionError && (
        <div className="notice error-text" role="alert">
          {actionError}
        </div>
      )}
      <div className={`candidate-list ${loading ? "is-refreshing" : ""}`}>
        {shown.slice(0, limit).map((m, i) => (
          <CandidateCard
            key={m.profile.id}
            match={m}
            client={data.client}
            compared={compareIds.includes(m.profile.id)}
            compareDisabled={!compareIds.includes(m.profile.id) && compareIds.length >= 3}
            onCompare={() =>
              setCompareIds((ids) =>
                ids.includes(m.profile.id)
                  ? ids.filter((id) => id !== m.profile.id)
                  : [...ids, m.profile.id].slice(0, 3),
              )
            }
            onTool={(type) => setTool({ type, match: m })}
            index={i}
            busy={busyId === m.profile.id || loading}
            onAction={(a) => action(m, a)}
            onReject={() => setSelected(m)}
            onConfirm={() => confirmProfile(m)}
          />
        ))}
      </div>
      {!shown.length && (
        <Empty title="All clear here">Choose another view or client to continue.</Empty>
      )}
      {shown.length > limit && (
        <button className="button load-more" onClick={() => setLimit((n) => n + 8)}>
          Show more ({shown.length - limit} remaining)
        </button>
      )}
      {selected && (
        <FeedbackModal
          client={data.client}
          match={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            refresh();
            setMessage("Feedback saved. Preference signals have been recalculated.");
          }}
        />
      )}
      {staleMatch && (
        <StaleProfileDialog
          match={staleMatch}
          onClose={() => setStaleMatch(null)}
          onReconfirm={() => {
            const m = staleMatch;
            setStaleMatch(null);
            confirmProfile(m, { thenShare: true });
          }}
          onShareAnyway={() => {
            const m = staleMatch;
            setStaleMatch(null);
            action(m, "SHARED", { acknowledgeStale: true });
          }}
        />
      )}
      {tool?.type === "compare" && (
        <CompareDialog
          client={data.client}
          matches={all.filter((m) => compareIds.includes(m.profile.id))}
          onClose={() => setTool(null)}
        />
      )}
      {tool?.type === "preview" && (
        <WhatIfDialog client={data.client} matches={all} onClose={() => setTool(null)} />
      )}
      {tool?.type === "draft" && (
        <IntroductionDialog client={data.client} match={tool.match} onClose={() => setTool(null)} />
      )}
      {tool?.type === "compatibility" && (
        <CompatibilityDialog
          client={data.client}
          match={tool.match}
          onClose={() => setTool(null)}
          onSaved={() => {
            setTool(null);
            refresh();
            setMessage("Verified information saved. Two-sided checks updated.");
          }}
        />
      )}
      <Toast message={message} />
    </>
  );
}
