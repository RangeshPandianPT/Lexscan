import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

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

const getColor = (density: string) => {
  switch (density) {
    case "HIGH":   return "#EF4444";
    case "MEDIUM": return "#F59E0B";
    case "LOW":    return "#3B82F6";
    default:       return "#94A3B8";
  }
};

export default function Map() {
  return (
    <MapContainer
      center={[20.5937, 78.9629]}
      zoom={4}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {mockData.map((data, idx) => (
        <CircleMarker
          key={idx}
          center={data.coordinates}
          radius={Math.max(12, data.violation_count / 6)}
          pathOptions={{
            fillColor: getColor(data.density),
            color: getColor(data.density),
            weight: 2,
            fillOpacity: 0.55,
          }}
        >
          <Popup>
            <div style={{ fontFamily: "Inter, sans-serif", minWidth: 140 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{data.state}</div>
              <div style={{ fontSize: 12, color: "#475569" }}>
                Violations: <strong>{data.violation_count}</strong>
              </div>
              <div
                style={{
                  marginTop: 4,
                  display: "inline-block",
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 9999,
                  background:
                    data.density === "HIGH"
                      ? "#FEF2F2"
                      : data.density === "MEDIUM"
                      ? "#FFFBEB"
                      : "#EFF6FF",
                  color:
                    data.density === "HIGH"
                      ? "#DC2626"
                      : data.density === "MEDIUM"
                      ? "#D97706"
                      : "#2563EB",
                }}
              >
                {data.density} DENSITY
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
