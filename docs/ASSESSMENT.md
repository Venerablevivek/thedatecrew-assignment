# TDC Match Intelligence

An internal, human-reviewed workspace for more thoughtful recommendations.

## Part 1 — Diagnose the problem

**Question 1: Why do known preference conflicts reach clients?** I would audit rejected recommendations against the preference record that existed when each profile was shared. Were requirements overlooked, missing, ambiguous, outdated, or intentionally relaxed because supply was limited? This distinguishes a workflow problem from a data-quality or candidate-supply problem. It also establishes which conflicts are genuinely preventable.

**Question 2: What explains the 44% versus 21% matchmaker gap?** I would compare sample sizes, client segments, available candidates, recommendation volume, and response delays, then observe how both matchmakers shortlist profiles. A higher rate could reflect a better process or an easier caseload. Copying A's approach without checking these differences would be premature.

**Question 3: Where and why does progress stall?** I would link outcomes to recommendation cohorts and distinguish rejection, no response, mutual-interest failure, scheduling delay, and cancellation. For apparently inconsistent clients, I would inspect preference changes and the full profile context rather than assume their stated preferences are wrong.

**Biggest immediately addressable problem:** recommendation quality before sharing. The apparent shared-to-accepted conversion is 31%, the largest proportional drop in this funnel. More specifically, 35% of explicit rejections reference already-known preferences. This supports a preference-checking intervention. I assume these reasons can be mapped to a dated preference record; the audit must validate that assumption.

The 690 profiles not accepted are not necessarily 690 rejections. The stage ratios also assume a comparable cohort. Preventing a bad recommendation does not guarantee a suitable replacement or a later meeting.

**Three metrics:** known-preference rejection share (known-preference rejections / explicit rejections), profile acceptance (accepted / shared, with a consistent response window), and search minutes per client per week. They measure the targeted failure, recommendation usefulness, and operational cost. Recommendation coverage and completed meetings per active client remain guardrails against improving percentages by sharing too little.

## Part 2 — Design one solution

**Problem and user.** The MVP addresses recommendations that conflict with known client preferences. Its user is a human matchmaker selecting and sharing profiles. The product is TDC Match Intelligence: an internal workspace that checks requirements, explains ranking, and converts feedback into reviewable signals.

**Workflow.** The matchmaker selects a client and reviews strict requirements separately from soft preferences. Candidate profiles receive one of three eligibility states: eligible, known conflict, or missing required information. A smoking conflict blocks sharing. An unknown smoking answer requires clarification. A soft location mismatch affects ranking without excluding someone. Server-side validation enforces these rules even if an interface action is bypassed.

Eligible profiles are ranked with transparent weights: soft preferences 45%, values/lifestyle 25%, reviewed history 20%, and profile completeness 10%. Each score has a visible breakdown and fact-based explanation. Historical evidence remains neutral until an explicit preference application permits its use. The weights are an initial heuristic, not learned probabilities of relationship success. The matchmaker can shortlist a candidate or record that a profile was shared through the existing email process.

When a client rejects a profile, the matchmaker enters the original feedback. Gemini 2.5 Flash structured output can draft normalized reasons, strength, supporting excerpts, and whether a known preference supports each concern. Analysis alone writes nothing. The matchmaker edits the interpretation, confirms review, and saves it. The application stores the raw text and reviewed structure together, then recalculates signals. If AI is unavailable, manual categorization preserves the workflow. A clearly labeled deterministic mode supports demonstrations without a paid API key.

**Learning without silent changes.** Three distinct reviewed rejections mentioning a category create a pending signal. A separate rule examines the last five accepted profiles, including those that advanced to later milestones. If at least three were outside the preferred area, it suggests reviewing location flexibility. The interface displays evidence counts rather than an unsupported confidence percentage. Confirming a signal records the review; changing the location weight requires a separate action after client confirmation. Hard requirements are not automatically relaxed.

**Data and technology.** The system needs client preferences, active profile attributes, missing-field indicators, recommendation milestones, original feedback, and preference snapshots from sharing time. The prototype uses eight synthetic clients, sixty profiles, and 120 recommendation records. Next.js App Router, JavaScript/React, Tailwind, Prisma 7, PostgreSQL, Zod, and Recharts provide one compact application. Gemini handles language extraction; JavaScript handles rules, scores, and metrics.

**Success and scope.** The primary pilot outcome is a lower known-preference rejection share. Acceptance and search time should also improve without reducing useful coverage. A proposed target is moving the reported 35% below 20%, subject to a verified baseline and adequate observations; this is not a forecast. A one-person, two-week build can deliver data setup and matching first, then feedback review, signals, testing, and a small pilot. Authentication, email synchronization, scraping, model training, bilateral preference modeling, and autonomous sharing are outside this MVP.

## Part 3 — Prototype and evidence

The working local MVP implements Overview, Clients, Client Intelligence, Match Queue, and Feedback Intelligence. PostgreSQL persists actions and refreshes metrics. Screenshots are included as reviewer evidence, as permitted by the assessment.

The demonstration begins with Ananya's three strict requirements and a location signal grounded in three of five accepted profiles. The queue shows eligibility and an explainable score. After marking an eligible Mumbai profile as shared, the matchmaker records: “Nice profile, but feels too traditional for me and Mumbai makes things difficult.” Reviewed feedback produces lifestyle and location reasons. The third lifestyle record generates a new signal. A separate confirmation-and-application sequence demonstrates human control over preference changes.

The assessment baseline and live synthetic dataset are explicitly separated. Later recommendation milestones preserve earlier funnel counts. Internal screening rejections are excluded from client-rejection metrics. Search-time improvement is not fabricated: the live view marks it unmeasured.

Validation completed: production build, deterministic logic tests, and browser tests of persistence, draft analysis, preference approval, invalid API actions, and desktop/mobile layouts. No real Gemini request was verified because no API key was available. The local demo identifies its fallback as Demo rules.

Screenshots: docs/screenshots/. Local preview: http://127.0.0.1:3000. Public hosting and a GitHub URL must be supplied before submitting links; localhost is not a public deployment.

## Part 4 — If the metric does not move

First I would verify adoption and measurement. Did matchmakers use the checker before sharing? Were recommendations linked to the correct client, preference snapshot, and outcome? Did enough clients respond within a comparable observation window? Two weeks may be too short for reliable outcome changes.

Next I would inspect rejected profiles and disagreements: false exclusions, missing attributes, outdated preferences, incorrect feedback categories, ignored warnings, and insufficient eligible supply. I would compare similar client segments and recommendation cohorts, including volume, pending responses, acceptance, search time, and downstream meetings. Where feasible, a small client-level pilot with a comparison group would help separate the intervention from changing caseloads.

I would iterate if a specific rule, extraction error, or workflow friction explains the result. If known conflicts fall but acceptance stays flat, I would investigate what clients reject next instead of declaring success. If the candidate pool lacks suitable alternatives, I would shift toward supply or preference clarification. I would stop the approach if a sufficiently observed pilot shows no useful quality or efficiency benefit despite reliable adoption, or if harm from false exclusions exceeds its benefit.

## AI usage and delivery status

I used Codex to examine the assessment, challenge assumptions, implement the application, and run automated checks.
The product integrates Gemini 2.5 Flash structured output for editable feedback extraction; local verification used a visibly labeled deterministic fallback because no API key was configured.
I kept hard constraints, ranking, signals, and metric calculations in ordinary JavaScript.
I rejected the assumption that all 690 unaccepted profiles were rejected, and replaced the illustrative 80% signal confidence with observed evidence counts.
The local MVP and screenshots are complete; public hosting, repository publication, a live AI request, and the submitter's updated resume remain separate delivery steps.
