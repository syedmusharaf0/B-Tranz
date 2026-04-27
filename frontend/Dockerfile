# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files first (better Docker layer caching)
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install dependencies
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install --frozen-lockfile; \
  else npm install; \
  fi

# Copy source code
COPY . .

# Build the app (works for Next.js and Vite/CRA)
RUN npm run build

# ── Stage 2: Production server ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# ── For Next.js ───────────────────────────────────────────────────────────────
# Copy the standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]

# ── ALTERNATIVE: For Vite / Create React App ──────────────────────────────────
# If your frontend is Vite or CRA, comment out the Next.js block above
# and uncomment the block below:
#
# RUN npm install -g serve
# COPY --from=builder /app/dist ./dist
# EXPOSE 3000
# CMD ["serve", "-s", "dist", "-l", "3000"]