"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  Map,
  Users,
  Settings,
  ScanLine,
  Zap,
  ChevronRight,
} from "lucide-react";

const navItems = [
  {
    group: "Analytics",
    items: [
      { href: "/", label: "Overview", icon: LayoutDashboard },
      { href: "/violations", label: "Violations", icon: ShieldAlert },
      { href: "/geo", label: "Geo Heatmap", icon: Map },
      { href: "/sellers", label: "Seller Analytics", icon: Users },
    ],
  },
  {
    group: "Admin",
    items: [
      { href: "/admin", label: "Rule Studio", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center flex-shrink-0">
          <ScanLine className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <div className="text-white font-bold text-[15px] leading-tight tracking-tight">
            LexScan
          </div>
          <div className="text-slate-500 text-[10px] font-medium uppercase tracking-widest leading-tight">
            Compliance Intelligence
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navItems.map((section) => (
          <div key={section.group}>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 px-2 mb-1.5">
              {section.group}
            </div>
            {section.items.map(({ href, label, icon: Icon }) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`nav-item ${isActive ? "active" : ""}`}
                >
                  <Icon className="nav-icon w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Live indicator */}
      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.04]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <div>
            <div className="text-xs text-slate-300 font-medium">Live feed active</div>
            <div className="text-[10px] text-slate-500">ws://localhost:8000</div>
          </div>
          <Zap className="w-3.5 h-3.5 text-yellow-500 ml-auto" />
        </div>
      </div>
    </aside>
  );
}
