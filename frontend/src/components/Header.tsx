"use client";

import { useState } from "react";
import { Bell, Search, RefreshCw, Command } from "lucide-react";
import { CommandPalette } from "./CommandPalette";

interface HeaderProps {
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function Header({ title, breadcrumbs }: HeaderProps) {
  const [hasNotifications] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  return (
    <>
      <header className="app-header px-8 flex items-center justify-between gap-4 select-none">
        {/* Left: Title + Breadcrumbs */}
        <div>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] mb-0.5 font-medium font-mono uppercase tracking-widest">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="opacity-30">/</span>}
                  <span className={i === breadcrumbs.length - 1 ? "text-[var(--text-secondary)] font-bold" : "hover:text-[var(--color-primary)] cursor-pointer transition-colors"}>
                    {crumb.label}
                  </span>
                </span>
              ))}
            </nav>
          )}
          <h1 className="text-xl font-display font-extrabold text-[var(--text-primary)] leading-tight tracking-tight">
            {title}
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Search Trigger */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-3 px-3.5 py-1.5 text-xs rounded-xl border border-[var(--border-base)] bg-[var(--bg-surface)] hover:border-[var(--border-highlight)] text-[var(--text-tertiary)] transition-all shadow-sm group"
          >
            <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:text-teal-400 transition-colors" />
            <span className="hidden md:inline font-mono text-[var(--text-secondary)]">Search command center...</span>
            <span className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-tertiary)]">
              <Command className="w-2.5 h-2.5" /> K
            </span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => window.location.reload()}
            className="btn btn-secondary btn-sm rounded-xl"
            title="Refresh Data"
          >
            <RefreshCw className="w-3.5 h-3.5 transition-transform hover:rotate-180 duration-500" />
            <span className="hidden sm:inline font-mono uppercase tracking-wider">Sync</span>
          </button>

          {/* Notifications Bell */}
          <button className="relative p-2 rounded-xl border border-[var(--border-base)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] hover:border-[var(--border-highlight)] transition-all">
            <Bell className="w-4 h-4 text-[var(--text-secondary)]" />
            {hasNotifications && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </button>

          {/* User Profile Badge */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 via-amber-500 to-rose-500 p-[1px] shadow-glow cursor-pointer hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-[11px] bg-[var(--bg-surface)] flex items-center justify-center text-[var(--text-primary)] text-xs font-mono font-bold select-none">
              OP
            </div>
          </div>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </>
  );
}
