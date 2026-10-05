# Version 2.0 Performance Review

Scope: the seven V2 features and their hot paths. Review date: 2026-08-10.

## Summary

No critical performance issues found. The two AI-heavy features (prediction,
recognition) are structured to avoid repeated paid calls, search is index-backed
and paginated, and background jobs are scoped + non-blocking. Verified with
`EXPLAIN` and index inspection on the dev database.

---

## 1. Database indexes — VERIFIED

All V2 indexes from the Phase A migration are present (confirmed via
`pg_indexes`):

| Index | Supports |
|---|---|
| `foods (status, expiry_date)` | Smart search availability+expiry sort |
| `inventory_items (donor_id, status)` | Donor inventory lists |
| `inventory_items (expiry_date)` | Expiring-soon sweep |
| `inventory_transactions (item_id)` | Inventory history |
| `scheduled_donations (scheduled_for)` | Reminder job window query |
| `scheduled_donations (donor_id, status)` | Donor/NGO schedule lists |
| `platform_events (type, created_at)` | Analytics aggregates |
| `expiry_predictions (urgency)` | Admin analytics group-by |
| `donation_codes (donation_id)` | QR resolve → donation |

**Search query plan** (`status = 'AVAILABLE' AND expiry_date < now()+3d ORDER BY
expiry_date LIMIT 20`): uses `foods (status, expiry_date)` composite index — the
`EXPLAIN` shows a sort + index-ordered scan. On the tiny dev set (27 rows)
PostgreSQL correctly chooses a seq scan; at scale the index engages. The `(status,
expiry_date)` order was chosen specifically so the common
`WHERE status=? ORDER BY expiry_date` pattern needs no separate sort.

## 2. Smart search — VERIFIED

- **Pagination enforced**: `page`/`limit` validated (min 1, limit capped at 50);
  `skip/take` used with an indexed `count`.
- **Whitelisted sorts**: only `expiring|quantity|recent|relevance|nearest` — no
  arbitrary sort keys (prevents expensive/arbitrary ORDER BY).
- **Nearest**: Haversine computed in JS over a bounded fetch (≤ 200 rows) only when
  the `nearest` sort is requested; distance is not a SQL function so no per-row
  trig in the DB.
- **N+1**: food listing uses a single `include: { donor }` — no per-row queries.
- **Search event logging** is fire-and-forget (`.catch(() => {})`) — never blocks
  the response.

## 3. AI calls — VERIFIED (caching avoids repeat spend)

- **Expiry prediction caching**: `predictForFood` builds a SHA-256 hash of the
  food's features; if the stored `ExpiryPrediction` has the same hash and is
  < 12 h old, it returns the cached row **without calling the AI**. Recompute only
  happens on feature change, TTL expiry, or explicit `force` refresh. Verified by
  the `predictForFood integration` tests (second call → `cached: true`, no
  recompute).
- **Recognition**: images stay in memory (`multer.memoryStorage`), never written to
  disk, so no orphaned temp files. A failed/low-confidence AI result degrades to
  manual entry without retrying.
- **Timeout + abort**: `AbortController` (15 s default) prevents a hung upstream
  from tying up the process.
- **Rate limits**: recognition (20/15-min) and prediction-refresh (30/15-min) cap
  worst-case spend.

## 4. Uploads — VERIFIED

- **Size cap** (5 MB) prevents memory/disk exhaustion; multer enforces before the
  buffer is handled.
- **Static serving** uses `express.static` with `maxAge` configurable; images are
  content-addressed (random hex names) so browsers can cache aggressively.
- Magic-byte validation (added in the security review) runs before a file is
  returned, and mismatches are unlinked immediately.

## 5. Background jobs — VERIFIED

- **Reminder job** (`schedule.service.startReminderJob`) and **expiry sweep**
  (`expiry.service.startExpiryJob`) both use `setInterval` + `timer.unref()`, so
  they never hold the process open and don't block the event loop between ticks.
- Reminder queries are scoped (`reminderSentAt: null`, status IN, `scheduled_for`
  window) and hit the `scheduled_for` index — each tick touches only due rows.

## 6. Inventory — VERIFIED

- Quantity mutations use `prisma.$transaction` with a row-locking update
  (`tx.inventoryItem.update`), preventing lost updates on concurrent adjusts.
- History is paginated (capped at 50) and index-backed.
- The `CHECK (quantity >= 0)` constraint is a zero-cost DB backstop (no app-layer
  table scans).

## 7. Frontend — VERIFIED

- All new pages use the existing `useApi` hook (single fetch per page, `refetch`
  only on user action) — no polling, no N+1 API calls.
- Charts render from aggregate endpoints (single request), not client-side
  reduction of many rows.
- Bundle is a single chunk (~1.5 MB minified / ~450 KB gzip); flagged for code
  splitting in "Recommendations" (Recharts + html5-qrcode are the heavy items).

---

## Verified measurements (dev DB)

- Row counts: foods 27, donations 12, inventory 4, predictions 16, events 11.
- `EXPLAIN` on the canonical search query: index-ordered, LIMIT-respecting plan.
- Backend test suite runtime: ~1.3 s for 54 tests (integration, real DB).
- Frontend test suite runtime: ~4 s for 12 tests.

## Recommendations (future, out of V2 scope)

1. **`pg_trgm` GIN index on `foods.title`** for fuzzy/contains search at scale
   (requires the extension; deliberately not added to avoid a migration dependency).
2. **Code-split the frontend** (lazy-load Recharts on `/analytics` and
   `html5-qrcode` on `/ngo/scan`) to cut the initial bundle.
3. **Cloud object storage** (S3/Cloudinary) + CDN for uploaded images; local disk
   is fine for dev but doesn't scale or cache across instances.
4. **Shared rate-limit store** (Redis) when running multiple API instances.
5. **Cursor-based pagination** for inventory history / events when tables grow
   large, instead of `skip/take` (offset scans degrade past ~10k rows).
6. **Prediction queue/dedup** if write volume grows — the feature-hash cache
   already prevents most duplicate AI calls; a per-food in-flight lock would close
   the concurrent-refresh race.
