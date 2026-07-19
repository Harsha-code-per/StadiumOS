"use client";

import { useEffect, useState } from "react";
import { api, DashboardData, Gate, Zone } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Ticket, AlertTriangle, Compass } from "lucide-react";
import ChatWidget from "@/components/ChatWidget";

export default function FanPortal() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [selectedStandId, setSelectedStandId] = useState<string>("stand_b"); // default Stand B
  const [activeStand, setActiveStand] = useState<Zone | null>(null);

  const loadData = async () => {
    try {
      const res = await api.getDashboard();
      setDashboard(res);
      const stand = res.zones.find(z => z.id === selectedStandId);
      if (stand) setActiveStand(stand);
    } catch {
      // fail silently — dashboard data updates on next poll
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000); // Poll every 4 seconds to sync gate queues
    return () => clearInterval(interval);
  }, [selectedStandId]);

  // Logic to calculate best gate for a selected stand
  const getBestGateForStand = () => {
    if (!dashboard || !activeStand) return null;
    
    const associatedGates = dashboard.gates.filter(g => activeStand.gates.includes(g.id));
    const openGates = associatedGates.filter(g => g.status === "Open" || g.status === "Congested");
    
    if (openGates.length === 0) return null;
    
    // Sort by wait time
    openGates.sort((a, b) => a.wait_time - b.wait_time);
    return openGates[0];
  };

  const bestGate = getBestGateForStand();

  return (
    <div className="w-full max-w-[96%] mx-auto space-y-6">
      
      {/* Banner */}
      <div className="text-center space-y-2 py-4">
        <Badge variant="outline" className="px-3 py-1 bg-green-500/10 border-green-500/20 text-green-700 font-bold flex items-center justify-center gap-1.5 w-fit mx-auto">
          <Zap className="h-3.5 w-3.5" /> Live Traffic & Wayfinding Support
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center justify-center gap-2">
          <Compass className="h-6 w-6 text-primary animate-spin-slow" /> Fan AI Wayfinding Center
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Avoid long ticket queues. Consult live gate statuses, check crowd densities, and get instant dynamic directions in English, Spanish, or French.
        </p>
      </div>

      {/* Main content grid */}
      <div className="grid md:grid-cols-12 gap-6">
        
        {/* Left Side: Gate Queue Wait Times (6 cols) */}
        <div className="md:col-span-6 space-y-6">
          
          {/* Traffic dashboard */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base font-bold flex items-center gap-1.5"><Ticket className="h-5 w-5 text-primary" /> Live Gate Wait Times</CardTitle>
              <CardDescription className="text-xs">
                Turnstile queue updates synced directly from security lanes.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 pb-4">
              {dashboard?.gates.map(gate => (
                <div 
                  key={gate.id} 
                  className="p-3 rounded border border-border bg-card flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-foreground">{gate.name}</span>
                    <span className={`h-2.5 w-2.5 rounded-full ${
                      gate.status === "Open" 
                        ? "bg-emerald-500" 
                        : gate.status === "Congested" 
                          ? "bg-amber-500" 
                          : "bg-rose-500"
                    }`} />
                  </div>
                  <div className="mt-1">
                    <span className="text-lg font-bold text-foreground">{gate.wait_time}m</span>
                    <span className="text-[10px] text-muted-foreground block">wait time</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-muted-foreground font-semibold mt-2.5 border-t border-border/50 pt-1.5">
                    <span>{gate.status}</span>
                    <span>{gate.security_lanes_active}/{gate.security_lanes_total} Lanes</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Interactive wayfinder tool (6 cols) */}
        <div className="md:col-span-6 space-y-6">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base font-bold">🗺️ Dynamic Wayfinding Helper</CardTitle>
              <CardDescription className="text-xs">
                Select your seating stand to discover the fastest entrance/exit gate right now.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Select Stand Zone</label>
                <Select 
                  value={selectedStandId} 
                  onValueChange={val => {
                    setSelectedStandId(val || "");
                  }}
                >
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dashboard?.zones.map(z => (
                      <SelectItem key={z.id} value={z.id} className="text-xs">
                        {z.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeStand && (
                <div className="p-4 rounded border border-border bg-muted/20 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground">Stand Crowd Level:</span>
                    <Badge 
                      className={
                        activeStand.density === "Critical" 
                          ? "bg-rose-600 text-white font-bold" 
                          : activeStand.density === "High" 
                            ? "bg-amber-600 text-white font-semibold" 
                            : activeStand.density === "Medium" 
                              ? "bg-yellow-500 text-foreground font-medium" 
                              : "bg-emerald-600 text-white"
                      }
                    >
                      {activeStand.density} Density
                    </Badge>
                  </div>

                  <div className="border-t border-border/60 my-2 pt-2.5">
                    <span className="text-xs font-bold text-muted-foreground block mb-2">Nearest Associated Gates:</span>
                    <div className="space-y-2">
                      {dashboard?.gates.filter(g => activeStand.gates.includes(g.id)).map(gate => (
                        <div key={gate.id} className="flex justify-between items-center text-xs">
                          <span className="font-semibold">{gate.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Queue: {gate.wait_time} min</span>
                            <Badge 
                              variant="outline"
                              className={
                                gate.status === "Open" 
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                                  : gate.status === "Congested" 
                                    ? "bg-amber-50 border-amber-200 text-amber-800" 
                                    : "bg-rose-50 border-rose-200 text-rose-800"
                              }
                            >
                              {gate.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {bestGate ? (
                    <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs">
                      <span className="block font-bold text-emerald-800 uppercase text-[9px] mb-1">💡 Real-Time Recommendation</span>
                      <p className="font-semibold">
                        Enter / exit through <span className="underline">{bestGate.name}</span>.
                      </p>
                      <p className="mt-1 text-emerald-900">
                        It is currently open and has the lowest wait time ({bestGate.wait_time} mins) of all gates serving your stand.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-950 text-xs">
                      <span className="font-bold text-rose-800 uppercase text-[9px] mb-1 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Alert</span>
                      All gates serving this stand are currently closed. Please contact the nearest usher or supervisor.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>

      {/* Floating AI Fan Assistant Chat */}
      <ChatWidget
        role="fan"
        placeholder="Ask a wayfinding question..."
        suggestions={[
          { label: "🚪 Exit from Stand B?", query: "I am seated in Stand B. Which gate is less congested to exit right now?" },
          { label: "🎫 Fastest Entry Gate?", query: "Which gate has the fastest entry wait time at this moment?" },
          { label: "🇲🇽 ¿Puertas lentas? (ES)", query: "¿Hay alguna puerta congestionada actualmente y qué opciones tengo?" },
        ]}
      />
    </div>
  );
}
