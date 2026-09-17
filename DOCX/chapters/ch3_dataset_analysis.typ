= DATASET & ANALYSIS


== System Requirements



=== Hardware Requirements

- #strong[Development Workstation]:
  - Processor: Multi-core 64-bit CPU (Intel Core i5/i7 or AMD Ryzen 5/7, 4 cores / 8 threads minimum).
  - System Memory (RAM): 8 GB minimum (16 GB recommended for concurrent Docker container builds).
  - Storage: 10 GB available SSD storage for Node runtime modules, Docker images, and temporary compilation buffers.
- #strong[Cloud Hosting Container Environment (Render)]:
  - Container Image: Debian Bullseye Slim Linux (`node:20-bullseye-slim`).
  - Memory Allocation: 512 MB RAM (configured with `runWithConcurrency` to maintain peak memory under 350 MB).
  - CPU Allocation: 0.5 to 1.0 shared vCPU.
  - Ephemeral Storage: 1 GB temporary filesystem storage for isolated `/tmp` LibreOffice batch profiles.
- #strong[Client Device Compatibility]:
  - Compatible with any standard desktop, tablet, or smartphone device with a modern web browser supporting ES6, WebSockets, and HTML5 `EventSource`.


=== Software Requirements



==== Frontend Client Subsystem

- #strong[Core Framework]: React 19 (`v19.2.8`) Single Page Application.
- #strong[Language & Typing]: TypeScript (`v5.4.5` / `v6.0.2`).
- #strong[Build Engine & Dev Server]: Vite (`v8.2.0`) utilizing Rollup production minification.
- #strong[Client-Side Routing]: React Router DOM (`v7.18.2`) with layout wrapping and dynamic route params.
- #strong[Vector Iconography]: Lucide React (`v1.29.0`) SVG icon suite.
- #strong[Styling System]: Custom Vanilla CSS Design System with CSS Custom Properties, Flexbox, CSS Grids, and Light Theme tokens.


==== Backend Application Server

- #strong[Runtime Environment]: Node.js (`v20.x LTS Bullseye-slim`).
- #strong[Web Application Framework]: Express (`v4.19.2`).
- #strong[Language & Compilation]: TypeScript compiled to ECMAScript 2022 (`ES2022`).
- #strong[Development Server]: `ts-node-dev` with live hot-reloading.
- #strong[Authentication Primitives]: JSON Web Tokens (`jsonwebtoken` `v9.0.3`).
- #strong[Cryptographic Hashing]: `bcryptjs` (`v3.0.3`) and native Node.js `crypto` module (SHA-256).
- #strong[Document Engine]: `pizzip` (`v3.2.0`) in-memory OpenXML slide editor.
- #strong[PDF Compiler]: LibreOffice Headless CLI (`soffice`) bundled with system typography.
- #strong[Security Middlewares]: `cookie-parser` (`v1.4.7`), `cors` (`v2.8.5`), `express-rate-limit` (`v7.5.1`).
- #strong[File Uploads]: `multer` (`v1.4.5-lts.1`) with 50 MB payload constraints.
- #strong[Email Transport]: Custom Google Apps Script HTTPS Gateway proxy + `nodemailer` (`v9.0.5`) fallback.


==== Database & Persistence Subsystem

- #strong[Database Engine]: Turso Edge SQLite Cloud Database.
- #strong[Driver Protocol]: `@libsql/client` (`v0.17.4`) communicating over TLS/HTTPS WebSocket protocols (Port 443).
- #strong[Schema Topology]: 16 normalized relational tables with prepared statement bindings and transactional integrity.
- #strong[Migration Strategy]: Idempotent `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ADD COLUMN` migrations verified on server startup.


==== Cloud Deployment Infrastructure

- #strong[Static Client CDN]: Firebase Hosting (`https://tcek-rd.web.app`) with global edge caching and SPA rewrites.
- #strong[API Container Host]: Render Cloud Web Service (`https://rd-backend-kbsm.onrender.com`).
- #strong[Email Gateway Proxy]: Google Apps Script Web App deployed via Google Workspace API infrastructure.
- #strong[Source Control]: GitHub Repository with automated Render CI/CD deployment pipelines.


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)




#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



== Database Design



==== Figure 18: Database Entity-Relationship (ER) Diagram (16 Relational Tables)




#figure(
  image("../media/figures/readme_fig18.svg", width: 95%),
  caption: [Database Entity-Relationship (ER) Diagram (16 Relational Tables)],
  kind: image,
)




=== Schema Details



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



=== Complete Database Tables & Schema (16 Tables)


1. #strong[`club_applications`]: Manages student recruitment entries for R&D Cell teams.
   - Columns: `id`, `full_name`, `pin_number`, `email`, `mobile`, `branch`, `year_of_study`, `section`, `interests`, `skills`, `reason_to_join`, `status` (`'pending'`, `'approved'`, `'rejected'`), `offer_sent` (`0` or `1`), `created_at`.
2. #strong[`event_registrations`]: Registered attendees for workshops, seminars, and technical events.
   - Columns: `id`, `full_name`, `pin_number`, `email`, `mobile`, `branch`, `year_of_study`, `section`, `event_name`, `notes`, `status` (e.g. `'Participation'`, `'Won First Place'`), `certificate_sent` (`0` or `1`), `certificate_id` (unique verifiable code), `attendance` (`'pending'`, `'present'`, `'absent'`), `attendance_marked_by`, `attendance_marked_at`, `room_code`, `created_at`.
3. #strong[`contact_messages`]: Inquiries submitted through public contact forms.
   - Columns: `id`, `name`, `email`, `subject`, `message`, `created_at`.
4. #strong[`admin_users`]: Administrator credentials and role-based permissions.
   - Columns: `id`, `username`, `password`, `salt` (cryptographic salt per user), `role` (`'developer'`, `'superadmin'`, `'admin'`), `email`, `created_at`.
5. #strong[`activity_logs`]: Audit trail recording administrative operations (logins, event creation, branch changes, email dispatches).
   - Columns: `id`, `username`, `action`, `details`, `created_at`.
6. #strong[`events`]: Institutional calendar entries and technical event listings.
   - Columns: `id`, `category` (`'Workshop'`, `'Seminar'`, `'Colloquium'`, `'Hackathon'`), `title`, `description`, `date`, `time`, `location`, `speaker`, `speaker_bio`, `created_at`.
7. #strong[`templates`]: In-database Base64 encoded PowerPoint (`.pptx`) certificate templates.
   - Columns: `name` (PK), `filename`, `data_base64`, `updated_at`.
8. #strong[`branches`]: Master catalog of academic engineering departments and branches.
   - Columns: `id`, `name` (unique), `created_at`.
9. #strong[`hackathon_registrations`]: Team signups for hackathons (e.g., SIH Internal Hackathon).
   - Columns: `id`, `hackathon_name`, `team_name`, `project_title`, `project_description`, `problem_statement`, `leader_name`, `leader_email`, `leader_phone`, `leader_role`, `leader_year`, `leader_branch`, `leader_institution`, `leader_company`, `leader_job_title`, `members` (JSON string of team members), `status`, `certificate_sent`, `certificate_type`, `attendance`, `attendance_marked_by`, `attendance_marked_at`, `room_code`, `created_at`.
10. #strong[`password_reset_tokens`]: State-managed password recovery tokens for self-service account recovery.
    - Columns: `id`, `username`, `token_hash` (SHA-256), `salt`, `expires_at`, `used` (`0` or `1`).
11. #strong[`hackathon_certificates`]: Generated certificates catalog for hackathon leaders and individual team members.
    - Columns: `id`, `certificate_id` (unique), `registration_id`, `participant_name`, `participant_email`, `participant_phone`, `role`, `year`, `branch`, `institution`, `team_name`, `project_title`, `hackathon_name`, `certificate_type`, `created_at`.
12. #strong[`recognition_applications`]: Applications and credentials for judges, evaluators, speakers, and dignitaries.
    - Columns: `id`, `full_name`, `email`, `mobile`, `designation`, `organization`, `event_name`, `event_date`, `domain_expertise`, `experience_years`, `notes`, `status`, `certificate_sent`, `certificate_id`, `created_at`.
13. #strong[`volunteer_applications`]: Student volunteer registrations and committee assignments.
    - Columns: `id`, `full_name`, `pin_number`, `email`, `mobile`, `branch`, `year_of_study`, `event_name`, `volunteer_role`, `skills`, `past_experience`, `availability`, `notes`, `status`, `certificate_sent`, `certificate_id`, `created_at`.
14. #strong[`project_submissions`]: Submissions for hackathons and technical project expos.
    - Columns: `id`, `hackathon_registration_id`, `event_name`, `team_name`, `leader_name`, `leader_email`, `leader_phone`, `institution`, `members`, `project_title`, `project_info`, `problem_statement`, `drive_file_id`, `drive_file_url`, `drive_folder_id`, `drive_folder_url`, `file_name`, `file_size`, `mime_type`, `status`, `created_at`.
15. #strong[`registration_desk_users`]: Registration desk accounts for physical event check-in staff.
    - Columns: `id`, `desk_id` (unique e.g. `REG-DESK-01`), `name`, `email`, `password` (hashed with salt), `salt`, `hackathon` (assigned event), `temp_password`, `temp_password_expires_at` (1-week expiry), `is_temporary_password` (`1` or `0`), `status` (`'active'`, `'inactive'`), `created_at`.
16. #strong[`registration_rooms`]: Allocated presentation rooms, computer labs, and review venues.
    - Columns: `id`, `event_type` (`'event'`, `'hackathon'`), `event_name`, `room_name`, `room_code`, `capacity`, `assigned_desk_id`, `assigned_desk_name`, `created_at`.


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)





#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)

