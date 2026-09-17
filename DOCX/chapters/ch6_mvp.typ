= MINIMUM VIABLE PRODUCT (MVP)

== 6.1. Overview of the Deployed Minimum Viable Product (MVP)

The Minimum Viable Product (MVP) represents the fully implemented, deployed, and operational prototype of the *Secure Cloud-Based Institutional Application & Automated Credential Management Platform*. Operating at *Technology Readiness Level 6 (TRL 6)* and *Implementation Readiness 6 (IR 6)*, the MVP delivers an automated, unified cloud service across all core institutional workflows:

- *Live Client Single-Page Application (SPA)*: Hosted on Google Firebase CDN at #link("https://tcek-rd.web.app")[https://tcek-rd.web.app]
- *Live Production API Backend*: Running inside a sandboxed Docker Debian Bullseye container on Render at #link("https://rd-backend-kbsm.onrender.com")[https://rd-backend-kbsm.onrender.com]
- *Distributed Relational Database*: Edge SQLite deployed across multi-region nodes via Turso libSQL
- *Public Credential Verification Portal*: Publicly accessible at #link("https://tcek-rd.web.app/verify")[https://tcek-rd.web.app/verify]
- *Registration Desk Terminal*: Available at #link("https://tcek-rd.web.app/reg-desk/login")[https://tcek-rd.web.app/reg-desk/login]
- *Event Messaging Studio*: Available at #link("https://tcek-rd.web.app/admin/messaging")[https://tcek-rd.web.app/admin/messaging]
- *Room & Venue Allocation Manager*: Available at #link("https://tcek-rd.web.app/admin/rooms")[https://tcek-rd.web.app/admin/rooms]

#figure(
  image("../media/proof_screenshots/mvp_home_desktop.png", width: 95%),
  caption: [Live MVP Production Web Application — Homepage & Innovation Hub Interface],
  kind: image,
)

== 6.2. Delivered Functional MVP Modules

=== Module 1: Student Application & Registration Portals
The MVP features three dedicated, validated public portals for institutional student intake:
1. *Hackathon Registration Portal* (`/apply/HackathonRegistration`): Enables student team leaders to register teams, select SIH-aligned problem statements, specify tech stacks, and submit GitHub repositories.
2. *Club Membership Portal* (`/apply/ClubRegistration`): Ingests candidate applications for institutional R&D clubs with dynamic branch, year, and skill selections.
3. *Event Registration Portal* (`/apply/EventRegistration`): Supports individual student registrations for technical symposia, seminars, and hands-on workshops with instant email confirmations.

#figure(
  image("../media/proof_screenshots/mvp_apply.png", width: 92%),
  caption: [Live MVP Application Portal Selector — Multitrack Student Intake Channels],
  kind: image,
)

#figure(
  image("../media/proof_screenshots/mvp_hackathon.png", width: 92%),
  caption: [Live MVP SIH Hackathon Registration Interface — Team Details, Tracks & Project Metadata],
  kind: image,
)

=== Module 2: Dedicated Physical Registration Desk Terminal
The physical event check-in subsystem provides high-speed throughput for on-site registration desks:
- *6-Box OTP / PIN Authentication*: Event desk volunteers log in using temporary, time-bounded 6-digit access credentials generated from the admin panel.
- *Real-Time Roll Number Lookup*: Search bar instantly filters candidate records across database registers with sub-millisecond client debouncing.
- *One-Click Attendance Toggle*: Volunteers toggle check-in status with instant visual confirmation and automatic audit logging.
- *Physical Kit Distribution Tracking*: Checkbox registers record physical kit handover to prevent duplicate distributions.
- *Live Capacity Monitoring*: Dynamically displays remaining venue seats and room allocation statistics.

#figure(
  image("../media/proof_screenshots/mvp_reg_desk.png", width: 85%),
  caption: [Live MVP Dedicated Physical Registration Desk Gate — 6-Box Alphanumeric PIN Authentication],
  kind: image,
)

=== Module 3: Executive Event Messaging Studio
The messaging studio provides controlled, professional institutional communication:
- *Segmented Audience Targeting*: Multi-checkbox audience selector filters recipients across Participants, Evaluators/Judges, Faculty Coordinators, and Student Volunteers.
- *Locked Institutional Branding*: Enforces Trinity College of Engineering & Technology official header letterhead, fonts, and institutional sign-offs.
- *Dynamic Token Personalization*: Automatically replaces `{name}`, `{event}`, `{roll_no}`, and `{date}` tokens with candidate profile data.
- *Direct HTTPS Email Dispatch*: Base64 payloads are transmitted to the Google Apps Script HTTP relay without cloud SMTP port blocks.

#figure(
  image("../media/proof_screenshots/mvp_admin_messaging.png", width: 95%),
  caption: [Live MVP Executive Event Messaging Studio — Audience Targeting & Branded Email Broadcast Engine],
  kind: image,
)

=== Module 4: Dynamic 16:9 Credential Verification Portal
The public credential verification engine exposes fraud-proof credential lookups:
- *Cryptographic Certificate ID Lookup*: Candidates, recruiters, and verifiers enter the unique credential code (e.g. `TCEK/RD/2026/XXXX`).
- *Dynamic In-Memory Compilation*: If a static file is missing, the backend queries the database register, dynamically parses the PPTX template via PizZip, compiles the PDF via headless LibreOffice CLI, and streams the binary inline.
- *Responsive 16:9 Widescreen Frame*: Displays the credential inside an interactive HTML5 PDF viewer with download and sharing capabilities.

#figure(
  image("../media/proof_screenshots/mvp_verify.png", width: 92%),
  caption: [Live MVP Public Credential Verification Portal — Instant ID Query & Certificate Viewer],
  kind: image,
)

=== Module 5: Administrative Control & Real-Time Monitoring
The administrative command center provides institutional administrators with:
- *Multi-Event Selector*: Switch active operational context across distinct hackathons, workshops, and recruitment drives.
- *Template Studio*: Upload, inspect, and configure PowerPoint (`.pptx`) templates with variable slot mappings (`{{NAME}}`, `{{ROLL_NO}}`, `{{EVENT}}`, `{{DATE}}`, `{{CERT_ID}}`).
- *Persistent Real-Time Sync (SSE)*: Dashboard metrics, check-in counts, and application rosters update instantaneously across all open client tabs without polling.

#figure(
  image("../media/proof_screenshots/mvp_admin_hackathons.png", width: 95%),
  caption: [Live MVP Admin Console — Real-Time Hackathon Team Management, Attendance & Certificate Dispatch Operations],
  kind: image,
)

#figure(
  image("../media/proof_screenshots/mvp_admin_rooms.png", width: 95%),
  caption: [Live MVP Registration Rooms & Venue Allocation Management Console],
  kind: image,
)
