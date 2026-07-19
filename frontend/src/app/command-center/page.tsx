"use client";

import { useEffect, useState, useRef } from "react";
import { api, DashboardData, Incident, Gate, Staff, Zone } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Radio, HardHat, Zap, AlertTriangle, Bot, Users, HeartPulse, Crown, Info } from "lucide-react";
import ChatWidget from "@/components/ChatWidget";

export default function CommandCenter() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Simulation and Action loadings
  const [simulating, setSimulating] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [announcements, setAnnouncements] = useState<{ en: string; es: string; fr: string } | null>(null);
  
  // ARIA Live region announcements
  const [ariaAnnouncement, setAriaAnnouncement] = useState("");
  const prevIncidentCount = useRef<number>(0);



  // Gate editor states
  const [editingGateId, setEditingGateId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editWaitTime, setEditWaitTime] = useState<number>(0);

  // Fetch Dashboard State
  const fetchDashboard = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.getDashboard();
      setData(res);
      setError(null);

      // Handle ARIA Live Region announcements for new incidents
      const currentCount = res.incidents.filter(i => i.status !== "Resolved").length;
      if (currentCount > prevIncidentCount.current && prevIncidentCount.current > 0) {
        const latestInc = res.incidents[res.incidents.length - 1];
        setAriaAnnouncement(`NEW ALIGNMENT ALERT: ${latestInc.severity} severity ${latestInc.category} incident reported at ${latestInc.location}. Description: ${latestInc.description}`);
      }
      prevIncidentCount.current = currentCount;

      // Keep selected incident reference updated with fresh data
      if (selectedIncident) {
        const freshInc = res.incidents.find(i => i.id === selectedIncident.id);
        if (freshInc) setSelectedIncident(freshInc);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(() => fetchDashboard(true), 4000); // Auto refresh every 4 seconds
    return () => clearInterval(interval);
  }, [selectedIncident]);

  // Simulation handler
  const handleSimulate = async (type: "crowd_surge" | "medical" | "outage" | "vip_arrival") => {
    setSimulating(type);
    setAnnouncements(null);
    try {
      const res = await api.simulateEvent(type);
      await fetchDashboard(true);
      // Select the newly simulated incident
      if (res.incident) {
        setSelectedIncident(res.incident);
      }
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(null);
    }
  };

  // Reset handler
  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset all stadium mock data?")) return;
    setLoading(true);
    setAnnouncements(null);
    setSelectedIncident(null);
    try {
      await api.resetData();
      await fetchDashboard(false);
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // AI Dispatch Recommendation confirmation
  const handleConfirmDispatch = async () => {
    if (!selectedIncident) return;
    const staffId = selectedIncident.recommended_staff_id;
    if (!staffId) {
      alert("No recommended staff member suggested by AI Classifier.");
      return;
    }

    setDispatching(true);
    try {
      await api.dispatchStaff(selectedIncident.id, [staffId]);
      await fetchDashboard(true);
    } catch (err: any) {
      alert(`Dispatch failed: ${err.message}`);
    } finally {
      setDispatching(false);
    }
  };

  // Resolve incident
  const handleResolveIncident = async () => {
    if (!selectedIncident) return;
    setResolving(true);
    try {
      await api.resolveIncident(selectedIncident.id);
      setAnnouncements(null);
      await fetchDashboard(true);
    } catch (err: any) {
      alert(`Resolution failed: ${err.message}`);
    } finally {
      setResolving(false);
    }
  };

  // Draft PA announcement
  const handleDraftAnnouncement = async () => {
    if (!selectedIncident) return;
    setDrafting(true);
    setAnnouncements(null);
    try {
      const scripts = await api.generatePAAnnouncement(selectedIncident.id);
      setAnnouncements(scripts);
    } catch (err: any) {
      alert(`Announcement generation failed: ${err.message}`);
    } finally {
      setDrafting(false);
    }
  };



  // Edit Gate parameters
  const handleUpdateGate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGateId) return;

    try {
      await api.updateGate(editingGateId, editStatus, undefined, editWaitTime, undefined);
      setEditingGateId(null);
      await fetchDashboard(true);
    } catch (err: any) {
      alert(`Failed to update gate: ${err.message}`);
    }
  };

  // Colors helpers for severities
  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "Critical":
        return <Badge className="bg-rose-600 hover:bg-rose-700 text-white font-bold">Critical</Badge>;
      case "High":
        return <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-semibold">High</Badge>;
      case "Medium":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-foreground font-medium">Medium</Badge>;
      default:
        return <Badge className="bg-slate-200 hover:bg-slate-300 text-slate-800">Low</Badge>;
    }
  };

  // Colors helpers for crowd densities
  const getDensityColor = (density: string) => {
    switch (density) {
      case "Critical":
        return "fill-rose-500 stroke-rose-700 animate-pulse";
      case "High":
        return "fill-amber-500 stroke-amber-700";
      case "Medium":
        return "fill-yellow-400 stroke-yellow-600";
      default:
        return "fill-emerald-200 stroke-emerald-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Screen-reader-only ARIA Live Region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {ariaAnnouncement}
      </div>

      {/* Top Banner Simulation Console */}
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardHeader className="py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" /> Scenario Simulation Engine
              </CardTitle>
              <CardDescription className="text-xs">
                Mutate stadium settings to trigger real-time AI classifications, dispatches, and wayfinding.
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={handleReset} 
              className="text-xs font-semibold border-destructive/20 text-destructive hover:bg-destructive/10"
            >
              🔄 Reset Stadium System
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-4 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button
              onClick={() => handleSimulate("crowd_surge")}
              disabled={simulating !== null}
              className="text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 flex items-center justify-center gap-1.5"
            >
              <Users className="h-3.5 w-3.5" />
              {simulating === "crowd_surge" ? "Simulating..." : "Surge Stand B"}
            </Button>
            <Button
              onClick={() => handleSimulate("medical")}
              disabled={simulating !== null}
              className="text-xs font-medium bg-rose-600 text-white hover:bg-rose-700 flex items-center justify-center gap-1.5"
            >
              <HeartPulse className="h-3.5 w-3.5" />
              {simulating === "medical" ? "Simulating..." : "Medical Gate 4"}
            </Button>
            <Button
              onClick={() => handleSimulate("outage")}
              disabled={simulating !== null}
              className="text-xs font-medium bg-rose-600 text-white hover:bg-rose-700 flex items-center justify-center gap-1.5"
            >
              <Zap className="h-3.5 w-3.5" />
              {simulating === "outage" ? "Simulating..." : "Outage Stand D"}
            </Button>
            <Button
              onClick={() => handleSimulate("vip_arrival")}
              disabled={simulating !== null}
              className="text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-1.5"
            >
              <Crown className="h-3.5 w-3.5" />
              {simulating === "vip_arrival" ? "Simulating..." : "VIP Gate 1"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Large Visual SVG map representation at the top */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">🏟️ Real-Time Stadium Layout</CardTitle>
          <CardDescription className="text-xs">
            Visualizing stand crowd densities and gate wait statuses.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center bg-muted/20 py-6 relative">
          {data ? (
            <div className="w-full max-w-3xl mx-auto">
              <svg viewBox="-20 -10 560 390" className="w-full h-auto">
                {/* Pitch markings */}
                <rect x="150" y="100" width="200" height="150" fill="#a7f3d0" stroke="#10b981" strokeWidth="2" rx="4" />
                <line x1="250" y1="100" x2="250" y2="250" stroke="#10b981" strokeWidth="2" />
                <circle cx="250" cy="175" r="30" fill="none" stroke="#10b981" strokeWidth="2" />
                
                {/* Stand A (North) */}
                <path
                  d="M 120 70 A 180 180 0 0 1 380 70 L 360 90 A 150 150 0 0 0 140 90 Z"
                  className={`${getDensityColor(
                    data.zones.find(z => z.id === "stand_a")?.density || "Low"
                  )} stroke-2`}
                />
                <text x="250" y="-2" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e293b">
                  Stand A — {data.zones.find(z => z.id === "stand_a")?.density}
                </text>

                {/* Stand B (East) */}
                <path
                  d="M 390 80 A 180 180 0 0 1 390 270 L 370 250 A 150 150 0 0 0 370 100 Z"
                  className={`${getDensityColor(
                    data.zones.find(z => z.id === "stand_b")?.density || "Low"
                  )} stroke-2`}
                />
                <text x="497" y="175" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e293b" transform="rotate(90 497 175)">
                  Stand B — {data.zones.find(z => z.id === "stand_b")?.density}
                </text>

                {/* Stand C (South) */}
                <path
                  d="M 380 280 A 180 180 0 0 1 120 280 L 140 260 A 150 150 0 0 0 360 260 Z"
                  className={`${getDensityColor(
                    data.zones.find(z => z.id === "stand_c")?.density || "Low"
                  )} stroke-2`}
                />
                <text x="250" y="363" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e293b">
                  Stand C — {data.zones.find(z => z.id === "stand_c")?.density}
                </text>

                {/* Stand D (West) */}
                <path
                  d="M 110 270 A 180 180 0 0 1 110 80 L 130 100 A 150 150 0 0 0 130 250 Z"
                  className={`${getDensityColor(
                    data.zones.find(z => z.id === "stand_d")?.density || "Low"
                  )} stroke-2`}
                />
                <text x="-8" y="175" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e293b" transform="rotate(-90 -8 175)">
                  Stand D — {data.zones.find(z => z.id === "stand_d")?.density}
                </text>

                {/* Stand E (Club/VIP Center) */}
                <rect
                  x="160" y="110" width="80" height="40"
                  className={`${getDensityColor(
                    data.zones.find(z => z.id === "stand_e")?.density || "Low"
                  )} stroke-2 opacity-80`}
                />
                <text x="200" y="130" textAnchor="middle" className="text-[8px] font-semibold fill-foreground">
                  Stand E (VIP)
                </text>

                {/* Stand F (Upper Concourse Center) */}
                <rect
                  x="260" y="200" width="80" height="40"
                  className={`${getDensityColor(
                    data.zones.find(z => z.id === "stand_f")?.density || "Low"
                  )} stroke-2 opacity-80`}
                />
                <text x="300" y="220" textAnchor="middle" className="text-[8px] font-semibold fill-foreground">
                  Stand F (Upper)
                </text>

                {/* Gates markers as outer circles */}
                {/* Gate 1 VIP */}
                <circle cx="100" cy="50" r="12" fill={data.gates.find(g => g.id === "gate_1")?.status === "Open" ? "#10b981" : "#ef4444"} stroke="#fff" strokeWidth="2" />
                <text x="100" y="53" textAnchor="middle" className="text-[8px] font-bold fill-white">G1</text>

                {/* Gate 2 */}
                <circle cx="400" cy="50" r="12" fill={data.gates.find(g => g.id === "gate_2")?.status === "Open" ? "#10b981" : data.gates.find(g => g.id === "gate_2")?.status === "Congested" ? "#f59e0b" : "#ef4444"} stroke="#fff" strokeWidth="2" />
                <text x="400" y="53" textAnchor="middle" className="text-[8px] font-bold fill-white">G2</text>

                {/* Gate 3 */}
                <circle cx="430" cy="290" r="12" fill={data.gates.find(g => g.id === "gate_3")?.status === "Open" ? "#10b981" : "#ef4444"} stroke="#fff" strokeWidth="2" />
                <text x="430" y="293" textAnchor="middle" className="text-[8px] font-bold fill-white">G3</text>

                {/* Gate 4 */}
                <circle cx="250" cy="335" r="12" fill={data.gates.find(g => g.id === "gate_4")?.status === "Open" ? "#10b981" : "#ef4444"} stroke="#fff" strokeWidth="2" />
                <text x="250" y="338" textAnchor="middle" className="text-[8px] font-bold fill-white">G4</text>

                {/* Gate 5 */}
                <circle cx="70" cy="290" r="12" fill={data.gates.find(g => g.id === "gate_5")?.status === "Open" ? "#10b981" : "#ef4444"} stroke="#fff" strokeWidth="2" />
                <text x="70" y="293" textAnchor="middle" className="text-[8px] font-bold fill-white">G5</text>

                {/* Gate 6 */}
                <circle cx="250" cy="15" r="12" fill={data.gates.find(g => g.id === "gate_6")?.status === "Open" ? "#10b981" : "#ef4444"} stroke="#fff" strokeWidth="2" />
                <text x="250" y="18" textAnchor="middle" className="text-[8px] font-bold fill-white">G6</text>
              </svg>
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground mt-2 border-t pt-2">
                <Info className="h-3.5 w-3.5 text-primary" />
                <span>Stand E (VIP) and Stand F (Upper) are elevated premium boxes.</span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-muted-foreground">Connecting layout database...</div>
          )}
        </CardContent>
      </Card>

      {/* Main Grid below the Layout Map */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Side: Live Incident Desk (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Incident Feed */}
          <Card className="min-h-[465px] flex flex-col border-l-[4px] border-l-primary shadow-md">
            <CardHeader className="py-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-1.5"><AlertTriangle className="h-5 w-5 text-primary" /> Live Incident Desk</CardTitle>
                <CardDescription className="text-xs">
                  Active operations emergency logs.
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-rose-50 border-rose-200 text-rose-700 font-bold">
                {data?.incidents.filter(i => i.status !== "Resolved").length || 0} Active
              </Badge>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto px-4 py-0 space-y-2">
              {data && data.incidents.filter(i => i.status !== "Resolved").length > 0 ? (
                data.incidents.filter(i => i.status !== "Resolved").map(inc => (
                  <div
                    key={inc.id}
                    onClick={() => {
                      setSelectedIncident(inc);
                      setAnnouncements(null);
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") {
                        setSelectedIncident(inc);
                        setAnnouncements(null);
                      }
                    }}
                    tabIndex={0}
                    className={`p-3 rounded border text-left cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-primary ${
                      selectedIncident?.id === inc.id
                        ? "border-primary bg-primary/[0.03]"
                        : "border-border hover:bg-muted/10 bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-foreground">{inc.id} - {inc.location}</span>
                      {getSeverityBadge(inc.severity)}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{inc.description}</p>
                    <div className="flex justify-between items-center mt-2 text-[10px] text-muted-foreground font-medium">
                      <span>Cat: {inc.category}</span>
                      <span className="capitalize">Status: {inc.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs py-12">
                  <span className="text-2xl mb-1">✅</span>
                  No active incidents. Stadium operating smoothly.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Incident AI Recommendation Details Box */}
          {selectedIncident && (
            <Card className="border-rose-500/20 bg-rose-500/[0.01]">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-rose-700">📌 Incident Details - {selectedIncident.id}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedIncident(null)} className="h-6 w-6 p-0 text-muted-foreground text-xs">✕</Button>
                </div>
              </CardHeader>
              <CardContent className="text-xs space-y-3 pb-3 pt-0">
                <p className="font-medium text-foreground">"{selectedIncident.description}"</p>
                
                {/* AI recommendation transparency */}
                {selectedIncident.status === "Reported" && selectedIncident.recommended_staff_id && (
                  <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200">
                    <span className="block font-bold text-emerald-800 text-[10px] uppercase mb-1 flex items-center gap-1"><Bot className="h-3.5 w-3.5 text-emerald-600" /> AI Recommended Dispatch</span>
                    <p className="font-semibold text-emerald-950 mb-1">
                      Assign to: {data?.staff.find(s => s.id === selectedIncident.recommended_staff_id)?.name || selectedIncident.recommended_staff_id}
                    </p>
                    {selectedIncident.ai_recommendation_why && (
                      <p className="text-emerald-900 text-[11px] italic">
                        <strong>Why:</strong> {selectedIncident.ai_recommendation_why}
                      </p>
                    )}
                    <Button
                      size="sm"
                      onClick={handleConfirmDispatch}
                      disabled={dispatching}
                      className="mt-2.5 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8"
                    >
                      {dispatching ? "Confirming Dispatch..." : "Confirm AI Dispatch Recommendation"}
                    </Button>
                  </div>
                )}

                {selectedIncident.status === "Dispatched" && (
                  <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900">
                    <span className="font-bold">Responder assigned:</span>{" "}
                    {selectedIncident.assigned_staff.map(sid => data?.staff.find(s => s.id === sid)?.name).join(", ") || "Unknown Staff"}
                  </div>
                )}

                {/* PA Script translator box */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDraftAnnouncement}
                    disabled={drafting}
                    className="flex-1 h-8 text-xs font-semibold"
                  >
                    {drafting ? "Drafting Script..." : "📢 Draft PA Announcement"}
                  </Button>
                  {selectedIncident.status !== "Resolved" && (
                    <Button 
                      size="sm" 
                      onClick={handleResolveIncident}
                      disabled={resolving}
                      className="flex-1 bg-slate-800 text-white hover:bg-slate-900 h-8 text-xs font-semibold"
                    >
                      {resolving ? "Resolving..." : "✅ Resolve Incident"}
                    </Button>
                  )}
                </div>

                {/* PA Script display panel */}
                {announcements && (
                  <div className="mt-3 p-3 rounded border border-border bg-background space-y-2.5">
                    <span className="block font-bold text-[10px] uppercase text-muted-foreground tracking-wider">Trilingual Public Alerts (Gemini generated)</span>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase">English (USA)</span>
                      <p className="p-1.5 rounded bg-slate-50 text-[11px] font-medium border border-slate-100 text-foreground">"{announcements.en}"</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-amber-600 uppercase">Español (Mexico)</span>
                      <p className="p-1.5 rounded bg-amber-50/30 text-[11px] font-medium border border-amber-100/50 text-foreground">"{announcements.es}"</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-blue-600 uppercase">Français (Canada)</span>
                      <p className="p-1.5 rounded bg-blue-50/30 text-[11px] font-medium border border-blue-100/50 text-foreground">"{announcements.fr}"</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Side: Turnstiles & Gates / Ground Personnel Roster tabs (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Gate Editor Dialog modal fallback box (inline inside panel) */}
          {editingGateId && (
            <Card className="border-amber-500/20 bg-amber-500/[0.01]">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-bold text-amber-700">⚙️ Edit status: {data?.gates.find(g => g.id === editingGateId)?.name}</CardTitle>
              </CardHeader>
              <CardContent className="pb-3 pt-0">
                <form onSubmit={handleUpdateGate} className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[120px]">
                    <label className="text-[10px] font-bold text-muted-foreground block mb-1">Status</label>
                    <Select value={editStatus} onValueChange={val => setEditStatus(val || "")}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="Congested">Congested</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                        <SelectItem value="Emergency Only">Emergency Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-[80px]">
                    <label className="text-[10px] font-bold text-muted-foreground block mb-1">Wait Time (m)</label>
                    <Input 
                      type="number" 
                      value={editWaitTime} 
                      onChange={e => setEditWaitTime(parseInt(e.target.value) || 0)}
                      className="h-8 text-xs bg-background" 
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">Save</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setEditingGateId(null)} className="h-8 text-xs">Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Gates and Staff Details Tabs */}
          <Tabs defaultValue="gates" className="w-full">
            <TabsList className="grid grid-cols-2 bg-muted/50 p-1 rounded-md border border-border">
              <TabsTrigger value="gates" className="font-semibold text-xs py-2 rounded flex items-center gap-1.5"><Radio className="h-3.5 w-3.5 text-primary" /> Turnstiles & Gates</TabsTrigger>
              <TabsTrigger value="staff" className="font-semibold text-xs py-2 rounded flex items-center gap-1.5"><HardHat className="h-3.5 w-3.5 text-primary" /> Ground Personnel Roster</TabsTrigger>
            </TabsList>
            
            {/* Gates panel */}
            <TabsContent value="gates" className="mt-4">
              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border font-bold">
                        <th className="p-3">Gate Name</th>
                        <th className="p-3">Operational Status</th>
                        <th className="p-3">Wait Time</th>
                        <th className="p-3">Flow Rate</th>
                        <th className="p-3">Security Lanes</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.gates.map(gate => (
                        <tr key={gate.id} className="border-b border-border hover:bg-muted/10">
                          <td className="p-3 font-semibold">{gate.name}</td>
                          <td className="p-3">
                            <Badge 
                              className={
                                gate.status === "Open" 
                                  ? "bg-emerald-100 text-emerald-800" 
                                  : gate.status === "Congested" 
                                    ? "bg-amber-100 text-amber-800" 
                                    : "bg-rose-100 text-rose-800"
                              }
                            >
                              {gate.status}
                            </Badge>
                          </td>
                          <td className="p-3 font-medium">{gate.wait_time} mins</td>
                          <td className="p-3 text-muted-foreground">{gate.flow_rate} people/min</td>
                          <td className="p-3 text-muted-foreground">{gate.security_lanes_active}/{gate.security_lanes_total} Active</td>
                          <td className="p-3">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setEditingGateId(gate.id);
                                setEditStatus(gate.status);
                                setEditWaitTime(gate.wait_time);
                              }}
                              className="h-7 text-[10px] px-2"
                            >
                              Edit Status
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Staff roster panel */}
            <TabsContent value="staff" className="mt-4">
              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border font-bold">
                        <th className="p-3">Staff Member</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Assigned Zone</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Primary Tasks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.staff.map(staff => (
                        <tr key={staff.id} className="border-b border-border hover:bg-muted/10">
                          <td className="p-3 font-semibold">{staff.name}</td>
                          <td className="p-3 text-muted-foreground">{staff.role}</td>
                          <td className="p-3 font-medium">{staff.zone}</td>
                          <td className="p-3">
                            <Badge 
                              className={
                                staff.status === "Active" 
                                  ? "bg-emerald-100 text-emerald-800" 
                                  : staff.status === "Dispatched" 
                                    ? "bg-rose-100 text-rose-800" 
                                    : "bg-slate-100 text-slate-800"
                              }
                            >
                              {staff.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground max-w-[200px] truncate" title={staff.tasks.join(", ")}>
                            {staff.tasks[0] || "No assigned tasks"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Floating AI Co-Pilot Chat */}
      <ChatWidget
        role="command-center"
        placeholder="Ask the Command Co-Pilot..."
        suggestions={[
          { label: "🔍 Congested Gates?", query: "Which gates are currently congested and what are the alternative entries?" },
          { label: "👮 Security for Stand B?", query: "Who is the closest security officer we can dispatch to Stand B crowd surge?" },
          { label: "📊 Incident summary", query: "Summarize the current active incidents and their priority levels." },
        ]}
      />
    </div>
  );
}
