# ModelStrike website

Marketing site for **ModelStrike LLC**, an AI automation and custom software development agency (modelstrike.ai).

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4. Runtime dependencies are only `next`, `react`, `react-dom`.

## Commands

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck  # next typegen && tsc --noEmit
npm test           # unit tests for contact validation + rate limiting (node:test)
npm run check      # all of the above + production build
```

## Structure

| Path | Purpose |
| --- | --- |
| `src/content/` | All marketing copy as typed data (`home`, `services`, `industries`, `process`, `about`, `demo`, `site`). Edit copy here. |
| `src/app/` | Routes: `/`, `/services`, `/industries`, `/how-it-works`, `/about`, `/contact`, `/privacy`, plus `sitemap.xml`, `robots.txt`, OG image, icon. |
| `src/components/home/` | `WorkflowVisual` (CSS-only hero diagram) and `AutomationDemo` (interactive, simulated intake demo — fictional data, no AI calls). |
| `src/components/ui/` | `Button`, `Section`/`Container`, `SectionHeader`, `Icon` (inline SVG set). |
| `src/lib/contact/` | Contact form validation, rate limiting and delivery providers. |

Only `MobileNav`, `NavLinks`, `AutomationDemo`, `ContactForm` and `CurrentYear` are client components. Every page is static except `/contact`, which renders per request so the form's availability reflects runtime configuration.

## Contact form

`ContactForm` → `submitContact` Server Action (`src/app/contact/actions.ts`):

1. Honeypot field (bots get a neutral "success"; nothing is delivered)
2. Minimum fill time (3 s)
3. Per-IP rate limit — 5 submissions / 15 min, in memory per instance
4. Server-side validation (`src/lib/contact/schema.ts`)
5. Delivery via the configured provider. Success is shown **only** after the provider accepts the request.
6. Confirmation email to the visitor when `RESEND_API_KEY` + `CONTACT_FROM_EMAIL` are set. It contains none of the submitted text (so the form can't be used to send arbitrary content to arbitrary inboxes). A failed confirmation is logged; the submission still succeeds.

If no provider is configured, the contact page shows that online requests are unavailable and the form is disabled — it never pretends to send.

### Scheduling (Cal.com)

Set `NEXT_PUBLIC_CAL_LINK=modelstrike/30min` (or a full `https://cal.com/...` URL) to add the booking calendar (`src/components/contact/CalEmbed.tsx`, hosted Cal.com inline embed — no API key):

| Delivery configured? | Cal link set? | `/contact` shows |
| --- | --- | --- |
| yes | yes | Form → "Continue to Scheduling" → calendar, prefilled with the visitor's name and email |
| no | yes | Calendar up front (no form) |
| yes | no | Form only |
| no | no | "Temporarily unavailable" notice |

Cal.com origins (`app.cal.com`, `cal.com`) are added to the CSP only when `NEXT_PUBLIC_CAL_LINK` is set. It's a build-time value, so rebuild after changing it. Event title, duration, availability and booking emails are configured in the Cal.com dashboard.

Configure delivery with **one** of:

```bash
# Email via Resend
CONTACT_DELIVERY=resend
RESEND_API_KEY=...
CONTACT_TO_EMAIL=you@yourdomain        # where leads go
CONTACT_FROM_EMAIL="ModelStrike Website <website@yourdomain>"   # verified Resend sender

# …or a webhook (Zapier, Make, n8n, CRM inbound endpoint)
CONTACT_DELIVERY=webhook
CONTACT_WEBHOOK_URL=https://...
CONTACT_WEBHOOK_SECRET=...             # optional; signs the body: X-ModelStrike-Signature: sha256=<hex HMAC>
```

The rate limiter keys on `X-Forwarded-For` / `X-Real-IP`, so run the app behind a reverse proxy that sets (and overwrites) those headers.

## Environment

See `.env.example`. `NEXT_PUBLIC_*` values are baked in at build time; `CONTACT_*` and `RESEND_API_KEY` are runtime secrets read only on the server. Never put a secret in a `NEXT_PUBLIC_*` variable.

## Deployment

The build uses `output: "standalone"`.

**Docker Compose** (recommended)

```bash
cp .env.example .env        # fill in CONTACT_* delivery settings
docker compose up -d --build                    # app only → http://localhost:3000
docker compose --profile proxy up -d --build    # app + Caddy with automatic HTTPS
```

- `web` is published on port `3000` on all interfaces. Requests that skip Caddy and hit `:3000` directly can spoof `X-Forwarded-For` and get around the contact-form rate limit, so block 3000 in your firewall / security group in production unless you need it. It runs as a non-root user with a read-only filesystem, all capabilities dropped, and a health check.
- `caddy` (profile `proxy`) gets TLS certificates for `SITE_DOMAIN` (default `modelstrike.ai`) and redirects `www.` to the apex. Point DNS for both at the server and open ports 80/443 first.
- `.env` is read at runtime for secrets; `NEXT_PUBLIC_*` values in it are passed as build args, so rebuild (`--build`) after changing them.

**Plain Docker**

```bash
docker build -t modelstrike-web .
docker run -p 3000:3000 --env-file .env modelstrike-web
```

**Without Docker**

```bash
npm ci && npm run build
cp -r .next/static .next/standalone/.next/static
node .next/standalone/server.js     # use this rather than `next start` with standalone output
```

**Vercel / other Next.js hosts** work as-is; set the env vars in the host's dashboard.

## Security

`next.config.ts` sets a CSP (no third-party origins), HSTS, `X-Frame-Options: DENY`, `nosniff`, a strict referrer policy and a restrictive `Permissions-Policy` on every route. Submitted content is never rendered as HTML and never logged — delivery errors log only the provider name and error message.

`/security` (from the previous site) permanently redirects to `/about`.
