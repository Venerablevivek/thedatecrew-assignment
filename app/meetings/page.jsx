"use client";
import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock3, Search } from "lucide-react";
import { pretty } from "@/lib/matching";
import { useResource, PageHeader, Loading, ErrorState, Empty, Badge, Toast } from "@/components/ui";
import MeetingDialog from "@/components/MeetingDialog";
const statusTone = { SCHEDULED: "sky", COMPLETED: "green", CANCELLED: "rose" };
export default function Meetings() {
  const { data, loading, error, refresh } = useResource("/api/meetings");
  const [selected, setSelected] = useState(null),
    [filter, setFilter] = useState("all"),
    [search, setSearch] = useState(""),
    [limit, setLimit] = useState(8),
    [message, setMessage] = useState("");
  if (loading && !data) return <Loading />;
  if (error) return <ErrorState message={error} retry={refresh} />;
  if (!data) return null;
  const overdue = (r) =>
    r.meeting?.followUpAt && !r.meeting.followUpDone && new Date(r.meeting.followUpAt) < new Date();
  const rows = data.recommendations.filter(
    (r) =>
      (filter === "all" || (filter === "follow-up" ? overdue(r) : r.meeting?.status === filter)) &&
      `${r.client.name} ${r.profile.name}`.toLowerCase().includes(search.toLowerCase()),
  );
  const scheduled = data.recommendations.filter((r) => r.meeting?.status === "SCHEDULED").length,
    due = data.recommendations.filter(overdue).length;
  return (
    <>
      <PageHeader
        title="Meetings & follow-ups"
        description="Plan meetings for accepted introductions. Times use your timezone."
      >
        <div className="stat-chips">
          <span>
            <CalendarDays size={15} />
            <strong>{scheduled}</strong> scheduled
          </span>
          <span className={due ? "alert" : ""}>
            <Clock3 size={15} />
            <strong>{due}</strong> follow-ups due
          </span>
        </div>
      </PageHeader>
      <div className="list-toolbar">
        <label className="search-box">
          <Search size={16} />
          <input
            aria-label="Search meetings"
            placeholder="Find a client or candidate"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setLimit(8);
            }}
          />
        </label>
        <div className="tabs meeting-tabs">
          {[
            ["all", "All"],
            ["SCHEDULED", "Scheduled"],
            ["follow-up", "Follow-ups due"],
            ["COMPLETED", "Completed"],
            ["CANCELLED", "Cancelled"],
          ].map(([v, l]) => (
            <button
              key={v}
              className={filter === v ? "active" : ""}
              onClick={() => {
                setFilter(v);
                setLimit(8);
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="meeting-list">
        {rows.slice(0, limit).map((r) => {
          const when = r.meeting?.scheduledAt && new Date(r.meeting.scheduledAt);
          return (
            <article className="card meeting-card" key={r.id}>
              <div className="meeting-symbol">
                {when ? (
                  <>
                    <small>{when.toLocaleString([], { month: "short" })}</small>
                    <strong>{when.getDate()}</strong>
                  </>
                ) : (
                  <CalendarDays size={20} />
                )}
              </div>
              <div className="meeting-body">
                <h2>
                  {r.client.name} <span className="muted">&</span> {r.profile.name}
                </h2>
                <p>
                  {when
                    ? when.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
                    : "Not planned yet"}
                  {r.meeting?.location && (
                    <>
                      {" · "}
                      <span>{r.meeting.location}</span>
                    </>
                  )}
                </p>
                <div className="chip-row">
                  <Badge tone={statusTone[r.meeting?.status] || "neutral"}>
                    {r.meeting?.status ? pretty(r.meeting.status) : "Not planned"}
                  </Badge>
                  {overdue(r) && <Badge tone="rose">Follow-up overdue</Badge>}
                  {r.meeting?.followUpAt && !overdue(r) && (
                    <small className="muted">
                      Follow-up {new Date(r.meeting.followUpAt).toLocaleDateString()}
                      {r.meeting.followUpDone ? " · Done" : ""}
                    </small>
                  )}
                </div>
              </div>
              <button
                className={`button ${r.meeting ? "" : "primary"}`}
                disabled={loading}
                onClick={() => setSelected(r)}
              >
                {r.meeting ? "Edit plan" : "Plan meeting"}
              </button>
            </article>
          );
        })}
      </div>
      {rows.length > limit && (
        <button className="button load-more" onClick={() => setLimit((n) => n + 8)}>
          Show more ({rows.length - limit} remaining)
        </button>
      )}
      {!rows.length && (
        <Empty title="No meetings in this view">
          Record an acceptance in the{" "}
          <Link href="/match-queue" className="text-link">
            match queue
          </Link>{" "}
          to start planning.
        </Empty>
      )}
      {selected && (
        <MeetingDialog
          recommendation={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            refresh();
            setMessage("Meeting plan saved.");
          }}
        />
      )}
      <Toast message={message} />
    </>
  );
}
