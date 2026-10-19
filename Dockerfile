# The website as a container: built with Node, served by an unprivileged nginx on port 8080.
#
#   check    type-checks, lints and runs the unit tests (CI builds this stage; nothing from it is kept)
#   runtime  the static build behind nginx (deploy/nginx.conf), which also proxies the public website API
#
# Build: docker build -t id-indetails-website .
# Run:   docker run --rm -p 8080:8080 --read-only --tmpfs /tmp id-indetails-website

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM deps AS check
COPY . .
RUN npm run typecheck && npm run lint && npm test

FROM deps AS build
COPY . .
# Where the browser calls the API; empty keeps the same-origin default (/api/public/website, proxied by nginx).
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
