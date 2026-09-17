= FUTURE WORK


== Future Enhancements



=== Proposed Project Roadmap



==== Phase 1: Immediate Enhancements

- #strong[Playwright End-to-End Testing]: Integrate Playwright browser automation suites to test signup flows and admin authentication routes.
- #strong[Activity-Log Dashboard Console]: Construct a dedicated admin console interface to audit activity logs from Turso database tables.
- #strong[Email Dispatch Retry Mechanism]: Implement local SQLite queue checks to retry failed Apps Script HTTPS relay requests.


==== Phase 2: Scalability Upgrades

- #strong[Redis / BullMQ worker queue]: Offload heavy XML replacements and PDF compilations from the main thread into a decoupled worker process.
- #strong[Dedicated Document processing workers]: Decouple conversion jobs to dedicated, autoscaled microservice instances.
- #strong[Job Progress Tracking]: Add a live progress indicator on the admin dashboard showing the status of long-running compilation runs.


==== Phase 3: Advanced Capabilities

- #strong[QR Code Verification]: Embed a secure QR code on certificate drafts linking directly to the public verification lookup path.
- #strong[Operational Analytics Dashboard]: Add graphic charts tracking event attendances, signup rates, and email dispatch success ratios.
- #strong[Multi-Institution Support]: Add tenant routing schemas allowing separate college divisions to manage events independently.
- #strong[Cloud Object Storage Integration]: Store compiled PDFs inside AWS S3 / Cloudflare R2 nodes instead of compiling them on the fly during lookups.
