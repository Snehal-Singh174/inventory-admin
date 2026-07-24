# Non-Functional Requirements

| Requirement | Specification | Source |
|-------------|--------------|--------|
| Authentication | Login-based (email + password). JWT access token (short-lived, 15 min) + refresh token (7 days) stored httpOnly cookie or secure storage. Passwords hashed with bcrypt (cost factor 12). | User-stated + Inferred |
| Authorization | Role claim (`Viewer`/`Editor`) embedded in JWT, re-validated server-side on every request via middleware. UI hides unauthorized actions; API is the enforced boundary. "Role enforcement on all routes" per spec. | User-stated |
| Session management | Refresh token rotation on use; sessions table allows "logout all devices." Idle session timeout after 30 min of inactivity `[Assumed]`. | Inferred |
| Performance | Inventory list API responds < 300ms for up to 10,000 items with pagination (page size 25/50/100). Export generation for filtered view < 5s for up to 50,000 rows. | Assumed |
| Data integrity | All bulk operations (bulk delete, bulk status update) are transactional — either all rows succeed or none do (no partial bulk failure). | Inferred from "bulk actions" requirement |
| Audit integrity | Audit log records are append-only and immutable — no UPDATE or DELETE permitted at the application or DB-role level, including for Editors. | User-stated (implies trustworthy trail) |
| Security | All traffic over HTTPS. SQL injection prevented via parameterized queries/ORM (Prisma). Rate-limit login endpoint (5 attempts/15 min per IP) to deter brute force. Input sanitized before Excel export to prevent formula injection in .xlsx cells. | Assumed |
| Accessibility | WCAG 2.1 AA — minimum 4.5:1 contrast, keyboard-navigable table and modal, ARIA roles on custom dropdowns/modals, visible focus rings. | Assumed |
| Compliance | No specific regulatory framework named. Since this handles internal cost/supplier data (potentially sensitive business data), role-based access control and audit trail double as a lightweight internal compliance control. | Inferred |
| Browser support | Latest 2 versions of Chrome, Edge, Firefox, Safari (desktop-first — internal admin tool, dense table UI not optimized for mobile). | Assumed |
| Scalability | Designed for tens of internal users, tens of thousands of SKUs. No horizontal scaling requirement at this scope; single Node.js instance + managed Postgres sufficient. | Assumed |
| Availability | Standard business-hours availability target (99% uptime) — not a customer-facing SLA-bound system. | Assumed |
| Data retention | Inventory soft-deletes retained indefinitely for audit trail continuity; audit log retained indefinitely (no purge policy defined — flagged in open questions). | Inferred |
