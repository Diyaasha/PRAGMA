# PRAGMA — Enterprise Refactor Plan
*Generated: 2026-06-24 | Principal Architect*

## Executive Summary

PRAGMA is an air-gapped regulatory compliance intelligence platform for Canara Bank.
This document tracks all P0/P1/P2 work items for the Suraksha Cyber Hackathon demo.

---

## P0 — Must Complete Before Demo

### ✅ P0-1: SQLite Migration
- Replaced Neon PostgreSQL with SQLite (file-based, zero installation)
- Custom `UUIDType` for cross-platform UUID columns
- `create_all_tables()` runs at startup — no migration tool needed
- **Status: COMPLETE**

### ✅ P0-2: Remove External AI APIs
- Removed `anthropic==0.28.0` from requirements
- Lazy-import `claude_service.py` (dead code, never called)
- All inference routed through local Ollama or rule-based extractor
- **Status: COMPLETE**

### ✅ P0-3: Self-Hosted Fonts
- Removed Google Fonts CDN links from `index.html`
- IBM Plex Sans / Mono / Serif bundled via `@fontsource` (Vite build)
- Zero CDN calls at runtime
- **Status: COMPLETE**

### ✅ P0-4: Ollama + Rule-Based AI Engine
- Ollama service: auto-discovers best available model (qwen3:8b > llama3.1:8b > phi3.5)
- Rule extractor: regex/NLP fallback, always works, zero network
- `ai_engine.py`: unified router, never raises, returns `(maps, engine_used)`
- **Status: COMPLETE**

### ✅ P0-5: Offline Document Parsing (PDF/DOCX)
- `document_parser.py`: PyMuPDF (PDF), python-docx (DOCX), built-in (TXT)
- `/circulars/upload-file` endpoint: accepts multipart/form-data file upload
- Frontend sends files via FormData to backend, no client-side parsing
- **Status: COMPLETE**

### ✅ P0-6: Feed Service Offline Safety
- `feed_service.py`: graceful empty return when offline or deps missing
- All external HTTP calls wrapped in try/except
- Not wired to any demo-path API endpoint
- **Status: COMPLETE**

### ✅ P0-7: URL Import Offline Warning
- `CircularUpload.jsx` URL tab now shows offline warning instead of failing silently
- Directs users to file upload or text paste
- **Status: COMPLETE**

### ✅ P0-8: Demo Hardening
- `POST /demo/reset`: wipes DB + re-seeds 3 circulars + 14 MAPs in one click
- `GET /demo/status`: returns row counts for readiness check
- `seed_demo.py`: standalone script for initial demo data population
- `reset_availability_cache()`: forces Ollama re-check after reset
- **Status: COMPLETE**

### ✅ P0-9: Tri-State System Status
- `useBackendStatus.js`: healthy / degraded / offline states
- TopBar shows AI engine label and status pill
- Footer shows "Local AI Engine · FastAPI · SQLite"
- **Status: COMPLETE**

### ✅ P0-10: Product Positioning — Remove Claude References
- All "Claude AI" strings replaced with "Local AI Engine" / "Air-Gapped Intelligence"
- Sidebar masthead: "Air-Gapped Intelligence"
- Event log actors: "PRAGMA AI Engine (phi3.5)"
- Footer: "Local AI Engine · FastAPI · SQLite"
- **Status: COMPLETE**

---

## P0 — Implemented This Session

### ✅ P0-11: Compliance Impact Simulator (Flagship Feature 1)
- `POST /simulate`: full impact analysis without saving to DB
- Returns: risk score (0-100), affected departments, effort weeks, implementation sequence, overlap analysis
- `SimulateView.jsx`: RiskGauge SVG, KPI cards, department heatmap, sequence list
- Accessible from Sidebar: Impact Simulator
- **Status: COMPLETE**

### ✅ P0-12: Compliance Traceability Graph (Flagship Feature 2)
- `TraceabilityGraph.jsx`: React Flow interactive graph
- Nodes: Circular → MAP → Department
- Auto-layout with circular/priority/dept node types
- Filter by circular
- MiniMap, Controls, pan/zoom
- Accessible from Sidebar: Trace Graph
- **Status: COMPLETE**

### ✅ P0-13: Ollama Model Auto-Discovery
- `ollama_service.py`: scans pulled models, selects best from priority list
- Priority: qwen3:8b > qwen3:4b > llama3.1:8b > llama3.2:3b > phi3.5
- Handles qwen3 `<think>` tags in output
- Active model cached and reused for session duration
- **Status: COMPLETE**

### ✅ P0-14: Offline Audit Documentation
- `AIR_GAP_AUDIT.md`: full internet dependency audit with confidence scores
- `OFFLINE_DEMO_CHECKLIST.md`: step-by-step demo validation checklist
- `ENTERPRISE_REFACTOR_PLAN.md`: this document
- **Status: COMPLETE**

---

## P1 — High Value, Should Complete

### P1-1: Performance Optimization
- Current polling: 30s (was 5s) — ✅ already fixed
- Page navigation: uses module-level cache — ✅ already implemented
- Bundle size: 757 KB JS (large) — code splitting via dynamic imports
- **Target: < 500 KB main bundle**

Implementation:
```js
// App.jsx — lazy load heavy pages
const TraceabilityGraph = lazy(() => import('./pages/TraceabilityGraph'))
const SimulateView      = lazy(() => import('./pages/SimulateView'))
```

### P1-2: MAP Confidence Scores in UI
- Backend already returns `confidence_score` from AI extraction
- UI should display confidence % badges on MAP cards
- Low confidence (<60%) should trigger visual warning

### P1-3: Circular Content Search
- Add full-text search over circular content
- SQLite FTS5 extension or Python-level search
- Enable "find all circulars mentioning X" feature

### P1-4: Export MAPs as PDF/Excel
- Let compliance officers export the MAP register
- Pure Python: reportlab (PDF) or openpyxl (Excel)
- Zero internet required

### P1-5: Department Dashboard Views
- Per-department compliance dashboard
- IT / Compliance / Risk / Treasury / Legal views
- Filter MAPs by owner department

---

## P2 — Nice to Have

### P2-1: Automated Test Suite
- pytest integration tests for all API endpoints
- Mock Ollama for CI (no model required)
- Coverage target: 80%

### P2-2: DOCX Report Generation
- Generate compliance status report as Word document
- python-docx (already installed)

### P2-3: Multi-User Authentication
- JWT-based auth for compliance officers
- Role-based access: Officer / Manager / Admin
- FastAPI OAuth2 flow (local, no cloud auth)

### P2-4: Regulatory Calendar
- Timeline view of all deadlines
- Overdue / upcoming / this-week bands
- Export to iCal format

### P2-5: Evidence Attachment
- Allow officers to attach evidence files to MAPs
- Store in local filesystem (demo) or blob (production)
- Link evidence to approval records

---

## Architecture Decision Log

| Decision | Rationale | Alternatives Rejected |
|----------|-----------|----------------------|
| SQLite over PostgreSQL | Zero install, file-portable, demo-reliable | Neon (internet), PG (requires server) |
| Ollama over llama.cpp | Easy model switching, REST API, active ecosystem | llama.cpp (CLI only), ctransformers (slower) |
| llama3.1:8b as default | Wide availability, proven extraction quality | qwen3:8b (newer, may not be pulled), phi3.5 (weaker reasoning) |
| @fontsource over CDN | Zero network dependency, Vite-bundled | Google Fonts (internet), base64 embed (huge CSS) |
| React Flow for graph | Production-quality, pan/zoom, customizable nodes | D3 (more code), vis.js (React compat issues) |
| PyMuPDF for PDF | Fast, accurate, no server deps | pdfplumber (slower), PyPDF2 (less accurate), cloud OCR (internet) |

---

## Demo Script Narrative

**Opening:** "PRAGMA is an air-gapped compliance intelligence platform. Right now, your WiFi is off. Watch."

**Step 1 — Upload:** Paste RBI Digital Lending circular → AI extracts 5 MAPs in < 60 seconds

**Step 2 — Simulate:** Paste SEBI CSCRF draft → Impact Simulator predicts 42 person-weeks, Risk 67/100

**Step 3 — Trace:** Open Traceability Graph → Show complete provenance from circular to department to events

**Step 4 — Approve:** Compliance officer reviews and approves Critical MAP → Audit trail created

**Step 5 — Reset:** Click Demo Reset → Fresh state in 3 seconds → Repeat for judges

**Closing:** "Everything you just saw ran on this laptop. No cloud. No API keys. No internet."
