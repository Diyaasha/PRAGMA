"""
PRAGMA — Demo Utility Endpoints

Endpoints:
  POST /demo/reset   — Wipe all data and re-seed pristine demo state (single click)
  GET  /demo/status  — Return current DB row counts for demo readiness check
"""

from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.circular import Circular
from app.models.map import MAP
from app.models.approval import Approval
from app.models.event import Event
from app.models.department import Department
from app.services.event_service import log_event
from app.services.ai_engine import reset_availability_cache
from app.services.ollama_service import clear_cache as clear_prompt_cache
from app.services.provenance_service import compute_provenance_for_circular

router = APIRouter()


def _seed_demo_data(db: Session, seed: bool = True) -> dict:
    """
    Wipe all transactional data and seed a pristine, compelling demo scenario.
    Called by POST /demo/reset. Returns counts of seeded rows.
    """
    # ── Clear all transactional data ──────────────────────────────────────────
    db.query(Approval).delete()
    db.query(Event).delete()
    db.query(MAP).delete()
    db.query(Circular).delete()
    db.commit()

    # ── Ensure departments exist ───────────────────────────────────────────────
    dept_names = ["IT", "Compliance", "Risk", "Treasury", "Legal"]
    depts = {}
    for name in dept_names:
        d = db.query(Department).filter(Department.name == name).first()
        if not d:
            d = Department(name=name)
            db.add(d)
    db.commit()
    for name in dept_names:
        depts[name] = db.query(Department).filter(Department.name == name).first()

    if not seed:
        return {
            "circulars": 0,
            "maps":      0,
            "events":    0,
            "approvals": 0,
        }

    today = date.today()

    # ── Circular 1 — RBI Digital Lending ──────────────────────────────────────
    circ1 = Circular(
        title="RBI Master Direction — Digital Lending Guidelines 2024",
        source="RBI",
        content=(
            "Reserve Bank of India · Master Direction — Digital Lending\n"
            "RBI/2024-25/112\n\n"
            "Section 5 — LOAN DISBURSEMENT: All digital loan disbursements shall be made "
            "exclusively to the verified bank account of the borrower. Disbursement to any "
            "third-party account is strictly prohibited. Regulated entities shall implement "
            "real-time disbursement controls within 90 days.\n\n"
            "Section 7 — CUSTOMER ONBOARDING: Regulated entities shall implement Video "
            "Customer Identification Process (V-CIP) for all digital lending customers. "
            "KYC records shall be retained for 10 years from loan closure.\n\n"
            "Section 8 — TRANSPARENCY: A Key Fact Statement (KFS) must be provided before "
            "loan sanction disclosing APR, total repayment, all fees, and cooling-off period.\n\n"
            "Section 12 — GRIEVANCE REDRESSAL: Every regulated entity shall designate a "
            "nodal Grievance Redressal Officer. All complaints resolved within 30 days. "
            "Non-compliance attracts penal action under RBI Act 1934."
        ),
        status="processed",
        uploaded_at=datetime.utcnow() - timedelta(days=14),
    )
    db.add(circ1)
    db.commit()
    db.refresh(circ1)

    maps1 = [
        MAP(circular_id=circ1.id, department_id=depts["IT"].id,
            action="Implement real-time disbursement controls in the loan origination system to route digital loan disbursals exclusively to borrower's verified bank account and block all third-party account transfers",
            priority="Critical", deadline=today + timedelta(days=45), status="Approved",
            validation_notes="Section 5 — explicit 90-day deadline, Critical: direct customer fund flow risk.",
            created_at=datetime.utcnow() - timedelta(days=14)),
        MAP(circular_id=circ1.id, department_id=depts["Compliance"].id,
            action="Update KYC onboarding workflow to include Video Customer Identification Process (V-CIP) for all digital lending applicants and configure 10-year KYC record retention",
            priority="Critical", deadline=today + timedelta(days=45), status="Approved",
            validation_notes="Section 7 — Critical: KYC non-compliance is an immediate regulatory risk.",
            created_at=datetime.utcnow() - timedelta(days=14)),
        MAP(circular_id=circ1.id, department_id=depts["Legal"].id,
            action="Revise digital loan agreement templates to include mandatory Key Fact Statement disclosing APR, total repayment, all fees, and cooling-off period before loan sanction",
            priority="High", deadline=today + timedelta(days=20), status="In Progress",
            validation_notes="Section 8 — customer protection obligation with legal documentation implications.",
            created_at=datetime.utcnow() - timedelta(days=14)),
        MAP(circular_id=circ1.id, department_id=depts["Compliance"].id,
            action="Designate a nodal Grievance Redressal Officer, publish contact details on website and app, configure complaint tracking with 30-day SLA alerts",
            priority="Medium", deadline=today + timedelta(days=60), status="Pending",
            validation_notes="Section 12 — Medium: longer implementation window.",
            created_at=datetime.utcnow() - timedelta(days=14)),
        MAP(circular_id=circ1.id, department_id=depts["Risk"].id,
            action="Disable automatic credit limit enhancements on the lending platform and implement standalone explicit digital consent flow separate from all other borrower communications",
            priority="High", deadline=today + timedelta(days=30), status="Pending",
            validation_notes="Section 6 — unauthorised credit exposure is a direct risk event.",
            created_at=datetime.utcnow() - timedelta(days=14)),
    ]
    for m in maps1:
        db.add(m)

    # ── Circular 2 — SEBI Cybersecurity ───────────────────────────────────────
    circ2 = Circular(
        title="SEBI Circular — Cybersecurity and Cyber Resilience Framework 2024",
        source="SEBI",
        content=(
            "SEBI/HO/ITD/2024/CYB-001\n\n"
            "Para 3.1 — CYBER CRISIS MANAGEMENT: Every regulated entity shall establish a "
            "Cyber Crisis Management Plan (CCMP) and submit to SEBI within 60 days.\n\n"
            "Para 4.2 — INCIDENT REPORTING: Cyber security incidents shall be reported to "
            "SEBI within 6 hours of detection. Detailed report within 72 hours. Failure "
            "to report attracts penal action.\n\n"
            "Para 5.1 — VAPT: Regulated entities shall conduct Vulnerability Assessment and "
            "Penetration Testing at least every 6 months. Reports placed before board within "
            "30 days of completion.\n\n"
            "Para 6.1 — DATA LOCALISATION: All data of Indian investors shall be stored "
            "within India only. Cloud compliance shall be ensured immediately."
        ),
        status="processed",
        uploaded_at=datetime.utcnow() - timedelta(days=7),
    )
    db.add(circ2)
    db.commit()
    db.refresh(circ2)

    maps2 = [
        MAP(circular_id=circ2.id, department_id=depts["IT"].id,
            action="Develop and submit Cyber Crisis Management Plan (CCMP) to SEBI covering incident detection, response procedures, communication protocols, and recovery strategies",
            priority="Critical", deadline=today + timedelta(days=53), status="Pending",
            validation_notes="Para 3.1 — Critical: explicit 60-day SEBI submission deadline.",
            created_at=datetime.utcnow() - timedelta(days=7)),
        MAP(circular_id=circ2.id, department_id=depts["IT"].id,
            action="Implement automated cyber incident detection pipeline enabling SEBI notification within 6 hours and detailed incident report submission within 72 hours of any security breach",
            priority="Critical", deadline=today + timedelta(days=14), status="Pending",
            validation_notes="Para 4.2 — Critical: 6-hour reporting window with immediate penal action for non-compliance.",
            created_at=datetime.utcnow() - timedelta(days=7)),
        MAP(circular_id=circ2.id, department_id=depts["Risk"].id,
            action="Schedule bi-annual Vulnerability Assessment and Penetration Testing (VAPT) and establish board reporting within 30 days of each assessment",
            priority="High", deadline=today + timedelta(days=90), status="Pending",
            validation_notes="Para 5.1 — mandatory bi-annual requirement with board-level reporting.",
            created_at=datetime.utcnow() - timedelta(days=7)),
        MAP(circular_id=circ2.id, department_id=depts["Compliance"].id,
            action="Audit all cloud service providers for data localisation compliance ensuring all Indian investor data is stored within Indian data centres",
            priority="Critical", deadline=today + timedelta(days=7), status="Pending",
            validation_notes="Para 6.1 — Critical: immediate compliance, data sovereignty violation risk.",
            created_at=datetime.utcnow() - timedelta(days=7)),
    ]
    for m in maps2:
        db.add(m)

    # ── Circular 3 — RBI AML/KYC ──────────────────────────────────────────────
    circ3 = Circular(
        title="RBI Master Direction — Know Your Customer (KYC) and AML 2024",
        source="RBI",
        content=(
            "RBI/2024-25/87 — KYC Direction 2016 (Updated 2024)\n\n"
            "Section 16 — CUSTOMER DUE DILIGENCE: Banks shall implement Risk-Based CDD. "
            "PEPs shall be classified as High Risk with Enhanced Due Diligence. "
            "Banks shall update PEP screening lists monthly.\n\n"
            "Section 23 — TRANSACTION MONITORING: Banks shall implement automated transaction "
            "monitoring detecting structuring, layering, and smurfing. STRs filed within 7 days.\n\n"
            "Section 31 — RECORD KEEPING: All KYC records retained for 5 years. "
            "Records accessible to regulators within 48 hours of request.\n\n"
            "Section 35 — REPORTING: Quarterly AML compliance report submitted to FIU-IND "
            "within 30 days of quarter end."
        ),
        status="processed",
        uploaded_at=datetime.utcnow() - timedelta(days=3),
    )
    db.add(circ3)
    db.commit()
    db.refresh(circ3)

    maps3 = [
        MAP(circular_id=circ3.id, department_id=depts["Compliance"].id,
            action="Implement Risk-Based Customer Due Diligence framework with monthly PEP screening list updates and Enhanced Due Diligence for Politically Exposed Persons",
            priority="High", deadline=today + timedelta(days=30), status="Pending",
            validation_notes="Section 16 — mandatory RBI KYC obligation with monthly cadence.",
            created_at=datetime.utcnow() - timedelta(days=3)),
        MAP(circular_id=circ3.id, department_id=depts["IT"].id,
            action="Deploy automated transaction monitoring system detecting structuring, layering, and smurfing patterns with Suspicious Transaction Report (STR) generation within 7 days of detection",
            priority="Critical", deadline=today + timedelta(days=60), status="Pending",
            validation_notes="Section 23 — Critical: 7-day STR filing deadline; failure constitutes AML violation.",
            created_at=datetime.utcnow() - timedelta(days=3)),
        MAP(circular_id=circ3.id, department_id=depts["Compliance"].id,
            action="Audit KYC record retention infrastructure, confirm 5-year retention policy, and verify records can be produced to regulators within 48 hours on request",
            priority="Medium", deadline=today + timedelta(days=45), status="Pending",
            validation_notes="Section 31 — Medium: existing systems likely partially compliant.",
            created_at=datetime.utcnow() - timedelta(days=3)),
        MAP(circular_id=circ3.id, department_id=depts["Compliance"].id,
            action="Prepare and submit quarterly AML compliance report to Financial Intelligence Unit (FIU-IND) for the current quarter within 30 days",
            priority="High", deadline=today + timedelta(days=28), status="Pending",
            validation_notes="Section 35 — hard FIU-IND submission deadline with regulatory consequence.",
            created_at=datetime.utcnow() - timedelta(days=3)),
        MAP(circular_id=circ3.id, department_id=depts["Risk"].id,
            action="Establish AML risk scoring model to calibrate transaction monitoring alert thresholds, reducing false positives while maintaining detection sensitivity for high-risk patterns",
            priority="Medium", deadline=today + timedelta(days=90), status="Pending",
            validation_notes="Section 23 (supplementary) — risk model quality impacts STR accuracy.",
            created_at=datetime.utcnow() - timedelta(days=3)),
    ]
    for m in maps3:
        db.add(m)
    db.commit()

    # ── Approvals ──────────────────────────────────────────────────────────────
    db.refresh(maps1[0])
    db.refresh(maps1[1])
    approval_recs = [
        Approval(map_id=maps1[0].id, action="Approved",
                 notes="Cleared for immediate implementation. IT team briefed.",
                 approved_by="Compliance Officer",
                 created_at=datetime.utcnow() - timedelta(days=12)),
        Approval(map_id=maps1[1].id, action="Approved",
                 notes="Approved. Compliance to lead V-CIP onboarding redesign.",
                 approved_by="Compliance Officer",
                 created_at=datetime.utcnow() - timedelta(days=12)),
    ]
    for a in approval_recs:
        db.add(a)
    db.commit()

    # ── Audit Events ───────────────────────────────────────────────────────────
    all_events = [
        Event(circular_id=circ1.id, event_type="circular_uploaded",
              description="RBI Digital Lending Guidelines 2024 uploaded and processed",
              actor="System", created_at=datetime.utcnow() - timedelta(days=14)),
        Event(circular_id=circ1.id, event_type="maps_extracted",
              description="5 MAPs extracted by Local AI Engine (phi3.5) and routed to departments",
              actor="System", created_at=datetime.utcnow() - timedelta(days=14)),
        Event(circular_id=circ1.id, map_id=maps1[0].id, event_type="map_approved",
              description="Disbursement controls MAP approved — IT implementation in progress",
              actor="Compliance Officer", created_at=datetime.utcnow() - timedelta(days=12)),
        Event(circular_id=circ1.id, map_id=maps1[1].id, event_type="map_approved",
              description="V-CIP KYC MAP approved — Compliance to lead implementation",
              actor="Compliance Officer", created_at=datetime.utcnow() - timedelta(days=12)),
        Event(circular_id=circ1.id, map_id=maps1[2].id, event_type="map_status_changed",
              description="KFS template revision MAP moved to In Progress",
              actor="Legal", created_at=datetime.utcnow() - timedelta(days=8)),
        Event(circular_id=circ2.id, event_type="circular_uploaded",
              description="SEBI Cybersecurity Framework 2024 uploaded and processed",
              actor="System", created_at=datetime.utcnow() - timedelta(days=7)),
        Event(circular_id=circ2.id, event_type="maps_extracted",
              description="4 MAPs extracted by Local AI Engine and routed to IT / Risk / Compliance",
              actor="System", created_at=datetime.utcnow() - timedelta(days=7)),
        Event(circular_id=circ3.id, event_type="circular_uploaded",
              description="RBI AML/KYC Master Direction 2024 uploaded and processed",
              actor="System", created_at=datetime.utcnow() - timedelta(days=3)),
        Event(circular_id=circ3.id, event_type="maps_extracted",
              description="5 MAPs extracted by Local AI Engine — Compliance and IT teams notified",
              actor="System", created_at=datetime.utcnow() - timedelta(days=3)),
        Event(event_type="demo_reset",
              description="Demo environment reset to pristine state",
              actor="System", created_at=datetime.utcnow()),
    ]
    for e in all_events:
        db.add(e)
    db.commit()

    # ── Clause provenance — compute evidence for all seeded MAPs ─────────────────
    for circ in [circ1, circ2, circ3]:
        try:
            compute_provenance_for_circular(db, str(circ.id))
        except Exception as exc:
            pass  # non-fatal; provenance is best-effort on demo reset

    all_maps_count = len(maps1) + len(maps2) + len(maps3)
    return {
        "circulars": 3,
        "maps":      all_maps_count,
        "events":    len(all_events),
        "approvals": len(approval_recs),
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/reset")
async def reset_demo(seed: bool = True, db: Session = Depends(get_db)):
    """
    Reset demo state: wipe all data, re-seed 3 circulars + 14 MAPs + audit trail.
    Single click restores a pristine, compelling demo scenario.
    """
    try:
        counts = _seed_demo_data(db, seed=seed)
        reset_availability_cache()   # re-probe Ollama on next extraction
        clear_prompt_cache()         # flush prompt cache so fresh circulars re-invoke LLM
        return {
            "success": True,
            "message": "Demo environment reset to pristine state",
            "seeded":  counts,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Demo reset failed: {str(e)}")


@router.get("/status")
async def demo_status(db: Session = Depends(get_db)):
    """Return row counts for demo readiness verification."""
    return {
        "circulars": db.query(Circular).count(),
        "maps":      db.query(MAP).count(),
        "events":    db.query(Event).count(),
        "approvals": db.query(Approval).count(),
        "ready":     db.query(Circular).count() > 0,
    }
