"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api, HealthStatus } from "@/lib/api";

export default function Header() {
  const pathname = usePathname();
  const [health, setHealth] = useState<HealthStatus>({ status: "offline" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkSystemHealth() {
      try {
        const status = await api.getHealth();
        if (active) {
          setHealth(status);
          setLoading(false);
        }
      } catch {
        if (active) {
          setHealth({ status: "offline" });
          setLoading(false);
        }
      }
    }

    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 5000); // Poll every 5 seconds

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and Brand */}
        <div className="flex items-center gap-6">
          <Link 
            href="/" 
            className="flex items-center gap-2 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
          >
            <span className="text-xl font-bold tracking-tight text-primary flex items-center gap-1.5">
              ⚽ StadiumOS <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">Co-Pilot</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/command-center"
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === "/command-center"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              Control Room
            </Link>
            <Link
              href="/ground-crew"
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === "/ground-crew"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              Ground Crew
            </Link>
            <Link
              href="/fan"
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === "/fan"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              Fan Portal
            </Link>
          </nav>
        </div>

        {/* System Health Status Indicator */}
        <div className="flex items-center gap-4">
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-semibold"
            aria-live="polite"
          >
            <span className="relative flex h-2 w-2">
              <span 
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  loading 
                    ? "bg-amber-400" 
                    : health.status === "ok" 
                      ? "bg-emerald-500" 
                      : "bg-rose-500"
                }`}
              />
              <span 
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  loading 
                    ? "bg-amber-500" 
                    : health.status === "ok" 
                      ? "bg-emerald-600" 
                      : "bg-rose-600"
                }`}
              />
            </span>
            <span>
              {loading 
                ? "Connecting..." 
                : health.status === "ok" 
                  ? "System Connected" 
                  : "System Offline"}
            </span>
          </div>
          
          {/* Mobile navigation toggle fallback (link list) */}
          <div className="flex md:hidden gap-2">
            <Link 
              href="/command-center" 
              className="text-xs font-semibold px-2.5 py-1.5 rounded border border-border bg-muted text-foreground"
            >
              Control
            </Link>
            <Link 
              href="/ground-crew" 
              className="text-xs font-semibold px-2.5 py-1.5 rounded border border-border bg-muted text-foreground"
            >
              Crew
            </Link>
            <Link 
              href="/fan" 
              className="text-xs font-semibold px-2.5 py-1.5 rounded border border-border bg-muted text-foreground"
            >
              Fan
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
