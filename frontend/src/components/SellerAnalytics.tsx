"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  ArrowUpDown,
  Download,
  Trophy,
  AlertOctagon,
  MapPin,
  Store,
} from "lucide-react";

interface Seller {
  seller_id: string;
  seller_name: string;
  platform: "amazon" | "flipkart" | "meesho";
  total_listings_scanned: number;
  total_violations: number;
  compliance_rate: number;
  state: string;
}

const MOCK_SELLERS: Seller[] = [
  {
    seller_id: "SELL-XYZ-1",
    seller_name: "XYZ Retail Pvt Ltd",
    platform: "amazon",
    total_listings_scanned: 132,
    total_violations: 47,
    compliance_rate: 64.4,
    state: "Maharashtra",
  },
  {
    seller_id: "SELL-ABC-2",
    seller_name: "ABC Distributors",
    platform: "flipkart",
    total_listings_scanned: 88,
    total_violations: 31,
    compliance_rate: 64.8,
    state: "Karnataka",
  },
  {
    seller_id: "SELL-DEF-3",
    seller_name: "Nature's Best Commerce",
    platform: "meesho",
    total_listings_scanned: 55,
    total_violations: 3,
    compliance_rate: 94.5,
    state: "Tamil Nadu",
  },
  {
    seller_id: "SELL-GHI-4",
    seller_name: "GHI Enterprises",
    platform: "amazon",
    total_listings_scanned: 210,
    total_violations: 112,
    compliance_rate: 46.7,
    state: "Delhi",
  },
  {
    seller_id: "SELL-JKL-5",
    seller_name: "JKL Beauty Hub",
    platform: "flipkart",
    total_listings_scanned: 74,
    total_violations: 8,
    compliance_rate: 89.2,
    state: "Gujarat",
  },
  {
    seller_id: "SELL-MNO-6",
    seller_name: "MNO Cosmetics Co.",
    platform: "amazon",
    total_listings_scanned: 165,
    total_violations: 78,
    compliance_rate: 52.7,
    state: "Uttar Pradesh",
  },
  {
    seller_id: "SELL-PQR-7",
    seller_name: "PQR Trading House",
    platform: "meesho",
    total_listings_scanned: 43,
    total_violations: 2,
    compliance_rate: 95.3,
    state: "Gujarat",
  },
];

const PLATFORM_COLORS: Record<string, string> = {
  amazon: "#FF9900",
  flipkart: "#2874F0",
  meesho: "#F43397",
};

const PLATFORM_BG: Record<string, string> = {
  amazon: "#FFF7ED",
  flipkart: "#EFF6FF",
  meesho: "#FDF2F8",
};

type SortKey = "compliance_rate" | "total_violations" | "total_listings_scanned";

function ComplianceMeter({ rate }: { rate: number }) {
  const color =
    rate >= 80 ? "#16A34A" : rate >= 60 ? "#D97706" : "#DC2626";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
        <div
          className="h-full rounded-full"
          style={{ width: `${rate}%`, backgroundColor: color, transition: "width 0.5s ease" }}
        />
      </div>
      <span
        className="text-[12.5px] font-semibold w-12"
        style={{ color }}
      >
        {rate.toFixed(1)}%
      </span>
    </div>
  );
}

export function SellerAnalytics() {
  const [sortKey, setSortKey] = useState<SortKey>("compliance_rate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [platformFilter, setPlatformFilter] = useState("ALL");

  const sorted = useMemo(() => {
    const filtered = [...MOCK_SELLERS].filter(
      (s) => platformFilter === "ALL" || s.platform === platformFilter
    );
    filtered.sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      return (a[sortKey] - b[sortKey]) * mul;
    });
    return filtered;
  }, [sortKey, sortDir, platformFilter]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const handleCSVExport = () => {
    const headers = ["Seller ID", "Seller Name", "Platform", "State", "Scanned", "Violations", "Compliance %"];
    const rows = sorted.map((s) => [
      s.seller_id, s.seller_name, s.platform, s.state,
      s.total_listings_scanned, s.total_violations, s.compliance_rate.toFixed(1),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "seller_analytics.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // Chart data: top 5 by violations for the bar chart
  const chartData = [...MOCK_SELLERS]
    .sort((a, b) => b.total_violations - a.total_violations)
    .slice(0, 5)
    .map((s) => ({ name: s.seller_name.split(" ").slice(0, 2).join(" "), violations: s.total_violations }));

  const topOffenders = MOCK_SELLERS.filter((s) => s.total_violations > 40);
  const topCompliant = [...MOCK_SELLERS].sort((a, b) => b.compliance_rate - a.compliance_rate).slice(0, 3);

  return (
    <div className="space-y-5">
      {/* ── Summary Cards ─── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card text-center">
          <div className="text-2xl font-bold text-slate-900">{MOCK_SELLERS.length}</div>
          <div className="text-xs text-slate-500 mt-0.5 font-medium">Total Sellers</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-2xl font-bold text-red-600">{topOffenders.length}</div>
          <div className="text-xs text-slate-500 mt-0.5 font-medium">Repeat Offenders</div>
          <div className="text-[10px] text-red-500 mt-0.5">&gt;40 violations</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-2xl font-bold text-emerald-600">{topCompliant.length}</div>
          <div className="text-xs text-slate-500 mt-0.5 font-medium">Top Compliant</div>
          <div className="text-[10px] text-emerald-500 mt-0.5">&gt;85% rate</div>
        </div>
      </div>

      {/* ── Offenders Bar Chart ─── */}
      <div className="card">
        <div className="card-header">
          <span className="text-[13px] font-semibold text-slate-800">Top 5 Sellers by Violations</span>
          <span className="flex items-center gap-1 text-[11px] text-red-500 font-medium">
            <AlertOctagon className="w-3.5 h-3.5" /> Repeat offenders highlighted
          </span>
        </div>
        <div className="card-body h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-xs">
                      <div className="font-semibold text-slate-700">{payload[0].payload.name}</div>
                      <div className="text-red-500 font-medium">{payload[0].value} violations</div>
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="violations" fill="#EF4444" radius={[0, 4, 4, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Main Table ─── */}
      <div className="card overflow-hidden">
        {/* Controls */}
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-slate-400" />
            <span className="text-[13px] font-semibold text-slate-800">All Sellers</span>
            <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {sorted.length} results
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="form-select text-[12px] py-1.5 px-2 w-auto"
            >
              <option value="ALL">All Platforms</option>
              <option value="amazon">Amazon</option>
              <option value="flipkart">Flipkart</option>
              <option value="meesho">Meesho</option>
            </select>
            <button onClick={handleCSVExport} className="btn btn-secondary btn-sm">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Seller</th>
                <th>Platform</th>
                <th>
                  <button
                    onClick={() => toggleSort("total_listings_scanned")}
                    className="flex items-center gap-1 hover:text-slate-700"
                  >
                    Scanned <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th>
                  <button
                    onClick={() => toggleSort("total_violations")}
                    className="flex items-center gap-1 hover:text-slate-700"
                  >
                    Violations <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th>
                  <button
                    onClick={() => toggleSort("compliance_rate")}
                    className="flex items-center gap-1 hover:text-slate-700"
                  >
                    Compliance <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((seller, idx) => {
                const isRepeatOffender = seller.total_violations > 40;
                const isTopCompliant = seller.compliance_rate >= 85;
                return (
                  <tr
                    key={seller.seller_id}
                    className={isRepeatOffender ? "bg-red-50/40" : ""}
                  >
                    {/* Rank */}
                    <td className="text-center">
                      {idx === 0 && sortKey === "compliance_rate" && sortDir === "desc" ? (
                        <Trophy className="w-4 h-4 text-yellow-500 mx-auto" />
                      ) : (
                        <span className="text-slate-400 text-[12px] font-mono">{String(idx + 1).padStart(2, "0")}</span>
                      )}
                    </td>
                    {/* Seller Info */}
                    <td>
                      <div>
                        <div className="font-medium text-slate-800 flex items-center gap-1.5">
                          {seller.seller_name}
                          {isRepeatOffender && (
                            <span className="badge badge-high text-[10px]">⚠ Offender</span>
                          )}
                          {isTopCompliant && (
                            <span className="badge badge-success text-[10px]">✓ Compliant</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{seller.seller_id}</div>
                      </div>
                    </td>
                    {/* Platform */}
                    <td>
                      <span
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize"
                        style={{
                          color: PLATFORM_COLORS[seller.platform],
                          background: PLATFORM_BG[seller.platform],
                        }}
                      >
                        {seller.platform}
                      </span>
                    </td>
                    {/* Scanned */}
                    <td className="text-slate-700 font-medium">{seller.total_listings_scanned}</td>
                    {/* Violations */}
                    <td>
                      <span
                        className={`badge ${seller.total_violations > 40 ? "badge-high" : seller.total_violations > 15 ? "badge-medium" : "badge-success"}`}
                      >
                        {seller.total_violations}
                      </span>
                    </td>
                    {/* Compliance */}
                    <td>
                      <ComplianceMeter rate={seller.compliance_rate} />
                    </td>
                    {/* Location */}
                    <td>
                      <span className="flex items-center gap-1 text-[12px] text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {seller.state}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
