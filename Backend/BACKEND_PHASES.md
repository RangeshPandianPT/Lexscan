# LexScan Backend: Architecture & Phase Division

This document outlines the backend execution plan for **LexScan**, explicitly divided for a two-person backend team (Developer C & Developer D). The focus is on building a robust, scalable **FastAPI** application with **PostgreSQL** and real-time **WebSocket** capabilities.

---

## 1. Architecture & Tech Stack
- **API Framework:** FastAPI (Python) for fast, async endpoints.
- **Database:** PostgreSQL.
- **Task Queue:** Celery + Redis (for handling background processing of AI tasks).
- **Real-time:** WebSockets (or Socket.io) for live frontend feeds.
- **Contract-First:** All APIs must exactly match the JSON schemas defined by the team early on.

---

## 2. Division of Responsibilities

The workload is split to ensure one developer handles core data storage/retrieval, while the other handles background processing, test data, and real-time events.

### Developer C (Core API & Database)
**Focus:** The Database Schema, Authentication, and the primary CRUD REST API.
- **Areas Owned:**
  1. **Database Setup:** Writing the PostgreSQL schemas/models and running initial migrations.
  2. **Core Endpoints:** `GET /products`, `GET /products/{id}`, `GET /violations`, `GET /sellers`, `GET /geo/heatmap`.
  3. **Ingestion Endpoint:** `POST /products/ingest` (The secure endpoint where Group 1's AI pushes data).
  4. **Authentication:** JWT Auth (`/auth/login`) and protecting officer-only admin routes.

### Developer D (Queue, Seed Data, & Real-time)
**Focus:** Populating test data, asynchronous background tasks, and live socket feeds.
- **Areas Owned:**
  1. **Seed Script:** A critical script to populate the DB with realistic fake data instantly.
  2. **Celery Worker:** Task queue configuration for triggering background AI crawls without freezing the API.
  3. **WebSocket Server:** Setting up `/ws/feed` to push live violations directly to the frontend's ticker.
  4. **Admin API:** `POST /admin/scan/trigger` and `GET/POST /admin/rules`.

---

## 3. Phased Execution Plan (36 Hours)

### Phase 1: Infrastructure & Seed (Hours 0 - 4)
*Goal: Get the local environment running and populate fake data for the frontend to use immediately.*
- **Both:** Lock the JSON schemas with the team (Frontend & AI) in Hour 1.
- **Developer C:** Create the `docker-compose.yml` (Postgres, Redis, API). Build the initial PostgreSQL tables.
- **Developer D:** **Top Priority:** Write the python seed script to generate 50-100 fake `ProductScan` records and insert them into the DB. *This completely unblocks the frontend team.*

### Phase 2: Core CRUD & Workers (Hours 4 - 8)
*Goal: Build out the main endpoints and background worker infrastructure.*
- **Developer C:** Implement the FastAPI core GET endpoints (products, violations, sellers). Ensure the auto-generated Swagger UI at `/docs` is live.
- **Developer D:** Set up Celery + Redis. Create a dummy background task that simulates an AI scan.

### Phase 3: Ingestion & Real-time (Hours 8 - 12)
*Goal: Prepare to connect with the AI Team and Frontend Team.*
- **Developer C:** Implement JWT Auth and the `POST /products/ingest` endpoint for Group 1 to push their results.
- **Developer D:** Build the WebSocket server (`/ws/feed`) and configure it to emit a message whenever a new violation is inserted into the database.

### Phase 4: Integration Windows (Hours 12 - 18)
*Goal: Plug into the other teams.*
- **Integration 1 (Hour 10-11):** Developer C works with the AI team to test `POST /products/ingest` using their real output.
- **Integration 2 (Hour 14-15):** Developer C monitors as the Frontend team points their dashboard to the real `:8000` API instead of their mock server.
- **Developer D:** Wire the Celery worker to actually invoke the AI pipeline script instead of the dummy task.

### Phase 5: Polish & Security (Hours 18 - 36)
*Goal: Make the API robust and handle errors gracefully.*
- **Developer C:** Add pagination, database indexing, and robust error handling (404s, 500s). Ensure admin routes are tightly protected.
- **Developer D:** Implement the Rule Studio endpoints (`/admin/rules`). Test the real-time WebSocket end-to-end to ensure it handles rapid events without crashing.
