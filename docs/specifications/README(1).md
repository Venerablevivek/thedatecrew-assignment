# TDC Match Intelligence — 2-Day MVP

An internal AI-assisted matchmaking dashboard for The Date Crew.

## Product thesis

The MVP does **not** attempt to replace the matchmaker.

It helps the matchmaker:

1. eliminate profiles that violate known deal-breakers,
2. rank the remaining profiles using explainable rules,
3. convert unstructured rejection feedback into structured signals,
4. detect contradictions between stated and observed preferences,
5. see the funnel and quality metrics in one dashboard.

The core loop is:

```text
Client preferences
        ↓
Hard deal-breaker filter
        ↓
Explainable match scoring
        ↓
Matchmaker review
        ↓
Profile shared
        ↓
Accept / Reject
        ↓
AI structures feedback
        ↓
Preference signals update
        ↓
Next ranking improves
```

## Stack

- Next.js App Router
- React
- JavaScript only (`.js` / `.jsx`)
- Tailwind CSS
- PostgreSQL
- Prisma ORM 7
- OpenAI API for structured feedback extraction and explanations
- Recharts for dashboard charts
- Zod for request validation
- Vercel for deployment

### Why Prisma 7?

This project intentionally stays JavaScript-first. Prisma 7 is stable and supported, while Prisma 8 is still in release-candidate status and introduces TypeScript-oriented tooling. For a two-day assessment, Prisma 7 minimizes setup risk.

## MVP pages

```text
/
├── dashboard
├── clients
│   └── [id]
├── match-queue
└── feedback
```

### 1. Dashboard

Shows:

- profile acceptance rate,
- avoidable rejection rate,
- average matchmaker search time,
- meeting completion rate,
- funnel,
- rejection-reason distribution,
- matchmaker A vs B comparison.

### 2. Client Intelligence

Shows:

- hard deal-breakers,
- soft preferences,
- learned preference signals,
- recent recommendations,
- contradictions between stated and observed behavior.

### 3. Match Queue

Shows ranked candidate profiles with:

- eligibility,
- score,
- score breakdown,
- why recommended,
- any risk or uncertainty,
- shortlist/reject actions.

### 4. Feedback Intelligence

Accepts free-text rejection feedback and uses AI to extract:

- normalized rejection category,
- specific reason,
- strength,
- whether the reason was already known,
- whether it suggests a possible preference update.

## Two-day definition of done

The project is complete when a reviewer can:

1. open the dashboard,
2. inspect a client,
3. see eligible profiles ranked,
4. understand why each profile is ranked,
5. reject a profile with free-text feedback,
6. see the feedback converted into structured reasons,
7. see a learned preference/contradiction appear,
8. return to analytics and see updated metrics.

## Explicitly out of scope

Do not build these during the assessment:

- production authentication,
- profile scraping,
- automated email sending,
- WhatsApp integration,
- client-facing mobile app,
- collaborative filtering,
- model training,
- vector database,
- autonomous AI agents,
- payment/billing,
- complex role permissions,
- real personal data.

Use mocked or synthetic profiles only.

## Suggested install

```bash
npx create-next-app@latest tdc-match-intelligence --js --tailwind --eslint --app
cd tdc-match-intelligence

npm install prisma@7 @prisma/client@7
npm install openai zod recharts lucide-react clsx
npm install date-fns
```

Then initialize Prisma:

```bash
npx prisma@7 init
```

Set:

```env
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="..."
```

Run migrations and seed:

```bash
npx prisma@7 migrate dev --name init
node prisma/seed.js
npm run dev
```

## Suggested repository structure

```text
tdc-match-intelligence/
├── app/
│   ├── api/
│   │   ├── dashboard/route.js
│   │   ├── clients/[id]/route.js
│   │   ├── match-queue/route.js
│   │   ├── recommendations/route.js
│   │   └── feedback/analyze/route.js
│   ├── dashboard/page.jsx
│   ├── clients/page.jsx
│   ├── clients/[id]/page.jsx
│   ├── match-queue/page.jsx
│   ├── feedback/page.jsx
│   ├── layout.jsx
│   └── page.jsx
├── components/
│   ├── dashboard/
│   ├── clients/
│   ├── matches/
│   ├── feedback/
│   └── ui/
├── lib/
│   ├── prisma.js
│   ├── matching.js
│   ├── metrics.js
│   ├── ai.js
│   └── validation.js
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── docs/
└── public/
```

## Demo story

Use one client with a visible contradiction:

> Client says Delhi NCR is strongly preferred, but has repeatedly accepted profiles outside Delhi when values and career alignment are strong.

The demo should show that the system does not silently change the preference. It surfaces the pattern to the matchmaker and asks them to confirm, ignore, or keep the original rule.

That single interaction communicates the entire product idea.
