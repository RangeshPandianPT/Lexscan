# Group 2 — Backend: What, Why & Phase-wise Plan
## LexScan | SIH PS 25057

---

## 🧠 First — What is the Backend Actually Doing?

Think of the backend as the **brain + memory** of LexScan.

- **Group 1 (AI/ML)** is like a field agent — it crawls product pages, reads labels using OCR, checks rules, and sends a **report (JSON)**.
- **Group 3 (Frontend)** is like the command center dashboard — it displays compliance statistics, India heatmaps, violation explorers, and live alerts.
- **Group 2 (us)** is the **station itself** — we store all product and violation records, serve data to the dashboard via REST API, and push real-time alerts when new violations occur.

---

## 🟢 How Far Can We Go Without Group 1 or Group 3?

**Phases 1 through 4 are 100% independent (Hours 0–10).**

| Phase | Needs Group 1? | Needs Group 3? | Strategy |
|---|---|---|---|
| **Phase 1 — Foundation** | ❌ No | ❌ No | Docker + schemas + project setup |
| **Phase 2 — Database + Kaggle Seed** | ❌ No | ❌ No | Kaggle CSV import + programmatic violation injection |
| **Phase 3 — The API** | ❌ No | ❌ No | Build & test all endpoints via Swagger against seeded DB |
| **Phase 4 — Auth + WebSocket** | ❌ No | ❌ No | Test JWT & Socket.io live feed independently |
| **Phase 5 — Integration** | ✅ Hour 10 | ✅ Hour 14 | Real G1 pipeline output + G3 frontend connection |

We use a **Kaggle e-commerce dataset (Flipkart/Amazon/BigBasket)** to get authentic product names, categories, and image URLs, and our seed script programmatically injects Legal Metrology violations so we can test the entire platform without waiting for anyone.

---

## 🏗️ What Are We Actually Building?

1. **PostgreSQL Database**: Relational storage for `sellers`, `products`, `violations`, `rules`, and `users`.
2. **FastAPI REST API**: High-performance API with auto-generated Swagger documentation at `/docs`.
3. **JWT Authentication**: Token-based security distinguishing regulatory officers from administrators.
4. **Celery + Redis Task Queue**: Asynchronous job handling for user-triggered on-demand product scans.
5. **WebSocket / Socket.io Feed**: Real-time push channel (`ws://localhost:8000/ws/feed`) powering the dashboard's live violation ticker.

---

## 👥 Role Split

| Task | Assignee | Focus Area |
|---|---|---|
| Database Models & Alembic Migrations | Anirudh | Core schema design, foreign keys, migrations |
| FastAPI CRUD & Aggregation Endpoints | Anirudh | Ingestion, filtering, summary stats, heatmap logic |
| JWT Authentication & Guards | Anirudh | Token generation, password hashing, role protection |
| WebSocket Event Dispatcher | Anirudh | Socket.io server integration on `/products/ingest` |
| Docker Compose Setup | Anirudh | Multi-container setup (Postgres + Redis + API) |
| Kaggle Data Ingestion Script (`seed.py`) | Member 2 | Parse Kaggle CSV, inject synthetic violations, populate DB |
| `.env.example` & Environment Config | Member 2 | Environment variable templates |
| Endpoint Testing via Swagger UI | Member 2 | Manual QA verification against seed data |
| JSON Fixtures Generator for Group 3 | Member 2 | Export static mock JSONs to `/fixtures/sample_data/` |
| Celery Background Task Setup | Member 2 | Worker configuration and scan job queueing |
| Rule Studio Admin Endpoints | Member 2 | `GET/POST /admin/rules` CRUD handlers |

---

## 📅 Phase-wise Implementation Plan (Kaggle Dataset Workflow)

---

### 🔵 PHASE 1 — Foundation & Environment Setup (Hour 0–1)
**Goal:** Backend services run locally with one command; data contracts are locked across all 6 team members.

1. **Schema Freeze:** Confirm field names and types for `ProductScan`, `Violation`, `Seller`, and `Rule` with Groups 1 & 3 (Section 4 of `PLAN-2.md`).
2. **Project Scaffolding:** Create directory structure (`app/api`, `app/db`, `app/schemas`, `app/workers`, `data/`).
3. **Containerization:** Write `docker-compose.yml` to spin up PostgreSQL (port 5432) and Redis (port 6379).
4. **Environment Config:** Create `.env.example` with database URLs, JWT keys, and CORS settings.
5. **Baseline Commit:** Push initial setup to `dev` branch immediately so other groups have repository access.

---

### 🔵 PHASE 2 — Database Schema & Kaggle Data Ingestion (Hour 1–4)
**Goal:** Database is fully modeled, Kaggle dataset is loaded, synthetic violations are injected, and Group 3 mock files are generated.

#### Step 1: Database Models & Migrations (Anirudh)
- Define SQLAlchemy ORM models: `Product`, `Violation`, `Seller`, `Rule`, `User`.
- Initialize Alembic, generate initial migration script, and run `alembic upgrade head`.

#### Step 2: Kaggle Dataset Sourcing & Ingestion (Member 2)
- Download a clean e-commerce product catalog CSV (e.g. *Flipkart Products* or *BigBasket Products* from Kaggle) and place it in `/backend/data/products.csv`.
- Write `scripts/seed.py` to read the CSV and enrich each product with Legal Metrology fields:
  - **Authentic fields from Kaggle:** `title`, `category`, `image_url`, `retail_price` (MRP).
  - **Synthesized seller & location:** Map to 1 of 20 generated Indian sellers with state assignments (Maharashtra, Delhi, Karnataka, Gujarat, etc.).
  - **Programmatic Violation Injection (~35%–40% of products):**
    - **15% Price Violations:** Set `listing_price = retail_price * 1.25` → create `PRICE_ABOVE_MRP` violation (`Rule 6(1)(e)`).
    - **15% Missing Label Fields:** Set `manufacturer = null` or `consumer_care = null` → create `MISSING_MANUFACTURER` or `MISSING_CONSUMER_CARE` violation.
    - **10% Date / Origin Violations:** Set `mfg_or_import_date = null` → create `MISSING_MFG_DATE` violation.
    - **60% Clean Products:** Fully compliant, `compliance_score = 95–100%`, zero violations.
- Run `seed.py` to:
  1. Populate all 5 PostgreSQL tables.
  2. Export a subset of 25 records into `/fixtures/sample_data/` for Group 3's `json-server`.

---

### 🔵 PHASE 3 — REST API Endpoints & Swagger Verification (Hour 4–8)
**Goal:** All 11 REST endpoints are live, operational, and tested in Swagger using the Kaggle seed data.

#### Endpoints Built (Anirudh):
1. `POST /api/v1/products/ingest` — Ingestion pipeline for Group 1 with JSON schema validation.
2. `GET /api/v1/products` — Paginated product catalog with filters (`platform`, `category`, `severity`, `seller_id`).
3. `GET /api/v1/products/{product_id}` — Detailed product view with associated violations and bounding boxes.
4. `GET /api/v1/violations` — Filterable violation list.
5. `GET /api/v1/violations/summary` — Aggregated metrics for dashboard charts (breakdown by violation type, severity, 7-day timeline).
6. `GET /api/v1/sellers` & `GET /api/v1/sellers/{seller_id}` — Seller compliance rankings and offense history.
7. `GET /api/v1/geo/heatmap` — State-wise violation counts for India choropleth map.
8. `GET/POST /api/v1/admin/rules` — Config-driven Legal Metrology rule manager.
9. `POST /api/v1/admin/scan/trigger` — Endpoint to queue manual URL scan tasks.

#### Verification (Member 2):
- Test every endpoint interactively on `http://localhost:8000/docs`.
- Validate that summary aggregations and heatmap responses return correct JSON structures.

---

### 🔵 PHASE 4 — Authentication, WebSocket Live Feed & Task Queue (Hour 8–10)
**Goal:** Secure the API with JWT, enable real-time dashboard notifications, and configure background scanning.

1. **JWT Authentication:** Implement `POST /api/v1/auth/login`, password verification, and token dependency guards on protected endpoints.
2. **WebSocket Live Feed:** Configure Socket.io server on `ws://localhost:8000/ws/feed`. When a new violation is ingested via `/products/ingest`, broadcast `{ "type": "new_violation", "data": <Violation> }`.
3. **Celery Task Setup:** Configure Celery worker connected to Redis to receive scan requests from `/admin/scan/trigger`.

---

### 🟡 PHASE 5 — Integrations, Real Data & Demo Polish (Hour 10–26)

#### Integration 1 (Hour 10–11) — Group 1 AI Pipeline Handoff:
- Group 1's crawler/OCR pipeline pushes real scanned products to `POST /products/ingest`.
- Verify database insertion, foreign key integrity, and WebSocket emission on live data.

#### Integration 2 (Hour 14–15) — Group 3 Dashboard Connection:
- Group 3 switches `NEXT_PUBLIC_API_URL` from mock server to `http://localhost:8000`.
- Verify CORS handling, check that charts and heatmaps render Kaggle dataset entries seamlessly.

#### Final Hardening & Demo Rehearsal (Hour 16–34):
- Implement database indexing on high-query columns (`platform`, `severity`, `detected_at`).
- Complete E2E rehearsal: trigger live scan → AI processes listing → backend ingests record → dashboard updates ticker via WebSocket in real time.

---

## 🎯 The "Seed Base + Live Ingestion" Demo Strategy

```
Historical Kaggle Dataset (100 products, 150 violations, 20 sellers)
→ Pre-loaded in Postgres
→ Gives instant rich charts, full-color India heatmap, and seller rankings
                             +
Live Group 1 AI Scan (Triggered during demo)
→ Ingested live via POST /products/ingest
→ Broadcasted instantly over WebSocket to the dashboard live ticker!
```

This guarantees your demo never looks empty or fragile, while still demonstrating genuine live AI processing.
