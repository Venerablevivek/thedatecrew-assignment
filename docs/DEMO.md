# Three-minute demo script

Start with a freshly seeded database. The app is at http://127.0.0.1:3000 locally. Use the actual hosted URL after deployment.

## 0:00–0:25 — Diagnose

Open Overview on Assessment baseline.

“The scenario reports 31% profile acceptance. The stronger clue is that 35% of explicit rejections reference preferences the team already had. I chose one intervention: improve recommendations before sharing them. I have kept unaccepted and rejected distinct.”

## 0:25–0:55 — Understand the person

Open Clients → Ananya Sharma.

“Strict requirements exclude profiles; soft preferences guide ranking. The location signal is based on three of the last five accepted profiles being outside Delhi NCR. It asks for review and does not change a preference.”

## 0:55–1:30 — Explain the decision

Open Match queue. Expand a score breakdown, then open Conflicts & unknowns.

“The ranking is deterministic. A missing smoking answer cannot silently pass. A known conflict cannot be shared even through the API. The score is an explainable ordering, not romantic certainty.”

## 1:30–2:15 — Close the feedback loop

Return to Eligible queue. Search Mumbai, pick an unshared profile and click Mark shared. Switch to Decision history; find that same profile and click Reject. Use the demo example and Analyze feedback.

“Language is where AI helps: convert this text into a controlled, editable schema. The current local demo uses a clearly labeled rule-based fallback because no API key is configured. The same endpoint supports live Gemini 2.5 Flash structured output. The user can also categorize manually if AI fails.”

Review Lifestyle and Location, supporting excerpts, and known-preference flags. Check the review confirmation and save.

## 2:15–2:45 — Human approval

Open Ananya again. The third lifestyle rejection has created a new repeated-feedback signal. On the location signal, choose Confirm signal.

“The review action is recorded, but the preference still has not changed. Applying flexibility is a second explicit step, after confirming with the client. Hard requirements remain enforced.”

## 2:45–3:10 — Measure

Return to Overview → Live demo, or Feedback intelligence.

“The new shared profile and confirmed rejection update real database metrics. I would evaluate known-preference rejection share, profile acceptance, and search time in a pilot, with completed meetings and recommendation coverage as guardrails.”

## Submission checklist

- Written response: `docs/ASSESSMENT.md` and `output/pdf/TDC-Assessment.pdf`.
- Prototype evidence: `docs/screenshots/` (accepted by the original brief).
- Working public URL: add after Vercel deployment; localhost is not public.
- Code URL: create/push the GitHub repository and insert its real URL.
- Resume: attach your updated resume.
- Optional narration: record this 3-minute journey, accurately identifying AI mode.
- Do not claim measured business uplift, live Gemini verification, or production readiness.

No submission email has been sent by the development workflow.
