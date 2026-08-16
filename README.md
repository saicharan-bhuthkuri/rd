# Trinity College R&D Cell - Bulk Certificate Dispatch & Application Management System

A high-performance, developer-friendly enterprise dashboard and student engagement portal designed to automate club recruitments, manage event registrations, and orchestrate real-time bulk certificate generation and email dispatch.

The system features dynamic template compilation by directly parsing PowerPoint (`.pptx`) XML layouts, executing lightning-fast parallel conversions to PDF using headless LibreOffice, and shipping finalized credentials via an HTTP-based Google Apps Script Gmail proxy to bypass cloud port blocks.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Key Features](#2-key-features)
3. [Complete Technology Stack](#3-complete-technology-stack)
4. [Complete Folder and File Structure](#4-complete-folder-and-file-structure)
5. [Application Architecture](#5-application-architecture)
6. [Frontend Documentation](#6-frontend-documentation)
7. [Backend Documentation](#7-backend-documentation)
8. [API Documentation](#8-api-documentation)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Database Documentation](#10-database-documentation)
11. [Environment Variables](#11-environment-variables)
12. [Third-Party Services & Integrations](#12-third-party-services--integrations)
13. [Complete Deployment Documentation](#13-complete-deployment-documentation)
14. [Production Architecture](#14-production-architecture)
15. [Development Workflow](#15-development-workflow)
16. [Testing](#16-testing)
17. [Build & Production](#17-build--production)
18. [CI/CD](#18-cicd)
19. [Error Handling & Troubleshooting](#19-error-handling--troubleshooting)
20. [Security](#20-security)
21. [Dependencies](#21-dependencies)
22. [Important Code Components](#22-important-code-components)
23. [Data Flow](#23-data-flow)
24. [Routes & Pages](#24-routes--pages)
25. [Database/API/Frontend Relationship](#25-databaseapifrontend-relationship)
26. [Common Commands](#26-common-commands)
27. [Deployment Checklist](#27-deployment-checklist)
28. [Maintenance Guide](#28-maintenance-guide)
29. [Limitations & Known Issues](#29-limitations--known-issues)
30. [Future Improvements](#30-future-improvements)
31. [Developer Quick Start](#31-developer-quick-start)
32. [Production Quick Reference](#32-production-quick-reference)
33. [External Service Dependency Map](#33-external-service-dependency-map)
34. [Core Algorithms Pseudocode](#34-core-algorithms-pseudocode)

---

## 1. Project Overview

### Project Name
Trinity College R&D Cell - Bulk Certificate Dispatch & Application Management System

### Production URLs
* **Deployed Web Application (Client)**: [https://tcek-rd.web.app](https://tcek-rd.web.app)
* **Deployed API Server (Backend)**: [https://rd-backend-kbsm.onrender.com](https://rd-backend-kbsm.onrender.com)
* **Designer/Developer Portfolio**: [https://saivortex.web.app/](https://saivortex.web.app/)

### Project Purpose
The Research & Development (R&D) Cell at Trinity College requires a robust infrastructure to manage student applications for club membership, organize hackathons and technical events, and issue official authenticated credentials. This project digitizes these operations, replacing manual certificates and spreadsheets with an automated pipeline.

### Problem the Project Solves
* **Manual Data Entry & Errors**: Replaces manual formatting of certificates with automated database-driven replacement of student names, dates, and titles.
* **SMTP Port Blockage**: Resolves Render and other hosting providers' SMTP port blocks on the free tier by routing email payloads over HTTPS (port 443) using a custom Google Apps Script proxy that talks directly to the Gmail API.
* **Heavy CPU Processing**: Employs optimized headless LibreOffice within Docker to convert pptx slides in batch arrays concurrently, completing bulk operations in seconds instead of minutes.
* **Credential Verification**: Prevents fraud by implementing a public verification portal (`/verify`) where employers or students verify certificate IDs and view original high-resolution PDFs dynamically rendered from database templates.

### Target Users
* **Student Applicants**: Registration for events and applying for core team membership.
* **Club Administrators/Super Admins**: Viewing applicant profiles, registering branches, managing events, approving teams, customizing actions, and executing bulk certificate dispatches.
* **Developers**: Managing database schema, debugging system configurations, and synchronizing templates.

### Core Functionality
* **Dynamic Recipient Configuration**: Individual achievement actions (e.g. *Participation*, *Won First/Second/Third Place*, *Coordinated*) can be customized in the admin row.
* **PowerPoint Modification**: Low-level XML parser updates Slide XML in PPTX buffers, disabling auto-fit to maintain certificate margins while mapping custom fonts (Bebas Neue, Cardo).
* **Live Activity Logging & Event Dispatch**: Synchronizes changes across active clients via Server-Sent Events (SSE). Writes admin actions to audit tables.
* **Dynamic Verification Views**: Embedded 16:9 widescreen PDF viewer that queries the API server and renders compiled certificates without client-side plugins.

### High-Level System Architecture & Workflow
```mermaid
graph TD
    User([Public User / Admin]) -->|Interacts| Frontend[Vite React TS Client]
    Frontend -->|HTTPS REST API / SSE| Backend[Node Express TS API Server]
    Backend -->|SQL Execution| Database[(Turso Edge SQLite)]
    Backend -->|Modify XML | Pizzip[PizZip XML Editor]
    Backend -->|Exec CLI Batch| LibreOffice[LibreOffice PDF Converter]
    Backend -->|HTTP POST JSON| GASProxy[Google Apps Script Proxy]
    GASProxy -->|Gmail API Auth| Gmail[Gmail SMTP/HTTP Dispatch]
```

---

## 2. Key Features

The system is split into distinct functional modules:

### A. Fully Implemented Features

#### 1. Dynamic Certificate Actions & Template Resolution
* **What it does**: Admins choose specific actions per student. The system parses casing normalized strings (e.g., `'won Second Place'` $\rightarrow$ `"Won Second Place"`) and maps them to the appropriate pptx template. Participation keywords map to the `Participation Template`, whereas others map to the `Appreciation Template` and inject custom achievement titles.
* **Implementation Location**: [`backend/src/index.ts:L1588-1839`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/backend/src/index.ts#L1588-1839)
* **Frontend Component**: [`AdminDashboardPage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/frontend/src/pages/AdminDashboardPage.tsx)
* **Backend API**: `POST /api/admin/bulk-send/certificates`
* **Database Tables**: `event_registrations`, `templates`, `events`
* **Auth Requirements**: Admin JWT token required.

#### 2. Automatic Modification Guard & Status Indicators
* **What it does**: Once a certificate is successfully sent, the status updates to `Sented` (represented by a green badge), and the select action dropdown is permanently disabled with a `not-allowed` cursor to prevent post-dispatch modifications.
* **Implementation Location**: [`AdminDashboardPage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/frontend/src/pages/AdminDashboardPage.tsx)
* **Auth Requirements**: Admin JWT authentication.

#### 3. Hackathon Team Registrations & Bulk Certificate Engine
* **What it does**: An interactive application form that dynamically appends team member input rows, collects role designations (Student vs Professional), captures disclaimers, and exports customized participant certificates for the whole team (including leaders).
* **Implementation Location**: [`ApplyPage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/frontend/src/pages/ApplyPage.tsx) and [`backend/src/index.ts:L1842-2141`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/backend/src/index.ts#L1842-2141)
* **Backend API**: `POST /api/apply/hackathon`, `POST /api/admin/bulk-send/hackathon-certificates`
* **Database Tables**: `hackathon_registrations`, `templates`

#### 4. Headless LibreOffice PDF Compiler (Batch Mode)
* **What it does**: Feeds the PPTX paths to LibreOffice CLI (`soffice`), converting files in a single batch to reduce startup overhead to less than 2 seconds.
* **Implementation Location**: [`backend/src/index.ts:L1291-1324`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/backend/src/index.ts#L1291-1324)

#### 5. Public Certificate Verification Portal
* **What it does**: Public interface validating certificate IDs (e.g. `TCEK/RD/2026/0001` or `TCEK/RD/HACK/2026/0001-1`), querying metadata, compiling the PPTX on the fly, converting it to PDF, and streaming the file buffer inline inside a 16:9 widescreen frame.
* **Implementation Location**: [`VerifyCertificatePage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/frontend/src/pages/VerifyCertificatePage.tsx) and [`backend/src/index.ts:L2317-2466`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/backend/src/index.ts#L2317-2466)
* **Backend API**: `GET /api/verify-certificate/*`
* **Database Tables**: `event_registrations`, `events`, `templates`
* **Auth Requirements**: None (Public Access).

#### 6. Live Synchronizer (SSE Stream)
* **What it does**: Binds clients to an HTTP Server-Sent Events pool. When registrations, events, or branches are updated, it emits sync events (`REFRESH_APPLICATIONS`, `REFRESH_EVENTS`, `REFRESH_BRANCHES`) causing active admin screens to reload data instantly.
* **Implementation Location**: [`backend/src/index.ts:L489-512`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/backend/src/index.ts#L489-512) and [`App.tsx:L106-129`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/frontend/src/App.tsx#L106-129)

### B. Partially Implemented Features
* **Nodemailer SMTP Fallback**: Configured to send email via standard SMTP on host port 587 using the `transporter` client, but is generally blocked on cloud environments like Render. Render deployments must use `GMAIL_HTTP_PROXY_URL`.
* **Activity Logs Audit**: Database records are added to `activity_logs` for login/event creation/branch modifications, but there is no admin interface inside the dashboard to view them (requiring direct DB queries).

### C. Planned/Future Features
* **Interactive Log Viewer**: A dashboard screen listing rows from the `activity_logs` table.
* **Password Reset Workflows**: Self-service recovery token verification via email (currently admin modifications must be done via direct SQL).

---

## 3. Complete Technology Stack

### Frontend
* **Build Tool**: Vite (v8.2.0)
* **Framework**: React (v19.2.8)
* **Language**: TypeScript (v6.0.2 / 5.4.5)
* **Styling**: Vanilla CSS (CSS Custom Variables, Flexbox/Grids, Light/Dark Modes, custom glassmorphism components)
* **Routing**: React Router DOM (v7.18.2)
* **State Management**: React Hooks (`useState`, `useEffect`, `useRef`, `useSearchParams`)
* **Icons**: Lucide React (v1.29.0)

### Backend
* **Runtime**: Node.js (v20 Bullseye-slim)
* **Framework**: Express (v4.19.2)
* **Language**: TypeScript (tsc compilation to ES2022)
* **Execution Tools**: `ts-node-dev` (development live reloading)
* **Authentication**: JSON Web Tokens (`jsonwebtoken` v9.0.3)
* **Security & Hashing**: `bcryptjs` (v3.0.3)
* **Email Engines**: `nodemailer` (v9.0.5) and Custom Google Apps Script HTTP POST Gateway
* **PowerPoint Editor**: `pizzip` (v3.2.0) zip extractor & XML injector

### Database
* **Database engine**: Turso Database (SQLite/libsql API edge endpoints)
* **ORM/Client**: `@libsql/client` (v0.17.4) executing raw prepared SQL statements.
* **Migrations**: Direct query schemas verified on application start (`setupDatabase()`).

### Infrastructure
* **Frontend Host**: Firebase Hosting (`https://tcek-rd.web.app`)
* **Backend Host**: Render (Docker web service)
* **Database Provider**: Turso DB Edge Cloud
* **DNS and Routing**: Custom domains configured via Cloudflare or Firebase custom setups.

---

## 4. Complete Folder and File Structure

```text
/
├── .firebase/                  # Local firebase CLI cache
├── .firebaserc                 # Firebase project configuration mappings
├── firebase.json               # Firebase deployment targets, redirects, and rewrites
├── CERTIFICATE_TEMPLATE.pptx   # PowerPoint template for Participation certificates
├── CERTIFICATE_TEMPLATE - APPRECIATION.pptx # PowerPoint template for Appreciation certificates
├── OFFER LETTER (1).pptx       # PowerPoint template for Admin Coordinator Offers
├── DEPLOYMENT.md               # Quick production deploy cheat sheet
├── download_fonts.ps1          # Powershell helper to download and open fonts folder
├── fonts/                      # Development custom TTF fonts
│   ├── Cardo-Regular.ttf
│   ├── Cardo-Bold.ttf
│   ├── Cardo-Italic.ttf
│   ├── BebasNeue-Regular.ttf
│   └── Bebas Neue Bold.ttf
│
├── backend/                    # Express Backend Service
│   ├── src/
│   │   ├── index.ts            # Core Backend API: Routing, DB migrations, dispatch logs, XML engines
│   │   └── types.ts            # Shared types/interfaces
│   ├── .dockerignore           # Excluded paths from Docker context
│   ├── .env                    # Secret environment variables (ignored in Git)
│   ├── Dockerfile              # Docker container setup (builds Bullseye Slim, installs LibreOffice & fonts)
│   ├── clear_db.js             # Utility to clear and reset Turso SQLite tables
│   ├── update_db_templates.js  # Utility to sync local PowerPoint templates directly into Turso
│   ├── tsconfig.json           # TypeScript configuration
│   └── package.json            # NPM dependencies and runner scripts
│
└── frontend/                   # Vite React Frontend client
    ├── src/
    │   ├── assets/             # Brand logos and images
    │   ├── components/         # Presentation layouts
    │   │   ├── Header.tsx      # Public Navigation
    │   │   ├── Footer.tsx      # Core footer links
    │   │   ├── Hero.tsx        # Homepage landing section
    │   │   ├── About.tsx       # Club narrative overview
    │   │   ├── ResearchDomains.tsx # Domain details (tinyML, crypt, web3)
    │   │   ├── Events.tsx      # Technical event calendar cards
    │   │   ├── Benefits.tsx    # Details on perks of joining
    │   │   ├── Team.tsx        # Core Team directory card grids
    │   │   ├── FAQ.tsx         # Frequently Asked Questions accordion
    │   │   ├── Contact.tsx     # Public enquiry message form
    │   │   └── AdminLayout.tsx # Navigation & dashboard sidebar template for admins
    │   │
    │   ├── pages/              # Routed Views
    │   │   ├── AboutPage.tsx   # Detailed R&D Cell background info
    │   │   ├── ResearchPage.tsx# Dynamic list of academic domains and targets
    │   │   ├── EventsPage.tsx  # Interactive list of technical events
    │   │   ├── BenefitsPage.tsx# Details of benefits, certificates, and letters
    │   │   ├── TeamPage.tsx    # List of advisory members & developers
    │   │   ├── FAQPage.tsx     # Full list of system FAQs
    │   │   ├── ContactPage.tsx # Public contact page
    │   │   ├── ApplyPage.tsx   # Unified submission form (Club, Event, Hackathon)
    │   │   ├── VerifyCertificatePage.tsx # Public credential verification and PDF rendering
    │   │   ├── AdminLoginPage.tsx # Authenticator portal (JWT fetch)
    │   │   ├── AdminDashboardPage.tsx # Central dashboard containing applications, events, hackathons tabs
    │   │   ├── AdminUsersPage.tsx # Management dashboard list for superadmins
    │   │   ├── AdminCreateUserPage.tsx # Superadmin user registration
    │   │   ├── AdminManageEventsPage.tsx # List and deletion interface for events
    │   │   ├── AdminCreateEventPage.tsx # Event creator form
    │   │   ├── AdminBranchesPage.tsx # Branch manager (add/remove engineering branches)
    │   │   └── index.css       # Core styling system (CSS grids, light/dark styling vars)
    │   │
    │   ├── App.tsx             # Application Router and EventSource client handler
    │   ├── config.ts           # Dynamic API base URL resolver
    │   └── main.tsx            # DOM bootstrap entry point
    ├── vite.config.ts          # Vite asset bundler configuration
    ├── tsconfig.json           # TS configurations
    ├── eslint.config.js        # Linter rules
    ├── .env.development        # Dev environment mapping
    └── .env.production         # Production api URLs
```

### Important Files Breakdown

#### 1. [`backend/src/index.ts`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/backend/src/index.ts)
* **Purpose**: Application Server Entry Point & Controllers.
* **Responsibility**: Bootstraps the Express application; establishes Turso SQL connections and configures automated DB migrations; validates admin credentials using JWT tokens; executes dynamic PPTX XML manipulations and parallel headless LibreOffice conversions; manages email dispatch handlers.
* **Dependencies**: `express`, `cors`, `dotenv`, `bcryptjs`, `jsonwebtoken`, `@libsql/client`, `pizzip`, `nodemailer`.
* **What Calls It**: Node runtime (`npm start` or `ts-node-dev`).
* **What It Calls**: Turso DB Cloud, LibreOffice Command Line CLI (`soffice`), Google Apps Script API endpoints.
* **Important Routines**: `setupDatabase()`, `replacePlaceholdersInPptx()`, `convertPptxToPdf()`, `convertPptxToPdfBatch()`, `runWithConcurrency()`, `postToAppsScript()`.
* **Required for Production**: Yes.

#### 2. [`frontend/src/App.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/frontend/src/App.tsx)
* **Purpose**: Client Routing, Layout, & Synchronizer.
* **Responsibility**: Declares the page router configuration using React Router DOM; wraps pages in layouts; defines token verification guards; manages SSE connections via `EventSource` and publishes custom sync event triggers.
* **Dependencies**: `react`, `react-router-dom`.
* **What Calls It**: Client entry point [`main.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/frontend/src/main.tsx).
* **What It Calls**: Routed views (`HomePage`, `ApplyPage`, `VerifyCertificatePage`, `AdminDashboardPage`, `AdminUsersPage`, etc.).
* **Required for Production**: Yes.

#### 3. [`frontend/src/pages/AdminDashboardPage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/frontend/src/pages/AdminDashboardPage.tsx)
* **Purpose**: Admin Roster & Dispatch Console view.
* **Responsibility**: Renders list tables for applications, events, and hackathon teams; provides search filters, branch selection tabs, and status controls; executes backend API calls for bulk dispatches and renders log streams in a drawer.
* **Dependencies**: `react`, `react-router-dom`, `lucide-react`.
* **What Calls It**: Routed inside `App.tsx` (protected admin paths).
* **What It Calls**: `GET /api/admin/applications`, `POST /api/admin/applications/status`, `POST /api/admin/bulk-send/offers`, `POST /api/admin/bulk-send/certificates`, `POST /api/admin/bulk-send/hackathon-certificates`.
* **Required for Production**: Yes.

#### 4. [`frontend/src/pages/VerifyCertificatePage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/frontend/src/pages/VerifyCertificatePage.tsx)
* **Purpose**: Public Certificate Authenticator.
* **Responsibility**: Validates credential codes, retrieves student registration metadata from the backend API, and draws the generated certificate PDF inside a responsive 16:9 frame.
* **Dependencies**: `react`, `react-router-dom`, `lucide-react`.
* **What Calls It**: Routed inside `App.tsx` (public path `/verify`).
* **What It Calls**: `GET /api/verify-certificate/[id]` (metadata) and `GET /api/verify-certificate/[id]/pdf` (iframe loader).
* **Required for Production**: Yes.

#### 5. [`frontend/src/pages/ApplyPage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/frontend/src/pages/ApplyPage.tsx)
* **Purpose**: Public Application Forms portal.
* **Responsibility**: Renders dynamic signup screens for club recruitment, event attendance, and hackathon teams; handles real-time addition/removal of team member row profiles.
* **Dependencies**: `react`, `react-router-dom`.
* **What Calls It**: Routed inside `App.tsx` (public path `/apply`).
* **What It Calls**: `GET /api/events`, `GET /api/branches`, `POST /api/apply/club`, `POST /api/apply/event`, `POST /api/apply/hackathon`.
* **Required for Production**: Yes.

#### 6. [`backend/Dockerfile`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/backend/Dockerfile)
* **Purpose**: Docker Container configuration.
* **Responsibility**: Orchestrates Debian-based container packaging; installs node runtime dependencies alongside headless LibreOffice and system fonts (Dejavu, Carlito, Cardo, Bebas Neue, Calibri, Arial, Times New Roman).
* **Dependencies**: `node:20-bullseye-slim` base image.
* **What Calls It**: Cloud Render deployment runner.
* **Required for Production**: Yes (for Docker host environments).

#### 7. [`backend/update_db_templates.js`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/backend/update_db_templates.js)
* **Purpose**: PowerPoint Template Sync script.
* **Responsibility**: Reads local PowerPoint templates (`CERTIFICATE_TEMPLATE.pptx`, `CERTIFICATE_TEMPLATE - APPRECIATION.pptx`), converts them to Base64, and syncs them into the database.
* **Dependencies**: `@libsql/client`, `fs`, `dotenv`.
* **What Calls It**: Developer Terminal command run.
* **Required for Production**: No (utility script for setup/migration).

#### 8. [`backend/clear_db.js`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/backend/clear_db.js)
* **Purpose**: Database Reset script.
* **Responsibility**: Clears all candidate entries, registrations, hackathon teams, and activity logs from the database, resetting auto-increment IDs.
* **Dependencies**: `@libsql/client`, `dotenv`.
* **What Calls It**: Developer Terminal command run.
* **Required for Production**: No (test/development utility only).

---

## 5. Application Architecture

```text
User  ---> [ VITE REACT CLIENT ]  ---> [ AUTH MIDDLEWARE ] ---> [ EXPRESS SERVER ] ---> [ TURSO DB ]
              | (Render PDF Frame)                                  | (XML Pizzip Replace)
              v                                                     v
       [ VERIFY PORTAL ] <--------------------------------- [ Headless LibreOffice ]
              |                                                     | (Gmail Proxy POST)
              +---------------------------------------------------->v
                                                           [ GOOGLE APPS SCRIPT PROXY ]
```

### Client-Server Communication
Clients talk to the Express backend via:
1. **REST APIs (HTTPS)**: Sending application forms, creating events, logging in.
2. **Server-Sent Events (SSE)**: Express keeps an open connection via `GET /api/sync-stream`. Whenever any administrator updates database records, the backend streams a message to all connected clients, refreshing their states.

### Data Verification Flow
1. Visitor inputs reference code in `/verify`.
2. The frontend triggers `GET /api/verify-certificate/[encodedId]`.
3. Server queries `event_registrations` matching `certificate_id` and checks if `certificate_sent = 1`.
4. If found, returns JSON metadata to render details (Student Name, Event Name, Issue Date).
5. Frontend requests `GET /api/verify-certificate/[encodedId]/pdf` inside an `<iframe src="...">`.
6. Express downloads template data from table `templates`, updates XML content using `pizzip`, calls LibreOffice to convert PPTX to PDF, and streams the output directly to the frame.

### Email Delivery Proxy Flow
```text
Express Server  --->  Read PDF file  --->  Base64 Encode  --->  POST JSON payload  --->  Google Script  --->  Gmail API  ---> Recipient
```

---

## 6. Frontend Documentation

### Entry Point
* **`main.tsx`**: Boots the React app inside `index.html`.
* **`App.tsx`**: Configures routes, layouts, and handles the SSE `EventSource` connection, dispatching custom `app-sync` events to update state.

### Reusable Styling System
Styling is managed via [`frontend/src/pages/index.css`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/frontend/src/pages/index.css). Key parameters:
* **Theming**: Selectors `:root` (light) and `[data-theme="dark"]` define color tokens.
* **Core Variables**: Colors like `--primary-rgb`, `--accent-rgb`, `--bg-dark`, and font-families (`Outfit`, `Inter`).
* **Glassmorphism**: `.glass-panel` utilizes `backdrop-filter: blur(12px)` and transparent border variables.

### Route Map and Pages

| URL Route | Access Level | Primary Components | API Calls | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/` | Public | Header, Hero, About, ResearchDomains, Events, Benefits, Team, FAQ, Contact, Footer | `GET /api/events` | R&D Cell home portal containing sections. |
| `/apply` | Public | ApplyPage | `GET /api/events`, `GET /api/branches`, `POST /api/apply/club`, `POST /api/apply/event`, `POST /api/apply/hackathon` | Dynamic signup page supporting recruitment, event attendance, or hackathon registrations. |
| `/verify` | Public | VerifyCertificatePage | `GET /api/verify-certificate/*` | Authenticates certificates and renders PDF. |
| `/admin/login` | Public | AdminLoginPage | `POST /api/admin/login` | Authentication portal generating JWT session token. |
| `/admin/club` | Admin/Dev | AdminLayout, AdminDashboardPage | `GET /api/admin/applications`, `POST /api/admin/applications/status`, `POST /api/admin/bulk-send/offers` | Recruitment tracker, status changes, and dispatch of offer letters. |
| `/admin/events` | Admin/Dev | AdminLayout, AdminDashboardPage | `GET /api/admin/applications`, `POST /api/admin/applications/status`, `POST /api/admin/bulk-send/certificates` | Event registration roster, action modifiers, and batch certificate dispatches. |
| `/admin/hackathons`| Admin/Dev | AdminLayout, AdminDashboardPage | `GET /api/admin/applications`, `POST /api/admin/applications/status`, `POST /api/admin/bulk-send/hackathon-certificates` | Roster of hackathon teams, member list inspection, team action selections, and dispatches. |
| `/admin/users` | Developer / Superadmin | AdminUsersPage | `GET /api/admin/users`, `DELETE /api/admin/users/:id` | Roster of administrators. |
| `/admin/users/create` | Developer / Superadmin | AdminCreateUserPage | `POST /api/admin/users` | Registration form for new administrators. |
| `/admin/events/manage`| Admin/Dev | AdminManageEventsPage | `GET /api/events`, `DELETE /api/admin/events/:id` | Lists all created events with options to remove them. |
| `/admin/events/create`| Admin/Dev | AdminCreateEventPage | `POST /api/admin/events` | Form to create new workshops, hackathons, or seminars. |
| `/admin/branches` | Admin/Dev | AdminBranchesPage | `GET /api/branches`, `POST /api/admin/branches`, `DELETE /api/admin/branches/:id` | Registers and updates official engineering branches. |

---

## 7. Backend Documentation

### Entry Point
* **`backend/src/index.ts`**: Runs the Express server, configures CORS, parses JSON, connects to Turso DB, run database migrations, and exposes API routes.

### Major Sub-systems
1. **DB Setup (`setupDatabase`)**: Direct SQL compiler verifying table schemas on boot, adding columns where necessary, and seeding defaults (roles, branches, events).
2. **XML Placeholder Replacer (`replacePlaceholdersInPptx`)**: Reads templates, targets slides (`ppt/slides/slide[x].xml`), parses layout segments, and modifies fonts/auto-fit settings before rebuilding zip files.
3. **LibreOffice CLI (`convertPptxToPdfBatch`)**: Launches headless LibreOffice via sub-processes, converting multiple files to PDF in a single batch.
4. **Google Script proxy (`postToAppsScript`)**: Encodes generated PDFs into Base64 formats and pushes JSON objects to the proxy URL bypassing SMTP limits.

---

## 8. API Documentation

### Public Endpoints

#### `POST /api/apply/club`
* **Purpose**: Submits a club membership application.
* **Request Body**:
  ```json
  {
    "fullName": "Jane Doe",
    "pinNumber": "26261A0501",
    "email": "janedoe@gmail.com",
    "mobile": "9876543210",
    "branch": "Computer Science & Engineering (CSE)",
    "yearOfStudy": "III Year",
    "section": "A",
    "interests": "Machine Learning, Embedded Systems",
    "skills": "Python, C++, ROS",
    "reasonToJoin": "To participate in active drone projects."
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Application recorded successfully.",
    "id": 4
  }
  ```

#### `POST /api/apply/event`
* **Purpose**: Submits a technical event attendance registration.
* **Request Body**:
  ```json
  {
    "fullName": "John Doe",
    "pinNumber": "26261A0502",
    "email": "johndoe@gmail.com",
    "mobile": "9876543211",
    "branch": "Civil Engineering (CE)",
    "yearOfStudy": "II Year",
    "eventName": "Edge AI: Deploying TinyML on Microcontrollers",
    "notes": "Requires physical hardware board"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Event registration recorded successfully.",
    "id": 12
  }
  ```

#### `POST /api/apply/hackathon`
* **Purpose**: Registers a hackathon team.
* **Request Body**:
  ```json
  {
    "hackathonName": "R&D AlphaQuest Hackathon",
    "teamName": "Byte Busters",
    "projectTitle": "Decentralized Energy Grid",
    "projectDescription": "P2P energy distribution using IoT nodes.",
    "problemStatement": "High overhead cost in energy billing.",
    "leaderName": "Leader Name",
    "leaderEmail": "leader@gmail.com",
    "leaderPhone": "9876543212",
    "leaderRole": "Student",
    "leaderYear": "IV Year",
    "leaderBranch": "Electrical & Electronics Engineering (EEE)",
    "leaderInstitution": "TCEK",
    "members": [
      { "fullName": "Member One", "email": "member1@gmail.com" },
      { "fullName": "Member Two", "email": "member2@gmail.com" }
    ]
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Hackathon team registration recorded successfully.",
    "id": 3
  }
  ```

#### `GET /api/verify-certificate/[certificateId]`
* **Purpose**: Resolves certificate validation details.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "fullName": "John Doe",
      "pinNumber": "26261A0502",
      "email": "johndoe@gmail.com",
      "branch": "Civil Engineering (CE)",
      "yearOfStudy": "II Year",
      "eventName": "Edge AI: Deploying TinyML on Microcontrollers",
      "status": "Won Second Place",
      "certificateId": "TCEK/RD/2026/0001",
      "eventDate": "July 12, 2026",
      "issuedAt": "2026-08-16 08:30:00"
    }
  }
  ```

#### `GET /api/verify-certificate/[certificateId]/pdf`
* **Purpose**: Compiles PPTX, converts to PDF, and streams the PDF buffer directly.
* **Headers returned**:
  * `Content-Type: application/pdf`
  * `Content-Disposition: inline; filename="Certificate_JohnDoe.pdf"`

---

### Authenticated Endpoints (Requires `Authorization: Bearer <token>`)

#### `GET /api/admin/applications`
* **Purpose**: Retrieves all rosters (Club applications, Event registrations, Hackathon applications).
* **Success Response (200 OK)**:
  ```json
  {
    "clubApplications": [...],
    "eventRegistrations": [...],
    "hackathonRegistrations": [...]
  }
  ```

#### `POST /api/admin/applications/status`
* **Purpose**: Changes registration status or updates certificate actions.
* **Request Body**:
  ```json
  {
    "type": "event",
    "id": 1,
    "status": "Won Second Place"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Successfully updated application status to Won Second Place."
  }
  ```

#### `POST /api/admin/bulk-send/certificates`
* **Purpose**: Batch compiles event certificates and dispatches emails.
* **Headers**: `Content-Type: text/event-stream` (SSE stream logs).
* **Request Body**:
  ```json
  {
    "eventTitle": "Edge AI: Deploying TinyML on Microcontrollers"
  }
  ```
* **Success Stream Outputs**:
  ```text
  data: {"message":"Initializing email service...","progress":5,"isDone":false}
  data: {"message":"Converting templates to PDF...","progress":30,"isDone":false}
  ...
  data: {"message":"Process completed successfully.","progress":100,"isDone":true}
  ```

---

## 9. Authentication & Authorization

### Hashing & Credentials
* Passwords are encrypted in database tables using `bcryptjs` with a work factor of 10.
* Seeding logic inserts defaults on startup if they do not exist.

### Default Admin Accounts (Seeded automatically)
* **Developer Access**:
  * Username: `charan`
  * Password: `Bharat@8336`
* **Superadmin Access**:
  * Username: `akhya`
  * Password: `akhya@1962`

### Role-Based Access Control (RBAC)
* **`developer`**: Can perform any dashboard action and create or delete other developers, superadmins, or admins.
* **`superadmin`**: Can access all data, manage branches/events, and create/delete **admin** accounts only. Cannot create developers or delete other superadmins.
* **`admin`**: Full access to dashboard rosters and bulk dispatch engines. Cannot create or view user profiles, manage administrators, or delete admin accounts.

### Authentication Flow
```text
Admin  ---> Submit Username & Password  --->  Verify via bcrypt  ---> Sign JWT Token  ---> Save to LocalStorage
                                                                                                 |
Admin Request  <---  Attach JWT to headers ("Authorization: Bearer [token]") <-------------------+
```

---

## 10. Database Documentation

### Schema Details

```text
+-----------------------+     +------------------------+     +-------------------------+
|   club_applications   |     |   event_registrations  |     |  hackathon_registrations|
+-----------------------+     +------------------------+     +-------------------------+
| id (PK)               |     | id (PK)                |     | id (PK)                 |
| full_name             |     | full_name              |     | hackathon_name          |
| pin_number            |     | pin_number             |     | team_name               |
| email                 |     | email                  |     | project_title           |
| mobile                |     | mobile                 |     | project_description     |
| branch                |     | branch                 |     | problem_statement       |
| year_of_study         |     | year_of_study          |     | leader_name             |
| section               |     | section                |     | leader_email            |
| interests             |     | event_name             |     | leader_phone            |
| skills                |     | notes                  |     | leader_role             |
| reason_to_join        |     | created_at             |     | members (JSON Array)    |
| status                |     | status                 |     | status                  |
| offer_sent            |     | certificate_sent       |     | certificate_sent        |
| created_at            |     | certificate_id         |     | certificate_type        |
+-----------------------+     +------------------------+     +-------------------------+
```

### Table Schema and Column Metadata
1. **`club_applications`**: Manages recruitment entries. Status values: `'pending'`, `'approved'`, `'rejected'`. Column `offer_sent` determines if they received appointment letters (0 or 1).
2. **`event_registrations`**: Student attendees. Column `status` represents actions (e.g. `'Participation'`, `'Won First Place'`). Column `certificate_sent` locks status modifications once set to 1.
3. **`hackathon_registrations`**: Roster of hackathons. Column `members` holds a JSON string of team members.
4. **`contact_messages`**: Public contact form messages.
5. **`admin_users`**: Stores admin profiles. Checked via role constraints (`role IN ('developer', 'superadmin', 'admin')`).
6. **`activity_logs`**: Logs admin actions for auditing.
7. **`events`**: Registered events. Category can be `'Workshop'`, `'Seminar'`, `'Colloquium'`, or `'Hackathon'`.
8. **`templates`**: Holds base64 representations of PPTX templates.
9. **`branches`**: Holds branch names.

---

## 11. Environment Variables

Below are the environment variables defined within [`backend/src/index.ts`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/backend/src/index.ts):

| Variable | Purpose | Required | Example | Used By |
| :--- | :--- | :--- | :--- | :--- |
| `PORT` | Local and cloud server port binding. | No (defaults to 5000) | `5000` | Express Server Startup |
| `TURSO_URL` | Cloud Turso edge SQLite endpoint. | **Yes** | `https://rd-saicharan.aws-ap.turso.io` | `@libsql/client` |
| `TURSO_TOKEN` | Auth credential for database endpoints. | **Yes** | `eyJhbGciOiJFUzI1NiIsImt...` | `@libsql/client` |
| `JWT_SECRET` | Secret key used to sign session cookies. | No (defaults fallback) | `super_secret_jwt_cell_key` | JWT Sign / Verification |
| `SENDER_EMAIL` | Sender address used for email dispatches. | No (defaults fallback) | `recruitmentrd6@gmail.com` | Nodemailer & HTTP payload |
| `SENDER_PASSWORD`| Gmail app password. | No (defaults fallback) | `kohmtlqkeezrbewz` | Nodemailer client auth |
| `GMAIL_HTTP_PROXY_URL`| Google Apps Script deployment URL. Bypasses Render SMTP port blocks. | **Yes (in Cloud)** | `https://script.google.com/macros/s/AKfyc...` | Express Dispatch Client |
| `GROQ_MODELS` | Optional models check used in health checks. | No | `["llama3-8b"]` | `GET /api/health` |

---

## 12. Third-Party Services & Integrations

The system integrates with the following providers:

* **Turso DB**: Edge database provider using SQLite. Handles fast SQL querying. If unavailable, API endpoints throw 500 errors.
* **Render**: Cloud application host. Automatically runs backend Docker builds. If unavailable, APIs will fail.
* **Firebase Hosting**: Serves built React frontend code. If unavailable, users cannot access the frontend portal.
* **Google Apps Script Proxy**: Custom Apps Script API that forwards payload requests to Google mail APIs on port 443, bypassing SMTP restrictions.
* **Google Fonts**: Docker builds request `Cardo` and `Bebas Neue` font files directly from Google Fonts repositories, caching them in Linux system paths.

---

## 13. Complete Deployment Documentation

### A. Backend Hosting (Render Docker Containers)
The backend API server requires a Linux container to execute headless LibreOffice and manage dynamic PPTX-to-PDF certificate compilation. Render uses a custom **Docker-based deployment** to build and run the backend.

* **Service Type**: Web Service (Docker-based).
* **Repository & Branch**: Master/main branch of the connected GitHub/GitLab repository.
* **Docker Image**: Builds on `node:20-bullseye-slim` (defined in the [`backend/Dockerfile`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/backend/Dockerfile)).
* **Build Command**: Custom commands are handled by the Docker file, which executes `npm install` and `npm run build` (compiles TypeScript to JS under the `/app/dist` folder) automatically inside the container.
* **Start Command**: `npm start` (runs `node dist/index.js`).
* **Root Directory**: `backend` (configured in the Render settings page).
* **Port Configuration**: Exposes internal container port `5000` (Render dynamically maps incoming HTTPS requests on public port 443 to the container's port).
* **Health Check Endpoint**: `/api/health` (publicly accessible, no authentication required, returns standard JSON status metadata).
* **Auto-Deployment**: Render automatically pulls, rebuilds the Docker container, and performs a zero-downtime rolling restart whenever a commit is pushed to the tracked Git branch.
* **Restart Behavior**: If the container crashes or encounters memory faults, Render automatically spins up a fresh container instance.
* **Custom Domain & DNS Configuration**:
  1. Add a custom domain in Render's settings tab.
  2. Point a CNAME record from your DNS registrar (e.g. Cloudflare) to the Render sub-domain (e.g. `rd-backend.onrender.com`), or set up an A record targeting Render's public IPs for root apex domains.
  3. Render handles SSL/TLS certificate issuing and automatic renewal via Let's Encrypt.
* **Common Deployment Failures**:
  * *Build Timeouts*: Pulling Node modules, installing LibreOffice (`apt-get install -y libreoffice`), and downloading custom fonts can take several minutes. Ensure the service build timeout allows for these installations.
  * *OutOfMemory (OOM) Errors*: Headless LibreOffice requires considerable RAM during batch operations. The codebase implements `runWithConcurrency` (throttled to a maximum limit of `10`) to limit concurrent executions and prevent container OOM restarts.
  * *Cold Start Delays*: Render's free tier spins down the web service after 15 minutes of inactivity. The first request after a sleep period will take up to 50 seconds to complete while the Docker container boots up.

---

### B. Google Apps Script Email Proxy
Render's free tier blocks outgoing SMTP ports (25, 465, 587) to prevent spam, which prevents standard Nodemailer configurations from sending certificate emails. To resolve this, the system is designed to bypass SMTP blocks entirely by sending Base64-encoded PDF attachments via standard HTTPS POST request over port 443 to a custom Google Apps Script Web App.

* **Purpose**: Bypasses SMTP outgoing port locks.
* **Operation Flow**: Express Server $\rightarrow$ HTTP POST payload $\rightarrow$ Google Apps Script Proxy $\rightarrow$ Gmail Service API $\rightarrow$ Recipient inbox.
* **Apps Script Source Code**:
  Create a new project at [script.google.com](https://script.google.com/) and paste the following implementation:
  ```javascript
  function doPost(e) {
    try {
      var data = JSON.parse(e.postData.contents);
      
      // Map base64 strings back to file blobs
      var attachments = (data.attachments || []).map(function(att) {
        return Utilities.newBlob(
          Utilities.base64Decode(att.base64), 
          att.mimeType || 'application/pdf', 
          att.filename || 'attachment.pdf'
        );
      });
      
      // Dispatch via Google's native MailApp
      MailApp.sendEmail({
        to: data.to,
        subject: data.subject,
        body: data.text,
        attachments: attachments
      });
      
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  ```
* **Deployment Steps**:
  1. Click **Deploy > New Deployment**.
  2. Select type: **Web App**.
  3. Configure parameters:
     * **Execute as**: *Me (your_gmail_address@gmail.com)*
     * **Who has access**: *Anyone* (This allows the Render backend server to post requests).
  4. Click **Deploy** and authorize permissions.
  5. Copy the generated **Web App URL** and configure it as `GMAIL_HTTP_PROXY_URL` in the Render environment variables.
* **Authentication**: Credentials are managed natively by Google Apps Script within your Google account workspace. No secret API keys or OAuth client secrets are stored on Render, minimizing security risks.

---

### C. UptimeRobot Monitoring
To prevent Render instances from going into sleep mode (avoiding the 50-second cold start lag) and to receive instant down-state notifications, UptimeRobot should be configured to ping the backend server.

* **Target Monitored Endpoint**: `https://your-backend-name.onrender.com/api/health`
* **Monitor Type**: HTTPS health check.
* **Expected Response HTTP Status**: `200 OK` (checks if the server responds with a valid `{"status":"online"}` payload).
* **Monitoring Interval**: Configured to run every **5 minutes** (this prevents the Render container from spinning down due to inactivity).
* **Downtime Definiton**: Downtime is recorded if the endpoint returns a non-2xx status code (e.g. 500 Database Error, 503 Service Unavailable) or if requests timeout after **30 seconds**.
* **Alert Configurations**: Set up notifications to send emails or triggers when a down status is confirmed.
* **Troubleshooting False Alerts**: Render free tier cold-starts take about 50 seconds to complete. If the server is in a sleep state when UptimeRobot checks it, the first check will exceed the standard 30-second timeout and trigger a false down notification. If this occurs, increase the response timeout limit inside UptimeRobot to 60 seconds.

---

### D. Frontend hosting (Firebase Hosting)
Frontend React assets are built and deployed directly to Firebase Hosting.

#### Firebase Deployment Steps:
1. Update `VITE_API_URL` inside [`frontend/.env.production`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/frontend/.env.production) with the Render API URL.
2. Build the optimized static assets:
   ```bash
   cd frontend
   npm run build
   ```
3. Authenticate with Firebase and deploy:
   ```bash
   firebase login
   npx firebase deploy --only hosting
   ```

---

## 14. Production Architecture

```text
  [ Firebase Hosting ]  <------------------------> [ Web Browser Client ]
  (Serves Static Files)                                     ^
                                                            | HTTPS REST / SSE
                                                            v
                                                   [ Render API Server ]
                                                   (Dockerized Node App)
                                                            |
                                      +---------------------+---------------------+
                                      v                                           v
                             [ Turso DB Cloud ]                      [ Google Script HTTP Proxy ]
                             (SQLite Edge Host)                      (Bypasses SMTP port blocks)
```

---

## 15. Development Workflow

Follow these steps to run the application locally:

### Step 1: Install Dependencies
Open a terminal in the root workspace folder:
```bash
# Setup backend libraries
cd backend
npm install

# Setup frontend libraries
cd ../frontend
npm install
```

### Step 2: Configure Environment Variables
Create a `.env` file in the `backend/` folder:
```ini
PORT=5000
TURSO_URL=your_turso_database_url
TURSO_TOKEN=your_turso_auth_token
JWT_SECRET=your_jwt_signing_key
SENDER_EMAIL=recruitmentrd6@gmail.com
SENDER_PASSWORD=your_gmail_app_password
GMAIL_HTTP_PROXY_URL=your_google_script_deployment_url
```

### Step 3: Run Setup Scripts
1. Run the template synchronization script to load PowerPoint template buffers into the Turso database:
   ```bash
   cd backend
   node update_db_templates.js
   ```
2. Download and install custom fonts so local LibreOffice installs match templates:
   * **Windows**: Right-click and execute the PowerShell script [`download_fonts.ps1`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/download_fonts.ps1) with Admin privileges. Select all files in the explorer window, right-click, and click **Install**.
   * **Linux/Ubuntu**: Copy the TTF files from the `fonts` folder to `/usr/share/fonts/truetype/` and update font cache: `fc-cache -fv`.

### Step 4: Run Development Servers
* Run the backend API server:
  ```bash
  cd backend
  npm run dev
  ```
* In a new terminal, start the frontend developer server:
  ```bash
  cd frontend
  npm run dev
  ```
* Open your browser to `http://localhost:5173/`.

---

## 16. Testing

### Test Suite Execution
* Backend uses standard TypeScript compilation checks:
  ```bash
  cd backend
  npm run build
  ```
* Frontend executes Vite lints and TypeScript builds:
  ```bash
  cd frontend
  npm run lint
  npm run build
  ```

### Manual Verification Steps
1. **Verification Test**: Use the Reference ID `TCEK/RD/2026/0001` inside the `/verify` route. The system should generate and render the PDF document successfully.
2. **Database Reset**: Run the reset script in the backend folder to wipe all test applications and reset auto-increment counters:
   ```bash
   cd backend
   node clear_db.js
   ```

---

## 17. Build & Production

* **Production Builds**: Compiling the React application bundle inside the static `dist/` directory:
  ```bash
  cd frontend
  npm run build
  ```
  Vite optimizes, minifies, and bundles assets. Make sure [`frontend/.env.production`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/frontend/.env.production) is configured correctly before building.

---

## 18. CI/CD

The project leverages Git-driven continuous integration and automated hosting.

### A. Backend Deployments (Render Web Service)
* **Trigger**: Automatic deployments are triggered by code pushes to the `master` or `main` branch of the connected repository.
* **Branch Tracked**: `master` (or production release branch).
* **Build Process**: Render automatically reads the root `Dockerfile` inside the `backend` folder. It initializes a Debian base image, installs LibreOffice packages, downloads custom template fonts, compiles node dependencies, and executes `npm run build` (transpiles TypeScript to JS).
* **Deployment Process**: Render performs a zero-downtime rolling restart, swapping the active container with the newly built Docker image.
* **Secrets Configuration**: Environment variables (`TURSO_URL`, `TURSO_TOKEN`, `JWT_SECRET`, `GMAIL_HTTP_PROXY_URL`) are configured securely in Render's dashboard and are injected into the container environment.
* **Failure Behavior**: If the Docker build fails, the build terminates, and Render keeps the last running successful container active, preventing production service disruptions.

### B. Frontend Deployments (Firebase Hosting)
* **Trigger**: Deployment is manually triggered by running CLI commands on developer machines.
* **Build & Test Process**: Developers run `npm run build` inside the `frontend` folder, which runs ESLint and the Vite compiler to output optimized assets in `frontend/dist`.
* **Deployment Process**: Firebase Hosting uploads the built folder contents securely using `firebase deploy --only hosting`.
* **Secrets Configuration**: Public URL variables (e.g., `VITE_API_URL` targeting the backend Render URL) are injected at build time from the local `.env.production` file.
* **Failure Behavior**: If the build script fails locally, the CLI deployment terminates before files are uploaded, preventing corrupt builds from going live.

---

## 19. Error Handling & Troubleshooting

### CORS Errors
* **Problem**: Frontend cannot communicate with the backend; browser prints CORS origin warnings.
* **Cause**: Backend is running on a port different from what the frontend expects, or is not configured to accept requests from the frontend domain.
* **Solution**: Ensure `VITE_API_URL` matches the backend endpoint (e.g. `http://localhost:5000` or the Render URL), and the backend runs `app.use(cors())`.

### Gmail SMTP blocks on Render
* **Problem**: Sending certificates hangs, reporting connection timeouts or port failures.
* **Cause**: Render blocks ports 25, 465, and 587 on their free tier to prevent spam.
* **Solution**: Configure `GMAIL_HTTP_PROXY_URL` in the environment variables to route email dispatches over HTTPS (port 443) using the Google Apps Script proxy.

### Database Connection Failure
* **Problem**: Server startup prints errors or crashes, showing database connection issues.
* **Cause**: `TURSO_URL` or `TURSO_TOKEN` is missing, incorrect, or expired.
* **Solution**: Check the values in `backend/.env` against the Turso dashboard.

### LibreOffice PDF Compiler Missing
* **Problem**: Verification page reports `/BaseFont` errors, or certificate generation fails.
* **Cause**: LibreOffice (`soffice`) is not installed on the system path, or the required template fonts (Bebas Neue, Cardo) are missing.
* **Solution**: On local machines, install LibreOffice and configure standard custom fonts. In production, verify the Render web service runs in a Docker environment using the project's custom `Dockerfile`.

---

## 20. Security

### Implemented Protections
* **Password Hashing**: Uses `bcryptjs` with a work factor of 10 to securely hash admin passwords, preventing plain-text exposures in database breaches.
* **Session Validation**: Protects backend routes using JWT tokens with a standard HMAC-SHA256 signature and a default 8-hour expiry limit.
* **Database Security**: Turso DB interactions use parameterized SQL statements (`db.execute({ sql, args })`) instead of raw string concatenations, protecting the application against SQL injection attacks.
* **Input Sanitization**: Replaces special XML/HTML characters (`&` $\rightarrow$ `&amp;`, `<` $\rightarrow$ `&lt;`, `>` $\rightarrow$ `&gt;`) in PPTX replacement placeholders to prevent layout breaks and XML injection.
* **Casing Normalization**: Sanitizes achievement status strings against lowercase participation tags to restrict arbitrary text injections.
* **CORS Configuration**: Configures CORS middleware on the backend to allow client integrations, restricting endpoints to recognized cross-domain request pathways.

### Identified Security Weaknesses & Missing Protections
* **Lack of Rate Limiting**: The backend API server has no rate limiting configured (e.g. using `express-rate-limit`). High-frequency requests can cause database resource exhaustion or overload the LibreOffice PDF compiler.
* **No CSRF Tokens (LocalStorage Token storage)**: Session tokens are stored in the client-side `LocalStorage` (not inside HTTP-only secure cookies). While this architecture prevents typical Cross-Site Request Forgery (CSRF) exploits targeting standard session cookies, it makes the token vulnerable to Cross-Site Scripting (XSS) if malicious scripts gain access to the DOM.
* **No Automated Account Recovery**: The application lacks password recovery APIs. Admin password modifications must be made via manual database edits using SQL.
* **Exposed Default Credentials**: Default admin credentials (`charan` and `akhya`) are seeded during setup. Although these should be updated immediately in production, they are stored in the startup logic.
* **Public Debug Endpoints**: Endpoints like `/api/debug-fonts` and `/api/debug-pdf-fonts` are publicly accessible, exposing internal container font structures. These should be protected or disabled in production.

---

## 21. Dependencies

### Frontend Dependencies (`frontend/package.json`)
* `react` & `react-dom` (v19.2.8): Core library.
* `react-router-dom` (v7.18.2): Handles routing.
* `lucide-react` (v1.29.0): Icon library.
* `vite` (v8.2.0): Build tool and dev server.

### Backend Dependencies (`backend/package.json`)
* `@libsql/client` (v0.17.4): Turso edge SQLite driver.
* `bcryptjs` (v3.0.3): Password hashing.
* `cors` (v2.8.5): Handles Cross-Origin Resource Sharing.
* `dotenv` (v16.4.5): Loads environment configurations.
* `express` (v4.19.2): Web framework.
* `jsonwebtoken` (v9.0.3): Signs and verifies session tokens.
* `nodemailer` (v9.0.5): Handles email sending (SMTP fallback).
* `pizzip` (v3.2.0): Zip extractor for editing XML in PPTX templates.

---

## 22. Important Code Components

* **`replacePlaceholdersInPptx()`** ([`backend/src/index.ts:L1134-1222`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/backend/src/index.ts#L1134-1222)):
  Low-level XML parser. Opens the PPTX file structure, targets slide layouts, updates placeholders dynamically, and disables text-box wrapping configurations to maintain certificate margins.
* **`convertPptxToPdfBatch()`** ([`backend/src/index.ts:L1291-1324`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/backend/src/index.ts#L1291-1324)):
  Handles batch conversions using LibreOffice CLI (`soffice`), converting all PPTX templates to PDF in a single call to save resources.
* **`setupDatabase()`** ([`backend/src/index.ts:L80-484`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/backend/src/index.ts#L80-484)):
  Runs database setup on start, verifying tables exist and seeding initial values (branches, users, default events).
* **`AdminDashboardPage`** ([`AdminDashboardPage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/frontend/src/pages/AdminDashboardPage.tsx)):
  Admin panel featuring a real-time event-log console drawer, attendee table filtering, and action status updates.
* **`VerifyCertificatePage`** ([`VerifyCertificatePage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/frontend/src/pages/VerifyCertificatePage.tsx)):
  Renders the public verification view, drawing certificate details dynamically inside a 16:9 widescreen frame.

---

## 23. Data Flow

### User Event Registration Flow
```text
[ Attendee Form ] -> [ Input Validation ] -> [ POST /api/apply/event ] -> [ Turso DB Event Table ] -> [ SSE Sync Emitted ] -> [ Dashboard Refreshes ]
```

### Bulk Certificate Dispatch Flow
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

---

## 24. Routes & Pages

Below are the mapped routes defined within [`frontend/src/App.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/frontend/src/App.tsx):

| Route Path | View Component | Access Privileges | Purpose |
| :--- | :--- | :--- | :--- |
| `/` | `HomePage` | Public | Welcome portal, overview of cell divisions, and list of upcoming events. |
| `/about` | `AboutPage` | Public | Core background information and goals of the R&D Cell. |
| `/research` | `ResearchPage` | Public | Highlights research domains (Edge AI, Web3, TinyML). |
| `/events` | `EventsPage` | Public | Renders registered events. |
| `/benefits` | `BenefitsPage` | Public | Details perks of joining, certifications, and recommendations. |
| `/team` | `TeamPage` | Public | Core team member directories. |
| `/faqs` | `FAQPage` | Public | Renders answers to common questions. |
| `/contact` | `ContactPage` | Public | Form to submit questions and feedback. |
| `/apply` | `ApplyPage` | Public | Single enrollment portal for club membership, events, or hackathons. |
| `/verify` | `VerifyCertificatePage`| Public | Public certificate validator and PDF viewer. |
| `/admin/login` | `AdminLoginPage` | Public | Verification portal generating admin tokens. |
| `/admin/club` | `AdminDashboardPage` | Authenticated | Roster of club recruitment applicants. |
| `/admin/events` | `AdminDashboardPage` | Authenticated | Roster of event registrations, certificate actions, and dispatches. |
| `/admin/hackathons`| `AdminDashboardPage` | Authenticated | Roster of registered teams and members for hackathons. |
| `/admin/users` | `AdminUsersPage` | Developer / Superadmin | Management view to list or delete admin accounts. |
| `/admin/users/create`| `AdminCreateUserPage`| Developer / Superadmin | Creates new admin accounts. |
| `/admin/events/manage`| `AdminManageEventsPage`| Authenticated | Manage and delete created events. |
| `/admin/events/create`| `AdminCreateEventPage`| Authenticated | Form to register new technical events. |
| `/admin/branches` | `AdminBranchesPage` | Authenticated | Roster of engineering departments and branches. |

---

## 25. Database/API/Frontend Relationship

```text
  [ Admin UI Click ]
         |
         v
  [ Dashboard Page ]  ---> [ API Endpoint Request ] ---> [ Express Controller Route ]
         ^                 (Authorization Bearer JWT)                   |
         |                                                              v
  [ EventSource Sync ]                                        [ DB Statement Query ]
  (Refreshes dashboard state)                                           |
         ^                                                              v
         |                                                   [ Turso libSQL Client ]
         |                                                              |
         +----------------- [ SSE Dispatch Client ] <-------------------+
```

---

## 26. Common Commands

Run these command arrays inside the respective directories:

### Backend Commands (`backend/`)
```bash
# Install backend modules
npm install

# Start development server with live reloading
npm run dev

# Compile TypeScript code to JS (dist/)
npm run build

# Start compiled JavaScript server in production
npm start

# Run database synchronization script (loads templates)
node update_db_templates.js

# Reset and clear all SQLite tables
node clear_db.js
```

### Frontend Commands (`frontend/`)
```bash
# Install frontend modules
npm install

# Start local Vite development server
npm run dev

# Lint files
npm run lint

# Compile and package static assets for deployment
npm run build
```

---

## 27. Deployment Checklist

Before deploying changes, verify the following:

- [ ] Check that `TURSO_URL` and `TURSO_TOKEN` environment variables are set correctly.
- [ ] Verify that `GMAIL_HTTP_PROXY_URL` is set to bypass Render SMTP port blocks.
- [ ] Run the template synchronization script (`node update_db_templates.js`) to sync PowerPoint templates into the DB.
- [ ] Download and install the custom fonts (Cardo and Bebas Neue) on the local host or verify they are in the Docker image.
- [ ] Update the production API endpoint `VITE_API_URL` inside [`frontend/.env.production`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/frontend/.env.production).
- [ ] Run `npm run build` inside the `frontend` folder and verify it builds without errors.
- [ ] Deploy the backend to Render and verify the deployment status is "Live".
- [ ] Deploy the frontend to Firebase and confirm the site loads over HTTPS.

---

## 28. Maintenance Guide

Follow these steps to update or add features:

### A. Adding a New Frontend Page
1. Create a page component in [`frontend/src/pages/`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/frontend/src/pages).
2. Configure the route mapping inside [`frontend/src/App.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/frontend/src/App.tsx).
3. If public, register the navigation path in [`Header.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/frontend/src/components/Header.tsx).

### B. Adding a New Backend Endpoint
1. Open [`backend/src/index.ts`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/backend/src/index.ts).
2. Add the endpoint route and configure permissions (e.g. `authenticateToken` middleware for authenticated routes).
3. Update the API reference table in this documentation.

### C. Updating the Database Schema
1. Open [`backend/src/index.ts`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/backend/src/index.ts).
2. Locate the database initialization script `setupDatabase()`.
3. Add the new table query or execute `ALTER TABLE` schema changes.
4. If necessary, update the clearing utility [`clear_db.js`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/backend/clear_db.js) to clear the new table during resets.

---

## 29. Limitations & Known Issues

### Render Cold Starts
* **Issue**: Public pages might lag or fail to resolve during first access.
* **Cause**: Render's free tier spins down the backend container after 15 minutes of inactivity, requiring ~50 seconds to boot up on request.
* **Solution**: Keep the container awake using a ping utility, or upgrade to Render's paid tier.

### Single-Core PDF Generation
* **Issue**: Generating massive batches of certificates can slow down.
* **Cause**: LibreOffice CLI requires significant CPU and memory.
* **Solution**: The system runs conversions in batches using a concurrency limit of 10 (`runWithConcurrency`) to prevent CPU bottlenecks.

### Local Temp Files
* **Issue**: Temp files can consume storage over time.
* **Cause**: Express creates temporary files on the local filesystem during PPTX template edits.
* **Solution**: The system includes cleanup logic (`fs.unlinkSync`) inside `finally` blocks to delete temp files after each operation.

---

## 30. Future Improvements

### High Priority
* **Automated Unit Tests**: Add integration tests for Express routes and certificate generation.
* **Self-Service Password Recovery**: Add password resets for admin users.
* **Activity Log Viewer**: Add a dashboard view to view activity logs for auditing.

### Medium Priority
* **Template Editor**: Add a dashboard template uploader to allow admins to upload PPTX templates directly from the browser.
* **Email Customization**: Allow admins to customize email copy directly from the dashboard before dispatching.

---

## 31. Developer Quick Start

Get the project running locally in 5 commands:

```bash
# Clone the repository and install packages
npm install --prefix backend && npm install --prefix frontend

# Set up environment variables
cp backend/.env.example backend/.env

# Sync templates into Turso DB
cd backend && node update_db_templates.js

# Start backend (Port 5000)
npm run dev

# In another terminal, start frontend (Port 5173)
cd ../frontend && npm run dev
```

---

## 32. Production Quick Reference

| System Area | Cloud Service Provider | Purpose | Console / Dashboard Link | Configuration Details |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | Firebase Hosting | Hosting built static assets. | [Firebase Console](https://console.firebase.google.com/) | Deployed to `https://tcek-rd.web.app` (configured in `firebase.json`). |
| **Backend** | Render | Docker Web Service API hosting. | [Render Dashboard](https://dashboard.render.com/) | Docker Bullseye Slim container running Express and LibreOffice. |
| **Database** | Turso Cloud | libSQL SQLite server. | [Turso Dashboard](https://turso.tech/) | Multi-region edge database. |
| **Email Proxy** | Google Script Proxy | Bypasses SMTP blocks. | [Google Apps Script](https://script.google.com/) | Deployed Google Apps Script forwarding Gmail API payloads. |
| **Uptime Monitoring** | UptimeRobot | Pings API to prevent sleep. | [UptimeRobot Dashboard](https://uptimerobot.com/dashboard) | Configured HTTP check targeting `/api/health`. |
| **Credentials & OAuth** | Google Cloud Console | Manages Gmail APIs & credentials. | [Google Cloud Console](https://console.cloud.google.com/) | OAuth client setups and API library activation. |
| **Analytics (Tracking)** | Google Analytics | Tracks user sessions & actions. | [Google Analytics Console](https://analytics.google.com/) | Tracks page visits and button clicks. |
| **Tag Management** | Google Tag Manager | Inject analytics scripts dynamically. | [Google Tag Manager](https://tagmanager.google.com/) | Standard container configuration. |

---

## 33. External Service Dependency Map

```text
[ Trinity R&D Cell System ]
 ├── [ Firebase Host ]  ----> (Serves frontend assets)
 ├── [ Render Host ]    ----> (Executes Express backend logic, builds container, converts files)
 ├── [ Turso Database ] ----> (Stores application databases, configurations, event rosters)
 ├── [ Google Script ]  ----> (Bypasses SMTP port blocks to dispatch Gmail notifications)
 ├── [ UptimeRobot ]    ----> (Pings health API every 5 minutes to prevent backend cold starts)
 ├── [ Google Cloud ]   ----> (Manages OAuth API access and credentials for mail flows)
 ├── [ Google Analytics]----> (Tracks public traffic, registrations, and portal queries)
 └── [ Tag Manager ]    ----> (Injects and fires analytics script containers on load)
```

---

## 34. Core Algorithms Pseudocode

This section provides a clean algorithmic breakdown of the critical processes implemented within the system.

### A. PPTX XML Placeholder Replacement Algorithm
* **File Reference**: [`replacePlaceholdersInPptx()`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/backend/src/index.ts#L1134-1222)
* **Goal**: Modify PowerPoint layout nodes directly inside the slide's compressed XML archive without breaking standard properties or fonts.

```text
FUNCTION replacePlaceholdersInPptx(templateBuffer, outputPath, replacements):
    // 1. Open the PPTX PowerPoint binary as a Zip archive
    zip = OpenZipArchive(templateBuffer)
    
    // 2. Iterate through files in the zip directory tree
    FOR EACH file IN zip.files:
        // Locate XML slides (slide layout definitions)
        IF file.path starts with "ppt/slides/slide" AND file.path ends with ".xml":
            slideXml = file.readAsString()
            
            // Adjust word wrapping settings to prevent text boxes from breaking layout
            FOR EACH shape XML block IN slideXml:
                IF shape contains "PARTICIPANT NAME":
                    // Disables automatic scaling of student name boxes
                    replace "<a:spAutoFit/>" with "<a:noAutofit/>"
                ELSE IF shape contains certification templates description lines:
                    // Keep wrapping to let description align dynamically
                    continue
                ELSE:
                    // Force wrap="none" on remaining metadata labels
                    add wrap="none" to <a:bodyPr> tags
            
            // Replace placeholder keys with clean XML-sanitized values
            FOR EACH (placeholderKey, rawValue) IN replacements:
                sanitizedValue = escapeXmlSpecialCharacters(rawValue)
                sanitizedKey = escapeXmlSpecialCharacters(placeholderKey)
                
                // Construct a regex to allow nested formatting XML tags inside characters
                regexPattern = buildFlexibleTagRegex(sanitizedKey)
                slideXml = slideXml.replace(regexPattern, sanitizedValue)
            
            // Map Windows design fonts to system font family names registered on Linux
            replace "Bebas Neue Bold" with "Bebas Neue"
            replace "Cardo Bold" with "Cardo"
            
            // Write modified slide XML back into zip
            file.write(slideXml)
            
    // 3. Compress the archive back to PowerPoint binary format
    outputBuffer = zip.generateNodeBuffer()
    WriteToFile(outputPath, outputBuffer)
```

---

### B. Bulk Event Certificate Dispatch Pipeline
* **File Reference**: [`POST /api/admin/bulk-send/certificates`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/backend/src/index.ts#L1590-1839)
* **Goal**: Customizes, converts, and emails event certificates concurrently while sending SSE logs to the administrator.

```text
FUNCTION bulkSendCertificates(eventTitle):
    // 1. Fetch template binaries from database
    participationTemplate = db.execute("SELECT data_base64 FROM templates WHERE name = 'certificate_participation'")
    appreciationTemplate = db.execute("SELECT data_base64 FROM templates WHERE name = 'certificate_appreciation'")
    
    // 2. Query attendee rows pending dispatch
    recipients = db.execute("SELECT * FROM event_registrations WHERE event_name = eventTitle AND certificate_sent = 0")
    
    IF recipients is empty:
        emitSSE("No pending records found", progress=100)
        RETURN
        
    tasks = []
    
    // 3. Map customization values and call PPTX parser for each recipient
    FOR EACH student IN recipients:
        certId = generateUniqueCertId(student.id) // e.g. TCEK/RD/2026/0001
        
        replacements = {
            "{{PARTICIPANT NAME}}": student.full_name,
            "{{EVENT NAME}}": eventTitle,
            "{{CERTIFICATE ID}}": certId,
            "{{CERTIFICATE TYPE}}": student.status // e.g., "Won Second Place"
        }
        
        tempPptxPath = "temp_cert_" + student.id + ".pptx"
        tempPdfPath = "temp_cert_" + student.id + ".pdf"
        
        // Choose participation vs appreciation template based on status value
        isAppreciation = (student.status != "Participation")
        selectedTemplate = isAppreciation ? appreciationTemplate : participationTemplate
        
        // Replace placeholders and write customized PPTX to disk
        replacePlaceholdersInPptx(selectedTemplate, tempPptxPath, replacements)
        
        tasks.append({
            studentId: student.id,
            email: student.email,
            name: student.full_name,
            pptx: tempPptxPath,
            pdf: tempPdfPath
        })
        
    // 4. Batch convert all temporary PPTX files to PDF concurrently (reduces LibreOffice CLI overhead)
    pptxPaths = tasks.map(t => t.pptx)
    executeShellCommand("soffice --headless --convert-to pdf --outdir [currentDir] [pptxPaths]")
    
    // 5. Send emails with a concurrency limit of 10
    runWithConcurrencyLimit(tasks, limit=10, function(task):
        IF GMAIL_HTTP_PROXY_URL is set in environment:
            // Package payload as JSON and route over port 443 via Google Apps Script Proxy
            payload = {
                to: task.email,
                subject: "Your Event Certificate",
                text: "Dear " + task.name + "...",
                attachments: [{
                    filename: "Certificate_" + task.name + ".pdf",
                    base64: encodeToBase64(ReadFile(task.pdf)),
                    mimeType: "application/pdf"
                }]
            }
            response = postHttpRequest(GMAIL_HTTP_PROXY_URL, payload)
            IF response.success IS false:
                THROW error
        ELSE:
            // Fall back to direct SMTP
            nodemailer.sendMail(task.email, task.pdf)
            
        // Update status flags in database
        db.execute("UPDATE event_registrations SET certificate_sent = 1, certificate_id = [certId] WHERE id = [task.studentId]")
        db.execute("INSERT INTO activity_logs (username, action, details) VALUES ('admin', 'Send Cert', [task.name])")
        
        // Delete temporary files
        DeleteFile(task.pptx)
        DeleteFile(task.pdf)
        
        emitSSE("Completed: " + task.name, progress=calculateProgress())
    )
    
    emitSSE("Process completed successfully", progress=100)
```

---

### C. Bulk Hackathon Certificate Dispatch Pipeline
* **File Reference**: [`POST /api/admin/bulk-send/hackathon-certificates`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/backend/src/index.ts#L1842-2141)
* **Goal**: Resolves approved hackathon teams, parses team member arrays, generates credentials, batch-converts slides, and sends notifications.

```text
FUNCTION bulkSendHackathonCertificates(hackathonName):
    // 1. Fetch template binaries from database
    template = db.execute("SELECT data_base64 FROM templates WHERE name = 'certificate_hackathon'")
    
    // 2. Fetch approved, unsent team registrations
    teams = db.execute("SELECT * FROM hackathon_registrations WHERE hackathon_name = hackathonName AND status = 'approved' AND certificate_sent = 0")
    
    IF teams is empty:
        emitSSE("No pending approved teams found", progress=100)
        RETURN
        
    tasks = []
    teamSentTrackers = {} // Map of teamId -> { totalMembers, sentCount }
    
    // 3. Loop through teams, parse JSON member lists, and build dispatch tasks
    FOR EACH team IN teams:
        membersArray = JSON.parse(team.members)
        validMembers = filterValidMembers(membersArray) // Filter blank names/emails
        
        teamSentTrackers[team.id] = {
            total: 1 + validMembers.length, // Leader + members
            sent: 0
        }
        
        // Add Team Leader task
        tasks.push({
            teamId: team.id,
            teamName: team.team_name,
            projectTitle: team.project_title,
            participantName: team.leader_name,
            recipientEmail: team.leader_email,
            roleIndex: 1,
            isLeader: true,
            certificateType: team.certificate_type
        })
        
        // Add other team members' tasks
        FOR EACH (member, index) IN validMembers:
            tasks.push({
                teamId: team.id,
                teamName: team.team_name,
                projectTitle: team.project_title,
                participantName: member.fullName,
                recipientEmail: member.email,
                roleIndex: index + 2, // Members index start at 2
                isLeader: false,
                certificateType: team.certificate_type
            })
            
    // 4. Generate customised PPTX files on disk
    FOR EACH task IN tasks:
        certId = "TCEK/RD/HACK/2026/" + task.teamId + "-" + task.roleIndex
        replacements = {
            "{{PARTICIPANT NAME}}": task.participantName,
            "{{EVENT NAME}}": hackathonName,
            "{{CERTIFICATE ID}}": certId,
            "{{CERTIFICATE TYPE}}": task.certificateType,
            "{{ROLE}}": task.isLeader ? "Team Leader" : "Team Member",
            "{{TEAM NAME}}": task.teamName,
            "{{PROJECT TITLE}}": task.projectTitle
        }
        
        tempPptx = "temp_hack_" + task.teamId + "_" + task.roleIndex + ".pptx"
        tempPdf = "temp_hack_" + task.teamId + "_" + task.roleIndex + ".pdf"
        
        replacePlaceholdersInPptx(template, tempPptx, replacements)
        task.pptxPath = tempPptx
        task.pdfPath = tempPdf
        task.certId = certId
        
    // 5. Batch convert all generated files to PDF concurrently via LibreOffice CLI
    pptxPaths = tasks.map(t => t.pptxPath)
    executeShellCommand("soffice --headless --convert-to pdf --outdir [currentDir] [pptxPaths]")
    
    // 6. Concurrently dispatch emails (concurrency limit: 10)
    runWithConcurrencyLimit(tasks, limit=10, function(task):
        payload = {
            to: task.recipientEmail,
            subject: "Hackathon Participation Certificate",
            text: "Dear " + task.participantName + "...",
            attachments: [{
                filename: "Certificate_" + task.participantName + ".pdf",
                base64: encodeBase64(ReadFile(task.pdfPath)),
                mimeType: "application/pdf"
            }]
        }
        
        IF GMAIL_HTTP_PROXY_URL is set:
            postHttpRequest(GMAIL_HTTP_PROXY_URL, payload)
        ELSE:
            nodemailer.sendMail(task.recipientEmail, task.pdfPath)
            
        // Increment sent count for team
        teamSentTrackers[task.teamId].sent++
        
        // If all members of a team have been sent, mark team certificate_sent as complete in DB
        IF teamSentTrackers[task.teamId].sent == teamSentTrackers[task.teamId].total:
            db.execute("UPDATE hackathon_registrations SET certificate_sent = 1 WHERE id = [task.teamId]")
            
        // Log individual member audit details
        db.execute("INSERT INTO activity_logs (action, details) VALUES ('Send Hack Cert', [task.participantName])")
        
        // Cleanup temp files
        DeleteFile(task.pptxPath)
        DeleteFile(task.pdfPath)
        
        emitSSE("Completed: " + task.participantName, progress=calculateProgress())
    )
    
    emitSSE("Process completed successfully", progress=100)
```

---

### D. Bulk Offer Letter Dispatch Pipeline
* **File Reference**: [`POST /api/admin/bulk-send/offers`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/backend/src/index.ts#L1375-1586)
* **Goal**: Generates and dispatches coordinator appointment letters.

```text
FUNCTION bulkSendOffers():
    // 1. Fetch offer template binary from database
    template = db.execute("SELECT data_base64 FROM templates WHERE name = 'offer_letter'")
    
    // 2. Fetch approved, unsent coordinators
    coordinators = db.execute("SELECT * FROM club_applications WHERE status = 'approved' AND offer_sent = 0")
    
    IF coordinators is empty:
        emitSSE("No pending approved coordinators found", progress=100)
        RETURN
        
    tasks = []
    
    // 3. Map replacements and generate PPTX file for each coordinator
    FOR EACH coord IN coordinators:
        refNo = "R&D/COORD/OFFER/2026-2027/" + padLeft(coord.id, 3, "0")
        
        replacements = {
            "{{R&D/COORD/OFFER/2026-2027/001}}": refNo,
            "{{Student Name}}": coord.full_name,
            "{{Year & Branch}}": coord.year_of_study + " & " + coord.branch,
            "{{Department Name}}": coord.branch,
            "{{Date}}": getCurrentFormattedDate()
        }
        
        tempPptx = "temp_offer_" + coord.id + ".pptx"
        tempPdf = "temp_offer_" + coord.id + ".pdf"
        
        replacePlaceholdersInPptx(template, tempPptx, replacements)
        tasks.push({
            coordId: coord.id,
            email: coord.email,
            name: coord.full_name,
            pptx: tempPptx,
            pdf: tempPdf
        })
        
    // 4. Batch convert all PPTX to PDF using LibreOffice CLI
    pptxPaths = tasks.map(t => t.pptx)
    executeShellCommand("soffice --headless --convert-to pdf --outdir [currentDir] [pptxPaths]")
    
    // 5. Send emails concurrently (limit: 10)
    runWithConcurrencyLimit(tasks, limit=10, function(task):
        payload = {
            to: task.email,
            subject: "Offer of Appointment – Student Coordinator (R&D Cell)",
            text: "Dear " + task.name + "...",
            attachments: [{
                filename: "Offer_Letter_" + task.name + ".pdf",
                base64: encodeBase64(ReadFile(task.pdf)),
                mimeType: "application/pdf"
            }]
        }
        
        IF GMAIL_HTTP_PROXY_URL is set:
            postHttpRequest(GMAIL_HTTP_PROXY_URL, payload)
        ELSE:
            nodemailer.sendMail(task.email, task.pdf)
            
        // Update DB
        db.execute("UPDATE club_applications SET offer_sent = 1 WHERE id = [task.coordId]")
        db.execute("INSERT INTO activity_logs (action, details) VALUES ('Send Offer', [task.name])")
        
        // Clean up temp files
        DeleteFile(task.pptx)
        DeleteFile(task.pdf)
        
        emitSSE("Completed: " + task.name, progress=calculateProgress())
    )
    
    emitSSE("Process completed successfully", progress=100)
```

---

### E. Public Certificate Verification & PDF Streaming
* **File Reference**: [`GET /api/verify-certificate/*`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/backend/src/index.ts#L2317-2466)
* **Goal**: Receives public verification requests. If requesting metadata, returns JSON. If path ends with `/pdf`, generates and streams the compiled PDF directly to the browser.

```text
FUNCTION verifyCertificateRoute(req, res):
    certificateId = parseUrlSuffix(req.path) // e.g. "TCEK/RD/2026/0001" or "TCEK/RD/2026/0001/pdf"
    
    isPdfRequest = false
    IF certificateId ends with "/pdf":
        isPdfRequest = true
        certificateId = removePdfSuffix(certificateId)
        
    // 1. Resolve participant record from database (handles legacy numeric IDs as fallbacks)
    record = db.query("SELECT * FROM event_registrations WHERE certificate_id = [certificateId] AND certificate_sent = 1")
    IF record is null:
        RETURN status(404).send("Certificate not found or not yet issued.")
        
    // 2. Fetch event date from DB
    eventDate = db.query("SELECT date FROM events WHERE title = [record.event_name]").date
    
    IF isPdfRequest IS false:
        // Return metadata payload to render JSON verification table
        RETURN response.json({
            fullName: record.full_name,
            eventName: record.event_name,
            status: record.status,
            certificateId: record.certificate_id,
            eventDate: eventDate,
            issuedAt: record.created_at
        })
    ELSE:
        // 3. Compile and stream PDF dynamically
        isAppreciation = (record.status != "Participation")
        templateName = isAppreciation ? "certificate_appreciation" : "certificate_participation"
        template = db.execute("SELECT data_base64 FROM templates WHERE name = [templateName]")
        
        tempPptx = "temp_verify_" + record.id + ".pptx"
        tempPdf = "temp_verify_" + record.id + ".pdf"
        
        replacements = {
            "{{PARTICIPANT NAME}}": record.full_name,
            "{{EVENT NAME}}": record.event_name,
            "{{DATE}}": eventDate,
            "{{CERTIFICATE TYPE}}": record.status,
            "{{CERTIFICATE ID}}": record.certificate_id
        }
        
        // Edit layout nodes in-memory
        replacePlaceholdersInPptx(template, tempPptx, replacements)
        
        // Convert to PDF using LibreOffice
        executeShellCommand("soffice --headless --convert-to pdf --outdir [currentDir] [tempPptx]")
        
        // Stream PDF binary directly to response stream
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', 'inline; filename="Certificate.pdf"')
        
        pdfBuffer = ReadFile(tempPdf)
        res.send(pdfBuffer)
        
        // Clean up temp files
        DeleteFile(tempPptx)
        DeleteFile(tempPdf)
```

---

### F. Real-time Synchronization Engine (Server SSE Stream & Client Listeners)
* **File Reference**: [`GET /api/sync-stream`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/backend/src/index.ts#L489-512) and [`App.tsx:L106-129`](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/frontend/src/App.tsx#L106-129)
* **Goal**: Maintains persistent Server-Sent Events (SSE) connections with client tabs to broadcast updates and reload states.

```text
// SERVER SIDE ROUTE
CLIENT_CONNECTIONS = []

FUNCTION handleSyncStreamRoute(req, res):
    // Configure SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    
    // Add client response object to connection pool
    CLIENT_CONNECTIONS.append(res)
    
    // Remote connection close handler
    ON req.close():
        CLIENT_CONNECTIONS.remove(res)

FUNCTION notifySyncClients(eventType):
    // Broadcast trigger command to all open admin/user tabs
    payload = JSON.stringify({ type: eventType })
    FOR EACH clientConnection IN CLIENT_CONNECTIONS:
        clientConnection.write("data: " + payload + "\n\n")

// CLIENT SIDE LISTENER (App.tsx)
FUNCTION initializeClientSync():
    // Open SSE event listener stream on server
    eventSource = new EventSource("/api/sync-stream")
    
    eventSource.onmessage = function(event):
        data = JSON.parse(event.data)
        IF data.type IS valid:
            // Broadcast custom DOM event to update state in active sub-components
            DOMEvent = new CustomEvent("app-sync", { detail: data.type })
            window.dispatchEvent(DOMEvent)
            
    eventSource.onerror = function():
        log("Connection lost. Retrying standard SSE reconnection...")
```
