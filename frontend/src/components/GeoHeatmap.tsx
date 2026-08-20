"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 rounded-lg flex items-center justify-center">
      <div className="text-slate-400 text-sm animate-pulse">Loading map…</div>
    </div>
  ),
});

const LEGEND = [
  { label: "High Density", color: "#EF4444", bg: "#FEF2F2" },
  { label: "Medium Density", color: "#F59E0B", bg: "#FFFBEB" },
  { label: "Low Density", color: "#3B82F6", bg: "#EFF6FF" },
];

const STATE_DATA = [
  { state: "Delhi", violations: 145, density: "HIGH" },
  { state: "Maharashtra", violations: 120, density: "HIGH" },
  { state: "Uttar Pradesh", violations: 98, density: "HIGH" },
  { state: "Karnataka", violations: 85, density: "MEDIUM" },
  { state: "West Bengal", violations: 71, density: "MEDIUM" },
  { state: "Gujarat", violations: 62, density: "MEDIUM" },
  { state: "Tamil Nadu", violations: 45, density: "LOW" },
  { state: "Rajasthan", violations: 38, density: "LOW" },
];

export function GeoHeatmap() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="card lg:col-span-2" style={{ height: 500 }}>
          <div className="card-header">
            <span className="text-[13px] font-semibold text-slate-800">India Violation Heatmap</span>
            <div className="flex items-center gap-3">
              {LEGEND.map((l) => (
                <div key={l.label} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: l.color }}
                  />
                  {l.label.split(" ")[0]}
                </div>
              ))}
            </div>
          </div>
          <div className="flex-grow rounded-b-lg overflow-hidden" style={{ height: "calc(100% - 52px)" }}>
            <Map />
          </div>
        </div>

        {/* State Rankings */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <span className="text-[13px] font-semibold text-slate-800">State Rankings</span>
            <span className="text-[11px] text-slate-400">by violations</span>
          </div>
          <div className="divide-y divide-slate-100">
            {STATE_DATA.map((s, i) => {
              const max = STATE_DATA[0].violations;
              const pct = (s.violations / max) * 100;
              const color =
                s.density === "HIGH" ? "#EF4444" : s.density === "MEDIUM" ? "#F59E0B" : "#3B82F6";
              return (
                <div key={s.state} className="px-5 py-3.5 flex items-center gap-3">
                  <span className="text-[11px] font-mono text-slate-400 w-5">{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12.5px] font-medium text-slate-800">{s.state}</span>
                      <span className="text-[12px] font-bold" style={{ color }}>{s.violations}</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: color, transition: "width 0.5s ease" }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
