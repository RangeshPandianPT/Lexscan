"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "./ThemeProvider";

interface HeatmapData {
  state: string;
  violation_count: number;
  density: "HIGH" | "MEDIUM" | "LOW";
  coordinates: [number, number]; // [lat, lng]
}

const mockData: HeatmapData[] = [
  { state: "Maharashtra", violation_count: 120, density: "HIGH", coordinates: [19.7515, 75.7139] },
  { state: "Karnataka", violation_count: 85, density: "MEDIUM", coordinates: [15.3173, 75.7139] },
  { state: "Tamil Nadu", violation_count: 45, density: "LOW", coordinates: [11.1271, 78.6569] },
  { state: "Delhi", violation_count: 145, density: "HIGH", coordinates: [28.6139, 77.2090] },
  { state: "Gujarat", violation_count: 62, density: "MEDIUM", coordinates: [22.2587, 71.1924] },
  { state: "Rajasthan", violation_count: 38, density: "LOW", coordinates: [27.0238, 74.2179] },
  { state: "Uttar Pradesh", violation_count: 98, density: "HIGH", coordinates: [26.8467, 80.9462] },
  { state: "West Bengal", violation_count: 71, density: "MEDIUM", coordinates: [22.9868, 87.8550] },
];

const createSonarRippleIcon = (density: string) => {
  let color = "#2DD4BF"; // LOW
  let size = 18;
  let isHigh = density === "HIGH";
  let isMed = density === "MEDIUM";

  if (isHigh) {
    color = "#F43F5E";
    size = 24;
  } else if (isMed) {
    color = "#F59E0B";
    size = 20;
  }

  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
      ${
        isHigh
          ? `<div style="
              position: absolute;
              inset: -8px;
              border-radius: 50%;
              border: 2px solid ${color};
              animation: sonarRipple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite;
            "></div>`
          : ""
      }
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border-radius: 50%;
        box-shadow: 0 0 16px ${color}, 0 0 32px ${color};
        animation: ${isHigh ? 'pulseDanger 1.5s infinite' : 'pulseGlow 2.5s infinite'};
        position: relative;
        border: 2px solid rgba(255, 255, 255, 0.8);
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          width: 4px;
          height: 4px;
          background: #fff;
          border-radius: 50%;
          transform: translate(-50%, -50%);
        "></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-leaflet-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

export default function Map() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-full bg-[var(--bg-surface)] animate-pulse" />;

  const tileUrl =
    theme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";

  return (
    <MapContainer
      center={[20.5937, 78.9629]}
      zoom={4}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", background: "var(--bg-base)" }}
      className="z-0"
    >
      <TileLayer
        key={theme}
        attribution='&copy; <a href="https://carto.com">CARTO</a>'
        url={tileUrl}
      />
      {mockData.map((data, idx) => (
        <Marker
          key={idx}
          position={data.coordinates}
          icon={createSonarRippleIcon(data.density)}
        >
          <Popup className="tactical-popup">
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-highlight)] rounded-xl shadow-elevated p-3.5 min-w-[170px] text-xs backdrop-blur-xl">
              <div className="font-display font-bold text-[var(--text-primary)] mb-1 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: data.density === "HIGH" ? "#F43F5E" : data.density === "MEDIUM" ? "#F59E0B" : "#2DD4BF" }} />
                  {data.state.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]">
                  {data.density}
                </span>
              </div>
              <div className="font-mono text-[10px] text-[var(--text-tertiary)] mb-2.5">
                GPS: {data.coordinates[0].toFixed(2)}N, {data.coordinates[1].toFixed(2)}E
              </div>
              <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-2">
                <span className="text-[var(--text-secondary)] uppercase text-[10px] tracking-wider font-semibold">Violations</span>
                <strong className="font-mono text-[var(--color-primary)] text-sm font-black">{data.violation_count}</strong>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
