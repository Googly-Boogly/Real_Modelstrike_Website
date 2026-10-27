# syntax=docker/dockerfile:1
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app
# Public, build-time values (baked into the client bundle).
ARG NEXT_PUBLIC_SITE_URL=https://modelstrike.ai
ARG NEXT_PUBLIC_CONTACT_EMAIL=
ARG NEXT_PUBLIC_CAL_LINK=
ARG CSP_SCRIPT_SRC=
ARG CSP_CONNECT_SRC=
ARG CSP_FRAME_SRC=
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_CONTACT_EMAIL=$NEXT_PUBLIC_CONTACT_EMAIL \
    NEXT_PUBLIC_CAL_LINK=$NEXT_PUBLIC_CAL_LINK \
    CSP_SCRIPT_SRC=$CSP_SCRIPT_SRC \
    CSP_CONNECT_SRC=$CSP_CONNECT_SRC \
    CSP_FRAME_SRC=$CSP_FRAME_SRC \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
USER app
EXPOSE 3000
# CONTACT_* / RESEND_API_KEY are runtime secrets: pass them with --env-file, never as build args.
CMD ["node", "server.js"]
