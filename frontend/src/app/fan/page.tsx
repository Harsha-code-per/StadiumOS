"use client";

import { useEffect, useState } from "react";
import { api, DashboardData, Gate, Zone } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FanPortal() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [selectedStandId, setSelectedStandId] = useState<string>("stand_b"); // default Stand B
  const [activeStand, setActiveStand] = useState<Zone | null>(null);

  // Chat States
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState<{ sender: "user" | "copilot"; text: string }[]>([
    { sender: "copilot", text: "Welcome! I am your AI Stadium Assistant. I have live access to crowd levels and gate traffic. Ask me for the fastest routes or closest gates." }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const loadData = async () => {
    try {
      const res = await api.getDashboard();
      setDashboard(res);
      const stand = res.zones.find(z => z.id === selectedStandId);
      if (stand) setActiveStand(stand);
    } catch (err) {
      console.error("Failed to load fan dashboard", err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000); // Poll every 4 seconds to sync gate queues
    return () => clearInterval(interval);
  }, [selectedStandId]);

  const handleSendChat = async (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    setChatLog(prev => [...prev, { sender: "user", text }]);
    if (!textToSend) setChatInput("");
    setChatLoading(true);

    try {
      const res = await api.copilotChat("fan", text);
      setChatLog(prev => [...prev, { sender: "copilot", text: res.answer }]);
    } catch (err: any) {
      setChatLog(prev => [...prev, { sender: "copilot", text: `Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

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
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Banner */}
      <div className="text-center space-y-2 py-4">
        <Badge variant="outline" className="px-3 py-1 bg-green-500/10 border-green-500/20 text-green-700 font-bold">
          ⚡ Live Traffic & Wayfinding Support
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          🛈 Fan AI Wayfinding Center
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Avoid long ticket queues. Consult live gate statuses, check crowd densities, and get instant dynamic directions in English, Spanish, or French.
        </p>
      </div>

      {/* Main content grid */}
      <div className="grid md:grid-cols-12 gap-6">
        
        {/* Left Side: Gate Queue Wait Times & Wayfinding selector (7 cols) */}
        <div className="md:col-span-7 space-y-6">
          
          {/* Traffic dashboard */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base font-bold">🎫 Live Gate Wait Times</CardTitle>
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

          {/* Interactive wayfinder tool */}
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
                      <span className="block font-bold text-rose-800 uppercase text-[9px] mb-1">🚨 Alert</span>
                      All gates serving this stand are currently closed. Please contact the nearest usher or supervisor.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Side: Chat Assistant (5 cols) */}
        <div className="md:col-span-5">
          <Card className="h-[530px] flex flex-col">
            <CardHeader className="py-4">
              <CardTitle className="text-base font-bold">🤖 Multilingual Fan Assistant</CardTitle>
              <CardDescription className="text-xs">
                Ask wayfinding questions in English, Spanish, or French.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto px-4 py-0 space-y-2.5">
              {chatLog.map((chat, idx) => (
                <div 
                  key={idx} 
                  className={`p-2.5 rounded text-xs leading-relaxed max-w-[90%] ${
                    chat.sender === "user" 
                      ? "bg-primary text-white ml-auto" 
                      : "bg-muted text-foreground mr-auto"
                  }`}
                >
                  <p>{chat.text}</p>
                </div>
              ))}
              {chatLoading && (
                <div className="bg-muted text-muted-foreground mr-auto p-2.5 rounded text-xs italic animate-pulse">
                  Assistant checking live traffic data...
                </div>
              )}
            </CardContent>

            {/* Quick Prompts */}
            <div className="px-4 py-1.5 border-t border-border bg-muted/20 flex flex-wrap gap-1">
              <button 
                onClick={() => handleSendChat("I am seated in Stand B. Which gate is less congested to exit right now?")}
                className="text-[9px] px-2 py-0.5 border border-border bg-background hover:bg-muted text-muted-foreground font-semibold rounded text-left"
              >
                🚪 Exit from Stand B?
              </button>
              <button 
                onClick={() => handleSendChat("Which gate has the fastest entry wait time at this moment?")}
                className="text-[9px] px-2 py-0.5 border border-border bg-background hover:bg-muted text-muted-foreground font-semibold rounded text-left"
              >
                🎫 Fastest Entry Gate?
              </button>
              <button 
                onClick={() => handleSendChat("¿Hay alguna puerta congestionada actualmente y qué opciones tengo?")}
                className="text-[9px] px-2 py-0.5 border border-border bg-background hover:bg-muted text-muted-foreground font-semibold rounded text-left"
              >
                🇲🇽 ¿Puertas lentas? (ES)
              </button>
            </div>

            <CardFooter className="p-3 border-t border-border bg-card">
              <form 
                onSubmit={e => {
                  e.preventDefault();
                  handleSendChat();
                }} 
                className="flex w-full items-center gap-2"
              >
                <Input
                  placeholder="Ask a wayfinding question..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  disabled={chatLoading}
                  className="h-8 text-xs bg-background"
                />
                <Button type="submit" size="sm" disabled={chatLoading} className="h-8 px-3 text-xs bg-primary hover:bg-primary/95 text-white">
                  Send
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>

      </div>
    </div>
  );
}
