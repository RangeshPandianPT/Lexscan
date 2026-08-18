# LexScan — PS 25057 Execution Plan

**Team size:** 6 | **Groups:** 3 (2 people each) | **Duration:** 36 hours
**Purpose of this document:** This is the single source of truth. Nobody should need to ask "what am I building" or "what does the other group expect from me" — it's all here. Read your group's section fully before writing any code.

---

## 1. Scope Decision — What We're Actually Building

We have two source docs. Doc 1 (`ps_25057_implementation.pdf`) is the lean, buildable-in-36-hours plan. Doc 2 (`system_architecture_and_design_spec.pdf`) is the same system described at production/government scale, with several ideas that are cheap to bolt on and several that are not. We are **not** building Doc 2. We are building Doc 1, upgraded with the *cheap, high-impact* pieces of Doc 2.

| Feature | Source | Decision | Why |
|---|---|---|---|
| Config-driven rule engine (rules as JSON, not hardcoded if/else) | Doc 2 | ✅ **MVP** | Cheap, and directly answers the judge question "how do you handle rule changes" already in Doc 1 |
| Rule 26 exemption logic (small packages, bulk, unpackaged food) | Doc 2 | ✅ **MVP** | Just 3 extra conditional checks in the rule engine |
| Per-field confidence score (OCR + NER confidence, 0–100%) | Doc 2 | ✅ **MVP** | One extra float field per extracted attribute — negligible cost |
| SHA-256 hash of raw HTML/image at ingestion ("forensic" audit trail) | Doc 2 | ✅ **MVP** | One line of Python at ingest time, big demo/judge-answer payoff |
| YOLOv8/OpenCV label region cropping before OCR | Doc 1 (enhanced section) | ✅ **MVP** | Already scoped in Doc 1 as the answer to the PS's explicit "image recognition to crop label regions" requirement |
| Visual bounding-box + side-by-side discrepancy card in UI | Doc 2 | ✅ **MVP** | High visual "wow factor" for demo, moderate frontend cost |
| Officer Review Queue / HITL confidence routing UI | Doc 2 | 🟡 **Stretch** | Real feature, but a full second workflow — only if Group 3 finishes core pages early |
| Temporal rule versioning (effective_from/effective_to per rule) | Doc 2 | 🟡 **Stretch** | Adds real complexity to the rule engine; add only if Group 1 finishes the 6 core rules early |
| Bulk CSV/Excel ingestion endpoint | Doc 2 | 🟡 **Stretch** | Group 2 adds only after core CRUD + seed pipeline works |
| ONDC API integration | Doc 2 | ❌ **Slide-only** | Needs real ONDC sandbox credentials/onboarding we don't have time for |
| Chrome Extension | Doc 1 (future scope) | ❌ **Slide-only** | Separate codebase, not worth the hours |
| National portal webhook (e-Daakhil / NCH) | Doc 2 | ❌ **Slide-only** | No real endpoint to integrate against |
| Production cost/ROI model, govt deployment blueprint | Doc 1 | ❌ **Slide-only** | Goes straight into the pitch deck / feasibility report deliverable, not code |

**Rule of thumb:** if a "Stretch" or upgrade idea would require *any* group to wait on another group to build it, it doesn't happen. Independence beats feature count.

---

## 2. Team Structure

| Group | Focus | Members | Owns |
|---|---|---|---|
| **Group 1 — AI/ML** | Crawler + OCR/NLP + Rule Engine | Member A, Member B | Everything that turns a raw product listing into a scored JSON record |
| **Group 2 — Backend** | API + Database + Queue | Member C, Member D | Everything that stores, serves, and pushes that JSON record |
| **Group 3 — Frontend** | Dashboard | Member E, Member F | Everything the officer/judge sees and clicks |

*(Replace A–F with real names once assigned — keep the letters in branch names so this doc doesn't need editing.)*

---

## 3. Ground Rules (non-negotiable)

1. **Contract-first.** Nobody writes integration code against another group's actual server. Everybody writes against the schemas and mock data in `/fixtures`. Real integration only happens in the scheduled windows (Section 9).
2. **`main` is never touched directly.** No one pushes to `main`. No one opens a PR into `main` except the designated integrator, and only at the two checkpoints in Section 8.
3. **`dev` is the real branch.** All feature branches merge into `dev` via PR. `dev` is what everyone tests against after Hour 10.
4. **One branch per person, not per group.** Two people on the same group still get separate branches — merge conflicts inside a 2-person group are still real.
5. **If you need to change something in `/fixtures` (the contract), you announce it in the group chat *before* changing it**, not after. See Section 19.
6. **Commit often, in small chunks.** A branch that's one giant commit at Hour 30 is undebuggable and unreviewable.

---

## 4. THE CONTRACT — Shared Data Schemas

These live in `/fixtures/schema/*.json` in the repo (JSON Schema draft-07). Group 1 validates its output against these before handoff. Group 2 validates incoming data against these before insert. Group 3 can optionally generate TypeScript types from these with `json-schema-to-typescript`.

### 4.1 `ProductScan` — the core record

```json
{
  "product_id": "AMZ-IN-B09XYZ123",
  "platform": "amazon | flipkart | meesho",
  "url": "https://amazon.in/dp/B09XYZ123",
  "title": "string",
  "category": "cosmetics | packaged_food | electronics | baby_care | other",
  "seller_id": "string",
  "scraped_at": "2026-08-18T14:32:10+05:30",
  "raw_html_sha256": "hex string",
  "images": [
    { "url": "s3://bucket/path.jpg", "sha256": "hex string" }
  ],
  "extracted_fields": {
    "mrp": { "value": 399.0, "currency": "INR", "confidence": 0.94 },
    "net_quantity": { "value": "500g", "confidence": 0.88 },
    "manufacturer": { "value": "XYZ Pvt Ltd", "confidence": 0.91 },
    "country_of_origin": { "value": "India", "confidence": 0.76 },
    "consumer_care": { "value": null, "confidence": 0.0 },
    "mfg_or_import_date": { "value": "2026-01-15", "confidence": 0.82 }
  },
  "listing_price": 499.0,
  "compliance_score": 67,
  "violations": ["<violation_id>", "..."],
  "exemption_status": { "exempted": false, "reason": null }
}
```

### 4.2 `Violation`

```json
{
  "violation_id": "VIO-20260818-00042",
  "product_id": "AMZ-IN-B09XYZ123",
  "rule_id": "LM-R06-MRP-01",
  "clause": "Rule 6(1)(e), PC Rules 2011",
  "issue": "MANDATORY_MRP_MISSING | PRICE_ABOVE_MRP | MISSING_ORIGIN | MISSING_NET_QTY | MISSING_MANUFACTURER | MISSING_CONSUMER_CARE | MISSING_MFG_DATE",
  "severity": "HIGH | MEDIUM | LOW",
  "message": "Listed price (₹499) exceeds stamped MRP (₹399).",
  "confidence": 0.94,
  "bounding_box": { "ymin": 120, "xmin": 40, "ymax": 210, "xmax": 380 },
  "detected_at": "2026-08-18T14:32:17+05:30"
}
```

### 4.3 `Rule` (config-driven, not hardcoded)

```json
{
  "rule_id": "LM-R06-MRP-01",
  "rule_name": "Mandatory MRP Declaration",
  "act_reference": "Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(e)",
  "category": "ALL",
  "field": "mrp",
  "check": "not_null_and_positive",
  "severity": "HIGH",
  "active": true
}
```
*(Keep this simpler than Doc 2's full JSON-Logic AST for MVP — six rules like this cover the six core checks. Only move to full JSON-Logic if Group 1 has spare hours — see Stretch table.)*

### 4.4 `Seller`

```json
{
  "seller_id": "string",
  "seller_name": "string",
  "platform": "amazon | flipkart | meesho",
  "total_listings_scanned": 132,
  "total_violations": 47,
  "compliance_rate": 64.4,
  "state": "Maharashtra"
}
```

### 4.5 `Rule 26 Exemption` (attach to `ProductScan.exemption_status`)

```json
{ "exempted": true, "reason": "Rule 26(a): Net quantity exempted for packages ≤10g/10ml." }
```

**⚠️ These schemas are frozen after Hour 1.** Any change after that goes through Section 19.

---

## 5. THE CONTRACT — REST API (Group 2 builds this, everyone else codes against it)

Base URL: `http://localhost:8000/api/v1`

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/auth/login` | Returns `{access_token}` | Public |
| GET | `/products` | List scans, filters: `platform, category, severity, seller_id, page, limit` | Bearer |
| GET | `/products/{product_id}` | Full detail incl. violations + bounding boxes | Bearer |
| POST | `/products/ingest` | Internal — Group 1 pipeline (via Celery worker) pushes a completed `ProductScan` | Service key |
| GET | `/violations` | List, filters: `severity, platform, date_from, date_to` | Bearer |
| GET | `/violations/summary` | Aggregate counts for charts (top violation types, weekly trend) | Bearer |
| GET | `/sellers` | Ranked list, `sort=compliance_rate` | Bearer |
| GET | `/sellers/{seller_id}` | Detail + violation history | Bearer |
| GET | `/geo/heatmap` | State-wise violation density, filter `category` | Bearer |
| GET | `/admin/rules` | List current rule set | Bearer (officer) |
| POST | `/admin/rules` | Create/update a rule | Bearer (officer) |
| POST | `/admin/scan/trigger` | Manually trigger a crawl for a URL/category | Bearer (officer) |

**WebSocket:** `ws://localhost:8000/ws/feed` — emits `{ "type": "new_violation", "data": <Violation> }` every time the pipeline finishes a product. This is what powers the live ticker and Socket.io feed.

Group 2 publishes this as a live Swagger doc at `/docs` by Hour 4 — everyone should be pointed at it, not this static table, once it exists.

---

## 6. Repo Structure

```
/lexscan
  /crawler              (Group 1 — Member A)
  /ai-pipeline           (Group 1 — Member B)
  /backend               (Group 2 — Members C & D)
  /frontend              (Group 3 — Members E & F)
  /fixtures
    /schema              (the frozen JSON Schemas from Section 4)
    /sample_data          (realistic fake ProductScan/Violation JSON — everyone's mock data source)
  /docs
    PLAN.md               (this file)
    demo_script.md
  docker-compose.yml
  .env.example
```

---

## 7. Environment & Ports (avoid collisions)

| Service | Port | Owner |
|---|---|---|
| Next.js frontend | 3000 | Group 3 |
| FastAPI backend | 8000 | Group 2 |
| PostgreSQL | 5432 | Group 2 |
| Redis | 6379 | Group 2 |
| Celery Flower (monitor, optional) | 5555 | Group 2 |
| json-server (frontend mock API) | 4000 | Group 3 |

`docker-compose.yml` and `.env.example` are set up by Group 2 in Hour 0–1 and committed to `dev` immediately so everyone can `docker compose up` their own piece.

---

## 8. Git Workflow

```
main   ← only 2 merges ever happen here (Hour ~20 checkpoint, Hour ~34 final)
  ↑
dev    ← everyone's integration branch, protected, PR-only
  ↑
group1/membera-crawler
group1/memberb-ai-pipeline
group2/memberc-api
group2/memberd-queue-seed
group3/membere-dashboard-core
group3/memberf-dashboard-viz
```

### Branch naming
`group<N>/<member-first-name>-<short-feature>` — e.g. `group1/priya-crawler`, `group2/rahul-fastapi-crud`.

### Per-person loop
1. `git checkout dev && git pull`
2. `git checkout -b group2/rahul-fastapi-crud`
3. Work in small commits. Conventional commit prefixes: `feat:`, `fix:`, `chore:`, `docs:`, `test:`.
4. `git push origin group2/rahul-fastapi-crud`
5. Open a PR **into `dev`** (never `main`). Title = what it does, not "updates".
6. Your group partner reviews (2-person groups: your partner is your reviewer, no exceptions — even a 2-minute skim). If they're mid-task, self-merge is allowed but post in group chat so it's visible.
7. Squash-merge into `dev`. Delete the branch.
8. Pull `dev` again before starting your next branch.

### `main` merges — only the designated integrator (pick one person, e.g. Member D or whoever's least deep in a task at that hour) does this, and only twice:
- **Hour ~20:** first working checkpoint — safety net in case something breaks badly later.
- **Hour ~34:** final submission state.

### Hotfix protocol (Hour 30+)
If something on `dev` is broken close to demo time: branch off `dev` (`hotfix/<name>-<issue>`), fix, PR straight back into `dev`, fast-track review, merge immediately. Don't wait for a scheduled window this late.

---

## 9. Integration Windows (the only times groups actually depend on each other)

| Window | Hour | What happens |
|---|---|---|
| **Schema Lock** | 0–1 | All 6 people together. Walk through Section 4 & 5, adjust field names if needed, then freeze. |
| **Integration 1** | 10–11 | Group 1's real pipeline output is fed into Group 2's `/products/ingest`. Group 2 confirms it validates and inserts cleanly. |
| **Integration 2** | 14–15 | Group 3 swaps its mock API (`json-server` on :4000) for the real backend (`:8000`). Confirm every page still renders. |
| **Full E2E smoke test** | 18 | Everyone: `docker compose up`, run one product through crawler → pipeline → API → dashboard, watch it appear live. |
| **Second E2E + Socket.io check** | 26 | Confirm the live violation ticker actually updates in real time end-to-end. |

Outside these windows, **no group should be blocked waiting on another group.** If you find yourself blocked, you're missing a mock/fixture — go build it rather than waiting.

---

## 10. Group 1 — AI/ML (Member A + Member B)

**Mission:** Turn a product URL into a validated `ProductScan` JSON file that matches Section 4.1 exactly. You never need Postgres, FastAPI, or Next.js running to do your job.

### Member A — Crawler
- Hour 0–1: Schema lock + set up `/crawler` folder, dependencies (Playwright/Scrapy).
- Hour 1–4: Build Amazon crawler (start with the official Product Advertising API if credentials are available same-day, otherwise Playwright scraper) — outputs raw `{title, description, images[], seller_id, listing_price, url}`.
- Hour 4–8: Build Flipkart crawler (same output shape).
- Hour 8–10: Normalize both sources into one common raw format. Save to `/crawler/output/*.json` and images to `/crawler/output/images/`.
- Hour 10+: Run a live batch (500+ listings) for Group 1's own tuning + Group 2's real ingestion test at Integration 1.

**Self-test:** you're done with a milestone when `python validate.py output/sample.json` passes against nothing but your own raw schema — no dependency on anyone else yet.

### Member B — OCR + NLP + Rule Engine
- Hour 0–1: Schema lock + set up `/ai-pipeline` folder.
- Hour 1–4: Build the rule engine first, against **hand-written fake extracted-field JSON** (don't wait for real crawler data). Implement the 6 core checks (MRP, net quantity, manufacturer, origin, consumer care, mfg date) as config-driven `Rule` objects per Section 4.3, plus the 3 Rule 26 exemptions.
- Hour 4–8: Build OCR pipeline: OpenCV preprocess (grayscale, CLAHE, denoise) → EasyOCR → spaCy NER → populate `extracted_fields` with confidence scores.
- Hour 8–10: Wire crawler output (from Member A) → OCR/NLP → Rule Engine → final `ProductScan` JSON, validated against `/fixtures/schema/product_scan.json`.
- Hour 10–18: Tune accuracy on Member A's real crawled batch. Add YOLOv8-nano/OpenCV contour label-region cropping if time allows (this is the PS's explicit "image recognition to crop label regions" requirement — prioritize it over stretch rule-versioning).
- Hour 18+: SHA-256 hash raw HTML/images at crawl time (cheap, do this once crawler + pipeline are stable).

**Self-test:** run the full pipeline on 10 sample product images end-to-end, confirm every output JSON validates against the schema, before touching Integration 1.

**Branches:** `group1/<name>-crawler`, `group1/<name>-ai-pipeline`

---

## 11. Group 2 — Backend (Member C + Member D)

**Mission:** Store, serve, and push `ProductScan`/`Violation` records exactly as specified in Sections 4 & 5. You never need Group 1's real pipeline or Group 3's UI to do your job — build against seed data.

### Member C — Database + API
- Hour 0–1: Schema lock + write `docker-compose.yml` (Postgres, Redis, backend, frontend service stubs) + `.env.example`. Commit to `dev` immediately.
- Hour 1–4: PostgreSQL schema — tables for `products`, `violations`, `sellers`, `rules`, `scans`, mirroring Section 4 exactly.
- Hour 4–8: FastAPI CRUD endpoints per Section 5 (`/products`, `/violations`, `/sellers`, `/geo/heatmap`). Swagger docs live at `/docs`.
- Hour 8–10: JWT auth (`/auth/login`), officer-only guard on `/admin/*`.
- Hour 10–11: **Integration 1** — accept Member A/B's real JSON via `/products/ingest`, confirm DB writes are clean.
- Hour 11+: Harden — pagination, filtering, error handling.

### Member D — Queue + Seed Data + Realtime
- Hour 0–1: Schema lock.
- Hour 1–3: **Write the seed script first** — generates 50–100 realistic fake `ProductScan` + `Violation` records matching Section 4, inserts into Postgres. This is what unblocks Member C's endpoint testing *and* Group 3's early mock work — top priority.
- Hour 3–8: Celery + Redis task queue — worker that will eventually pick up crawler jobs and call the AI pipeline (stub the AI call with a fake response until Integration 1).
- Hour 8–12: Socket.io/WebSocket server (`/ws/feed`) — push `new_violation` events whenever a record is inserted.
- Hour 12–18: Wire Celery worker to actually invoke Group 1's pipeline for live-triggered scans (`/admin/scan/trigger`).
- Hour 18+: Rule Studio admin endpoints (`GET/POST /admin/rules`) so the config-driven rule engine can be edited without redeploying.

**Self-test:** with only the seed script and `docker compose up`, every endpoint in Section 5 should return real-looking data and be fully testable via Swagger before Group 1 or Group 3 exist to you.

**Branches:** `group2/<name>-fastapi-crud`, `group2/<name>-queue-seed`

---

## 12. Group 3 — Frontend (Member E + Member F)

**Mission:** Build all 5 dashboard pages against the API contract in Section 5 — using a mock server until Integration 2, never waiting on the real backend.

### Setup (both, Hour 0–1)
- Scaffold Next.js 14 (App Router) + Tailwind + shadcn/ui.
- Set up `json-server` on port 4000, pointed at `/fixtures/sample_data/*.json` (ask Member D for the seed script's output, or generate your own fakes matching Section 4 — don't wait).
- All API calls go through a single `lib/api.ts` with the base URL as an env var (`NEXT_PUBLIC_API_URL`), so switching from mock (`:4000`) to real (`:8000`) at Integration 2 is a one-line `.env` change, not a code change.

### Member E — Overview, Violation Explorer, Seller Analytics
- Hour 1–6: **Overview page** — compliance score cards per platform, weekly violations bar chart (Recharts), top violation types pie chart.
- Hour 6–12: **Violation Explorer** — filterable table (platform/category/seller/severity/date), detail view on click showing product image + extracted fields + bounding box overlay (the evidence card from Doc 2, Section 4.1).
- Hour 12–16: **Seller Analytics** — ranked table, repeat-offender highlighting, CSV export button (PDF export is stretch).
- Hour 16+: Polish, loading states, empty states.

### Member F — Geo Heatmap, Admin, Live Feed
- Hour 1–8: **Geo Heatmap** — Leaflet.js + India GeoJSON, choropleth by violation density, category filter.
- Hour 8–12: **Admin page** — rule list/editor (calls `/admin/rules`), manual scan trigger form.
- Hour 12–16: **Live violation feed** — Socket.io client, real-time ticker at the bottom of Overview, connects to `/ws/feed`.
- Hour 16+: If ahead of schedule, build the Officer Review Queue (HITL stretch feature) — low-confidence violations shown side-by-side for approve/reject.

**Self-test:** every page should be fully clickable and populated using `json-server` mock data alone before Integration 2 — if a page depends on the real backend to even render, that's a design smell, fix it.

**Branches:** `group3/<name>-dashboard-core`, `group3/<name>-dashboard-viz`

---

## 13. 36-Hour Master Timeline

| Hours | Group 1 | Group 2 | Group 3 |
|---|---|---|---|
| 0–1 | **All 6 together:** lock schemas (Section 4), lock API contract (Section 5) | | |
| 1–4 | Crawler (A) + Rule Engine on fake data (B) | Docker/env setup, DB schema (C) + seed script (D) | Scaffold Next.js, set up json-server mock (E+F) |
| 4–8 | Flipkart crawler (A) + OCR pipeline (B) | FastAPI CRUD (C) + Celery setup (D) | Overview page (E) + Geo Heatmap (F) |
| 8–10 | Normalize + wire pipeline end-to-end | Auth (C) + WebSocket server (D) | continue Overview/Explorer (E), Heatmap/Admin (F) |
| **10–11** | **Integration 1: push real JSON → `/products/ingest`** | | |
| 11–14 | Tune accuracy on real batch | Harden endpoints, connect Celery→pipeline | Violation Explorer (E), Admin page (F) |
| **14–15** | | | **Integration 2: swap mock API → real API** |
| 15–18 | Add YOLOv8 label cropping | Rule Studio admin endpoints | Seller Analytics (E), Live feed wiring (F) |
| **18** | **Full E2E smoke test — everyone** | | |
| 18–26 | SHA-256 evidence hashing, more real data | Polish, error handling | Live feed real-time test, polish |
| **20** | **Checkpoint merge: `dev` → `main`** (integrator only) | | |
| **26** | **Second E2E + Socket.io check — everyone** | | |
| 26–30 | Buffer / stretch features if ahead | Buffer / stretch features if ahead | Stretch: HITL review queue if ahead |
| 30–34 | Demo prep, bug fixes together | | |
| **34** | **Final merge: `dev` → `main`** (integrator only) | | |
| 34–36 | Dry-run demo 3x, prep judge Q&A, backup video |

---

## 14. Communication Protocol

- **Standup every 4 hours** (Hour 4, 8, 12, 16, 20, 24, 28, 32) — 5 minutes max, one message per group in the team chat: *what's done, what's blocked, what's next.*
- **Any schema/contract change** posted immediately, tagged `@everyone` — see Section 19.
- **Blocked = say so immediately**, don't sit on it. Under this plan nobody should be blocked outside the integration windows — if you are, something's wrong with the mock setup.

---

## 15. Definition of Done (per group, before Integration windows)

**Group 1** — done for Integration 1 when: pipeline runs on 10 sample images end-to-end, every output JSON passes `jsonschema` validation against `/fixtures/schema/product_scan.json`.

**Group 2** — done for Integration 1 when: `/products/ingest` accepts a schema-valid `ProductScan` and it appears correctly in Postgres and via `GET /products/{id}`. Done for Integration 2 when: every endpoint in Section 5 is live in Swagger and returns seed data.

**Group 3** — done for Integration 2 when: all 5 pages render fully against mock data with no hardcoded placeholders, and `NEXT_PUBLIC_API_URL` is the only thing that needs to change to go live.

---

## 16. Risk Register

| Risk | Mitigation |
|---|---|
| Schema drifts mid-hackathon, breaks another group | Freeze after Hour 1; changes require chat announcement + version bump (Section 19) |
| OCR accuracy too low on real images | Member B tunes against real batch by Hour 18; fallback to Google Vision API for the demo's specific sample products if EasyOCR struggles |
| Amazon/Flipkart blocks scraping mid-hackathon | Member A has a pre-scraped fallback batch (from Hour 8) saved locally, independent of live scraping working at demo time |
| Live demo fails in front of judges | Backup: pre-recorded 3-minute demo video, ready by Hour 32 |
| Merge conflicts eat time late in the hackathon | Small, frequent commits; one branch per person, not per group |
| `dev` breaks badly close to demo | Hour 20 checkpoint merge to `main` is the safety net to roll back to |

---

## 17. Demo Script (condensed — full version in `/docs/demo_script.md`)

1. Dashboard → India compliance heatmap across platforms.
2. Violation Explorer → live listing, click into a violation → bounding box + rule citation + confidence score.
3. Seller Analytics → repeat offender, auto-generated notice.
4. Trigger a live scan → watch it land on the live feed ticker in real time.
5. Admin panel → edit a rule with zero code changes → close with the config-driven rule engine story (this directly answers the judges' "how do you handle regulation changes" question).

---

## 18. Judge Q&A Cheat Sheet

*(carried over from Doc 1 — memorize, don't read off a slide)*

- **Running cost?** Zero paid APIs in the prototype; open-source stack (EasyOCR, OpenCV, spaCy).
- **Anti-scraping handling?** Official APIs first, Playwright + polite rate-limiting as fallback.
- **OCR accuracy on blurry images?** OpenCV preprocessing (CLAHE, deskew, Otsu) + label-region cropping before OCR.
- **Rule updates?** Config-driven rule engine — officers edit via Admin panel, zero code changes.
- **Regional languages?** EasyOCR + multilingual NER support Hindi and other languages.
- **Legally grey scraping?** Official APIs primary; public-metadata inspection framed as regulatory enforcement, no PII collected.

---

## 19. Schema Change Request Process

If, after Hour 1, someone realizes a field is missing or wrong:
1. Post in the group chat: what field, why, which groups it affects.
2. Get a thumbs-up from one person in each *other* affected group (not just your own).
3. Update `/fixtures/schema/*.json` on a small branch (`chore/schema-update-<field>`), PR into `dev`, fast merge.
4. Bump a version comment at the top of the changed schema file so people notice it changed.

Do this rarely. Every schema change is a tax on the other two groups.
