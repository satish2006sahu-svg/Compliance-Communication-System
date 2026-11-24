import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and print total page count."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        print(f"Canvas computed total pages: {num_pages}")
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 11 * inch - 36, "ReguComply AI — Technical Manual & Architecture Guide")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)
        
        # Footer
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * inch - 54, 36, page_str)
        self.drawString(54, 36, "CONFIDENTIAL & PROPRIETARY — ENTERPRISE COMPLIANCE SYSTEM")
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(54, 48, 8.5 * inch - 54, 48)
        
        self.restoreState()

def build_pdf(filename="ReguComply_AI_Project_Manual.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    NAVY = colors.HexColor("#14213D")
    NAVY_LIGHT = colors.HexColor("#1F3558")
    TEAL = colors.HexColor("#0D9488")
    TEAL_BG = colors.HexColor("#F0FDFA")
    SLATE = colors.HexColor("#334155")
    MUTED = colors.HexColor("#64748B")
    BG_CARD = colors.HexColor("#F8FAFC")
    BORDER_COLOR = colors.HexColor("#E2E8F0")

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=NAVY,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=MUTED,
        spaceAfter=14
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=NAVY,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=TEAL,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=SLATE,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=SLATE,
        leftIndent=14,
        spaceAfter=3
    )

    callout_style = ParagraphStyle(
        'Callout_Text',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=NAVY_LIGHT
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=SLATE
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
        textColor=NAVY
    )

    story = []

    # =========================================================================
    # PAGE 1: TITLE, PROJECT SUMMARY & PROBLEM STATEMENT
    # =========================================================================
    story.append(Paragraph("ReguComply AI — Project Technical Manual", title_style))
    story.append(Paragraph("A Plain-English Architectural Guide to Classes, Data Models, Services, and Systems", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=TEAL, spaceBefore=0, spaceAfter=12))

    story.append(Paragraph("1. What is ReguComply AI?", h1_style))
    story.append(Paragraph(
        "<b>ReguComply AI</b> is an enterprise regulatory intelligence system built for banks, FinTechs, and regulated corporations. "
        "Every month, regulatory bodies (like the Reserve Bank of India, SEBI, or SEC) publish dozens of 50+ page legal circulars. "
        "Reading and translating these dense legal documents into daily operational duties manually is extremely slow and prone to errors. "
        "This project completely automates that lifecycle:",
        body_style
    ))

    story.append(Paragraph("• <b>Live Web Ingestion:</b> Automatically scrapes circulars directly from official government URLs into clean Markdown.", bullet_style))
    story.append(Paragraph("• <b>AI Analysis:</b> Uses large language models to extract deadlines, statutory penalties, and affected departments in seconds.", bullet_style))
    story.append(Paragraph("• <b>Executive Review:</b> Provides Chief Compliance Officers with an approval console before any directive is published.", bullet_style))
    story.append(Paragraph("• <b>Grounded Assistant:</b> Equips staff with a chatbot backed by persistent memory that remembers past queries across sessions.", bullet_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("2. The Two User Roles in the System", h1_style))
    story.append(Paragraph(
        "The system strictly separates responsibilities into two distinct portals:",
        body_style
    ))

    # Two column box for Roles
    role_data = [
        [
            Paragraph("<b>Role 1: Chief Compliance Officer (Admin)</b>", table_cell_bold),
            Paragraph("<b>Role 2: Frontline Employees (Operations / IT / Risk)</b>", table_cell_bold)
        ],
        [
            Paragraph(
                "• Submits official regulatory website links.<br/>"
                "• Reviews AI-generated summaries and suggested FAQs.<br/>"
                "• Edits announcements using a live Markdown preview.<br/>"
                "• Officially approves and publishes updates to staff.<br/>"
                "• Monitors system health and external API connections.",
                table_cell
            ),
            Paragraph(
                "• Logs in to a clean, formatted compliance dashboard.<br/>"
                "• Reads clear directives (no legal jargon or raw code).<br/>"
                "• Searches departmental compliance FAQs.<br/>"
                "• Asks policy questions in the AI Chatbot.<br/>"
                "• Relies on chatbot memory that recalls past conversations.",
                table_cell
            )
        ]
    ]
    t_roles = Table(role_data, colWidths=[250, 254])
    t_roles.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BG_CARD),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_roles)

    story.append(Spacer(1, 10))
    story.append(Paragraph("3. The 4-Stage Regulatory Pipeline", h1_style))
    story.append(Paragraph(
        "Data travels through four sequential stages: "
        "<b>[1. Scrape]</b> Web scraper converts official pages to Markdown ➔ "
        "<b>[2. Analyze]</b> AI extracts obligations, penalties &amp; FAQs ➔ "
        "<b>[3. Review]</b> Compliance Officer edits &amp; approves ➔ "
        "<b>[4. Broadcast]</b> Staff read directives &amp; ask questions in the memory-backed chatbot.",
        body_style
    ))

    # Page 1 Break
    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: DATABASE MODELS (models.py)
    # =========================================================================
    story.append(Paragraph("4. Database Architecture & Entity Classes (models.py)", h1_style))
    story.append(Paragraph(
        "All corporate information is organized in SQLite using SQLAlchemy ORM. "
        "Below are the 5 core classes that define how data is stored, related, and governed:",
        body_style
    ))

    # Table of models
    models_table_data = [
        [Paragraph("Class Name", table_header), Paragraph("Table Name", table_header), Paragraph("Key Fields", table_header), Paragraph("Plain-English Purpose", table_header)],
        [
            Paragraph("<b>User</b>", table_cell_bold),
            Paragraph("users", table_cell),
            Paragraph("id, name, email, hashed_password, role, created_at", table_cell),
            Paragraph("Stores user accounts. Role is strictly 'admin' or 'employee'. Passwords are securely hashed with Bcrypt.", table_cell)
        ],
        [
            Paragraph("<b>Regulatory<br/>Document</b>", table_cell_bold),
            Paragraph("regulatory_<br/>documents", table_cell),
            Paragraph("id, title, source_url, extracted_content, summary, metadata_json", table_cell),
            Paragraph("Holds raw source data scraped from government URLs before any editing occurs. Contains full Markdown text.", table_cell)
        ],
        [
            Paragraph("<b>Announcement</b>", table_cell_bold),
            Paragraph("announcements", table_cell),
            Paragraph("id, document_id, title, content, status, approved_by, published_at", table_cell),
            Paragraph("The executive directive shown to staff. Lifecycle: starts as 'draft', becomes 'published' when approved by an admin.", table_cell)
        ],
        [
            Paragraph("<b>FAQ</b>", table_cell_bold),
            Paragraph("faqs", table_cell),
            Paragraph("id, announcement_id, question, answer, category, created_at", table_cell),
            Paragraph("Specific operational Q&amp;A pairs tied to a published circular (e.g. 'Does this rule apply to weekend transactions?').", table_cell)
        ],
        [
            Paragraph("<b>Conversation<br/>Metadata</b>", table_cell_bold),
            Paragraph("conversation_<br/>metadata", table_cell),
            Paragraph("id, employee_id, session_id, turn_count, summary, last_active_at", table_cell),
            Paragraph("Tracks employee chatbot activity, session tokens, and total questions asked over time.", table_cell)
        ],
    ]
    t_models = Table(models_table_data, colWidths=[80, 80, 160, 184])
    t_models.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_models)

    story.append(Spacer(1, 10))
    story.append(Paragraph("How the Models Relate to Each Other:", h2_style))
    story.append(Paragraph("• <b>One Document has Many Announcements (1:N):</b> When a circular is updated, new announcements can be derived from it.", bullet_style))
    story.append(Paragraph("• <b>One Announcement has Many FAQs (1:N):</b> Deleting an announcement automatically deletes its associated FAQs (cascade delete).", bullet_style))
    story.append(Paragraph("• <b>One User Approves Many Announcements (1:N):</b> Full auditability of which compliance officer authorized each release.", bullet_style))
    story.append(Paragraph("• <b>One Employee has Many Conversations (1:N):</b> Allows tracking interaction frequency while isolating conversation memory.", bullet_style))

    # Page 2 Break
    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: BACKEND SERVICE CLASSES (services/)
    # =========================================================================
    story.append(Paragraph("5. Core Backend Services (services/)", h1_style))
    story.append(Paragraph(
        "Heavy technical logic is divided into three dedicated service classes. "
        "Keeping them separate from the API routes makes the codebase modular, testable, and maintainable.",
        body_style
    ))

    # Service 1: Firecrawl
    story.append(Paragraph("5.1 FirecrawlService (firecrawl_service.py)", h2_style))
    story.append(Paragraph(
        "<b>Purpose:</b> Scrapes official circulars from banking and government websites.<br/>"
        "<b>Why it is needed:</b> Standard web scrapers fail on modern websites that load content dynamically with JavaScript, "
        "and they scramble legal tables. Firecrawl renders JavaScript in the cloud, strips out ads/navigation bars, "
        "and returns clean, readable Markdown with tables intact. This reduces AI token consumption by up to 70%.<br/>"
        "<b>Key Safety Feature:</b> Contains <code>validate_url_security()</code>, which checks domain DNS records and rejects any "
        "attempt to scrape internal, private (127.0.0.1, 10.x.x.x), or AWS metadata IP addresses (SSRF defense).",
        body_style
    ))

    # Service 2: LLMService
    story.append(Paragraph("5.2 LLMService (llm_service.py)", h2_style))
    story.append(Paragraph(
        "<b>Purpose:</b> Powers all AI summarization, analysis, FAQ drafting, and chatbot answering.<br/>"
        "<b>Core Engine:</b> Uses <b>Google Gemini 2.5 Flash</b> (with OpenAI as an optional fallback). Gemini was chosen for its "
        "massive 1,000,000+ token context window, allowing entire 80-page circulars to be processed in a single prompt without chunking.<br/>"
        "<b>Key Methods:</b><br/>"
        "• <code>analyze_regulatory_text()</code>: Extracts deadlines, issuing authority, penalty clauses, and affected departments.<br/>"
        "• <code>generate_announcement()</code>: Drafts a clean executive summary in clear everyday business language.<br/>"
        "• <code>generate_faqs()</code>: Anticipates practical frontline questions and writes 4–6 departmental Q&amp;A pairs.<br/>"
        "• <code>answer_employee_query()</code>: Answers employee questions using past conversation context and approved circulars.",
        body_style
    ))

    # Service 3: MementoService
    story.append(Paragraph("5.3 MementoService (memento_service.py)", h2_style))
    story.append(Paragraph(
        "<b>Purpose:</b> Gives the compliance chatbot long-term memory across sessions.<br/>"
        "<b>The Problem it Solves:</b> Standard AI bots forget everything when a user logs out. If an employee asks a follow-up "
        "question next Tuesday, standard bots have no idea what was discussed previously. Memento maintains a bitemporal memory graph "
        "that remembers past conversation turns.<br/>"
        "<b>Physical Tenant Privacy:</b> To prevent sensitive data leaks between departments, Memento creates a <i>physically separate "
        "database file for every employee</i> (e.g. <code>memento_employee_1.db</code>). Operations staff cannot recall queries made by Internal Audit.",
        body_style
    ))

    # Page 3 Break
    story.append(PageBreak())

    # =========================================================================
    # PAGE 4: SECURITY & API ROUTES
    # =========================================================================
    story.append(Paragraph("6. Enterprise Security & Access Control (security.py)", h1_style))
    story.append(Paragraph(
        "In compliance systems, unauthorized access or premature disclosure of unapproved policies can cause severe liability. "
        "The system enforces three strict security barriers:",
        body_style
    ))

    story.append(Paragraph("• <b>JWT Bearer Token Authentication:</b> When users log in, the server issues a cryptographically signed JSON Web Token (valid for 24 hours). Every subsequent API request must include this token in its header.", bullet_style))
    story.append(Paragraph("• <b>Role-Based Access Control (RBAC):</b> Endpoints use FastAPI dependency injection (<code>require_admin</code>). If a regular employee tries to access scraper or publishing tools, the server immediately rejects the request with HTTP 403 Forbidden.", bullet_style))
    story.append(Paragraph("• <b>The 'Published-Only' Guarantee:</b> The employee API hardcodes a database filter (<code>status == 'published'</code>). Employees physically cannot query or view unapproved AI drafts, protecting against hallucinated policies.", bullet_style))
    story.append(Paragraph("• <b>Server-Side Secret Storage:</b> API keys (Gemini, Firecrawl) are stored strictly in the server's <code>backend/.env</code> file. In-browser key configuration is blocked to prevent browser extension scraping and credential theft.", bullet_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("7. Complete API Route Reference", h1_style))
    story.append(Paragraph(
        "The backend exposes 15 clean REST endpoints organized by domain:",
        body_style
    ))

    api_table_data = [
        [Paragraph("HTTP Method & Endpoint", table_header), Paragraph("Required Role", table_header), Paragraph("Plain-English Purpose", table_header)],
        [Paragraph("<b>POST /api/auth/login</b>", table_cell), Paragraph("Public", table_cell_bold), Paragraph("Verifies email/password and returns signed JWT token.", table_cell)],
        [Paragraph("<b>GET /api/auth/me</b>", table_cell), Paragraph("Authenticated", table_cell_bold), Paragraph("Returns current user profile and role details.", table_cell)],
        [Paragraph("<b>POST /api/admin/scrape-url</b>", table_cell), Paragraph("Admin Only", table_cell_bold), Paragraph("Validates URL for SSRF, scrapes circular via Firecrawl, returns summary.", table_cell)],
        [Paragraph("<b>POST /api/admin/announcements</b>", table_cell), Paragraph("Admin Only", table_cell_bold), Paragraph("Generates compliance announcement draft using Gemini 2.5 Flash.", table_cell)],
        [Paragraph("<b>POST /api/admin/.../publish</b>", table_cell), Paragraph("Admin Only", table_cell_bold), Paragraph("Approves draft announcement and broadcasts it live to employees.", table_cell)],
        [Paragraph("<b>GET /api/employee/directives</b>", table_cell), Paragraph("Employee/Admin", table_cell_bold), Paragraph("Lists all approved, published compliance directives.", table_cell)],
        [Paragraph("<b>GET /api/employee/faqs</b>", table_cell), Paragraph("Employee/Admin", table_cell_bold), Paragraph("Returns searchable list of approved departmental compliance FAQs.", table_cell)],
        [Paragraph("<b>POST /api/employee/chatbot/query</b>", table_cell), Paragraph("Employee/Admin", table_cell_bold), Paragraph("Sends employee question to Memento + Gemini for a grounded answer.", table_cell)],
        [Paragraph("<b>GET /api/system/status</b>", table_cell), Paragraph("Public / Admin", table_cell_bold), Paragraph("Health diagnostics for Firecrawl, Gemini, and Memento memory.", table_cell)],
        [Paragraph("<b>GET /health</b>", table_cell), Paragraph("Public", table_cell_bold), Paragraph("Automated healthcheck for cloud container orchestrators.", table_cell)],
    ]
    t_api = Table(api_table_data, colWidths=[160, 94, 250])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_api)

    # Page 4 Break
    story.append(PageBreak())

    # =========================================================================
    # PAGE 5: FRONTEND ARCHITECTURE & MARKDOWN ENGINE
    # =========================================================================
    story.append(Paragraph("8. Frontend Architecture & Component Structure", h1_style))
    story.append(Paragraph(
        "The user interface is built with <b>React 18</b>, <b>Vite</b>, and <b>Tailwind CSS</b> as a fast Single-Page Application (SPA). "
        "The application is structured into clear layout layers:",
        body_style
    ))

    fe_data = [
        [Paragraph("Component / Page", table_header), Paragraph("Folder Path", table_header), Paragraph("Plain-English Purpose", table_header)],
        [Paragraph("<b>LandingPage.jsx</b>", table_cell_bold), Paragraph("src/pages/", table_cell), Paragraph("Public homepage featuring an interactive 4-stage pipeline carousel and direct portal links.", table_cell)],
        [Paragraph("<b>Login.jsx</b>", table_cell_bold), Paragraph("src/pages/", table_cell), Paragraph("Dual-role login form with pre-filled test credentials for Administrator and Employee.", table_cell)],
        [Paragraph("<b>Admin Dashboard</b>", table_cell_bold), Paragraph("src/pages/admin/", table_cell), Paragraph("Allows scraping URLs, generating AI directives, and editing text in a dual-mode preview studio.", table_cell)],
        [Paragraph("<b>Employee Dashboard</b>", table_cell_bold), Paragraph("src/pages/employee/", table_cell), Paragraph("Displays clean published directives with deadline alerts and department tags.", table_cell)],
        [Paragraph("<b>Chatbot.jsx</b>", table_cell_bold), Paragraph("src/pages/employee/", table_cell), Paragraph("Interactive chat assistant that displays past recalled turns and grounded answers.", table_cell)],
        [Paragraph("<b>MarkdownRenderer</b>", table_cell_bold), Paragraph("src/components/", table_cell), Paragraph("Custom parser converting Markdown into styled headings, quotes, bullets, and bold text.", table_cell)],
        [Paragraph("<b>AuthContext.jsx</b>", table_cell_bold), Paragraph("src/context/", table_cell), Paragraph("Global state managing the active JWT token, user identity, and login/logout events.", table_cell)],
        [Paragraph("<b>api/client.js</b>", table_cell_bold), Paragraph("src/api/", table_cell), Paragraph("Centralized fetch client automatically injecting Authorization Bearer tokens into API requests.", table_cell)],
    ]
    t_fe = Table(fe_data, colWidths=[120, 110, 274])
    t_fe.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_fe)

    story.append(Spacer(1, 10))
    story.append(Paragraph("9. The Custom Markdown Engine (MarkdownRenderer.jsx)", h1_style))
    story.append(Paragraph(
        "<b>Why not use standard NPM Markdown libraries?</b> Many third-party packages introduce 30+ indirect dependencies, "
        "bloat download size, and require complex configuration to prevent Cross-Site Scripting (XSS) attacks. "
        "Using <code>dangerouslySetInnerHTML</code> is strictly avoided.<br/>"
        "<b>Our Solution:</b> A custom, zero-dependency parser that reads raw Markdown line by line and converts it directly into "
        "<b>native React Virtual DOM elements</b>: "
        "<code># Titles</code> become styled headings; <code>&gt; Quotes</code> become shaded callout boxes; "
        "<code>- Bullets</code> become clean list items; and <code>**bold**</code> becomes emphasized text. "
        "It is 100% immune to malicious HTML or script injection.",
        body_style
    ))

    # Page 5 Break
    story.append(PageBreak())

    # =========================================================================
    # PAGE 6: CONCURRENCY, PRODUCTION DEPLOYMENT & SUMMARY
    # =========================================================================
    story.append(Paragraph("10. Database Concurrency: SQLite in WAL Mode", h1_style))
    story.append(Paragraph(
        "<b>The Challenge:</b> By default, SQLite places an exclusive lock on the entire database file during writes. "
        "If an admin saved a circular while an employee was chatting, the employee's screen crashed with <i>'database is locked'</i>.<br/>"
        "<b>The Solution:</b> We enabled <b>Write-Ahead Logging (WAL)</b> in <code>database.py</code>: "
        "<code>PRAGMA journal_mode=WAL</code> and <code>PRAGMA busy_timeout=5000</code>. "
        "Under WAL mode, writes are appended to a separate log file (<code>compliance.db-wal</code>). "
        "<b>Readers never block writers, and writers never block readers.</b> "
        "Dozens of employees can query the system concurrently with zero downtime.",
        body_style
    ))

    story.append(Spacer(1, 8))
    story.append(Paragraph("11. Single-Port Unified Production Deployment", h1_style))
    story.append(Paragraph(
        "In production, the application is packaged as a <b>self-contained Docker container</b>. "
        "FastAPI serves both the compiled React frontend Single Page Application (from <code>frontend/dist</code>) "
        "and the REST API (<code>/api/*</code>) together on <b>port 8000</b>. "
        "This completely eliminates Cross-Origin Resource Sharing (CORS) issues because the frontend and backend share the exact same domain.",
        body_style
    ))

    story.append(Spacer(1, 8))
    story.append(Paragraph("12. Quick Reference & System Defaults", h1_style))

    ref_data = [
        [Paragraph("Item", table_header), Paragraph("Value / Default", table_header), Paragraph("Notes", table_header)],
        [Paragraph("<b>Web App (Frontend)</b>", table_cell), Paragraph("http://127.0.0.1:5173", table_cell), Paragraph("Vite dev server with Hot Module Reloading", table_cell)],
        [Paragraph("<b>Unified Production App</b>", table_cell), Paragraph("http://127.0.0.1:8000", table_cell), Paragraph("FastAPI serving React SPA + REST API on one port", table_cell)],
        [Paragraph("<b>Interactive API Docs</b>", table_cell), Paragraph("http://127.0.0.1:8000/docs", table_cell), Paragraph("OpenAPI Swagger UI for testing endpoints", table_cell)],
        [Paragraph("<b>Default Admin Login</b>", table_cell), Paragraph("admin@compliance.org", table_cell), Paragraph("Password: <code>AdminPassword2026!</code>", table_cell)],
        [Paragraph("<b>Default Employee Login</b>", table_cell), Paragraph("employee1@compliance.org", table_cell), Paragraph("Password: <code>EmployeePass2026!</code>", table_cell)],
        [Paragraph("<b>Main Relational Database</b>", table_cell), Paragraph("backend/compliance.db", table_cell), Paragraph("Managed via SQLAlchemy with WAL concurrency", table_cell)],
        [Paragraph("<b>Isolated Memory Store</b>", table_cell), Paragraph("backend/data/memento/", table_cell), Paragraph("Contains <code>memento_employee_{id}.db</code> files", table_cell)],
    ]
    t_ref = Table(ref_data, colWidths=[130, 160, 214])
    t_ref.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_ref)

    story.append(Spacer(1, 14))
    story.append(Paragraph(
        "<b>Summary:</b> ReguComply AI delivers high-speed, human-governed compliance automation by uniting modern web scraping (Firecrawl), "
        "massive-context LLM reasoning (Gemini), long-term private episodic memory (Memento), and a secure zero-dependency frontend.",
        callout_style
    ))

    # Build document using NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {filename}!")

if __name__ == "__main__":
    build_pdf()
