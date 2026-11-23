# syntax=docker/dockerfile:1

# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Default "/api/v1" is served by the nginx reverse proxy below (same origin, no CORS needed).
# Override with an absolute URL to talk to a backend hosted elsewhere.
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# ---- runtime stage ----
FROM nginxinc/nginx-unprivileged:1.27-alpine
# Files in /etc/nginx/templates are run through envsubst at container start
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# BACKEND_URL: where /api/ is proxied. API_KEY: injected server-side as X-API-Key so it never ships in the JS bundle.
ENV BACKEND_URL=http://backend:8000 \
    DNS_RESOLVER=127.0.0.11 \
    API_KEY=

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1
