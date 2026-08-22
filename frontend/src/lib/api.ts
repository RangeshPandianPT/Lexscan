declare const process: any;
const API_BASE_URL = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) || "http://localhost:8000";

export interface ProductScan {
  id: string;
  product_id?: string;
  platform?: string;
  url?: string;
  title?: string;
  category?: string;
  seller_id?: string;
  scraped_at?: string;
  raw_html_sha256?: string;
  images: Array<{ url: string; sha256: string }>;
  extracted_fields: Record<string, any>;
  listing_price?: number;
  compliance_score: number;
  exemption_status: Record<string, any>;
  status: string;
  timestamp: string;
  violations: Violation[];
}

export interface Violation {
  id: number;
  violation_id?: string;
  product_id?: string;
  rule_id: string;
  clause?: string;
  issue?: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  message?: string;
  confidence?: number;
  bounding_box?: { ymin: number; xmin: number; ymax: number; xmax: number };
  detected_at?: string;
}

export interface Seller {
  seller_id: string;
  seller_name: string;
  platform: string;
  total_listings_scanned: number;
  total_violations: number;
  compliance_rate: number;
  state: string;
}

export interface GeoHeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
  state: string;
  violations: number;
}

export interface ViolationsSummary {
  total_scanned: number;
  total_violations: number;
  high_severity: number;
  by_issue: Array<{ issue: string; count: number }>;
}

export async function fetchProducts(platform?: string, category?: string): Promise<ProductScan[]> {
  try {
    const params = new URLSearchParams();
    if (platform) params.append("platform", platform);
    if (category) params.append("category", category);
    const res = await fetch(`${API_BASE_URL}/products?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch products");
    return await res.json();
  } catch (error) {
    console.error("API Error fetchProducts:", error);
    return [];
  }
}

export async function fetchProductById(id: string): Promise<ProductScan | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("API Error fetchProductById:", error);
    return null;
  }
}

export async function fetchViolations(severity?: string): Promise<Violation[]> {
  try {
    const params = new URLSearchParams();
    if (severity) params.append("severity", severity);
    const res = await fetch(`${API_BASE_URL}/violations?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch violations");
    return await res.json();
  } catch (error) {
    console.error("API Error fetchViolations:", error);
    return [];
  }
}

export async function fetchViolationsSummary(): Promise<ViolationsSummary | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/violations/summary`);
    if (!res.ok) throw new Error("Failed to fetch violations summary");
    return await res.json();
  } catch (error) {
    console.error("API Error fetchViolationsSummary:", error);
    return null;
  }
}

export async function fetchSellers(): Promise<Seller[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/sellers`);
    if (!res.ok) throw new Error("Failed to fetch sellers");
    return await res.json();
  } catch (error) {
    console.error("API Error fetchSellers:", error);
    return [];
  }
}

export async function fetchGeoHeatmap(): Promise<GeoHeatmapPoint[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/geo/heatmap`);
    if (!res.ok) throw new Error("Failed to fetch geo heatmap");
    return await res.json();
  } catch (error) {
    console.error("API Error fetchGeoHeatmap:", error);
    return [];
  }
}
