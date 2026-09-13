# ==========================================
# Multi-stage Dockerfile: Biga Fleet Manager
# ==========================================

# Stage 1: Build & Compilation
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY .npmrc ./
COPY package*.json ./
COPY prisma.config.ts ./
COPY src/prisma ./src/prisma/

RUN npm ci

COPY . .

RUN npm run build
RUN npm prune --production

# Stage 2: Minimal Production Image
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=2342

RUN apk add --no-cache curl

# Executar como usuário não-root por segurança
USER node

COPY --chown=node:node --from=builder /usr/src/app/package*.json ./
COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist
COPY --chown=node:node --from=builder /usr/src/app/prisma.config.ts ./
COPY --chown=node:node --from=builder /usr/src/app/src/prisma ./src/prisma

EXPOSE 2342

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:2342/health || exit 1

CMD ["node", "dist/main.js"]