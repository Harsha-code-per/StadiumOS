import os
import pytest
from app.data_manager import StadiumDataManager

TEST_FILEPATH = "/home/hk/StadiumOS/backend/data/test_stadium_mock_data.json"


@pytest.fixture(autouse=True)
def run_around_tests():
    # Setup - delete existing test files
    if os.path.exists(TEST_FILEPATH):
        os.remove(TEST_FILEPATH)
    yield
    # Teardown - cleanup files
    if os.path.exists(TEST_FILEPATH):
        os.remove(TEST_FILEPATH)


def test_initialization():
    manager = StadiumDataManager(TEST_FILEPATH)
    data = manager.get_all()
    assert len(data["gates"]) == 6
    assert len(data["zones"]) == 6
    assert len(data["staff"]) == 10


def test_update_gate():
    manager = StadiumDataManager(TEST_FILEPATH)
    gate = manager.update_gate("gate_2", status="Open", wait_time=5)
    assert gate["status"] == "Open"
    assert gate["wait_time"] == 5

    # Wait for background write queue to flush to disk
    manager.write_queue.join()

    # Reload and check persistency
    new_manager = StadiumDataManager(TEST_FILEPATH)
    gates = new_manager.get_all()["gates"]
    target = next(g for g in gates if g["id"] == "gate_2")
    assert target["status"] == "Open"
    assert target["wait_time"] == 5


def test_add_incident_and_resolve():
    manager = StadiumDataManager(TEST_FILEPATH)
    inc = manager.add_incident(
        category="Medical",
        severity="High",
        location="Gate 3",
        description="Fan dizzy in queue",
        ai_why="Medic Elena is stationed in Stand B (adjacent to Gate 3).",
    )
    assert inc["id"].startswith("INC-")
    assert inc["category"] == "Medical"
    assert inc["status"] == "Reported"

    # Dispatch staff
    manager.dispatch_staff(inc["id"], ["staff_3"])
    all_data = manager.get_all()
    inc_dispatched = next(i for i in all_data["incidents"] if i["id"] == inc["id"])
    assert inc_dispatched["status"] == "Dispatched"
    assert "staff_3" in inc_dispatched["assigned_staff"]

    staff_Elena = next(s for s in all_data["staff"] if s["id"] == "staff_3")
    assert staff_Elena["status"] == "Dispatched"
    assert staff_Elena["tasks"][0].startswith("RESPONDING TO")

    # Resolve
    manager.resolve_incident(inc["id"])
    all_data_2 = manager.get_all()
    inc_resolved = next(i for i in all_data_2["incidents"] if i["id"] == inc["id"])
    assert inc_resolved["status"] == "Resolved"

    staff_Elena_active = next(s for s in all_data_2["staff"] if s["id"] == "staff_3")
    assert staff_Elena_active["status"] == "Active"
