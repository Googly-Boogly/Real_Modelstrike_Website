# Task: build the customer onboarding API in the Sales Swarm

You are working in `/home/sophie/PycharmProjects/Sales_Platform`, my AI sales agent swarm and CRM: a FastAPI backend
with PostgreSQL and Alembic, a frontend served by nginx, all run with docker-compose. It will be deployed to EC2.
**Read `AGENTS.md`, `README.md` and `docs/` in that repo first, and follow its conventions.**

My website, modelstrike.ai (a separate Next.js app in `/home/sophie/PycharmProjects/Real_Modelstrike_Frontend`), has
a finished, tested customer onboarding questionnaire at `/onboarding`. The customer's browser talks only to
modelstrike.ai. The website's server then calls the Swarm **server-to-server over HTTPS, with every request
HMAC-signed**. Your job is to build the Swarm side of that connection.

## Source of truth (read these before writing code)

In `/home/sophie/PycharmProjects/Real_Modelstrike_Frontend`:

- `docs/ONBOARDING.md`: **§5 is the exact API contract you must implement.** Also read §1 (architecture), §6 (welcome
  email link), §7 (security) and §9 (deployment).
- `src/lib/onboarding/backend.ts`: the client that calls you. It defines the paths, headers and signing, which status
  codes and error codes it understands, and the response shapes it parses.
- `src/lib/onboarding/schema.ts`: the questionnaire fields, option slugs, length limits, and `toBackendPayload()` (the
  exact JSON body you receive). Your Pydantic models must match it exactly.
- `src/lib/onboarding/mock.ts`: a reference implementation of the behaviour, used in development.
- `src/lib/onboarding/backend.test.ts`: shows the signing algorithm with a worked example.

Do not change the website repo. If the contract seems wrong or incomplete, stop and tell me instead of diverging
from it.

## What to build

### 1. Website authentication (every request under `/api/onboarding-portal/v1`)
- Check `X-ModelStrike-Timestamp`: reject it if it is more than 300 s from server time.
- Check `X-ModelStrike-Signature: sha256=<hex>`, where the hex is
  `HMAC-SHA256(ONBOARDING_API_SECRET, ts + "\n" + METHOD + "\n" + path + "\n" + sha256_hex(raw_body))`.
  - `path` is the URL path, e.g. `/api/onboarding-portal/v1/session`.
  - Compare with `hmac.compare_digest`. If the check fails, return 401 with no details.
- Read `ONBOARDING_API_SECRET` from the environment. If it is missing or shorter than 32 characters, the routes must
  fail closed with 503 and the app must not crash.
- Trust `X-Onboarding-Client-IP` (used for rate limiting) only after the signature check passes.
- Read `X-Onboarding-Session` (the customer session token) on every route except `/session`.
- Add these routes to the `local_mode` Host-check allow-list in `app/main.py`, as was done for `/api/webhooks/stripe`.
  They must not use the CRM staff session, the CSRF token or CORS.

### 2. Endpoints
Build all five exactly as described in §5:
- `POST /session`
- `POST /verification/send`
- `POST /verification/confirm`
- `GET /project`
- `POST /questionnaire`

Requirements:
- Use the status codes and error `code` values listed in §5.
- **Never put internal details in error bodies.**
- The project is resolved **only** through session → invitation → project. No endpoint accepts a project or customer id.
- Unknown and malformed tokens must get identical responses.

### 3. Database: one Alembic migration
- Add the tables `onboarding_invitations`, `onboarding_sessions` and `onboarding_questionnaires`, with the columns and
  constraints in §5.
- Store tokens and codes **only as SHA-256 hashes**.
- Generate tokens with `secrets.token_urlsafe(32)` and codes with `secrets`.
- Use the existing `customer_projects` columns (`onboarding_status`, `questionnaire_status`) rather than duplicating
  them.

### 4. Behaviour (§5 "Required behaviour")
**Invitations**
- Expire after 30 days.
- Issuing a new invitation revokes older ones for that project.
- Submitting the questionnaire revokes the invitation.

**Sessions**
- Last 2 hours.

**Email verification**
- Send a 6-digit code, valid for 10 minutes.
- Allow at most 5 attempts, and at most one resend every 30–60 s.
- Send it through the **existing Zoho mail worker**, to the project's authorized contact email only, using a fixed
  plain-text template. Don't use AI to write it.

**Rate limits**
- Apply them per client IP, plus a global limit on invalid-token attempts.
- Responses that hit a limit are `429 rate_limited` with `retry_after_seconds`.

**Submission**
- Re-validate the answers with strict Pydantic models (`extra="forbid"`, with the same enums and limits as `schema.ts`).
- Do everything below in **one transaction**:
  - `SELECT … FOR UPDATE` the project.
  - Insert the questionnaire.
  - Set `questionnaire_status = 'completed'` and `onboarding_status = 'questionnaire_completed'`.
  - Call `record_activity(...)` ("Onboarding questionnaire completed"), `notify(...)` the owner and `audit(...)`, using
    the existing helpers.
  - Revoke the invitation.
- Idempotency:
  - A repeat with the same `Idempotency-Key` returns the stored result with 200.
  - A different key on a project that is already submitted returns 409 `already_submitted`.
- If `contact.preferred_email` differs from the authorized contact, set `contact_email_change_requested = true`.
  **Never** change the customer's contact email automatically.
- Logs may contain ids and outcome codes only. Never log tokens, codes or answer contents.
- Treat all answers as untrusted customer data. If any agent reads them later, wrap them as quoted data, never as
  instructions. Answers must never change the contract, scope or pricing, or grant any agent access to customer
  software.

### 5. Welcome email (`welcome.py`, `onboarding_link()`)
- When a welcome email is sent, create an invitation and put a new `{token}` placeholder into the link:
  `https://modelstrike.ai/onboarding#token={token}`.
  - Keep `{ref}` working for existing settings.
  - The token must not be stored or logged anywhere except as its hash.
- Update the owner-facing Welcome email settings help text to explain `{token}`.

### 6. CRM
- On the customer detail page's Onboarding tab, add an **"Onboarding questionnaire"** panel behind the existing
  `crm:read` scope. It shows:
  - the submitted answers, rendered as plain text and never as HTML
  - the submitted time
  - the email-change flag
  - the invitation status (active / expired / revoked / used)
- Add owner actions **"Revoke invitation"** and **"Issue new invitation"**. The second one emails a fresh link through
  the mail worker. Follow the existing permission and CSRF patterns for staff actions.
- Add **no** public endpoint for reading questionnaires.

### 7. Config and docs
- Add `ONBOARDING_API_SECRET` to `.env.example` and `docker-compose.yml` (passed to the backend only).
- Document the feature in the repo's `docs/`:
  - the API, the env var, and the migration step
  - the nginx/TLS requirement: the website needs an HTTPS hostname such as `https://sales.modelstrike.ai`
  - an optional nginx rule restricting `/api/onboarding-portal/` to the website server's IP

## Tests (use the repo's existing test setup)
Cover at least:
- **Signature:** a valid signature passes. A wrong secret, tampered body, tampered path, stale timestamp or missing
  header all get 401. A signature computed exactly as in `backend.test.ts` verifies.
- **Session:** valid, unknown, malformed (identical response to unknown), expired, revoked, and rate limited.
- **Verification:** send, wrong code (attempts remaining count down), expired code, too many attempts, resend
  throttle, success. `/project` returns 403 `verification_required` until the code is verified.
- **`/project`:** returns the right project and never another project's data.
- **Submission:**
  - success updates the project status, activity, notification and audit
  - the same key replays
  - a new key returns 409
  - two concurrent submissions create exactly one row
  - an extra field returns 422
  - an unknown option slug returns 422
  - over-long text returns 422
  - the email-change flag is set
- **Logs:** no token, session token, code or answer text appears in captured logs.
- **Welcome email:** the email link contains a token that works with `/session`, and `{ref}` still works.

Run the full test suite and linter (`ruff`) before you finish. All of it must pass.

## Constraints
- **Do not** deploy anything, SSH to EC2, or edit any production `.env`, database or DNS. Only work locally.
- **Do not** send real emails. Use the mail worker's test or dev mode, or mock it in tests.
- Use fictional test data only (e.g. "ABC Heating & Cooling", `test.customer@example.com`).
- Don't add new frameworks. Reuse the existing patterns, helpers and UI components.
- Don't commit unless I ask.

## End-to-end check (local)
Run the Swarm locally on `localhost:9122`. Then start the website in dev mode:

```
cd /home/sophie/PycharmProjects/Real_Modelstrike_Frontend
ONBOARDING_API_URL=http://localhost:9122 ONBOARDING_API_SECRET=<same secret> npx next dev -p 3002
```

Create a fictional test project with an invitation and open `http://localhost:3002/onboarding#token=<token>`. Then go
through the full flow, or replay it with curl against the website's `/api/customer-onboarding/*` routes. Confirm the
questionnaire appears in the CRM.

## When done, report
- the files changed and the migration name
- the test results
- the exact steps ZOHO_MAIL_ENABLED=trueI must do myself to deploy:
  - EC2 deploy and migration
  - HTTPS hostname
  - secret in both `.env` files
  - Welcome email settings link
  - a test email to my own inbox, checking that Zoho click tracking keeps the `#token=` fragment
- anything you couldn't verify
