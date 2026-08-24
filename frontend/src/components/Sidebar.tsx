"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShieldAlert,
  Map,
  Users,
  Settings,
  ScanLine,
  Zap,
  ChevronRight,
  Sun,
  Moon,
  History,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

const navItems = [
  {
    group: "Analytics",
    items: [
      { href: "/", label: "Overview", icon: LayoutDashboard },
      { href: "/violations", label: "Violations", icon: ShieldAlert },
      { href: "/geo", label: "Tactical Map", icon: Map },
      { href: "/sellers", label: "Seller Radar", icon: Users },
      { href: "/history", label: "Scan History", icon: History },
    ],
  },
  {
    group: "System",
    items: [
      { href: "/admin", label: "Rule Config", icon: Settings },
      { href: "/scan", label: "Scanner", icon: ScanLine },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="app-sidebar flex flex-col justify-between select-none">
      {/* Top: Logo & Navigation */}
      <div>
        {/* Logo Header */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-[var(--border-base)]">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500/20 to-amber-500/20 border border-teal-500/30 flex items-center justify-center flex-shrink-0 shadow-glow">
            <ScanLine className="w-5 h-5 text-teal-400 animate-pulse-glow" />
          </div>
          <div>
            <div className="font-display font-black text-xl leading-tight tracking-tight bg-gradient-to-r from-teal-400 via-teal-300 to-amber-400 bg-clip-text text-transparent">
              LexScan
            </div>
            <div className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--text-tertiary)] leading-tight">
              Compliance Radar
            </div>
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="px-3 py-5 space-y-6 overflow-y-auto max-h-[calc(100vh-180px)]">
          {navItems.map((section) => (
            <div key={section.group}>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-tertiary)] px-3 mb-2 flex items-center gap-2">
                <span>{section.group}</span>
                <div className="flex-1 h-[1px] bg-[var(--border-subtle)]" />
              </div>
              {section.items.map(({ href, label, icon: Icon }) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`nav-item group relative ${isActive ? "active" : ""}`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-[var(--color-primary)]" : "text-[var(--text-secondary)]"}`} />
                    <span className="flex-1 relative z-10">{label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="sidebarActive"
                        className="absolute inset-0 bg-gradient-to-r from-teal-500/15 via-amber-500/10 to-transparent rounded-xl border border-teal-500/30 backdrop-blur-xl shadow-[0_4px_20px_rgba(45,212,191,0.12)]"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-[var(--color-primary)] opacity-90 relative z-10" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom: Theme Toggle & Live Feed Status */}
      <div className="p-4 border-t border-[var(--border-base)] space-y-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] text-xs font-semibold transition-all duration-200 border border-[var(--border-base)] shadow-sm group"
          title={`Switch to ${theme === "dark" ? "Tactical Light" : "Midnight Ocean"} Mode`}
        >
          <div className="flex items-center gap-2.5">
            <AnimatePresence mode="wait" initial={false}>
              {theme === "dark" ? (
                <motion.div
                  key="moon"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="w-4 h-4 text-teal-400 group-hover:text-amber-400 transition-colors" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="w-4 h-4 text-amber-500 group-hover:text-teal-600 transition-colors" />
                </motion.div>
              )}
            </AnimatePresence>
            <span className="font-display font-medium text-[11px] uppercase tracking-wider">{theme === "dark" ? "Midnight Ocean" : "Warm Horizon"}</span>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]">
            {theme}
          </span>
        </button>

        {/* Live WebSocket Status Indicator */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-base)] backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-[var(--text-primary)] font-semibold leading-none truncate uppercase font-display tracking-wider">Engine Online</div>
            <div className="text-[9px] text-[var(--text-tertiary)] font-mono leading-none mt-1 truncate">wss://socket.lexscan</div>
          </div>
          <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-pulse" />
        </div>
      </div>
    </aside>
  );
}
