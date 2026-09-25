"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCheck, Clock3, ShieldCheck, TrendingUp, Info } from "lucide-react";
import {
  useResource,
  PageHeader,
  Loading,
  ErrorState,
  MetricCard,
  SectionTitle,
} from "@/components/ui";
import { Funnel, ReasonChart } from "@/components/Charts";
export default function Dashboard() {
  const { data, loading, error, refresh } = useResource("/api/dashboard");
  const [mode, setMode] = useState("scenario");
  if (loading && !data) return <Loading />;
  if (error) return <ErrorState message={error} retry={refresh} />;
  if (!data) return null;
  const scenario = mode === "scenario",
    m = data.metrics;
  const counts = [1000, 310, 210, 150, 75, 42];
  const funnel = scenario
    ? data.funnel.map((f, i) => ({
        ...f,
        value: counts[i],
        conversion: i ? Math.round((counts[i] / counts[i - 1]) * 1000) / 10 : 100,
      }))
    : data.funnel;
  const pendingSignals = data.signals.filter((s) => s.status === "PENDING_REVIEW").length;
  return (
    <>
      <PageHeader
        title="Your matchmaking overview"
        description="How introductions are performing, and where to act next."
      >
        <div className="segmented" aria-label="Dashboard dataset">
          <button className={scenario ? "selected" : ""} onClick={() => setMode("scenario")}>
            Assessment baseline
          </button>
          <button className={!scenario ? "selected" : ""} onClick={() => setMode("live")}>
            Live demo
          </button>
        </div>
      </PageHeader>
      <p className="caption dataset-caption">
        <span className="status-dot" />
        {scenario
          ? "Provided scenario · fixed reference"
          : "Recorded decisions · updates as you work"}
      </p>
      <div className="metrics-grid">
        <MetricCard
          title="Profile acceptance"
          value={scenario ? "31.0%" : `${m.acceptanceRate}%`}
          detail={
            scenario ? "310 of 1,000 shared" : `${m.profilesAccepted} of ${m.profilesShared} shared`
          }
          icon={TrendingUp}
          index={0}
        />
        <MetricCard
          title="Avoidable rejections"
          value={scenario ? "35%" : `${m.avoidableRejectionRate}%`}
          detail={
            scenario
              ? "Conflicted with a known preference"
              : `${m.knownRejections} of ${m.rejected} rejections`
          }
          icon={ShieldCheck}
          index={1}
          tone="warn"
        />
        <MetricCard
          title="Search time"
          value={scenario ? "2" : "—"}
          suffix={scenario ? "hrs" : ""}
          detail={scenario ? "Per client, per week" : "Not tracked in this prototype"}
          icon={Clock3}
          index={2}
          tone="navy"
        />
        <MetricCard
          title="Meetings completed"
          value={scenario ? "42" : m.meetingsCompleted}
          detail={scenario ? "56% of 75 meetings fixed" : "From the last 30 days"}
          icon={CheckCheck}
          index={3}
          tone="green"
        />
      </div>
      <div className="dashboard-main">
        <section className="card">
          <SectionTitle title="Introduction funnel" subtitle="From shared profile to meeting." />
          <Funnel data={funnel} />
          <p className="card-foot">
            <Info size={14} />
            {scenario
              ? "Pending responses aren’t necessarily rejections."
              : `${m.pending} shared profiles are awaiting a decision.`}
          </p>
        </section>
        <aside className="opportunity-card">
          <span className="eyebrow">The opportunity</span>
          <div className="opportunity-number">
            35<span>%</span>
          </div>
          <p>of rejected profiles conflicted with preferences we already knew.</p>
          <Link href="/match-queue?clientId=ananya" className="button white">
            Review match queue
            <ArrowRight size={16} />
          </Link>
          {pendingSignals > 0 && (
            <Link href="/feedback" className="opportunity-link">
              {pendingSignals} preference signal{pendingSignals === 1 ? "" : "s"} to review
              <ArrowRight size={14} />
            </Link>
          )}
        </aside>
      </div>
      <div className="dashboard-bottom">
        <section className="card">
          <SectionTitle title="Why profiles get rejected" link="All feedback" href="/feedback" />
          <ReasonChart data={data.rejectionReasons} />
        </section>
        <section className="card">
          <SectionTitle
            title="Acceptance by matchmaker"
            subtitle={scenario ? "From the assessment." : "Profiles shared in this demo."}
          />
          <div className="matchmaker-bars">
            {data.matchmakers.map((mm, i) => {
              const value = scenario ? [44, 21][i] : mm.acceptanceRate;
              return (
                <div key={mm.id}>
                  <div className="spread">
                    <span>{mm.name}</span>
                    <strong>{value}%</strong>
                  </div>
                  <div className="team-track">
                    <div className={i ? "alt" : ""} style={{ width: `${value}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="card-foot">
            <Info size={14} />
            Client mix and sample size can explain differences.
          </p>
        </section>
      </div>
    </>
  );
}
