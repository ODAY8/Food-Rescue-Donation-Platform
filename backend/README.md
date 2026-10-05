# Food Rescue Donation Platform — Backend

Node.js + Express 5 API for the **Food Rescue Donation Platform**, a web platform
that connects restaurants, grocery stores, and event organizers who have surplus
food with NGOs, shelters, and volunteers who can collect and redistribute it —
fighting food waste and hunger simultaneously.

**Version 2.0 — Smart Food Management** (AI expiry prediction, image recognition,
QR codes, smart search, inventory, multilingual UI, scheduled donations) is
implemented on top of the working Version 1.0 donation workflow.

---

## Table of Contents

- [The Whole Project](#the-whole-project)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Configuration (Environment Variables)](#configuration-environment-variables)
- [API Reference](#api-reference)
- [Data Model](#data-model)
- [Version 2.0 Features](#version-2.0-features)
- [Security](#security)
- [Background Jobs](#background-jobs)
- [Testing](#testing)
- [Documentation](#documentation)
- [Known Limitations & Next Steps](#known-limitations--next-steps)

---

## The Whole Project

This README documents the entire **Food Rescue Donation Platform**, with a focus
on the backend (the API, database, and AI services). The project spans:

| Directory | What lives there |
|---|---|
| `backend/` | **This package** — Express API, Prisma schema + migrations + seed, all services, middleware, routes, and uploads |
| `frontend/food-rescue-frontend/` | React 19 + Vite 8 SPA (19 pages, EN/HI i18n, role-gated routing) |
| `documentation/` | `architecture-v2.md`, `api-v2.md`, `security-review-v2.md`, `performance-review-v2.md` |
| `api/`, `ai_service/`, `database/`, `deployment/`, `testing/`, `assets/` | Reserved placeholders — the actual code for those concerns lives inside `backend/` and `frontend/` |

> The backend serves the SPA and exposes everything under `/api/*`. There is no
> Python microservice: AI runs in-process (see [Version 2.0 Features](#version-2.0-features)).

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js ≥ 18, Express 5 (CommonJS), JWT auth (`jsonwebtoken`), `bcrypt` (12 rounds), `helmet`, `cors`, `express-rate-limit`, `multer` (uploads), `qrcode`, `pg` |
| **Database** | PostgreSQL via Prisma 7 (`@prisma/client` + `@prisma/adapter-pg` driver adapter) + Prisma Migrate |
| **AI (optional)** | Groq (OpenAI-compatible `/chat/completions` via global `fetch`, no SDK) — vision + LLM; deterministic rule-engine fallback; offline mode works with no API key |
| **Frontend** | React 19 + Vite 8 + TypeScript, Tailwind CSS v4, Framer Motion, React Router 7, Recharts, react-i18next (EN/HI), html5-qrcode |
| **Tests** | Backend: Node `node:test` (54 tests). Frontend: Vitest + Testing Library (12 tests) |

---

## Architecture

Strictly layered — `route → middleware → controller → service → model → Prisma → PostgreSQL`:

```
backend/
├── prisma/
│   ├── schema.prisma            # 10 models + 12 enums (V1 + V2)
│   ├── migrations/              # init + v2_smart_food_management (PostgreSQL)
│   └── seed.js                  # idempotent dev seed (upsert by email)
├── src/
│   ├── server.js                # entrypoint: boots app + background jobs
│   ├── app.js                   # Express middleware stack + static /uploads
│   ├── config/                  # env (validated), prisma (Pg adapter), ai, multer, db (pg pool)
│   ├── controllers/             # thin, try/catch, delegate to services
│   ├── services/                # business logic + AI
│   │   ├── ai/                  # ai.client.js, foodPrompts.js (Groq, no SDK)
│   │   ├── expiry/              # ruleEngine.js (deterministic prediction)
│   │   └── __tests__/           # 7 test files (node:test)
│   ├── models/                  # data-access layer over Prisma (field whitelisting)
│   ├── middleware/              # auth (protect/restrictTo), validate (+validateQuery), error, notFound
│   ├── routes/                  # mounted under /api/*
│   └── validations/             # schema objects for the validation middleware
├── uploads/foods/               # runtime image storage (gitignored)
├── .env.example                 # documented env template
└── package.json
```

- **API layout** — mounted under `/api/*`: `auth`, `foods`, `donations`, `users`, `notifications`, `analytics`, `admin`, `inventory`, `uploads`.
- **Auth** — stateless JWT (Bearer token). No sessions/cookies. `protect` verifies the token (no DB hit); `restrictTo(...roles)` guards roles.
- **Jobs** — in-process `setInterval` jobs started in `server.js` (both `unref()`'d): hourly expiry sweep + scheduled-donation reminders.

---

## Getting Started

Prerequisites: Node.js ≥ 18, npm ≥ 9, PostgreSQL running (local or Docker).

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env          # then fill in DATABASE_URL, JWT_SECRET
npm run db:setup              # prisma migrate deploy + seed
npm run dev                   # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend/food-rescue-frontend
npm install
npm run dev                   # http://localhost:5173
```

Set `VITE_API_URL=http://localhost:5000/api` in the frontend `.env` if needed.

### 3. Seed accounts (shared password `Password@123`)

| Role | Email |
|---|---|
| Admin | `admin@foodrescue.org` |
| Donors | `amara@greenleafkitchen.com`, `carlos@harborviewmarket.com`, `lena@dailycrustbakery.com` |
| NGOs | `sarah@hopecenter.org`, `david@feedthecity.org`, `grace@shelterharmony.org` |

---

## Scripts

All commands run from `backend/`:

| Command | Purpose |
|---|---|
| `npm run dev` | nodemon dev server with auto-reload |
| `npm start` | production start (`node src/server.js`) |
| `npm run migrate` | apply migrations (`prisma migrate deploy`) |
| `npm run migrate:dev` | create + apply a dev migration (`prisma migrate dev`) |
| `npm run seed` | idempotent dev seed |
| `npm run db:setup` | `prisma migrate deploy` + seed (full DB bootstrap) |
| `npm test` | run 54 tests (`node --test src/services/__tests__/*.test.js`) |

---

## Configuration (Environment Variables)

Copy `.env.example` to `.env`. `DATABASE_URL` and `JWT_SECRET` are **required**
— the server validates them at boot and exits if missing.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | Server port |
| `DATABASE_URL` | *(required)* | PostgreSQL connection string |
| `JWT_SECRET` | *(required)* | JWT signing secret — `openssl rand -hex 32` |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin (comma-separated supported) |
| `JWT_EXPIRES_IN` | `7d` | JWT lifetime |
| `GROQ_API_KEY` | empty (offline mode) | Groq/OpenAI-compatible API key — leave empty for rule-engine-only mode |
| `AI_BASE_URL` | `https://api.groq.com/openai/v1` | AI provider base URL |
| `AI_VISION_MODEL` | `llama-3.2-90b-vision-preview` | Image recognition model |
| `AI_CLASSIFICATION_MODEL` | `llama-3.3-70b-versatile` | Expiry classification model |
| `AI_TIMEOUT_MS` | `15000` | AI request timeout (AbortController) |
| `UPLOAD_DIR` | `uploads` | Local image storage dir (relative to `backend/`) |
| `MAX_IMAGE_MB` | `5` | Max uploaded image size |
| `QR_CODE_TTL_HOURS` | `168` (7 days) | QR code validity |
| `SCHEDULE_REMINDER_HOURS` | `2` | Reminder lead time before pickup |
| `SCHEDULE_REMINDER_INTERVAL_MS` | `900000` (15 min) | Reminder job poll interval |
| `DATABASE_URL_TEST` | empty | Optional separate test DB |

Never commit real keys — `.env` and `uploads/` are gitignored.

---

## API Reference

All routes return a `{ success, data }` envelope and require a Bearer JWT unless
marked **public**. **Auth legend:** 🟢 public · 🔐 any authenticated · 🟠 DONOR · 🟣 NGO · 🔴 ADMIN.

### Root & Auth

| Method | Path | Purpose | Auth |
|---|---|---|---|
| GET | `/` | Welcome message | 🟢 |
| POST | `/api/auth/register` | Register (donor/ngo/recipient) → JWT | 🟢 |
| POST | `/api/auth/login` | Login → JWT | 🟢 |
| GET | `/api/auth/profile` | Get own profile | 🔐 |
| PUT | `/api/auth/profile` | Update own profile | 🔐 |
| POST | `/api/auth/logout` | Logout (stateless — client discards token) | 🔐 |

### Foods

| Method | Path | Purpose | Auth |
|---|---|---|---|
| GET | `/api/foods/search` | Smart search: q, category, city, expiry, urgency, lat/lng, sort | 🟢 |
| GET | `/api/foods/recommendations` | Ranked recommendations for NGOs (urgency/distance/quantity) | 🔐 |
| POST | `/api/foods/recognize-image` | AI food recognition from photo (memory upload, no disk) | 🟠 |
| GET | `/api/foods` | List all food (filters + pagination) | 🟢 |
| GET | `/api/foods/my` | Donor's own listings | 🔐 |
| GET | `/api/foods/:id` | Food detail | 🟢 |
| GET | `/api/foods/:id/prediction` | Expiry risk prediction (cached, 12 h TTL) | 🟢 |
| POST | `/api/foods/:id/expiry-prediction` | Force-refresh prediction (rate-limited 30/15 min) | 🔐 owner/ADMIN |
| POST | `/api/foods` | Create listing | 🟠 |
| PUT | `/api/foods/:id` | Update own listing | 🟠 |
| DELETE | `/api/foods/:id` | Delete own listing | 🟠 |

### Donations, Schedules & QR

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/api/donations/claim/:foodId` | NGO claims available food | 🔐 |
| GET | `/api/donations/my-donations` | Donor's donations | 🔐 |
| GET | `/api/donations/my-claims` | NGO's claimed foods | 🔐 |
| GET | `/api/donations/:id` | Donation detail (donor/NGO/ADMIN only) | 🔐 |
| PUT | `/api/donations/:id/status` | Status transition (enforced state machine + role) | 🔐 |
| POST | `/api/donations/schedule` | Donor creates scheduled donation | 🟠 |
| GET | `/api/donations/scheduled` | Donor's schedules | 🔐 |
| GET | `/api/donations/scheduled/ngo` | Open schedules for NGOs | 🟣 |
| PUT | `/api/donations/scheduled/:id` | Reschedule (donor owns) | 🔐 |
| POST | `/api/donations/scheduled/:id/cancel` | Cancel schedule | 🔐 |
| POST | `/api/donations/scheduled/:id/accept` | NGO accepts → creates donation + `PICKUP_SCHEDULED` | 🟣 |
| GET | `/api/donations/qr/:code` | Resolve scanned QR → donation summary (scan counted) | 🔐 |
| POST | `/api/donations/qr/validate` | Validate code format/expiry (`FRD-` + 32 hex) | 🔐 |
| POST | `/api/donations/:id/qr` | Generate/re-generate QR (PNG data URL) | 🔐 donor/NGO/ADMIN |
| POST | `/api/donations/:id/scan/collect` | NGO confirms collection (→ `COLLECTED`) | 🟣 |
| POST | `/api/donations/:id/scan/deliver` | NGO confirms delivery (→ `DELIVERED`) | 🟣 |

### Users & Notifications

| Method | Path | Purpose | Auth |
|---|---|---|---|
| GET | `/api/users` | List all users | 🔴 |
| GET | `/api/users/:id` | User detail | 🔴 |
| DELETE | `/api/users/:id` | Delete user | 🔴 |
| GET | `/api/notifications` | Own notifications (+ unread count, `?unread=true`) | 🔐 |
| PATCH | `/api/notifications/:id/read` | Mark one read | 🔐 |
| PATCH | `/api/notifications/read-all` | Mark all read | 🔐 |
| DELETE | `/api/notifications/:id` | Delete one | 🔐 |

### Analytics & Admin

| Method | Path | Purpose | Auth |
|---|---|---|---|
| GET | `/api/analytics/public` | Headline counts (listings, users, completed, servings) | 🟢 |
| GET | `/api/analytics/platform` | Full platform stats | 🔴 |
| GET | `/api/analytics/me` | Personal donor/NGO stats | 🔐 |
| GET | `/api/analytics/v2` | V2 stats (AI usage, inventory, QR, schedules, events) | 🔴 |
| POST | `/api/analytics/events` | Log platform event (only `LANGUAGE_CHANGE`, metadata ≤ 500 chars) | 🔐 |
| GET | `/api/admin/dashboard` | Platform stats dashboard | 🔴 |
| GET | `/api/admin/users` | List users | 🔴 |
| DELETE | `/api/admin/users/:id` | Delete user | 🔴 |
| GET | `/api/admin/foods` | List all foods | 🔴 |
| PATCH | `/api/admin/foods/:id/status` | Moderate food status (AVAILABLE/CLAIMED/EXPIRED) | 🔴 |
| DELETE | `/api/admin/foods/:id` | Delete food | 🔴 |
| GET | `/api/admin/donations` | List all donations (paginated, status filter) | 🔴 |

### Inventory (donor-only)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/inventory` | List donor's items (filters + pagination) |
| GET | `/api/inventory/history` | Transaction history |
| POST | `/api/inventory` | Create item (logs `ADD` transaction) |
| GET | `/api/inventory/:id` | Item detail |
| PUT | `/api/inventory/:id` | Update item |
| DELETE | `/api/inventory/:id` | Soft-remove (logs `REMOVE`) |
| POST | `/api/inventory/:id/adjust` | Quantity delta adjust (row-lock via update, logs `ADJUST`) |
| POST | `/api/inventory/:id/donate` | Donate qty → creates a real food listing (logs `DONATE`) |
| POST | `/api/inventory/:id/expired` | Mark `EXPIRED` (logs `EXPIRE`) |

### Uploads

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/api/uploads/food-image` | Upload food image to local disk (returns `/uploads/foods/<file>` URL) | 🔐 |

Static `GET /uploads/foods/:filename` serves uploaded images (no dotfiles, `nosniff`).

---

## Data Model

PostgreSQL via Prisma 7. **10 models + 12 enums.** All tables are mapped to
snake_case via `@@map`. V2 changes are additive (one migration
`v2_smart_food_management` on top of `init`), with `onDelete: SetNull` for
history-preserving links and `Cascade` for user-owned content.

| Model | Table | Key fields |
|---|---|---|
| `User` | `users` | name, email (unique), password (bcrypt), role, phone, address, organization, lat/lng |
| `Food` | `foods` | donorId, title, description, category, quantity, unit, servings, expiryDate, pickupLocation/Window, city, lat/lng, imageUrl, status + V2: preparationDate, storageCondition, packaging, temperature |
| `Donation` | `donations` | foodId, donorId, ngoId, 9-state status, per-transition timestamps |
| `Notification` | `notifications` | userId, title, message, type, isRead, link |
| `ExpiryPrediction` | `expiry_predictions` | foodId (unique), featuresHash (sha256), urgency, riskScore, recommendation, explanation (Json), model (`rules`/`groq`) |
| `DonationCode` | `donation_codes` | donationId, code (unique `FRD-` + 32 hex), expiresAt, scansCount, lastScannedAt, createdBy |
| `InventoryItem` | `inventory_items` | donorId, name, category, quantity (Float), unit, preparationDate, expiryDate, storageCondition, location, status |
| `InventoryTransaction` | `inventory_transactions` | itemId, type, quantityChange/Before/After, note, optional foodId |
| `ScheduledDonation` | `scheduled_donations` | donorId, foodId (unique), donationId (unique, nullable), ngoId, scheduledFor, status, reminderSentAt, notes |
| `PlatformEvent` | `platform_events` | type (SEARCH/RECOGNITION/LANGUAGE_CHANGE), userId, metadata (Json) |

**Enums:** `Role` (DONOR/NGO/ADMIN), `FoodStatus`, `FoodCategory` (8 values),
`DonationStatus` (9 states), `NotificationType`, `StorageCondition`,
`PackagingType`, `UrgencyLevel`, `InventoryStatus`, `InventoryTransactionType`,
`ScheduledDonationStatus`, `PlatformEventType`.

Key indexes: `foods(donorId)`, `foods(status)`, `foods(expiryDate)`,
`foods(city)`, composite `foods(status, expiryDate)` (verified with `EXPLAIN`
in the performance review).

---

## Version 2.0 Features

1. **AI expiry prediction** — deterministic rule engine (always on) + optional
   Groq LLM enrichment. Cached per food (feature-hash + 12 h TTL). Returns risk
   score, urgency, recommendation, factor explanations, and a food-safety
   disclaimer. See `GET /api/foods/:id/prediction`.
2. **Image-based food recognition** — upload a photo, Groq vision suggests
   name/category/confidence; user confirms or corrects. Magic-byte validation,
   5 MB cap. See `POST /api/foods/recognize-image`.
3. **QR / barcode** — donors generate a secure `FRD-<32hex>` QR per donation;
   NGOs scan (camera or manual) to view authorized details and confirm
   collection/delivery. No PII in the code.
4. **Smart search & filtering** — filters (name, category, city, availability,
   urgency window, quantity, status), whitelisted sorts (expiring / quantity /
   recent / relevance / nearest), pagination, and a transparent NGO ranking
   (urgency 50% + distance 30% + quantity 20%).
5. **Inventory management** — donor CRUD, quantity adjust, donate-from-inventory
   (creates a real food listing), mark expired, soft remove, full transaction
   history. Negative quantities blocked at the service **and** DB (`CHECK`)
   level; updates run in transactions.
6. **Multilingual UI** — English + Hindi via react-i18next, centralized JSON
   dictionaries, persisted in `localStorage`, EN/HI switcher in the navbar.
   Database content is never auto-translated.
7. **Scheduled donations** — donors schedule a future pickup; NGOs accept open
   schedules (creates a real donation + `PICKUP_SCHEDULED`); donors can
   reschedule/cancel; a background job sends reminders. Validation prevents
   scheduling expired food or past dates.

### The AI subsystem (in-process)

- **No Python microservice** — `ai_service/` is a deliberately empty placeholder;
  AI is a Node module (`src/services/ai/`) calling Groq's OpenAI-compatible
  `/chat/completions` via global `fetch`.
- **Dual-path prediction:** the rule engine (`src/services/expiry/ruleEngine.js`)
  always computes a weighted risk score (shelf life 50% + perishability 20% +
  storage 10% + packaging 10% + temp deviation 5% + prep recency 5%) and
  thresholds (≤25 LOW / ≤50 MEDIUM / ≤80 HIGH / else CRITICAL). Groq is an
  optional enrichment layer.
- **Graceful degradation:** missing/failing `GROQ_API_KEY` → offline rule-engine
  mode, never a 500. LLM output is sanitized (validated against enums, clamped,
  truncated) so model output can never corrupt DB enums or inject text.

### Acceptance workflows (all verified)

1. Add food → prediction → review → listed.
2. Upload image → recognition → confirm/correct → listed.
3. Generate QR → NGO scans → backend validates → authorized detail → confirm collection.
4. Inventory 100 kg → donate 30 → 70 remaining → transaction recorded.
5. NGO searches → filters → ranked → requests.
6. Schedule donation → reminder → pickup → workflow continues.
7. Switch language EN/HI → persists after refresh/login.

---

## Security

1. **helmet** security headers (CORP relaxed to cross-origin for uploaded images only).
2. **CORS** whitelist via `CLIENT_URL`, credentials enabled.
3. **Rate limiting:** global `/api` 300/15 min, `/api/auth` 30/15 min, recognition
   20/15 min, prediction refresh 30/15 min.
4. **Body size limit** 10 KB JSON (payload flood guard).
5. **Env validation** at boot — missing `DATABASE_URL`/`JWT_SECRET` aborts.
6. **Input validation** — custom rule engine (`validate`/`validateQuery`) covering
   required, lengths, patterns, enums, number ranges, and dates; applied on all
   mutating routes and the search query.
7. **Field whitelisting** in data models (e.g. `FoodModel.update`, `UserModel.update`).
8. **Password hashing** — bcrypt 12 rounds + login timing-attack mitigation
   (dummy compare on unknown emails).
9. **Magic-byte image validation** — client mimetype is never trusted; files are
   sniffed (`services/foodRecognition.service.js`) and deleted on mismatch. Uploads
   are served with `dotfiles: deny`, no directory index, and `nosniff`.
10. **AI output sanitization** + key gating (offline mode when key empty).
11. **QR codes are random, server-authorized tokens** — `FRD-` + 32 hex chars,
    TTL'd (7 days), scan-counted; no PII; role-based detail disclosure on scan.
12. **Donation state machine** — transitions are role- and state-checked, run in
    `prisma.$transaction`, with timestamp + notification side effects.
13. **Error handler** hides stack traces outside development.

---

## Background Jobs

Started in `src/server.js` (both `unref()`'d so they don't hold the process open):

| Job | Interval | What it does |
|---|---|---|
| `startExpiryJob()` | hourly | Marks expired food `EXPIRED` (also flips `CLAIMED` → `EXPIRED`) |
| `startReminderJob()` | 15 min (`SCHEDULE_REMINDER_INTERVAL_MS`) | Sends pickup reminders for scheduled donations due within `SCHEDULE_REMINDER_HOURS` |

---

## Testing

```bash
npm test    # node --test src/services/__tests__/*.test.js  (54 tests)
```

7 test files using Node's built-in `node:test`: rule engine, expiry prediction
(integration), food recognition, inventory, QR, ranking, and schedule logic.
Optional `DATABASE_URL_TEST` supports a separate integration-test DB. Frontend
tests (12, Vitest + Testing Library) live in `frontend/food-rescue-frontend/`.

---

## Documentation

- `../README.md` — platform overview + getting started for both apps
- `../documentation/architecture-v2.md` — design decisions, new models, services, jobs
- `../documentation/api-v2.md` — full V2 endpoint reference
- `../documentation/security-review-v2.md` — V2 security audit (2 findings, both fixed)
- `../documentation/performance-review-v2.md` — V2 performance audit + future work

---

## Known Limitations & Next Steps

- Uploaded images live on local disk (dev); production should use object storage + CDN.
- Rate-limit stores are in-memory (per-process); multi-instance deploys need a shared store (e.g. Redis).
- Frontend ships as one bundle (~450 KB gzip); Recharts + html5-qrcode are the heavy items — code-split if startup matters.
- No email/SMS delivery channel yet — notifications are in-app only.
- Volunteer role (V1 roadmap) is not implemented.
- No CI/CD pipeline or container config yet (`deployment/` is a placeholder).
