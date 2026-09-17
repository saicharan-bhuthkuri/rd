= ANNEXURE

== Complete Route Map & Navigation Matrix (35 Active Routes)

#figure(
  table(
  columns: (1.4fr, 0.7fr, 0.9fr, 1.3fr, 1.7fr),
  stroke: 0.5pt + luma(180),
  fill: (col, row) => if row == 0 { rgb("#e8f0fe") } else { none },
  inset: (x: 3.5pt, y: 3.5pt),
  table.header([*Route Path*], [*Method / Type*], [*Access Level*], [*Subsystem / Module*], [*Architectural Purpose*]),
  [`/`], [GET (SPA)], [Public], [Portal Home], [Primary landing page, featured events showcase, quick access links],
  [`/apply`], [GET (SPA)], [Public], [Intake Portal], [Application category index: Hackathon, Club, Event registrations],
  [`/apply/HackathonRegistration`], [GET (SPA)], [Public], [Hackathons], [Team leader registration, SIH problem statements, tech stack],
  [`/apply/ClubRegistration`], [GET (SPA)], [Public], [Recruitment], [R&D innovation club membership application and domain selection],
  [`/apply/EventRegistration`], [GET (SPA)], [Public], [Event Intake], [Individual student registration for symposiums and workshops],
  [`/apply/ProjectSubmission`], [GET (SPA)], [Public], [Submissions], [Hackathon project submission: PPT slides, GitHub link, demo URL],
  [`/verify`], [GET (SPA)], [Public], [Verification], [Interactive public credential verification search and 16:9 PDF stream],
  [`/admin/login`], [GET (SPA)], [Public], [Authentication], [Administrator credential login portal with CSRF and rate limiting],
  [`/admin/dashboard`], [GET (SPA)], [Superadmin], [Admin Core], [Executive KPI overview, real-time counters, active events switchboard],
  [`/admin/events`], [GET (SPA)], [Superadmin], [Event Manager], [Create, update, close events; configure dates and capacities],
  [`/admin/applications`], [GET (SPA)], [Superadmin], [Intake Review], [Tabulated student application review with status filters],
  [`/admin/hackathons`], [GET (SPA)], [Superadmin], [Hackathon Hub], [Team roster inspection, project presentation slides, evaluator scoring],
  [`/admin/certificates`], [GET (SPA)], [Superadmin], [Credential Studio], [Template assignment, batch LibreOffice generation, email dispatch],
  [`/admin/messaging`], [GET (SPA)], [Superadmin], [Event Messaging], [Audience targeting, locked letterhead announcements broadcast],
  [`/admin/rooms`], [GET (SPA)], [Superadmin], [Venue Manager], [Room and laboratory venue allocations, physical capacity monitoring],
  [`/admin/logs`], [GET (SPA)], [Superadmin], [Audit System], [Immutable system activity logs, security alerts, and error traces],
  [`/reg-desk/login`], [GET (SPA)], [Public / PIN], [Desk Portal], [Volunteer terminal login with temporary 6-box OTP code],
  [`/reg-desk/dashboard`], [GET (SPA)], [Desk Volunteer], [Desk Core], [Real-time candidate roll number search, check-in, kit tracking],
  [`/api/health`], [GET (REST)], [Public], [Monitoring], [Container liveness probe, database ping, LibreOffice binary check],
  [`/api/auth/login`], [POST (REST)], [Public], [Authentication], [Issues HttpOnly JWT session cookie and Double-Submit CSRF token],
  [`/api/auth/logout`], [POST (REST)], [Authenticated], [Authentication], [Revokes JWT cookie and invalidates client session state],
  [`/api/auth/forgot-password`], [POST (REST)], [Public], [Recovery], [Dispatches 6-digit password reset OTP to verified admin email],
  [`/api/auth/reset-password`], [POST (REST)], [Public / OTP], [Recovery], [Validates OTP token and updates Bcrypt password hash],
  [`/api/apply/club`], [POST (REST)], [Public], [Applications], [Validates and stores student club membership applications],
  [`/api/apply/event`], [POST (REST)], [Public], [Applications], [Validates and stores technical event registrations],
  [`/api/apply/hackathon`], [POST (REST)], [Public], [Hackathons], [Registers hackathon teams and associated member rosters],
  [`/api/apply/project-submission`], [POST (REST)], [Public], [Hackathons], [Ingests team project submissions and presentation slide links],
  [`/api/certificates/generate`], [POST (REST)], [Superadmin], [Engine], [Triggers parallel headless LibreOffice batch compilation],
  [`/api/certificates/dispatch`], [POST (REST)], [Superadmin], [Relay], [Base64-encodes PDFs and dispatches via Google Apps Script proxy],
  [`/api/verify-certificate/:id`], [GET (REST)], [Public], [Verification], [Validates credential ID and returns candidate metadata],
  [`/api/verify-certificate/:id/pdf`], [GET (STREAM)], [Public], [Verification], [Compiles on demand and streams binary PDF into 16:9 iframe],
  [`/api/messaging/broadcast`], [POST (REST)], [Superadmin], [Broadcast], [Sends personalized emails to selected recipient groups],
  [`/api/reg-desk/login`], [POST (REST)], [Public / PIN], [Registration], [Authenticates desk volunteers via 6-box temporary OTP code],
  [`/api/reg-desk/checkin`], [POST (REST)], [Desk Volunteer], [Registration], [Toggles candidate attendance status with real-time audit log],
  [`/api/sync-stream`], [GET (SSE)], [Authenticated], [Realtime], [Persistent Server-Sent Events channel for live dashboard updates],
),
  caption: [Complete Route Map & Navigation Matrix (35 Active Routes)],
)

== Visual Diagrams Directory & System Architecture Index

The platform's technical documentation incorporates 26 formal architectural diagrams, flowcharts, sequence diagrams, and relational schemas:
- *Figure 1*: High-Level System Architecture & Workflow
- *Figure 2*: Multi-Tier Cloud Infrastructure Diagram
- *Figure 3*: End-to-End Application & Credential Lifecycle Workflow
- *Figure 4*: Multi-Role Authentication & CSRF Protection Workflow
- *Figure 5*: Self-Service Password Recovery & Reset Workflow
- *Figure 6*: System Use Case Boundaries Diagram
- *Figure 7*: DFD Level 0: Context Diagram
- *Figure 8*: DFD Level 1: Subsystem Process Diagram
- *Figure 9*: Sequence Diagram A: Authentication & Real-Time Sync Connection
- *Figure 10*: Sequence Diagram B: Bulk Certificate Compilation & Dispatch Flow
- *Figure 11*: Sequence Diagram C: Public Credential Verification & Dynamic Rendering
- *Figure 12*: Sequence Diagram D: Event Messaging Broadcast & Announcement Dispatch Flow
- *Figure 13*: Sequence Diagram E: Registration Desk Check-In & Room Allocation Flow
- *Figure 14*: Sequence Diagram F: Project Submissions & Hackathon Team Verification Flow
- *Figure 15*: Production & Cloud Deployment Architecture Diagram
- *Figure 16*: External Service Dependency Diagram
- *Figure 17*: Frontend-Backend-Database Multi-Tier Relationship Diagram
- *Figure 18*: Database Entity-Relationship (ER) Diagram (16 Relational Tables)
- *Figure 19*: Security Enforcement Architecture Flowchart
- *Figure 20*: Testing Architecture & Multi-Phase Verification Flow Diagram
- *Figure 21*: Unit Testing Process & Data Flow Diagram
- *Figure 22*: Black-Box Testing Endpoint Verification Flow Diagram
- *Figure 23*: White-Box Internal Operations & Execution Flow Diagram
- *Figure 24*: Gray-Box Multi-Subsystem Integration Diagram
- *Figure 25*: Defect Debugging & Resolution Visual Workflows
- *Figure 26*: Technology Readiness (TRL 6) & Implementation Maturity (IR 6) Diagram
