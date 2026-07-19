"""
Stadium AI Co-Pilot API Backend.
Handles routing, rate limiting, GZip compression, mock state resets,
incident reporting, and unified Gemini-powered operations chats.
"""

import time
import datetime
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from app.schemas import (
    GateUpdateInput,
    ZoneDensityUpdateInput,
    IncidentReportInput,
    IncidentDispatchInput,
    ChatRequestInput,
    SimulationInput,
    TaskUpdateInput,
)
from app.data_manager import data_manager
from app.gemini_client import (
    triage_incident,
    generate_pa_announcement,
    ask_copilot,
    GeminiRateLimitException,
)

app = FastAPI(title="Stadium AI Co-Pilot Backend", version="1.0.0")

# CORS setup — restrict to the actual deployed Vercel frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://stadium-os-chi.vercel.app",
        "http://localhost:3000",  # Allow local dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Custom In-Memory Rate Limiting Middleware
IP_LIMITS = {}  # ip -> list of timestamps
CHAT_COOLDOWNS = {}  # ip -> last_timestamp


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    path = request.url.path

    # 3-second chat request cooldown to prevent rapid double-clicks
    if path.startswith("/api/copilot/chat"):
        ip = request.client.host if request.client else "unknown"
        now = time.time()
        last_time = CHAT_COOLDOWNS.get(ip, 0.0)
        if now - last_time < 3.0:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "rate_limited",
                    "message": "AI is temporarily busy — try again shortly.",
                },
            )
        CHAT_COOLDOWNS[ip] = now

    # General rate limiting (max 30 requests per minute)
    if (
        path.startswith("/api/copilot/chat")
        or path.startswith("/api/incidents")
        or path.startswith("/api/simulate")
    ):
        ip = request.client.host if request.client else "unknown"
        now = time.time()
        timestamps = IP_LIMITS.setdefault(ip, [])
        IP_LIMITS[ip] = [t for t in timestamps if now - t < 60]

        if len(IP_LIMITS[ip]) >= 30:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests. Rate limit is 30 requests per minute."
                },
            )
        IP_LIMITS[ip].append(now)

    response = await call_next(request)
    return response


@app.exception_handler(GeminiRateLimitException)
async def gemini_rate_limit_handler(request: Request, exc: GeminiRateLimitException):
    return JSONResponse(
        status_code=429, content={"error": "rate_limited", "message": str(exc)}
    )


@app.get("/api/health")
def health_check():
    """System health status check."""
    return {
        "status": "ok",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "service": "StadiumOS Backend",
        "model_cascade_enabled": True,
    }


@app.get("/api/dashboard")
def get_dashboard_data():
    """Retrieve full stadium operational dashboard state."""
    return data_manager.get_all()


@app.post("/api/reset")
def reset_stadium_data():
    """Reset mock database state to original seeded parameters."""
    reset_data = data_manager.reset()
    return {
        "message": "Stadium data successfully reset to baseline seed.",
        "data": reset_data,
    }


@app.post("/api/gates/update")
def update_gate_status(payload: GateUpdateInput):
    """Update gate operation settings (status, wait time, flow rates)."""
    updated_gate = data_manager.update_gate(
        gate_id=payload.gate_id,
        status=payload.status,
        flow_rate=payload.flow_rate,
        wait_time=payload.wait_time,
        security_lanes_active=payload.security_lanes_active,
    )
    if not updated_gate:
        raise HTTPException(
            status_code=404, detail=f"Gate with id {payload.gate_id} not found."
        )
    return updated_gate


@app.post("/api/zones/update")
def update_zone_density(payload: ZoneDensityUpdateInput):
    """Update standing zone crowd density parameters."""
    updated_zone = data_manager.update_zone_density(
        zone_id=payload.zone_id,
        density=payload.density,
        current_count=payload.current_count,
    )
    if not updated_zone:
        raise HTTPException(
            status_code=404, detail=f"Zone with id {payload.zone_id} not found."
        )
    return updated_zone


@app.post("/api/incidents")
async def report_incident(payload: IncidentReportInput):
    """
    Report a new operational incident.
    Triggers Gemini reasoning to automatically categorize, assess severity,
    recommend appropriate staff from roster, and provide reasoning explanation.
    """
    stadium_state = data_manager.get_all()

    # Run Gemini AI classification
    triage_result = await triage_incident(payload.description, stadium_state)

    category = triage_result.get("category", "Security")
    severity = triage_result.get("severity", "Medium")
    ai_why = triage_result.get(
        "ai_recommendation_why", "Recommended based on incident category."
    )

    # Add incident with AI insights
    new_incident = data_manager.add_incident(
        category=category,
        severity=severity,
        location=payload.location,
        description=payload.description,
        ai_why=ai_why,
    )

    # Expose the AI recommended staff ID as a suggestion parameter (UI parses this)
    new_incident["recommended_staff_id"] = triage_result.get("recommended_staff_id")

    return new_incident


@app.post("/api/incidents/{incident_id}/dispatch")
def dispatch_staff_to_incident(incident_id: str, payload: IncidentDispatchInput):
    """Dispatch specific ground staff roster members to an active incident."""
    updated_incident = data_manager.dispatch_staff(incident_id, payload.staff_ids)
    if not updated_incident:
        raise HTTPException(
            status_code=404, detail=f"Incident {incident_id} not found."
        )
    return updated_incident


@app.post("/api/incidents/{incident_id}/resolve")
def resolve_stadium_incident(incident_id: str):
    """Mark an incident resolved, releasing all dispatched staff back to active duty."""
    updated_incident = data_manager.resolve_incident(incident_id)
    if not updated_incident:
        raise HTTPException(
            status_code=404, detail=f"Incident {incident_id} not found."
        )
    return updated_incident


@app.post("/api/staff/{staff_id}/task")
def update_staff_task_status(staff_id: str, payload: TaskUpdateInput):
    """Update a specific staff checklist task item (complete/uncomplete)."""
    updated_staff = data_manager.update_staff_task(
        staff_id, payload.task_index, payload.completed
    )
    if not updated_staff:
        raise HTTPException(
            status_code=404, detail=f"Staff with id {staff_id} or task index not found."
        )
    return updated_staff


@app.post("/api/incidents/{incident_id}/announcement")
async def generate_pa_alert(incident_id: str):
    """Generate a trilingual PA Announcement script for the active incident."""
    # Find incident
    target_inc = None
    for inc in data_manager.get_all().get("incidents", []):
        if inc["id"] == incident_id:
            target_inc = inc
            break

    if not target_inc:
        raise HTTPException(
            status_code=404, detail=f"Incident {incident_id} not found."
        )

    announcements = await generate_pa_announcement(target_inc["description"])
    return announcements


@app.post("/api/copilot/chat")
async def copilot_chat(payload: ChatRequestInput):
    """
    Unified AI Co-Pilot chat reasoning layer.
    Accommodates roles: 'command-center', 'ground-crew', and 'fan'.
    Infan role: Injects live gate statuses and crowd stand densities to output wayfinding options.
    """
    stadium_state = data_manager.get_all()
    answer = await ask_copilot(
        role=payload.role,
        user_query=payload.query,
        mock_data=stadium_state,
        staff_id=payload.staff_id,
    )
    return {"answer": answer}


@app.post("/api/simulate")
async def simulate_event(payload: SimulationInput):
    """
    Demo Readiness: Simulates dynamic events mutating the backend state in real-time,
    triggering AI classifications and updates visible in dashboards.
    """
    event = payload.event_type

    if event == "crowd_surge":
        # Mutate Stand B density to Critical, spike Gate 2 wait time
        data_manager.update_zone_density("stand_b", "Critical", 14850)
        data_manager.update_gate(
            "gate_2",
            status="Congested",
            flow_rate=12,
            wait_time=48,
            security_lanes_active=2,
        )

        # Trigger automated incident
        description = "Sudden crowd surge in East Concourse outside Stand B. High backlog at Gate 2 security lanes."
        triage_res = await triage_incident(description, data_manager.get_all())
        new_inc = data_manager.add_incident(
            category=triage_res.get("category", "Crowd"),
            severity=triage_res.get("severity", "Critical"),
            location="Gate 2 & Stand B (East)",
            description=description,
            ai_why=triage_res.get("ai_recommendation_why", ""),
        )
        new_inc["recommended_staff_id"] = triage_res.get("recommended_staff_id")
        return {"message": "Simulated crowd surge in Stand B", "incident": new_inc}

    elif event == "medical":
        # Report medical emergency at Gate 4
        description = "Fan collapsed in security queue at Gate 4. Reports severe chest pain and dizziness."
        triage_res = await triage_incident(description, data_manager.get_all())
        new_inc = data_manager.add_incident(
            category=triage_res.get("category", "Medical"),
            severity=triage_res.get("severity", "High"),
            location="Gate 4",
            description=description,
            ai_why=triage_res.get("ai_recommendation_why", ""),
        )
        new_inc["recommended_staff_id"] = triage_res.get("recommended_staff_id")
        return {"message": "Simulated medical emergency at Gate 4", "incident": new_inc}

    elif event == "outage":
        # Report maintenance/outage at Stand D
        description = "Sudden localized power failure in Concession Area D12. Point-of-Sale registers and lights are completely offline."
        triage_res = await triage_incident(description, data_manager.get_all())
        new_inc = data_manager.add_incident(
            category=triage_res.get("category", "Maintenance"),
            severity=triage_res.get("severity", "Medium"),
            location="Stand D (West)",
            description=description,
            ai_why=triage_res.get("ai_recommendation_why", ""),
        )
        new_inc["recommended_staff_id"] = triage_res.get("recommended_staff_id")
        return {"message": "Simulated power failure at Stand D", "incident": new_inc}

    elif event == "vip_arrival":
        # Simulate VIP crowd security escorts
        description = "Official VIP delegation motorcade arriving at Gate 1 VIP stand in 5 minutes. Needs perimeter clearance."
        triage_res = await triage_incident(description, data_manager.get_all())
        new_inc = data_manager.add_incident(
            category=triage_res.get("category", "Security"),
            severity=triage_res.get("severity", "High"),
            location="Gate 1 (VIP)",
            description=description,
            ai_why=triage_res.get("ai_recommendation_why", ""),
        )
        new_inc["recommended_staff_id"] = triage_res.get("recommended_staff_id")
        return {"message": "Simulated VIP Arrival at Gate 1", "incident": new_inc}

    return {"message": "Unknown simulation type."}
