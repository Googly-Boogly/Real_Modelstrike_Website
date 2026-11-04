# Customer onboarding questionnaire (`/onboarding`)

The private, invitation-only questionnaire that paying customers open from their ModelStrike welcome email.
It isn't linked from the site navigation, the sitemap, or search engines (it's `noindex` by meta tag and header).

**Status:** the frontend, this site's API layer and a development mock are done and tested. The **Sales Swarm
endpoints below don't exist yet.** Until they're deployed and `ONBOARDING_API_URL` / `ONBOARDING_API_SECRET` are set,
production `/onboarding` shows "Onboarding is temporarily unavailable" and accepts nothing.

---

## 1. How it fits together

```
Welcome email (Zoho, sent by the Swarm mail worker)
  └─ https://modelstrike.ai/onboarding#token=<invitation token>
        │  browser: token read from the fragment, removed from the address bar at once
        ▼
modelstrike.ai  (this Next.js app, behind Caddy)
  /api/customer-onboarding/session            POST {token}   → sets __Host-ms_onboarding cookie
  /api/customer-onboarding/verification/send  POST           → Swarm emails a 6-digit code
  /api/customer-onboarding/verification/confirm POST {code}
  /api/customer-onboarding/project            GET            → company, project, contact, status
  /api/customer-onboarding/submit             POST {answers, idempotencyKey}
        │  server-to-server, HTTPS, HMAC-signed (ONBOARDING_API_SECRET)
        ▼
Sales Swarm (FastAPI on EC2, behind nginx)
  /api/onboarding-portal/v1/session | verification/send | verification/confirm | project | questionnaire
        ▼
PostgreSQL: onboarding_invitations, onboarding_sessions, onboarding_questionnaires, customer_projects, activity, notifications
```

The site calls the Swarm server-to-server instead of letting the browser call it directly, because:

* The session cookie is first-party on `modelstrike.ai` (HttpOnly, `SameSite=Strict`), and no CORS configuration is
  needed. The Swarm's address never appears in the browser bundle or CSP.
* The Swarm can authenticate the *website* (HMAC) and the *customer* (session) separately.
* The onboarding page's CSP allows `'self'` only, so no third-party script can see customer answers.

Neither app depends on the owner's computer. Both run on servers and can be deployed independently.

## 2. Files

| Path | Purpose |
|---|---|
| `src/app/onboarding/page.tsx` | Route, minimal branded header/footer, `noindex`, `no-referrer` |
| `src/components/onboarding/OnboardingApp.tsx` | Load sequence: token → session → (verification) → project → questionnaire/submitted/error |
| `src/components/onboarding/Welcome.tsx` | Welcome screen + verified customer card |
| `src/components/onboarding/Verify.tsx` | Email verification code step |
| `src/components/onboarding/Questionnaire.tsx` | Four steps, progress, inline validation, review with Edit, submit |
| `src/components/onboarding/Screens.tsx` | Loading, error states, success confirmation |
| `src/components/onboarding/fields.tsx` | Accessible inputs (same styling as the contact form) |
| `src/components/onboarding/api.ts` | Browser client for the routes above |
| `src/components/layout/HideOn.tsx` | Hides the marketing navbar/footer on `/onboarding` |
| `src/content/onboarding.ts` | Copy |
| `src/lib/onboarding/schema.ts` | Options, limits, validation (browser + server), Swarm payload mapping |
| `src/lib/onboarding/flow.ts` | Questionnaire state machine (steps, review, duplicate-submit guard) |
| `src/lib/onboarding/handlers.ts` | Route logic: CSRF, size caps, rate limits, cookie, validation, error whitelisting |
| `src/lib/onboarding/backend.ts` | Signed Swarm HTTP client + response parsing |
| `src/lib/onboarding/config.ts` | Picks Swarm / mock / disabled from env |
| `src/lib/onboarding/mock.ts` | **Development-only** in-memory backend with fictional data |
| `src/app/api/customer-onboarding/**/route.ts` | Thin Next.js route wrappers |
| `src/lib/onboarding/*.test.ts` | Tests (`npm test`) |

## 3. Environment variables (server-only, runtime)

| Variable | Meaning |
|---|---|
| `ONBOARDING_API_URL` | Swarm base URL, e.g. `https://sales.modelstrike.ai`. **Must be https** in production (plain http only to `localhost` in dev). Never an IP address. |
| `ONBOARDING_API_SECRET` | Shared HMAC secret, ≥ 32 chars. Generate with `openssl rand -base64 48`. The same value goes in the Swarm's env. |
| `ONBOARDING_MOCK` | `true` = use the in-memory mock. **Ignored when `NODE_ENV=production`.** |

If the URL or secret is set but invalid (http, short secret), onboarding is disabled and one warning is logged. It
never falls back to the mock. None of these are `NEXT_PUBLIC_*`, so they aren't in the client bundle. Rebuilding
isn't needed to change them, only a restart.

## 4. Questionnaire schema

The business name, customer and project are **never** submitted. They come from the session. Answers sent by the
browser (`POST /api/customer-onboarding/submit`):

```jsonc
{
  "idempotencyKey": "uuid v4, one per questionnaire, reused on retries",
  "answers": {
    "contactName": "≤100, required",       "jobTitle": "≤100, required",
    "contactEmail": "email ≤254, required", "industry": "enum, required", "industryOther": "≤200, required if industry=other",
    "processToAutomate": "10–4000, required", "currentProcess": "10–4000, required",
    "challenges": ["enum…", "≥1"], "challengesOther": "required if challenges∋other",
    "software": ["enum…", "≥1"], "softwareOther": "≤200, required if software∋other, else optional",
    "dataSources": ["enum…", "≥1"], "dataSourcesOther": "required if dataSources∋other",
    "dailyVolume": "enum, required",
    "actions": ["enum…", "≥1"], "actionsOther": "required if actions∋other", "actionsNotes": "≤4000, optional",
    "approverRole": "≤100, required", "approverEmail": "email, required",
    "successCriteria": "10–4000, required", "additionalNotes": "≤4000, optional"
  }
}
```

Enum values are the `value`s in `schema.ts` (e.g. `hvac_home_services`, `manual_data_entry`, `servicetitan`,
`26_50`, `draft_email`). Validation is strict: unknown keys, missing keys, wrong types and unknown enum values are
rejected. Text is NFC-normalised, control characters are stripped, whitespace is collapsed (newlines are kept in long
answers), emails are lower-cased, "Other" text is dropped when Other isn't selected, and multi-selects are
de-duplicated and sorted into option order.

The site converts answers to this payload for the Swarm (`toBackendPayload`):

```jsonc
{
  "questionnaire_version": "onboarding-2026-11-v1",
  "contact":    { "full_name", "job_title", "preferred_email" },
  "business":   { "industry", "industry_other" },
  "workflow":   { "process_to_automate", "current_process", "challenges", "challenges_other" },
  "automation": { "software", "software_other", "data_sources", "data_sources_other", "daily_volume",
                  "desired_actions", "desired_actions_other", "desired_actions_notes",
                  "approver": { "role", "email" } },
  "goals":      { "success_criteria", "additional_notes" }
}
```

## 5. Sales Swarm API contract (to implement in `Sales_Platform`)

All under `/api/onboarding-portal/v1`. **Every request** must pass the website check first:

* `X-ModelStrike-Timestamp`: unix seconds. Reject if more than 300 s from server time.
* `X-ModelStrike-Signature: sha256=<hex>` = `HMAC-SHA256(ONBOARDING_API_SECRET, ts + "\n" + METHOD + "\n" + path + "\n" + sha256_hex(raw_body))`,
  with `path` like `/api/onboarding-portal/v1/session`. Compare with `hmac.compare_digest`. Otherwise return 401 with no detail.
* `X-Onboarding-Client-IP`: the customer's IP (trust it only after the signature check). Use it for rate limits.
* `X-Onboarding-Session`: the session token, on every route except `/session`.
* These routes must be added to the `local_mode` Host-check allow-list in `app/main.py`, like `/api/webhooks/stripe`.
  They don't use the CRM user session, CSRF token or CORS.

Errors are `{"code": "<code>", ...}`. Codes the site understands: `invalid_link`, `expired_link`, `revoked_link`,
`session_expired`, `verification_required`, `invalid_code`, `code_expired`, `rate_limited`, `already_submitted`,
`invalid`. Any other code, or any 5xx, is shown to the customer as a generic "temporarily unavailable". **Never put
internal details in error bodies.** They're discarded anyway.

| Method & path | Request | Success | Failures |
|---|---|---|---|
| `POST /session` | `{"token"}` | `200 {"session_token", "expires_at" (ISO), "verification": {"required": bool, "masked_email"}}` | `401 invalid_link` (unknown/malformed, **identical** for all), `410 expired_link`, `410 revoked_link`, `429 rate_limited {retry_after_seconds}` |
| `POST /verification/send` | `{}` | `202 {"masked_email", "resend_after_seconds"}` | `401 session_expired`, `429` |
| `POST /verification/confirm` | `{"code"}` (6 digits) | `200 {}` | `400 invalid_code {attempts_remaining}`, `400 code_expired`, `429` |
| `GET /project` | — | `200 {"company_name", "project_name", "contact": {"name","email","title"}, "questionnaire_status": "open"\|"submitted", "submitted_at"}` | `401 session_expired`, `403 verification_required` |
| `POST /questionnaire` | payload above + `Idempotency-Key` header | `201 {"questionnaire_id", "submitted_at"}`; same key again → `200` with the same body | `409 already_submitted {submitted_at}`, `422 invalid {field_errors: {"contact.preferred_email": "…"}}`, `401`, `403` |

`masked_email` is a hint like `a•••@abcheating.com`, never the full address. If `verification` is missing, the site
treats it as required (fail-safe).

### Required behaviour

**Invitations** (`onboarding_invitations`: `id, project_id, token_hash CHAR(64) UNIQUE, created_at, expires_at,
revoked_at, revoked_reason, last_used_at, created_by`)
* Token: `secrets.token_urlsafe(32)` (256 bits). Store **only** `sha256(token)`. Never log the token.
* Expiry, e.g. 30 days. Issuing a new invitation for a project revokes the older ones. Revoked when the questionnaire is
  submitted (the session can still show the "already submitted" state), or by the owner from the customer page.
* Look up by hash. Check expiry/revocation **before** returning any project data.
* Invalid-token limits: per IP (e.g. 10 / 15 min) and globally (e.g. 200 / hour). Log the outcome code only.

**Sessions** (`onboarding_sessions`: `id, invitation_id, project_id, token_hash UNIQUE, created_at, expires_at,
verified_at, code_hash, code_expires_at, code_attempts, code_sent_at`)
* `secrets.token_urlsafe(32)`, stored hashed, 2 h lifetime (the site caps the cookie at 4 h).
* The project comes **only** from `session → invitation → project`. No endpoint accepts a project or customer id.
* Verification code: 6 random digits (`secrets.randbelow`), stored hashed, 10 min expiry, max 5 attempts, resend at
  most every 30–60 s. Sent by the existing mail worker (Zoho) to the project's **authorized** contact email only,
  using a fixed plain-text template (no AI). Until Zoho is available for this, you may return
  `"required": false`, but the owner should decide whether the invitation alone is enough.

**Submission** (`onboarding_questionnaires`: `id, customer_id, project_id UNIQUE, invitation_id, idempotency_key UNIQUE,
questionnaire_version, contact JSONB, business JSONB, workflow JSONB, automation JSONB, goals JSONB,
contact_email_change_requested BOOL, status, submitted_at`)
* Re-validate everything with a strict Pydantic model (`extra="forbid"`, same limits and enums as `schema.ts`).
* One transaction: `SELECT … FOR UPDATE` the project, insert the questionnaire (the `project_id` unique constraint
  makes a second insert impossible), set `customer_projects.questionnaire_status = 'completed'` and
  `onboarding_status = 'questionnaire_completed'`, `record_activity(...)` ("Onboarding questionnaire completed"),
  `notify(...)` the owner, `audit(...)`, and revoke the invitation. Commit, then return 201.
* Same `Idempotency-Key` → return the stored result with 200. Different key on a submitted project → 409.
* `contact.preferred_email` ≠ the authorized contact → store `contact_email_change_requested = true` and show it to
  the owner. **Don't** change `customers.primary_contact_email` or who the invitation goes to.
* Log ids and outcome only, never answer contents.
* **Treat every answer as untrusted data.** If an agent later reads it (e.g. Gary preparing the kickoff), wrap it as
  quoted customer data, never as instructions. Answers must not change contract, scope, pricing, or grant any agent
  access to customer software.

**CRM**: add an "Onboarding questionnaire" panel to the customer detail page's Onboarding tab, behind the existing
`crm:read` scope, plus "Revoke invitation" / "Issue new invitation" owner actions. There's no public endpoint for
reading questionnaires.

## 6. Welcome email link (Zoho)

Today the Swarm replaces `{ref}` in the owner-configured link with `customer_projects.public_ref`. That value is a
permanent plaintext reference with no expiry or revocation, so it **must not** be used as the invitation token.
Required change in `app/customers/welcome.py`:

1. When the welcome email is rendered for sending, create an `onboarding_invitations` row and substitute the raw token
   into a new `{token}` placeholder. The raw token exists only in memory and in the email body. Create it inside the
   same claimed (`FOR UPDATE`) send attempt, so a retry revokes the previous invitation and issues a new one.
2. In **Customers → Welcome email settings**, set the link to:

   ```
   https://modelstrike.ai/onboarding#token={token}
   ```

   The `#` fragment is never sent to any server, so the token doesn't appear in access logs, proxies or `Referer`
   headers. The page also accepts `?token=` if a mail client or Zoho link tracking drops fragments. **Send a test
   email and click it** before ticking "I opened this link and it works". If Zoho click-tracking is on, confirm the
   fragment survives the redirect, or turn tracking off for this email.
3. The email body already says "Complete Your Onboarding Questionnaire" and warns against sending passwords or API
   keys, so no copy change is needed.

## 7. Security summary

* Token: removed from the URL (`history.replaceState`) before any request is made. It's kept in memory only (for a
  retry button), never in localStorage, sessionStorage or cookies. It's sent once, as a POST body.
* Session: `__Host-ms_onboarding`, `Secure; HttpOnly; SameSite=Strict; Path=/`. JavaScript can't read it. In
  `next dev` on plain-http localhost it's `ms_onboarding` without `Secure`.
* CSRF: POSTs require a same-origin `Origin` header and `application/json`. The cookie is `SameSite=Strict`.
* Rate limits (per IP, per instance, in this app): session 10 / 15 min, project 60 / 15 min, code send 5 / 15 min,
  code confirm 10 / 15 min, submit 10 / h. The Swarm must enforce its own (above). This app's limits are in-memory, so
  they reset on restart.
* Request size caps: 2 KB for session, 96 KB for submit. Responses are `Cache-Control: no-store` and `X-Robots-Tag: noindex`.
* `/onboarding` headers: `Referrer-Policy: no-referrer`, a CSP with no third-party origins, no-store, noindex. There's
  no analytics or tracking on the site.
* Errors from the Swarm are reduced to whitelisted codes. Unknown and malformed tokens get the same response.
* Logs contain outcome codes only (tests assert no token, session, name, email or answer appears).
* The page makes no claims about encryption or regulatory frameworks.

## 8. Local development

```bash
ONBOARDING_MOCK=true npm run dev
```

Mock invitation links (fictional "ABC Heating & Cooling" / "Test Customer"):

| Scenario | URL |
|---|---|
| Valid | http://localhost:3000/onboarding#token=mock_valid_invitation_0001 |
| Email code required (code `123456`) | http://localhost:3000/onboarding#token=mock_verify_invitation_0002 |
| Expired | http://localhost:3000/onboarding#token=mock_expired_invitation_003 |
| Revoked | http://localhost:3000/onboarding#token=mock_revoked_invitation_004 |
| Already submitted | http://localhost:3000/onboarding#token=mock_submitted_invitation_5 |
| Missing token | http://localhost:3000/onboarding |

The mock keeps submissions in memory (restart the dev server to reset), and a banner says nothing is saved.

Against a local Swarm: `ONBOARDING_API_URL=http://localhost:9122 ONBOARDING_API_SECRET=<same as Swarm> npm run dev`.

## 9. Production deployment

1. **Swarm (EC2):** implement section 5, run the migration, and set `ONBOARDING_API_SECRET` (and the invitation
   expiry) in its env. Expose it over **HTTPS on a hostname** (e.g. `sales.modelstrike.ai` → EC2 Elastic IP, with an
   nginx/Caddy certificate). Only `/api/onboarding-portal/*` needs to be reachable from the website server. Restrict
   it in nginx or the security group to the website server's IP if you can. No CORS entry is needed.
2. **Website:** deploy this code to the site server, add `ONBOARDING_API_URL=https://sales.modelstrike.ai` and
   `ONBOARDING_API_SECRET=…` to its `.env`, then `docker compose --profile proxy up -d --build`. The first time,
   `--build` is needed to ship the onboarding code. Later changes to these two values only need a restart. Keep port 3000
   firewalled so `X-Forwarded-For` can't be spoofed around Caddy.
3. Caddy has no `log` directive in this repo, so query strings aren't access-logged. Keep it that way, or exclude
   `/onboarding` if you add logging later.
4. Send a test welcome email to a ModelStrike-owned inbox (Section 6), complete the questionnaire with fictional
   data, and check the Swarm customer page shows it, the status is "Questionnaire Completed", and an owner
   notification and activity entry exist. Then confirm the link in Welcome email settings.
5. The Privacy Policy currently describes only the contact form and scheduling. Before inviting customers, add a short
   section on onboarding questionnaire data (what's collected, used for project delivery, who can see it).
