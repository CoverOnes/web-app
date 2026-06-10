# syntax=docker/dockerfile:1
# CoverOnes web-app — multi-stage build for local dev-stack.
# Build arg VITE_API_BASE_URL is baked into the static bundle at build time.
# Production: inject the real gateway URL; dev: http://localhost:8080 (default).

# ─── Build stage ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Accept gateway URL as build arg (injected by docker-compose via args:)
ARG VITE_API_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

COPY . .
RUN npm run build

# ─── Runtime stage (nginx unprivileged) ─────────────────────────────────────
# nginx:unprivileged listens on port 8080 and owns its cache dirs — no root needed.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

# Minimal SPA-friendly nginx config on port 8080 (unprivileged default).
# Security headers included per five-army audit (Major finding — Dockerfile:26-34).
# HSTS is intentionally omitted here: this container sits behind a TLS-terminating
# reverse proxy / CDN in production; Strict-Transport-Security MUST be added at
# that terminator (e.g. AWS ALB, Cloudflare, or the gateway nginx), not here,
# because this server speaks plain HTTP inside the container network.
RUN printf 'server {\n\
    listen 8080;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    # ── Security response headers ──────────────────────────────────────\n\
    # Prevent framing / clickjacking (defence-in-depth alongside CSP frame-ancestors)\n\
    add_header X-Frame-Options "SAMEORIGIN" always;\n\
    # Prevent MIME-type sniffing (critical for uploaded-content paths)\n\
    add_header X-Content-Type-Options "nosniff" always;\n\
    # Limit referrer leakage from the SPA to third-party origins\n\
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;\n\
    # Baseline CSP: allow same-origin resources + the configured API gateway.\n\
    # connect-src includes localhost for local dev; tighten to gateway domain in prod.\n\
    # NOTE: inline styles are used extensively (React style props) — unsafe-inline\n\
    # for style-src is necessary until CSS-in-JS is migrated to Tailwind classes.\n\
    add_header Content-Security-Policy "default-src '\''self'\''; script-src '\''self'\''; style-src '\''self'\'' '\''unsafe-inline'\''; img-src '\''self'\'' data: https:; font-src '\''self'\'' data:; connect-src '\''self'\'' http://localhost:8080 https:; frame-ancestors '\''self'\''; object-src '\''none'\'';" always;\n\
    # Disable legacy browser features not used by this SPA\n\
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;\n\
\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
