"""
Pydantic schemas and input validation models for the Stadium AI Co-Pilot API.
"""

from pydantic import BaseModel, Field
from typing import Optional, List


class GateUpdateInput(BaseModel):
    """Input payload for updating gate parameters (status, flow rates, wait times)."""

    gate_id: str
    status: Optional[str] = None
    flow_rate: Optional[int] = None
    wait_time: Optional[int] = None
    security_lanes_active: Optional[int] = None


class ZoneDensityUpdateInput(BaseModel):
    """Input payload for updating standing zone occupant counts and density levels."""

    zone_id: str
    density: str
    current_count: Optional[int] = None


class IncidentReportInput(BaseModel):
    """Input payload for reporting operational incidents with location and description."""

    location: str = Field(..., max_length=100)
    description: str = Field(..., max_length=300)


class IncidentDispatchInput(BaseModel):
    """Input payload for dispatching crew roster IDs to active incident logs."""

    staff_ids: List[str]


class ChatRequestInput(BaseModel):
    """Input payload for dynamic role-based AI Co-Pilot chat interface requests."""

    role: str = Field(..., pattern="^(command-center|ground-crew|fan)$")
    query: str = Field(..., max_length=300)
    staff_id: Optional[str] = None


class SimulationInput(BaseModel):
    """Input payload for triggering simulated operations events."""

    event_type: str = Field(..., pattern="^(crowd_surge|medical|outage|vip_arrival)$")


class TaskUpdateInput(BaseModel):
    """Input payload for updating a specific staff checklist task item status."""

    task_index: int
    completed: bool
