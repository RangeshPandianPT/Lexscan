"use client";

import { useState } from "react";
import { Bell, Search, RefreshCw } from "lucide-react";

interface HeaderProps {
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function Header({ title, breadcrumbs }: HeaderProps) {
  const [hasNotifications] = useState(true);

  return (
    <header className="app-header px-7 flex items-center justify-between gap-4">
      {/* Left: Title + Breadcrumbs */}
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="opacity-40">/</span>}
                <span className={i === breadcrumbs.length - 1 ? "text-slate-600 font-medium" : "hover:text-slate-600 cursor-pointer transition-colors"}>
                  {crumb.label}
                </span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-[17px] font-bold text-slate-900 leading-tight tracking-tight">
          {title}
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-8 pr-3 py-1.5 text-[12.5px] border border-slate-200 rounded-lg bg-slate-50 text-slate-700 outline-none focus:border-indigo-400 focus:bg-white transition-all w-44 focus:w-56"
          />
        </div>

        {/* Refresh */}
        <button className="btn btn-secondary btn-sm">
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        {/* Notifications */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
          <Bell className="w-4 h-4 text-slate-600" />
          {hasNotifications && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          )}
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold select-none cursor-pointer">
          OF
        </div>
      </div>
    </header>
  );
}
