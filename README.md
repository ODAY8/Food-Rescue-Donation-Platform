# Food Rescue Donation Platform

A web platform that connects restaurants, grocery stores, and event organizers
who have surplus food with NGOs, shelters, and volunteers who can collect and
redistribute it — fighting food waste and hunger simultaneously.

**Version 2.0 — Smart Food Management** is implemented on top of the working
Version 1.0 donation workflow (AI expiry prediction, image recognition, QR codes,
smart search, inventory, multilingual UI, scheduled donations).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 + TypeScript, Tailwind CSS v4, Framer Motion, React Router 7, Recharts, react-i18next, html5-qrcode |
| Backend | Node.js + Express 5 (CommonJS), JWT auth, bcrypt, helmet, express-rate-limit, multer, qrcode |
| Database | PostgreSQL via Prisma 7 (`@prisma/adapter-pg`) + Prisma Migrate |
| AI (optional) | Groq (OpenAI-compatible) — vision + LLM; deterministic rule engine fallback |
| Tests | Backend: Node `node:test` (54 tests). Frontend: Vitest + Testing Library (12 tests) |

---

## Project Structure

```
Food_expiry_rescue_platform/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma            # 10 models + 12 enums (V1 + V2)
│   │   ├── migrations/              # init + v2_smart_food_management
│   │   └── seed.js                  # idempotent dev seed (V1 + V2 data)
│   ├── src/
│   │   ├── config/                  # env, prisma, ai, multer
│   │   ├── controllers/             # thin, try/catch, call services
│   │   ├── services/                # business logic (+ ai/, expiry/ submodules)
│   │   ├── models/                  # data-access layer over Prisma
│   │   ├── middleware/              # auth, validate (+validateQuery), error, notFound
│   │   ├── routes/                  # mounted under /api/*
│   │   ├── validations/             # schema objects for validate()
│   │   ├── app.js                   # middleware stack + static /uploads
│   │   └── server.js                # entrypoint + background jobs
│   └── package.json
├── frontend/
│   └── food-rescue-frontend/
│       └── src/
│           ├── i18n/                # en.json + hi.json (react-i18next)
│           ├── context/             # AuthContext, LanguageContext
│           ├── hooks/               # useApi, useToast, useNotifications
│           ├── components/          # ui, layout, shared, food, __tests__
│           ├── pages/               # 19 pages (V1 + V2)
│           ├── router/              # all routes, role-gated
│           ├── services/            # typed API clients
│           ├── utils/               # roles, errorMessages (i18n mapping)
│           └── test/                # vitest setup
├── documentation/
│   ├── architecture-v2.md
│   ├── api-v2.md
│   ├── security-review-v2.md
│   └── performance-review-v2.md
└── README.md
```

Architecture is strictly layered on the backend:
`route → middleware → controller → service → model → Prisma → PostgreSQL`.

---

## Getting Started

Prerequisites: Node.js >= 18, npm >= 9, PostgreSQL running.

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

## Version 2.0 Features

1. **AI expiry prediction** — deterministic rule engine (always on) + optional
   Groq LLM enrichment. Cached per food (feature-hash + 12 h TTL). Returns risk
   score, urgency, recommendation, factor explanations, and a food-safety
   disclaimer. See `GET /api/foods/:id/prediction`.
2. **Image-based food recognition** — upload a photo, Groq vision suggests
   name/category/confidence; user confirms or corrects. Magic-byte validation,
   5 MB cap, local disk storage. See `POST /api/foods/recognize-image`.
3. **QR / barcode** — donors generate a secure `FRD-<32hex>` QR per donation; NGOs
   scan (camera or manual) to view authorized details and confirm
   collection/delivery. No PII in the code. See `documentation/api-v2.md`.
4. **Smart search & filtering** — filters (name, category, city, availability,
   urgency window, quantity, status), whitelisted sorts (expiring / quantity /
   recent / relevance / nearest), pagination, and a transparent NGO ranking
   (urgency 50% + distance 30% + quantity 20%). See `GET /api/foods/search`.
5. **Inventory management** — donor CRUD, quantity adjust, donate-from-inventory
   (creates a real food listing), mark expired, soft remove, full transaction
   history. Negative quantities blocked at the service **and** DB (`CHECK`)
   level; updates in transactions. See `/api/inventory/*`.
6. **Multilingual UI** — English + Hindi via react-i18next, centralized JSON
   dictionaries, persisted in `localStorage`, EN/HI switcher in the navbar.
   Database content is never auto-translated.
7. **Scheduled donations** — donors schedule a future pickup; NGOs accept open
   schedules (which creates a real donation + `PICKUP_SCHEDULED`); donors can
   reschedule/cancel; a background job sends reminders. Validation prevents
   scheduling expired food or past dates.

### Acceptance workflows (all verified)

1. Add food → prediction → review → listed.
2. Upload image → recognition → confirm/correct → listed.
3. Generate QR → NGO scans → backend validates → authorized detail → confirm
   collection.
4. Inventory 100 kg → donate 30 → 70 remaining → transaction recorded.
5. NGO searches → filters → ranked → requests.
6. Schedule donation → reminder → pickup → workflow continues.
7. Switch language EN/HI → persists after refresh/login.

---

## Scripts

### Backend (`backend/`)

| Command | Purpose |
|---|---|
| `npm run dev` | nodemon dev server |
| `npm start` | production start |
| `npm run migrate` | `prisma migrate deploy` |
| `npm run migrate:dev` | create + apply migration |
| `npm run seed` | idempotent dev seed |
| `npm run db:setup` | migrate + seed |
| `npm test` | run 54 tests (node:test) |

### Frontend (`frontend/food-rescue-frontend/`)

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b && vite build` |
| `npm run lint` | oxlint |
| `npm test` | run 12 tests (vitest + RTL) |

---

## Environment variables

See `backend/.env.example` for names + comments. Key ones:

- `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL` (required)
- `GROQ_API_KEY` + `AI_*` (optional — enables real AI; rule engine works without)
- `UPLOAD_DIR`, `MAX_IMAGE_MB`, `QR_CODE_TTL_HOURS`
- `SCHEDULE_REMINDER_HOURS`, `SCHEDULE_REMINDER_INTERVAL_MS`

Never commit real keys. `.env` and `uploads/` are gitignored.

---

## Documentation

- `documentation/architecture-v2.md` — design decisions, new models, services, jobs
- `documentation/api-v2.md` — full V2 endpoint reference
- `documentation/security-review-v2.md` — V2 security audit (2 findings, fixed)
- `documentation/performance-review-v2.md` — V2 performance audit + future work

---

## Known limitations / next steps

- Uploaded images live on local disk (dev); production should use object storage + CDN.
- Rate-limit stores are in-memory (per-process); multi-instance deploys need a shared store.
- Frontend ships as one bundle (~450 KB gzip); Recharts + html5-qrcode are the heavy items — code-split if startup matters.
- No email/SMS delivery channel yet — notifications are in-app only.
- Volunteer role (V1 roadmap) is not implemented.
