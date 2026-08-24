"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { ShieldAlert, ShieldCheck, Package, ChevronRight, Image as ImageIcon, CheckCircle2, ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Violation {
  rule_id: string;
  issue: string;
  message: string;
  severity: string;
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
  images: { url: string }[];
  violations: Violation[];
}

export default function DatasetResultsPage() {
  const params = useParams();
  const router = useRouter();
  const datasetName = decodeURIComponent(params.dataset_name as string);

  const [scans, setScans] = useState<ProductScan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        // Fetch products matching the dataset_name with a high limit (500)
        const res = await fetch(`${apiUrl}/products?limit=500&dataset_name=${encodeURIComponent(datasetName)}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setScans(data);
        } else {
          console.error("API returned non-array data:", data);
          setScans([]);
        }
      } catch (err) {
        console.error("Failed to load dataset results", err);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [datasetName]);

  return (
    <div className="app-content h-full flex flex-col bg-[var(--bg-base)]">
      <Header
        title={`Dataset: ${datasetName}`}
        breadcrumbs={[{ label: "LexScan" }, { label: "Scan History", href: "/history" }, { label: datasetName }]}
      />
      
      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <button 
                onClick={() => router.push('/history')}
                className="mb-4 flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Go Back to History
              </button>
              <h2 className="text-2xl font-display font-bold text-[var(--text-primary)]">{datasetName} Results</h2>
              <p className="text-[var(--text-secondary)] mt-1">Review the extracted metadata and compliance rules for all products in this dataset.</p>
            </div>
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-4 py-2 rounded-lg text-center">
              <div className="text-2xl font-bold text-indigo-500">{scans.length}</div>
              <div className="text-xs text-[var(--text-secondary)] uppercase font-semibold">Products</div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)]">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-4"></div>
              Loading dataset results...
            </div>
          ) : scans.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl">
              No products found in this dataset.
            </div>
          ) : (
            <div className="space-y-6">
              {scans.map((scan) => (
                <div key={scan.id} className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row">
                  {/* Product Image Side */}
                  <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900/50 border-r border-[var(--border-subtle)] flex flex-col p-4 items-center justify-center shrink-0">
                    {scan.images && scan.images.length > 0 && scan.images[0].url ? (
                      <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={scan.images[0].url} alt={scan.title} className="w-full h-full object-contain p-2" />
                      </div>
                    ) : (
                      <div className="w-40 h-40 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] flex flex-col items-center justify-center text-[var(--text-tertiary)]">
                        <ImageIcon className="w-8 h-8 mb-2" />
                        <span className="text-xs">No Image</span>
                      </div>
                    )}
                    
                    <div className="mt-4 flex items-center justify-center">
                      <Link href={`/history/${scan.id}`} className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer ${
                        scan.compliance_score >= 80 
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20' 
                          : scan.compliance_score >= 50 
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20'
                            : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
                      }`} title="Click to view full reasoning & details">
                        <span className="text-2xl">{scan.compliance_score}</span>
                        <span className="text-sm font-medium">/ 100</span>
                      </Link>
                    </div>
                  </div>

                  {/* Details Side */}
                  <div className="flex-1 p-6 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] leading-tight">{scan.title}</h3>
                      <span className="px-2.5 py-1 rounded-md bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)] ml-4 shrink-0">
                        {scan.platform}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-[var(--text-tertiary)] mb-6">
                      ID: {scan.product_id}
                    </div>

                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                        {scan.violations && scan.violations.length > 0 ? (
                          <>
                            <ShieldAlert className="w-4 h-4 text-red-500" />
                            Rule Violations ({scan.violations.length})
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Fully Compliant (No Violations)
                          </>
                        )}
                      </h4>
                      
                      {scan.violations && scan.violations.length > 0 ? (
                        <div className="space-y-3">
                          {scan.violations.map((vio, i) => (
                            <div key={i} className="flex gap-3 text-sm p-3 rounded-lg bg-red-500/5 border border-red-500/10 relative overflow-hidden group">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0"></div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="font-medium text-[var(--text-primary)]">{vio.issue.replace(/_/g, ' ')}</div>
                                  <div className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                    vio.severity === 'HIGH' ? 'bg-red-500/10 text-red-500' :
                                    vio.severity === 'MEDIUM' ? 'bg-orange-500/10 text-orange-500' :
                                    'bg-amber-500/10 text-amber-500'
                                  }`}>
                                    -{vio.severity === 'HIGH' ? 20 : vio.severity === 'MEDIUM' ? 10 : 5} pts
                                  </div>
                                </div>
                                <div className="text-[var(--text-secondary)] mt-0.5">{vio.message}</div>
                                <div className="flex items-center justify-between mt-2">
                                  <div className="text-[10px] font-mono text-[var(--text-tertiary)] bg-[var(--bg-base)] inline-block px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">
                                    {vio.rule_id}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-600/90 dark:text-emerald-400 text-sm flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 shrink-0" />
                          <p>This product satisfies all extracted compliance rules and passes schema validation.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
