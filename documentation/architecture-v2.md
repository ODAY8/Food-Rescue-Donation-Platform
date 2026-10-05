# Version 2.0 Architecture

This document explains the key architectural decisions for the Smart Food
Management (V2) extension of the Food Rescue Donation Platform. V1 functionality
is untouched; V2 is additive and follows the existing
`route → controller → service → model → Prisma → PostgreSQL` layering.

---

## 1. AI provider choice: in-process module, not a Python microservice

**Decision:** `backend/src/services/ai/` (ai.config.js, ai.client.js,
foodPrompts.js) calling Groq's OpenAI-compatible API via global `fetch` — no SDK,
no separate `ai_service/` deployment.

**Why:** the repo's `ai_service/` folder was an empty placeholder; standing up a
Python microservice would add a second runtime, a second deploy target, and an
HTTP hop for no benefit at this scale. Groq exposes a standard OpenAI-compatible
`/chat/completions` endpoint callable directly from Node.

**Behavior:**
- `GROQ_API_KEY` unset → **offline mode**: prediction uses the rule engine,
  recognition returns `manualEntry: true`. The app is fully functional without AI.
- AI call fails/timeouts → same graceful degradation, never a 500 to the client.
- AI output is **validated before use** (category enum, urgency whitelist,
  numeric bounds, length caps) — a prompt-injection or malformed response can
  never corrupt the DB or render unsafe UI.

## 2. Expiry prediction: deterministic rule engine + optional LLM enrichment

Two layers, both producing `{ urgency, riskScore, recommendation, explanation[] }`:

1. **Rule engine** (`services/expiry/ruleEngine.js`) — always available, fully
   testable, transparent. Weighted factors:
   - remaining shelf life vs 48 h window (50%)
   - category perishability (20%)
   - storage condition (10%)
   - packaging (10%)
   - temperature deviation (5%)
   - preparation recency (5%)
   Urgency thresholds: ≤25 LOW, ≤50 MEDIUM, ≤80 HIGH, else CRITICAL.
2. **LLM enrichment** — when enabled, a Groq call can adjust the score; its output
   passes `sanitizeLlmPrediction` and is dropped on any failure (rules win).

**Caching:** one `ExpiryPrediction` row per food (`foodId` unique) stores a
SHA-256 hash of the input features. If the hash matches and the row is < 12 h old,
the cached result is returned — no recompute, no repeat AI spend. `POST .../expiry-prediction`
forces a refresh (rate-limited).

**Safety:** every response carries a disclaimer that the result is an AI/logistics
estimate and **not** a food-safety certification. User-facing text is clear that
official food-safety rules still apply.

## 3. Image recognition: magic-byte validation + confidence-gated suggestions

- `POST /api/foods/recognize-image` uses `multer.memoryStorage` (5 MB cap,
  jpeg/png/webp), then **sniffs real magic bytes** (never trusts the client
  mimetype).
- The image is base64'd into a vision-model call; the model must return
  `{ foodName, category, confidence, description }` with a category from the app's
  enum. Confidence < 50 → `manualEntry: true` (the UI shows a manual form).
- `POST /api/uploads/food-image` persists to `backend/uploads/foods/` with a
  random hex filename; the controller re-verifies magic bytes on disk and deletes
  mismatches. The returned relative URL flows into the existing `Food.imageUrl`
  field — the V1 JSON contract is unchanged.
- Files are served via `express.static` with `dotfiles: deny`, `index: false`,
  and nosniff.

## 4. QR codes: random token, server-side authorization

- The code is `FRD-<crypto.randomBytes(16).toString('hex')>` — 32 hex chars, no
  PII, no JWT, no address. Stored on `DonationCode` with `expiresAt` (7 days).
- `GET /api/donations/qr/:code` resolves + authorizes server-side: any
  authenticated user sees a **summary** (food title, status, city); only the
  donor, claiming NGO, or admin gets full detail. Scans are counted.
- Collection/delivery confirmation reuses the V1 donation state machine
  (`PICKUP_SCHEDULED → COLLECTED → DELIVERED`), so all role/transition rules
  still apply.

## 5. Inventory: transactions + DB backstop

- `InventoryItem` holds stock; `InventoryTransaction` records every change with
  before/after quantities. The acceptance workflow (100 kg → donate 30 → 70) is a
  single `$transaction` that creates the real V1 `Food` listing and the DONATE
  transaction together.
- Quantity can never go negative: the service rejects it first, and a PostgreSQL
  `CHECK (quantity >= 0)` constraint (`inventory_items_quantity_nonnegative`)
  is the final backstop (Prisma doesn't emit CHECKs, so it's appended manually to
  the migration).
- `adjust` and `donate` re-read + row-lock via update inside the transaction to
  avoid lost updates.

## 6. Scheduled donations: reuse the V1 donation flow

- `ScheduledDonation` links a food listing + optional resulting `Donation`.
- NGO **accept** calls the existing `donationService.claimFood` (creating the
  donation + flipping food to CLAIMED), then sets the donation to
  `PICKUP_SCHEDULED` at the scheduled time. No parallel donation logic.
- Validation blocks: past dates, invalid dates, expired food, scheduling another
  donor's food, and accepting a non-open schedule.
- **Reminder job** mirrors the existing expiry-sweep pattern: `setInterval` +
  `timer.unref()`, queries only due rows (`reminderSentAt: null` within the
  window) via the `scheduled_for` index.

## 7. Multilingual: frontend-only, centralized

- react-i18next with `en.json` + `hi.json`; language persisted in
  `localStorage('fr_lang')`; `LanguageSwitcher` in the navbar; `document.lang`
  updated.
- **Rule:** only UI strings are translated. Database values (food names, user
  content) are never auto-translated. Backend messages stay English; the frontend
  maps known messages to translations via `utils/errorMessages.ts` with a raw
  fallback.
- Language changes are reported to `POST /api/analytics/events` for admin usage
  stats.

## 8. Analytics: one event table instead of many

`PlatformEvent(type, userId, metadata)` powers admin V2 stats for search and
language usage. Prediction/QR/inventory/schedule stats compute from their own
tables (group-by, no ad-hoc tables). All admin V2 analytics are aggregates — no
PII rows exposed.

## 9. New data model summary

| Model | Purpose | Key fields |
|---|---|---|
| `ExpiryPrediction` | cached AI/rule result per food | foodId (unique), featuresHash, urgency, riskScore, explanation (Json) |
| `DonationCode` | QR for a donation | code (unique), expiresAt, scansCount |
| `InventoryItem` | donor stock | donorId, quantity (Float), expiryDate, status |
| `InventoryTransaction` | audit trail | itemId, type, quantityChange/before/after, foodId? |
| `ScheduledDonation` | future pickup | donorId, foodId, scheduledFor, status, donationId? |
| `PlatformEvent` | analytics events | type, userId?, metadata |

`Food` gained optional prediction inputs (`preparationDate`, `storageCondition`,
`packaging`, `temperature`) and a `(status, expiryDate)` composite index; `User`
gained `latitude`/`longitude` for distance ranking. All changes are additive.

## 10. Background jobs

- `expiry.service.startExpiryJob` (V1, hourly sweep).
- `schedule.service.startReminderJob` (V2) — both `timer.unref()`, started in
  `server.js`.

## 11. Why not ...

- **React Query / Redux** for the frontend: the existing `useApi` hook + context
  covers V2 needs; no new state library.
- **A job queue (BullMQ/Redis)**: a single-process `setInterval` is sufficient
  and simpler; documented as the path if multi-instance scaling requires it.
- **Sharp for image processing**: magic-byte validation is enough for the current
  upload validation needs; resizing can be added with the cloud storage migration.
