# Version 2.0 API Reference

All endpoints are under `/api`. Responses follow the V1 envelope:
`{ success, data }` or `{ success, message }`, plus `pagination` where relevant.
Errors: `{ success: false, message }` (+ `errors[]` on validation failure).

Auth: `Authorization: Bearer <JWT>` via the V1 `protect` middleware. Roles:
`DONOR`, `NGO`, `ADMIN`.

---

## 1. AI Expiry Prediction

### `GET /api/foods/:id/prediction`

Public. Returns the cached prediction (computes on first call).

```json
{
  "success": true,
  "data": {
    "prediction": {
      "id": "…", "foodId": "…", "featuresHash": "…",
      "urgency": "HIGH",
      "riskScore": 72,
      "recommendation": "Prioritize this donation within the next few hours.",
      "explanation": { "factors": ["remaining shelf life is 6 hour(s)", "Prepared is moderately perishable"], "model": "rules" },
      "model": "rules", "createdAt": "…", "updatedAt": "…",
      "disclaimer": "This is an AI estimate … NOT a food-safety certification …"
    },
    "cached": false,
    "disclaimer": "…"
  }
}
```

`urgency`: `LOW | MEDIUM | HIGH | CRITICAL`. `riskScore`: 0–100.

### `POST /api/foods/:id/expiry-prediction`

`protect` (food owner or admin). Force-refreshes the prediction. Body optional
(`{ force: true }` is implied). Rate-limited: 30 req / 15 min.

---

## 2. Image Recognition

### `POST /api/foods/recognize-image`

`protect`, `restrictTo("DONOR")`. Multipart `image` field (jpeg/png/webp, ≤ 5 MB).
Rate-limited: 20 req / 15 min.

```json
{
  "success": true,
  "data": {
    "suggestion": { "foodName": "Cooked Rice", "category": "Prepared", "confidence": 91, "description": "…" },
    "manualEntry": false,
    "source": "ai"
  }
}
```

Low confidence / AI unavailable → `suggestion: null`, `manualEntry: true`.

### `POST /api/uploads/food-image`

`protect`. Multipart `image` field → stores to disk, verifies magic bytes.

```json
{ "success": true, "data": { "url": "/uploads/foods/<hex>.png", "filename": "<hex>.png", "size": 12345 } }
```

Pass `url` as `imageUrl` to the existing `POST /api/foods`.

---

## 3. QR / Barcode

### `POST /api/donations/:id/qr`

`protect` (donor/NGO/admin of that donation). Generates/re-generates the code.

```json
{ "success": true, "data": { "id": "…", "code": "FRD-<32hex>", "qrDataUrl": "data:image/png;base64,…", "expiresAt": "…" } }
```

### `GET /api/donations/qr/:code`

`protect`. Resolves + authorizes. Authenticated users get a summary; only
donor/NGO/admin get `full: true` (with the `donation` object). Counts the scan.

```json
{ "success": true, "data": { "code": "FRD-…", "status": "PICKUP_SCHEDULED", "foodTitle": "…", "pickupLocation": "…", "city": "…", "scheduledAt": "…", "authorized": true, "full": true, "donation": { } } }
```

### `POST /api/donations/qr/validate`

`protect`. Body `{ code }` → `{ valid: true, donationId, status }` (no scan count).

### `POST /api/donations/:id/scan/collect` · `POST /api/donations/:id/scan/deliver`

`protect` (claiming NGO). Confirms collection/delivery via the V1 state machine.

---

## 4. Smart Search & Recommendations

### `GET /api/foods/search`

Query params (all optional, validated):
`q, category, city, status (AVAILABLE|CLAIMED|EXPIRED), availability (true|false),
expiryBefore, expiryAfter, urgency (hours), minQty, maxQty, lat, lng,
sort (expiring|quantity|recent|relevance|nearest), page, limit (≤50)`.

```json
{
  "success": true,
  "data": [ { …food… } ],
  "pagination": { "total": 18, "page": 1, "limit": 20, "pages": 1 }
}
```

### `GET /api/foods/recommendations`

`protect` (NGO-friendly). Ranked available food with `matchScore` (0–100),
`matchReasons[]`, and `distanceKm` when the user has coordinates.

```json
{ "success": true, "data": [ { "…food…", "matchScore": 63, "matchReasons": ["expiring soon", "nearby"], "distanceKm": 2.4 } ], "count": 18 }
```

---

## 5. Inventory

All routes `protect, restrictTo("DONOR")`. Router: `/api/inventory`.

| Method + Path | Body | Notes |
|---|---|---|
| `GET /api/inventory` | — | filters `status, category, search, page, limit` |
| `GET /api/inventory/history` | — | transaction log, paginated |
| `GET /api/inventory/:id` | — | owner-only |
| `POST /api/inventory` | `{ name, quantity, expiryDate, category?, unit?, preparationDate?, storageCondition?, location? }` | creates + ADD transaction |
| `PUT /api/inventory/:id` | partial fields | owner-only |
| `DELETE /api/inventory/:id` | — | soft remove (REMOVE transaction) |
| `POST /api/inventory/:id/adjust` | `{ delta, note? }` | signed change; negatives blocked |
| `POST /api/inventory/:id/donate` | `{ quantity, title?, description?, pickupLocation?, city? }` | creates a real Food listing in one transaction |
| `POST /api/inventory/:id/expired` | — | marks EXPIRED + EXPIRE transaction |

---

## 6. Scheduled Donations

All under `/api/donations`. `protect` required.

| Method + Path | Role | Notes |
|---|---|---|
| `POST /api/donations/schedule` | DONOR | creates schedule (+ Food listing if no `foodId`); rejects past/expired |
| `GET /api/donations/scheduled` | DONOR | own schedules |
| `GET /api/donations/scheduled/ngo` | NGO | open schedules |
| `PUT /api/donations/scheduled/:id` | DONOR | reschedule `{ scheduledFor }` |
| `POST /api/donations/scheduled/:id/cancel` | DONOR | restores food to AVAILABLE |
| `POST /api/donations/scheduled/:id/accept` | NGO | claims food + sets PICKUP_SCHEDULED |

---

## 7. Admin V2 Analytics & Events

### `GET /api/analytics/v2`

`protect, restrictTo("ADMIN")`. Aggregates:

```json
{
  "success": true,
  "data": {
    "predictions": { "byUrgency": [{ "urgency": "HIGH", "count": 5, "avgRisk": 70 }], "byModel": [], "total": 16 },
    "inventory": { "byStatus": [{ "status": "IN_STOCK", "count": 2, "totalQty": 140 }], "expiringSoon": 1 },
    "schedules": { "byStatus": [], "total": 2 },
    "qr": { "totalCodes": 3, "totalScans": 5 },
    "expiryTrends": [{ "category": "Prepared", "count": 2 }],
    "events": { "searchCount": 7, "languageCount": 3 }
  }
}
```

### `POST /api/analytics/events`

`protect`. Body `{ type: "LANGUAGE_CHANGE", metadata: { lang } }`. Metadata capped
at 500 chars. (Search events are logged server-side automatically.)

---

## Auth & errors

- 401 no/invalid/expired token; 403 wrong role / not the owner; 404 not found;
  400 validation/business rule; 500 unexpected.
- `PATCH /api/donations/:id/status` and all V1 endpoints are unchanged.
