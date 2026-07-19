"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] gap-8">
      {/* Title block */}
      <div className="text-center max-w-2xl space-y-4">
        <Badge variant="outline" className="px-3 py-1 text-sm bg-primary/10 border-primary/20 text-primary">
          🏆 GenAI hackathon - Challenge 4
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          Stadium AI <span className="text-primary">Co-Pilot</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          A unified GenAI-driven stadium command and operations system. Triages emergency incidents, suggests routing to fans in real-time, and coordinates field crews under one shared backend reasoning layer.
        </p>
      </div>

      {/* Grid of entry portals */}
      <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl mt-4">
        {/* Command Center */}
        <Link href="/command-center" className="group">
          <Card className="h-full border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md cursor-pointer relative overflow-hidden bg-card hover:bg-primary/[0.01]">
            <CardHeader className="space-y-2">
              <div className="text-3xl">📡</div>
              <CardTitle className="group-hover:text-primary transition-colors flex items-center gap-2">
                Control Room 
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">Command</span>
              </CardTitle>
              <CardDescription>
                High-level operational overview for controllers and operators.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc list-inside space-y-2">
                <li>Live crowd density stand map</li>
                <li>Gate security wait times</li>
                <li>One-click event simulations</li>
                <li>Staff assignment & dispatch</li>
                <li>Trilingual PA script writer</li>
              </ul>
            </CardContent>
          </Card>
        </Link>

        {/* Ground Crew */}
        <Link href="/ground-crew" className="group">
          <Card className="h-full border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md cursor-pointer relative overflow-hidden bg-card hover:bg-primary/[0.01]">
            <CardHeader className="space-y-2">
              <div className="text-3xl">🦺</div>
              <CardTitle className="group-hover:text-primary transition-colors flex items-center gap-2">
                Ground Crew
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-secondary-foreground/10 text-secondary-foreground">Field</span>
              </CardTitle>
              <CardDescription>
                Mobile-optimized workspace for volunteers, security, and ushers.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc list-inside space-y-2">
                <li>Zone assignments & checklist</li>
                <li>Fast incident reporting form</li>
                <li>Localized AI procedure support</li>
                <li>Real-time task dispatch updates</li>
              </ul>
            </CardContent>
          </Card>
        </Link>

        {/* Fan Portal */}
        <Link href="/fan" className="group">
          <Card className="h-full border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md cursor-pointer relative overflow-hidden bg-card hover:bg-primary/[0.01]">
            <CardHeader className="space-y-2">
              <div className="text-3xl">🎫</div>
              <CardTitle className="group-hover:text-primary transition-colors flex items-center gap-2">
                Fan Portal
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600">Public</span>
              </CardTitle>
              <CardDescription>
                Public interface assisting fans with wayfinding and gate flow.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc list-inside space-y-2">
                <li>Real-time gate traffic stats</li>
                <li>Dynamic entrance route advice</li>
                <li>Multilingual assistant chat</li>
                <li>Stand congestion alerts</li>
              </ul>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
