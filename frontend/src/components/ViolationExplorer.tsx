"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, Filter, ExternalLink } from "lucide-react";

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
  const color = pct >= 90 ? "#6366F1" : pct >= 75 ? "#D97706" : "#94A3B8";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11.5px] text-slate-500 tabular-nums">{pct}%</span>
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
      sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3 opacity-30" />
    );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search product, issue, or ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="form-input pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
            className="form-select w-auto"
          >
            <option value="ALL">All Severities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        <div className="text-[12px] text-slate-400 self-center ml-auto">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <button onClick={() => handleSort("violation_id")} className="flex items-center gap-1 hover:text-slate-700">
                    ID <SortIcon k="violation_id" />
                  </button>
                </th>
                <th>
                  <button onClick={() => handleSort("product_id")} className="flex items-center gap-1 hover:text-slate-700">
                    Product <SortIcon k="product_id" />
                  </button>
                </th>
                <th>
                  <button onClick={() => handleSort("issue")} className="flex items-center gap-1 hover:text-slate-700">
                    Issue <SortIcon k="issue" />
                  </button>
                </th>
                <th>
                  <button onClick={() => handleSort("severity")} className="flex items-center gap-1 hover:text-slate-700">
                    Severity <SortIcon k="severity" />
                  </button>
                </th>
                <th>
                  <button onClick={() => handleSort("confidence")} className="flex items-center gap-1 hover:text-slate-700">
                    Confidence <SortIcon k="confidence" />
                  </button>
                </th>
                <th>
                  <button onClick={() => handleSort("detected_at")} className="flex items-center gap-1 hover:text-slate-700">
                    Detected <SortIcon k="detected_at" />
                  </button>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? (
                paginated.map((v) => (
                  <>
                    <tr
                      key={v.violation_id}
                      className={`cursor-pointer ${expandedRow === v.violation_id ? "bg-indigo-50/60" : ""}`}
                      onClick={() => setExpandedRow(expandedRow === v.violation_id ? null : v.violation_id)}
                    >
                      <td className="font-mono text-[11px] text-indigo-700 font-medium">{v.violation_id}</td>
                      <td className="font-medium text-slate-800">{v.product_id}</td>
                      <td className="text-slate-600 font-mono text-[11.5px]">{v.issue}</td>
                      <td><SeverityBadge severity={v.severity} /></td>
                      <td><ConfidenceBar value={v.confidence} /></td>
                      <td className="text-[11.5px] text-slate-400 whitespace-nowrap">
                        {new Date(v.detected_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
                      </td>
                      <td>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-300 hover:text-indigo-500 transition-colors" />
                      </td>
                    </tr>
                    {/* Expanded row detail */}
                    {expandedRow === v.violation_id && (
                      <tr key={`${v.violation_id}-detail`}>
                        <td colSpan={7} className="px-5 py-4 bg-indigo-50/40 border-t border-indigo-100 animate-fade-in">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-[12px]">
                            <div>
                              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Clause</div>
                              <div className="text-slate-700">{v.clause}</div>
                            </div>
                            <div>
                              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Rule ID</div>
                              <code className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-mono">{v.rule_id}</code>
                            </div>
                            <div className="md:col-span-1">
                              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Message</div>
                              <div className="text-slate-700">{v.message}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Search className="w-8 h-8 opacity-30" />
                      <div className="text-[13px] font-medium">No violations found</div>
                      <div className="text-[11px]">Try adjusting your search or filter criteria.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-[12px] text-slate-500 bg-slate-50/50">
          <span>
            Showing {filtered.length === 0 ? 0 : (page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-1">
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
                className={`w-7 h-7 text-[12px] rounded border transition-colors ${p === page ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 hover:bg-slate-50"}`}
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
