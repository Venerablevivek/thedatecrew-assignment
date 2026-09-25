# Demo and Submission Guide

## Demo objective

Do not give a feature tour.

Tell one product story:

> We observed that many rejected recommendations could have been filtered using information TDC already had. I built a human-in-the-loop match intelligence layer that checks known constraints, ranks eligible candidates, and turns rejection feedback into structured signals so the next recommendation can improve.

## 2–4 minute demo script

### 0:00–0:25 — Problem

Open Dashboard.

Say:

> In the sample funnel, only 31% of shared profiles are accepted. More importantly, about 35% of rejected profiles were rejected for reasons already present in client preferences. That suggests we can improve quality before a profile is ever sent.

Point to:

- 31% acceptance,
- avoidable rejection card,
- matchmaker 44% vs 21% comparison.

### 0:25–0:55 — Client intelligence

Open Ananya.

Show:

- hard deal-breakers,
- soft preferences,
- learned signals.

Say:

> I separate hard rules from preferences because they should behave differently. Hard constraints eliminate a recommendation. Soft preferences affect ranking.

### 0:55–1:35 — Match queue

Open Match Queue.

Show top candidate.

Say:

> Candidates that violate hard deal-breakers never reach this queue. Eligible profiles get an explainable ranking. The score is calculated by code; AI does not invent it.

Expand score breakdown.

### 1:35–2:20 — Feedback AI

Reject one candidate.

Enter:

```text
Nice profile, but too traditional for me and Mumbai would be difficult.
```

Click Analyze.

Show:

```text
Lifestyle → Traditional lifestyle
Location → Geographic mismatch
```

Say:

> The model is used for the unstructured language problem, not for simple rule checking. The matchmaker can edit the interpretation before saving.

Confirm.

### 2:20–2:55 — Learning loop

Open Client Intelligence or Feedback Intelligence.

Show:

```text
Potential blind spot:
Location may be more flexible than stated.
```

Say:

> The system compares stated preferences with observed decisions. It never silently changes a preference. It surfaces the evidence for the human matchmaker to review.

### 2:55–3:15 — Close

Say:

> The MVP is intentionally narrow. Its success metric is whether avoidable rejection falls and qualified profile acceptance improves while matchmaker search time decreases.

Done.

## Repository README screenshots

Include 4 screenshots:

1. Dashboard
2. Client Intelligence
3. Match Queue
4. Feedback Analyzer

## Suggested GitHub description

```text
AI-assisted matchmaking intelligence MVP for filtering known incompatibilities, ranking profiles, structuring rejection feedback, and surfacing preference-learning signals.
```

## Suggested submission document structure

```text
Title
Executive Summary

Part 1 — Diagnose
Part 2 — Solution
Part 3 — Prototype
Part 4 — Curveball
AI Usage

Prototype Link
GitHub Link
```

## AI usage statement

Use something like:

```text
I used ChatGPT/OpenAI to challenge my assumptions, structure the technical approach, and help implement/refactor parts of the prototype. I used AI in the product itself only for converting unstructured rejection feedback into a controlled schema and generating concise explanations. I chose not to use AI for hard preference checks or the numeric match score because those rules are more transparent and reliable in deterministic code.
```

## Curveball direction

If the primary metric does not improve after two weeks:

1. verify adoption — are matchmakers actually using the queue?
2. check whether filtered candidates were truly avoidable rejections,
3. inspect score calibration by matchmaker/client segment,
4. compare recommendations accepted before/after,
5. inspect AI feedback categorization accuracy,
6. check whether the candidate pool itself is the limiting factor.

Do not immediately add more AI.

If the system is used and predictions are wrong, iterate the weights/rules.

If the system is accurate but the candidate pool has too few compatible people, change the product focus because ranking cannot create supply.

If matchmakers do not trust/use it, fix workflow and explainability before changing the model.
