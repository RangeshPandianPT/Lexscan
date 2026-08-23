"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[var(--bg-subtle)] rounded-xl flex items-center justify-center">
      <div className="text-[var(--text-tertiary)] text-xs font-mono animate-pulse">Initializing Satellite Radar Map…</div>
    </div>
  ),
});

const LEGEND = [
  { label: "High Density", color: "#EF4444" },
  { label: "Medium Density", color: "#F59E0B" },
  { label: "Low Density", color: "#3B82F6" },
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
    <div className="space-y-6 select-none">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Map Container */}
        <div className="card lg:col-span-2 flex flex-col" style={{ height: 520 }}>
          <div className="card-header">
            <span className="text-xs font-bold font-display uppercase tracking-wider text-[var(--text-primary)]">
              Geographic Compliance Radar — India
            </span>
            <div className="flex items-center gap-4">
              {LEGEND.map((l) => (
                <div key={l.label} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-medium">
                  <span
                    className="w-2.5 h-2.5 rounded-full shadow-sm"
                    style={{ background: l.color }}
                  />
                  {l.label.split(" ")[0]}
                </div>
              ))}
            </div>
          </div>
          <div className="flex-grow rounded-b-xl overflow-hidden relative" style={{ height: "calc(100% - 53px)" }}>
            <Map />
          </div>
        </div>

        {/* State Rankings */}
        <div className="card overflow-hidden flex flex-col">
          <div className="card-header">
            <span className="text-xs font-bold font-display uppercase tracking-wider text-[var(--text-primary)]">
              State Risk Rankings
            </span>
            <span className="text-[10px] font-mono text-[var(--text-tertiary)]">by total violations</span>
          </div>
          <div className="divide-y divide-[var(--border-subtle)] overflow-y-auto flex-1">
            {STATE_DATA.map((s, i) => {
              const max = STATE_DATA[0].violations;
              const pct = (s.violations / max) * 100;
              const color =
                s.density === "HIGH" ? "#EF4444" : s.density === "MEDIUM" ? "#F59E0B" : "#3B82F6";
              return (
                <div key={s.state} className="px-5 py-3.5 flex items-center gap-3 hover:bg-[var(--bg-subtle)] transition-colors">
                  <span className="text-xs font-mono text-[var(--text-tertiary)] w-5">{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[var(--text-primary)]">{s.state}</span>
                      <span className="text-xs font-mono font-bold" style={{ color }}>{s.violations}</span>
                    </div>
                    <div className="h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
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
