from pydantic import BaseModel, Field
from typing import Optional, List

class GateUpdateInput(BaseModel):
    gate_id: str
    status: Optional[str] = None
    flow_rate: Optional[int] = None
    wait_time: Optional[int] = None
    security_lanes_active: Optional[int] = None

class ZoneDensityUpdateInput(BaseModel):
    zone_id: str
    density: str
    current_count: Optional[int] = None

class IncidentReportInput(BaseModel):
    location: str = Field(..., max_length=100)
    description: str = Field(..., max_length=300)

class IncidentDispatchInput(BaseModel):
    staff_ids: List[str]

class ChatRequestInput(BaseModel):
    role: str = Field(..., pattern="^(command-center|ground-crew|fan)$")
    query: str = Field(..., max_length=300)
    staff_id: Optional[str] = None

class SimulationInput(BaseModel):
    event_type: str = Field(..., pattern="^(crowd_surge|medical|outage|vip_arrival)$")

class TaskUpdateInput(BaseModel):
    task_index: int
    completed: bool
