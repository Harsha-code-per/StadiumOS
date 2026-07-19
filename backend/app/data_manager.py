import json
import os
import threading
import copy

# Pristine initial seed data for system reset and initialization
PRISTINE_SEED = {
  "gates": [
    {
      "id": "gate_1",
      "name": "Gate 1 (VIP)",
      "status": "Open",
      "flow_rate": 15,
      "wait_time": 2,
      "security_lanes_active": 2,
      "security_lanes_total": 2
    },
    {
      "id": "gate_2",
      "name": "Gate 2",
      "status": "Congested",
      "flow_rate": 45,
      "wait_time": 28,
      "security_lanes_active": 4,
      "security_lanes_total": 6
    },
    {
      "id": "gate_3",
      "name": "Gate 3",
      "status": "Open",
      "flow_rate": 30,
      "wait_time": 8,
      "security_lanes_active": 4,
      "security_lanes_total": 4
    },
    {
      "id": "gate_4",
      "name": "Gate 4",
      "status": "Open",
      "flow_rate": 25,
      "wait_time": 5,
      "security_lanes_active": 3,
      "security_lanes_total": 4
    },
    {
      "id": "gate_5",
      "name": "Gate 5",
      "status": "Closed",
      "flow_rate": 0,
      "wait_time": 0,
      "security_lanes_active": 0,
      "security_lanes_total": 4
    },
    {
      "id": "gate_6",
      "name": "Gate 6",
      "status": "Open",
      "flow_rate": 35,
      "wait_time": 12,
      "security_lanes_active": 5,
      "security_lanes_total": 6
    }
  ],
  "zones": [
    {
      "id": "stand_a",
      "name": "Stand A (North)",
      "density": "Medium",
      "current_count": 9500,
      "capacity": 12000,
      "gates": ["gate_1", "gate_2"]
    },
    {
      "id": "stand_b",
      "name": "Stand B (East)",
      "density": "High",
      "current_count": 14200,
      "capacity": 15000,
      "gates": ["gate_2", "gate_3"]
    },
    {
      "id": "stand_c",
      "name": "Stand C (South)",
      "density": "Low",
      "current_count": 3000,
      "capacity": 10000,
      "gates": ["gate_4"]
    },
    {
      "id": "stand_d",
      "name": "Stand D (West)",
      "density": "Medium",
      "current_count": 7800,
      "capacity": 11000,
      "gates": ["gate_4", "gate_5"]
    },
    {
      "id": "stand_e",
      "name": "Stand E (Club/VIP)",
      "density": "Low",
      "current_count": 1200,
      "capacity": 5000,
      "gates": ["gate_1"]
    },
    {
      "id": "stand_f",
      "name": "Stand F (Upper concourse)",
      "density": "High",
      "current_count": 11500,
      "capacity": 13000,
      "gates": ["gate_6"]
    }
  ],
  "staff": [
    {
      "id": "staff_1",
      "name": "Officer Sarah Jenkins",
      "role": "Security",
      "zone": "Stand A (North)",
      "status": "Active",
      "tasks": ["Monitor VIP gate flow", "Inspect bag check Lane 2"]
    },
    {
      "id": "staff_2",
      "name": "Officer David Rao",
      "role": "Security",
      "zone": "Stand B (East)",
      "status": "Dispatched",
      "tasks": ["Assist at congested Gate 2", "Patrol upper concourse"]
    },
    {
      "id": "staff_3",
      "name": "Medic Elena Rostova",
      "role": "Medical",
      "zone": "Stand B (East)",
      "status": "Active",
      "tasks": ["Standby at First Aid Station 2"]
    },
    {
      "id": "staff_4",
      "name": "Medic Marcus Vance",
      "role": "Medical",
      "zone": "Stand D (West)",
      "status": "Active",
      "tasks": ["Standby at First Aid Station 4"]
    },
    {
      "id": "staff_5",
      "name": "Tech Alice Wong",
      "role": "Maintenance",
      "zone": "Stand C (South)",
      "status": "Active",
      "tasks": ["Check digital signage at Stand C"]
    },
    {
      "id": "staff_6",
      "name": "Tech Carlos Mendez",
      "role": "Maintenance",
      "zone": "Stand F (Upper concourse)",
      "status": "Active",
      "tasks": ["Repair turnstile at Gate 6"]
    },
    {
      "id": "staff_7",
      "name": "Usher Emily Chen",
      "role": "Usher",
      "zone": "Stand B (East)",
      "status": "Active",
      "tasks": ["Direct ticket holders to Block 204"]
    },
    {
      "id": "staff_8",
      "name": "Usher James Smith",
      "role": "Usher",
      "zone": "Stand D (West)",
      "status": "Active",
      "tasks": ["Assist wheelchair seating in Row 12"]
    },
    {
      "id": "staff_9",
      "name": "Supervisor Robert Duval",
      "role": "Supervisor",
      "zone": "Stand E (Club/VIP)",
      "status": "Active",
      "tasks": ["Oversee overall operations"]
    },
    {
      "id": "staff_10",
      "name": "Officer Sam Wilson",
      "role": "Security",
      "zone": "Stand C (South)",
      "status": "Active",
      "tasks": ["Patrol exterior perimeter"]
    }
  ],
  "incidents": [
    {
      "id": "INC-001",
      "category": "Crowd",
      "severity": "High",
      "location": "Gate 2",
      "status": "Dispatched",
      "description": "Heavy backlog at ticket scanners. Crowd pressure mounting.",
      "timestamp": "2026-07-19T10:30:00Z",
      "assigned_staff": ["staff_2"],
      "ai_recommendation_why": "Officer Rao (Security) was dispatched because he was stationed in Stand B (East) next to Gate 2 and was unassigned."
    },
    {
      "id": "INC-002",
      "category": "Maintenance",
      "severity": "Medium",
      "location": "Stand C (South)",
      "status": "Reported",
      "description": "Broken beer tap leaking in concession area C4.",
      "timestamp": "2026-07-19T10:45:00Z",
      "assigned_staff": [],
      "ai_recommendation_why": "Recommend assigning Tech Alice Wong, who is stationed in Stand C (South) and currently on active duty."
    }
  ]
}

class StadiumDataManager:
    def __init__(self, filepath: str):
        self.filepath = filepath
        self.lock = threading.Lock()
        self.data = {}
        self.load()

    def load(self):
        with self.lock:
            if os.path.exists(self.filepath):
                try:
                    with open(self.filepath, "r") as f:
                        self.data = json.load(f)
                except Exception:
                    self.data = copy.deepcopy(PRISTINE_SEED)
                    self.save_to_disk()
            else:
                self.data = copy.deepcopy(PRISTINE_SEED)
                self.save_to_disk()

    def save_to_disk(self):
        # Assumes lock is held
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        with open(self.filepath, "w") as f:
            json.dump(self.data, f, indent=2)

    def get_all(self):
        with self.lock:
            return copy.deepcopy(self.data)

    def reset(self):
        with self.lock:
            self.data = copy.deepcopy(PRISTINE_SEED)
            self.save_to_disk()
            return copy.deepcopy(self.data)

    def update_gate(self, gate_id: str, status: str = None, flow_rate: int = None, wait_time: int = None, security_lanes_active: int = None):
        with self.lock:
            for gate in self.data.get("gates", []):
                if gate["id"] == gate_id:
                    if status is not None:
                        gate["status"] = status
                    if flow_rate is not None:
                        gate["flow_rate"] = flow_rate
                    if wait_time is not None:
                        gate["wait_time"] = wait_time
                    if security_lanes_active is not None:
                        gate["security_lanes_active"] = security_lanes_active
                    self.save_to_disk()
                    return copy.deepcopy(gate)
            return None

    def update_zone_density(self, zone_id: str, density: str, current_count: int = None):
        with self.lock:
            for zone in self.data.get("zones", []):
                if zone["id"] == zone_id:
                    zone["density"] = density
                    if current_count is not None:
                        zone["current_count"] = current_count
                    self.save_to_disk()
                    return copy.deepcopy(zone)
            return None

    def add_incident(self, category: str, severity: str, location: str, description: str, ai_why: str = ""):
        with self.lock:
            incidents = self.data.setdefault("incidents", [])
            inc_id = f"INC-{len(incidents) + 1:03d}"
            
            import datetime
            now_iso = datetime.datetime.utcnow().isoformat() + "Z"
            
            new_incident = {
                "id": inc_id,
                "category": category,
                "severity": severity,
                "location": location,
                "status": "Reported",
                "description": description,
                "timestamp": now_iso,
                "assigned_staff": [],
                "ai_recommendation_why": ai_why
            }
            incidents.append(new_incident)
            self.save_to_disk()
            return copy.deepcopy(new_incident)

    def dispatch_staff(self, incident_id: str, staff_ids: list[str]):
        with self.lock:
            # 1. Update incident
            target_incident = None
            for inc in self.data.get("incidents", []):
                if inc["id"] == incident_id:
                    inc["assigned_staff"] = staff_ids
                    inc["status"] = "Dispatched"
                    target_incident = inc
                    break
            
            # 2. Update staff status
            if target_incident:
                for staff in self.data.get("staff", []):
                    if staff["id"] in staff_ids:
                        staff["status"] = "Dispatched"
                        task_desc = f"RESPONDING TO {incident_id}: {target_incident['description']}"
                        if task_desc not in staff["tasks"]:
                            staff["tasks"].insert(0, task_desc)
                self.save_to_disk()
            
            return copy.deepcopy(target_incident)

    def resolve_incident(self, incident_id: str):
        with self.lock:
            target_incident = None
            for inc in self.data.get("incidents", []):
                if inc["id"] == incident_id:
                    inc["status"] = "Resolved"
                    target_incident = inc
                    break
            
            if target_incident:
                # Release dispatched staff back to active
                assigned = target_incident.get("assigned_staff", [])
                for staff in self.data.get("staff", []):
                    if staff["id"] in assigned:
                        staff["status"] = "Active"
                        # Keep the task history but mark responded tasks as done
                        staff["tasks"] = [t for t in staff["tasks"] if not t.startswith(f"RESPONDING TO {incident_id}")]
                self.save_to_disk()
            
            return copy.deepcopy(target_incident)

    def update_staff_task(self, staff_id: str, task_index: int, completed: bool):
        with self.lock:
            for staff in self.data.get("staff", []):
                if staff["id"] == staff_id:
                    if 0 <= task_index < len(staff["tasks"]):
                        if completed:
                            task = staff["tasks"][task_index]
                            if not task.startswith("[COMPLETED] "):
                                staff["tasks"][task_index] = f"[COMPLETED] {task}"
                        else:
                            task = staff["tasks"][task_index]
                            if task.startswith("[COMPLETED] "):
                                staff["tasks"][task_index] = task.replace("[COMPLETED] ", "", 1)
                        self.save_to_disk()
                        return copy.deepcopy(staff)
            return None

# Singleton-like instance target path
DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "stadium_mock_data.json"))
data_manager = StadiumDataManager(DATA_PATH)
