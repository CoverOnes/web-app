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

# ─── Runtime stage (nginx) ───────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Minimal SPA-friendly nginx config
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx config: serve index.html for unknown paths (React Router / SPA)
RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

USER nginx

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
