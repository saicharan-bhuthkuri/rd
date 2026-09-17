= SYSTEM DESIGN


== System Architecture


The Bulk Certificate Dispatch & Application Management System utilizes a modern, decoupled, multi-tiered cloud architecture designed for high throughput, edge-optimized data access, and sandboxed document compilation.


=== System Architecture Flow Diagram



==== Figure 2: Multi-Tier Cloud Infrastructure Diagram




#figure(
  image("../media/figures/readme_fig2.svg", width: 95%),
  caption: [Multi-Tier Cloud Infrastructure Diagram],
  kind: image,
)




==== Figure 3: End-to-End Application & Credential Lifecycle Workflow




#figure(
  image("../media/figures/readme_fig3.svg", width: 95%),
  caption: [End-to-End Application & Credential Lifecycle Workflow],
  kind: image,
)




==== Figure 4: Multi-Role Authentication & CSRF Protection Workflow




#figure(
  image("../media/figures/readme_fig4.svg", width: 95%),
  caption: [Multi-Role Authentication & CSRF Protection Workflow],
  kind: image,
)




==== Figure 5: Self-Service Password Recovery & Reset Workflow




#figure(
  image("../media/figures/readme_fig5.svg", width: 95%),
  caption: [Self-Service Password Recovery & Reset Workflow],
  kind: image,
)




#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



=== Core Architectural Subsystems



==== 1. Frontend Client ([`Vite + React + TypeScript`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend))

- #strong[Role & Host]: The user interface is built as a Single Page Application (SPA) using React 19 and compiled with Vite. It is hosted on #strong[Firebase Hosting] for high-availability CDN-level static asset delivery.
- #strong[Routing]: Managed via #strong[React Router DOM v7], separating public pages (such as registration and verification) from protected admin features using client-side route guards and tokens.
- #strong[State & Syncing]: To ensure real-time collaboration across multiple administrator panels, the client establishes a persistent connection to the backend's `/api/sync-stream` endpoint using the browser's native `EventSource` (SSE) API in [`App.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/App.tsx#L106-L129). Upon receiving sync events, it revalidates internal states and refreshes tables.


==== 2. Backend Server ([`Node.js + Express + TypeScript`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend))

- #strong[Role & Host]: Functions as the core backend orchestrator, packaged within a #strong[Docker Container] and deployed on #strong[Render Web Services]. It hosts the REST endpoints, implements JWT-based authentication guards, and operates the file-generation worker threads.
- #strong[Concurrency Control]: Implements standard concurrency-limiting utility [`runWithConcurrency`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts#L1327-L1359) to pace and queue CPU-heavy PowerPoint edits and PDF conversions, avoiding system locks or container OOM errors.


==== 3. Database Layer ([`Turso Edge Database`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts#L39-L53))

- #strong[Role & Architecture]: Leverages Turso DB, a serverless edge SQLite driver powered by `libsql`. Queries are executed directly as raw parameterized SQL strings via the `@libsql/client` SDK.
- #strong[Dynamic Template Cache]: Synced PowerPoint templates are converted to Base64 and stored directly inside the `templates` database table, enabling zero-downtime hot reloading of certificate layouts without changing Docker assets.


==== 4. Template Manipulation Engine ([`PizZip XML Editor`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts#L12))

- #strong[Role & Mechanism]: To substitute certificate text placeholders on the fly without heavy PowerPoint COM objects or full decompression, the system utilizes `PizZip` in memory.
- #strong[XML Injection]: Parses the `.pptx` zip structure, reads target slide XML code (`ppt/slides/slide1.xml`), and performs raw string replacement for custom tags (`{NAME}`, `{ROLE}`, `{EVENT}`, `{DATE}`, `{CERT_ID}`). It updates specific XML nodes, keeping structural fonts and sizing styling contexts intact while disabling PPTX text autofit to avoid text compression.


==== 5. Headless PDF Converter Subsystem ([`Headless LibreOffice`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts#L1291-L1324))

- #strong[Role & Deployment]: Converts PPTX layouts into portable documents (PDF).
- #strong[Batch Execution]: Instantiating separate headless `soffice` sub-processes for every document results in significant CPU overhead. The system bundles multiple conversion files into a single execution context via [`convertPptxToPdfBatch`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts#L1291-L1324).
- #strong[Race Condition Isolation]: Uses unique user installation folder paths (`-env:UserInstallation=file://...`) for each parallel batch call, isolating LibreOffice runtime locks.
- #strong[Fallback Handler]: On local development Windows environments, the server falls back to sequential Windows ActiveX COM commands, ensuring zero local dependencies for developers.


==== 6. Email Dispatch Subsystem ([`Google Apps Script Proxy`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts#L1247-L1289))

- #strong[Role & Technique]: Resolves Render outbound SMTP port blocking on the free tier.
- #strong[HTTPS Proxy Relay]: Converts compiled PDF buffers into Base64 strings and ships them inside a JSON payload over HTTPS (port 443) using an HTTP POST to a secure, custom #strong[Google Apps Script Web App].
- #strong[Gmail SMTP Delivery]: The Google Script proxy, authenticated with Google API credentials, constructs and sends email packages containing PDF attachments directly via the candidate-facing Gmail profile.
- #strong[Fallback]: Retains standard `nodemailer` SMTP client configurations for offline or local test runs.


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



=== System Use Case Boundaries



==== Figure 6: System Use Case Boundaries Diagram




#figure(
  image("../media/figures/readme_fig6.svg", width: 95%),
  caption: [System Use Case Boundaries Diagram],
  kind: image,
)




#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



=== Data Flow Diagrams (DFD)



==== Figure 7: DFD Level 0: Context Diagram




#figure(
  image("../media/figures/readme_fig7.svg", width: 95%),
  caption: [DFD Level 0: Context Diagram],
  kind: image,
)




==== Figure 8: DFD Level 1: Subsystem Process Diagram




#figure(
  image("../media/figures/readme_fig8.svg", width: 95%),
  caption: [DFD Level 1: Subsystem Process Diagram],
  kind: image,
)




#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



=== Sequence Diagrams


The sequence diagrams trace actors and core execution steps for key application pathways.


==== Figure 9: Sequence Diagram A: Authentication & Real-Time Sync Connection




#figure(
  image("../media/figures/readme_fig9.svg", width: 95%),
  caption: [Sequence Diagram A: Authentication & Real-Time Sync Connection],
  kind: image,
)




==== Figure 10: Sequence Diagram B: Bulk Certificate Compilation & Dispatch Flow




#figure(
  image("../media/figures/readme_fig10.svg", width: 95%),
  caption: [Sequence Diagram B: Bulk Certificate Compilation & Dispatch Flow],
  kind: image,
)




==== Figure 11: Sequence Diagram C: Public Credential Verification & Dynamic Rendering




#figure(
  image("../media/figures/readme_fig11.svg", width: 95%),
  caption: [Sequence Diagram C: Public Credential Verification & Dynamic Rendering],
  kind: image,
)




==== Figure 12: Sequence Diagram D: Event Messaging Broadcast & Announcement Dispatch Flow




#figure(
  image("../media/figures/readme_fig12.svg", width: 95%),
  caption: [Sequence Diagram D: Event Messaging Broadcast & Announcement Dispatch Flow],
  kind: image,
)




==== Figure 13: Sequence Diagram E: Registration Desk Check-In & Room Allocation Flow




#figure(
  image("../media/figures/readme_fig13.svg", width: 95%),
  caption: [Sequence Diagram E: Registration Desk Check-In & Room Allocation Flow],
  kind: image,
)




==== Figure 14: Sequence Diagram F: Project Submissions & Hackathon Team Verification Flow




#figure(
  image("../media/figures/readme_fig14.svg", width: 95%),
  caption: [Sequence Diagram F: Project Submissions & Hackathon Team Verification Flow],
  kind: image,
)




#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)






==== Figure 15: Production & Cloud Deployment Architecture Diagram




#figure(
  image("../media/figures/readme_fig15.svg", width: 95%),
  caption: [Production & Cloud Deployment Architecture Diagram],
  kind: image,
)




#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)





==== Figure 16: External Service Dependency Diagram




#figure(
  image("../media/figures/readme_fig16.svg", width: 95%),
  caption: [External Service Dependency Diagram],
  kind: image,
)




#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)




#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)




=== Architecture Layer Responsibilities



#figure(
  table(
  columns: (1fr, 1.3fr, 2fr),
  stroke: 0.5pt + luma(180),
  fill: (col, row) => if row == 0 { rgb("#e8f0fe") } else { none },
  inset: (x: 3.5pt, y: 3.5pt),
  table.header([#strong[Layer]], [#strong[Technology]], [#strong[Responsibility]]),
  [#strong[Presentation]], [React + TypeScript], [Dynamic UI views, client-side route guards, and forms validation.],
  [#strong[Routing]], [React Router], [Navigations mapping, nested administrator layouts, and search query parameters.],
  [#strong[API]], [Express + TypeScript], [REST API controller routes, file streams, and system orchestration.],
  [#strong[Security]], [JWT + CSRF + Rate Limiting], [Session validation, CSRF headers double-submit checks, and request rate bounds.],
  [#strong[Database]], [Turso SQLite], [Cloud edge persistent application tables, indexes, and logs auditing.],
  [#strong[Document Engine]], [PizZip], [In-memory PPTX ZIP archive extraction and slide XML token overrides.],
  [#strong[PDF Engine]], [Headless LibreOffice], [Headless soffice CLI compiler converts pptx drafts to PDF formats.],
  [#strong[Distribution]], [Apps Script + Gmail API], [Google Web App proxy routes base64 attachments over HTTPS (port 443).],
  [#strong[Synchronization]], [Server-Sent Events (SSE)], [EventSource TCP streams push live updates to active admin dashboards.],
  [#strong[Hosting]], [Firebase + Render], [Firebase CDN handles static UI pages; Render handles Dockerised backend service.],
),
  caption: [Architecture Layer Responsibilities],
)



== System Design


=== A. System Data Flows



=== User Event Registration Flow


```text
[ Attendee Form ] -> [ Input Validation ] -> [ POST /api/apply/event ] -> [ Turso DB Event Table ] -> [ SSE Sync Emitted ] -> [ Dashboard Refreshes ]
```



=== Bulk Certificate Dispatch Flow


```text
1. Admin clicks "Send Certificates"
2. Express gets recipient roster & template buffers
3. Modifies PPTX XML placeholders
4. Runs batch LibreOffice PDF conversions
5. Encodes PDFs to Base64
6. Posts payloads to Google Apps Script proxy
7. Updates registration status to "Sented" in DB
8. Emits SSE event to update admin dashboard
```



#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)




=== B. Routes and Pages


Below are the mapped routes defined within [`frontend/src/App.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/App.tsx):


#figure(
  table(
  columns: (1.3fr, 1.2fr, 0.9fr, 1.8fr),
  stroke: 0.5pt + luma(180),
  fill: (col, row) => if row == 0 { rgb("#e8f0fe") } else { none },
  inset: (x: 3.5pt, y: 3.5pt),
  table.header([#strong[Route Path]], [#strong[View Component]], [#strong[Access Privileges]], [#strong[Purpose]]),
  [`/`], [`HomePage`], [Public], [Welcome portal, overview of cell divisions, and list of upcoming events.],
  [`/about`], [`AboutPage`], [Public], [Core background information and goals of the R&D Cell.],
  [`/research`], [`ResearchPage`], [Public], [Highlights research domains (Edge AI, Web3, TinyML).],
  [`/events`], [`EventsPage`], [Public], [Renders registered events.],
  [`/benefits`], [`BenefitsPage`], [Public], [Details perks of joining, certifications, and recommendations.],
  [`/team`], [`TeamPage`], [Public], [Core team member directories.],
  [`/faqs`], [`FAQPage`], [Public], [Renders answers to common questions.],
  [`/contact`], [`ContactPage`], [Public], [Form to submit questions and feedback.],
  [`/apply`], [`ApplyPage`], [Public], [Single enrollment portal for club membership, events, or hackathons.],
  [`/apply/:registrationType`], [`ApplyPage`], [Public], [Direct deep-linked registration routes (`HackathonRegistration`, `ClubRegistration`, `EventRegistration`).],
  [`/verify`], [`VerifyCertificatePage`], [Public], [Public certificate validator and PDF viewer.],
  [`/reg-desk/login`], [`RegDeskLoginPage`], [Public], [Dedicated Registration Desk sign-in with 6-character temporary password / OTP box inputs.],
  [`/reg-desk/forgot-password`], [`RegDeskForgotPasswordPage`], [Public], [Self-service credential recovery for registration desk staff.],
  [`/reg-desk/reset-password`], [`RegDeskResetPasswordPage`], [Public], [Secure password reset with token verification for desk personnel.],
  [`/reg-desk`], [`Navigate`], [Registration Desk / Admin], [Redirects to `/reg-desk/dashboard`.],
  [`/reg-desk/dashboard`], [`RegDeskDashboardPage`], [`reg_desk` / Admin], [On-site attendee search, PIN lookup, attendance marking, and kit/badge distribution tracking.],
  [`/admin/login`], [`AdminLoginPage`], [Public], [Secure Admin Console login with password show/hide toggle.],
  [`/admin/forgot-password`], [`AdminForgotPasswordPage`], [Public], [Password reset request with 15-minute expiring signed tokens.],
  [`/admin/reset-password`], [`AdminResetPasswordPage`], [Public], [Secure password reset submission with token validation.],
  [`/admin/dashboard`], [`Navigate`], [Authenticated Admin], [Redirects to default admin section (`/admin/club`).],
  [`/admin/club`], [`AdminDashboardPage`], [Authenticated Admin], [Roster of club recruitment applicants and offer letter dispatch.],
  [`/admin/events`], [`AdminDashboardPage`], [Authenticated Admin], [Roster of event registrations, certificate actions, and dispatches.],
  [`/admin/hackathons`], [`AdminDashboardPage`], [Authenticated Admin], [Roster of registered teams and members for hackathons.],
  [`/admin/recognition`], [`AdminDashboardPage`], [Authenticated Admin], [Roster of judges, evaluators, and dignitaries with certificates of appreciation.],
  [`/admin/volunteers`], [`AdminDashboardPage`], [Authenticated Admin], [Roster of student volunteers with event assignment and certificates.],
  [`/admin/submissions`], [`AdminDashboardPage`], [Authenticated Admin], [Hackathon project submissions and abstract review roster.],
  [`/admin/project-submissions`], [`AdminDashboardPage`], [Authenticated Admin], [Event project deliverables and Google Drive file attachments.],
  [`/admin/users`], [`AdminUsersPage`], [Developer / Superadmin], [Management view to list or delete admin accounts.],
  [`/admin/users/create`], [`AdminCreateUserPage`], [Developer / Superadmin], [Creates new admin accounts with role constraints.],
  [`/admin/events/manage`], [`AdminManageEventsPage`], [Authenticated Admin], [Manage and delete created events.],
  [`/admin/events/create`], [`AdminCreateEventPage`], [Authenticated Admin], [Form to register new technical events.],
  [`/admin/branches`], [`AdminBranchesPage`], [Authenticated Admin], [Roster of engineering departments and branches.],
  [`/admin/reg-desk`], [`AdminRegDeskPage`], [Authenticated Admin], [Management of registration desk coordinator credentials and event assignments.],
  [`/admin/messaging`], [`AdminMessagingPage`], [Authenticated Admin], [Event announcement composer with recipient group checkboxes, locked greeting/sign-off, and batch email dispatch.],
  [`/admin/rooms`], [`AdminRoomsPage`], [Authenticated Admin], [Lab, presentation hall, and room allocation for event and hackathon tracks.],
),
  caption: [Frontend Application Route Definitions],
)



#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)




=== C. Subsystem Relationships



==== Figure 17: Frontend–Backend–Database Multi-Tier Relationship Diagram




#figure(
  image("../media/figures/readme_fig17.svg", width: 95%),
  caption: [Frontend-Backend-Database Multi-Tier Relationship Diagram],
  kind: image,
)




#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)




#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



== Module Design

The proposed institutional system is structured into 13 core functional modules:


=== Module 1 — Student Application Management

- #strong[Description]: Consists of public-facing enrollment portals, dedicated registration routes, and registration sheets.
- #strong[Code Components]: `ApplyPage.tsx`, recruitment signup sheets, event attendee registry forms.
- #strong[Functionality]: Dynamically renders input rows for team signups (hackathons), collects candidate details, branches, sections, and interest descriptions, and handles rate-limited signups. Supports direct dedicated registration routes (`/apply/HackathonRegistration`, `/apply/ClubRegistration`, `/apply/EventRegistration`) with automatic route normalization.


=== Module 2 — Administrator Management

- #strong[Description]: Controls administrative dashboard consoles and supervisor actions.
- #strong[Code Components]: `AdminLoginPage.tsx`, `AdminLayout.tsx`, `AdminDashboardPage.tsx`, `AdminBranchesPage.tsx`, `AdminCreateUserPage.tsx`.
- #strong[Functionality]: Multi-tab table view (Club recruitment, Event attendance lists, Hackathon registries, Recognition/Dignitaries, Volunteers, Project Submissions) with search filters, branch list editors, event calendar creators, and account registrars.


=== Module 3 — Automated Certificate Engine

- #strong[Description]: Parses slides and compiles high-resolution credentials.
- #strong[Code Components]: `replacePlaceholdersInPptx()`, `convertPptxToPdfBatch()` inside `backend/src/index.ts`.
- #strong[Functionality]: Normalizes casing status labels, selects templates from DB cache (Base64), edits Slide XML nodes in-memory via PizZip, forces font overrides, and converts slides to PDF concurrently using Docker headless LibreOffice.


=== Module 4 — Automated Email Distribution

- #strong[Description]: Relays credentials directly to recipient mailboxes.
- #strong[Code Components]: `postToAppsScript()` in `backend/src/index.ts`, Nodemailer SMTP transport fallback.
- #strong[Functionality]: Converts PDF buffers into Base64 binaries, packages payloads as JSON, and forwards queries over HTTPS (port 443) to Google Apps Script gateways.


=== Module 5 — Certificate Verification

- #strong[Description]: Prevents fraud through public lookup validator sheets.
- #strong[Code Components]: `VerifyCertificatePage.tsx`, `GET /api/verify-certificate/*` endpoints.
- #strong[Functionality]: Scans verification codes, retrieves matching applicant metadata from Turso Edge DB, compiles PPTX slides on the fly, converts to PDF, and streams the PDF buffer directly inline inside a 16:9 widescreen frame.


=== Module 6 — Security

- #strong[Description]: Governs borders, rates, and authentications.
- #strong[Code Components]: CORS filters, `express-rate-limit` gateways, JWT session cookies, Double-Submit CSRF headers checks, Bcrypt salting algorithms, password recovery reset token caches, and registration desk role segregation.


=== Module 7 — Real-Time Synchronization

- #strong[Description]: Synchronizes active administrative clients.
- #strong[Code Components]: SSE endpoints stream `GET /api/sync-stream`, frontend EventSource hooks.
- #strong[Functionality]: Maintains open keep-alive connections; broadcasts refresh commands on DB updates; triggers UI table updates dynamically.


=== Module 8 — Event Messaging & Multi-Group Communication Engine

- #strong[Description]: Broadcasts official institutional announcements to targeted event audience segments.
- #strong[Code Components]: `AdminMessagingPage.tsx`, `POST /api/admin/messaging/send`, `GET /api/admin/messaging/recipients`.
- #strong[Functionality]:
  - #strong[Audience Filtering via Checkboxes]: Targets Members (Participants), Judges, Coordinators, Volunteers, or all groups simultaneously with deduplication.
  - #strong[Locked Official Branding]: Top greeting (`Dear Mr./Ms. {name}, We are pleased to share an important announcement regarding "[Event]".`) and bottom sign-off (`Warm regards, Event Organizing Committee & R&D Cell, Trinity College of Engineering & Technology (Autonomous), Peddapalli`) are locked as non-editable boilerplate to guarantee institutional standards.
  - #strong[Editable Middle Text]: The Admin only writes and edits the middle announcement body.
  - #strong[Dynamic Per-Recipient Personalization]: Automatically replaces `{name}` with each recipient's actual verified name upon sending.
  - #strong[Live Email Preview Modal]: Previews the rendered email formatted in the institutional light theme before sending.
  - #strong[High-Throughput Batch Delivery]: Sends emails concurrently with error resilience via the Google Apps Script HTTPS proxy.


=== Module 9 — Registration Desk & Physical Event Check-In Subsystem

- #strong[Description]: Streamlines in-person event check-in, attendance verification, and badge/kit distribution on event day.
- #strong[Code Components]: `AdminRegDeskPage.tsx`, `RegDeskLoginPage.tsx`, `RegDeskDashboardPage.tsx`, `RegDeskForgotPasswordPage.tsx`, `RegDeskResetPasswordPage.tsx`, `POST /api/reg-desk/login`, `GET /api/reg-desk/attendees`, `POST /api/reg-desk/attendance`.
- #strong[Functionality]:
  - #strong[Desk Coordinator Account Management]: Admins assign coordinators with unique Desk IDs (e.g., `REG-DESK-01`), assigned events, and 6-character temporary passwords with 1-week expiry.
  - #strong[Temporary Password OTP Input UI]: A 6-box OTP entry interface tailored for mobile and laptop check-in terminals.
  - #strong[Attendee Lookup]: Live search across attendees by PIN, name, email, or mobile phone.
  - #strong[One-Click Attendance Marking]: Logs check-in timestamp and coordinator attribution (`attendance_marked_at`, `attendance_marked_by`).
  - #strong[Self-Service Credential Recovery]: Dedicated forgot/reset password flow for registration desk staff.


=== Module 10 — Venue & Room Allocation Subsystem

- #strong[Description]: Assigns computer labs, seminar halls, and presentation venues to event tracks and hackathon rounds.
- #strong[Code Components]: `AdminRoomsPage.tsx`, `GET /api/admin/rooms`, `POST /api/admin/rooms`, `DELETE /api/admin/rooms/:id`.
- #strong[Functionality]: Manages room codes, room names, capacities, assigned registration desks, and event association (`registration_rooms`).


=== Module 11 — Project Submissions & Abstract Review Subsystem

- #strong[Description]: Collects project code repositories, Google Drive presentation decks, and problem statement write-ups.
- #strong[Code Components]: `project_submissions` table, submission review dashboard tabs.
- #strong[Functionality]: Stores Drive file/folder IDs, URLs, problem statement categories, and submission status for jury evaluation.


=== Module 12 — Recognition, Dignitaries & Volunteer Management

- #strong[Description]: Orchestrates invitations, profiles, and certificates for guest speakers, jury members, evaluators, and student organizers.
- #strong[Code Components]: `recognition_applications` and `volunteer_applications` management views, dedicated appreciation certificate dispatches.


=== Module 13 — Institutional Design System & Landing Page Light Theme

- #strong[Description]: Enforces a clean, modern, and accessible visual design language across the entire platform.
- #strong[Key Visual Standards]:
  - #strong[Canvas & Surfaces]: Clean white cards (`#ffffff`) on neutral slate background (`#f8fafc`) with subtle borders (`#e2e8f0`).
  - #strong[Primary Institutional Accent]: Emerald green (`#059669` / `#047857`) signifying innovation, growth, and institutional authority.
  - #strong[Email Templates]: HTML emails styled with white cards, emerald headers, clean typography, and responsive widths to match the web portal aesthetics.


=== Mapped Technical Features

Below are the implementation details of key features mapped to their modules:

The system is split into distinct functional modules:


=== A. Fully Implemented Features



==== 1. Dynamic Certificate Actions & Template Resolution

- #strong[What it does]: Admins choose specific actions per student. The system parses casing normalized strings (e.g., `'won Second Place'` \$\rightarrow\$ `"Won Second Place"`) and maps them to the appropriate pptx template. Participation keywords map to the `Participation Template`, whereas others map to the `Appreciation Template` and inject custom achievement titles.
- #strong[Implementation Location]: [`backend/src/index.ts:L1588-1839`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts#L1588-1839)
- #strong[Frontend Component]: [`AdminDashboardPage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/pages/AdminDashboardPage.tsx)
- #strong[Backend API]: `POST /api/admin/bulk-send/certificates`
- #strong[Database Tables]: `event_registrations`, `templates`, `events`
- #strong[Auth Requirements]: Admin JWT token required.


==== 2. Automatic Modification Guard & Status Indicators

- #strong[What it does]: Once a certificate is successfully sent, the status updates to `Sented` (represented by a green badge), and the select action dropdown is permanently disabled with a `not-allowed` cursor to prevent post-dispatch modifications.
- #strong[Implementation Location]: [`AdminDashboardPage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/pages/AdminDashboardPage.tsx)
- #strong[Auth Requirements]: Admin JWT authentication.


==== 3. Hackathon Team Registrations & Bulk Certificate Engine

- #strong[What it does]: An interactive application form that dynamically appends team member input rows, collects role designations (Student vs Professional), captures disclaimers, and exports customized participant certificates for the whole team (including leaders).
- #strong[Implementation Location]: [`ApplyPage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/pages/ApplyPage.tsx) and [`backend/src/index.ts:L1842-2141`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts#L1842-2141)
- #strong[Backend API]: `POST /api/apply/hackathon`, `POST /api/admin/bulk-send/hackathon-certificates`
- #strong[Database Tables]: `hackathon_registrations`, `templates`


==== 4. Headless LibreOffice PDF Compiler (Batch Mode)

- #strong[What it does]: Feeds the PPTX paths to LibreOffice CLI (`soffice`), converting files in a single batch to reduce startup overhead to less than 2 seconds.
- #strong[Implementation Location]: [`backend/src/index.ts:L1291-1324`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts#L1291-1324)


==== 5. Public Certificate Verification Portal

- #strong[What it does]: Public interface validating certificate IDs (e.g. `TCEK/RD/2026-A9B2E3F4` or `TCEK/RD/HACK/2026-A9B2E3F4`), querying metadata, compiling the PPTX on the fly, converting it to PDF, and streaming the file buffer inline inside a 16:9 widescreen frame.
- #strong[Implementation Location]: [`VerifyCertificatePage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/pages/VerifyCertificatePage.tsx) and [`backend/src/index.ts:L2317-2466`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts#L2317-2466)
- #strong[Backend API]: `GET /api/verify-certificate/*`
- #strong[Database Tables]: `event_registrations`, `events`, `templates`
- #strong[Auth Requirements]: None (Public Access).


==== 6. Live Synchronizer (SSE Stream)

- #strong[What it does]: Binds clients to an HTTP Server-Sent Events pool. When registrations, events, or branches are updated, it emits sync events (`REFRESH_APPLICATIONS`, `REFRESH_EVENTS`, `REFRESH_BRANCHES`) causing active admin screens to reload data instantly.
- #strong[Implementation Location]: [`backend/src/index.ts`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts) and [`App.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/App.tsx)


==== 7. Cookie-based Session Authentication & CSRF Protection

- #strong[What it does]: Dynamic Token/Cookie Authentication: On login, the backend issues an HttpOnly cookie and returns a signed JWT. In cross-origin production (Firebase to Render), the client attaches the JWT to the `Authorization` header. In same-site deployments, the backend authenticates requests via the HttpOnly cookie fallback. Mutating requests validate a double-submit CSRF token via the `X-CSRF-Token` header.
- #strong[Implementation Location]: [`backend/src/index.ts`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts) and [`App.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/App.tsx)
- #strong[Auth Requirements]: Enforced across all administrative paths.


==== 8. Automated Administrator Account Recovery

- #strong[What it does]: Self-service forgot-password workflow. Admins enter their registered email, which generates a short-lived (15 minutes) secure, stateful, one-time reset token stored in the database. Clicking the link takes the user to a reset page where the React frontend automatically parses and validates the token. If expired or already used, it blocks form entry and displays a warning.
- #strong[Implementation Location]: [`AdminForgotPasswordPage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/pages/AdminForgotPasswordPage.tsx), [`AdminResetPasswordPage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/pages/AdminResetPasswordPage.tsx), and [`backend/src/index.ts`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts)
- #strong[Backend API]: `POST /api/admin/forgot-password`, `POST /api/admin/reset-password`
- #strong[Database Tables]: `admin_users`, `password_reset_tokens`


==== 9. Hide/Unhide Password Toggle

- #strong[What it does]: Adds a show/hide password visibility toggle directly inside the admin login credentials form to enhance usability and prevent entry mistakes.
- #strong[Implementation Location]: [`AdminLoginPage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/pages/AdminLoginPage.tsx)


==== 10. Background Task Processing Engine & Real-Time Console Monitor

- #strong[What it does]: Decouples heavy, long-running batch operations (such as compiling hundreds of PPTX templates into PDFs and dispatching certificates via email) from the HTTP request-response cycle. Uses an asynchronous `TaskManager` that persists task records in the database (`task_records`), streams real-time step-by-step progress and logs to the browser via Server-Sent Events (SSE: `GET /api/tasks/:id/stream`), allows live cancellation/abort, and provides an interactive Historical Task Logs Viewer on the Admin Dashboard.
- #strong[Implementation Location]: [`backend/src/taskManager.ts`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/taskManager.ts), [`backend/src/index.ts`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts), and [`AdminDashboardPage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/pages/AdminDashboardPage.tsx)
- #strong[Backend APIs]: `POST /api/tasks/start`, `GET /api/tasks/:id/stream`, `GET /api/tasks/history`, `POST /api/tasks/:id/cancel`
- #strong[Database Table]: `task_records`


==== 11. Centralized Google Drive Project Submission Vault

- #strong[What it does]: Ensures all student hackathon team submissions, presentation decks, and project files are automatically organized and archived exclusively in the official Google Drive of `tcekrdcell@gmail.com` under `R&D Cell - Project Submissions > [Event] > [Team]`. Sets view-only sharing permissions and registers public drive links in the database.
- #strong[Implementation Location]: [`backend/src/index.ts`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts#L2095) and [`backend/google_drive_proxy.gs`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/google_drive_proxy.gs)
- #strong[Configuration]: Bound via `DRIVE_UPLOAD_PROXY_URL`


==== 12. Multi-Account Email Failover Cluster

- #strong[What it does]: Bypasses cloud host SMTP blocks by pooling multiple Google Apps Script Web App proxies (`tcekrdcell@gmail.com`, `team.tcekrdcell@gmail.com`, `trinityrd39@gmail.com`, etc.). If any proxy exhausts its daily quota (100 emails/day), the cluster automatically marks it inactive for 24 hours and fails over to the next proxy in line, followed by Brevo REST API (300 emails/day) and Nodemailer direct SMTP.
- #strong[Implementation Location]: [`backend/src/index.ts`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts#L1188-L1240)
- #strong[Configuration]: Set via comma-separated `GMAIL_HTTP_PROXY_URL`


=== B. Partially Implemented Features

- #strong[Nodemailer SMTP Fallback]: Configured to send email via standard SMTP on host port 587 using the `transporter` client, but is generally blocked on cloud environments like Render. Cloud deployments rely primarily on the `GMAIL_HTTP_PROXY_URL` multi-proxy pool and Brevo API.
- #strong[Activity Logs Audit]: Database records are added to `activity_logs` for login/event creation/branch modifications, viewable via database queries or task history.


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)




#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)

