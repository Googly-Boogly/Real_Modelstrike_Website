# ModelStrike website

Marketing site for **ModelStrike LLC**, an AI automation and custom software development agency (modelstrike.ai).

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4. Runtime dependencies are `next`, `react`, `react-dom`, and `openai` (server-only, used by `/demo`).

## Commands

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck  # next typegen && tsc --noEmit
npm test           # unit tests: contact form, demo engine, workflow, ROI, tour (node:test)
npm run eval:demo  # accuracy checks against a running server; spends real API credit, see below
npm run check      # all of the above + production build
```

## Structure

| Path | Purpose |
| --- | --- |
| `src/content/` | All marketing copy as typed data (`home`, `services`, `industries`, `process`, `about`, `demo`, `intake-demo`, `intake-previews`, `site`). Edit copy here. |
| `src/app/` | Routes: `/`, `/services`, `/industries`, `/how-it-works`, `/about`, `/demo`, `/contact`, `/privacy`, `POST /api/demo/process`, `POST /api/demo/draft`, plus `sitemap.xml`, `robots.txt`, OG image, icon. |
| `src/components/home/` | `WorkflowVisual` (CSS-only hero diagram) and `AutomationDemo` (interactive, simulated intake demo — fictional data, no AI calls). |
| `src/components/ui/` | `Button`, `Section`/`Container`, `SectionHeader`, `Icon` (inline SVG set). |
| `src/components/demo/` | `DemoExperience` (layout, mobile steps), dashboard panels, `GuidedDemo`, `ROICalculator`, `ConsultationCTA`, `useDemoWorkflow` + `demoApi` (API client). |
| `src/lib/demo/` | Pure, tested demo logic: workflow state machine, ROI formulas, guided-tour steps. |
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

## AI automation demo (`/demo`)

Demo 2.0: an interactive automation dashboard for three industries (HVAC, accounting, property management), a business value calculator, a guided tour, and the consultation CTA.

```text
DemoExperience (client)
  IndustrySelector → resets the workflow and swaps inbox, terminology, record fields, categories and reply sign-off
  CustomerInbox / CustomerMessage / CustomRequestForm      left column
  AIProcessingPanel (5 stages)                             middle column
  CustomerRecord ("Demo CRM — Simulated Record")           right column
  ResponseApproval (edit / approve / reject / regenerate)  below; all actions simulated
  GuidedDemo (6-step spotlight tour; ← → Esc)
ROICalculator, ConsultationCTA                             further down the page

POST /api/demo/process   streams one NDJSON event per finished stage
  1. Read request    origin, size, validation, budget, concurrency and rate-limit checks
  2. Extraction      model call → schema check → grounding check (grounding.ts)
  3. Classification  deterministic, per-industry rules, no model call (rules.ts)
  4. Record          built in the browser from stages 2–3 (simulated CRM)
  5. Draft           model call → schema check → draft guard, one corrected retry (grounding.ts)
POST /api/demo/draft     "Regenerate": re-validates and re-grounds the submitted extraction, then one more guarded draft
```

- **State:** `src/lib/demo/workflow.ts` is a pure reducer (`idle → request_selected → processing → review_ready → approved/rejected`, plus `error`). Every run has an id; events from a superseded run (reset, industry switch, reprocessing) are ignored. One run at a time; each inbox item keeps its own result. `useDemoWorkflow` adds the fetches and cancellation.
- **Adding an industry:** add an entry to `src/lib/intake/industries.ts` (fields, categories, priority rules, terms, signature, ≥3 inbox samples) and a precomputed extraction per sample in `src/content/intake-previews.ts`. Tests require both.
- **Sender fields:** optional name, email and subject are validated and composed into an email-style text (`composeInquiry`), so they are grounded like anything else the customer wrote.
- **What's AI and what's code:** the model extracts fields, summarizes and drafts. Priority, routing, missing information, escalation and next action are decided by `rules.ts` using each industry's `priority` rules (e.g. HVAC: outage + vulnerable person → Immediate Review; accounting: a stated deadline → Review Soon). A safety keyword always forces Immediate Review.
- **Grounding:** a verbatim field, email or phone the message doesn't contain becomes "Not provided". Drafts with invented prices, appointments, promises, contact details, links or placeholders get one corrected retry and are otherwise not shown.
- **Provider:** OpenAI `gpt-6-luna` through the Responses API with strict structured outputs and `store: false`, in `ai.ts`, the only file that knows the provider.
- **Prompt injection:** the model gets no tools. Each call is text in, schema-checked JSON out. Visitor text sits in a tag with a random per-request name, and the drafting call sees only the validated record. Nothing in this path can send email, fetch URLs or reach the contact form, a CRM or the sales system.
- **Live vs. simulated:** with `OPENAI_API_KEY` set, results are always from the model. Without it, or after a failure, sample requests can show a precomputed extraction (real rules, deterministic template reply from `templates.ts`) labelled "Simulated example — not live AI processing". Custom messages are never simulated, and regeneration is off in simulated mode.
- **Nothing is sent:** approve, reject and edit only change on-page state; the record is labelled as a simulated Demo CRM record.
- **Booking:** CTAs use `booking` from `src/content/site.ts` (`NEXT_PUBLIC_CAL_LINK`, falling back to `/contact`).

### Cost and abuse controls

| Control | Default | Where |
| --- | --- | --- |
| Daily spending ceiling (reserve worst case before each call, settle to actual usage, survives restarts) | `DEMO_DAILY_BUDGET_USD=5` | `budget.ts`, `pipeline.ts` |
| Per-IP limit (processing and regenerating both count) | `DEMO_IP_LIMIT=8` per 10 min | `runtime.ts` |
| Regenerations per request, in the browser | 3 | `workflow.ts` |
| Site-wide limit | `DEMO_HOURLY_LIMIT=200` per hour | `runtime.ts` |
| Runs in flight, one per IP; excess refused, not queued | `DEMO_MAX_CONCURRENCY=4` | `budget.ts` |
| Input | 3,000 characters, 16 KB body | `schema.ts` |
| Output | 4,000 / 3,000 tokens per call | `pipeline.ts` |
| Time | 25 s per call, one SDK retry, 60 s per run; cancelled if the visitor leaves | `ai.ts`, `route.ts` |
| Same-origin JSON POST only | always | `http.ts` |

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

## Customer onboarding (`/onboarding`)

The private questionnaire that paying customers open from their welcome email. It has a four-step form, a review screen, and email-code verification. It isn't in the navigation or sitemap, and it's `noindex`. The browser talks only to `/api/customer-onboarding/*`. Those routes call the Sales Swarm server-to-server with an HMAC-signed request, and the session lives in a `__Host-` HttpOnly cookie. It's disabled until `ONBOARDING_API_URL` and `ONBOARDING_API_SECRET` are set. For local work, run `ONBOARDING_MOCK=true npm run dev` and open `http://localhost:3000/onboarding#token=mock_valid_invitation_0001`.

The API contract the Swarm must implement, security model, mock links, deployment steps and welcome-email link format are in [`docs/ONBOARDING.md`](docs/ONBOARDING.md).

## Environment

See `.env.example`. `NEXT_PUBLIC_*` values are baked in at build time; `CONTACT_*`, `RESEND_API_KEY`, `OPENAI_API_KEY`, `DEMO_*` and `ONBOARDING_*` are runtime values read only on the server. Never put a secret in a `NEXT_PUBLIC_*` variable.

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
