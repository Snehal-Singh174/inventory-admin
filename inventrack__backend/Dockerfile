# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-slim AS builder

# openssl is required by Prisma's query engine
RUN apt-get update -qq && apt-get install -y --no-install-recommends \
    openssl python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:22-slim AS runner

RUN apt-get update -qq && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

ENV NODE_ENV=production
ENV PORT=4010

EXPOSE 4010

# Push schema then start (safe: db push is idempotent)
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/server.js"]
