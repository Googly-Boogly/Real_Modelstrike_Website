# ModelStrike website

Marketing site for **ModelStrike LLC**, an AI automation and custom software development agency (modelstrike.ai).

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4. Runtime dependencies are `next`, `react`, `react-dom`, and `openai` (server-only, used by `/demo`).

## Commands

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck  # next typegen && tsc --noEmit
npm test           # unit tests for the contact form and demo engine (node:test)
npm run eval:demo  # accuracy checks against a running server; spends real API credit, see below
npm run check      # all of the above + production build
```

## Structure

| Path | Purpose |
| --- | --- |
| `src/content/` | All marketing copy as typed data (`home`, `services`, `industries`, `process`, `about`, `demo`, `intake-demo`, `intake-previews`, `site`). Edit copy here. |
| `src/app/` | Routes: `/`, `/services`, `/industries`, `/how-it-works`, `/about`, `/demo`, `/contact`, `/privacy`, `POST /api/demo/process`, plus `sitemap.xml`, `robots.txt`, OG image, icon. |
| `src/components/home/` | `WorkflowVisual` (CSS-only hero diagram) and `AutomationDemo` (interactive, simulated intake demo — fictional data, no AI calls). |
| `src/components/ui/` | `Button`, `Section`/`Container`, `SectionHeader`, `Icon` (inline SVG set). |
| `src/components/demo/` | `IntakeDemo` (state and layout), `useIntakeRun` (streaming client), `DemoPanels` (workflow stages). |
| `src/lib/contact/` | Contact form validation, rate limiting and delivery providers. |
| `src/lib/intake/` | The `/demo` engine: industry configs, validation, business rules, grounding checks, prompts, pipeline, budget, and the server-only model call. |

Only `MobileNav`, `NavLinks`, `AutomationDemo`, the `/demo` components, `ContactForm` and `CurrentYear` are client components. Every page is static except `/contact` and `/demo`, which render per request so they reflect runtime configuration.

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

## AI customer intake demo (`/demo`)

```text
IntakeDemo → POST /api/demo/process (streams one NDJSON event per finished stage)
  1. Received        origin, size, validation, budget, concurrency and rate-limit checks
  2. Extraction      model call → schema check → grounding check (grounding.ts)
  3. Classification  deterministic rules, no model call (rules.ts)
  4. Draft           model call → schema check → draft guard, one corrected retry (grounding.ts)
  5. Human review    browser only: approve, edit, reject or request revision
```

- **Adding an industry:** add an entry to `src/lib/intake/industries.ts`. The prompt, output schema, rules and UI derive from it. Add a preview in `src/content/intake-previews.ts` if it has a sample; a test requires one.
- **What's AI and what's code:** the model extracts fields, summarizes and drafts. Priority, routing, missing information and next action are decided by `rules.ts`. A safety keyword match raises priority even if the model missed it. Priority is labelled a proposal, never a safety assessment.
- **Grounding:** a verbatim field, email or phone the message doesn't contain becomes "Not provided". Drafts with invented prices, appointments, promises, contact details, links or placeholders get one corrected retry and are otherwise not shown.
- **Provider:** OpenAI `gpt-6-luna` through the Responses API with strict structured outputs and `store: false`, in `ai.ts`, the only file that knows the provider.
- **Prompt injection:** the model gets no tools. Each call is text in, schema-checked JSON out. Visitor text sits in a tag with a random per-request name, and the drafting call sees only the validated record. Nothing in this path can send email, fetch URLs or reach the contact form, a CRM or the sales system.
- **Live vs. preview:** with `OPENAI_API_KEY` set, results are always from the model. Without it, or after a failure, visitors can choose a precomputed sample labelled "Example Preview — Not Live AI Processing". It is always for the original sample text, and is never substituted silently.
- **Nothing is sent:** the review buttons only change on-page state.

### Cost and abuse controls

| Control | Default | Where |
| --- | --- | --- |
| Daily spending ceiling (reserve worst case before each call, settle to actual usage, survives restarts) | `DEMO_DAILY_BUDGET_USD=5` | `budget.ts`, `pipeline.ts` |
| Per-IP limit | `DEMO_IP_LIMIT=8` per 10 min | `runtime.ts` |
| Site-wide limit | `DEMO_HOURLY_LIMIT=200` per hour | `runtime.ts` |
| Runs in flight, one per IP; excess refused, not queued | `DEMO_MAX_CONCURRENCY=4` | `budget.ts` |
| Input | 3,000 characters, 16 KB body | `schema.ts` |
| Output | 4,000 / 3,000 tokens per call | `pipeline.ts` |
| Time | 25 s per call, one SDK retry, 60 s per run; cancelled if the visitor leaves | `ai.ts`, `route.ts` |
| Same-origin JSON POST only | always | `route.ts` |

Limits are per instance. `pricing` in `pipeline.ts` holds the `gpt-6-luna` list prices; update it if the model or its prices change. Set a project budget in the OpenAI dashboard as a backstop.

### Monitoring and privacy

Each run logs one aggregate line, and each refused request one `denied` line:

```text
[demo] run outcome=completed industry=hvac ms=4210 usd=0.0312 spent_today=1.2040 dropped_fields=0
[demo] denied reason=rate_limited
```

`docker compose logs web | grep '\[demo\]'` shows usage, failures and limit hits. A rising `dropped_fields` means the model is inventing values. Message text, results, and IP addresses are never logged, stored, emailed or sent to analytics; IPs exist only in the in-memory rate limiter. The site has no analytics service, so there is no client-side event tracking (see the privacy policy).

### Checking accuracy with a real model

`scripts/demo-eval.mjs` sends fixed test messages through a running server and fails on invented details, broken promises or missed urgency. Each case costs real API credit.

```bash
OPENAI_API_KEY=... DEMO_IP_LIMIT=100 npm run dev
npm run eval:demo                       # defaults to http://localhost:3000
```

## Environment

See `.env.example`. `NEXT_PUBLIC_*` values are baked in at build time; `CONTACT_*`, `RESEND_API_KEY`, `OPENAI_API_KEY` and `DEMO_*` are runtime values read only on the server. Never put a secret in a `NEXT_PUBLIC_*` variable.

## Deployment

The build uses `output: "standalone"`.

**Docker Compose** (recommended)

```bash
cp .env.example .env        # fill in CONTACT_* delivery settings and OPENAI_API_KEY
docker compose up -d --build                    # app only → http://localhost:3000
docker compose --profile proxy up -d --build    # app + Caddy with automatic HTTPS
```

- `web` is published on port `3000` on all interfaces. Requests that skip Caddy and hit `:3000` directly can spoof `X-Forwarded-For` and get around the per-IP rate limits (the demo's site-wide limits and budget still apply), so block 3000 in your firewall / security group in production unless you need it. It runs as a non-root user with a read-only filesystem, all capabilities dropped, and a health check.
- `caddy` (profile `proxy`) gets TLS certificates for `SITE_DOMAIN` (default `modelstrike.ai`) and redirects `www.` to the apex. Point DNS for both at the server and open ports 80/443 first.
- `demo_data` is a named volume holding the demo's daily spend, so restarts don't reset the budget.
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

`next.config.ts` sets a CSP (no third-party origins except Cal.com when configured), HSTS, `X-Frame-Options: DENY`, `nosniff`, a strict referrer policy and a restrictive `Permissions-Policy` on every route. Submitted content is never rendered as HTML and never logged — delivery errors log only the provider name and error message.

`/security` (from the previous site) permanently redirects to `/about`.
