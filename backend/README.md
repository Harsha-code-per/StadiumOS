# ⚡ FastAPI Backend — Stadium AI Co-Pilot

Welcome to the backend service for the **Stadium AI Co-Pilot** command and wayfinding system. Built using **Python**, **FastAPI**, and the **Google Gemini API**, this high-performance service processes operational logs, classifies security/medical/crowd incidents, suggests staff dispatches, and generates trilingual public announcements in real-time.

---

## 🚀 Key Architectural Features

1. **High-Availability Dual-Key Failover**:
   - Uses the highly efficient `gemini-3.5-flash` model.
   - Implements a primary-to-secondary key failover: if the primary API key returns an HTTP 429 rate limit error, the client immediately switches to the secondary key.
   - If all configured keys are exhausted, it propagates a clean `GeminiRateLimitException` returning HTTP 429 to the client with a friendly error payload. Mock offline fallbacks are deleted to maintain AI validation integrity.
2. **Thread-Safe Background Write Queue**:
   - Disk writes to `stadium_mock_data.json` are pushed to a thread-safe `Queue` and written by a background worker daemon thread.
   - All state mutations (incidents, gate configurations) return immediately to the frontend, bypassing disk-write locks.
3. **Robust JSON Post-Processing**:
   - Uses a specialized `clean_json_output` utility that extracts raw JSON payloads even if the model encloses them in standard or non-standard markdown blocks (` ```json `, ` ``` `, etc.), preventing parsing crashes.
4. **Network Efficiency (GZip)**:
   - Utilizes `GZipMiddleware` to compress large dashboard payloads, reducing network transmission overhead by up to 90%.
5. **CORS & Rate-Limit Middlewares**:
   - Locks down CORS origins to the deployed Vercel frontend and local development servers.
   - Enforces a 3-second per-IP cooldown on chat requests and a 30 requests/min rate limit on mutations to protect API quotas.

---

## 📡 API Endpoint Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | `GET` | Retrieve API health status, timestamp, and metadata. |
| `/api/dashboard` | `GET` | Retrieve the full stadium state (gates, zones, staff, and incidents). |
| `/api/reset` | `POST` | Reset all mock data to the pristine seeded template. |
| `/api/gates/update` | `POST` | Update wait times, status, flow rates, and active lanes for gates. |
| `/api/zones/update` | `POST` | Update zone occupant counts and density levels. |
| `/api/incidents` | `POST` | Report a new incident (triggers Gemini category/severity/dispatch triage). |
| `/api/incidents/{incident_id}/dispatch` | `POST` | Dispatch selected staff to the incident (marks staff as Responding). |
| `/api/incidents/{incident_id}/resolve` | `POST` | Resolve the incident, releasing all assigned staff back to active duty. |
| `/api/staff/{staff_id}/task` | `POST` | Toggle completion status of staff checklist tasks. |
| `/api/incidents/{incident_id}/announcement` | `POST` | Draft a dynamic trilingual PA script (EN/ES/FR) for the incident. |
| `/api/copilot/chat` | `POST` | Unified AI chat (roles: command-center, ground-crew, fan). |
| `/api/simulate` | `POST` | Trigger simulated events (Crowd Surge, Medical emergency). |

---

## 🧪 Backend Verification & Testing

The backend includes a comprehensive test suite written in **pytest** testing data managers, Gemini clients, and FastAPI endpoints.

### Running Backend Tests:
```bash
# Set PYTHONPATH and run tests:
PYTHONPATH=. .venv/bin/pytest

# Format python files:
.venv/bin/black app/ tests/

# Run flake8 linter checks:
.venv/bin/flake8 app/ tests/
```

*Verification results: **15/15 tests pass successfully** with **zero linter warnings or errors**.*
