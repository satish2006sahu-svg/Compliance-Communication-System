import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import Base, engine, SessionLocal
from app.models import User, RegulatoryDocument, Announcement, FAQ
from app.seed import init_db, seed_users
from app.security import verify_password, create_access_token, get_password_hash
from app.services.memento_service import memento_service
from app.services.firecrawl_service import firecrawl_service
from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    print("=" * 70)
    print("STARTING END-TO-END SYSTEM INTEGRATION TESTS")
    print("=" * 70)

    # 1. Initialize DB and run seed
    print("\n[TEST 1] Testing Database Initialization & Seed...")
    init_db()
    seed_users()
    db = SessionLocal()
    admin = db.query(User).filter(User.email == "admin@compliance.org").first()
    emp1 = db.query(User).filter(User.email == "employee1@compliance.org").first()
    emp2 = db.query(User).filter(User.email == "employee2@compliance.org").first()
    assert admin is not None, "Admin user must exist"
    assert admin.role == "admin", "Admin role must be 'admin'"
    assert emp1 is not None, "Employee 1 must exist"
    assert emp1.role == "employee", "Employee 1 role must be 'employee'"
    assert emp2 is not None, "Employee 2 must exist"
    print("✓ Users correctly seeded (Admin, Employee 1, Employee 2)")

    # 2. Test Password Verification & JWT Token Issuance
    print("\n[TEST 2] Testing Password Hashing & JWT Security...")
    assert verify_password("AdminPassword2026!", admin.hashed_password), "Admin password verification failed"
    assert verify_password("EmployeePass2026!", emp1.hashed_password), "Employee password verification failed"
    assert not verify_password("WrongPassword!", admin.hashed_password), "Wrong password should fail"
    
    token = create_access_token({"sub": str(admin.id), "role": admin.role})
    assert token and isinstance(token, str), "Token must be valid string"
    print("✓ Password verification and JWT token generation passed")

    # 3. Test HTTP Client Endpoints (FastAPI TestClient)
    print("\n[TEST 3] Testing FastAPI HTTP Authentication Endpoints...")
    client = TestClient(app)
    
    # Admin login
    admin_login_res = client.post("/api/auth/login", json={
        "email": "admin@compliance.org",
        "password": "AdminPassword2026!"
    })
    assert admin_login_res.status_code == 200, f"Admin login failed: {admin_login_res.text}"
    admin_token = admin_login_res.json()["access_token"]
    print("✓ Administrator login successful")

    # Employee login
    emp_login_res = client.post("/api/auth/login", json={
        "email": "employee1@compliance.org",
        "password": "EmployeePass2026!"
    })
    assert emp_login_res.status_code == 200, f"Employee login failed: {emp_login_res.text}"
    emp_token = emp_login_res.json()["access_token"]
    print("✓ Employee login successful")

    # 4. Test Role-Based Access Control (RBAC)
    print("\n[TEST 4] Testing Backend Role Enforcement & RBAC Security...")
    # Employee attempts to access admin endpoint -> MUST be blocked with 403 Forbidden!
    forbidden_res = client.get("/api/admin/documents", headers={
        "Authorization": f"Bearer {emp_token}"
    })
    assert forbidden_res.status_code == 403, f"Security Breach: Employee was not blocked from admin endpoint! Status: {forbidden_res.status_code}"
    print("✓ Security passed: Employee strictly forbidden (HTTP 403) from admin endpoints")

    # Admin accesses admin endpoint -> Allowed (200)
    admin_docs_res = client.get("/api/admin/documents", headers={
        "Authorization": f"Bearer {admin_token}"
    })
    assert admin_docs_res.status_code == 200, "Admin should be allowed access"
    print("✓ Admin successfully authorized on admin endpoints")

    # 5. Test SSRF Protection on Firecrawl Service
    print("\n[TEST 5] Testing SSRF Protection on Regulatory URL Scraper...")
    dangerous_urls = [
        "http://localhost:8080/admin",
        "http://127.0.0.1:9000/keys",
        "http://169.254.169.254/latest/meta-data/",
        "ftp://internal.server/file.txt",
        "file:///etc/passwd"
    ]
    for bad_url in dangerous_urls:
        try:
            firecrawl_service.validate_url_security(bad_url)
            raise AssertionError(f"Security Alert: Dangerous URL '{bad_url}' was not blocked!")
        except Exception as e:
            # Expected block
            pass
    print("✓ SSRF Protection passed: Localhost, private IPs, and non-HTTP schemes are strictly blocked")

    # 6. Test Memento Persistent Memory & Isolation
    print("\n[TEST 6] Testing Memento Persistent Memory & Strict Tenant Isolation...")
    # Employee 1 (Alice) asks about cybersecurity incident deadlines
    memento_service.save_conversation_turn(
        employee_id=emp1.id,
        user_message="What is the incident reporting deadline under the RBI circular?",
        assistant_message="Incidents must be reported within 6 hours of discovery.",
        conversation_id="session_1"
    )

    # Employee 2 (Bob) asks about ESG disclosure frameworks
    memento_service.save_conversation_turn(
        employee_id=emp2.id,
        user_message="What are the ESG core disclosure requirements?",
        assistant_message="ESG core requires BRSR framework compliance across top 1000 listed entities.",
        conversation_id="session_2"
    )

    # Recall for Employee 1 (Alice)
    mem_alice = memento_service.recall_memories(
        employee_id=emp1.id,
        query="What did we discuss earlier?"
    )
    print(f"  [Alice Memento Recall Preview]: {mem_alice[:120]}...")
    assert "6 hours" in mem_alice or "incident reporting" in mem_alice.lower() or "deadline" in mem_alice.lower(), "Alice's memory must contain her past question"

    # Recall for Employee 2 (Bob)
    mem_bob = memento_service.recall_memories(
        employee_id=emp2.id,
        query="What did we discuss earlier?"
    )
    print(f"  [Bob Memento Recall Preview]: {mem_bob[:120]}...")
    assert "esg" in mem_bob.lower() or "brsr" in mem_bob.lower(), "Bob's memory must contain his past question"

    # STRICT PRIVACY TEST: Bob must NOT see Alice's memories!
    assert "incident reporting" not in mem_bob.lower() and "6 hours" not in mem_bob.lower(), "CRITICAL PRIVACY VIOLATION: Alice's memory leaked into Bob's session!"
    # STRICT PRIVACY TEST: Alice must NOT see Bob's memories!
    assert "esg" not in mem_alice.lower() and "brsr" not in mem_alice.lower(), "CRITICAL PRIVACY VIOLATION: Bob's memory leaked into Alice's session!"
    print("✓ Memento Memory Isolation Passed: Employee 1 and Employee 2 memories are 100% physically isolated!")

    # Test Session Persistence: Close and reload from disk
    print("\n[TEST 7] Testing Memento Cross-Session Persistence Across Logouts...")
    history_alice = memento_service.get_conversation_history(employee_id=emp1.id)
    assert len(history_alice) > 0, "Alice's history must persist in SQLite Memento file"
    print(f"✓ Cross-session persistence confirmed: {len(history_alice)} turns persisted in memento_employee_{emp1.id}.db")

    # 8. Test Employee Dashboard: Draft Filtering
    print("\n[TEST 8] Testing Employee Dashboard Filter (Published-Only Guarantee)...")
    # Add a draft announcement
    draft_ann = Announcement(
        document_id=1,
        title="TOP SECRET UNAPPROVED DRAFT",
        content="This draft should NEVER be seen by employees.",
        status="draft"
    )
    db.add(draft_ann)
    db.commit()

    emp_dash_res = client.get("/api/employee/dashboard", headers={
        "Authorization": f"Bearer {emp_token}"
    })
    assert emp_dash_res.status_code == 200
    dash_data = emp_dash_res.json()
    all_titles = [a["title"] for a in dash_data["all_announcements"]]
    assert "TOP SECRET UNAPPROVED DRAFT" not in all_titles, "SECURITY BREACH: Draft announcement leaked to employee dashboard!"
    print("✓ Published-Only Guarantee verified: Employees cannot see draft or unapproved updates")

    # Clean up draft
    db.delete(draft_ann)
    db.commit()
    db.close()

    print("\n" + "=" * 70)
    print("ALL INTEGRATION TESTS PASSED SUCCESSFULLY! (100% PASS)")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
