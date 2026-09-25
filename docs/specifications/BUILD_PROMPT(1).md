# Coding Agent Build Prompt

Use this file as the primary instruction for Cursor/Codex/Claude Code.

---

Build a complete MVP called **TDC Match Intelligence**.

## Non-negotiable stack

- Next.js App Router
- React
- JavaScript only
- `.jsx` for React components
- `.js` for utilities/API helpers
- absolutely no TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM 7
- OpenAI API
- Recharts
- Lucide React
- Zod
- deployable on Vercel

Do not introduce TypeScript, `.tsx`, `.ts`, LangChain, LangGraph, Redis, a vector database, microservices, or a separate Express backend.

## Product goal

Create an internal AI-assisted workspace for human matchmakers.

The product must:

1. show the matchmaking funnel,
2. show client preferences,
3. block candidates that violate hard deal-breakers,
4. rank eligible candidates using deterministic scoring,
5. explain the score clearly,
6. accept free-text rejection feedback,
7. use OpenAI Structured Outputs to convert feedback to a fixed schema,
8. create preference-learning signals from recommendation history,
9. keep all preference changes human-approved.

## Pages

Create:

```text
/dashboard
/clients
/clients/[id]
/match-queue
/feedback
```

Root `/` should redirect to `/dashboard`.

## Visual design

Light premium matchmaking workspace.

Colors:

```text
background       #FBFAF8
surface          #FFFFFF
secondary        #F6F3F1
text             #1F2937
muted            #667085
primary          #6D5DFB
primary-hover    #5B4BE7
rose             #E7829A
lavender-bg      #F1EEFF
green            #2F9E72
amber            #C78B36
red              #D65C69
border           #E9E5E2
```

Use:

- rounded 14–18px cards,
- subtle borders,
- soft shadows,
- generous spacing,
- minimal motion,
- no dark theme,
- no swipe-card UI,
- no hearts/romantic clichés,
- no robot imagery.

## Navigation

Sidebar:

```text
TDC Match Intelligence
Overview
Clients
Match Queue
Feedback Intelligence
```

## Dashboard

Create 4 KPI cards:

```text
Profile Acceptance        31%
Avoidable Rejections      35%
Avg Search Time           2h/client/week
Meetings Completed        42
```

Create funnel:

```text
Profiles shared        1000
Profiles accepted       310
Contact details shared  210
Conversations started   150
Meetings fixed           75
Meetings completed       42
```

Create:

- matchmaker comparison chart,
- rejection reasons chart,
- AI opportunity card.

AI opportunity copy:

```text
~242 rejected recommendations may have been avoidable
because the rejection reason was already present in the
client's known preferences.
```

## Client Intelligence

Create a strong demo client named Ananya Sharma.

Show:

```text
Hard deal-breakers
Soft preferences
Recent recommendations
Learned preference signals
```

Create a visible signal:

```text
Potential blind spot

Location may be more flexible than stated.

Stated:
Delhi NCR preferred

Observed:
3 of the last 5 accepted profiles were outside Delhi.

Confidence: 80%
```

Actions:

```text
Keep current preference
Mark as flexible
```

Do not automatically change preferences.

## Matching engine

Implement:

```text
lib/matching.js
```

Pipeline:

```text
hard eligibility
→ soft preference score
→ values score
→ historical behavior score
→ completeness score
→ final ranking
```

Weights:

```text
Soft preferences      45%
Values/lifestyle      25%
Historical behavior   20%
Profile completeness  10%
```

AI must not produce the numeric score.

## Match Queue

For selected client, show candidate cards.

Each card:

```text
name
age
city
occupation
score
fit label
deal-breaker pass
why recommended
score breakdown
warning
Reject button
Shortlist button
```

Fit labels:

```text
85–100 Strong fit
70–84  Worth reviewing
<70    Mixed signals
```

## Feedback analyzer

Reject opens modal.

Textarea placeholder:

```text
Example: Nice profile, but feels too traditional for me and Mumbai makes things difficult.
```

Button:

```text
Analyze feedback
```

AI result must show editable structured fields.

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

Store both raw and structured feedback.

## Database

Use the Prisma models defined in DATABASE.md.

Provide:

```text
prisma/schema.prisma
prisma/seed.js
```

Seed enough deterministic demo data for the interface to feel real.

Never use real personal data.

## API routes

Implement:

```text
GET   /api/dashboard
GET   /api/clients
GET   /api/clients/[id]
GET   /api/match-queue
POST  /api/recommendations
POST  /api/feedback/analyze
POST  /api/feedback
PATCH /api/signals/[id]
```

All responses:

```json
{
  "ok": true,
  "data": {}
}
```

Errors:

```json
{
  "ok": false,
  "error": {
    "code": "...",
    "message": "..."
  }
}
```

## Code quality

- small reusable components,
- no giant 500-line page component,
- no unnecessary abstraction,
- clear naming,
- no dead code,
- no placeholder broken buttons,
- every button used in the demo must work,
- server-side secrets never exposed,
- validate input with Zod,
- handle loading/error states.

## Priority

P0:

```text
Dashboard
Client Intelligence
Hard filters
Match ranking
Feedback analyzer
Structured feedback save
Preference signal
```

P1 only after P0 works:

```text
AI match explanation
extra filters
extra charts
```

Do not build anything outside this scope unless all P0/P1 features are complete.

## Final output

The repository must include:

```text
README.md
.env.example
prisma/schema.prisma
prisma/seed.js
```

The app must run with:

```bash
npm install
npx prisma@7 migrate dev
node prisma/seed.js
npm run dev
```

Build one polished end-to-end demo flow rather than many incomplete features.
