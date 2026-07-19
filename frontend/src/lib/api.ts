const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Gate {
  id: string;
  name: string;
  status: "Open" | "Congested" | "Closed" | "Emergency Only";
  flow_rate: number;
  wait_time: number;
  security_lanes_active: number;
  security_lanes_total: number;
}

export interface Zone {
  id: string;
  name: string;
  density: "Low" | "Medium" | "High" | "Critical";
  current_count: number;
  capacity: number;
  gates: string[];
}

export interface Staff {
  id: string;
  name: string;
  role: "Security" | "Medical" | "Maintenance" | "Usher" | "Supervisor";
  zone: string;
  status: "Active" | "Off Duty" | "Dispatched";
  tasks: string[];
}

export interface Incident {
  id: string;
  category: "Security" | "Medical" | "Maintenance" | "Crowd";
  severity: "Low" | "Medium" | "High" | "Critical";
  location: string;
  status: "Reported" | "Dispatched" | "Resolved";
  description: string;
  timestamp: string;
  assigned_staff: string[];
  ai_recommendation_why?: string;
  recommended_staff_id?: string; // transient UI property returned from classification
}

export interface DashboardData {
  gates: Gate[];
  zones: Zone[];
  staff: Staff[];
  incidents: Incident[];
}

export interface HealthStatus {
  status: "ok" | "offline";
  timestamp?: string;
  service?: string;
  model_cascade_enabled?: boolean;
}

// Fetch helper with timeout and error wrapping
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please wait a moment before trying again.");
      }
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.detail || `Server responded with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Please check your backend service connection.");
    }
    throw error;
  }
}

export const api = {
  async getHealth(): Promise<HealthStatus> {
    try {
      const data = await fetchAPI<{ status: string; timestamp: string }>("/api/health");
      return { status: data.status === "ok" ? "ok" : "offline" };
    } catch {
      return { status: "offline" };
    }
  },

  async getDashboard(): Promise<DashboardData> {
    return fetchAPI<DashboardData>("/api/dashboard");
  },

  async resetData(): Promise<{ message: string; data: DashboardData }> {
    return fetchAPI<{ message: string; data: DashboardData }>("/api/reset", {
      method: "POST",
    });
  },

  async reportIncident(location: string, description: string): Promise<Incident> {
    return fetchAPI<Incident>("/api/incidents", {
      method: "POST",
      body: JSON.stringify({ location, description }),
    });
  },

  async dispatchStaff(incidentId: string, staffIds: string[]): Promise<Incident> {
    return fetchAPI<Incident>(`/api/incidents/${incidentId}/dispatch`, {
      method: "POST",
      body: JSON.stringify({ staff_ids: staffIds }),
    });
  },

  async resolveIncident(incidentId: string): Promise<Incident> {
    return fetchAPI<Incident>(`/api/incidents/${incidentId}/resolve`, {
      method: "POST",
    });
  },

  async updateGate(
    gateId: string,
    status?: string,
    flowRate?: number,
    waitTime?: number,
    securityLanesActive?: number
  ): Promise<Gate> {
    return fetchAPI<Gate>("/api/gates/update", {
      method: "POST",
      body: JSON.stringify({
        gate_id: gateId,
        status,
        flow_rate: flowRate,
        wait_time: waitTime,
        security_lanes_active: securityLanesActive,
      }),
    });
  },

  async generatePAAnnouncement(incidentId: string): Promise<{ en: string; es: string; fr: string }> {
    return fetchAPI<{ en: string; es: string; fr: string }>(`/api/incidents/${incidentId}/announcement`, {
      method: "POST",
    });
  },

  async copilotChat(role: "command-center" | "ground-crew" | "fan", query: string, staffId?: string): Promise<{ answer: string }> {
    return fetchAPI<{ answer: string }>("/api/copilot/chat", {
      method: "POST",
      body: JSON.stringify({ role, query, staff_id: staffId }),
    });
  },

  async simulateEvent(eventType: "crowd_surge" | "medical" | "outage" | "vip_arrival"): Promise<{ message: string; incident: Incident }> {
    return fetchAPI<{ message: string; incident: Incident }>("/api/simulate", {
      method: "POST",
      body: JSON.stringify({ event_type: eventType }),
    });
  },

  async updateStaffTask(staffId: string, taskIndex: number, completed: boolean): Promise<Staff> {
    return fetchAPI<Staff>(`/api/staff/${staffId}/task`, {
      method: "POST",
      body: JSON.stringify({ task_index: taskIndex, completed }),
    });
  }
};
