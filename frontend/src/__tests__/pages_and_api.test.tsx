import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Home from "@/app/page";
import CommandCenter from "@/app/command-center/page";
import GroundCrew from "@/app/ground-crew/page";
import FanPortal from "@/app/fan/page";
import { api } from "@/lib/api";

const mockDashboardData = {
  gates: [
    {
      id: "gate_1",
      name: "Gate 1 (VIP)",
      status: "Open",
      flow_rate: 15,
      wait_time: 2,
      security_lanes_active: 2,
      security_lanes_total: 2,
    },
    {
      id: "gate_2",
      name: "Gate 2 (East)",
      status: "Congested",
      flow_rate: 8,
      wait_time: 48,
      security_lanes_active: 4,
      security_lanes_total: 6,
    },
  ],
  zones: [
    {
      id: "stand_a",
      name: "Stand A (North)",
      density: "Medium",
      current_count: 8500,
      capacity: 12000,
      gates: ["gate_1"],
    },
    {
      id: "stand_b",
      name: "Stand B (East)",
      density: "High",
      current_count: 14200,
      capacity: 15000,
      gates: ["gate_2"],
    },
  ],
  staff: [
    {
      id: "staff_1",
      name: "Officer Sarah Jenkins",
      role: "Security",
      zone: "Stand A (North)",
      status: "Active",
      tasks: ["Patrol North concourse", "Check Gate 1 ticket scanner"],
    },
  ],
  incidents: [
    {
      id: "INC-001",
      category: "Crowd",
      severity: "High",
      location: "Gate 2",
      status: "Reported",
      description: "Heavy crowd surge outside Stand B Gate 2.",
      timestamp: "2026-07-19T10:00:00Z",
      assigned_staff: [],
      recommended_staff_id: "staff_1",
      ai_recommendation_why: "Sarah is the nearest security officer.",
    },
  ],
};

// Setup global mock for fetch with route-aware responses
const setupMockFetch = (ok = true, status = 200) => {
  const mockFetch = vi.fn().mockImplementation((url: string) => {
    let payload = mockDashboardData;
    if (url.includes("/api/reset")) {
      payload = { message: "Reset ok", data: mockDashboardData } as unknown as typeof mockDashboardData;
    } else if (url.includes("/api/health")) {
      payload = { status: "ok", timestamp: "now" } as unknown as typeof mockDashboardData;
    }
    return Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(payload),
    });
  });
  vi.stubGlobal("fetch", mockFetch);
  return mockFetch;
};

describe("Home Slogan Page Component", () => {
  it("renders the clean product header and navigation cards", () => {
    render(<Home />);
    
    // Check for professional slogan
    expect(screen.getByText(/Stadium Operations Command System/i)).toBeInTheDocument();
    
    // Verify role cards exist
    expect(screen.getAllByText("Control Room").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Ground Crew").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Fan Portal").length).toBeGreaterThanOrEqual(1);
  });
});

describe("Command Center Dashboard page", () => {
  beforeEach(() => {
    setupMockFetch();
    vi.stubGlobal("alert", vi.fn());
    vi.stubGlobal("confirm", () => true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the dashboard title and interactive cards", async () => {
    render(<CommandCenter />);
    
    await waitFor(() => {
      expect(screen.getByText(/Scenario Simulation Engine/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Real-Time Stadium Layout/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Incident Desk/i)).toBeInTheDocument();
  });

  it("handles resetting data on user request", async () => {
    const mockFetch = setupMockFetch();
    
    render(<CommandCenter />);
    await waitFor(() => screen.getByText(/Reset Stadium System/i));
    
    const resetBtn = screen.getByText(/Reset Stadium System/i);
    fireEvent.click(resetBtn);
    
    await waitFor(() => {
      // Find call containing /api/reset
      const hasResetCall = mockFetch.mock.calls.some((call) => (call[0] as string).includes("/api/reset"));
      expect(hasResetCall).toBe(true);
    });
  });
});

describe("Ground Crew page component", () => {
  beforeEach(() => {
    setupMockFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("allows selecting a staff identity to sync dashboard", async () => {
    render(<GroundCrew />);
    
    await waitFor(() => {
      expect(screen.getByText(/Roster Identity/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Select your roster identity to sync tasks/i)).toBeInTheDocument();
  });
});

describe("Fan Portal wayfinding page", () => {
  beforeEach(() => {
    setupMockFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders live gates status grid and interactive selector", async () => {
    render(<FanPortal />);
    
    await waitFor(() => {
      expect(screen.getByText(/Live Gate Wait Times/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Dynamic Wayfinding Helper/i)).toBeInTheDocument();
  });
});

describe("API Wrapper library tests", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("getHealth returns offline when endpoint rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network Error")));
    const status = await api.getHealth();
    expect(status.status).toBe("offline");
  });

  it("getHealth returns ok when endpoint responds 200 ok", async () => {
    setupMockFetch();
    const status = await api.getHealth();
    expect(status.status).toBe("ok");
  });
});
