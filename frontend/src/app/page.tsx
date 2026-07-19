"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Radio, HardHat, Ticket, ArrowRight, Zap, Shield, Globe } from "lucide-react";

// ── Inline SVG pitch background (WCAG AA safe: light green on white) ──────────
const PITCH_BG_SVG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='600' height='400' fill='%23f0fdf4'/><rect x='100' y='60' width='400' height='280' fill='none' stroke='%2386efac' stroke-width='2' rx='8'/><line x1='300' y1='60' x2='300' y2='340' stroke='%2386efac' stroke-width='1.5'/><circle cx='300' cy='200' r='55' fill='none' stroke='%2386efac' stroke-width='1.5'/><circle cx='300' cy='200' r='4' fill='%2386efac'/><rect x='100' y='135' width='80' height='130' fill='none' stroke='%2386efac' stroke-width='1.5'/><rect x='100' y='160' width='40' height='80' fill='none' stroke='%2386efac' stroke-width='1.5'/><rect x='420' y='135' width='80' height='130' fill='none' stroke='%2386efac' stroke-width='1.5'/><rect x='460' y='160' width='40' height='80' fill='none' stroke='%2386efac' stroke-width='1.5'/></svg>`;

const roleCards = [
  {
    href: "/command-center",
    icon: Radio,
    title: "Control Room",
    badge: "Command",
    badgeColor: "bg-primary/10 text-primary",
    description: "High-level operations overview for supervisors and operators.",
    features: [
      { icon: Zap, text: "Live crowd density map" },
      { icon: Shield, text: "AI incident triage & dispatch" },
      { icon: Globe, text: "Trilingual PA announcements" },
    ],
    accentColor: "group-hover:border-primary/60 group-hover:shadow-primary/10",
    iconBg: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
  },
  {
    href: "/ground-crew",
    icon: HardHat,
    title: "Ground Crew",
    badge: "Field",
    badgeColor: "bg-amber-500/10 text-amber-700",
    description: "Mobile-optimized workspace for volunteers, security, and ushers.",
    features: [
      { icon: Zap, text: "Zone assignments & checklists" },
      { icon: Shield, text: "Fast incident reporting" },
      { icon: Globe, text: "Local AI procedure support" },
    ],
    accentColor: "group-hover:border-amber-500/60 group-hover:shadow-amber-500/10",
    iconBg: "bg-amber-500/10 text-amber-700 group-hover:bg-amber-500 group-hover:text-white",
  },
  {
    href: "/fan",
    icon: Ticket,
    title: "Fan Portal",
    badge: "Public",
    badgeColor: "bg-blue-500/10 text-blue-600",
    description: "Real-time wayfinding and gate routing for stadium fans.",
    features: [
      { icon: Zap, text: "Live gate wait times" },
      { icon: Shield, text: "Dynamic entrance advice" },
      { icon: Globe, text: "Multilingual chat assistant" },
    ],
    accentColor: "group-hover:border-blue-500/60 group-hover:shadow-blue-500/10",
    iconBg: "bg-blue-500/10 text-blue-600 group-hover:bg-blue-500 group-hover:text-white",
  },
];

export default function Home() {
  return (
    <div
      className="min-h-[80vh] flex flex-col items-center justify-center"
      style={{
        backgroundImage: `url("${PITCH_BG_SVG}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* ── Hero Section ─────────────────────────────────────── */}
      <div className="text-center max-w-3xl px-4 pt-12 pb-10 space-y-5">
        <Badge
          variant="outline"
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold bg-white/80 border-primary/30 text-primary backdrop-blur-sm shadow-sm"
        >
          ⚽ Stadium Operations Command System
        </Badge>

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
          Stadium AI{" "}
          <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
            Co&#8209;Pilot
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          A unified GenAI-driven operations platform bridging the{" "}
          <strong className="text-slate-800">Control Room</strong>,{" "}
          <strong className="text-slate-800">Ground Crew</strong>, and{" "}
          <strong className="text-slate-800">Fans</strong> — with real-time crowd management,
          multilingual wayfinding, and AI-powered incident triage.
        </p>
      </div>

      {/* ── Role Cards ───────────────────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl px-4 pb-16">
        {roleCards.map(card => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href} className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl">
              <div
                className={`h-full flex flex-col p-7 rounded-2xl border-2 border-border bg-white/90 backdrop-blur-sm shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${card.accentColor} cursor-pointer`}
              >
                {/* Icon + badge row */}
                <div className="flex items-start justify-between mb-5">
                  <div className={`p-3 rounded-xl transition-colors duration-200 ${card.iconBg}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <Badge className={`text-xs font-semibold ${card.badgeColor} border-0`}>
                    {card.badge}
                  </Badge>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-slate-900 mb-1.5 group-hover:text-primary transition-colors">
                  {card.title}
                </h2>

                {/* Description */}
                <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                  {card.description}
                </p>

                {/* Feature pills */}
                <div className="space-y-2 flex-1">
                  {card.features.map((f, i) => {
                    const FIcon = f.icon;
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <FIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                        {f.text}
                      </div>
                    );
                  })}
                </div>

                {/* CTA */}
                <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
                  Enter portal
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
