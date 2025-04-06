# Multi-stage build for the frontend application

# Base stage for dependencies
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies - this is done in a separate stage so that it can be cached
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Development stage - used when developing locally
FROM base AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Builder stage - build the production application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV NEXT_TELEMETRY_DISABLED 1

# Build the application
RUN npm run build

# Production stage - run the built application
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Add a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copy the built application from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Expose the port the app will run on
EXPOSE 3000

# Set the host and port for the application
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Run the application
CMD ["node", "server.js"]
