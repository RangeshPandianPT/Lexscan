"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";

interface ViolationMessage {
  violation_id: string;
  product_id: string;
  issue: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
}

export function LiveFeedTicker() {
  const [violations, setViolations] = useState<ViolationMessage[]>([]);

  useEffect(() => {
    const socket = getSocket();

    // Listen for real-time violations
    socket.on("new_violation", (data: ViolationMessage) => {
      setViolations((prev) => [data, ...prev].slice(0, 10)); // Keep last 10
    });

    // Mock interval since we don't have the backend yet
    const mockInterval = setInterval(() => {
      const mockViolation: ViolationMessage = {
        violation_id: `VIO-${Date.now()}`,
        product_id: `AMZ-IN-${Math.floor(Math.random() * 10000)}`,
        issue: "PRICE_ABOVE_MRP",
        severity: "HIGH",
      };
      setViolations((prev) => [mockViolation, ...prev].slice(0, 10));
    }, 5000);

    return () => {
      socket.off("new_violation");
      clearInterval(mockInterval);
    };
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-slate-50 border-t border-slate-800 p-2 z-50 overflow-hidden flex shadow-lg">
      <div className="flex-shrink-0 font-bold px-4 border-r border-slate-700 bg-slate-900 z-10 flex items-center shadow-[4px_0_10px_rgba(0,0,0,0.5)]">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2" />
        LIVE FEED
      </div>
      <div className="flex animate-[ticker_30s_linear_infinite] whitespace-nowrap overflow-visible">
        {violations.map((v) => (
          <div key={v.violation_id} className="mx-4 flex items-center space-x-2 text-sm">
            <span className="text-slate-400">[{new Date().toLocaleTimeString()}]</span>
            <span className="text-red-400 font-medium">{v.issue}</span>
            <span className="text-slate-300 ml-1">on</span>
            <span className="font-mono bg-slate-800 px-1 py-0.5 rounded text-xs">{v.product_id}</span>
          </div>
        ))}
        {violations.length === 0 && (
          <div className="mx-4 text-slate-500 text-sm italic">Waiting for incoming violations...</div>
        )}
      </div>
    </div>
  );
}
