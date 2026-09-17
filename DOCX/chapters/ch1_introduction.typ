= INTRODUCTION


== Introduction

This platform is a secure cloud-based institutional application management and automated credential processing system designed for educational institutions. It provides a digitized pipeline for student applications, recruitment validation, event orchestration, dynamic document compilation, and public lookups.

For your viva presentation, the core contribution is summarized in one sentence:
> #strong[“We developed a secure cloud-based institutional management platform that automates student and event registration, certificate generation, bulk credential distribution, and public certificate verification.”]


=== Production URLs

- #strong[Deployed Web Application (Client)]: #link("https://tcek-rd.web.app")[https://tcek-rd.web.app]
- #strong[Application Portal (Overview)]: #link("https://tcek-rd.web.app/apply")[https://tcek-rd.web.app/apply]
  - #strong[Hackathon Registration]: #link("https://tcek-rd.web.app/apply/HackathonRegistration")[https://tcek-rd.web.app/apply/HackathonRegistration]
  - #strong[Club Membership Application]: #link("https://tcek-rd.web.app/apply/ClubRegistration")[https://tcek-rd.web.app/apply/ClubRegistration]
  - #strong[Event Registration]: #link("https://tcek-rd.web.app/apply/EventRegistration")[https://tcek-rd.web.app/apply/EventRegistration]
- #strong[Public Certificate Verification]: #link("https://tcek-rd.web.app/verify")[https://tcek-rd.web.app/verify]
- #strong[Admin Event Messaging]: #link("https://tcek-rd.web.app/admin/messaging")[https://tcek-rd.web.app/admin/messaging]
- #strong[Registration Desk Portal]: #link("https://tcek-rd.web.app/reg-desk/login")[https://tcek-rd.web.app/reg-desk/login]
- #strong[Registration Desk Dashboard]: #link("https://tcek-rd.web.app/reg-desk/dashboard")[https://tcek-rd.web.app/reg-desk/dashboard]
- #strong[Room & Venue Allocations]: #link("https://tcek-rd.web.app/admin/rooms")[https://tcek-rd.web.app/admin/rooms]
- #strong[Deployed API Server (Backend)]: #link("https://rd-backend-kbsm.onrender.com")[https://rd-backend-kbsm.onrender.com]
- #strong[Designer/Developer Portfolio]: #link("https://saivortex.web.app/")[https://saivortex.web.app/]


=== Project Readiness & Verification Status

- #strong[Technology Readiness Level (TRL)]: #strong[TRL 6] (System/Subsystem Prototype Demonstration in a Representative Environment)
  - *Proof & Evidence*: The fully integrated systems compile cleanly (exit code `0`) and run successfully across target cloud nodes (Firebase CDN static distribution, Dockerised API containers on Render, and edge Turso DB SQLite cloud nodes).
- #strong[Implementation Readiness (IR)]: #strong[IR 6] (System Integration & Verification Complete)
  - *Proof & Evidence*: Execution of the automated end-to-end integration test suite [`backend/verify_all_features.js`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/verify_all_features.js) against live production nodes returns a #strong[100.0% PASS] rate across all #strong[33 integration assertions] (including 18 public/admin frontend web routes, public REST APIs, Registration Desk session issuance, attendee rosters, admin role guards, audience targeting, and persistent Server-Sent Events). Automated local integration suite [`backend/test_suite.js`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/test_suite.js) also validates 100% pass on internal assertion checks. See [Section 17](\#17-testing) for full execution logs and [Section 35](\#35-technology-readiness-level-trl--implementation-readiness-ir-assessment) for TRL/IR maturity assessment.



=== Project Purpose

The Research & Development (R&D) Cell at Trinity College of Engineering & Technology requires an enterprise-grade digital infrastructure to manage the complete student innovation and academic event lifecycle. The #strong[Secure Cloud-Based Institutional Application & Automated Credential Management Platform] digitizes and automates these operations, replacing vulnerable spreadsheets, disconnected paper attendance sheets, manual certificate formatting, and unverified credentials with a unified, cloud-native automated pipeline.

The platform serves as the central operational backbone for:
- #strong[Student Innovation & Club Recruitment]: Digitally receiving, vetting, and managing student applications for departmental research labs, innovation clubs, and executive coordinator positions.
- #strong[Large-Scale Technical Events & Hackathons]: Managing team formations, problem statement selections, presentation slide uploads, and technical project repository submissions for flagship initiatives (such as the Smart India Hackathon internal editions).
- #strong[On-Site Physical Event Orchestration]: Providing dedicated on-site Registration Desk terminals for real-time attendee check-in, dynamic room/lab venue allocations, capacity monitoring, and physical kit distribution tracking.
- #strong[Targeted Institutional Communication]: Empowering event organizers with an executive Event Messaging Studio to compose and broadcast official institutional announcements across segmented audiences (Participants, Evaluators/Judges, Coordinators, and Volunteers) with locked branding and dynamic per-recipient personalization.
- #strong[High-Throughput Credential Issuance]: Ingesting verified registration and achievement records, dynamically mapping in-database PowerPoint XML templates, executing parallel headless LibreOffice PDF conversions, and distributing credentials directly to student inboxes over secure HTTPS channels.
- #strong[Public Credential Verification]: Exposing an open, fraud-proof verification portal (`/verify`) allowing recruiters, academic institutions, and employers to confirm credential legitimacy in real-time via cryptographic certificate IDs and responsive 16:9 dynamic PDF streams.


=== Problem the Project Solves

- #strong[Manual Data Entry, Fragmentation & Human Formatting Errors]: Eliminates scattered, unvalidated Google Forms and manual Excel workbooks by storing normalized candidate profiles in an edge cloud database (Turso Edge SQLite) with strict validation gates.
- #strong[On-Site Registration Chaos & Queue Bottlenecks]: Replaces paper check-in sheets with high-speed digital Registration Desk terminals featuring instant roll number lookups, allocated room verifications, and real-time attendance status toggles.
- #strong[Uncoordinated Multi-Group Event Messaging]: Solves disorganized announcement dissemination by providing an administrative messaging composer with multi-group audience selection (Members, Judges, Coordinators, Volunteers), locked institutional letterhead branding, and dynamic `{name}` personalizations.
- #strong[Cloud Container SMTP Egress Blocking]: Bypasses cloud container hosting limitations (where standard TCP SMTP ports 25, 465, and 587 are systematically blocked on free and entry tiers) by routing Base64-encoded PDF payloads over secure HTTPS (port 443) via a Google Apps Script Web App proxy directly into Google's authenticated Gmail API.
- #strong[Heavy Server CPU Bottlenecks & Document Generation Delays]: Replaces slow, single-threaded PDF generators with concurrency-controlled headless LibreOffice batch compilation running in sandboxed Debian Docker containers, producing hundreds of personalized PDF certificates in seconds.
- #strong[Rampant Credential Tampering & Certificate Fraud]: Eliminates unauthenticated, easily forged static PDF certificates by generating unique, cryptographically randomized certificate identifiers mapped to official database registers, verifiable by any third party via an interactive 16:9 dynamic viewer.
- #strong[Administrative Session Hijacking & Data Tampering]: Enforces defense-in-depth administrative security through HttpOnly SameSite=Lax JWT session cookies, Double-Submit CSRF header verification (`X-CSRF-Token`), multi-window rate limiting, and strict Role-Based Access Control (RBAC).


=== Target Users

1. #strong[Student Applicants & Participants]:
   - Browse institutional research domains, upcoming symposiums, workshops, and hackathons.
   - Submit membership applications, register for technical events, and form multi-member hackathon teams.
   - Upload project documentation, problem statements, GitHub repositories, and live demo links via dedicated submission portals.
   - Receive authenticated PDF credentials and offer letters directly in their personal inboxes.
2. #strong[On-Site Registration Desk Coordinators & Volunteer Staff]:
   - Authenticate via dedicated registration desk terminals (`/reg-desk/login`) using secure desk identifiers and 6-character temporary access codes.
   - Verify allocated presentation halls, computer labs, and venue capacities.
   - Search attendees dynamically by student PIN/roll number, full name, or team name.
   - Mark real-time attendance check-in with automatic coordinator timestamping and track badge/kit distribution.
3. #strong[Evaluators, Hackathon Judges & Keynote Dignitaries]:
   - Review submitted hackathon problem statements, technical project portfolios, and presentation decks.
   - Assign evaluation scores, rank team achievements, and receive official institutional Certificates of Recognition and Appreciation.
4. #strong[Club Administrators & Department Faculty Leads]:
   - Review, filter, approve, or reject club membership applications across academic engineering departments.
   - Schedule workshops, manage event calendars, and allocate physical rooms and presentation venues.
   - Compose and broadcast targeted event announcements via the executive Event Messaging Studio.
   - Trigger bulk certificate generation and email dispatches with live progress tracking and automated retry mechanics.
5. #strong[Super Administrators & Platform Developers]:
   - Manage system administrative accounts with strict RBAC privilege segregation (`developer`, `superadmin`, `admin`, `reg_desk`).
   - Provision temporary credentials for event coordinators with automated 1-week expiration windows.
   - Inspect real-time audit logs (`activity_logs`) tracking all administrative data mutations and email dispatches.
   - Synchronize PowerPoint master templates and manage database schemas and branch catalogs.
6. #strong[Employers, Academic Institutions & Public Verifiers]:
   - Scan QR codes embedded on physical certificates or navigate to `/verify`.
   - Query unique institutional certificate identifiers to instantly verify candidate authenticity, event dates, achievement classifications, and view high-resolution official PDF documents.


=== Core Functionality

1. #strong[Multi-Gateway Public Enrollment Hub]:
   - Unified application portal (`/apply`) with dedicated, normalized sub-routes (`/apply/ClubRegistration`, `/apply/EventRegistration`, `/apply/HackathonRegistration`, `/apply/Recognition`, `/apply/Volunteer`, `/apply/ProjectSubmission`).
   - Dynamic team formation interfaces allowing student leads to register multi-member rosters with client-side email format enforcement and duplicate entry prevention.
2. #strong[On-Site Registration Desk & Venue Orchestration Subsystem]:
   - Dedicated registration desk portal (`/reg-desk/login`) featuring an auto-focusing 6-box temporary password / OTP interface.
   - Real-time attendee roster search by college PIN or name, dynamic venue verification against `registration_rooms`, and single-click attendance status check-in.
   - Immediate synchronization across all active administrator screens via Server-Sent Events (SSE).
3. #strong[Executive Event Messaging & Multi-Group Announcement Studio]:
   - Multi-role audience filtering cards (Members/Participants, Judges/Evaluators, Coordinators, Volunteers) with live deduplicated recipient count badges.
   - Institutional letterhead writing surface with locked official college greetings and formal sign-offs to maintain institutional correspondence standards.
   - macOS-style Recipient Email Preview modal with responsive flexbox scrolling, simulated email client headers, and batch HTTPS dispatch.
4. #strong[Automated XML Slide Manipulation & Parallel Document Engine]:
   - Decompresses OpenXML PowerPoint presentations (`.pptx`) directly in memory via `PizZip`.
   - Injects `<a:spPr><a:noAutofit/></a:spPr>` tags into slide shapes to disable text auto-fit, preventing font compression for long candidate names.
   - Dynamic casing normalizer (`toProperCase`) preserving uppercase academic abbreviations (`CSE`, `ECE`, `AI&ML`, `SIH`).
   - Executes headless LibreOffice batch conversions in sandboxed Debian Docker containers with isolated `-env:UserInstallation` user profiles, eliminating configuration write-lock collisions during concurrent batch jobs.
5. #strong[Dual-Channel Cloud-Compatible Email Relay]:
   - Encodes generated PDF certificates into Base64 buffers and forwards JSON payloads over HTTPS (port 443) via a Google Apps Script Web App proxy directly into Google's authenticated Gmail API, completely bypassing hosting provider SMTP port blocks.
   - Automatic fallback to standard Nodemailer SMTP transport for local development environments.
6. #strong[Public Fraud-Proof Credential Verification & Dynamic 16:9 Streaming]:
   - Resolves certificate codes via `GET /api/verify-certificate/:id`, querying database registers to confirm issue status and event details.
   - Dynamically compiles the original high-resolution certificate on the fly and streams the raw PDF binary directly inline inside a responsive 16:9 widescreen frame.
7. #strong[Real-Time Administrative State Synchronization (SSE)]:
   - Persistent keep-alive Server-Sent Events channel (`/api/sync-stream`) broadcasting refresh signals (`REFRESH_APPLICATIONS`, `REFRESH_ATTENDANCE`, `REFRESH_SUBMISSIONS`) to update dashboard counters and tables across connected clients without manual page reloading.
8. #strong[Defense-in-Depth Security & Governance]:
   - Dual-JWT architecture: `admin_token` stored in HttpOnly SameSite=Lax cookies and `csrfToken` passed via `X-CSRF-Token` headers.
   - Multi-window rate limiters protecting public forms, authentication gates, and password recovery endpoints.
   - Stateful SHA-256 password recovery token cache with 1-hour expiration timestamps and immediate single-use invalidation.


=== High-Level System Architecture & Workflow



#figure(
  image("../media/figures/readme_fig1.svg", width: 95%),
  caption: [High-Level System Architecture & Workflow],
  kind: image,
)




#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



== Problem Statement

In conventional educational institutions and collegiate technical bodies, managing student applications, organizing hackathons, conducting on-site physical event registrations, and issuing authenticated credentials suffers from critical operational bottlenecks and vulnerabilities:

1. #strong[Scattered Student Registrations & Unstructured Data]:
   Collegiate teams rely on ad-hoc Google Forms and disjointed spreadsheets. Data resides across multiple unlinked sheets without referential integrity, making cross-event validation, duplicate filtering, and candidate tracking impossible.
2. #strong[On-Site Registration Chaos & Paper Check-In Bottlenecks]:
   During physical events and hackathons with hundreds of attendees, desk staff rely on printed paper rosters. Searching student roll numbers manually causes long physical queues, unrecorded attendance, room assignment confusion, and inaccurate kit distribution records.
3. #strong[Disorganized Multi-Group Event Announcements]:
   Broadcasting schedule changes, lab assignments, or judging criteria requires manual email copying into BCC fields. This introduces communication errors, misdirected messages, formatting inconsistencies, and lack of official college letterhead branding.
4. #strong[Manual Document Preparation & Design Distortions]:
   Staff manually open PowerPoint or graphic design templates, copy-pasting student names and roll numbers one by one. Long student names cause text-box auto-wrapping and font shrinking, distorting certificate layouts and taking hours of repetitive manual labor.
5. #strong[Severe Server CPU Bottlenecks & Execution Timeouts]:
   Compiling hundreds of high-resolution PDF documents on standard cloud servers triggers memory spikes, process lock collisions, and cloud gateway timeouts when handled sequentially.
6. #strong[Cloud Host SMTP Port Egress Blocking]:
   To prevent spam, modern cloud container hosting providers (such as Render, Heroku, AWS free tier) systematically block outgoing TCP traffic on standard SMTP ports (25, 465, and 587). Standard Nodemailer scripts fail with `ETIMEDOUT` errors, preventing direct automated email distribution.
7. #strong[Credential Forgery & Inability to Publicly Authenticate]:
   Static PDF certificates distributed via email are trivially manipulated using free online vector and PDF editors. Academic bodies, recruiters, and corporate hackathon sponsors have no automated channel to verify certificate authenticity against official institutional records.
8. #strong[Vulnerable Administrative Operations & Lack of Audit Trails]:
   Uncontrolled spreadsheets lack authentication gates, audit logs, or role-based access boundaries, leaving sensitive student records vulnerable to unlogged modifications, deletions, or data leaks.

This platform resolves these systemic inefficiencies through a unified, cloud-native architecture combining edge SQLite persistence, low-level XML template modification, parallel headless document compilation, HTTPS proxy email delivery, dedicated on-site check-in consoles, and public certificate verification.


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



== Existing System

The existing traditional institutional workflow operates through fragmented, manual procedures across isolated operational phases:

- #strong[Phase 1: Registration Collection]:
  Student signups for club recruitments, technical workshops, and hackathons are collected through disparate Google Forms, generating detached CSV and spreadsheet files for each initiative.
- #strong[Phase 2: Review & Evaluation]:
  Faculty coordinators and student leads manually review spreadsheet rows, updating candidate status in custom columns without centralized authorization or audit logging.
- #strong[Phase 3: On-Site Event Check-in]:
  On the day of the event, organizers print multi-page paper rosters. Attendees stand in long queues while volunteers manually strike through names with pens, manually recording room assignments and kit issuances on clipboards.
- #strong[Phase 4: Participant Communication]:
  Event updates are sent by manually copying student email addresses from spreadsheets into personal or departmental Gmail accounts, risking data leakage (accidental CC instead of BCC) and lacking standardized institutional branding.
- #strong[Phase 5: Certificate Design & Production]:
  Organizers open desktop graphic design tools (Photoshop, Canva) or PowerPoint templates. For each attendee, they manually copy-paste the student's name, department, and achievement status, then manually select "Export to PDF" one candidate at a time.
- #strong[Phase 6: Credential Distribution]:
  Staff draft standard emails, manually attach individual PDF files, and send them sequentially. For a 200-student hackathon, this manual process takes days of labor and is highly prone to sending the wrong certificate to the wrong student.
- #strong[Phase 7: Verification]:
  External recruiters or universities seeking to verify a student's credential must send an inquiry letter or email to the college administrative office, requiring manual human verification against paper archives.


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



== Limitations of Existing System

- #strong[High Rate of Human Formatting Errors]: Manual copy-pasting leads to misspelled candidate names, inaccurate achievement statuses (e.g. participant labeled as coordinator), and misaligned text boundaries on issued certificates.
- #strong[Severe Operational Inefficiency & Poor Scalability]: Managing 100+ candidates takes between 15 to 20 man-hours of manual editing, exporting, attaching, and mailing. As participant numbers grow, the manual workflow collapses.
- #strong[On-Site Queue Congestion & Lost Attendance Records]: Paper check-in sheets cause registration bottlenecks, paper damage, and misplaced attendance logs, leading to discrepancies when issuing certificates.
- #strong[Cloud SMTP Egress Failures]: Cloud-hosted servers cannot dispatch emails directly via standard SMTP ports due to egress firewall blocks on ports 25, 465, and 587, causing dispatch scripts to time out.
- #strong[Complete Absence of Tamper Detection]: Plain-text PDF documents distributed without digital verification can be easily altered using online PDF editors, creating severe exposure to academic credential fraud.
- #strong[Security Deficits & Lack of Role Isolation]: Unstructured spreadsheets lack access control, session validation, or transaction logging. Anyone with access to the sheet can modify status fields, delete rows, or leak student phone numbers without leaving an audit trail.
- #strong[Lack of Real-Time Coordination]: Multiple organizers working on separate copies of spreadsheets create conflicting records, duplicate registrations, and desynchronized rosters.


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



== Proposed System

The proposed platform establishes a fully automated, cloud-based institutional application management and credential processing ecosystem:

- #strong[Unified Digital Portal]: Dynamic React 19 single-page application providing specialized, rate-limited registration forms for club membership, technical workshops, hackathons, and project asset submissions, writing directly to an edge-replicated cloud database (Turso Edge SQLite).
- #strong[On-Site Registration Desk Subsystem]: High-speed check-in terminals for event volunteers featuring 6-box temporary password authentication, instant student PIN searching, room allocation verification, and real-time attendance status toggles.
- #strong[Executive Event Messaging Studio]: An administrative announcement composer enabling multi-group audience targeting (Participants, Judges, Coordinators, Volunteers), locked institutional letterhead branding, and dynamic `{name}` personalizations.
- #strong[Low-Level XML Slide Manipulation Engine]: In-memory parsing and modification of PowerPoint OpenXML archives (`PizZip`), dynamically replacing text tokens (`{NAME}`, `{EVENT}`, `{ROLE}`, `{DATE}`, `{CERT_ID}`) while injecting `<a:noAutofit/>` tags to preserve typography layouts and certificate margins.
- #strong[Containerized Parallel PDF Batch Compiler]: Spawns isolated headless LibreOffice CLI processes inside Debian Docker containers, batching document compilation in parallel concurrency pools (10 certificates per batch) with dedicated `-env:UserInstallation` configuration directories, eliminating profile write locks.
- #strong[HTTPS-Based Email Proxy Relay]: Bypasses cloud SMTP egress blocks by converting compiled PDF buffers into Base64 binaries and forwarding JSON payloads over HTTPS (port 443) to a Google Apps Script Web App proxy, which interacts natively with the Gmail API.
- #strong[Public Dynamic Credential Verification Portal]: An open verification interface (`/verify`) allowing anyone to validate certificate IDs, query matching database records, compile the certificate dynamically on the fly, and render it inline inside a responsive 16:9 widescreen frame.
- #strong[Defense-in-Depth Security & Auditing]: Enforces HttpOnly SameSite=Lax JWT session cookies, Double-Submit CSRF protection (`X-CSRF-Token`), multi-tier rate limiting, bcrypt cryptographic salt password hashing, stateful SHA-256 password recovery tokens, and comprehensive transaction audit logging (`activity_logs`).
- #strong[Real-Time Client Synchronization]: Establishes persistent Server-Sent Events (SSE) keep-alive channels (`/api/sync-stream`) to immediately broadcast database mutations to connected administrative and registration desk consoles without manual page reloads.


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



== Objectives

The technical and operational objectives of the platform are:
1. #strong[Automate the Complete Credentialing Lifecycle]: Transform raw registration records into personalized, verified PDF certificates delivered to recipient inboxes in under 3 seconds per candidate.
2. #strong[Digitize On-Site Event Check-In Operations]: Provide responsive, dedicated registration desk consoles that reduce attendee check-in latency to under 5 seconds per participant while dynamically validating venue assignments.
3. #strong[Streamline Multi-Group Institutional Communication]: Enable event administrators to dispatch branded, personalized announcements to hundreds of attendees, judges, coordinators, and volunteers with zero formatting drift.
4. #strong[Overcome Cloud Infrastructure SMTP Blocks]: Reliably distribute email payloads and PDF attachments across modern cloud container environments by routing requests over HTTPS (port 443) via Google Apps Script proxies.
5. #strong[Guarantee Document Design Layout Integrity]: Prevent typography distortion and text auto-fit compression on generated credentials through in-memory OpenXML node manipulations and custom font embedding.
6. #strong[Eliminate Academic Credential Forgery]: Provide an instant, public, fraud-proof certificate verification mechanism with obfuscated identifiers and dynamic on-the-fly PDF rendering.
7. #strong[Enforce Enterprise Security & Administrative Borders]: Implement strict Role-Based Access Control (RBAC) segregating Developer, Superadmin, Admin, and Registration Desk privileges, reinforced by HttpOnly cookies, Double-Submit CSRF validation, and immutable activity audit logs.
8. #strong[Facilitate Multi-Client Real-Time Collaboration]: Maintain synchronization across administrative and on-site check-in terminals using persistent Server-Sent Events (SSE) broadcast channels.


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



== Scope

The platform encompasses four interconnected operational domains:


=== 1. Public & Student Portal Domain

- Public institutional overview showcasing research domains, faculty advisory council, upcoming events calendar, and student FAQs.
- Centralized registration gateway (`/apply`) with dedicated, normalized sub-routes for Club Membership, Technical Event Attendance, Hackathon Team Enrollment, Evaluator Recognition, Volunteer Signups, and Project Submissions.
- Client-side input validation, dynamic multi-member team addition/removal, and strict email format checking.
- Public credential verification interface (`/verify`) with QR code scanning, certificate ID queries, and interactive 16:9 dynamic PDF rendering.


=== 2. On-Site Physical Event Management Domain

- Dedicated registration desk sign-in terminal (`/reg-desk/login`) with 6-box temporary password / OTP inputs.
- Live attendee roster inspection with real-time college PIN search and attendance status toggling.
- Physical presentation hall, computer lab, and review venue capacity tracking and desk assignment verification.
- Self-service password recovery for event coordinators via email reset links.


=== 3. Administrative Governance & Communication Domain

- Multi-tab administration dashboard for reviewing, filtering, approving, and archiving applications across Club recruitment, Events, Hackathons, Recognition, Volunteers, and Project Submissions.
- Executive Event Messaging Studio with interactive audience cards, locked institutional letterhead branding, recipient preview modals, and batch email dispatching.
- Master catalog management for academic engineering departments and branches.
- Institutional event calendar manager supporting event scheduling, speaker profiling, and venue allocation.
- Administrative account provisioning with strict RBAC privilege levels (Developer, Superadmin, Admin).
- Immutable audit logging (`activity_logs`) capturing all administrative data mutations, logins, and email dispatches.


=== 4. Cloud Processing & Compilation Domain

- In-database Base64 PowerPoint master template storage and synchronization.
- Low-level OpenXML slide decompilation, token injection, and auto-fit disabling engine.
- Concurrency-controlled parallel headless LibreOffice CLI document compilation in sandboxed Docker containers.
- HTTPS-based JSON email proxy relay communicating with Google Apps Script gateways.
- Server-Sent Events (SSE) keep-alive broadcast pool for real-time multi-client synchronization.


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)

