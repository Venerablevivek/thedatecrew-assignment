# 2-Day Implementation Plan

## Goal

Ship a credible end-to-end prototype in two focused days.

The priority is **working product logic**, not production polish.

---

# Day 1 — Data, Matching, Core UI

## Block 1 — Project setup

Timebox: first work block.

Create:

```bash
npx create-next-app@latest tdc-match-intelligence --js --tailwind --eslint --app
```

Install:

```bash
npm install prisma@7 @prisma/client@7
npm install openai zod recharts lucide-react clsx date-fns
```

Set up:

```text
PostgreSQL
Prisma
.env
App layout
Sidebar
```

Definition of done:

- project runs,
- DB connects,
- migrations run.

## Block 2 — Schema + seed

Build:

```text
Matchmaker
Client
ClientPreference
CandidateProfile
Recommendation
Feedback
PreferenceSignal
```

Seed:

```text
2 matchmakers
8 clients
60 candidate profiles
100+ recommendations
30+ feedback examples
```

The seed must intentionally include:

- 44% vs 21% matchmaker acceptance difference,
- known-preference rejections,
- one obvious preference contradiction.

Definition of done:

- Prisma Studio shows useful data,
- dashboard can query it.

## Block 3 — Matching engine

Implement:

```text
lib/matching.js
```

Functions:

```js
checkEligibility(client, candidate)
scoreCandidate(client, candidate, history)
rankCandidates(client, candidates, history)
buildScoreBreakdown(...)
```

Do not use AI yet.

Definition of done:

- hard deal-breakers reliably exclude candidates,
- eligible candidates are sorted,
- score breakdown is understandable.

## Block 4 — Dashboard UI

Build:

```text
/dashboard
```

Components:

```text
MetricCard
FunnelChart
RejectionReasonsChart
MatchmakerComparison
InsightCard
```

Use scenario numbers from the assessment prominently.

Definition of done:

- reviewer immediately sees where the funnel problem is.

## Block 5 — Client Intelligence

Build:

```text
/clients/[id]
```

Display:

- profile summary,
- hard preferences,
- soft preferences,
- recent recommendations,
- learned signals.

Definition of done:

- at least one contradiction card is visible.

---

# Day 2 — AI Loop, Match Queue, Demo Polish

## Block 6 — Match Queue UI

Build:

```text
/match-queue
```

Features:

- choose client,
- show only eligible candidates,
- score breakdown,
- explanation,
- shortlist,
- reject.

Definition of done:

- matchmaker can understand why the top candidate is ranked first.

## Block 7 — AI Feedback Analyzer

Build:

```text
POST /api/feedback/analyze
```

Add modal:

```text
FeedbackModal
```

Flow:

```text
free text
→ analyze
→ show structured categories
→ edit
→ confirm
→ save
```

Definition of done:

- rejected profile creates structured feedback.

## Block 8 — Preference signal loop

After feedback save:

```text
recalculate client signals
```

Implement only 2 signal types:

1. repeated rejection reason,
2. stated-vs-observed contradiction.

Definition of done:

- saving feedback can create a pending signal.

## Block 9 — Feedback Intelligence

Build:

```text
/feedback
```

Show:

- rejection reason chart,
- avoidable rejection rate,
- repeated signal table.

This page can be compact.

## Block 10 — Polish

Check:

- loading states,
- empty states,
- spacing,
- consistent badges,
- no broken links,
- no horizontal overflow,
- mobile doesn't collapse completely,
- seed reset works.

## Block 11 — Deploy + demo

Deploy:

```text
Vercel
PostgreSQL
```

Record a 2–4 minute screen recording.

---

# Must-have priority

## P0 — Must work

```text
✓ Dashboard metrics
✓ Client preferences
✓ Hard filter
✓ Candidate ranking
✓ Score breakdown
✓ Free-text feedback analyzer
✓ Structured feedback
✓ Preference signal
```

## P1 — Nice if time remains

```text
○ AI-written match explanation
○ client selector/search
○ charts with hover tooltips
○ filter by rejection reason
○ preference edit action
```

## P2 — Do not build unless everything else is complete

```text
○ preference parser
○ real email integration
○ authentication
○ vector search
○ embeddings
○ collaborative filtering
```

---

# Scope protection rules

If behind schedule:

1. keep one polished client journey,
2. keep 20 candidates instead of 100,
3. use static dashboard numbers if analytics queries take too long,
4. keep AI only for feedback parsing,
5. drop optional AI explanation,
6. do not add authentication.

A working end-to-end story is more valuable than many half-finished screens.

---

# Final testing scenarios

## Scenario 1 — Known deal-breaker

Client:

```text
Smoking: Strict No
```

Candidate:

```text
Smoking: Yes
```

Expected:

```text
Candidate is excluded.
Reason is shown.
```

## Scenario 2 — Strong candidate

Candidate passes hard rules and scores highly.

Expected:

```text
Score: ~85+
Strong fit
Clear score breakdown
```

## Scenario 3 — Unstructured rejection

Input:

```text
"Nice person, but too traditional for me and Mumbai makes it difficult."
```

Expected:

```text
Lifestyle → Traditional lifestyle
Location → Geographic mismatch
```

## Scenario 4 — Preference contradiction

Client originally says:

```text
Delhi preferred
```

History shows:

```text
3/5 accepted candidates outside Delhi
```

Expected:

```text
Pending signal:
"Location may be more flexible than stated."
```

---

# Submission checklist

```text
[ ] Public working URL
[ ] GitHub repository
[ ] README with setup
[ ] Assessment PDF/Doc
[ ] 2–4 minute demo video
[ ] Updated resume
[ ] AI usage statement
[ ] No real personal data
[ ] Seed script included
[ ] .env.example included
```
