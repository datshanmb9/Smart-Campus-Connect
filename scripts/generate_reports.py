import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, PageBreak, Preformatted, KeepTogether
)
from reportlab.pdfgen import canvas

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DOCS_DIR = os.path.join(BASE_DIR, 'docs')
SCREENSHOTS_DIR = os.path.join(DOCS_DIR, 'screenshots')
DOCX_PATH = os.path.join(DOCS_DIR, 'Smart-Campus-Connect-Project-Report.docx')
PDF_PATH = os.path.join(DOCS_DIR, 'Smart-Campus-Connect-Project-Report.pdf')

UNIVERSITY_BLUE = RGBColor(30, 58, 138)       # #1E3A8A
SLATE_GRAY = RGBColor(71, 85, 105)            # #475569
DARK_TEXT = RGBColor(15, 23, 42)              # #0F172A

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def create_docx_report():
    print("[1/2] Generating DOCX Project Report...")
    doc = docx.Document()

    # Set page margins (1 inch)
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Base Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = DARK_TEXT

    # ==================== COVER PAGE ====================
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_p.paragraph_format.space_before = Pt(36)
    title_p.paragraph_format.space_after = Pt(8)
    run = title_p.add_run("PROJECT DISSERTATION REPORT")
    run.font.name = 'Calibri'
    run.font.size = Pt(14)
    run.font.bold = True
    run.font.color.rgb = SLATE_GRAY

    main_title = doc.add_paragraph()
    main_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    main_title.paragraph_format.space_after = Pt(8)
    run = main_title.add_run("SMART CAMPUS CONNECT")
    run.font.name = 'Calibri'
    run.font.size = Pt(28)
    run.font.bold = True
    run.font.color.rgb = UNIVERSITY_BLUE

    sub_title = doc.add_paragraph()
    sub_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_title.paragraph_format.space_after = Pt(36)
    run = sub_title.add_run("One Campus. One Platform. Connected Services.")
    run.font.name = 'Calibri'
    run.font.size = Pt(14)
    run.font.italic = True
    run.font.color.rgb = SLATE_GRAY

    desc_p = doc.add_paragraph()
    desc_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    desc_p.paragraph_format.space_after = Pt(36)
    run = desc_p.add_run("A Capstone Project Dissertation Submitted in Partial Fulfillment of the\nRequirements for the Degree of\nMASTER OF COMPUTER APPLICATIONS (MCA)\nAcademic Year 2025–2026")
    run.font.size = Pt(12)
    run.font.color.rgb = DARK_TEXT

    event_p = doc.add_paragraph()
    event_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    event_p.paragraph_format.space_after = Pt(48)
    run = event_p.add_run("Presented at:\nMERNOVA X 2026\nDepartment of Computer Applications\nSchool of Information Science & Technology\nPresidency University, Bengaluru, Karnataka, India")
    run.font.size = Pt(12)
    run.font.bold = True
    run.font.color.rgb = UNIVERSITY_BLUE

    doc.add_page_break()

    # ==================== EXECUTIVE SUMMARY / ABSTRACT ====================
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(16)
    h1.paragraph_format.space_after = Pt(8)
    run = h1.add_run("1. ABSTRACT & EXECUTIVE SUMMARY")
    run.font.size = Pt(18)
    run.font.bold = True
    run.font.color.rgb = UNIVERSITY_BLUE

    p = doc.add_paragraph(
        "Modern tertiary educational institutions manage extensive physical infrastructure spanning multiple academic "
        "blocks, lecture halls, specialized laboratories, seminar halls, and recreational centers. Despite substantial "
        "technological investment, campus communication remains fragmented across disconnected portals, paper registers, "
        "email chains, and informal messaging groups. This fragmentation leads to prolonged turnaround times for equipment "
        "repairs, double-booking of seminar halls, low attendance at campus workshops, and difficulty in recovering misplaced personal belongings."
    )
    p.paragraph_format.space_after = Pt(10)

    p = doc.add_paragraph(
        "Smart Campus Connect addresses these systemic challenges through a unified, full-stack campus management ecosystem. "
        "Built on a single Node.js and Express.js REST API backend coupled with a cloud-hosted MongoDB Atlas cluster, the platform supports "
        "two purpose-built client applications:"
    )
    p.paragraph_format.space_after = Pt(6)

    doc.add_paragraph("1. React.js Web Dashboard: For University Administrators and Faculty to manage venue configurations, dispatch maintenance technicians, moderate lost and found claims, approve facility reservations, and monitor real-time SLA metrics.", style='List Bullet')
    doc.add_paragraph("2. Flutter Android Mobile Application: For Students featuring Smart QR Code Classroom Scanning, allowing instantaneous reporting of faulty campus equipment (projectors, electricals, lab PCs, Wi-Fi), tracking complete ticket audit histories, one-tap workshop registration, room booking, and lost and found inquiries.", style='List Bullet')

    # ==================== SYSTEM ARCHITECTURE & 12 DIAGRAMS ====================
    doc.add_page_break()
    h1 = doc.add_paragraph()
    run = h1.add_run("2. SYSTEM ARCHITECTURE & 12 PROJECT DIAGRAMS")
    run.font.size = Pt(18)
    run.font.bold = True
    run.font.color.rgb = UNIVERSITY_BLUE

    p = doc.add_paragraph(
        "The Smart Campus Connect platform is modeled using 12 comprehensive architectural, structural, and behavioral diagrams "
        "defining every tier of the full-stack system:"
    )
    p.paragraph_format.space_after = Pt(12)

    diagrams_info = [
        ("Diagram 1: 3-Tier Cloud-Native Architecture Diagram",
         "Defines the decoupled Presentation Tier (React.js Web + Flutter Mobile), Application Tier (Express.js REST API on port 5000), and Data Persistence Tier (MongoDB Atlas Cloud Replica Set over TLS 1.3)."),
        ("Diagram 2: System Use Case Diagram",
         "Maps authorized system capabilities across three primary actors: Students (Issue reporting, workshops, lost & found), Faculty (Room booking, announcements), and Administrators (Triage, staff dispatch, venue QR generation, analytics)."),
        ("Diagram 3: Entity-Relationship (ER) Diagram",
         "Documents primary and foreign key mappings across Mongoose schemas: Users, Locations, Complaints, Events, Bookings, LostFoundItems, and Notifications, emphasizing embedded statusHistory subdocuments."),
        ("Diagram 4: Data Flow Diagram (DFD) Level 0 (Context Diagram)",
         "Shows global data boundary, external actors, input requests (credentials, QR identifiers, complaint payloads), and output responses (JWT tokens, verified venue metadata, real-time ticket updates)."),
        ("Diagram 5: Data Flow Diagram (DFD) Level 1 (Functional Decomposition)",
         "Decomposes system into six core services: Auth Subsystem (1.0), QR Venue Resolver (2.0), Complaint Engine (3.0), Notification Dispatcher (4.0), Admin Triage & Resolution (5.0), and Event/Booking Engine (6.0)."),
        ("Diagram 6: Data Flow Diagram (DFD) Level 2 (Complaint Subsystem)",
         "Illustrates sequential data transformations within issue reporting: QR matching -> payload & Multer photo validation -> sequential ticket generation (CMP-YYYY-XXXX) -> atomic audit logging -> notification dispatch."),
        ("Diagram 7: Sequence Diagram 1 (Authentication & JWT Issuance)",
         "Details bcrypt password verification with 10 salt rounds and cryptographic HMAC-SHA256 JWT signing with 7-day expiration."),
        ("Diagram 8: Sequence Diagram 2 (Smart QR Code Scanning & Ticket Creation)",
         "Captures camera optical capture of classroom code (e.g. PU-ENGG-LH204), instant API location lookup, form auto-fill, and complaint submission yielding ticket CMP-2026-0005."),
        ("Diagram 9: Sequence Diagram 3 (Admin Triage & Resolution Workflow)",
         "Chronicles administrative inspection in React web queue, technician assignment (Suresh Kumar), status update to 'In Progress', final resolution with engineering notes, and notification delivery."),
        ("Diagram 10: Sequence Diagram 4 (Conflict-Free Facility Booking Flow)",
         "Details algorithmic date/time window intersection check preventing double-booking of seminar halls and auditoriums with HTTP 409 Conflict rejection."),
        ("Diagram 11: Activity Diagram (Complaint Lifecycle State Machine)",
         "Visualizes swimlane workflow from camera scan, venue validation, ticket logging, technician dispatch, physical repair, and student refresh verification."),
        ("Diagram 12: Deployment Diagram (Cloud & Hardware Topology)",
         "Maps physical execution nodes: Google Pixel 8 Android Virtual Device (AVD), Desktop Workstation browser, Windows Host Application Server (Node.js v22), and 3-Node MongoDB Atlas Cloud Cluster.")
    ]

    for title, desc in diagrams_info:
        h2 = doc.add_paragraph()
        h2.paragraph_format.space_before = Pt(10)
        h2.paragraph_format.space_after = Pt(4)
        run = h2.add_run(title)
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = UNIVERSITY_BLUE
        
        p = doc.add_paragraph(desc)
        p.paragraph_format.space_after = Pt(8)

    # ==================== VERIFIED SCREENSHOTS WALKTHROUGH ====================
    doc.add_page_break()
    h1 = doc.add_paragraph()
    run = h1.add_run("3. USER INTERFACE WALKTHROUGH & VERIFIED SCREENSHOTS")
    run.font.size = Pt(18)
    run.font.bold = True
    run.font.color.rgb = UNIVERSITY_BLUE

    p = doc.add_paragraph(
        "The following screenshots were captured directly from the verified live Android emulator session (Google Pixel 8, Android 16) "
        "connected to the Node.js Express backend and MongoDB Atlas cloud database:"
    )
    p.paragraph_format.space_after = Pt(12)

    screenshots_data = [
        ("Figure 14.1: Student Home Dashboard",
         "mobile_dashboard_verified.png",
         "Personalized student greeting ('Hello, Rahul 👋'), notification counter badge (18), hero Smart QR banner, and 6-tile service grid."),
        ("Figure 14.2: Optical Smart QR Scanner",
         "mobile_camera_qr_active.png",
         "Live full-screen camera reticle overlay with corner targeting guides, torch/flashlight toggle, and camera switcher."),
        ("Figure 14.3: Demo Venue Selector Dialogue",
         "mobile_venue_selection.png",
         "Modal dialog providing instant classroom selection (e.g. PU-ENGG-LH204) for reliable automated testing without printed paper QR codes."),
        ("Figure 14.4: Issue Reporting Form (Pre-filled via QR)",
         "mobile_report_issue_prefilled.png",
         "Form automatically pre-populated with verified venue details (LH-204, Academic Block 1, Floor 2), category selector, priority buttons, and photo upload."),
        ("Figure 14.5: My Complaints Feed (Status Reflection)",
         "mobile_complaint_status_resolved.png",
         "Student complaints feed displaying active and resolved tickets with green 'Resolved' badge for ticket CMP-2026-0005."),
        ("Figure 14.6: 4-Stage Status Timeline & Audit History",
         "mobile_complaint_timeline_detail.png",
         "Comprehensive audit trail rendering Stage 1 (Pending by student), Stage 2 (Assigned to Suresh Kumar), Stage 3 (In Progress), and Stage 4 (Resolved with repair notes).")
    ]

    for fig_title, img_filename, caption in screenshots_data:
        h2 = doc.add_paragraph()
        h2.paragraph_format.space_before = Pt(12)
        h2.paragraph_format.space_after = Pt(4)
        run = h2.add_run(fig_title)
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = UNIVERSITY_BLUE

        img_path = os.path.join(SCREENSHOTS_DIR, img_filename)
        if os.path.exists(img_path):
            img_p = doc.add_paragraph()
            img_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            doc.add_picture(img_path, width=Inches(3.2))
            img_p.paragraph_format.space_after = Pt(4)

        cap_p = doc.add_paragraph()
        cap_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cap_p.paragraph_format.space_after = Pt(14)
        run = cap_p.add_run(caption)
        run.font.size = Pt(9.5)
        run.font.italic = True
        run.font.color.rgb = SLATE_GRAY

    # ==================== VERIFICATION & TEST RESULTS ====================
    doc.add_page_break()
    h1 = doc.add_paragraph()
    run = h1.add_run("4. TESTING, QUALITY ASSURANCE & VERIFICATION RESULTS")
    run.font.size = Pt(18)
    run.font.bold = True
    run.font.color.rgb = UNIVERSITY_BLUE

    p = doc.add_paragraph(
        "Verification was conducted across all three tiers using both automated test harnesses and live Android emulator executions:"
    )
    p.paragraph_format.space_after = Pt(8)

    # Verification Table
    table = doc.add_table(rows=1, cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_cells = table.rows[0].cells
    headers = ["Verification Suite", "Scope / Target", "Result", "Pass Rate"]
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], "1E3A8A")
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)

    test_rows = [
        ("React Web & API Suite", "26 automated tests across Admin & Faculty modules", "26 / 26 PASSED", "100%"),
        ("Cross-Platform E2E Suite", "12 complete lifecycle cycles (Mobile -> Atlas -> Web)", "12 / 12 PASSED", "100%"),
        ("Backend Auth Suite", "Registration, bcrypt hashing, JWT validation, RBAC", "12 / 12 PASSED", "100%"),
        ("Backend Integration", "10 core modules tested against live MongoDB Atlas", "10 / 10 PASSED", "100%"),
        ("Flutter Mobile Tests", "Widget & unit tests, model deserialization", "10 / 10 PASSED", "100%"),
        ("Static Code Analysis", "flutter analyze (mobile), eslint (client)", "0 Errors, 0 Warnings", "100%")
    ]

    for suite, scope, res, rate in test_rows:
        row_cells = table.add_row().cells
        row_cells[0].text = suite
        row_cells[1].text = scope
        row_cells[2].text = res
        row_cells[3].text = rate
        for c in row_cells:
            c.paragraphs[0].runs[0].font.size = Pt(9.5)

    p_space = doc.add_paragraph()
    p_space.paragraph_format.space_before = Pt(12)

    # APK Size Analysis Callout
    h2 = doc.add_paragraph()
    run = h2.add_run("APK Optimization Analysis")
    run.font.size = Pt(14)
    run.font.bold = True
    run.font.color.rgb = UNIVERSITY_BLUE

    doc.add_paragraph("• Debug APK (app-debug.apk): 172.9 MB (190,350,450 bytes uncompressed). Bundles 4 CPU architectures simultaneously (arm64-v8a, armeabi-v7a, x86, x86_64), unstripped native C++ symbols, and the full Dart VM JIT runtime.", style='List Bullet')
    doc.add_paragraph("• Release APK (app-release.apk): 68.6 MB (71,932,011 bytes). Production AOT compiled, stripped debug symbols, and tree-shaken font assets (MaterialIcons reduced by 99.1% from 1.6MB to 15KB).", style='List Bullet')
    doc.add_paragraph("• Both APK files are preserved and accessible in mobile/build/app/outputs/flutter-apk/.", style='List Bullet')

    # Save DOCX
    doc.save(DOCX_PATH)
    print(f"[Success] DOCX report generated at: {DOCX_PATH}")

def create_pdf_report():
    print("[2/2] Generating PDF Project Report via ReportLab...")

    class NumberedCanvas(canvas.Canvas):
        def __init__(self, *args, **kwargs):
            canvas.Canvas.__init__(self, *args, **kwargs)
            self._saved_page_states = []

        def showPage(self):
            self._saved_page_states.append(dict(self.__dict__))
            self._startPage()

        def save(self):
            num_pages = len(self._saved_page_states)
            for state in self._saved_page_states:
                self.__dict__.update(state)
                self.draw_page_number(num_pages)
                canvas.Canvas.showPage(self)
            canvas.Canvas.save(self)

        def draw_page_number(self, page_count):
            if self._pageNumber > 1:
                self.saveState()
                self.setFont("Helvetica", 8)
                self.setFillColor(colors.HexColor("#475569"))
                # Running Header
                self.drawString(54, 750, "Smart Campus Connect — MCA Capstone Dissertation • MERNOVA X 2026")
                self.setStrokeColor(colors.HexColor("#CBD5E1"))
                self.setLineWidth(0.5)
                self.line(54, 742, 558, 742)
                # Running Footer
                self.line(54, 45, 558, 45)
                self.drawString(54, 32, "Presidency University, Bengaluru • Department of Computer Applications")
                page_str = f"Page {self._pageNumber} of {page_count}"
                self.drawRightString(558, 32, page_str)
                self.restoreState()

    doc = SimpleDocTemplate(
        PDF_PATH,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#1E3A8A'),
        alignment=1,
        spaceAfter=10
    )
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#475569'),
        alignment=1,
        spaceAfter=30
    )
    meta_style = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=15,
        textColor=colors.HexColor('#0F172A'),
        alignment=1,
        spaceAfter=25
    )
    h1_style = ParagraphStyle(
        'Heading1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#1E3A8A'),
        spaceBefore=14,
        spaceAfter=8
    )
    h2_style = ParagraphStyle(
        'Heading2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor('#1E3A8A'),
        spaceBefore=10,
        spaceAfter=4
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=6
    )
    caption_style = ParagraphStyle(
        'Caption',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#475569'),
        alignment=1,
        spaceAfter=12
    )

    story = []

    # ==================== COVER PAGE ====================
    story.append(Spacer(1, 40))
    story.append(Paragraph("PROJECT DISSERTATION REPORT", ParagraphStyle('CoverSubHeader', fontName='Helvetica-Bold', fontSize=12, leading=14, textColor=colors.HexColor('#475569'), alignment=1, spaceAfter=15)))
    story.append(Paragraph("SMART CAMPUS CONNECT", title_style))
    story.append(Paragraph("One Campus. One Platform. Connected Services.", subtitle_style))
    story.append(Spacer(1, 20))
    story.append(Paragraph(
        "A Capstone Project Dissertation Submitted in Partial Fulfillment of the<br/>"
        "Requirements for the Degree of<br/>"
        "<b>MASTER OF COMPUTER APPLICATIONS (MCA)</b><br/>"
        "Academic Year 2025–2026",
        meta_style
    ))
    story.append(Spacer(1, 30))
    story.append(Paragraph(
        "<b>Presented at:</b><br/>"
        "<b>MERNOVA X 2026</b><br/>"
        "Department of Computer Applications<br/>"
        "School of Information Science & Technology<br/>"
        "<b>Presidency University, Bengaluru, Karnataka, India</b>",
        meta_style
    ))
    story.append(PageBreak())

    # ==================== ABSTRACT ====================
    story.append(Paragraph("1. Abstract & Executive Summary", h1_style))
    story.append(Paragraph(
        "Modern tertiary educational institutions manage extensive physical infrastructure spanning multiple academic "
        "blocks, lecture halls, specialized laboratories, seminar halls, and recreational centers. Despite substantial "
        "technological investment, campus communication remains fragmented across disconnected portals, paper registers, "
        "email chains, and informal messaging groups. This fragmentation leads to prolonged turnaround times for equipment "
        "repairs, double-booking of seminar halls, low attendance at campus workshops, and difficulty in recovering misplaced personal belongings.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Smart Campus Connect</b> addresses these systemic challenges through a unified, full-stack campus management ecosystem. "
        "Built on a single <b>Node.js and Express.js REST API</b> backend coupled with a cloud-hosted <b>MongoDB Atlas cluster</b>, the platform supports "
        "two purpose-built client applications: a high-productivity <b>React.js Web Dashboard</b> for Administrators/Faculty and a high-performance "
        "<b>Flutter Android Mobile Application</b> for Students featuring <b>Smart QR Code Classroom Scanning</b>.",
        body_style
    ))
    story.append(Spacer(1, 10))

    # ==================== ARCHITECTURE & DIAGRAMS ====================
    story.append(Paragraph("2. System Architecture & 12 Project Diagrams", h1_style))
    diagram_items = [
        ("Diagram 1: 3-Tier System Architecture Diagram", "Decoupled Presentation Tier (React + Flutter), Application Tier (Express REST API on port 5000), and Data Persistence Tier (MongoDB Atlas Cloud Replica Set over TLS 1.3)."),
        ("Diagram 2: System Use Case Diagram", "Maps student capabilities (Issue reporting, event passes, lost & found), faculty capabilities (facility booking), and admin capabilities (triage, dispatch, QR generator)."),
        ("Diagram 3: Entity-Relationship (ER) Diagram", "Documents relational constraints across Users, Locations, Complaints, Events, Bookings, LostFoundItems, and Notifications, emphasizing embedded statusHistory subdocuments."),
        ("Diagram 4: Data Flow Diagram (DFD) Level 0", "Global context diagram showing system boundaries, external user entities, and bidirectional data exchanges."),
        ("Diagram 5: Data Flow Diagram (DFD) Level 1", "Decomposition into Auth Subsystem (1.0), QR Venue Resolver (2.0), Complaint Engine (3.0), Notification Dispatcher (4.0), Admin Triage (5.0), and Event/Booking Engine (6.0)."),
        ("Diagram 6: Data Flow Diagram (DFD) Level 2", "Detailed complaint ticketing lifecycle from QR match -> payload & photo validation -> sequential CMP-YYYY-XXXX ticket generation -> atomic statusHistory logging."),
        ("Diagram 7: Sequence Diagram 1 (Authentication & JWT Issuance)", "Cryptographic salted bcrypt hashing (10 rounds) and HMAC-SHA256 JWT signing with 7-day expiration."),
        ("Diagram 8: Sequence Diagram 2 (Smart QR Scanning & Issue Submission)", "Camera optical scan of classroom code PU-ENGG-LH204, instant backend location lookup, and ticket creation yielding CMP-2026-0005."),
        ("Diagram 9: Sequence Diagram 3 (Admin Triage & Resolution Workflow)", "Administrative triage in React web queue, technician assignment (Suresh Kumar), status update to 'In Progress', and final resolution."),
        ("Diagram 10: Sequence Diagram 4 (Conflict-Free Facility Booking Flow)", "Algorithmic date/time window intersection check preventing double-booking of seminar halls with HTTP 409 Conflict rejection."),
        ("Diagram 11: Activity Diagram (Complaint Lifecycle State Machine)", "Swimlane progression from camera scan, venue validation, ticket logging, technician dispatch, physical repair, and student refresh verification."),
        ("Diagram 12: Deployment Diagram (Cloud & Hardware Topology)", "Physical and virtual nodes: Pixel 8 AVD, Desktop Workstation, Windows Host Server (Node.js v22), and MongoDB Atlas 3-node replica set.")
    ]

    for d_title, d_desc in diagram_items:
        story.append(Paragraph(d_title, h2_style))
        story.append(Paragraph(d_desc, body_style))

    story.append(PageBreak())

    # ==================== VERIFIED SCREENSHOTS ====================
    story.append(Paragraph("3. User Interface Walkthrough & Verified Screenshots", h1_style))
    story.append(Paragraph(
        "The following screenshots were captured directly from the live Android emulator session (Google Pixel 8, Android 16) "
        "connected to the Express backend and MongoDB Atlas cloud database:",
        body_style
    ))
    story.append(Spacer(1, 10))

    screenshots_for_pdf = [
        ("Figure 14.1: Student Home Dashboard", "mobile_dashboard_verified.png", "Personalized student greeting ('Hello, Rahul 👋'), notification counter badge (18), hero Smart QR banner, and 6-tile service grid."),
        ("Figure 14.2: Optical Smart QR Scanner", "mobile_camera_qr_active.png", "Live full-screen camera reticle overlay with corner targeting guides, torch/flashlight toggle, and camera switcher."),
        ("Figure 14.3: Demo Venue Selector", "mobile_venue_selection.png", "Modal dialog providing instant classroom selection (e.g. PU-ENGG-LH204) for automated testing."),
        ("Figure 14.4: Pre-filled Issue Reporting Form", "mobile_report_issue_prefilled.png", "Form auto-populated with verified venue details (LH-204, Academic Block 1, Floor 2) via QR code resolution."),
        ("Figure 14.5: My Complaints Feed (Status Reflection)", "mobile_complaint_status_resolved.png", "Student complaints feed displaying active and resolved tickets with green 'Resolved' badge for CMP-2026-0005."),
        ("Figure 14.6: 4-Stage Status Timeline & Audit History", "mobile_complaint_timeline_detail.png", "Comprehensive audit trail rendering Stage 1 (Pending), Stage 2 (Assigned), Stage 3 (In Progress), and Stage 4 (Resolved).")
    ]

    for fig_t, fig_file, fig_cap in screenshots_for_pdf:
        img_full_path = os.path.join(SCREENSHOTS_DIR, fig_file)
        if os.path.exists(img_full_path):
            img_flowable = RLImage(img_full_path, width=2.4*72, height=4.8*72)
            story.append(KeepTogether([
                Paragraph(fig_t, h2_style),
                img_flowable,
                Spacer(1, 4),
                Paragraph(fig_cap, caption_style),
                Spacer(1, 10)
            ]))

    story.append(PageBreak())

    # ==================== TEST RESULTS & APK ====================
    story.append(Paragraph("4. Testing & Verification Results", h1_style))
    story.append(Paragraph(
        "The entire platform was subjected to exhaustive automated testing and live emulator verification:",
        body_style
    ))

    pdf_table_data = [
        ["Verification Suite", "Scope / Target", "Result", "Pass Rate"],
        ["React Web & API Suite", "26 automated checks across Admin/Faculty", "26 / 26 PASSED", "100%"],
        ["Cross-Platform E2E Suite", "12 complete lifecycle cycles", "12 / 12 PASSED", "100%"],
        ["Backend Auth Suite", "Registration, bcrypt, JWT, RBAC", "12 / 12 PASSED", "100%"],
        ["Backend Integration", "10 core modules tested on Atlas", "10 / 10 PASSED", "100%"],
        ["Flutter Mobile Tests", "Widget & unit tests, model parsing", "10 / 10 PASSED", "100%"],
        ["Static Analysis", "flutter analyze & eslint", "0 Errors / 0 Warn", "100%"]
    ]

    t = Table(pdf_table_data, colWidths=[130, 200, 100, 70])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E3A8A')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('ALIGN', (2,0), (3,-1), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 8.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')])
    ]))
    story.append(t)
    story.append(Spacer(1, 15))

    story.append(Paragraph("APK Optimization Analysis", h2_style))
    story.append(Paragraph(
        "<b>• Debug APK (app-debug.apk):</b> 172.9 MB (190,350,450 bytes uncompressed). Bundles 4 CPU architectures simultaneously (arm64-v8a, armeabi-v7a, x86, x86_64), unstripped native C++ symbols, and Dart VM JIT runtime.<br/>"
        "<b>• Release APK (app-release.apk):</b> 68.6 MB (71,932,011 bytes). Production AOT compiled, stripped debug symbols, and tree-shaken font assets (MaterialIcons reduced by 99.1% from 1.6MB to 15KB).<br/>"
        "<b>• Storage Location:</b> Both APKs are preserved in <code>mobile/build/app/outputs/flutter-apk/</code>.",
        body_style
    ))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[Success] PDF report generated at: {PDF_PATH}")

if __name__ == '__main__':
    create_docx_report()
    create_pdf_report()
