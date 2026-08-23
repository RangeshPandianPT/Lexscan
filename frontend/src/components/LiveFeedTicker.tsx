"use client";

import { useEffect, useState } from "react";

interface ViolationMessage {
  violation_id: string;
  product_id: string;
  issue: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  timestamp: string;
}

const ISSUE_POOL: ViolationMessage["issue"][] = [
  "PRICE_ABOVE_MRP",
  "MISSING_MANUFACTURER",
  "MISSING_NET_QTY",
  "MISSING_CONSUMER_CARE",
  "MISSING_ORIGIN",
  "MISSING_MFG_DATE",
];

const SEVERITY_POOL: ViolationMessage["severity"][] = ["HIGH", "HIGH", "MEDIUM", "MEDIUM", "LOW"];
const PLATFORM_PREFIXES = ["AMZ-IN", "FLK-IN", "MSH-IN"];

function makeMockViolation(): ViolationMessage {
  return {
    violation_id: `VIO-${Date.now()}`,
    product_id: `${PLATFORM_PREFIXES[Math.floor(Math.random() * 3)]}-${Math.floor(Math.random() * 9000) + 1000}`,
    issue: ISSUE_POOL[Math.floor(Math.random() * ISSUE_POOL.length)],
    severity: SEVERITY_POOL[Math.floor(Math.random() * SEVERITY_POOL.length)],
    timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}

export function LiveFeedTicker() {
  const [violations, setViolations] = useState<ViolationMessage[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setViolations([makeMockViolation(), makeMockViolation(), makeMockViolation(), makeMockViolation()]);
    setMounted(true);

    const interval = setInterval(() => {
      setViolations((prev) => [makeMockViolation(), ...prev].slice(0, 12));
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed bottom-0 left-[var(--sidebar-width)] right-0 h-10 bg-[var(--bg-sidebar)] border-t border-[var(--border-base)] flex items-center z-40 overflow-hidden font-mono backdrop-blur-xl select-none transition-all"
      style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.05) 50%)', backgroundSize: '100% 4px' }}
    >
      {/* Live Radar Label */}
      <div className="flex-shrink-0 flex items-center gap-2.5 px-4 h-full bg-[var(--bg-surface)] border-r border-[var(--border-base)] z-10 shadow-[4px_0_12px_rgba(0,0,0,0.1)]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
        <span className="text-[10px] font-bold tracking-widest uppercase text-rose-500 font-display">
          THREAT FEED
        </span>
      </div>

      {/* Ticker Stream */}
      <div className="flex items-center animate-ticker whitespace-nowrap will-change-transform h-full">
        {mounted &&
          [...violations, ...violations].map((v, i) => (
            <div
              key={`${v.violation_id}-${i}`}
              className="inline-flex items-center gap-2 mr-8 text-[11px]"
            >
              <span className="text-[var(--text-tertiary)]">[{v.timestamp}]</span>
              <span
                className={`font-semibold ${
                  v.severity === "HIGH"
                    ? "text-rose-500"
                    : v.severity === "MEDIUM"
                    ? "text-amber-500"
                    : "text-teal-400"
                }`}
              >
                {v.issue}
              </span>
              <span className="text-[var(--text-tertiary)] opacity-50">::</span>
              <code className="px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-[10px] font-bold">
                {v.product_id}
              </code>
              <span className="text-[var(--border-base)] ml-4 font-bold">|</span>
            </div>
          ))}
      </div>
    </div>
  );
}
