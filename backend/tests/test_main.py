from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_get_dashboard_data():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "gates" in data
    assert "zones" in data
    assert "staff" in data
    assert "incidents" in data


def test_update_gate_status():
    payload = {
        "gate_id": "gate_1",
        "status": "Closed",
        "flow_rate": 0,
        "wait_time": 0,
        "security_lanes_active": 0,
    }
    response = client.post("/api/gates/update", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "Closed"

    # Test 404
    payload["gate_id"] = "invalid_gate"
    response = client.post("/api/gates/update", json=payload)
    assert response.status_code == 404


def test_update_zone_density():
    payload = {"zone_id": "stand_a", "density": "Critical", "current_count": 12000}
    response = client.post("/api/zones/update", json=payload)
    assert response.status_code == 200
    assert response.json()["density"] == "Critical"

    # Test 404
    payload["zone_id"] = "invalid_zone"
    response = client.post("/api/zones/update", json=payload)
    assert response.status_code == 404


@patch("app.main.triage_incident", new_callable=AsyncMock)
def test_report_incident(mock_triage):
    mock_triage.return_value = {
        "category": "Medical",
        "severity": "High",
        "recommended_staff_id": "staff_3",
        "ai_recommendation_why": "Staff member is close by.",
    }
    payload = {
        "location": "Stand A",
        "description": "A fan needs medical assistance.",
    }
    response = client.post("/api/incidents", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Medical"
    assert data["severity"] == "High"
    assert data["recommended_staff_id"] == "staff_3"


def test_dispatch_resolve_incident():
    # Reset first to ensure INC-001 exists and staff_2 is active
    client.post("/api/reset")

    payload = {"staff_ids": ["staff_2"]}
    response = client.post("/api/incidents/INC-001/dispatch", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "Dispatched"

    # Test 404 dispatch
    response = client.post("/api/incidents/INC-XYZ/dispatch", json=payload)
    assert response.status_code == 404

    # Resolve
    response = client.post("/api/incidents/INC-001/resolve")
    assert response.status_code == 200
    assert response.json()["status"] == "Resolved"

    # Test 404 resolve
    response = client.post("/api/incidents/INC-XYZ/resolve")
    assert response.status_code == 404


def test_update_staff_task_status():
    payload = {"task_index": 0, "completed": True}
    response = client.post("/api/staff/staff_1/task", json=payload)
    assert response.status_code == 200

    # Test 404
    response = client.post("/api/staff/invalid_staff/task", json=payload)
    assert response.status_code == 404


@patch("app.main.generate_pa_announcement", new_callable=AsyncMock)
def test_generate_pa_alert(mock_gen_pa):
    mock_gen_pa.return_value = {
        "en": "Attention please.",
        "es": "Atencion por favor.",
        "fr": "Attention s'il vous plait.",
    }
    response = client.post("/api/incidents/INC-001/announcement")
    assert response.status_code == 200
    data = response.json()
    assert data["en"] == "Attention please."

    # Test 404
    response = client.post("/api/incidents/INC-XYZ/announcement")
    assert response.status_code == 404


@patch("app.main.ask_copilot", new_callable=AsyncMock)
def test_copilot_chat(mock_ask):
    mock_ask.return_value = "This is a copilot response."
    payload = {"role": "fan", "query": "How to exit Stand B?"}
    response = client.post("/api/copilot/chat", json=payload)
    assert response.status_code == 200
    assert response.json()["answer"] == "This is a copilot response."


@patch("app.main.triage_incident", new_callable=AsyncMock)
def test_simulate_event(mock_triage):
    mock_triage.return_value = {
        "category": "Crowd",
        "severity": "Critical",
        "recommended_staff_id": "staff_2",
        "ai_recommendation_why": "Closest staff.",
    }
    payload = {"event_type": "crowd_surge"}
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    assert "incident" in response.json()
