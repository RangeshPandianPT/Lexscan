import { Header } from "@/components/Header";
import { GeoHeatmap } from "@/components/GeoHeatmap";

export default function GeoPage() {
  return (
    <div className="app-content animate-fade-in">
      <Header
        title="Geographic Heatmap"
        breadcrumbs={[{ label: "LexScan" }, { label: "Geo Heatmap" }]}
      />
      <div className="mt-5">
        <GeoHeatmap />
      </div>
    </div>
  );
}
