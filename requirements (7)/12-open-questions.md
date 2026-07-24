# Open Questions & Decisions Needed

## Resolved Through Reasoning

Decisions I made to keep the spec buildable — please confirm or correct:

| # | Question | Answer applied | Rationale | Confidence | Confirm? |
|---|----------|----------------|-----------|-----------|----------|
| 1 | "category" and "supplier" fields — free text or normalized lookups? | Normalized (Category, Supplier entities) | Ensures consistent filter values; free text would fragment ("Electronics" vs "electronics" vs "Electronic") and break the category filter | High | ✅/❌ |
| 2 | Is bulk-delete a hard or soft delete? | Soft delete (`is_deleted` flag) | Preserves audit trail integrity — an audit log entry pointing to a hard-deleted row with no way to see what it was would be a broken accountability record | High | ✅/❌ |
| 3 | Session/token mechanism for "login-based authentication"? | JWT access + refresh token, bcrypt password hashing | Standard, framework-agnostic approach compatible with stated React + Node.js stack | Medium | ✅/❌ |
| 4 | Pagination style (offset vs cursor)? | Offset-based (page/pageSize) | Simpler to implement "jump to page N" UI expected in a dense admin table; dataset size (tens of thousands of SKUs) doesn't require cursor-based pagination | Medium | ✅/❌ |

## Requires Your Input

Questions that need a business decision:

| # | Question | Type | What I considered | Best guess | What it blocks |
|---|----------|------|----------------|-----------|----------------|
| 1 | Should there be a distinct **Admin** role for user/role management, separate from Editor (full inventory CRUD)? Spec names only Viewer and Editor. | Business decision | Combining user-management with Editor keeps roles simple (2 total) but means any Editor can grant themselves/others Editor access — a broader trust boundary than some orgs want | Editor owns user management (current spec) | 04-permissions.md, 06-screens/user-management.md — if a 3rd role is needed, User Management screen access changes |
| 2 | Should Viewers be able to see the Audit Log in read-only form (without diff detail), or is it fully Editor-only as I've assumed from "Viewable by Editors"? | Business decision | Spec explicitly states "Viewable by Editors in a separate tab" — I read this as excluding Viewers | Audit Log is Editor-only (current spec) | 04-permissions.md, 06-screens/audit-log.md |
| 3 | Is there a data retention / purge policy for the audit log, or should it grow indefinitely? | Business decision | No retention requirement was stated; indefinite retention is the safe default for an accountability system but may need archiving at scale | Indefinite retention (current spec) | 08-nfr.md |
| 4 | Should the "Add Item"/"Invite User" flows send real emails (invite link, password reset), or is manual credential-sharing acceptable for this internal tool? | Business decision / integration scope | No email/notification integration was requested; spec is silent on user provisioning delivery mechanism | Manual temp-password display (no email integration) in current scope; flagged as a future integration in 07-integrations.md | 06-screens/user-management.md, 07-integrations.md |
| 5 | Should low-stock alerting (`reorder_point` field, low-stock badge) trigger any proactive notification (email/Slack), or is the in-app badge sufficient? | Business decision | Not requested in spec; I added the field/badge as a natural extension of "quantity" tracking since inventory tools typically need this, but kept notification delivery out of scope | In-app badge only, no outbound notification | 03-data-model.md (reorder_point field), 07-integrations.md |
