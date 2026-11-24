import datetime
import json
from app.database import SessionLocal, Base, engine
from app.models import User, RegulatoryDocument, Announcement, FAQ
from app.security import get_password_hash

def init_db():
    Base.metadata.create_all(bind=engine)

def seed_users():
    db = SessionLocal()
    try:
        # Seed Admin
        admin = db.query(User).filter(User.email == "admin@compliance.org").first()
        if not admin:
            admin = User(
                name="Chief Compliance Officer",
                email="admin@compliance.org",
                hashed_password=get_password_hash("AdminPassword2026!"),
                role="admin"
            )
            db.add(admin)
            print("Created default Administrator: admin@compliance.org / AdminPassword2026!")

        # Seed Employee 1 (Operations)
        emp1 = db.query(User).filter(User.email == "employee1@compliance.org").first()
        if not emp1:
            emp1 = User(
                name="Alice Sharma (Operations)",
                email="employee1@compliance.org",
                hashed_password=get_password_hash("EmployeePass2026!"),
                role="employee"
            )
            db.add(emp1)
            print("Created default Employee 1: employee1@compliance.org / EmployeePass2026!")

        # Seed Employee 2 (Risk & Audit) - for isolation testing
        emp2 = db.query(User).filter(User.email == "employee2@compliance.org").first()
        if not emp2:
            emp2 = User(
                name="Bob Verma (Risk Analyst)",
                email="employee2@compliance.org",
                hashed_password=get_password_hash("EmployeePass2026!"),
                role="employee"
            )
            db.add(emp2)
            print("Created default Employee 2: employee2@compliance.org / EmployeePass2026!")

        db.commit()

        # Seed one initial published regulatory update for instant demonstration
        existing_doc = db.query(RegulatoryDocument).filter(
            RegulatoryDocument.source_url == "https://www.rbi.org.in/scripts/BS_CircularIndexDisplay.aspx?Id=12345"
        ).first()

        if not existing_doc:
            sample_analysis = {
                "title": "Master Direction on Information Technology Governance, Risk, Controls and Assurance Practices",
                "regulator": "Reserve Bank of India (RBI)",
                "effective_date": "April 1, 2026",
                "main_regulatory_changes": [
                    "Mandatory establishment of an IT Strategy Committee at the Board level.",
                    "Implementation of continuous cyber incident logging and real-time SIEM alerts.",
                    "Quarterly vulnerability assessments and bi-annual penetration testing (VAPT)."
                ],
                "important_compliance_requirements": [
                    "Board oversight on third-party vendor IT risk and cloud hosting contracts.",
                    "Mandatory Multi-Factor Authentication (MFA) across all administrative access endpoints.",
                    "Reporting of material cyber security incidents to CERT-In and RBI within 6 hours."
                ],
                "key_instructions": [
                    "All regulated entities must conduct gap analysis against the new IT Governance framework.",
                    "Enforce strict least-privilege access for employee core banking systems."
                ],
                "affected_departments": ["Information Technology", "Cybersecurity", "Compliance", "Internal Audit"],
                "important_dates_and_deadlines": ["Compliance gap analysis completion: March 31, 2026", "Full implementation: April 1, 2026"],
                "penalties_and_risks": "Regulatory penalties under the Banking Regulation Act and supervisory action for non-compliance.",
                "required_actions": [
                    "Review active vendor SLAs.",
                    "Conduct employee cyber hygiene training."
                ],
                "employee_key_takeaways": [
                    "MFA is mandatory for all internal tools.",
                    "Report any phishing or suspicious email within 15 minutes to security@organization.com."
                ]
            }

            doc = RegulatoryDocument(
                title="RBI Master Direction - IT Governance & Cybersecurity Assurance",
                source_url="https://www.rbi.org.in/scripts/BS_CircularIndexDisplay.aspx?Id=12345",
                extracted_content=(
                    "# Reserve Bank of India - IT Governance & Cyber Security Circular\n\n"
                    "The Reserve Bank of India hereby issues the Master Direction on Information Technology "
                    "Governance, Risk, Controls and Assurance Practices. Regulated entities shall ensure robust "
                    "oversight of their digital infrastructure, mandatory multi-factor authentication, and immediate "
                    "incident reporting within 6 hours of detection."
                ),
                summary=json.dumps(sample_analysis),
                metadata_json=json.dumps({"regulator": "RBI", "category": "Cybersecurity & Governance"})
            )
            db.add(doc)
            db.commit()
            db.refresh(doc)

            announcement = Announcement(
                document_id=doc.id,
                title="Compliance Notice: Implementation of RBI Master Direction on IT Governance & Cybersecurity",
                content=(
                    "# Implementation of RBI Master Direction on IT Governance & Cybersecurity\n\n"
                    "## 1. Executive Summary\n"
                    "The Reserve Bank of India (RBI) has issued comprehensive directives to strengthen IT governance "
                    "and operational resilience across all financial institutions.\n\n"
                    "## 2. Key Changes\n"
                    "- Mandatory Multi-Factor Authentication (MFA) for all organizational accounts.\n"
                    "- 6-hour reporting window for any material cybersecurity incident.\n"
                    "- Enhanced vendor IT risk evaluation before engaging third-party software providers.\n\n"
                    "## 3. Action Items for Employees\n"
                    "- Enable and verify your authenticator app MFA immediately.\n"
                    "- Never share passwords or OTPs with internal or external callers.\n"
                    "- Report phishing attempts to `security@organization.com` without delay.\n\n"
                    "## 4. Key Deadlines\n"
                    "- **Gap Analysis:** March 31, 2026\n"
                    "- **Full Go-Live:** April 1, 2026\n\n"
                    "**Reference:** [Official RBI Circular](https://www.rbi.org.in/scripts/BS_CircularIndexDisplay.aspx?Id=12345)"
                ),
                status="published",
                published_at=datetime.datetime.utcnow(),
                approved_by=admin.id
            )
            db.add(announcement)
            db.commit()
            db.refresh(announcement)

            # Add FAQs
            db.add(FAQ(
                announcement_id=announcement.id,
                question="What is the incident reporting deadline under the new RBI circular?",
                answer="Material cybersecurity incidents must be reported to the IT Security team and regulatory bodies within 6 hours of discovery."
            ))
            db.add(FAQ(
                announcement_id=announcement.id,
                question="Are all employees required to use Multi-Factor Authentication?",
                answer="Yes, Multi-Factor Authentication (MFA) is strictly mandatory for all administrative and internal software access."
            ))
            db.add(FAQ(
                announcement_id=announcement.id,
                question="What is the final compliance deadline for the IT governance directive?",
                answer="The full compliance deadline is April 1, 2026, with the initial gap analysis due by March 31, 2026."
            ))
            db.commit()
            print("Seeded initial approved compliance announcement and FAQs.")

    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    seed_users()
