# PRAGMA — Offline Demo Checklist
*Last updated: 2026-06-24 | For Suraksha Cyber Hackathon 2.0*

## Pre-Demo Setup (Do Before Disconnecting Internet)

### One-Time Setup
```bash
# 1. Pull preferred Ollama model (before going offline)
ollama pull llama3.1:8b      # 4.7 GB — recommended
# OR smaller alternative:
ollama pull phi3.5           # 2.2 GB — faster on weak hardware

# 2. Install Python dependencies
cd backend
pip install -r requirements.txt

# 3. Seed the demo database
python seed_demo.py

# 4. Build the frontend (bundles all assets)
cd ../frontend
npm install
npm run build
```

### Verify Offline Readiness
```bash
# Backend check
cd backend
python -c "from app.main import app; print('✓ Backend imports clean')"

# Ollama check
curl http://localhost:11434/api/tags | python -m json.tool
```

---

## Demo Day Checklist (Internet OFF)

### System Startup
- [ ] Start Ollama: `ollama serve`
- [ ] Start backend: `cd backend && uvicorn app.main:app --reload`
- [ ] Start frontend: `cd frontend && npm run dev`
- [ ] Open browser: `http://localhost:3000`

### Feature Verification (all must pass offline)

#### ✓ Dashboard
- [ ] Dashboard loads without spinner freeze
- [ ] Compliance score visible
- [ ] Active MAPs count shown
- [ ] Overdue MAPs count shown
- [ ] Department workload widget populated
- [ ] No error banners

#### ✓ Document Upload — Text Paste (PRIMARY DEMO PATH)
- [ ] Navigate to New Circular
- [ ] Paste RBI/SEBI circular text
- [ ] Click "Extract MAPs with Local AI Engine"
- [ ] Processing stages animate (Upload → AI Reading → Routing → Done)
- [ ] MAPs appear with priorities, departments, deadlines
- [ ] Engine used shown ("ollama" or "rule_based")

#### ✓ Document Upload — File Upload (PDF/DOCX)
- [ ] Upload a PDF file (PyMuPDF parses locally)
- [ ] Upload a DOCX file (python-docx parses locally)
- [ ] Upload a TXT file
- [ ] MAPs extracted successfully from all formats
- [ ] No external service called

#### ✓ AI Extraction Review
- [ ] Navigate to AI Review tab
- [ ] Extracted MAPs visible with clause highlighting
- [ ] Source clause traceability shown
- [ ] Confidence scores displayed

#### ✓ Action Points (MAP Register)
- [ ] All MAPs listed and filterable
- [ ] Priority filter works
- [ ] Department filter works
- [ ] Status filter works
- [ ] Status advancement works (In Progress → Completed)

#### ✓ Impact Simulator (Flagship Feature)
- [ ] Navigate to Impact Simulator
- [ ] Paste a new regulatory circular
- [ ] Click Analyze Impact
- [ ] Risk score gauge visible
- [ ] Affected departments listed
- [ ] Implementation sequence shown
- [ ] Overlap analysis completed
- [ ] All computed locally (no external call)

#### ✓ Compliance Traceability Graph (Flagship Feature)
- [ ] Navigate to Trace Graph
- [ ] Interactive graph renders
- [ ] Circular nodes visible
- [ ] MAP nodes connected
- [ ] Department nodes shown
- [ ] Pan and zoom works
- [ ] Filter by circular works

#### ✓ Approval Workflow
- [ ] Navigate to Approvals
- [ ] Pending MAPs listed
- [ ] Approve a MAP — status updates
- [ ] Reject a MAP — status updates
- [ ] Audit log entry created

#### ✓ Audit Log
- [ ] Navigate to Audit Log
- [ ] All events listed (upload, extraction, approval, status changes)
- [ ] Event types shown with icons
- [ ] Timestamps visible

#### ✓ Demo Reset
- [ ] POST /demo/reset wipes and re-seeds cleanly
- [ ] Dashboard shows fresh scenario instantly
- [ ] Repeat extraction works on reset data

#### ✓ Health Endpoint
- [ ] GET http://localhost:8000/health returns 200
- [ ] `"offline_mode": true` in response
- [ ] AI engine status shown
- [ ] Correct model name shown

---

## What DOES NOT Work Offline (By Design)

| Feature | Status | Reason |
|---------|--------|--------|
| URL Import tab | ⚠️ Degraded | Shows warning — use file upload instead |
| RBI/SEBI RSS Feeds | ⚠️ Graceful empty | Feed service returns [] without error |
| PostgreSQL cloud DB | N/A | SQLite used for demo |

---

## Emergency Recovery

If Ollama is slow or unresponsive:
```bash
# Force rule-based extraction (always works, instant)
# In backend/.env, set:
AI_ENGINE=rule_based
# Restart backend — rule extractor needs zero dependencies
```

If database is corrupt:
```bash
cd backend
rm pragma_demo.db
python seed_demo.py  # recreates + reseeds
```

If frontend fails:
```bash
cd frontend
npm run build
# Serve the dist/ folder with any static server
npx serve dist -p 3000
```

---

## Performance Benchmarks (Target)

| Operation | Target | Engine |
|-----------|--------|--------|
| Page navigation | < 100ms | React cache |
| Dashboard load | < 500ms | SQLite + cache |
| Text extraction (Ollama) | 30-90s | phi3.5/llama3.1 on CPU |
| Text extraction (Rule) | < 1s | Pure Python regex |
| Impact simulation (Ollama) | 30-90s | CPU inference |
| Impact simulation (Rule) | < 2s | Pure Python |
| Demo reset | < 3s | SQLite bulk insert |
