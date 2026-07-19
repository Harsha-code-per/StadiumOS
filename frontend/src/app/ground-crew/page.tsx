"use client";

import { useEffect, useState } from "react";
import { api, DashboardData, Staff, Incident } from "@/lib/api";
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
  
  // Incident Form States
  const [incLocation, setIncLocation] = useState("Stand B (East)");
  const [incDescription, setIncDescription] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);


  const loadData = async () => {
    try {
      const res = await api.getDashboard();
      setDashboard(res);
      const staff = res.staff.find(s => s.id === selectedStaffId);
      if (staff) setActiveStaff(staff);
    } catch {
      // fail silently — dashboard data updates on next poll
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000); // Poll every 4 seconds to sync tasks
    return () => clearInterval(interval);
  }, [selectedStaffId]);

  // Toggle Task Completion
  const handleToggleTask = async (taskIndex: number, currentText: string) => {
    if (!activeStaff) return;
    const isCompleted = currentText.startsWith("[COMPLETED] ");
    try {
      const updated = await api.updateStaffTask(activeStaff.id, taskIndex, !isCompleted);
      setActiveStaff(updated);
      loadData();
    } catch (err: any) {
      alert(`Failed to update task: ${err.message}`);
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
      loadData();
    } catch (err: any) {
      alert(`Reporting failed: ${err.message}`);
    } finally {
      setReporting(false);
    }
  };



  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
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
        <div className="grid md:grid-cols-12 gap-6">
          {/* Roster card & Task list (7 cols) */}
          <div className="md:col-span-7 space-y-6">
            
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
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-base font-bold">📋 Tasks & Action Checklists</CardTitle>
                <CardDescription className="text-xs">
                  Tap tasks to toggle execution status. Dispatches automatically sync here.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
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
          <div className="md:col-span-5 space-y-6">
            <Card className="border-l-[4px] border-l-primary shadow-md">
              <CardHeader className="py-4">
                <CardTitle className="text-base font-bold">⚠️ Report Incident to Control Room</CardTitle>
                <CardDescription className="text-xs font-medium">
                  Submit field anomalies. The backend AI automatically categorizes and dispatches responders.
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
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
