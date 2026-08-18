"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("./Map"), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center">Loading map...</div>
});

export function GeoHeatmap() {
  return (
    <div className="bg-white border rounded-lg shadow-sm p-4 w-full h-[500px] flex flex-col">
      <h3 className="font-semibold text-slate-800 mb-4">Violation Heatmap (India)</h3>
      <div className="flex-grow rounded-lg overflow-hidden border relative z-0">
        <Map />
      </div>
    </div>
  );
}
