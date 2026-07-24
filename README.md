# InvenTrack — Inventory Management System

A full-stack inventory management application with a React frontend, Node.js/Express backend, and PostgreSQL database.

## Project Structure

```
inventory-admin/
├── render.yaml                  # Render Blueprint (deploys all three services)
├── inventrack__frontend/        # React + Vite + Tailwind CSS
├── inventrack__backend/         # Node.js + Express + Prisma ORM
└── inventrack__database/        # Docker Compose config for local Postgres
```

---

## Deploy to Render (one-click Blueprint)

### Prerequisites
- A [Render](https://render.com) account
- This repository pushed to GitHub or GitLab

### Steps

1. **Push the repository** to GitHub / GitLab (the entire `inventory-admin` folder must be the repo root).

2. **Create a new Blueprint** on Render:
   - Go to [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**
   - Connect your repository
   - Render will detect `render.yaml` automatically

3. **Apply the Blueprint** — Render will create:
   | Service | Type | Plan |
   |---|---|---|
   | `inventrack-db` | PostgreSQL | Free |
   | `inventrack-backend` | Web Service (Docker) | Free |
   | `inventrack-frontend` | Static Site | Free |

4. **Wait for the first deploy** (~5–8 min for the Docker build).  
   The backend runs `prisma db push` on startup to create tables, then seeds demo data automatically.

5. **Open the frontend URL** shown in the Render dashboard — the app is live!

### Environment Variables

All variables are wired automatically via `render.yaml`. If you need to override any, go to the service's **Environment** tab in the Render dashboard.

| Variable | Service | Description |
|---|---|---|
| `DATABASE_URL` | Backend | Auto-injected from the linked Postgres DB |
| `JWT_SECRET` | Backend | Auto-generated on first deploy |
| `JWT_REFRESH_SECRET` | Backend | Auto-generated on first deploy |
| `CORS_ORIGIN` | Backend | Auto-set to the frontend's `.onrender.com` URL |
| `VITE_API_URL` | Frontend | Auto-set to the backend's `.onrender.com` URL |

> **Important:** After the first deploy, copy the auto-generated `JWT_SECRET` and `JWT_REFRESH_SECRET` values and store them somewhere safe. If the service redeploys and they regenerate, existing sessions will be invalidated.  
> To prevent this, replace `generateValue: true` in `render.yaml` with your own fixed secret values.

---

## Run Locally (Docker Compose)

All three services have individual `docker-compose.yml` files that share a Docker network.

```bash
# 1. Start the database
cd inventrack__database
cp .env.example .env          # fill in POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
docker compose up -d

# 2. Start the backend
cd ../inventrack__backend
cp .env.example .env          # set DATABASE_URL to match step 1
docker compose up -d

# 3. Start the frontend
cd ../inventrack__frontend
cp .env.example .env          # set VITE_API_URL=http://localhost:4010
docker compose up -d
```

| Service | Local URL |
|---|---|
| Frontend | http://localhost:4020 |
| Backend API | http://localhost:4010/api/health |
| PostgreSQL | localhost:4000 |

---

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Redux Toolkit, Recharts
- **Backend:** Node.js, Express, TypeScript, Prisma ORM
- **Database:** PostgreSQL 16
- **Deployment:** Render (Blueprint)
