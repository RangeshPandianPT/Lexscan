"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, ChevronUp, Filter, ExternalLink, AlertTriangle } from "lucide-react";

interface Violation {
  violation_id: string;
  product_id: string;
  rule_id: string;
  clause: string;
  issue: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  confidence: number;
  message: string;
  detected_at: string;
}

const MOCK_DATA: Violation[] = [
  {
    violation_id: "VIO-001",
    product_id: "AMZ-IN-101",
    rule_id: "LM-R06-MRP-01",
    clause: "Rule 6(1)(e), PC Rules 2011",
    issue: "PRICE_ABOVE_MRP",
    severity: "HIGH",
    confidence: 0.98,
    message: "Listed price (₹499) exceeds stamped MRP (₹399).",
    detected_at: "2026-08-18T10:00:00Z",
  },
  {
    violation_id: "VIO-002",
    product_id: "FLK-IN-202",
    rule_id: "LM-R06-COO-05",
    clause: "Rule 6(1)(d), PC Rules 2011",
    issue: "MISSING_ORIGIN",
    severity: "MEDIUM",
    confidence: 0.85,
    message: "Country of origin not declared on product listing.",
    detected_at: "2026-08-18T10:05:00Z",
  },
  {
    violation_id: "VIO-003",
    product_id: "AMZ-IN-103",
    rule_id: "LM-R06-NQ-02",
    clause: "Rule 6(1)(b), PC Rules 2011",
    issue: "MISSING_NET_QTY",
    severity: "LOW",
    confidence: 0.92,
    message: "Net quantity field is absent from the product page.",
    detected_at: "2026-08-18T10:10:00Z",
  },
  {
    violation_id: "VIO-004",
    product_id: "MSH-IN-304",
    rule_id: "LM-R06-MFR-03",
    clause: "Rule 6(1)(c), PC Rules 2011",
    issue: "MISSING_MANUFACTURER",
    severity: "HIGH",
    confidence: 0.76,
    message: "Manufacturer name and address missing.",
    detected_at: "2026-08-18T10:15:00Z",
  },
  {
    violation_id: "VIO-005",
    product_id: "FLK-IN-505",
    rule_id: "LM-R06-CC-04",
    clause: "Rule 6(1)(f), PC Rules 2011",
    issue: "MISSING_CONSUMER_CARE",
    severity: "MEDIUM",
    confidence: 0.89,
    message: "Consumer care number not found on listing.",
    detected_at: "2026-08-19T09:00:00Z",
  },
  {
    violation_id: "VIO-006",
    product_id: "AMZ-IN-606",
    rule_id: "LM-R06-MFD-06",
    clause: "Rule 6(1)(g), PC Rules 2011",
    issue: "MISSING_MFG_DATE",
    severity: "MEDIUM",
    confidence: 0.77,
    message: "Manufacturing / import date not specified.",
    detected_at: "2026-08-19T11:00:00Z",
  },
  {
    violation_id: "VIO-007",
    product_id: "MSH-IN-707",
    rule_id: "LM-R06-MRP-01",
    clause: "Rule 6(1)(e), PC Rules 2011",
    issue: "PRICE_ABOVE_MRP",
    severity: "HIGH",
    confidence: 0.95,
    message: "Selling price ₹699 exceeds MRP ₹550.",
    detected_at: "2026-08-20T08:00:00Z",
  },
];

type SortKey = keyof Pick<Violation, "violation_id" | "product_id" | "issue" | "severity" | "confidence" | "detected_at">;

function SeverityBadge({ severity }: { severity: string }) {
  const cls =
    severity === "HIGH"
      ? "badge-high"
      : severity === "MEDIUM"
      ? "badge-medium"
      : "badge-low";
  return <span className={`badge ${cls}`}>{severity}</span>;
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 90 ? "#6366F1" : pct >= 75 ? "#F59E0B" : "#A1A1AA";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className="text-[11px] font-mono text-[var(--text-tertiary)] tabular-nums">{pct}%</span>
    </div>
  );
}

export function ViolationExplorer() {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("detected_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const rowsPerPage = 5;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortOrder("desc"); }
  };

  const filtered = useMemo(() => {
    const data = [...MOCK_DATA].filter(
      (v) =>
        (severityFilter === "ALL" || v.severity === severityFilter) &&
        (v.product_id.toLowerCase().includes(search.toLowerCase()) ||
          v.issue.toLowerCase().includes(search.toLowerCase()) ||
          v.violation_id.toLowerCase().includes(search.toLowerCase()))
    );
    data.sort((a, b) => {
      if (a[sortKey] < b[sortKey]) return sortOrder === "asc" ? -1 : 1;
      if (a[sortKey] > b[sortKey]) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [search, severityFilter, sortKey, sortOrder]);

  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-teal-400" /> : <ChevronDown className="w-3 h-3 text-teal-400" />
    ) : (
      <ChevronDown className="w-3 h-3 opacity-30" />
    );

  return (
    <div className="space-y-5 select-none">
      {/* Search & Filter Bar */}
      <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Filter product, issue, or violation ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="form-input pl-9"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            <select
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
              className="form-select w-auto text-xs py-1.5"
            >
              <option value="ALL">All Severities</option>
              <option value="HIGH">High Severity</option>
              <option value="MEDIUM">Medium Severity</option>
              <option value="LOW">Low Severity</option>
            </select>
          </div>
          <div className="text-xs font-mono text-[var(--text-tertiary)]">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <button onClick={() => handleSort("violation_id")} className="flex items-center gap-1.5 hover:text-teal-400 transition-colors">
                    ID <SortIcon k="violation_id" />
                  </button>
                </th>
                <th>
                  <button onClick={() => handleSort("product_id")} className="flex items-center gap-1.5 hover:text-teal-400 transition-colors">
                    Product <SortIcon k="product_id" />
                  </button>
                </th>
                <th>
                  <button onClick={() => handleSort("issue")} className="flex items-center gap-1.5 hover:text-teal-400 transition-colors">
                    Issue <SortIcon k="issue" />
                  </button>
                </th>
                <th>
                  <button onClick={() => handleSort("severity")} className="flex items-center gap-1.5 hover:text-teal-400 transition-colors">
                    Severity <SortIcon k="severity" />
                  </button>
                </th>
                <th>
                  <button onClick={() => handleSort("confidence")} className="flex items-center gap-1.5 hover:text-teal-400 transition-colors">
                    Confidence <SortIcon k="confidence" />
                  </button>
                </th>
                <th>
                  <button onClick={() => handleSort("detected_at")} className="flex items-center gap-1.5 hover:text-teal-400 transition-colors">
                    Detected <SortIcon k="detected_at" />
                  </button>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? (
                paginated.map((v) => (
                  <FragmentRow
                    key={v.violation_id}
                    v={v}
                    expanded={expandedRow === v.violation_id}
                    onToggle={() => setExpandedRow(expandedRow === v.violation_id ? null : v.violation_id)}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-[var(--text-tertiary)]">
                      <AlertTriangle className="w-10 h-10 opacity-30 stroke-[1.5]" />
                      <div className="text-sm font-semibold">No violations match your query</div>
                      <div className="text-xs">Try adjusting your filters or search keywords.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-base)] flex items-center justify-between text-xs text-[var(--text-tertiary)] bg-[var(--bg-subtle)]">
          <span className="font-mono">
            Showing {filtered.length === 0 ? 0 : (page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-1.5">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="btn btn-secondary btn-sm"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 text-xs font-mono font-bold rounded-lg border transition-all ${
                  p === page
                    ? "bg-teal-500 text-slate-950 font-bold border-teal-500 shadow-glow"
                    : "bg-[var(--bg-surface)] border-[var(--border-base)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="btn btn-secondary btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FragmentRow({ v, expanded, onToggle }: { v: Violation; expanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer transition-colors ${
          expanded ? "bg-teal-500/10 dark:bg-teal-500/15" : ""
        }`}
      >
        <td className="font-mono text-xs text-teal-400 font-bold">{v.violation_id}</td>
        <td className="font-bold text-[var(--text-primary)]">{v.product_id}</td>
        <td className="font-mono text-xs text-[var(--text-secondary)]">{v.issue}</td>
        <td><SeverityBadge severity={v.severity} /></td>
        <td><ConfidenceBar value={v.confidence} /></td>
        <td className="text-xs text-[var(--text-tertiary)] font-mono whitespace-nowrap">
          {new Date(v.detected_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
        </td>
        <td className="text-right">
          <ExternalLink className="w-4 h-4 text-[var(--text-tertiary)] hover:text-teal-400 transition-colors inline-block" />
        </td>
      </tr>

      {/* Expanded Row Detail */}
      <AnimatePresence>
        {expanded && (
          <tr key={`${v.violation_id}-detail`}>
            <td colSpan={7} className="p-0 border-t border-[var(--border-base)]">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="px-6 py-4 bg-[var(--bg-subtle)] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs overflow-hidden"
              >
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Clause Reference</div>
                  <div className="text-[var(--text-primary)] font-medium">{v.clause}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Rule Identifier</div>
                  <code className="text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 font-mono font-bold">
                    {v.rule_id}
                  </code>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Diagnostic Message</div>
                  <div className="text-[var(--text-secondary)]">{v.message}</div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}
