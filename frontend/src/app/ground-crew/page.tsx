"use client";

import { useEffect, useState } from "react";
import { api, DashboardData, Staff, Incident } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HardHat, AlertTriangle, Bot } from "lucide-react";

export default function GroundCrew() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("staff_2"); // default David Rao
  const [activeStaff, setActiveStaff] = useState<Staff | null>(null);
  
  // Incident Form States
  const [incLocation, setIncLocation] = useState("Stand B (East)");
  const [incDescription, setIncDescription] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  // Chat States
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState<{ sender: "user" | "copilot"; text: string }[]>([
    { sender: "copilot", text: "Ground Crew assistance active. Ask me for emergency procedures, closest resources, or duties." },
    { sender: "user", text: "What's the protocol for a medical emergency at Stand B?" },
    { sender: "copilot", text: "Protocol for Medical Emergency: 1. Stay with the patient and ensure their immediate area is clear. 2. Call the Command Center to report details. 3. Coordinate with incoming medical responders to guide them to Stand B." }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const loadData = async () => {
    try {
      const res = await api.getDashboard();
      setDashboard(res);
      const staff = res.staff.find(s => s.id === selectedStaffId);
      if (staff) setActiveStaff(staff);
    } catch (err) {
      console.error("Failed to load crew data", err);
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

  // Chat
  const handleSendChat = async (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim() || !activeStaff) return;

    setChatLog(prev => [...prev, { sender: "user", text }]);
    if (!textToSend) setChatInput("");
    setChatLoading(true);

    try {
      const res = await api.copilotChat("ground-crew", text, activeStaff.id);
      setChatLog(prev => [...prev, { sender: "copilot", text: res.answer }]);
    } catch (err: any) {
      setChatLog(prev => [...prev, { sender: "copilot", text: `Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
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
              onValueChange={val => {
                setSelectedStaffId(val || "");
                setChatLog([{ sender: "copilot", text: "Ground Crew assistance active. Ask me for emergency procedures, closest resources, or duties." }]);
              }}
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

            {/* Incident reporter */}
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

          {/* Chat co-pilot (5 cols) */}
          <div className="md:col-span-5">
            <Card className="h-[520px] flex flex-col">
              <CardHeader className="py-4">
                <CardTitle className="text-base font-bold flex items-center gap-1.5">
                  <Bot className="h-5 w-5 text-primary" /> Local Crew Co-Pilot
                </CardTitle>
                <CardDescription className="text-xs">
                  Ask for emergency protocols, supervisor contacts, or local stand issues.
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
                    Co-Pilot consulting procedures...
                  </div>
                )}
              </CardContent>

              {/* Quick procedures */}
              <div className="px-4 py-1.5 border-t border-border bg-muted/20 flex flex-wrap gap-1">
                <button 
                  onClick={() => handleSendChat("What is the official procedure for a lost child in my zone?")}
                  className="text-[9px] px-2 py-0.5 border border-border bg-background hover:bg-muted text-muted-foreground font-semibold rounded text-left"
                >
                  👶 Lost Child Protocol
                </button>
                <button 
                  onClick={() => handleSendChat("Where is the nearest AED device and medical stand located?")}
                  className="text-[9px] px-2 py-0.5 border border-border bg-background hover:bg-muted text-muted-foreground font-semibold rounded text-left"
                >
                  ❤️ Find AED / First Aid
                </button>
                <button 
                  onClick={() => handleSendChat("Who is the supervisor on duty and how can I reach them?")}
                  className="text-[9px] px-2 py-0.5 border border-border bg-background hover:bg-muted text-muted-foreground font-semibold rounded text-left"
                >
                  📞 Contact Supervisor
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
                    placeholder="Ask crew co-pilot..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    disabled={chatLoading}
                    className="h-8 text-xs bg-background"
                  />
                  <Button type="submit" size="sm" disabled={chatLoading} className="h-8 px-3 text-xs bg-primary hover:bg-primary/95 text-white">
                    Ask
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
