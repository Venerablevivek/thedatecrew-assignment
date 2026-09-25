# Feature shortlist for the next iteration

Research reviewed 24 September 2026. These are proposals, not implemented features. Priority reflects this prototype and the two-day submission deadline, not measured customer demand. Existing feedback analysis, reviewed learning signals, eligibility checks and ranking explanations are already present and are not counted as new features.

## Recommended shortlist

| Priority | Feature | Smallest useful version | Why it matters | Scope |
| --- | --- | --- | --- | --- |
| 1 | Compare shortlisted profiles | Select two or three profiles; compare preferences, conflicts, missing information and score explanations in aligned rows. | Reduces repeated opening and remembering profiles during a decision. | Small–medium |
| 2 | Needs-attention board | Show overdue responses, incomplete profiles and unreviewed signals; link to the appropriate action. Start with explicit rules and manual due dates. | Gives a beginner a concrete next action. | Medium |
| 3 | Preference what-if preview | Temporarily adjust soft preferences and see the resulting ranking and pool changes. Label as simulation; save nothing without a separate confirmed action. Keep hard constraints locked. | Makes trade-offs understandable without silently changing the client's requirements. | Medium |
| 4 | Measure actual search effort | Explicit start/pause/finish of a search session; record active minutes, profiles reviewed and decisions. Separate observed results from the assessment baseline. | Tests whether the product addresses the reported two-hour search problem. | Medium |
| 5 | AI introduction draft | Draft a concise introduction using verified profile facts and reasons for suitability; show supporting facts; human edits and copies the message. | Adds a useful AI task at a real workflow step. No automatic sending or invented personal claims. | Small–medium |
| 6 | Client feedback link | A private, expiring link for accept/decline/unsure, structured reasons and optional text; staff reviews before preference changes. | Captures clearer feedback closer to the decision. Requires access controls and token handling. | Medium–large |
| 7 | Meeting coordination | Start with availability and follow-up dates; later connect calendars for booking, rescheduling and reminders. | Addresses friction after an introduction is accepted. | Medium manually; large integrated |
| 8 | Two-sided compatibility | Check both people's stated requirements and current willingness to receive introductions. Display missing reciprocal data explicitly. | Matching people requires considering both sides. Requires additional data; avoid presenting a score as the probability of a relationship. | Large |

Scope estimates are relative engineering judgments, not delivery commitments. For the deadline, select at most two: comparison plus a what-if preview for a strong product demonstration, or comparison plus effort measurement for stronger evidence of operational impact. Stabilize and rehearse the existing end-to-end demo before expanding scope.

## Research and its limits

- [Nielsen Norman Group: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) recommends deferring advanced controls to secondary views to keep common tasks simple. Apply this to an on-demand comparison view and an optional simulation panel, rather than adding everything to the overview. This is general UX guidance, not testing of this product.
- [HubSpot: Create and edit sequences](https://knowledge.hubspot.com/sequences/create-and-edit-sequences) documents task reminders and follow-up sequences. This supports a practical task-and-follow-up pattern for the needs-attention board; vendor capabilities do not establish matchmaking outcomes.
- [Calendly: Scheduling](https://calendly.com/scheduling) documents availability, multi-person meeting types, calendar connections, reminders and follow-ups. These are useful reference capabilities for coordination after acceptance, not a reason to build a full scheduler in the MVP.
- [Xia et al.: Reciprocal Recommendation System for Online Dating (2015)](https://arxiv.org/abs/1501.06247) treats dating recommendations as reciprocal rather than ordinary user-item recommendations and evaluates approaches on a dating dataset. It motivates checking both sides. Its reported results do not transfer directly to this dataset or human-led matchmaking service.

The feature priorities and implementation sketches above are our product-design inferences from the current workflow, assessment constraints and these references. No acceptance uplift, time saving or model accuracy is claimed without measuring it in this application.

## Implementation update — September 25, 2026

The user selected comparison, soft-preference what-if previews, introduction drafts, meeting coordination, and two-sided compatibility. These five MVP versions are now implemented. See the README's Matchmaker tools section for workflows and boundaries. The original shortlist above remains the research record; its "not implemented" statement describes the state at the time of research, not this update.
