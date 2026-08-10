# Food Rescue Donation Platform

A web platform that connects restaurants, grocery stores, and event organizers who have surplus food with NGOs, shelters, and volunteers who can collect and redistribute it — fighting food waste and hunger simultaneously.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Animations | Framer Motion |
| Routing | React Router v7 |
| Icons | Lucide React |
| Backend | Node.js + Express (in progress) |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (planned) |

---

## Color Palette

| Role | Name | Hex |
|---|---|---|
| Primary | Forest Green | `#2D6A4F` |
| Primary Light | Sage Green | `#40916C` |
| Accent | Warm Orange | `#F4845F` |
| Background | Cream | `#FAFAF7` |
| Surface | White | `#FFFFFF` |
| Text | Charcoal | `#1C1C1E` |
| Muted | Warm Gray | `#6B7280` |

> Greens convey trust, freshness, and sustainability. Orange adds food warmth and urgency. Cream background keeps it soft and food-neutral.

---

## Project Structure

```
Food_expiry_rescue_platform/
├── frontend/
│   └── food-rescue-frontend/       # React + Vite app
│       ├── src/
│       │   ├── assets/             # Static images / SVGs
│       │   ├── components/
│       │   │   ├── ui/             # Button, Badge, Modal, Skeleton, ToastContainer
│       │   │   ├── layout/         # Navbar, Footer, PageWrapper
│       │   │   └── shared/         # FoodCard, FilterBar, StatCounter
│       │   ├── context/
│       │   │   └── AuthContext.tsx # Mock auth state (role-based)
│       │   ├── data/
│       │   │   └── mockData.ts     # All mock listings, users, stats
│       │   ├── hooks/
│       │   │   └── useToast.tsx    # Toast context + hook
│       │   ├── pages/
│       │   │   ├── Landing.tsx
│       │   │   ├── Browse.tsx
│       │   │   ├── ListingDetail.tsx
│       │   │   ├── DonorDashboard.tsx
│       │   │   ├── RecipientDashboard.tsx
│       │   │   ├── Auth.tsx
│       │   │   └── About.tsx
│       │   ├── router/
│       │   │   └── index.tsx       # AnimatePresence route transitions
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── index.css           # Tailwind v4 theme tokens
│       ├── index.html
│       ├── vite.config.ts
│       └── package.json
├── backend/                        # Node.js + Express API (in progress)
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── utils/
│   │   ├── config/
│   │   ├── app.js
│   │   └── server.js
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── database/
├── deployment/
├── documentation/
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js >= 18
- npm >= 9

### Run the Frontend

```bash
cd frontend/food-rescue-frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

### Run the Backend (when ready)

```bash
cd backend
npm install
npm run dev
```

---

## Build Procedure (Step-by-Step)

### Phase 1 — Project Scaffolding ✅
- [x] Initialized Vite + React + TypeScript project inside `frontend/food-rescue-frontend/`
- [x] Installed dependencies: Tailwind CSS v4, Framer Motion, React Router v7, Lucide React
- [x] Configured `vite.config.ts` with `@tailwindcss/vite` plugin
- [x] Set up `index.css` with Tailwind v4 `@theme` tokens (colors, fonts, radius)
- [x] Added Inter font via Google Fonts in `index.html`
- [x] Updated page title to "FoodRescue — Fight Food Waste"

### Phase 2 — Mock Data Layer ✅
- [x] Defined TypeScript interfaces: `Listing`, `User`, `FoodCategory`, `ListingStatus`, `UserRole`
- [x] Created `MOCK_LISTINGS` — 6 realistic food donation listings with images, expiry, pickup windows
- [x] Created `MOCK_STATS` — platform-wide stats (meals saved, donors, NGOs, volunteers, cities, CO₂)
- [x] Created `MOCK_DONOR_HISTORY` — past donations with statuses
- [x] Created `MOCK_RECIPIENT_CLAIMS` — NGO claim history
- [x] Created `MOCK_USERS` — sample users across all 3 roles
- [x] Created `IMPACT_TIMELINE` — year-over-year growth data for charts

### Phase 3 — Auth & Toast Context ✅
- [x] `AuthContext.tsx` — mock login/logout with role selection (donor / recipient / volunteer), persists user state in React context
- [x] `useToast.tsx` — toast context with `toast(message, type)` and auto-dismiss after 4 seconds

### Phase 4 — UI Primitive Components ✅
- [x] `Button.tsx` — variants: primary, secondary, ghost, danger; sizes: sm, md, lg; loading spinner; Framer Motion tap/hover feedback
- [x] `Badge.tsx` — color-coded labels for categories and statuses
- [x] `Skeleton.tsx` — animated pulse skeleton + `CardSkeleton` composite
- [x] `Modal.tsx` — animated backdrop + panel with spring transition, accessible close button
- [x] `ToastContainer.tsx` — fixed bottom-right toast stack with slide-in animation, type icons, dismiss button

### Phase 5 — Layout Components ✅
- [x] `Navbar.tsx` — fixed top bar, scroll shadow, mobile hamburger menu with AnimatePresence, auth-aware (shows dashboard link + sign out when logged in)
- [x] `Footer.tsx` — dark green footer with navigation links and tagline
- [x] `PageWrapper.tsx` — wraps every page with Navbar + Footer + Framer Motion page transition (fade + slide)

### Phase 6 — Shared/Reusable Components ✅
- [x] `StatCounter.tsx` — animated number counter triggered on scroll into view using `useInView`
- [x] `FoodCard.tsx` — listing card with image, category badge, urgency timer (color-coded), donor info, hover lift animation
- [x] `FilterBar.tsx` — search input, category dropdown, expiry window dropdown, city input, clear filters button

### Phase 7 — Pages ✅

#### Landing Page ✅
- [x] Hero section with animated floating blobs, headline, CTA buttons
- [x] Floating stat cards on hero image (meals rescued, NGO count)
- [x] Stats bar with animated counters (meals, donors, NGOs, volunteers)
- [x] "How It Works" — 3-step section with scroll-triggered reveal
- [x] Live listings preview — 3 available cards pulled from mock data
- [x] Bottom CTA banner with dual role CTAs

#### Browse / Listings Page ✅
- [x] FilterBar (search, category, expiry, city)
- [x] Loading skeleton grid (6 cards, 900ms simulated delay)
- [x] Staggered card grid animation on load
- [x] Empty state with icon when no results match filters
- [x] Live filter count display

#### Listing Detail Page ✅
- [x] Full image, title, description, category badge
- [x] Info grid: servings, expiry countdown, pickup address, pickup window
- [x] Donor info card with avatar
- [x] Claim button → confirmation modal → mock async claim → toast notification
- [x] Claimed state UI (green banner with checkmark)
- [x] Redirects unauthenticated users to `/auth`
- [x] Back navigation button

#### Auth Page ✅
- [x] Sign In / Sign Up tab toggle with AnimatePresence slide transition
- [x] Role selector (Donor / NGO / Volunteer) with icon cards
- [x] Form fields: name, organization, email, password
- [x] Mock login — sets user in AuthContext, shows toast, redirects to correct dashboard
- [x] URL param support: `?mode=signup&role=donor`

#### Donor Dashboard ✅
- [x] Stats row: active listings, total donated, meals rescued
- [x] "Post Surplus Food" button → modal form with all fields
- [x] Mock async post → adds listing to local state → toast confirmation
- [x] Active listings list with image, title, quantity, status badge
- [x] Donation history list with grayscale images and status badges
- [x] Empty state for no listings
- [x] Auth guard — prompts sign in if not logged in

#### Recipient / NGO Dashboard ✅
- [x] Stats row: active claims, pickups completed, meals received
- [x] Tab switcher: Available Food / My Claims
- [x] Available tab — full FoodCard grid of available listings
- [x] Claims tab — list of claimed listings with address, date, status badge
- [x] Empty state for no claims
- [x] Auth guard

#### About / Impact Page ✅
- [x] Dark green hero with mission statement
- [x] Animated stat counters grid (6 metrics)
- [x] Animated bar chart — year-over-year meals rescued (bars grow on scroll into view)
- [x] Values section — 4 cards with icons
- [x] Team section — 3 member cards
- [x] CTA banner

### Phase 8 — Routing & Transitions ✅
- [x] React Router v7 with all 7 routes configured
- [x] `AnimatePresence` wrapping `<Routes>` for page-level transitions
- [x] Each page uses `PageWrapper` with enter/exit motion

---

## Remaining Work

### Frontend — Remaining ⬜

- [ ] **Volunteer Dashboard** — view available pickups, accept delivery tasks, track active routes
- [ ] **Notifications Page** — full notification history (currently only toast-based)
- [ ] **User Profile Page** — edit name, organization, contact info, profile photo upload
- [ ] **Map View on Browse Page** — toggle between grid and map view (requires map provider decision e.g. Leaflet/Mapbox)
- [ ] **Listing Edit/Delete** — donor ability to edit or remove their own active listings
- [ ] **Search with debounce** — currently filters on every keystroke; add 300ms debounce
- [ ] **Pagination or infinite scroll** on Browse page for large listing sets
- [ ] **PWA / mobile app shell** — add manifest, service worker for offline support
- [ ] **Dark mode** — Tailwind dark variant support
- [ ] **Accessibility audit** — full keyboard nav test, screen reader pass, ARIA improvements
- [ ] **Error boundary** — global React error boundary with fallback UI
- [ ] **404 page** — custom not-found route

### Backend — Remaining ⬜

- [x] **Auth API** — `POST /auth/register`, `POST /auth/login`, `GET /auth/profile`, `PUT /auth/profile`, `POST /auth/logout`
- [x] **JWT authentication** — signed tokens with 7d expiry, verified on every protected route
- [x] **bcrypt password hashing** — 12 salt rounds on register, constant-time compare on login
- [x] **Protected routes** — `protect` middleware (JWT verify) + `restrictTo(...roles)` role guard
- [x] **Input validation** — schema-based validate middleware (required, minLength, maxLength, pattern, enum)
- [x] **Env validation** — `config/env.js` crashes on startup if required vars are missing
- [x] **Database migration** — `002_users_platform_role.sql` adds `platform_role` + `organization` columns
- [ ] **Listings API** — full CRUD: `GET /listings`, `POST /listings`, `PATCH /listings/:id`, `DELETE /listings/:id`
- [ ] **Claims API** — `POST /listings/:id/claim`, `PATCH /claims/:id/status`
- [ ] **Users API** — `GET /users/me`, `PATCH /users/me`
- [ ] **Rate limiting** — express-rate-limit on auth endpoints
- [ ] **File uploads** — image upload for listings (S3 or local multer)
- [ ] **Email notifications** — send pickup confirmation emails (Nodemailer / SES)

### Infrastructure / Deployment — Remaining ⬜

- [ ] **Environment config** — `.env` files for frontend (Vite) and backend
- [ ] **Docker setup** — `Dockerfile` + `docker-compose.yml` for frontend + backend + postgres
- [ ] **CI/CD pipeline** — GitHub Actions for lint, type-check, build on PR
- [ ] **Frontend deployment** — Vercel or AWS Amplify
- [ ] **Backend deployment** — AWS EC2 / ECS or Railway
- [ ] **Database hosting** — AWS RDS PostgreSQL or Supabase

### Testing — Remaining ⬜

- [ ] **Unit tests** — component tests with Vitest + React Testing Library
- [ ] **Integration tests** — API endpoint tests with Supertest
- [ ] **E2E tests** — Playwright flows: sign up → post listing → claim → pickup

---

## Pages & Routes

| Route | Page | Status |
|---|---|---|
| `/` | Landing | ✅ Done |
| `/browse` | Browse Listings | ✅ Done |
| `/listing/:id` | Listing Detail | ✅ Done |
| `/auth` | Sign In / Sign Up | ✅ Done |
| `/donor` | Donor Dashboard | ✅ Done |
| `/recipient` | Recipient Dashboard | ✅ Done |
| `/about` | About / Impact | ✅ Done |
| `/volunteer` | Volunteer Dashboard | ⬜ Remaining |
| `/profile` | User Profile | ⬜ Remaining |
| `/notifications` | Notifications | ⬜ Remaining |

---

## Component Library

| Component | Location | Status |
|---|---|---|
| Button | `components/ui/Button.tsx` | ✅ Done |
| Badge | `components/ui/Badge.tsx` | ✅ Done |
| Modal | `components/ui/Modal.tsx` | ✅ Done |
| Skeleton / CardSkeleton | `components/ui/Skeleton.tsx` | ✅ Done |
| ToastContainer | `components/ui/ToastContainer.tsx` | ✅ Done |
| Navbar | `components/layout/Navbar.tsx` | ✅ Done |
| Footer | `components/layout/Footer.tsx` | ✅ Done |
| PageWrapper | `components/layout/PageWrapper.tsx` | ✅ Done |
| FoodCard | `components/shared/FoodCard.tsx` | ✅ Done |
| FilterBar | `components/shared/FilterBar.tsx` | ✅ Done |
| StatCounter | `components/shared/StatCounter.tsx` | ✅ Done |
| MapView | `components/shared/MapView.tsx` | ⬜ Remaining |
| NotificationBell | `components/shared/NotificationBell.tsx` | ⬜ Remaining |

---

## Animation Summary

| Animation | Implementation | Status |
|---|---|---|
| Page route transitions | Framer Motion `AnimatePresence` on `<Routes>` | ✅ |
| Hero floating blobs | `animate` with `repeat: Infinity` | ✅ |
| Scroll-triggered section reveals | `useInView` + `motion.div` | ✅ |
| Stat counters | `requestAnimationFrame` eased counter on `useInView` | ✅ |
| Card hover lift | `whileHover` y-translate + box-shadow | ✅ |
| Button tap feedback | `whileTap` scale + `whileHover` scale | ✅ |
| Toast slide-in | `AnimatePresence` + x/scale spring | ✅ |
| Modal spring entrance | Scale + y spring with backdrop fade | ✅ |
| Bar chart grow | `whileInView` height animation | ✅ |
| Mobile nav open/close | `AnimatePresence` height collapse | ✅ |
| Auth form tab switch | `AnimatePresence` x-slide | ✅ |
| Loading skeletons | CSS `animate-pulse` | ✅ |
