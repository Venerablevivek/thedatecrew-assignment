# Design Specification

## 1. Design direction

The interface should feel:

- premium,
- calm,
- human,
- intelligent,
- private,
- editorial rather than overly technical.

This is **not** a dating app UI.

Avoid:

- swipe-card metaphors,
- neon dating-app gradients,
- excessive hearts,
- dark dashboards,
- gaming-style scores,
- robot/AI imagery.

The product is an internal matchmaker workspace.

## 2. Visual concept

**Warm Intelligence**

A soft light interface that combines premium matchmaking with modern analytics.

### Palette

```text
App background       #FBFAF8  Warm Ivory
Surface              #FFFFFF  White
Surface secondary    #F6F3F1  Soft Stone

Primary text         #1F2937  Deep Ink
Secondary text       #667085  Slate

Primary              #6D5DFB  Refined Violet
Primary hover        #5B4BE7

Accent rose          #E7829A
Accent soft rose     #FCEEF2

Insight lavender     #F1EEFF
Insight border       #DCD6FF

Success              #2F9E72
Success background   #EAF8F2

Warning              #C78B36
Warning background   #FFF6E8

Danger               #D65C69
Danger background    #FDEEEF

Border                #E9E5E2
```

### Optional hero/accent gradient

```css
background:
  linear-gradient(
    135deg,
    #6D5DFB 0%,
    #8B78F6 48%,
    #E7829A 100%
  );
```

Use this sparingly.

## 3. Typography

Use `Geist` through `next/font` if convenient.

Fallback:

```css
font-family:
  Inter,
  ui-sans-serif,
  system-ui,
  sans-serif;
```

Hierarchy:

```text
Page title      30–34px / 700
Section title   20–22px / 650
Card title      15–16px / 600
Body            14px / 400
Small label     12px / 500
Metric          28–36px / 700
```

Avoid all-uppercase headings except tiny metadata labels.

## 4. Layout

Desktop-first assessment prototype.

```text
┌─────────────┬────────────────────────────────────────┐
│             │ Header                                 │
│  Sidebar    ├────────────────────────────────────────┤
│             │                                        │
│             │ Main workspace                         │
│             │                                        │
└─────────────┴────────────────────────────────────────┘
```

Sidebar width: `240px`

Main content max width: `1440px`

Page padding:

```text
Desktop  28–32px
Tablet   20–24px
Mobile   16px
```

## 5. Sidebar

Items:

```text
TDC Match Intelligence

Overview
Clients
Match Queue
Feedback Intelligence
```

Bottom:

```text
Demo Matchmaker
Internal Prototype
```

Selected item:

- soft lavender background,
- primary violet icon,
- deep text,
- rounded 12px.

## 6. Dashboard page

### Header

Left:

```text
Match Intelligence
A clearer view of matchmaking quality and client signals.
```

Right:

```text
Last 30 days
```

### KPI cards

Four cards in one row:

1. Profile Acceptance
2. Avoidable Rejections
3. Avg Search Time
4. Meetings Completed

Example:

```text
Profile Acceptance
31.0%
↑ +4.2 pts vs previous period
```

Cards should have:

- white surface,
- thin border,
- 16px radius,
- very soft shadow,
- no giant colored backgrounds.

### Funnel

Use a clean horizontal/vertical funnel.

Show:

```text
Shared       1,000
Accepted       310   31%
Contacts       210   67.7%
Conversations  150   71.4%
Meetings fixed  75   50%
Completed       42   56%
```

Highlight the first drop-off.

### AI insight card

Create a visually distinct lavender card:

```text
AI Opportunity

~242 rejected recommendations may have been avoidable
because the rejection reason was already present in the
client's known preferences.

Prioritize deal-breaker checking before profile sharing.
```

This should be the strongest card on the dashboard.

## 7. Client Intelligence page

Header:

```text
← Clients

Ananya Sharma
29 • Product Manager • Delhi
Managed by Matchmaker A
```

Tabs:

```text
Intelligence
Recommendations
Feedback
```

### Intelligence layout

Left 2/3:

- hard deal-breakers,
- soft preferences,
- recent recommendation history.

Right 1/3:

- learned signals,
- contradiction cards,
- profile completeness.

### Hard preference chips

Example:

```text
Non-smoker       Strict
Wants children   Strict
Age 29–35        Strict
```

Use neutral chips with a small lock icon.

### Learned signal card

```text
Potential blind spot

Location may be more flexible than stated.

Stated:
Delhi NCR preferred

Observed:
3 of the last 5 accepted profiles were outside Delhi.

Confidence
80%

[Keep current preference]
[Mark as flexible]
```

Never say:

```text
AI changed your preference.
```

The human confirms.

## 8. Match Queue page

Top controls:

```text
Client: Ananya Sharma      Eligible only ✓
Sort: Best match
```

Use vertically stacked candidate cards instead of a dense spreadsheet for the demo.

### Candidate card

```text
Rahul Mehra                         87
32 • Founder • Gurgaon          Strong fit

✓ Passes all deal-breakers

Why this match
Strong alignment on family values, career ambition,
relationship intent and lifestyle.

Score breakdown
Preferences     42/45
Values          22/25
History         15/20
Confidence       8/10

Watch
Relocation preference is unclear.

[Reject]              [Shortlist]
```

Score UI should not dominate the human story.

Use labels:

```text
Strong fit
Worth reviewing
Mixed signals
```

Avoid pretending the score is an objective compatibility truth.

## 9. Feedback modal

Triggered from `Reject`.

```text
Why wasn't this profile a fit?

[ free-text textarea ]

"Nice profile but too traditional for me,
and Mumbai makes things difficult."

[Analyze feedback]
```

After analysis:

```text
We interpreted:

Lifestyle
Traditional lifestyle
Medium confidence

Location
Geographic mismatch
Medium confidence
Known preference

Potential preference signal
Location has appeared in 3 recent decisions.

[Edit]
[Confirm & save]
```

The matchmaker can edit AI output before saving.

## 10. Feedback Intelligence page

Show:

### Rejection categories

Bar chart:

```text
Location
Lifestyle
Smoking
Career
Children
Family
Other
```

### Avoidable rejection card

```text
35%

of rejected profiles referenced a preference that was
already known before the recommendation was made.
```

### Repeated client signals

Table:

```text
Client      Signal              Occurrences   Status
Ananya      Location flexible   4             Review
Rohan       Career mismatch     3             Review
Maya        Smoking             5             Confirmed
```

## 11. Motion

Keep motion minimal.

Use:

- 150–200ms hover transitions,
- subtle card lift,
- progress animation for score bars,
- skeleton states while AI analysis runs.

Avoid:

- bouncing,
- large page transitions,
- animated gradients,
- auto-playing effects.

## 12. Components

Recommended component set:

```text
AppShell
Sidebar
PageHeader
MetricCard
FunnelChart
InsightCard
ClientHeader
PreferenceChip
SignalCard
CandidateCard
ScoreBreakdown
FeedbackModal
EmptyState
LoadingSkeleton
StatusBadge
```

## 13. Responsive behavior

The assessment will likely be viewed on desktop, so prioritize desktop polish.

Still ensure:

- sidebar collapses on smaller screens,
- KPI cards wrap,
- candidate cards stay readable,
- tables become scrollable,
- dialogs fit mobile height.

## 14. UX principle

Every AI output must answer:

```text
What did the system observe?
Why does it matter?
What can the matchmaker do?
```

Example:

Bad:

> AI confidence: 82%.

Good:

> Location may be more flexible than originally stated. The client accepted 3 of the last 5 profiles outside Delhi. Review whether location should remain a strong preference.

That is the UI tone throughout the product.
