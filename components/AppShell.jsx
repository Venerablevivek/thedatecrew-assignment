"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  UsersRound,
  Layers3,
  MessageSquareText,
  Sparkles,
  CircleHelp,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import AIStatus from "./AIStatus";
const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: UsersRound },
  { href: "/match-queue", label: "Match queue", icon: Layers3 },
  { href: "/meetings", label: "Meetings", icon: CalendarDays },
  { href: "/feedback", label: "Feedback", icon: MessageSquareText },
  { href: "/assistant", label: "Assistant", icon: Sparkles },
];
export default function AppShell({ children }) {
  const pathname = usePathname();
  const [mobile, setMobile] = useState(false);
  const [help, setHelp] = useState(false);
  const current = items.find((i) => pathname.startsWith(i.href));
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? "is-open" : ""}`}>
        <Link href="/dashboard" className="brand" onClick={() => setMobile(false)}>
          <span className="brand-mark">tdc</span>
          <span>
            The Date Crew<span className="brand-sub">Match Intelligence</span>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobile(false)}
              aria-current={pathname.startsWith(href) ? "page" : undefined}
              className={`nav-item ${pathname.startsWith(href) ? "active" : ""}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setHelp(true)}>
            <CircleHelp size={18} />
            How it works
          </button>
          <div className="user">
            <span className="avatar">DM</span>
            <span>
              <strong>Demo Matchmaker</strong>
              <small>Internal workspace</small>
            </span>
          </div>
        </div>
      </aside>
      {mobile && (
        <button
          className="nav-overlay"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </button>
            <strong>{current?.label || "Overview"}</strong>
          </div>
          <div className="topbar-right">
            <AIStatus />
            <span className="demo-pill">Demo data</span>
          </div>
        </header>
        <main>{children}</main>
      </div>
      {help && (
        <div className="modal-backdrop" onClick={() => setHelp(false)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="icon-button close" aria-label="Close" onClick={() => setHelp(false)}>
              <X size={20} />
            </button>
            <h2 id="about-title">How it works</h2>
            <ol className="help-steps">
              <li>
                <strong>Pick a client</strong>
                <span>Review their must-haves and preferences.</span>
              </li>
              <li>
                <strong>Review matches</strong>
                <span>Deal-breakers are checked first, then profiles are ranked.</span>
              </li>
              <li>
                <strong>Record feedback</strong>
                <span>Feedback becomes signals that you confirm or dismiss.</span>
              </li>
            </ol>
            <div className="notice">
              All people are synthetic. Scores help you rank — they don’t predict relationships.
            </div>
            <button className="button primary" onClick={() => setHelp(false)}>
              Got it
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
