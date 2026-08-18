"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, Filter } from "lucide-react";

interface Violation {
  violation_id: string;
  product_id: string;
  rule_id: string;
  issue: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  confidence: number;
  detected_at: string;
}

const MOCK_DATA: Violation[] = [
  { violation_id: "VIO-001", product_id: "AMZ-IN-101", rule_id: "LM-R06", issue: "PRICE_ABOVE_MRP", severity: "HIGH", confidence: 0.98, detected_at: "2026-08-18T10:00:00Z" },
  { violation_id: "VIO-002", product_id: "FLK-IN-202", rule_id: "LM-R06", issue: "MISSING_ORIGIN", severity: "MEDIUM", confidence: 0.85, detected_at: "2026-08-18T10:05:00Z" },
  { violation_id: "VIO-003", product_id: "AMZ-IN-103", rule_id: "LM-R08", issue: "MISSING_NET_QTY", severity: "LOW", confidence: 0.92, detected_at: "2026-08-18T10:10:00Z" },
  { violation_id: "VIO-004", product_id: "MSH-IN-304", rule_id: "LM-R06", issue: "MISSING_MANUFACTURER", severity: "HIGH", confidence: 0.76, detected_at: "2026-08-18T10:15:00Z" },
];

type SortKey = keyof Violation;

export function ViolationExplorer() {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("detected_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let data = MOCK_DATA.filter(
      (v) =>
        (severityFilter === "ALL" || v.severity === severityFilter) &&
        (v.product_id.toLowerCase().includes(search.toLowerCase()) ||
          v.issue.toLowerCase().includes(search.toLowerCase()))
    );

    data.sort((a, b) => {
      if (a[sortKey] < b[sortKey]) return sortOrder === "asc" ? -1 : 1;
      if (a[sortKey] > b[sortKey]) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [search, severityFilter, sortKey, sortOrder]);

  const paginatedData = filteredAndSortedData.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "HIGH": return "bg-red-100 text-red-700 border-red-200";
      case "MEDIUM": return "bg-amber-100 text-amber-700 border-amber-200";
      case "LOW": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm w-full overflow-hidden">
      <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products or issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-slate-900/10 transition-shadow"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm outline-none bg-white"
          >
            <option value="ALL">All Severities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b">
            <tr>
              <th className="px-4 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("violation_id")}>
                <div className="flex items-center gap-1">Violation ID {sortKey === "violation_id" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</div>
              </th>
              <th className="px-4 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("product_id")}>
                <div className="flex items-center gap-1">Product {sortKey === "product_id" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</div>
              </th>
              <th className="px-4 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("issue")}>
                <div className="flex items-center gap-1">Issue {sortKey === "issue" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</div>
              </th>
              <th className="px-4 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("severity")}>
                <div className="flex items-center gap-1">Severity {sortKey === "severity" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</div>
              </th>
              <th className="px-4 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("confidence")}>
                <div className="flex items-center gap-1">Confidence {sortKey === "confidence" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length > 0 ? (
              paginatedData.map((v) => (
                <tr key={v.violation_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{v.violation_id}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{v.product_id}</td>
                  <td className="px-4 py-3 text-slate-700">{v.issue}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSeverityColor(v.severity)}`}>
                      {v.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-800 rounded-full" style={{ width: `${v.confidence * 100}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{Math.round(v.confidence * 100)}%</span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500 italic">No violations found matching criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t bg-slate-50 flex items-center justify-between text-sm text-slate-500">
        <div>
          Showing {filteredAndSortedData.length === 0 ? 0 : (page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} results
        </div>
        <div className="flex gap-1">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 border rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
          >
            Prev
          </button>
          <button
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 border rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
