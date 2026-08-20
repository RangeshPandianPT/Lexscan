"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
} from "lucide-react";

/* ── Mock data (matches fixtures schema) ────────────────── */
const platformStats = [
  { platform: "Amazon", compliance: 71, violations: 47, scanned: 320, color: "#FF9900" },
  { platform: "Flipkart", compliance: 58, violations: 63, scanned: 280, color: "#2874F0" },
  { platform: "Meesho", compliance: 65, violations: 41, scanned: 290, color: "#F43397" },
];

const weeklyTrend = [
  { day: "Mon", violations: 24 },
  { day: "Tue", violations: 37 },
  { day: "Wed", violations: 29 },
  { day: "Thu", violations: 45 },
  { day: "Fri", violations: 38 },
  { day: "Sat", violations: 22 },
  { day: "Sun", violations: 19 },
];

const violationTypes = [
  { issue: "Price Above MRP", count: 58, color: "#EF4444" },
  { issue: "Missing Manufacturer", count: 47, color: "#F97316" },
  { issue: "Missing Net Qty", count: 39, color: "#EAB308" },
  { issue: "Missing Consumer Care", count: 35, color: "#8B5CF6" },
  { issue: "Missing Origin", count: 22, color: "#3B82F6" },
  { issue: "Missing Mfg Date", count: 13, color: "#14B8A6" },
];

/* ── Custom Tooltip ─────────────────────────────────────── */
interface TooltipProps { active?: boolean; payload?: { value: number }[]; label?: string; }
function CustomBarTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <div className="font-semibold text-slate-700 mb-1">{label}</div>
      <div className="text-indigo-600 font-medium">{payload[0].value} violations</div>
    </div>
  );
}

interface PieTooltipProps { active?: boolean; payload?: { name: string; value: number }[]; }
function CustomPieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <div className="font-semibold text-slate-700">{payload[0].name}</div>
      <div className="text-slate-500">{payload[0].value} violations</div>
    </div>
  );
}

/* ── Compliance Score Ring ───────────────────────────────── */
function ScoreRing({ score, platform, color }: { score: number; platform: string; color: string }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const dashoffset = c - (score / 100) * c;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#F1F5F9" strokeWidth="7" />
          <circle
            cx="40" cy="40" r={r}
            fill="none"
            stroke={score >= 70 ? "#16A34A" : score >= 50 ? "#D97706" : "#DC2626"}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={dashoffset}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-slate-800 leading-none">{score}%</span>
        </div>
      </div>
      <div className="text-[11px] font-semibold" style={{ color }}>{platform}</div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────── */
export function OverviewDashboard() {
  const totalScanned = platformStats.reduce((s, p) => s + p.scanned, 0);
  const totalViolations = platformStats.reduce((s, p) => s + p.violations, 0);
  const avgCompliance = Math.round(
    platformStats.reduce((s, p) => s + p.compliance, 0) / platformStats.length
  );

  return (
    <div className="space-y-6 mt-5">
      {/* ── Row 1: KPI Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scanned */}
        <div className="stat-card animate-fade-in" style={{ animationDelay: "0ms" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Products Scanned</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{totalScanned.toLocaleString()}</p>
              <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +12% from yesterday
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Package className="w-4.5 h-4.5 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Total Violations */}
        <div className="stat-card animate-fade-in" style={{ animationDelay: "60ms" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Violations Found</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{totalViolations}</p>
              <p className="text-[11px] text-red-600 mt-1 font-medium flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +8% this week
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
              <ShieldAlert className="w-4.5 h-4.5 text-red-500" />
            </div>
          </div>
        </div>

        {/* Avg Compliance */}
        <div className="stat-card animate-fade-in" style={{ animationDelay: "120ms" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Avg Compliance</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{avgCompliance}%</p>
              <p className="text-[11px] text-amber-600 mt-1 font-medium flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" /> -3% vs last week
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* High Severity */}
        <div className="stat-card animate-fade-in" style={{ animationDelay: "180ms" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">High Severity</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">58</p>
              <p className="text-[11px] text-red-600 mt-1 font-medium flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" /> Requires action
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
              <AlertTriangle className="w-4.5 h-4.5 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Platform Compliance Scores + Weekly Trend ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Platform Compliance Rings */}
        <div className="card">
          <div className="card-header">
            <span className="text-[13px] font-semibold text-slate-800">Platform Compliance</span>
            <span className="badge badge-success">Live</span>
          </div>
          <div className="card-body flex items-center justify-around py-5">
            {platformStats.map((p) => (
              <ScoreRing key={p.platform} score={p.compliance} platform={p.platform} color={p.color} />
            ))}
          </div>
        </div>

        {/* Weekly Violation Trend Bar Chart */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <span className="text-[13px] font-semibold text-slate-800">Violations This Week</span>
            <span className="text-[11px] text-slate-400">Daily count</span>
          </div>
          <div className="card-body h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrend} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(99,102,241,0.05)" }} />
                <Bar dataKey="violations" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Row 3: Violation Types Pie + Platform Table ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Violation Types Pie */}
        <div className="card">
          <div className="card-header">
            <span className="text-[13px] font-semibold text-slate-800">Top Violation Types</span>
          </div>
          <div className="card-body">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:w-48 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={violationTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={72}
                      dataKey="count"
                      nameKey="issue"
                      strokeWidth={2}
                      stroke="white"
                    >
                      {violationTypes.map((entry) => (
                        <Cell key={entry.issue} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5">
                {violationTypes.map((v) => (
                  <div key={v.issue} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: v.color }} />
                      <span className="text-[12px] text-slate-600 truncate">{v.issue}</span>
                    </div>
                    <span className="text-[12px] font-semibold text-slate-800 flex-shrink-0">{v.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Platform Breakdown Table */}
        <div className="card">
          <div className="card-header">
            <span className="text-[13px] font-semibold text-slate-800">Platform Breakdown</span>
          </div>
          <div className="overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Scanned</th>
                  <th>Violations</th>
                  <th>Compliance</th>
                </tr>
              </thead>
              <tbody>
                {platformStats.map((p) => (
                  <tr key={p.platform}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        <span className="font-medium text-slate-800">{p.platform}</span>
                      </div>
                    </td>
                    <td className="text-slate-600">{p.scanned}</td>
                    <td>
                      <span className={`badge ${p.violations > 50 ? "badge-high" : p.violations > 30 ? "badge-medium" : "badge-low"}`}>
                        {p.violations}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[70px]">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${p.compliance}%`,
                              background: p.compliance >= 70 ? "#16A34A" : p.compliance >= 50 ? "#D97706" : "#DC2626",
                            }}
                          />
                        </div>
                        <span className="text-[12px] font-semibold text-slate-700">{p.compliance}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
