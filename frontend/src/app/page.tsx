import { ViolationExplorer } from "@/components/ViolationExplorer";
import { GeoHeatmap } from "@/components/GeoHeatmap";
import { EvidenceCard } from "@/components/EvidenceCard";
import { LiveFeedTicker } from "@/components/LiveFeedTicker";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 p-8 pb-24 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">LexScan Dashboard</h1>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">1. Violation Explorer (Data Table)</h2>
          <ViolationExplorer />
        </section>

        <section className="space-y-4 pt-8 border-t border-slate-200">
          <h2 className="text-xl font-semibold">2. Geo Heatmap (Leaflet.js)</h2>
          <GeoHeatmap />
        </section>

        <section className="space-y-4 pt-8 border-t border-slate-200">
          <h2 className="text-xl font-semibold">3. Evidence Card (Bounding Box Overlay)</h2>
          <EvidenceCard
            imageUrl="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop"
            boundingBox={{ ymin: 100, xmin: 100, ymax: 200, xmax: 300 }}
            confidence={0.94}
          />
        </section>
      </div>

      <LiveFeedTicker />
    </main>
  );
}
