# LexScan Frontend: Architecture & Phase Division

This document outlines the frontend execution plan for **LexScan**, explicitly divided for a two-person frontend team (Developer A & Developer B). The focus is on building a **clean, premium, human-crafted dashboard** that avoids the generic "AI-generated" look, utilizing modern aesthetics (subtle shadows, deliberate whitespace, refined typography, and purposeful micro-animations).

---

## 1. Design & Aesthetic Philosophy
To ensure the platform looks professional, trustworthy, and premium:
- **Typography:** Use a clean, modern sans-serif like **Inter** or **Geist** for UI elements, and a monospaced font like **JetBrains Mono** for data/JSON snippets.
- **Color Palette:** Avoid harsh primary colors. Use a sophisticated, muted palette:
  - **Background:** Off-white or subtle cool gray (e.g., `#F8FAFC` or `#F9FAFB`).
  - **Primary Accent:** Deep, trustworthy indigo or slate blue (e.g., `#2563EB` or `#0F172A`).
  - **Semantic Colors:** Soft reds/greens for violations/compliance (e.g., `#EF4444` for high severity, but with a low-opacity background for badges).
- **Components (shadcn/ui):** Customize default components to have slightly softer borders, subtle box-shadows (`shadow-sm`), and consistent padding. No harsh black borders unless intended for high contrast.
- **Animations:** Keep it professional. Use extremely subtle fade-ins for page loads and gentle transitions on hover states (`transition-all duration-200`).

---

## 2. Division of Responsibilities

The workload is split to minimize merge conflicts and allow each developer to focus on specialized functional areas. 

### Rangesh (Lead - Complex Logic & Real-time Infrastructure)
**Focus:** The heavy technical lifting. Complex state management, real-time data, and advanced integrations.
- **Pages/Features Owned:** 
  1. **Violation Explorer:** Advanced data tables with multi-column filtering, sorting, and pagination.
  2. **Product Detail / Evidence Card:** Complex bounding box coordinate math mapped over raw images.
  3. **Geo Heatmap:** Leaflet.js map integration with dynamic choropleth data rendering.
  4. **Live Violation Feed:** Socket.io WebSocket integration and real-time state management.

### Nidhi (Core UI, Dashboards & Visuals)
**Focus:** The visual aesthetics, charts, forms, and user experience. 
- **Pages/Features Owned:**
  1. **Global Layout & Navigation:** Sidebar, Header, Breadcrumbs, and responsive app shell.
  2. **Overview Dashboard:** Compliance scorecards and Recharts data visualizations (bar/pie charts).
  3. **Admin Panel / Rule Studio:** Form building and validation (react-hook-form) for the rule engine.
  4. **Seller Analytics:** Ranked tables, CSS styling, and overall UI polish.

---

## 3. Phased Execution Plan (36 Hours)

### Phase 1: Foundation & Scaffold (Hours 0 - 4)
*Goal: Set up the repo, agree on the design system, and get the mock server running.*
- **Both:** Scaffold Next.js 14 App Router, install Tailwind CSS, shadcn/ui, and Lucide icons.
- **Rangesh:** Set up `json-server` on port 4000 using the provided `/fixtures` schema. Set up Socket.io client stubs for the real-time feed.
- **Nidhi:** Build the `RootLayout` (Sidebar, Header). Define the global CSS variables in `globals.css` to match the premium aesthetic. Create base Recharts wrappers.

### Phase 2: Core Component Mockups (Hours 4 - 12)
*Goal: Build the static UIs using the mock data. No real backend required.*
- **Rangesh:** 
  - Build the **Violation Explorer** table (use shadcn/ui DataTable with complex filtering state).
  - Integrate **Leaflet.js** and render the map for the **Geo Heatmap**.
- **Nidhi:** 
  - Build the **Overview Page** (Stats cards, Violation Trend Bar Chart).
  - Build the **Admin/Rule Studio** UI (forms with validation for rule editing).

### Phase 3: Advanced UI & Interactivity (Hours 12 - 16)
*Goal: Add the complex interactions, image overlays, and real-time stubs.*
- **Rangesh:** 
  - Implement the **Evidence Card** (Product Detail page): Overlay the `bounding_box` coordinates over the raw image using CSS absolute positioning math.
  - Build the **Live Feed Ticker** component (mock the WebSocket events using `setInterval` for now).
- **Nidhi:** 
  - Complete the **Seller Analytics** view.
  - Polish the Overview dashboard charts and ensure the app shell is perfectly responsive.

### Phase 4: Backend Integration (Hours 16 - 24)
*Goal: Connect the frontend to the real backend (`http://localhost:8000`).*
- **Both:** Switch `NEXT_PUBLIC_API_URL` from `:4000` to `:8000`.
- **Rangesh:** Connect the **Live Feed** to the actual `/ws/feed` Socket.io endpoint. Test and fix data hydration for the complex tables and map.
- **Nidhi:** Wire up the Admin form POST requests to the real API. Ensure image URLs from the crawler load correctly into your UI components.

### Phase 5: Polish & Perfection (Hours 24 - 36)
*Goal: Ensure the UI feels human-made, premium, and flawless for the demo.*
- **Rangesh:** Refine complex state edge cases (e.g., WebSocket disconnects, map resize bugs). Ensure tables handle large datasets gracefully without lag.
- **Nidhi:** Polish tooltips, empty states (e.g., "No violations found"), and add toast notifications (shadcn/ui sonner). Ensure the Sidebar active states look crisp.
- **Both:** Do a full UI walkthrough. Check contrast, padding consistency, typography alignment, and eliminate any clunky "out-of-the-box" UI feels.
