# API Contract

## Conventions

All API responses:

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
    "code": "INVALID_INPUT",
    "message": "Readable error message."
  }
}
```

## 1. Dashboard

### `GET /api/dashboard`

Returns all overview metrics.

Response:

```json
{
  "ok": true,
  "data": {
    "period": "LAST_30_DAYS",
    "metrics": {
      "profilesShared": 1000,
      "profilesAccepted": 310,
      "acceptanceRate": 31,
      "avoidableRejectionRate": 35,
      "averageSearchHours": 2,
      "meetingsCompleted": 42
    },
    "funnel": [
      { "stage": "Profiles shared", "value": 1000 },
      { "stage": "Profiles accepted", "value": 310 },
      { "stage": "Contact details shared", "value": 210 },
      { "stage": "Conversations started", "value": 150 },
      { "stage": "Meetings fixed", "value": 75 },
      { "stage": "Meetings completed", "value": 42 }
    ],
    "matchmakers": [],
    "rejectionReasons": [],
    "insights": []
  }
}
```

## 2. Clients list

### `GET /api/clients`

Returns:

```json
{
  "ok": true,
  "data": {
    "clients": [
      {
        "id": "...",
        "name": "Ananya Sharma",
        "city": "Delhi",
        "matchmaker": "Aditi",
        "acceptanceRate": 38,
        "pendingSignals": 2
      }
    ]
  }
}
```

## 3. Client intelligence

### `GET /api/clients/:id`

Return:

```json
{
  "ok": true,
  "data": {
    "client": {},
    "hardPreferences": [],
    "softPreferences": [],
    "signals": [],
    "recentRecommendations": [],
    "behaviorSummary": {}
  }
}
```

## 4. Match queue

### `GET /api/match-queue?clientId=:id`

The route:

1. reads client preferences,
2. loads active profiles,
3. applies eligibility,
4. calculates score,
5. returns eligible profiles sorted descending.

Response:

```json
{
  "ok": true,
  "data": {
    "client": {
      "id": "...",
      "name": "Ananya Sharma"
    },
    "matches": [
      {
        "profile": {},
        "eligible": true,
        "score": 87,
        "label": "Strong fit",
        "breakdown": {
          "preferences": 42,
          "values": 22,
          "history": 15,
          "confidence": 8
        },
        "matched": [],
        "warnings": [],
        "explanation": ""
      }
    ]
  }
}
```

## 5. Save recommendation action

### `POST /api/recommendations`

Body:

```json
{
  "clientId": "...",
  "profileId": "...",
  "action": "SHORTLISTED"
}
```

Allowed actions:

```text
SHORTLISTED
SHARED
ACCEPTED
REJECTED
CONTACT_SHARED
CONVERSATION_STARTED
MEETING_FIXED
MEETING_COMPLETED
```

## 6. Analyze feedback

### `POST /api/feedback/analyze`

Body:

```json
{
  "clientId": "...",
  "recommendationId": "...",
  "feedback": "Nice profile but too traditional for me and Mumbai is difficult."
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "analysis": {
      "decision": "REJECTED",
      "summary": "Lifestyle and location mismatch.",
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
    },
    "newSignals": []
  }
}
```

## 7. Confirm feedback

For a cleaner UX, analysis and persistence can be separated.

### `POST /api/feedback`

Body:

```json
{
  "clientId": "...",
  "recommendationId": "...",
  "rawText": "...",
  "structured": {},
  "wasEdited": false
}
```

This lets the matchmaker edit the AI result before saving.

## 8. Preference signal action

### `PATCH /api/signals/:id`

Body:

```json
{
  "status": "CONFIRMED"
}
```

or:

```json
{
  "status": "DISMISSED"
}
```

If confirming a signal should update a preference, make that an explicit second action in the UI.

Do not silently mutate the client preference.

## 9. Optional preference update

### `PATCH /api/clients/:id/preferences/:preferenceId`

Body:

```json
{
  "type": "SOFT",
  "weight": 0.6,
  "value": {
    "cities": ["Delhi", "Bangalore", "Mumbai"]
  }
}
```

## 10. Route implementation order

Build in this order:

```text
1. GET  /api/dashboard
2. GET  /api/clients/:id
3. GET  /api/match-queue
4. POST /api/recommendations
5. POST /api/feedback/analyze
6. POST /api/feedback
7. PATCH /api/signals/:id
```

Everything else is optional for the assessment.
