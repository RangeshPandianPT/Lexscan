"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
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

type SortKey = "compliance_rate" | "total_violations" | "total_listings_scanned";

function ComplianceMeter({ rate }: { rate: number }) {
  const color = rate >= 80 ? "#22C55E" : rate >= 60 ? "#F59E0B" : "#EF4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden max-w-[80px]">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${rate}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs font-mono font-bold w-12" style={{ color }}>
        {rate.toFixed(1)}%
      </span>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { name: string } }>;
}

function CustomBarTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border-base)] rounded-xl shadow-elevated px-3 py-2 text-xs">
      <div className="font-bold text-[var(--text-primary)]">{payload[0].payload.name}</div>
      <div className="text-rose-500 font-bold mt-0.5">{payload[0].value} violations</div>
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

  const chartData = [...MOCK_SELLERS]
    .sort((a, b) => b.total_violations - a.total_violations)
    .slice(0, 5)
    .map((s) => ({ name: s.seller_name.split(" ").slice(0, 2).join(" "), violations: s.total_violations }));

  const topOffenders = MOCK_SELLERS.filter((s) => s.total_violations > 40);
  const topCompliant = [...MOCK_SELLERS].sort((a, b) => b.compliance_rate - a.compliance_rate).slice(0, 3);

  return (
    <div className="space-y-6 select-none">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="stat-card text-center">
          <div className="text-3xl font-display font-black text-[var(--text-primary)]">{MOCK_SELLERS.length}</div>
          <div className="text-xs text-[var(--text-tertiary)] mt-1 font-bold uppercase tracking-wider">Total Active Sellers</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-3xl font-display font-black text-rose-500">{topOffenders.length}</div>
          <div className="text-xs text-[var(--text-tertiary)] mt-1 font-bold uppercase tracking-wider">Repeat Offenders</div>
          <div className="text-[10px] text-rose-500 font-mono mt-0.5">&gt;40 violations flagged</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-3xl font-display font-black text-emerald-500">{topCompliant.length}</div>
          <div className="text-xs text-[var(--text-tertiary)] mt-1 font-bold uppercase tracking-wider">Top Compliant Sellers</div>
          <div className="text-[10px] text-emerald-500 font-mono mt-0.5">&gt;85% compliance rate</div>
        </div>
      </div>

      {/* Top 5 Offenders Bar Chart */}
      <div className="card">
        <div className="card-header">
          <span className="text-xs font-bold font-display uppercase tracking-wider text-[var(--text-primary)]">
            Top 5 High-Risk Offenders
          </span>
          <span className="flex items-center gap-1.5 text-xs text-rose-500 font-semibold animate-pulse">
            <AlertOctagon className="w-4 h-4" /> Repeat Offender Alert
          </span>
        </div>
        <div className="card-body h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="violations" fill="#EF4444" radius={[0, 6, 6, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Table */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <div className="flex items-center gap-2.5">
            <Store className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-bold font-display uppercase tracking-wider text-[var(--text-primary)]">
              Seller Risk Matrix
            </span>
            <span className="text-[10px] font-mono text-[var(--text-tertiary)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded-md border border-[var(--border-subtle)]">
              {sorted.length} registered
            </span>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="form-select text-xs py-1.5 px-3 w-auto"
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
                <th className="text-center">Rank</th>
                <th>Seller Entity</th>
                <th>Platform</th>
                <th>
                  <button
                    onClick={() => toggleSort("total_listings_scanned")}
                    className="flex items-center gap-1.5 hover:text-teal-400 transition-colors"
                  >
                    Scanned <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th>
                  <button
                    onClick={() => toggleSort("total_violations")}
                    className="flex items-center gap-1.5 hover:text-teal-400 transition-colors"
                  >
                    Violations <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th>
                  <button
                    onClick={() => toggleSort("compliance_rate")}
                    className="flex items-center gap-1.5 hover:text-teal-400 transition-colors"
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
                    className={isRepeatOffender ? "bg-rose-500/10 dark:bg-rose-500/15" : ""}
                  >
                    <td className="text-center font-mono">
                      {idx === 0 && sortKey === "compliance_rate" && sortDir === "desc" ? (
                        <Trophy className="w-4 h-4 text-amber-400 mx-auto" />
                      ) : (
                        <span className="text-[var(--text-tertiary)] text-xs">{String(idx + 1).padStart(2, "0")}</span>
                      )}
                    </td>
                    <td>
                      <div>
                        <div className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                          {seller.seller_name}
                          {isRepeatOffender && (
                            <span className="badge badge-high text-[9px]">High Risk</span>
                          )}
                          {isTopCompliant && (
                            <span className="badge badge-success text-[9px]">Verified Compliant</span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--text-tertiary)] font-mono">{seller.seller_id}</div>
                      </div>
                    </td>
                    <td>
                      <span
                        className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono"
                        style={{
                          color: PLATFORM_COLORS[seller.platform],
                          background: `${PLATFORM_COLORS[seller.platform]}18`,
                          border: `1px solid ${PLATFORM_COLORS[seller.platform]}35`,
                        }}
                      >
                        {seller.platform}
                      </span>
                    </td>
                    <td className="text-[var(--text-primary)] font-mono font-semibold">{seller.total_listings_scanned}</td>
                    <td>
                      <span className={`badge ${seller.total_violations > 40 ? "badge-high" : seller.total_violations > 15 ? "badge-medium" : "badge-success"}`}>
                        {seller.total_violations}
                      </span>
                    </td>
                    <td>
                      <ComplianceMeter rate={seller.compliance_rate} />
                    </td>
                    <td>
                      <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
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
