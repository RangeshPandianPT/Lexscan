"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
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
import { fetchProducts, fetchViolationsSummary, ViolationsSummary } from "@/lib/api";

const initialPlatformStats = [
  { platform: "Amazon", compliance: 71, violations: 47, scanned: 320, color: "#FF9900" },
  { platform: "Flipkart", compliance: 58, violations: 63, scanned: 280, color: "#2874F0" },
  { platform: "BigBasket", compliance: 65, violations: 41, scanned: 290, color: "#84C225" },
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

const initialViolationTypes = [
  { issue: "Price Above MRP", count: 58, color: "#F43F5E" },
  { issue: "Missing Manufacturer", count: 47, color: "#F59E0B" },
  { issue: "Missing Net Qty", count: 39, color: "#14B8A6" },
  { issue: "Missing Consumer Care", count: 35, color: "#8B5CF6" },
  { issue: "Missing Origin", count: 22, color: "#06B6D4" },
  { issue: "Missing Mfg Date", count: 13, color: "#10B981" },
];

/* ── Animated Count Up Number Component ───────────────────── */
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString() + suffix);
  const [displayValue, setDisplayValue] = useState("0" + suffix);

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.2, ease: "easeOut" });
    const unsubscribe = rounded.on("change", (v) => setDisplayValue(v));
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, count, rounded, suffix]);

  return <span className="tabular-nums">{displayValue}</span>;
}

/* ── Custom Recharts Tooltip ─────────────────────────────── */
interface TooltipProps { active?: boolean; payload?: { value: number }[]; label?: string; }
function CustomBarTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border-base)] rounded-xl shadow-elevated px-3.5 py-2 text-xs backdrop-blur-md">
      <div className="font-bold text-[var(--text-primary)] mb-0.5">{label}</div>
      <div className="text-teal-400 font-semibold">{payload[0].value} violations detected</div>
    </div>
  );
}

interface PieTooltipProps { active?: boolean; payload?: { name: string; value: number }[]; }
function CustomPieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border-base)] rounded-xl shadow-elevated px-3.5 py-2 text-xs backdrop-blur-md">
      <div className="font-bold text-[var(--text-primary)]">{payload[0].name}</div>
      <div className="text-[var(--text-secondary)] mt-0.5">{payload[0].value} occurrences</div>
    </div>
  );
}

/* ── Animated Compliance Orbital Ring ───────────────────────── */
function AnimatedScoreRing({ score, platform, color }: { score: number; platform: string; color: string }) {
  const r = 32;
  const c = 2 * Math.PI * r;
  const strokeColor = score >= 70 ? "#14B8A6" : score >= 50 ? "#F59E0B" : "#F43F5E";

  return (
    <div className="flex flex-col items-center gap-2 group">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Outer Orbital Rotating Ring */}
        <div className="absolute inset-0 rounded-full border border-dashed border-[var(--border-base)] animate-spin-slow opacity-60 group-hover:opacity-100 transition-opacity" />
        
        {/* SVG Compliance Progress Circle */}
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="6" />
          <motion.circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c - (score / 100) * c }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        
        {/* Score Value Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
          <span className="text-base font-display font-black text-[var(--text-primary)] leading-none">
            <AnimatedCounter value={score} suffix="%" />
          </span>
        </div>
      </div>
      <div className="text-xs font-bold font-display tracking-tight" style={{ color }}>{platform}</div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────── */
export function OverviewDashboard() {
  const [summary, setSummary] = useState<ViolationsSummary | null>(null);
  const [platformStats, setPlatformStats] = useState(initialPlatformStats);
  const [violationTypes, setViolationTypes] = useState(initialViolationTypes);

  useEffect(() => {
    async function loadData() {
      const summaryData = await fetchViolationsSummary();
      if (summaryData && summaryData.total_scanned > 0) {
        setSummary(summaryData);

        if (summaryData.by_issue.length > 0) {
          const colors = ["#F43F5E", "#F59E0B", "#14B8A6", "#8B5CF6", "#06B6D4", "#10B981"];
          setViolationTypes(
            summaryData.by_issue.map((item, idx) => ({
              issue: item.issue.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
              count: item.count,
              color: colors[idx % colors.length],
            }))
          );
        }
      }

      const products = await fetchProducts();
      if (products.length > 0) {
        const platforms = ["amazon", "flipkart", "bigbasket"];
        const pColors: Record<string, string> = {
          amazon: "#FF9900",
          flipkart: "#2874F0",
          bigbasket: "#84C225",
        };

        const newStats = platforms.map((p) => {
          const pProducts = products.filter((prod) => prod.platform === p);
          const scanned = pProducts.length;
          const totalScore = pProducts.reduce((acc, curr) => acc + (curr.compliance_score || 0), 0);
          const compliance = scanned > 0 ? Math.round(totalScore / scanned) : 70;
          const violationsCount = pProducts.reduce(
            (acc, curr) => acc + (curr.violations ? curr.violations.length : 0),
            0
          );

          return {
            platform: p.charAt(0).toUpperCase() + p.slice(1),
            compliance,
            violations: violationsCount,
            scanned,
            color: pColors[p],
          };
        });

        setPlatformStats(newStats);
      }
    }

    loadData();
  }, []);

  const totalScanned = summary?.total_scanned || platformStats.reduce((s, p) => s + p.scanned, 0);
  const totalViolations = summary?.total_violations || platformStats.reduce((s, p) => s + p.violations, 0);
  const highSeverityCount = summary?.high_severity || 58;
  const avgCompliance = Math.round(
    platformStats.reduce((s, p) => s + p.compliance, 0) / platformStats.length
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4 mt-4 select-none"
    >
      {/* ── Row 1: KPI Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scanned */}
        <motion.div variants={itemVariants} className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Products Scanned</p>
              <h3 className="text-3xl font-display font-black text-[var(--text-primary)] mt-1 tracking-tight">
                <AnimatedCounter value={totalScanned} />
              </h3>
              <p className="text-xs text-teal-500 font-semibold mt-2 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +12% vs yesterday
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shadow-glow">
              <Package className="w-5 h-5 text-teal-400" />
            </div>
          </div>
        </motion.div>

        {/* Total Violations */}
        <motion.div variants={itemVariants} className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Violations Flagged</p>
              <h3 className="text-3xl font-display font-black text-[var(--text-primary)] mt-1 tracking-tight">
                <AnimatedCounter value={totalViolations} />
              </h3>
              <p className="text-xs text-rose-500 font-semibold mt-2 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +8% this week
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-glow-danger">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
            </div>
          </div>
        </motion.div>

        {/* Avg Compliance */}
        <motion.div variants={itemVariants} className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Avg Compliance</p>
              <h3 className="text-3xl font-display font-black text-[var(--text-primary)] mt-1 tracking-tight">
                <AnimatedCounter value={avgCompliance} suffix="%" />
              </h3>
              <p className="text-xs text-amber-500 font-semibold mt-2 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> -3% vs last week
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </motion.div>

        {/* High Severity */}
        <motion.div variants={itemVariants} className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">High Severity</p>
              <h3 className="text-3xl font-display font-black text-[var(--text-primary)] mt-1 tracking-tight">
                <AnimatedCounter value={highSeverityCount} />
              </h3>
              <p className="text-xs text-rose-500 font-semibold mt-2 flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" /> Immediate Action Required
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Row 2: Platform Compliance Rings + Weekly Trend Bar Chart ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Platform Compliance Rings */}
        <motion.div variants={itemVariants} className="card">
          <div className="card-header">
            <span className="text-xs font-bold font-display uppercase tracking-wider text-[var(--text-primary)]">
              Platform Compliance Orbit
            </span>
            <span className="badge badge-success">Live Engine</span>
          </div>
          <div className="card-body flex items-center justify-around py-6">
            {platformStats.map((p) => (
              <AnimatedScoreRing key={p.platform} score={p.compliance} platform={p.platform} color={p.color} />
            ))}
          </div>
        </motion.div>

        {/* Weekly Violation Trend Bar Chart */}
        <motion.div variants={itemVariants} className="card lg:col-span-2">
          <div className="card-header">
            <span className="text-xs font-bold font-display uppercase tracking-wider text-[var(--text-primary)]">
              Weekly Detection Velocity
            </span>
            <span className="text-[11px] text-[var(--text-tertiary)] font-mono">Daily Violations</span>
          </div>
          <div className="card-body h-56 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrend} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "var(--bg-subtle)" }} />
                <Bar dataKey="violations" fill="#14B8A6" radius={[6, 6, 0, 0]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ── Row 3: Violation Types Donut + Platform Breakdown ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Violation Types Donut Chart */}
        <motion.div variants={itemVariants} className="card">
          <div className="card-header">
            <span className="text-xs font-bold font-display uppercase tracking-wider text-[var(--text-primary)]">
              Violation Type Distribution
            </span>
          </div>
          <div className="card-body">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-full sm:w-48 h-48 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={violationTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={78}
                      dataKey="count"
                      nameKey="issue"
                      strokeWidth={2}
                      stroke="var(--bg-elevated)"
                    >
                      {violationTypes.map((entry) => (
                        <Cell key={entry.issue} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2.5 w-full">
                {violationTypes.map((v) => (
                  <div key={v.issue} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: v.color }} />
                      <span className="text-[var(--text-secondary)] font-medium truncate">{v.issue}</span>
                    </div>
                    <span className="font-bold font-mono text-[var(--text-primary)] flex-shrink-0">{v.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Platform Breakdown Table */}
        <motion.div variants={itemVariants} className="card overflow-hidden">
          <div className="card-header">
            <span className="text-xs font-bold font-display uppercase tracking-wider text-[var(--text-primary)]">
              Platform Marketplace Breakdown
            </span>
          </div>
          <div className="overflow-x-auto">
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
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                        <span className="font-bold text-[var(--text-primary)]">{p.platform}</span>
                      </div>
                    </td>
                    <td className="text-[var(--text-secondary)] font-mono">{p.scanned}</td>
                    <td>
                      <span className={`badge ${p.violations > 50 ? "badge-high" : p.violations > 30 ? "badge-medium" : "badge-low"}`}>
                        {p.violations}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden max-w-[80px]">
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              background: p.compliance >= 70 ? "#14B8A6" : p.compliance >= 50 ? "#F59E0B" : "#F43F5E",
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${p.compliance}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                        <span className="text-xs font-bold font-mono text-[var(--text-primary)]">{p.compliance}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
