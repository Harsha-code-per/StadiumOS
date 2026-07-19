"use client";

import { useEffect, useState, useCallback } from "react";
import { api, DashboardData, Staff } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HardHat, AlertTriangle } from "lucide-react";
import ChatWidget from "@/components/ChatWidget";

export default function GroundCrew() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("staff_2"); // default David Rao
  const [activeStaff, setActiveStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Incident Form States
  const [incLocation, setIncLocation] = useState("Stand B (East)");
  const [incDescription, setIncDescription] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);


  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.getDashboard();
      setDashboard(res);
      const staff = res.staff.find(s => s.id === selectedStaffId);
      if (staff) setActiveStaff(staff);
      setError(null);
    } catch (err: unknown) {
      const errorObj = err as Record<string, unknown> | null;
      const errorMessage = errorObj && typeof errorObj === "object" && "message" in errorObj ? String(errorObj.message) : "Failed to load dashboard data.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedStaffId]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      await Promise.resolve();
      if (active) {
        loadData();
      }
    };
    run();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadData(true);
      }
    }, 4000); // Poll every 4 seconds to sync tasks
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [loadData]);

  // Toggle Task Completion
  const handleToggleTask = async (taskIndex: number, currentText: string) => {
    if (!activeStaff) return;
    const isCompleted = currentText.startsWith("[COMPLETED] ");
    try {
      const updated = await api.updateStaffTask(activeStaff.id, taskIndex, !isCompleted);
      setActiveStaff(updated);
      loadData(true);
    } catch (err: unknown) {
      const errorObj = err as Record<string, unknown> | null;
      const errorMessage = errorObj && typeof errorObj === "object" && "message" in errorObj ? String(errorObj.message) : "Failed to update task.";
      alert(`Failed to update task: ${errorMessage}`);
    }
  };

  // Report Incident
  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incDescription.trim()) return;

    setReporting(true);
    setReportSuccess(null);
    try {
      const res = await api.reportIncident(incLocation, incDescription);
      setReportSuccess(`Incident reported successfully! ID: ${res.id}. AI classified as ${res.category} (${res.severity}).`);
      setIncDescription("");
      loadData(true);
    } catch (err: unknown) {
      const errorObj = err as Record<string, unknown> | null;
      const errorMessage = errorObj && typeof errorObj === "object" && "message" in errorObj ? String(errorObj.message) : "Reporting failed.";
      alert(`Reporting failed: ${errorMessage}`);
    } finally {
      setReporting(false);
    }
  };

  if (error && !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-4">
        <Card className="max-w-md border-rose-500/20 bg-rose-500/[0.02] shadow-lg">
          <CardHeader>
            <CardTitle className="text-rose-700 flex items-center justify-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Connection Offline
            </CardTitle>
            <CardDescription className="text-xs">
              Unable to reach the Stadium AI backend service.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {error}
            </p>
            <Button
              onClick={() => loadData(false)}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold"
            >
              🔄 Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading && !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-xs text-muted-foreground font-semibold animate-pulse">
          ⚽ Connecting to Ground Crew Network...
        </p>
      </div>
    );
  }



  return (
    <div className="w-full max-w-[96%] mx-auto space-y-6">
      
      {/* Roster Switcher */}
      <Card className="border-primary/20 bg-primary/[0.01]">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <HardHat className="h-6 w-6 text-primary" /> Field Ground Crew Dashboard
            </h1>
            <p className="text-xs text-muted-foreground">Select your roster identity to sync tasks, zones, and local guidelines.</p>
          </div>
          <div className="w-full sm:w-[240px]">
            <Select 
              value={selectedStaffId} 
              onValueChange={val => setSelectedStaffId(val || "")}
            >
              <SelectTrigger className="h-9 text-xs bg-background">
                <SelectValue placeholder="Select staff..." />
              </SelectTrigger>
              <SelectContent>
                {dashboard?.staff.map(s => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.name} ({s.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Roster detail and tasks */}
      {activeStaff && (
        <div className="grid md:grid-cols-12 gap-6 items-stretch">
          {/* Roster card & Task list (7 cols) */}
          <div className="md:col-span-7 flex flex-col space-y-6">
            
            {/* Status & Zone */}
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Active Assignment</span>
                  <span className="text-base font-bold text-foreground block">{activeStaff.zone}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Crew Status</span>
                  <Badge 
                    className={
                      activeStaff.status === "Active" 
                        ? "bg-emerald-600 text-white font-bold" 
                        : "bg-rose-600 text-white font-bold animate-pulse"
                    }
                  >
                    {activeStaff.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Checklists */}
            <Card className="flex-1 flex flex-col">
              <CardHeader className="py-4">
                <CardTitle className="text-base font-bold">📋 Tasks & Action Checklists</CardTitle>
                <CardDescription className="text-xs">
                  Tap tasks to toggle execution status. Dispatches automatically sync here.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pb-4 flex-1">
                {activeStaff.tasks.length > 0 ? (
                  activeStaff.tasks.map((task, idx) => {
                    const isCompleted = task.startsWith("[COMPLETED] ");
                    const displayName = isCompleted ? task.replace("[COMPLETED] ", "") : task;
                    return (
                      <div 
                        key={idx}
                        onClick={() => handleToggleTask(idx, task)}
                        onKeyDown={e => {
                          if (e.key === "Enter" || e.key === " ") {
                            handleToggleTask(idx, task);
                          }
                        }}
                        tabIndex={0}
                        className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-primary ${
                          isCompleted 
                            ? "bg-muted/30 border-border opacity-70" 
                            : "bg-card border-border hover:bg-muted/10"
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={isCompleted}
                          readOnly
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary" 
                        />
                        <span className={`text-xs font-medium text-foreground ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                          {displayName}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground italic py-4 text-center">No assigned checklist items today.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Incident reporter (5 cols) */}
          <div className="md:col-span-5 flex flex-col">
            <Card className="border-l-[4px] border-l-primary shadow-md h-full flex flex-col">
              <CardHeader className="py-4">
                <CardTitle className="text-base font-bold">⚠️ Report Incident to Control Room</CardTitle>
                <CardDescription className="text-xs font-medium">
                  Submit field anomalies. The backend AI automatically categorizes and dispatches responders.
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4 flex-1">
                <form onSubmit={handleReportIncident} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">Location</label>
                    <Select value={incLocation} onValueChange={val => setIncLocation(val || "")}>
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Stand A (North)">Stand A (North)</SelectItem>
                        <SelectItem value="Stand B (East)">Stand B (East)</SelectItem>
                        <SelectItem value="Stand C (South)">Stand C (South)</SelectItem>
                        <SelectItem value="Stand D (West)">Stand D (West)</SelectItem>
                        <SelectItem value="Stand E (Club/VIP)">Stand E (VIP)</SelectItem>
                        <SelectItem value="Stand F (Upper concourse)">Stand F (Upper)</SelectItem>
                        <SelectItem value="Gate 1 (VIP)">Gate 1 VIP</SelectItem>
                        <SelectItem value="Gate 2">Gate 2</SelectItem>
                        <SelectItem value="Gate 3">Gate 3</SelectItem>
                        <SelectItem value="Gate 4">Gate 4</SelectItem>
                        <SelectItem value="Gate 5">Gate 5</SelectItem>
                        <SelectItem value="Gate 6">Gate 6</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">Incident Description</label>
                    <textarea
                      placeholder="Describe what is happening (e.g. medical collapse, leaking pipes, ticket scanners broken)..."
                      value={incDescription}
                      onChange={e => setIncDescription(e.target.value)}
                      maxLength={300}
                      rows={3}
                      className="w-full text-xs p-2.5 border border-border bg-background rounded-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none"
                    />
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                      <span>Max 300 characters.</span>
                      <span>{incDescription.length}/300</span>
                    </div>
                  </div>

                  {reportSuccess && (
                    <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded font-medium">
                      {reportSuccess}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={reporting || !incDescription.trim()} 
                    className="w-full h-9 bg-primary hover:bg-primary/95 text-white font-bold text-xs"
                  >
                    {reporting ? "Analyzing & Reporting..." : (
                      <span className="flex items-center justify-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" /> Report to Command Center
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

          </div>

        </div>
      )}

      {/* Floating AI Co-Pilot Chat (staff-aware) */}
      <ChatWidget
        role="ground-crew"
        staffId={activeStaff?.id}
        placeholder="Ask crew co-pilot..."
        suggestions={[
          { label: "👶 Lost Child Protocol", query: "What is the official procedure for a lost child in my zone?" },
          { label: "❤️ Find AED / First Aid", query: "Where is the nearest AED device and medical stand located?" },
          { label: "📞 Contact Supervisor", query: "Who is the supervisor on duty and how can I reach them?" },
        ]}
      />
    </div>
  );
}
