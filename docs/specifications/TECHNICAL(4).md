# Technical Specification

## 1. Objective

Build a small internal dashboard that improves recommendation quality and matchmaker efficiency without trying to automate the entire matchmaking process.

The MVP must prove four capabilities:

1. deterministic deal-breaker filtering,
2. explainable candidate ranking,
3. AI-powered feedback structuring,
4. preference-learning suggestions with human approval.

## 2. Architecture

```text
┌──────────────────────────────┐
│      Next.js App Router      │
│  React + JavaScript + Tailwind│
└──────────────┬───────────────┘
               │
       Route Handlers / Server
               │
      ┌────────┴────────┐
      │                 │
┌─────▼─────┐    ┌──────▼──────┐
│ PostgreSQL│    │ OpenAI API  │
│ + Prisma 7│    │ Structured  │
│           │    │ Outputs     │
└───────────┘    └─────────────┘
```

There is deliberately no separate backend service.

For a two-day MVP, keeping the API inside Next.js reduces deployment and debugging overhead.

## 3. Runtime responsibilities

### Browser

Responsible for:

- dashboard rendering,
- filters,
- forms,
- optimistic interaction states,
- charts,
- matchmaker actions.

### Next.js server

Responsible for:

- database reads/writes,
- matching logic,
- metrics,
- OpenAI requests,
- validation,
- AI response normalization.

### PostgreSQL

Responsible for:

- client records,
- candidate records,
- preferences,
- recommendations,
- feedback,
- learned signals.

### OpenAI

Used only where language understanding is useful:

- normalize unstructured rejection feedback,
- optionally parse free-text preferences,
- generate short match explanations.

Do **not** use the model to enforce simple rules such as smoking, age, children preference, or location deal-breakers.

## 4. Core request flow

### Match queue

```text
GET /api/match-queue?clientId=...
       ↓
Load client + preferences
       ↓
Load active candidate pool
       ↓
Remove candidates violating hard rules
       ↓
Score eligible candidates
       ↓
Sort descending
       ↓
Return explanation-ready result
```

### Feedback

```text
POST /api/feedback/analyze
       ↓
Validate request with Zod
       ↓
Call OpenAI structured extraction
       ↓
Store raw + structured feedback
       ↓
Update recommendation outcome
       ↓
Recalculate preference signals
       ↓
Return structured result + insights
```

## 5. Matching engine

The score must be understandable.

### Step A — eligibility

Run hard constraints first.

Example:

```js
export function checkEligibility(client, candidate) {
  const failures = [];

  if (
    client.preferences.smoking === "NO" &&
    candidate.smoking === "YES"
  ) {
    failures.push("Smoking conflicts with a strict deal-breaker.");
  }

  if (
    client.preferences.children === "WANTS" &&
    candidate.children === "DOES_NOT_WANT"
  ) {
    failures.push("Children preference conflicts.");
  }

  if (
    candidate.age < client.preferences.ageMin ||
    candidate.age > client.preferences.ageMax
  ) {
    failures.push("Outside preferred age range.");
  }

  return {
    eligible: failures.length === 0,
    failures,
  };
}
```

### Step B — scoring

Recommended MVP weights:

| Signal | Weight |
|---|---:|
| Explicit soft preferences | 45 |
| Values/lifestyle alignment | 25 |
| Historical client behavior | 20 |
| Profile completeness/confidence | 10 |
| Total | 100 |

Example:

```js
score =
  softPreferenceScore * 0.45 +
  valuesScore * 0.25 +
  historicalScore * 0.20 +
  completenessScore * 0.10;
```

Each sub-score should be 0–100 before weighting.

### Step C — explanation

Do not let the model invent the score.

The code calculates the score and sends facts to the model only to create a short readable explanation.

Example input:

```json
{
  "score": 86,
  "matched": [
    "non-smoker",
    "wants children",
    "career ambition",
    "family orientation"
  ],
  "uncertainties": [
    "relocation preference unknown"
  ],
  "behavioralSignals": [
    "client accepted 3 profiles outside Delhi"
  ]
}
```

Expected explanation:

> Strong fit across all hard requirements and most high-priority preferences. Location is outside the stated preference, but recent acceptance history suggests the client may be more flexible than originally stated.

## 6. Preference-learning logic

The first version should be simple and transparent.

For each structured feedback item, track:

```text
client
attribute
value/reason
positive count
negative count
last observed
confidence
```

Generate an insight only after a threshold.

Example:

```js
if (sameReasonCount >= 3) {
  createLearnedSignal({
    type: "REPEATED_REJECTION",
    status: "PENDING_REVIEW"
  });
}
```

Contradiction example:

```text
Stated:
location = Delhi preferred

Observed:
3 of last 5 accepted candidates are outside Delhi
```

Create:

```text
PREFERENCE_CONTRADICTION
confidence: 0.80
status: PENDING_REVIEW
```

The matchmaker must confirm before it changes a real preference.

## 7. AI design

### Feedback extraction

Use Structured Outputs.

Expected schema:

```json
{
  "decision": "REJECTED",
  "summary": "Location and lifestyle mismatch.",
  "reasons": [
    {
      "category": "LOCATION",
      "label": "Geographic mismatch",
      "strength": "MEDIUM",
      "knownPreference": true
    }
  ],
  "suggestPreferenceReview": true
}
```

Allowed categories:

```text
LOCATION
AGE
SMOKING
CHILDREN
RELIGION
DIET
CAREER
EDUCATION
FAMILY
LIFESTYLE
VALUES
PERSONALITY
COMMUNICATION
ATTRACTION
RELATIONSHIP_INTENT
OTHER
```

Keep the taxonomy small enough for useful charts.

## 8. Validation

Use Zod for:

- client creation/update,
- recommendation actions,
- feedback requests,
- AI structured response validation fallback.

Never store an AI response directly without validation.

## 9. Error handling

Use a consistent API envelope.

Success:

```json
{
  "ok": true,
  "data": {}
}
```

Failure:

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Feedback is required."
  }
}
```

## 10. Data privacy

Use mocked data in the assessment.

Do not upload real matrimonial profiles or personal information.

If this becomes a real product later:

- encrypt sensitive fields,
- implement role-based permissions,
- add audit logs,
- define retention/deletion policies,
- minimize what is sent to AI providers,
- redact directly identifying fields from AI prompts where not needed.

## 11. Performance

For the prototype:

- load dashboard metrics server-side,
- paginate candidate tables,
- calculate ranking on request for the selected client,
- avoid premature caching,
- avoid background queues.

100–500 mocked profiles will be more than enough for the demo.

## 12. Deployment

Recommended:

```text
Frontend/API: Vercel
Database: managed PostgreSQL
```

Use environment variables:

```env
DATABASE_URL=
OPENAI_API_KEY=
NEXT_PUBLIC_APP_NAME="TDC Match Intelligence"
```

## 13. Technical decisions that are intentionally simple

Do not add:

- Redis,
- Kafka,
- vector DB,
- LangChain,
- LangGraph,
- n8n,
- microservices,
- custom ML training.

A reviewer should be able to understand the architecture in less than two minutes.
