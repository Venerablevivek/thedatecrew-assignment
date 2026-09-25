# Database Design

## 1. Database choice

Use PostgreSQL.

For a two-day MVP, use Prisma ORM 7 to keep CRUD and migrations straightforward while keeping the application JavaScript-first.

## 2. Core entities

```text
Matchmaker
    │
    ├── Client
    │     ├── ClientPreference
    │     ├── Recommendation
    │     ├── Feedback
    │     └── PreferenceSignal
    │
    └── Recommendation

CandidateProfile
    └── Recommendation
```

## 3. Recommended Prisma schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum PreferenceType {
  HARD
  SOFT
}

enum RecommendationStatus {
  SUGGESTED
  SHORTLISTED
  SHARED
  ACCEPTED
  REJECTED
  CONTACT_SHARED
  CONVERSATION_STARTED
  MEETING_FIXED
  MEETING_COMPLETED
}

enum SignalType {
  REPEATED_REJECTION
  REPEATED_ACCEPTANCE
  PREFERENCE_CONTRADICTION
}

enum SignalStatus {
  PENDING_REVIEW
  CONFIRMED
  DISMISSED
}

model Matchmaker {
  id              String           @id @default(cuid())
  name            String
  email           String?          @unique
  clients         Client[]
  recommendations Recommendation[]
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

model Client {
  id              String             @id @default(cuid())
  name            String
  age             Int?
  city            String?
  occupation      String?
  matchmakerId    String
  matchmaker      Matchmaker         @relation(fields: [matchmakerId], references: [id])

  preferences     ClientPreference[]
  recommendations Recommendation[]
  feedback        Feedback[]
  signals         PreferenceSignal[]

  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  @@index([matchmakerId])
}

model ClientPreference {
  id          String         @id @default(cuid())
  clientId    String
  client      Client         @relation(fields: [clientId], references: [id], onDelete: Cascade)

  key         String
  value       Json
  type        PreferenceType
  weight      Float          @default(1)
  source      String         @default("STATED")

  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@index([clientId])
  @@index([key])
}

model CandidateProfile {
  id              String           @id @default(cuid())
  name            String
  age             Int
  city            String
  occupation      String?
  smoking         String?
  children        String?
  relationshipIntent String?

  attributes      Json
  valuesSummary   String?
  lifestyleSummary String?
  active          Boolean          @default(true)

  recommendations Recommendation[]

  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  @@index([active])
  @@index([city])
}

model Recommendation {
  id              String               @id @default(cuid())
  clientId        String
  profileId       String
  matchmakerId    String

  client          Client               @relation(fields: [clientId], references: [id], onDelete: Cascade)
  profile         CandidateProfile     @relation(fields: [profileId], references: [id])
  matchmaker      Matchmaker           @relation(fields: [matchmakerId], references: [id])

  status          RecommendationStatus @default(SUGGESTED)

  score           Float?
  scoreBreakdown  Json?
  matchedReasons  Json?
  warnings        Json?
  eligibility     Json?

  feedback        Feedback?

  sharedAt        DateTime?
  acceptedAt      DateTime?
  completedAt     DateTime?

  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt

  @@unique([clientId, profileId])
  @@index([clientId, status])
  @@index([matchmakerId])
}

model Feedback {
  id               String         @id @default(cuid())
  clientId         String
  recommendationId String         @unique

  client           Client         @relation(fields: [clientId], references: [id], onDelete: Cascade)
  recommendation   Recommendation @relation(fields: [recommendationId], references: [id], onDelete: Cascade)

  rawText          String
  structured       Json
  aiSummary        String?
  wasEdited        Boolean        @default(false)

  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  @@index([clientId])
}

model PreferenceSignal {
  id            String       @id @default(cuid())
  clientId      String
  client        Client       @relation(fields: [clientId], references: [id], onDelete: Cascade)

  type          SignalType
  attributeKey  String
  title         String
  description   String
  evidence      Json
  confidence    Float
  status        SignalStatus @default(PENDING_REVIEW)

  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@index([clientId, status])
}
```

## 4. Why JSON fields are used

The prototype uses JSON for:

- preference values,
- candidate attributes,
- score breakdown,
- eligibility details,
- structured AI feedback,
- evidence behind learned signals.

This allows the prototype to change rapidly without adding a migration for every experimental attribute.

For a mature production system, frequently queried attributes can later move into normalized columns.

## 5. Seed dataset

Use:

```text
2 matchmakers
8–10 clients
60–100 candidate profiles
100–150 recommendation records
30–50 feedback records
6–10 learned signals
```

Ensure the data demonstrates:

1. Matchmaker A acceptance rate around 44%.
2. Matchmaker B acceptance rate around 21%.
3. approximately 35% of rejected recommendations having a known-preference conflict.
4. at least one preference contradiction.
5. multiple rejection categories.

## 6. Example client preferences

```json
[
  {
    "key": "age_range",
    "value": { "min": 29, "max": 35 },
    "type": "HARD",
    "weight": 1
  },
  {
    "key": "smoking",
    "value": { "allowed": false },
    "type": "HARD",
    "weight": 1
  },
  {
    "key": "children",
    "value": { "desired": "YES" },
    "type": "HARD",
    "weight": 1
  },
  {
    "key": "career_ambition",
    "value": { "level": "HIGH" },
    "type": "SOFT",
    "weight": 0.9
  },
  {
    "key": "family_orientation",
    "value": { "level": "HIGH" },
    "type": "SOFT",
    "weight": 0.8
  }
]
```

## 7. Example structured feedback

```json
{
  "decision": "REJECTED",
  "summary": "The client felt the lifestyle was too traditional and location was difficult.",
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

## 8. Dashboard metric queries

### Profile acceptance rate

```text
ACCEPTED recommendations
------------------------
SHARED recommendations
```

### Avoidable rejection rate

```text
REJECTED recommendations where
feedback contains knownPreference = true
---------------------------------------
Total REJECTED recommendations
```

### Matchmaker acceptance rate

Group recommendations by `matchmakerId`.

### Meeting completion

Count `MEETING_COMPLETED`.

## 9. Indexes

For the MVP, the most important indexes are already included:

- client by matchmaker,
- recommendation by client/status,
- recommendation by matchmaker,
- candidate active/city,
- signal by client/status.

No advanced optimization is necessary.
