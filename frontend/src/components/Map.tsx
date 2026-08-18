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
];

const getColor = (density: string) => {
  switch (density) {
    case "HIGH": return "#ef4444";
    case "MEDIUM": return "#f59e0b";
    case "LOW": return "#3b82f6";
    default: return "#94a3b8";
  }
};

export default function Map() {
  return (
    <MapContainer center={[20.5937, 78.9629]} zoom={4} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {mockData.map((data, idx) => (
        <CircleMarker
          key={idx}
          center={data.coordinates}
          radius={Math.max(10, data.violation_count / 5)}
          pathOptions={{
            fillColor: getColor(data.density),
            color: getColor(data.density),
            weight: 1,
            fillOpacity: 0.6,
          }}
        >
          <Popup>
            <div className="font-semibold">{data.state}</div>
            <div className="text-sm">Violations: {data.violation_count}</div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
