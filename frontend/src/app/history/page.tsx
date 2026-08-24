"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import Link from "next/link";
import { History, ShieldAlert, ShieldCheck, ChevronRight, Package, Database, Trash2 } from "lucide-react";

function formatExactDateTime(dateStr?: string) {
  if (!dateStr) return "Unknown";
  try {
    const cleanStr = dateStr.includes("Z") || dateStr.includes("+") ? dateStr : `${dateStr}Z`;
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) {
      const fallbackD = new Date(dateStr);
      if (isNaN(fallbackD.getTime())) return dateStr;
      return fallbackD.toLocaleString("en-IN", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    }
    return d.toLocaleString("en-IN", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return dateStr;
  }
}

interface ProductScan {
  id: string;
  product_id: string;
  platform: string;
  title: string;
  url: string;
  status: string;
  compliance_score: number;
  timestamp: string;
  scraped_at: string;
}

interface DatasetScan {
  dataset_name: string;
  product_count: number;
  last_scan: string;
}

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<"targeted" | "datasets">("targeted");
  const [scans, setScans] = useState<ProductScan[]>([]);
  const [datasets, setDatasets] = useState<DatasetScan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        if (activeTab === "targeted") {
          const res = await fetch(`${apiUrl}/products?limit=100&dataset_name=__NONE__`);
          const data = await res.json();
          setScans(data);
        } else {
          const res = await fetch(`${apiUrl}/datasets`);
          const data = await res.json();
          setDatasets(data);
        }
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeTab]);

  return (
    <div className="app-content h-full flex flex-col">
      <Header
        title="Scan History"
        breadcrumbs={[{ label: "LexScan" }, { label: "Scan History" }]}
      />
      
      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
                <History className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-[var(--text-primary)]">Scan History</h2>
                <p className="text-[var(--text-secondary)] text-sm">Review past product scans and bulk datasets.</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-1 mb-6 p-1 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-base)] w-max">
            <button
              onClick={() => setActiveTab("targeted")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === "targeted"
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
              }`}
            >
              Targeted Scanning
            </button>
            <button
              onClick={() => setActiveTab("datasets")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === "datasets"
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
              }`}
            >
              Data Sets
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-[var(--text-secondary)]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mr-3"></div>
              Loading...
            </div>
          ) : (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl overflow-hidden shadow-sm">
              {activeTab === "targeted" && (
                <>
                  <div className="grid grid-cols-12 gap-4 p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-base)] text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                    <div className="col-span-5 md:col-span-4">Product Details</div>
                    <div className="col-span-3 md:col-span-2 hidden md:block">Platform</div>
                    <div className="col-span-3 md:col-span-2">Date Scanned</div>
                    <div className="col-span-4 md:col-span-3">Status</div>
                    <div className="col-span-3 md:col-span-1 text-right">Action</div>
                  </div>
                  
                  <div className="divide-y divide-[var(--border-subtle)]">
                    {scans.length === 0 ? (
                      <div className="p-8 text-center text-[var(--text-secondary)]">No targeted scans found.</div>
                    ) : (
                      scans.map((scan) => (
                        <div key={scan.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[var(--bg-subtle)] transition-colors group">
                          <div className="col-span-6 md:col-span-4 flex items-start gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0">
                              <Package className="w-5 h-5 text-[var(--text-tertiary)]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-[var(--text-primary)] truncate" title={scan.title}>
                                {scan.title}
                              </div>
                              <div className="text-xs text-[var(--text-secondary)] font-mono mt-1">
                                {scan.product_id}
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-span-2 hidden md:flex items-center">
                            <span className="px-2 py-1 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[10px] uppercase font-bold tracking-wider">
                              {scan.platform}
                            </span>
                          </div>
                          
                          <div className="col-span-3 md:col-span-2 text-xs text-[var(--text-secondary)] font-mono">
                            {formatExactDateTime(scan.timestamp || scan.scraped_at)}
                          </div>
                          
                          <div className="col-span-3 md:col-span-3 flex items-center gap-2">
                            {scan.status === "COMPLIANT" ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Compliant</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Violation</span>
                              </div>
                            )}
                            <div className="text-xs font-mono text-[var(--text-tertiary)] hidden lg:block">
                              ({scan.compliance_score}%)
                            </div>
                          </div>
                          
                          <div className="col-span-3 md:col-span-1 flex justify-end items-center gap-1.5">
                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!confirm(`Are you sure you want to delete scan '${scan.title || scan.product_id}'?`)) return;
                                try {
                                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                                  const res = await fetch(`${apiUrl}/products/${encodeURIComponent(scan.id)}`, { method: "DELETE" });
                                  if (res.ok) {
                                    setScans(prev => prev.filter(s => s.id !== scan.id));
                                  } else {
                                    alert("Failed to delete scan");
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="w-8 h-8 rounded-full bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-colors z-10"
                              title="Delete Scan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <Link 
                              href={`/history/${scan.id}`}
                              className="w-8 h-8 rounded-full bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-teal-400 hover:border-teal-500/50 transition-colors"
                              title="View Details"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {activeTab === "datasets" && (
                <>
                  <div className="grid grid-cols-12 gap-4 p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-base)] text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                    <div className="col-span-6 md:col-span-6">Dataset Name</div>
                    <div className="col-span-3 md:col-span-2">Products Scanned</div>
                    <div className="col-span-3 md:col-span-3">Last Activity</div>
                    <div className="col-span-12 md:col-span-1 text-right hidden md:block">View</div>
                  </div>
                  
                  <div className="divide-y divide-[var(--border-subtle)]">
                    {datasets.length === 0 ? (
                      <div className="p-8 text-center text-[var(--text-secondary)]">No datasets found.</div>
                    ) : (
                      datasets.map((ds, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[var(--bg-subtle)] transition-colors group">
                          <Link href={`/dataset-results/${encodeURIComponent(ds.dataset_name)}`} className="col-span-6 md:col-span-6 flex items-start gap-3 overflow-hidden cursor-pointer">
                            <div className="w-10 h-10 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0">
                              <Database className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div className="min-w-0 flex-1 flex flex-col justify-center h-10">
                              <div className="text-sm font-medium text-[var(--text-primary)] truncate" title={ds.dataset_name}>
                                {ds.dataset_name}
                              </div>
                            </div>
                          </Link>
                          
                          <div className="col-span-3 md:col-span-2 flex items-center">
                            <span className="px-2.5 py-1 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[11px] font-bold tracking-wider">
                              {ds.product_count} items
                            </span>
                          </div>
                          
                          <div className="col-span-3 md:col-span-3 text-xs text-[var(--text-secondary)] flex items-center font-mono">
                            {formatExactDateTime(ds.last_scan)}
                          </div>
                          
                          <div className="col-span-12 md:col-span-1 hidden md:flex justify-end items-center gap-2">
                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!confirm(`Are you sure you want to delete dataset '${ds.dataset_name}'?`)) return;
                                try {
                                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                                  const res = await fetch(`${apiUrl}/datasets/${encodeURIComponent(ds.dataset_name)}`, { method: "DELETE" });
                                  if (res.ok) {
                                    setDatasets(prev => prev.filter(d => d.dataset_name !== ds.dataset_name));
                                  } else {
                                    alert("Failed to delete dataset");
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="w-8 h-8 rounded-full bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-colors z-10"
                              title="Delete Dataset"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <Link 
                              href={`/dataset-results/${encodeURIComponent(ds.dataset_name)}`}
                              className="w-8 h-8 rounded-full bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-indigo-400 hover:border-indigo-500/50 transition-colors"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
