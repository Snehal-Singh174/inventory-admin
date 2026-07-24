# Inventory Admin Tool — Requirements Index

**Mode:** Greenfield Build (Mode 0)
**Source:** User specification (internal admin tool for inventory management)
**Analysis date:** 2026-07-24
**Status:** Complete

## Document Status

| # | Document | Status | Key contents |
|---|----------|--------|--------------|
| 00 | index.md | ✅ | This file |
| 01 | overview.md | ✅ | Product overview, scope |
| 02 | feature-inventory.md | ✅ | Feature list, site map |
| 03 | data-model.md | ✅ | 6 entities, 2 state machines |
| 04 | permissions.md | ✅ | 2 roles (Viewer, Editor) |
| 05 | user-flows.md | ✅ | Cross-screen journeys, data flow |
| 06 | screens/ | ✅ | 6 screens |
| 07 | integrations.md | ✅ | Export, email notifications (future) |
| 08 | nfr.md | ✅ | Auth, performance, security |
| 09 | tech-stack.md | ✅ | Recommended stack: React + Node.js + PostgreSQL (Supabase) |
| 10 | migration.md | N/A | Greenfield build — no legacy system |
| 11 | agent-architecture.md | N/A | Not an agentic-first build |
| 12 | open-questions.md | ✅ | Open questions requiring business decisions |

## Key Decisions Made
- **[User-stated]** Frontend: React. Backend: Node.js. Database: PostgreSQL (Supabase-hosted).
- **[User-stated]** Two roles only: Viewer (read-only) and Editor (full CRUD). No separate Admin role specified.
- **[Assumed]** Editor role also manages user accounts/role assignment, since no third Admin role was defined — flagged in open questions.
- **[Inferred]** Category and Supplier modeled as normalized reference entities (not free text) to support reliable filtering and reporting.
- **[Assumed]** Soft-delete used for inventory items (`is_deleted` flag) so bulk-delete and audit trail remain reversible/traceable rather than a hard destructive delete.
- **[Inferred]** Session-based JWT authentication with role claim embedded in token, enforced at both UI and API layer.

## Critical Open Questions
- Should there be a third "Admin" role for user/role management, or does Editor own this? — see 12-open-questions.md#1
- Is bulk-delete a soft delete (recoverable) or hard delete? — see 12-open-questions.md#2
- Should audit log be visible to Viewers (read-only) or Editors only? Spec says "viewable by Editors" — confirmed Viewers excluded — see 12-open-questions.md#3

## Confidence Legend
[Observed] Directly seen · [Docs] In documentation · [Inferred] Deduced
[User-stated] User told me · [Assumed] Reasonable default — verify before building
