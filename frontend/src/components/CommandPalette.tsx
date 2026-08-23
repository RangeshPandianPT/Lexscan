"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  LayoutDashboard,
  ShieldAlert,
  Map,
  Users,
  Settings,
  Sun,
  Moon,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands = [
    {
      group: "Navigation",
      items: [
        { label: "Overview Dashboard", icon: LayoutDashboard, action: () => router.push("/") },
        { label: "Violation Explorer", icon: ShieldAlert, action: () => router.push("/violations") },
        { label: "Tactical Heatmap", icon: Map, action: () => router.push("/geo") },
        { label: "Seller Radar", icon: Users, action: () => router.push("/sellers") },
        { label: "Rule Studio (Admin)", icon: Settings, action: () => router.push("/admin") },
      ],
    },
    {
      group: "Quick Actions",
      items: [
        {
          label: `Switch to ${theme === "dark" ? "Warm Horizon" : "Midnight Ocean"}`,
          icon: theme === "dark" ? Sun : Moon,
          action: () => toggleTheme(),
        },
        {
          label: "Trigger New Product Scan",
          icon: Sparkles,
          action: () => router.push("/admin"),
        },
      ],
    },
  ];

  const allItems = commands.flatMap((group) => group.items);
  const filteredItems = allItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery("");
      }
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
      } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
        e.preventDefault();
        filteredItems[selectedIndex].action();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="w-full max-w-xl bg-[var(--bg-elevated)] border border-[var(--border-highlight)] rounded-2xl shadow-elevated overflow-hidden backdrop-blur-2xl"
        >
          {/* Search Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-base)] bg-[var(--bg-surface)]">
            <Search className="w-5 h-5 text-[var(--color-primary)]" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Execute command or jump to route..."
              className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
            />
            <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-[var(--bg-subtle)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1 bg-[var(--bg-base)]">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all border ${
                      isSelected
                        ? "bg-gradient-to-r from-teal-500/15 via-amber-500/10 to-transparent text-[var(--color-primary)] border-teal-500/30 font-bold shadow-[0_4px_16px_rgba(45,212,191,0.1)]"
                        : "text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-subtle)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isSelected ? "text-[var(--color-primary)]" : "text-[var(--text-tertiary)]"}`} />
                      <span>{item.label}</span>
                    </div>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-[var(--color-primary)]" />}
                  </button>
                );
              })
            ) : (
              <div className="py-8 text-center font-mono text-xs text-[var(--text-tertiary)]">
                NO COMMAND FOUND.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-[var(--bg-surface)] border-t border-[var(--border-base)] flex items-center justify-between text-[11px] text-[var(--text-tertiary)] font-mono">
            <span className="uppercase tracking-widest text-[10px] text-[var(--color-primary)] font-bold">Command Center</span>
            <div className="flex items-center gap-3">
              <span>↑↓ NAVIGATE</span>
              <span>↵ EXECUTE</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
