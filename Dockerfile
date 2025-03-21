# Deps stage
FROM --platform=linux/amd64 node:19-bullseye-slim AS deps

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --only=production

# Install dev dependencies for build
RUN npm ci

# Builder stage
FROM --platform=linux/amd64 node:19-bullseye-slim AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
RUN npm run build \
    && npm prune --production \
    && rm -rf .next/cache

# Production stage
FROM --platform=linux/amd64 node:19-alpine AS runner

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/package.json ./

EXPOSE 3000

ENV NODE_ENV=production
CMD ["npm", "start"]