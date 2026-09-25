# Assessment Positioning Notes

## One-sentence product

**TDC Match Intelligence is a human-in-the-loop recommendation workspace that filters known incompatibilities, ranks eligible profiles, structures rejection feedback, and turns client behavior into reviewable preference signals.**

## Problem statement

The largest immediately addressable problem is not the number of candidate profiles.

It is the quality of recommendations entering the funnel.

From the supplied scenario:

```text
Profiles shared   1,000
Accepted            310
Rejected            690
```

If roughly 35% of rejected profiles were rejected for reasons already present in the client's preferences:

```text
690 × 35% ≈ 242
```

So approximately 242 recommendations may have contained a known conflict before being shared.

That makes preference enforcement and feedback learning a strong MVP target.

## Assumption

The 35% figure includes reasons that can be mapped back to explicit preferences or deal-breakers.

Not every one of those 242 recommendations is guaranteed to be preventable because:

- preferences may be ambiguous,
- preferences can change,
- some preferences are soft rather than strict.

Therefore the product should distinguish **hard deal-breakers** from **soft preferences**.

## Primary success metric

### Qualified Profile Acceptance Rate

```text
accepted recommendations
------------------------
eligible profiles shared
```

This should increase if filtering and ranking improve recommendation quality.

## Guardrail metrics

### Avoidable Rejection Rate

```text
rejections caused by known preferences
--------------------------------------
total rejections
```

Baseline in the scenario:

```text
~35%
```

Direction:

```text
Down
```

### Matchmaker Search Time

Baseline:

```text
~2 hours / client / week
```

Direction:

```text
Down
```

## Why not optimize meetings completed first?

Meeting completion is important but is several steps downstream.

It is affected by:

- client availability,
- candidate availability,
- communication,
- scheduling,
- personal chemistry,
- follow-through.

The proposed MVP intervenes directly at recommendation quality, so the first success metrics should be closer to the intervention.

## Why human-in-the-loop?

The Date Crew positions its experience around dedicated human matchmakers, curated introductions, privacy, and relationship guidance.

The software therefore augments judgment instead of replacing it.

The AI should:

```text
observe
structure
surface
explain
```

The matchmaker should:

```text
decide
confirm
override
share
```

## Strongest prototype moment

A matchmaker rejects a candidate with:

```text
"Nice profile, but feels too traditional for me and Mumbai makes things difficult."
```

The system extracts:

```text
Lifestyle → Traditional lifestyle
Location  → Geographic mismatch
```

After enough history, the client intelligence page shows:

```text
Location may be more flexible than stated.

The client has accepted 3 of the last 5 profiles outside
their stated preferred location.

Review this preference?
```

That demonstrates a useful feedback loop without pretending AI can decide romantic compatibility.
