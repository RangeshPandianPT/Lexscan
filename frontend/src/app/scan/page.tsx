"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Scan, Database, Upload, Link as LinkIcon, Loader2, CheckCircle2, AlertCircle, ShieldAlert, ShieldCheck, ChevronRight } from "lucide-react";

export default function ScanPage() {
  const [activeTab, setActiveTab] = useState<"single" | "batch">("single");
  const router = useRouter();
  
  // Single Scan State
  const [singleUrl, setSingleUrl] = useState("");
  const [platform, setPlatform] = useState("amazon");
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleResult, setSingleResult] = useState<{status: "idle" | "success" | "error", message: string}>({status: "idle", message: ""});
  const [scanData, setScanData] = useState<any>(null);

  // Batch Scan State
  const [kaggleLink, setKaggleLink] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState<{status: "idle" | "success" | "error", message: string}>({status: "idle", message: ""});

  const handleSingleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleUrl) return;

    setSingleLoading(true);
    setSingleResult({ status: "idle", message: "" });
    setScanData(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/admin/scan/trigger`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: singleUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        setSingleResult({ status: "success", message: `Scan completed successfully for ${data.product_id || 'product'}!` });
        setScanData(data);
        setSingleUrl("");
      } else {
        setSingleResult({ status: "error", message: data.detail || "Failed to run scan." });
      }
    } catch (error: any) {
      setSingleResult({ status: "error", message: error.message || "Network error occurred." });
    } finally {
      setSingleLoading(false);
    }
  };

  const handleBatchScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kaggleLink && !csvFile) {
      setBatchResult({ status: "error", message: "Please provide a Kaggle link or upload a CSV file." });
      return;
    }

    setBatchLoading(true);
    setBatchResult({ status: "idle", message: "" });

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      const dsName =
        kaggleLink?.split("/").pop() ||
        `dataset-${Math.random().toString(36).substr(2, 6)}`;

      // Guarantee at least 10s wait to show the cool animation
      const minWait = 10000;
      const startTime = Date.now();

      const response = await fetch(`${apiUrl}/admin/scan/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: kaggleLink || "local_csv", dataset_name: dsName }),
      });

      if (!response.ok) {
        throw new Error("Failed to start batch ingestion");
      }
      
      const elapsed = Date.now() - startTime;
      if (elapsed < minWait) {
        await new Promise(resolve => setTimeout(resolve, minWait - elapsed));
      }

      setBatchResult({ status: "success", message: "Dataset imported and added to queue successfully!" });
      setKaggleLink("");
      setCsvFile(null);
      router.push(`/dataset-results/${encodeURIComponent(dsName)}`);
    } catch (error: any) {
      setBatchResult({ status: "error", message: error.message || "Failed to process dataset." });
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-[var(--text-primary)] mb-2">Scanner Console</h1>
        <p className="text-[var(--text-secondary)]">Trigger single product scans or import datasets for batch processing.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab("single")}
          className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 ${
            activeTab === "single" 
              ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" 
              : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-base)] hover:bg-[var(--bg-subtle)]"
          }`}
        >
          <Scan className="w-5 h-5" />
          Single Scan
        </button>
        <button
          onClick={() => setActiveTab("batch")}
          className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 ${
            activeTab === "batch" 
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
              : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-base)] hover:bg-[var(--bg-subtle)]"
          }`}
        >
          <Database className="w-5 h-5" />
          Dataset Import
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Main Form Area */}
        <div className="col-span-1">
          {activeTab === "single" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                <Scan className="w-5 h-5 text-teal-400" />
                Target URL
              </h2>
              
              <form onSubmit={handleSingleScan} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Platform</label>
                  <div className="flex gap-3">
                    {["amazon", "flipkart", "bigbasket"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPlatform(p)}
                        className={`flex-1 capitalize py-2.5 rounded-lg text-sm font-medium border transition-all ${
                          platform === p 
                            ? "bg-teal-500/10 border-teal-500/50 text-teal-400" 
                            : "bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Product URL</label>
                  <input
                    type="url"
                    value={singleUrl}
                    onChange={(e) => setSingleUrl(e.target.value)}
                    placeholder={`https://www.${platform}.in/product-path`}
                    required
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-teal-500/50 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={singleLoading || !singleUrl}
                  className="w-full bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/30 rounded-lg py-3 font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {singleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scan className="w-5 h-5" />}
                  {singleLoading ? "Scanning & Analyzing..." : "Run Compliance Scan"}
                </button>
              </form>

              {singleResult.status !== "idle" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className={`mt-4 p-4 rounded-lg flex items-start gap-3 border ${
                    singleResult.status === "success" 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}
                >
                  {singleResult.status === "success" ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                  <div className="text-sm">{singleResult.message}</div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === "batch" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-400" />
                Dataset Source
              </h2>
              
              <form onSubmit={handleBatchScan} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Kaggle Dataset Link
                  </label>
                  <input
                    type="text"
                    value={kaggleLink}
                    onChange={(e) => setKaggleLink(e.target.value)}
                    placeholder="https://www.kaggle.com/datasets/..."
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--border-subtle)]"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[var(--bg-surface)] text-[var(--text-tertiary)]">OR</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload CSV File
                  </label>
                  <div className="border-2 border-dashed border-[var(--border-subtle)] rounded-xl p-8 text-center hover:border-amber-500/50 transition-colors bg-[var(--bg-base)] group relative">
                    <input 
                      type="file" 
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-3 group-hover:text-amber-400 transition-colors" />
                    <p className="text-sm text-[var(--text-secondary)]">
                      {csvFile ? <span className="text-amber-400 font-medium">{csvFile.name}</span> : "Drag and drop your CSV or click to browse"}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={batchLoading || (!kaggleLink && !csvFile)}
                  className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg py-3 font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {batchLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                  {batchLoading ? "Importing Dataset..." : "Import Dataset"}
                </button>
              </form>

              {batchResult.status !== "idle" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className={`mt-4 p-4 rounded-lg flex items-start gap-3 border ${
                    batchResult.status === "success" 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}
                >
                  {batchResult.status === "success" ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                  <div className="text-sm">{batchResult.message}</div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>

        {/* Crazy Loading Overlay */}
        {batchLoading && (
          <div className="fixed inset-0 z-50 bg-[#0f172a]/90 backdrop-blur-md flex flex-col items-center justify-center font-mono">
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Outer ring */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-t-teal-500 border-r-transparent border-b-amber-500 border-l-transparent rounded-full"
              />
              {/* Inner ring */}
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 border-4 border-t-transparent border-r-indigo-500 border-b-transparent border-l-rose-500 rounded-full opacity-50"
              />
              {/* Center icon pulse */}
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="relative z-10"
              >
                <Database className="w-16 h-16 text-teal-400" />
              </motion.div>
            </div>
            
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mt-8 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-amber-400 tracking-widest"
            >
              INGESTING DATASET...
            </motion.div>
            
            <div className="mt-4 text-sm text-[var(--text-secondary)]">
              LexScan AI is parsing labels and extracting compliance metadata.
            </div>
            
            <div className="w-64 h-2 bg-slate-800 rounded-full mt-6 overflow-hidden relative">
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 10, ease: "linear" }}
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-500 to-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Info / Logs Area */}
        <div className="col-span-1">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl p-6 h-full shadow-sm flex flex-col">
            {scanData ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col h-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] font-display">Scan Result</h3>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    scanData.status === "COMPLIANT" 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-red-500/10 text-red-400 border-red-500/30"
                  }`}>
                    {scanData.status}
                  </div>
                </div>
                
                <div className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl p-4 mb-4">
                  <h4 className="text-sm font-medium text-[var(--text-primary)] line-clamp-2 mb-2">{scanData.title}</h4>
                  <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                    <span>ID: <span className="font-mono text-[var(--text-primary)]">{scanData.product_id}</span></span>
                    <span>Platform: <span className="uppercase text-[var(--text-primary)]">{scanData.platform}</span></span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl mb-4">
                  <div className="text-sm text-[var(--text-secondary)]">Compliance Score</div>
                  <div className={`text-xl font-bold font-display ${scanData.compliance_score >= 80 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {scanData.compliance_score}%
                  </div>
                </div>

                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">Violations Detected ({scanData.violations?.length || 0})</h4>
                  {scanData.violations && scanData.violations.length > 0 ? (
                    <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                      {scanData.violations.map((v: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-sm">
                          <div className="font-semibold text-red-400 mb-1 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" />
                            {v.issue || v.rule_id}
                          </div>
                          <div className="text-[var(--text-secondary)] text-xs">{v.message}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center border border-emerald-500/20 bg-emerald-500/5 rounded-xl h-[200px]">
                      <ShieldCheck className="w-10 h-10 text-emerald-400 mb-3" />
                      <p className="text-emerald-400 font-medium text-sm">No violations found!</p>
                      <p className="text-emerald-400/70 text-xs mt-1">This product complies with legal metrology rules.</p>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                    <Link 
                      href={`/history/${scanData.id}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-teal-500/30 transition-colors"
                    >
                      View Detailed Profile
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 font-display">How it works</h3>
                <div className="space-y-4 text-sm text-[var(--text-secondary)] flex-1">
                  <div className="p-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)]">
                    <div className="font-semibold text-teal-400 mb-1 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center text-xs">1</span>
                      Crawler Execution
                    </div>
                    <p>The Python-based web crawler downloads the product page and captures raw HTML and packaging images.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)]">
                    <div className="font-semibold text-amber-400 mb-1 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-xs">2</span>
                      AI Pipeline Analysis
                    </div>
                    <p>Gemini vision models perform OCR on packaging images and parse textual compliance declarations.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)]">
                    <div className="font-semibold text-rose-400 mb-1 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-xs">3</span>
                      Rules Engine Evaluation
                    </div>
                    <p>Extracted fields are evaluated against the Legal Metrology Rules, and violations are logged to the dashboard.</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
