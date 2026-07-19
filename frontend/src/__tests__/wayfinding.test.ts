import { describe, it, expect } from 'vitest';
import { Gate, Zone } from '@/lib/api';

// Mimics the exact getBestGateForStand logic used in fan/page.tsx
function calculateBestGate(activeStand: Zone, gates: Gate[]): Gate | null {
  const associatedGates = gates.filter(g => activeStand.gates.includes(g.id));
  const openGates = associatedGates.filter(g => g.status === "Open" || g.status === "Congested");
  
  if (openGates.length === 0) return null;
  
  // Sort by wait time ascending
  openGates.sort((a, b) => a.wait_time - b.wait_time);
  return openGates[0];
}

describe('Dynamic Fan Wayfinding Logic', () => {
  const mockGates: Gate[] = [
    {
      id: "gate_1",
      name: "Gate 1 (VIP)",
      status: "Open",
      flow_rate: 15,
      wait_time: 2,
      security_lanes_active: 2,
      security_lanes_total: 2
    },
    {
      id: "gate_2",
      name: "Gate 2",
      status: "Congested",
      flow_rate: 45,
      wait_time: 28,
      security_lanes_active: 4,
      security_lanes_total: 6
    },
    {
      id: "gate_3",
      name: "Gate 3",
      status: "Open",
      flow_rate: 30,
      wait_time: 8,
      security_lanes_active: 4,
      security_lanes_total: 4
    },
    {
      id: "gate_4",
      name: "Gate 4",
      status: "Open",
      flow_rate: 25,
      wait_time: 5,
      security_lanes_active: 3,
      security_lanes_total: 4
    },
    {
      id: "gate_5",
      name: "Gate 5",
      status: "Closed",
      flow_rate: 0,
      wait_time: 0,
      security_lanes_active: 0,
      security_lanes_total: 4
    }
  ];

  it('should select the fastest open gate for Stand B (Gate 3 is selected over congested Gate 2)', () => {
    const standB: Zone = {
      id: "stand_b",
      name: "Stand B (East)",
      density: "High",
      current_count: 14200,
      capacity: 15000,
      gates: ["gate_2", "gate_3"]
    };

    const bestGate = calculateBestGate(standB, mockGates);
    expect(bestGate).not.toBeNull();
    expect(bestGate?.id).toBe("gate_3");
    expect(bestGate?.wait_time).toBe(8);
  });

  it('should select Gate 4 when Gate 5 is closed', () => {
    const standD: Zone = {
      id: "stand_d",
      name: "Stand D (West)",
      density: "Medium",
      current_count: 7800,
      capacity: 11000,
      gates: ["gate_4", "gate_5"]
    };

    const bestGate = calculateBestGate(standD, mockGates);
    expect(bestGate).not.toBeNull();
    expect(bestGate?.id).toBe("gate_4");
    expect(bestGate?.status).toBe("Open");
  });

  it('should return null if all gates serving the stand are closed', () => {
    const standDClosed: Zone = {
      id: "stand_d",
      name: "Stand D (West)",
      density: "Low",
      current_count: 0,
      capacity: 11000,
      gates: ["gate_5"] // Gate 5 is Closed
    };

    const bestGate = calculateBestGate(standDClosed, mockGates);
    expect(bestGate).toBeNull();
  });
});
