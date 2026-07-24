# Developer Guide: Auth Module

## Architecture

### API Client (`src/utils/api-client.js`)
Central fetch utility wrapping all HTTP requests with:
- 10-second AbortController timeout
- 2-retry exponential backoff (500ms, 1000ms)
- Automatic Bearer token attachment from localStorage
- 4xx errors thrown immediately (no retry)
- 5xx/network errors retried

### Auth Context (`src/context/auth-context.jsx`)
React Context providing:
- `user` — current user object `{id, email, fullName, role}`
- `token` — current access token
- `isAuthenticated` — boolean derived from token + user
- `isLoading` — boolean during login API call
- `login(email, password)` — returns `{success, error?, status?}`
- `logout()` — clears session, calls server logout

Storage keys: `inventrack_access_token`, `inventrack_refresh_token`, `inventrack_user`

### Protected Route (`src/components/ProtectedRoute.jsx`)
Wraps any route that requires authentication. Redirects to `/login` with `state.from` for post-login redirect.

### AppLayout (`src/components/AppLayout.jsx`)
Shell with:
- **Sidebar** (desktop): 240px expanded / 64px collapsed, role-aware nav items
- **Mobile nav**: slide-in drawer from left
- **Topbar**: user dropdown with sign-out action

Role-aware navigation:
- **All roles:** Dashboard, Inventory
- **Editor only:** Audit Log, Users

## Routes
| Path | Component | Auth Required |
|------|-----------|:---:|
| `/login` | LoginPage | No |
| `/dashboard` | DashboardPage | Yes |
| `/inventory` | DashboardPage (placeholder) | Yes |
| `/audit-log` | DashboardPage (placeholder) | Yes |
| `/users` | DashboardPage (placeholder) | Yes |
| `/` | Redirect → `/dashboard` | — |

## Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Editor | editor@inventrack.dev | Editor123! |
| Viewer | viewer@inventrack.dev | Viewer123! |

## Environment Variables
| Key | Purpose |
|-----|---------|
| `VITE_API_URL` | Backend base URL for API requests |
