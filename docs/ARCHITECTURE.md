# Architecture and implementation decisions

Browser → Next.js Route Handlers → PostgreSQL via Prisma 7. Feedback analysis optionally calls the Gemini generateContent API. No separate backend is required.

## Core modules

- `lib/matching.js`: explicit hard-constraint checks, NCR city normalization, deterministic weighted scoring, evidence-based explanations.
- `lib/signals.js`: latest-five-accepted location patterns and distinct-feedback repetition thresholds. Existing review decisions survive recalculation.
- `lib/metrics.js`: timestamp-based cumulative funnel, explicit rejection denominator, per-record deduplicated categories.
- `lib/ai.js`: structured extraction, exact supporting-quote checks, clearly labeled demo parser, manual mode.
- `lib/validation.js`: shared Zod request/output schemas.
- `lib/api.js`: consistent success/error envelopes.
- `prisma/schema.prisma`: seven relational models, JSON evidence/snapshots, milestone timestamps.

## Decisions that correct ambiguities in the supplied documents

1. **690 unaccepted is not necessarily 690 rejected.** The interface does not present ~242 avoidable recommendations as an established fact.
2. **Baseline and live data are separate.** Fixed 1,000/310/210/150/75/42 numbers are never presented as database counts. Seeded live records initially yield 37 acceptances from 120 shared profiles (30.8%), 14 known-preference rejections from 40 explicit rejections (35%), A 22/50 (44%), B 15/70 (21.4%).
3. **Later status does not erase earlier milestones.** A completed meeting still counts as shared and accepted; separate timestamps preserve this.
4. **Unknown is not eligible.** Missing hard-rule fields prevent shortlisting/sharing, while soft unknowns produce uncertainty notes.
5. **Analysis is read-only.** Only confirmed feedback writes raw text, reviewed reasons, rejection status, and refreshed signals in one transaction.
6. **Internal screening is separate from client rejection.** A rejection before `sharedAt` is saved but excluded from client-rejection rates.
7. **Confirming a signal is not applying a preference.** Location flexibility requires another explicit human action and client-confirmation checkbox. It reduces an existing soft weight, never overrides a hard deal-breaker.
8. **History is neutral until approval.** Pending or merely confirmed signals do not change rankings. Applied location signals permit a simple accepted-city history contribution. This is a heuristic, not a predictive model.
9. **Evidence counts replace invented confidence.** The interface shows observed counts, not the illustrative 80% from the specification.
10. **AI source is visible.** The deterministic fallback is labeled Demo rules; live API failure offers manual entry.

## Ranking

Hard checks run first. Blocked/unknown profiles get no numeric score. Eligible profiles receive up to 45 preference points, 25 values points, 20 history points, and 10 completeness points. Each group normalizes within its own weights. With no applied historical signal, history receives a neutral 10/20 baseline. With no values preferences, that group is neutral too. Scores are relative ranking aids; there is no trained probability calibration.

## Data integrity

Recommendation uniqueness is enforced on `(clientId, profileId)`. Feedback is unique per recommendation. Mutating recommendation/feedback operations lock the client row within the database transaction to serialize same-client updates. Stage changes follow an explicit progression. Accepted history cannot be overwritten with a rejection. Raw evidence must be an exact excerpt. A known-preference flag requires a corresponding preference in the recommendation's send-time snapshot. A human still verifies the semantic interpretation.

## APIs

| Route                             | Behavior                                                            |
| --------------------------------- | ------------------------------------------------------------------- |
| GET `/api/dashboard`              | Live cohort metrics, scenario reference, feedback, signals, AI mode |
| GET `/api/clients`                | Client list with summary metrics                                    |
| GET `/api/clients/:id`            | Preferences, signals, recommendation and feedback history           |
| GET `/api/match-queue?clientId=…` | Ranked profiles, eligibility and existing decisions                 |
| POST `/api/recommendations`       | Validated forward milestone or shortlist/share action               |
| POST `/api/feedback/analyze`      | Read-only analysis; uses `clientId`, `profileId`, `feedback`        |
| POST `/api/feedback`              | Confirmed feedback and rejection saved transactionally              |
| PATCH `/api/signals/:id`          | Confirm or dismiss a pending signal                                 |
| POST `/api/signals/:id/apply`     | Explicitly apply confirmed soft-location flexibility                |

Feedback endpoints use `profileId` so the same review flow works before a recommendation record exists. This is an intentional adjustment to the supplied draft contract.

## Sources used for implementation

- Gemini structured output: https://ai.google.dev/gemini-api/docs/generate-content/structured-output
- Prisma configuration: https://docs.prisma.io/docs/orm/reference/prisma-config-reference
- Next.js installed documentation: `node_modules/next/dist/docs/01-app/01-getting-started/`

## Limits

Synthetic single-workspace assessment app; not a production CRM. Human review does not make AI interpretation infallible. Client/candidate mutual preferences, calibrated ranking, prospective experiments, authentication, and search-time instrumentation require further work. Seeded history is intentionally illustrative and is not real evidence of business impact.
