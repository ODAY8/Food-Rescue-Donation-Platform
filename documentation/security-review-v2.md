# Version 2.0 Security Review

Scope: the seven V2 features (AI expiry prediction, image recognition, QR/barcode,
smart search, inventory, multilingual, scheduled donations) plus their integration
with the existing V1 platform. Review date: 2026-08-10.

## Summary

V2 introduces new attack surface: file uploads, an external AI provider, QR-code
lookups, and background jobs. The review found **2 issues**, both fixed during the
audit (see "Fixes applied"). No critical or high findings remain. All other controls
were verified as correctly implemented.

---

## 1. Image upload security — VERIFIED + 1 FIX

Controls in place:

- **File type**: mimetype allow-list (JPEG/PNG/WebP) in `config/multer.js` **and**
  magic-byte sniffing in `foodRecognition.service.js` (never trusts the client
  Content-Type).
- **Size cap**: 5 MB enforced by multer `limits.fileSize` (from `MAX_IMAGE_MB`).
- **Filenames**: `crypto.randomBytes(16).toString("hex")` + safe extension — no
  user-controlled path segments, no path traversal.
- **Storage**: written to `backend/uploads/` (gitignored), served via
  `express.static` with `dotfiles: "deny"`, `index: false`, and
  `X-Content-Type-Options: nosniff`. No directory listing, no script execution
  (static handler serves content, not code).
- **Recognition upload** uses `memoryStorage` (never touches disk).

**FIX (was: moderate):** `POST /api/uploads/food-image` previously validated only
the client-supplied mimetype. An attacker could upload a file named `.jpg` with
arbitrary content (polyglot/HTML/script) that would be served from `/uploads`.
The controller now sniffs the file's magic bytes on disk and rejects any file whose
real type doesn't match the declared mimetype (deleting the file on mismatch).

## 2. QR code security — VERIFIED

- **No PII in the code**: the payload is a 32-hex random token (`FRD-<hex>` from
  `crypto.randomBytes(16)`), never a JWT, password, address, or user id.
- **Server-side validation**: `GET /api/donations/qr/:code` resolves + authorizes
  on the backend; the code format is enforced (`^FRD-[a-f0-9]{32}$`) on validate.
- **Authorization (IDOR)**: any authenticated user may scan and get a *summary*
  (food title, status, city). Full donation detail is returned **only** to the
  donor, the claiming NGO, or an admin. Tested in `qr.test.js`
  ("returns summary-only for an unrelated user").
- **Expiry**: codes carry an `expiresAt` (default 7 days) checked on every resolve.
- **Scan counting**: `scansCount`/`lastScannedAt` increment — enables duplicate/abuse
  detection; collection/delivery confirmation reuses the V1 state machine, which
  already enforces role + transition rules.

## 3. AI provider security — VERIFIED + 1 FIX

- **Key handling**: `GROQ_API_KEY` is read only from env (`config/ai.js`), never
  logged, never returned to clients, never in seed/docs. `.env` is gitignored.
- **Transport**: HTTPS to the configured base URL; `AbortController` timeout
  (default 15 s) prevents hung requests.
- **Output validation (prompt-injection guard)**: AI responses are validated before
  use — recognition output is checked against the category enum + confidence range;
  prediction output is sanitized via `sanitizeLlmPrediction` (urgency whitelist,
  numeric riskScore clamp, string-length caps). Invalid AI output is dropped in
  favor of the deterministic rule engine, never persisted as-is.
- **Cost/abuse protection**: rate limits on the two AI-triggering endpoints.

**FIX (was: low):** `POST /api/foods/:id/expiry-prediction` (force-refresh) had no
dedicated rate limit. With a real API key configured, an attacker could hammer it
and burn credits. Added a 30/15-min limiter (`predictionLimiter`).

## 4. Authorization & IDOR — VERIFIED

- **Auth middleware**: `protect` verifies the JWT; `restrictTo("DONOR"/"NGO"/"ADMIN")`
  gates roles; `req.user` carries `{ id, role }`.
- **Service-level ownership checks** in every V2 write path:
  - Inventory: `item.donorId !== userId` → reject (create/update/adjust/donate/remove).
  - Schedules: `schedule.donorId !== userId` → reject (reschedule/cancel); only
    donors create, only NGOs accept.
  - Predictions: only the food owner or admin may force-refresh.
  - QR: generate requires donor/NGO/admin of the donation; full resolve likewise.
- **Schedule accept** runs through the existing `donationService.claimFood`, which
  already rejects self-claims and non-AVAILABLE food.

## 5. Input validation — VERIFIED

- Every new body endpoint has a schema in `validations/` consumed by
  `validate()`/`validateQuery()` (required, length, enum, number, date ranges).
- `PlatformEvent.metadata` is size-capped (500 chars) and type-whitelisted.
- Search query params validated by `searchQuerySchema` (enum sorts, numeric bounds,
  page/limit clamps).
- Search/recognition/prediction responses contain no PII.

## 6. Rate limiting — VERIFIED + 1 FIX

Existing: 300/15-min global, 30/15-min on `/api/auth`. V2 added:
`/api/foods/recognize-image` (20/15-min) and now `/api/foods/:id/expiry-prediction`
(30/15-min). All use `express-rate-limit` with standard headers.

## 7. Database security — VERIFIED

- **CHECK constraint** `inventory_items_quantity_nonnegative` on `inventory_items`
  is the DB-level backstop; service-level checks prevent negatives first.
- **Additive migration only**; no destructive changes; production DB never reset.
- **Cascade behavior reviewed**: `onDelete: SetNull` for history-preserving links
  (`InventoryTransaction.food`, `ScheduledDonation.donation/ngo`); `Cascade` for
  user-owned content (consistent with V1).
- Prisma parameterizes queries; no string-built SQL in V2 services.

## 8. Sensitive data exposure — VERIFIED

- QR resolve returns only food title/status/city to unauthenticated-to-donation
  users; no addresses, phone numbers, or emails.
- Recognition/prediction payloads carry no PII.
- Admin V2 analytics expose aggregates only (counts by urgency/model/status), no
  per-user rows.
- Language-change events store only `{ lang }`.

## 9. Background jobs — VERIFIED

- Reminder job and expiry sweep use `setInterval` + `timer.unref()`; queries are
  scoped (`reminderSentAt: null`, status filter) and index-backed.
- No secrets passed to jobs; notifications go through the existing scoped
  `notificationService.push`.

## 10. Secrets inventory

| Secret | Where | Exposed? |
|---|---|---|
| `JWT_SECRET` | `.env` (gitignored) | No |
| `DATABASE_URL` | `.env` | No |
| `GROQ_API_KEY` | `.env` | No |
| `CLIENT_URL` / model names / timeouts | `.env.example` (names only) | Safe |

`.gitignore` covers `.env` and `uploads/`. Verified no key values are committed
(seed uses a dev-only shared password, no real credentials).

---

## Fixes applied during this review

1. `backend/src/controllers/upload.controller.js` — magic-byte verification for
   persisted uploads (deletes mismatched files).
2. `backend/src/routes/food.routes.js` — rate limit on the prediction-refresh
   endpoint.

## Residual / accepted risks

- **Local disk uploads** scale poorly and have no CDN/caching; acceptable for dev,
  flagged for cloud storage in production (see Performance review).
- **QR codes** are bearer tokens by nature: anyone holding a scanned code can read
  the summary until expiry. Mitigated by short TTL, no PII, and full-detail
  authorization.
- **AI provider availability**: when `GROQ_API_KEY` is unset or the call fails,
  features degrade (recognition → manual entry; prediction → rule engine). This is
  by design and never fails open into unsafe behavior.
- **Rate limits are per-process** (in-memory store); a multi-instance deployment
  needs a shared store (e.g. Redis) — out of scope for V2.
