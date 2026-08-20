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

const SEVERITY_COLOR: Record<string, string> = {
  HIGH: "#F87171",
  MEDIUM: "#FCD34D",
  LOW: "#93C5FD",
};

export function LiveFeedTicker() {
  // Start with empty array — avoids SSR/client timestamp hydration mismatch.
  // Data is populated exclusively in useEffect (client-only).
  const [violations, setViolations] = useState<ViolationMessage[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Seed initial items after hydration so SSR renders an empty ticker
    setViolations([makeMockViolation(), makeMockViolation(), makeMockViolation()]);
    setMounted(true);

    // Mock WebSocket interval — replace with getSocket().on("new_violation", ...) at integration time
    const interval = setInterval(() => {
      setViolations((prev) => [makeMockViolation(), ...prev].slice(0, 12));
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: "var(--sidebar-width)",
        right: 0,
        height: 40,
        background: "#0F172A",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        zIndex: 50,
        overflow: "hidden",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {/* Label */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 16px",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          background: "#0F172A",
          height: "100%",
          zIndex: 1,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#F87171",
            display: "inline-block",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        <span style={{ color: "#F8FAFC", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em" }}>
          LIVE
        </span>
      </div>

      {/* Scrolling content — only rendered client-side after mount to avoid hydration timestamp mismatch */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          animation: mounted ? "ticker 60s linear infinite" : "none",
          whiteSpace: "nowrap",
          willChange: "transform",
        }}
      >
        {mounted && [...violations, ...violations].map((v, i) => (
          <div
            key={`${v.violation_id}-${i}`}
            style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 40 }}
          >
            <span style={{ color: "#475569", fontSize: 10 }}>[{v.timestamp}]</span>
            <span
              style={{
                color: SEVERITY_COLOR[v.severity],
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {v.issue}
            </span>
            <span style={{ color: "#475569", fontSize: 10 }}>on</span>
            <code
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "#94A3B8",
                padding: "1px 6px",
                borderRadius: 3,
                fontSize: 10,
              }}
            >
              {v.product_id}
            </code>
            <span style={{ color: "#1E293B", fontSize: 10, margin: "0 4px" }}>·</span>
          </div>
        ))}
        {mounted && violations.length === 0 && (
          <span style={{ color: "#475569", fontSize: 10, marginLeft: 16 }}>
            Waiting for violations…
          </span>
        )}
      </div>
    </div>
  );
}
