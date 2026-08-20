# LexScan — Frontend Dashboard

> Legal Metrology Compliance Intelligence Platform  
> Built with **Next.js 14 (App Router)** · **Tailwind CSS** · **Recharts** · **Leaflet.js** · **react-hook-form + Zod**

---

## Pages

| Route | Description | Owner |
|-------|-------------|-------|
| `/` | Overview Dashboard — KPI cards, compliance score rings, weekly trend chart, violation type pie | Nidhi |
| `/violations` | Violation Explorer — sortable/filterable table with expandable detail rows | Rangesh |
| `/geo` | Geographic Heatmap — Leaflet.js India map + state rankings panel | Rangesh |
| `/sellers` | Seller Analytics — ranked table, repeat offender highlighting, CSV export | Nidhi |
| `/admin` | Rule Studio — config-driven rule editor with react-hook-form + Zod validation | Nidhi |

---

## Getting Started

```bash
# Install dependencies
npm install

# Run mock API server (port 4000)
npx json-server --watch fixtures/db.json --port 4000

# Run dev server (port 3000)
npm run dev
```

## Environment

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000   # mock (json-server)
# NEXT_PUBLIC_API_URL=http://localhost:8000  # real backend (switch at Integration 2)
```

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `recharts` | Bar charts, pie charts for Overview dashboard |
| `react-hook-form` + `zod` | Form validation in Rule Studio |
| `leaflet` + `react-leaflet` | Interactive India heatmap |
| `lucide-react` | Icon library |
| `socket.io-client` | Live violation feed (WebSocket) |
| `json-server` | Mock REST API from fixtures/db.json |

## Architecture

```
src/
  app/
    layout.tsx          ← Root shell: Sidebar + LiveFeedTicker
    page.tsx            ← /  (Overview)
    violations/         ← /violations
    geo/                ← /geo
    sellers/            ← /sellers
    admin/              ← /admin
  components/
    Sidebar.tsx         ← Navigation (Nidhi)
    Header.tsx          ← Page header + breadcrumbs (Nidhi)
    OverviewDashboard.tsx ← Charts + KPIs (Nidhi)
    SellerAnalytics.tsx ← Seller table + CSV export (Nidhi)
    RuleStudio.tsx      ← Rule engine admin UI (Nidhi)
    ViolationExplorer.tsx ← Data table (Rangesh)
    EvidenceCard.tsx    ← Bounding box overlay (Rangesh)
    GeoHeatmap.tsx      ← Map wrapper (Rangesh)
    Map.tsx             ← Leaflet map (Rangesh)
    LiveFeedTicker.tsx  ← Real-time ticker (Rangesh)
```

## Integration Notes

- **Mock → Real API:** Change `NEXT_PUBLIC_API_URL` in `.env.local` from `:4000` to `:8000` — no code changes needed (all calls go through `lib/api.ts`).
- **WebSocket:** `LiveFeedTicker` uses `setInterval` mock; swap with `getSocket().on("new_violation", ...)` from `lib/socket.ts` at Integration 2.
- **Images:** `EvidenceCard` uses native `<img>` (required for `naturalWidth`/`naturalHeight` bounding-box scale math).
