"""
PRAGMA — Demo Fallback Data
Owner: Anoushka (AI Lead)

Pre-baked circular + MAP responses for the RBI Digital Lending circular.
Used by POST /demo/reset to guarantee clean, reliable demo state
regardless of Claude availability or latency.

Usage in demo_endpoint:
    from app.utils.demo_fallback import DEMO_CIRCULAR, DEMO_MAPS
"""

# The circular that drives the live demo. Kept under ~800 words for fast Claude processing.
DEMO_CIRCULAR = {
    "title": "RBI Master Direction — Digital Lending Guidelines 2024",
    "source": "RBI",
    "content": (
        "Reserve Bank of India\n"
        "Master Direction — Digital Lending\n"
        "RBI/2024-25/112 | FIDD.CO.Plan.BC.No.08/04.09.01/2024-25\n\n"
        "To: All Commercial Banks, Small Finance Banks, NBFCs\n\n"
        "CHAPTER I — LOAN DISBURSEMENT\n"
        "Section 5: All digital loan disbursements shall be made exclusively to the "
        "verified bank account of the borrower. Disbursement to any Lending Service "
        "Provider (LSP) or third-party account is strictly prohibited. Regulated "
        "entities shall implement real-time disbursement controls within 90 days.\n\n"
        "CHAPTER II — CUSTOMER ONBOARDING\n"
        "Section 7: Regulated entities shall implement Video Customer Identification "
        "Process (V-CIP) for all digital lending customers. KYC records including video "
        "evidence shall be retained for a minimum of 10 years from the date of loan "
        "closure.\n\n"
        "CHAPTER III — TRANSPARENCY\n"
        "Section 8: A Key Fact Statement (KFS) must be provided to the borrower before "
        "loan sanction. The KFS shall disclose the Annual Percentage Rate (APR), total "
        "repayment amount, all fees and charges, and the cooling-off period. Loan "
        "sanction without explicit digital consent to the KFS is prohibited.\n\n"
        "CHAPTER IV — CREDIT LIMIT MANAGEMENT\n"
        "Section 6: Automatic credit limit enhancements are prohibited. Any enhancement "
        "shall require a standalone explicit digital consent from the borrower, separate "
        "from any other terms or communications.\n\n"
        "CHAPTER V — GRIEVANCE REDRESSAL\n"
        "Section 12: Every regulated entity shall designate a nodal Grievance Redressal "
        "Officer (GRO) for digital lending. Contact details shall be prominently "
        "displayed on the website and app. All complaints must be resolved within 30 "
        "days of receipt. Non-compliance shall attract penal action under RBI Act 1934.\n"
    ),
}

# Fallback MAPs — served when Claude is unavailable or slow during the live demo.
# These match the demo script narrative in docs/demo-script.md.
DEMO_MAPS = [
    {
        "action": (
            "Implement real-time disbursement controls in the loan origination system "
            "to ensure all digital loan disbursals are routed exclusively to the "
            "borrower's verified bank account and block any third-party account transfers"
        ),
        "department": "IT",
        "priority": "Critical",
        "deadline": "2024-12-31",
        "validation_notes": (
            "Section 5 — Loan Disbursement. Critical: direct customer fund flow "
            "risk and explicit 90-day regulatory deadline. IT owns the disbursement "
            "system controls."
        ),
    },
    {
        "action": (
            "Update KYC onboarding workflow to include Video Customer Identification "
            "Process (V-CIP) for all digital lending applicants and configure document "
            "retention system to preserve KYC records for 10 years post-loan closure"
        ),
        "department": "Compliance",
        "priority": "Critical",
        "deadline": "2024-12-31",
        "validation_notes": (
            "Section 7 — Customer Onboarding. Critical: KYC non-compliance carries "
            "immediate regulatory risk. Compliance owns onboarding procedures and "
            "record retention obligations."
        ),
    },
    {
        "action": (
            "Revise all digital loan agreement templates to include a mandatory Key "
            "Fact Statement disclosing the Annual Percentage Rate, total repayment "
            "amount, all fees, and the cooling-off period before loan sanction"
        ),
        "department": "Legal",
        "priority": "High",
        "deadline": "2024-11-30",
        "validation_notes": (
            "Section 8 — Transparency. High priority: customer protection obligation "
            "with legal documentation implications. Legal owns loan agreement templates "
            "and disclosure requirements."
        ),
    },
    {
        "action": (
            "Configure the lending platform to disable automatic credit limit "
            "enhancements and implement a standalone explicit digital consent flow "
            "that is separate from all other terms communications"
        ),
        "department": "Risk",
        "priority": "High",
        "deadline": "2024-11-30",
        "validation_notes": (
            "Section 6 — Credit Limit Management. High priority: unauthorised credit "
            "exposure increases constitute a direct risk event. Risk owns credit limit "
            "policy and controls."
        ),
    },
    {
        "action": (
            "Appoint a nodal Grievance Redressal Officer for digital lending, publish "
            "their contact details on the website and app, and configure complaint "
            "tracking with a 30-day SLA alert in the compliance dashboard"
        ),
        "department": "Compliance",
        "priority": "Medium",
        "deadline": "2025-01-31",
        "validation_notes": (
            "Section 12 — Grievance Redressal. Medium priority: regulatory requirement "
            "with a longer implementation window. Compliance owns grievance mechanisms "
            "and officer designation."
        ),
    },
]
