# AI Workflow Specification

## Principle

Use AI for ambiguity, language, and summarization.

Use deterministic JavaScript for rules and calculations.

```text
Good use of AI
✓ free-text feedback → structured reasons
✓ client notes → structured preference suggestion
✓ concise explanation of an already-calculated score

Bad use of AI
✗ checking whether 38 is outside age 29–35
✗ deciding whether smoking violates "non-smoker only"
✗ generating the numeric match score from scratch
✗ automatically changing a client's preference
```

## Workflow 1 — Feedback Analyzer

### Input

```json
{
  "clientPreferences": [],
  "feedback": "Nice person, but a little too traditional for me. Mumbai may also be difficult."
}
```

### Output schema

```json
{
  "decision": "REJECTED",
  "summary": "Lifestyle and location were the main concerns.",
  "reasons": [
    {
      "category": "LIFESTYLE",
      "label": "Traditional lifestyle",
      "strength": "MEDIUM",
      "knownPreference": false
    },
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

### System prompt

```text
You are an internal feedback normalization assistant for a human matchmaking team.

Your job is to convert matchmaker/client feedback into structured reasons.

Rules:
- Do not infer sensitive traits that were not explicitly stated.
- Do not invent preferences.
- A "known preference" must be supported by the client preference data supplied in the request.
- Use OTHER when the feedback cannot be confidently mapped.
- Keep the summary factual and concise.
- Never tell the system to automatically change a client's preference.
- If repeated behavior may justify review, set suggestPreferenceReview=true.
```

### Category enum

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

## Workflow 2 — Match explanation

The application calculates the score.

Then AI turns facts into 1–3 sentences.

### Input

```json
{
  "client": "Ananya",
  "candidate": "Rahul",
  "score": 87,
  "matched": [
    "all hard requirements pass",
    "career ambition matches",
    "family orientation matches",
    "relationship intent matches"
  ],
  "warnings": [
    "candidate lives outside preferred city"
  ],
  "history": [
    "client accepted 3 of last 5 profiles outside preferred city"
  ]
}
```

### Expected output

```text
Strong alignment across all hard requirements and the client's highest-priority values. The profile is outside the stated city preference, but recent acceptance history suggests location may be more flexible than originally stated.
```

### Rules

```text
- Do not invent compatibility.
- Do not claim psychological certainty.
- Do not use "perfect match".
- Do not use "soulmate".
- Do not call a score scientifically predictive.
- Mention uncertainty when present.
```

## Workflow 3 — Optional preference parser

Only build this if core functionality is complete.

Use it to convert matchmaker notes into a draft preference structure.

Example:

```text
"Smoking is a strict no. Wants someone ambitious and family oriented. Delhi preferred, but could consider Bangalore."
```

Draft output:

```json
{
  "hard": [
    {
      "key": "smoking",
      "value": "NO"
    }
  ],
  "soft": [
    {
      "key": "career_ambition",
      "value": "HIGH",
      "weight": 0.9
    },
    {
      "key": "family_orientation",
      "value": "HIGH",
      "weight": 0.8
    },
    {
      "key": "location",
      "value": ["Delhi", "Bangalore"],
      "weight": 0.6
    }
  ]
}
```

Again: this is a draft that the matchmaker confirms.

## Preference signal generation

Do not ask an LLM to discover every signal from raw history.

First derive simple statistics in JavaScript.

Example:

```js
const recent = recommendations.slice(0, 5);

const acceptedOutsidePreferredCity = recent.filter((item) => {
  return (
    item.status === "ACCEPTED" &&
    !preferredCities.includes(item.profile.city)
  );
}).length;

if (acceptedOutsidePreferredCity >= 3) {
  // create contradiction candidate
}
```

Then AI may create a readable description from those facts.

## API implementation concept

```js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

Use a current model that supports Structured Outputs.

Keep model configuration in one file:

```text
lib/ai.js
```

Do not spread model names across routes.

## AI failure handling

If AI analysis fails:

1. keep the matchmaker's raw text,
2. show "AI analysis unavailable",
3. let the user manually choose a category,
4. never block the recommendation workflow.

AI is an enhancement, not a critical dependency.

## Cost control

For the prototype:

- analyze only when the user clicks `Analyze feedback`,
- generate explanations on-demand or at match queue calculation time,
- keep prompts compact,
- do not send full client history if a structured summary is sufficient.

## Safety / privacy

For mocked assessment data, there is no real PII.

For a production version:

- send only fields required for the AI operation,
- remove phone/email/contact details from prompts,
- avoid sending photographs for compatibility scoring,
- maintain auditability of AI-generated preference suggestions.

## Best demo interaction

1. Open Ananya's match queue.
2. Show an eligible high-scoring candidate.
3. Reject with:
   `Good profile, but feels too traditional and Mumbai makes it difficult.`
4. Click `Analyze feedback`.
5. Show structured categories.
6. Confirm.
7. Display:
   `Location has now appeared in 3 recent decisions. Review preference?`
8. Navigate to Client Intelligence.
9. Show the new signal.

That proves the AI loop end to end.
