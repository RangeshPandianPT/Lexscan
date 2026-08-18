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

### Developer A (You - Core Analytics & Data Presentation)
**Focus:** The "Bread and Butter" of the dashboard. Heavy data tables, charts, and detailed product views.
- **Pages Owned:** 
  1. **Overview Dashboard:** Compliance scorecards, Recharts visualizations (bar charts, pie charts).
  2. **Violation Explorer:** Advanced data tables with filtering/sorting.
  3. **Product Detail / Evidence Card:** The side-by-side bounding box UI for reviewing violations.
  4. **Seller Analytics:** Ranked tables and CSV export logic.

### Developer B (Partner - Specialized UI, Real-time & Architecture)
**Focus:** Infrastructure, map integrations, and real-time data flows.
- **Pages/Features Owned:**
  1. **Global Layout & Navigation:** Sidebar, Header, Breadcrumbs, and overall app shell.
  2. **Geo Heatmap:** Leaflet.js integration for state-wise violation mapping.
  3. **Admin Panel / Rule Studio:** Form handling for rule configuration and manual scans.
  4. **Live Violation Feed:** Socket.io integration and the real-time ticker component.

---

## 3. Phased Execution Plan (36 Hours)

### Phase 1: Foundation & Scaffold (Hours 0 - 4)
*Goal: Set up the repo, agree on the design system, and get the mock server running.*
- **Both:** Scaffold Next.js 14 App Router, install Tailwind CSS, shadcn/ui, and Lucide icons.
- **Developer A:** Set up `json-server` on port 4000 using the provided `/fixtures` schema. Create the base Recharts wrappers and card components.
- **Developer B:** Build the `RootLayout` (Sidebar, Header). Define the global CSS variables in `globals.css` to match the premium aesthetic. 

### Phase 2: Core Component Mockups (Hours 4 - 12)
*Goal: Build the static UIs using the mock data. No real backend required.*
- **Developer A:** 
  - Build the **Overview Page** (Stats cards, Violation Trend Bar Chart).
  - Build the **Violation Explorer** table (use shadcn/ui DataTable).
- **Developer B:** 
  - Integrate **Leaflet.js** and render the blank map for the **Geo Heatmap**.
  - Build the **Admin/Rule Studio** UI (forms with validation for rule editing).

### Phase 3: Advanced UI & Interactivity (Hours 12 - 16)
*Goal: Add the complex interactions, image overlays, and real-time stubs.*
- **Developer A:** 
  - Implement the **Evidence Card** (Product Detail page): Overlay the `bounding_box` coordinates over the raw image using CSS absolute positioning.
  - Build the **Seller Analytics** view.
- **Developer B:** 
  - Complete the **Geo Heatmap** choropleth logic (coloring states based on mock data density).
  - Build the **Live Feed Ticker** component at the bottom of the screen (mock the WebSocket events using `setInterval` for now).

### Phase 4: Backend Integration (Hours 16 - 24)
*Goal: Connect the frontend to the real backend (`http://localhost:8000`).*
- **Both:** Switch `NEXT_PUBLIC_API_URL` from `:4000` to `:8000`.
- **Developer A:** Test and fix data hydration for charts and tables. Ensure image URLs from the crawler load correctly.
- **Developer B:** Connect the **Live Feed** to the actual `/ws/feed` Socket.io endpoint. Wire up the Admin form POST requests to the real API.

### Phase 5: Polish & Perfection (Hours 24 - 36)
*Goal: Ensure the UI feels human-made, premium, and flawless for the demo.*
- **Developer A:** Refine empty states (e.g., "No violations found"). Ensure tables are responsive. Add subtle hover effects to table rows.
- **Developer B:** Polish map tooltips. Add toast notifications (shadcn/ui sonner) for when new live violations drop in. Ensure the Sidebar active states look crisp.
- **Both:** Do a full UI walkthrough. Check contrast, padding consistency, typography alignment, and eliminate any clunky "out-of-the-box" UI feels.
