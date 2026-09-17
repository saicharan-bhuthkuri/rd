= IMPLEMENTATION


== Algorithms


This section provides a clean algorithmic breakdown of the critical processes implemented within the system.


=== A. PPTX XML Placeholder Replacement Algorithm

- #strong[File Reference]: [`replacePlaceholdersInPptx()`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts#L1134-1222)
- #strong[Goal]: Modify PowerPoint layout nodes directly inside the slide's compressed XML archive without breaking standard properties or fonts.


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



#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



=== B. Bulk Event Certificate Dispatch Pipeline

- #strong[File Reference]: [`POST /api/admin/bulk-send/certificates`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts#L1590-1839)
- #strong[Goal]: Customizes, converts, and emails event certificates concurrently while sending SSE logs to the administrator.


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
        certId = generateUniqueCertId(student.id) // e.g. TCEK/RD/2026-A9B2E3F4
        
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



#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



=== C. Bulk Hackathon Certificate Dispatch Pipeline

- #strong[File Reference]: [`POST /api/admin/bulk-send/hackathon-certificates`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts#L1842-2141)
- #strong[Goal]: Resolves approved hackathon teams, parses team member arrays, generates credentials, batch-converts slides, and sends notifications.


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
        certId = "TCEK/RD/HACK/2026-" + task.uniqueSuffix
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



#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



=== D. Bulk Offer Letter Dispatch Pipeline

- #strong[File Reference]: [`POST /api/admin/bulk-send/offers`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts#L1375-1586)
- #strong[Goal]: Generates and dispatches coordinator appointment letters.


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



#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



=== E. Public Certificate Verification & PDF Streaming

- #strong[File Reference]: [`GET /api/verify-certificate/*`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts#L2317-2466)
- #strong[Goal]: Receives public verification requests. If requesting metadata, returns JSON. If path ends with `/pdf`, generates and streams the compiled PDF directly to the browser.


```text
FUNCTION verifyCertificateRoute(req, res):
    certificateId = parseUrlSuffix(req.path) // e.g. "TCEK/RD/2026-A9B2E3F4" or "TCEK/RD/2026-A9B2E3F4/pdf"
    
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



#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



=== F. Real-time Synchronization Engine (Server SSE Stream & Client Listeners)

- #strong[File Reference]: [`GET /api/sync-stream`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts#L489-512) and [`App.tsx:L106-129`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/App.tsx#L106-129)
- #strong[Goal]: Maintains persistent Server-Sent Events (SSE) connections with client tabs to broadcast updates and reload states.


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



#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)





#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



== Implementation


=== A. Complete Repository File & Folder Structure



```text
CER/
├── .firebase/                                  # Firebase CLI deployment cache & hosting artifacts
│   └── hosting.ZnJvbnRlbmRcZGlzdA.cache       # Cached deployment hash mapping
├── .firebaserc                                 # Firebase project mappings (tcek-rd)
├── firebase.json                               # Hosting configuration, SPA rewrites, cleanUrls, and cache headers
├── .gitignore                                  # Git exclusion rules for node_modules, .env, dist, and tmp
├── DEPLOYMENT.md                               # Multi-cloud production deployment guide & checklist
├── download_fonts.ps1                          # PowerShell font provisioning script for Windows development
├── CERTIFICATE_TEMPLATE.pptx                   # Master PPTX template: Event Participation
├── CERTIFICATE_TEMPLATE - APPRECIATION.pptx    # Master PPTX template: Event Appreciation / Merit
├── CERTIFICATE_TEMPLATE - hackathon.pptx       # Master PPTX template: Hackathon Credentials
├── CERTIFICATE_TEMPLATE - Recognition .pptx    # Master PPTX template: Judges, Evaluators & Dignitaries
├── CERTIFICATE_TEMPLATE - Volunteers.pptx      # Master PPTX template: Student Volunteers & Organizing Committee
├── OFFER LETTER (1).pptx                       # Master PPTX template: Core Team & Coordinator Offer Letters
├── fonts/                                      # Master typography directory for PDF compilation & slide fonts
│   ├── Bebas Neue Bold.ttf                     # Bebas Neue Bold font
│   ├── BebasNeue-Regular.ttf                   # Bebas Neue Regular font
│   ├── Caladea-Bold.ttf                        # Caladea Bold (Cambria metric-compatible)
│   ├── Caladea-BoldItalic.ttf                  # Caladea Bold Italic
│   ├── Caladea-Italic.ttf                      # Caladea Italic
│   ├── Caladea-Regular.ttf                     # Caladea Regular
│   ├── Cardo-Bold.ttf                          # Cardo Bold font
│   ├── Cardo-Italic.ttf                        # Cardo Italic font
│   ├── Cardo-Regular.ttf                       # Cardo Regular serif font for certificate bodies
│   ├── CormorantGaramond-Bold.ttf              # Cormorant Garamond Bold
│   ├── CormorantGaramond-BoldItalic.ttf        # Cormorant Garamond Bold Italic
│   ├── CormorantGaramond-Italic.ttf            # Cormorant Garamond Italic
│   ├── CormorantGaramond-Regular.ttf           # Cormorant Garamond Regular
│   ├── GreatVibes-Regular.ttf                  # Great Vibes calligraphy script font for signatures
│   ├── InriaSerif-Bold.ttf                     # Inria Serif Bold
│   ├── InriaSerif-BoldItalic.ttf               # Inria Serif Bold Italic
│   ├── InriaSerif-Italic.ttf                   # Inria Serif Italic
│   ├── InriaSerif-Regular.ttf                  # Inria Serif Regular
│   └── Palatino Bold.ttf                       # Palatino Bold font
│
├── backend/                                    # Node.js + Express 4.19 + TypeScript API Server
│   ├── .dockerignore                           # Excluded files from Docker container build context
│   ├── .env                                    # Environment variables (PORT, TURSO_DATABASE_URL, JWT_SECRET, etc.)
│   ├── Dockerfile                              # Multi-stage Docker container (Debian Bullseye, LibreOffice, Fonts)
│   ├── package.json                            # Backend dependencies, scripts, and runtime engines
│   ├── package-lock.json                       # Exact dependency lockfile
│   ├── tsconfig.json                           # TypeScript compiler configurations (target: ES2022, outDir: dist)
│   ├── google_drive_proxy.gs                   # Google Apps Script proxy (Drive upload & multi-proxy email dispatch)
│   ├── insert_sih_registrations.js             # Data migration script seeding hackathon participants
│   ├── clear_db.js                             # Database sanitization and auto-increment reset utility
│   ├── update_db_templates.js                  # In-database PPTX template synchronizer (Base64 blobs)
│   ├── test_suite.js                           # Logic, casing, XML parsing, and date formatting unit test suite
│   ├── validate_mermaid.js                     # Diagram syntax & bracket validator checking all 26 figures
│   ├── verify_all_features.js                  # Automated 33-point live E2E integration test runner
│   ├── fonts/                                  # Bundled fonts inside backend container for LibreOffice rendering
│   │   └── ... (19 TTF font variants)
│   ├── uploads/                                # Local file upload cache
│   │   └── submissions/                        # Uploaded presentation slides and project document buffers
│   └── src/                                    # Backend TypeScript source directory
│       ├── index.ts                            # Core backend server (REST API, SSE sync, auth, templates)
│       └── taskManager.ts                      # Background task processing engine (SSE streaming & persistent execution logs)
│
└── frontend/                                   # Client Single Page Application (React 19, Vite, TypeScript)
    ├── .env.development                        # Local dev environment API URL (http://localhost:5000)
    ├── .env.production                         # Cloud production API URL (https://rd-backend-kbsm.onrender.com)
    ├── eslint.config.js                        # ESLint flat configuration with React Hooks & TypeScript rules
    ├── index.html                              # HTML5 entry page with Google Fonts preconnect & meta tags
    ├── package.json                            # Frontend dependencies, build scripts (vite, react, lucide-react)
    ├── package-lock.json                       # Exact frontend dependency lockfile
    ├── tsconfig.json                           # Workspace TypeScript composite configuration
    ├── tsconfig.app.json                       # Application-specific TypeScript compiler settings
    ├── tsconfig.node.json                      # Vite bundler-specific TypeScript configuration
    ├── vite.config.ts                          # Vite build tool config, proxy rules, and React plugins
    ├── public/                                 # Static public assets served from root
    │   ├── favicon.png                         # High-res application favicon
    │   ├── favicon.svg                         # Vector application favicon
    │   ├── icons.svg                           # SVG sprite definitions
    │   └── logo.png                            # Trinity College R&D Cell emblem logo
    └── src/                                    # React application source code
        ├── App.tsx                             # Master Router (35 routes), Layout, Fetch Interceptor, SSE Listener
        ├── config.ts                           # Dynamic API base URL resolver (development vs production)
        ├── index.css                           # Institutional Light Theme design system tokens, typography, CSS vars
        ├── main.tsx                            # DOM bootstrap rendering <App /> into root container
        ├── assets/                             # Bundled image and SVG assets
        │   ├── hero.png                        # Homepage hero banner artwork
        │   ├── react.svg                       # React framework logo
        │   └── vite.svg                        # Vite bundler logo
        ├── utils/                              # Reusable frontend utility functions
        │   └── phone.ts                        # Phone number formatting and E.164 sanitization helper
        ├── components/                         # 13 Reusable UI components
        │   ├── Header.tsx                      # Public responsive navigation header with active indicator
        │   ├── Footer.tsx                      # Institutional footer with quick links, contacts, copyright
        │   ├── Hero.tsx                        # High-impact homepage landing hero with call-to-action buttons
        │   ├── About.tsx                       # Institutional mission, leadership overview, and research pillars
        │   ├── ResearchDomains.tsx             # 6 Specialized research labs (AI, IoT, VLSI, Robotics, Web3, Cyber)
        │   ├── Events.tsx                      # Event calendar cards with interactive date chips and register links
        │   ├── Benefits.tsx                    # Value proposition grid (Letters of Recommendation, Certs, Funding)
        │   ├── Team.tsx                        # Advisory council, faculty leads, and student coordinator cards
        │   ├── FAQ.tsx                         # Searchable and expandable accordion FAQ interface
        │   ├── Contact.tsx                     # Inquiry form with real-time validation and feedback toasts
        │   ├── AdminLayout.tsx                 # Responsive admin sidebar navigation, active tab badges, user pill
        │   ├── AdminFilterDropdown.tsx         # Reusable multi-option filter dropdown for table rosters
        │   └── AdminPagination.tsx             # Standardized pagination controller with page size toggles
        └── pages/                              # 22 Routed application views
            ├── AboutPage.tsx                   # Full dedicated about page with institutional background
            ├── ResearchPage.tsx                # Detailed academic domains, current papers, and lab equipment
            ├── EventsPage.tsx                  # Complete calendar of upcoming workshops, hackathons, seminars
            ├── BenefitsPage.tsx                # Detailed perks, credentialing policies, and portfolio benefits
            ├── TeamPage.tsx                    # Full roster of faculty coordinators and student core committee
            ├── FAQPage.tsx                     # Exhaustive searchable knowledge base of student queries
            ├── ContactPage.tsx                 # Public contact desk with direct email & phone channels
            ├── ApplyPage.tsx                   # Multi-purpose registration portal (Club, Event, Hackathon, etc.)
            ├── VerifyCertificatePage.tsx       # Public credential lookup, QR verification, 16:9 PDF stream
            ├── AdminLoginPage.tsx              # Administrator login portal with JWT session cookie handling
            ├── AdminForgotPasswordPage.tsx     # Admin self-service password recovery with email link request
            ├── AdminResetPasswordPage.tsx      # Admin secure password reset form with token verification
            ├── AdminDashboardPage.tsx          # Multi-tab administration console (Club, Events, Hackathons, etc.)
            ├── AdminMessagingPage.tsx          # Institutional Event Messaging Studio with audience cards & letterhead
            ├── AdminRegDeskPage.tsx            # Registration Desk user account and temporary password manager
            ├── AdminRoomsPage.tsx              # Presentation room, lab, and venue allocation manager
            ├── AdminUsersPage.tsx              # Developer/Superadmin system user roster and permissions editor
            ├── AdminCreateUserPage.tsx         # Superadmin provisioning form for new administrative accounts
            ├── AdminManageEventsPage.tsx       # Event calendar management, editing, and deletion interface
            ├── AdminCreateEventPage.tsx        # Event authoring form with category, date, venue, speaker details
            ├── AdminBranchesPage.tsx           # Academic engineering departments catalog manager
            ├── RegDeskLoginPage.tsx            # Dedicated Registration Desk sign-in with 6-box temporary password
            ├── RegDeskForgotPasswordPage.tsx   # Registration Desk coordinator password recovery interface
            ├── RegDeskResetPasswordPage.tsx    # Registration Desk coordinator password reset entry
            └── RegDeskDashboardPage.tsx        # On-site event check-in terminal with live roll search & attendance
```



=== Important Files Breakdown



==== 1. [`backend/src/index.ts`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts)

- #strong[Purpose]: Application Server Entry Point & Controllers.
- #strong[Responsibility]: Bootstraps the Express application; establishes Turso SQL connections and configures automated DB migrations; validates admin credentials using JWT tokens; executes dynamic PPTX XML manipulations and parallel headless LibreOffice conversions; manages email dispatch handlers.
- #strong[Dependencies]: `express`, `cors`, `dotenv`, `bcryptjs`, `jsonwebtoken`, `@libsql/client`, `pizzip`, `nodemailer`.
- #strong[What Calls It]: Node runtime (`npm start` or `ts-node-dev`).
- #strong[What It Calls]: Turso DB Cloud, LibreOffice Command Line CLI (`soffice`), Google Apps Script API endpoints.
- #strong[Important Routines]: `setupDatabase()`, `replacePlaceholdersInPptx()`, `convertPptxToPdf()`, `convertPptxToPdfBatch()`, `runWithConcurrency()`, `postToAppsScript()`.
- #strong[Required for Production]: Yes.


==== 2. [`frontend/src/App.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/App.tsx)

- #strong[Purpose]: Client Routing, Layout, & Synchronizer.
- #strong[Responsibility]: Declares the page router configuration using React Router DOM; wraps pages in layouts; defines token verification guards; manages SSE connections via `EventSource` and publishes custom sync event triggers.
- #strong[Dependencies]: `react`, `react-router-dom`.
- #strong[What Calls It]: Client entry point [`main.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/main.tsx).
- #strong[What It Calls]: Routed views (`HomePage`, `ApplyPage`, `VerifyCertificatePage`, `AdminDashboardPage`, `AdminUsersPage`, etc.).
- #strong[Required for Production]: Yes.


==== 3. [`frontend/src/pages/AdminDashboardPage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/pages/AdminDashboardPage.tsx)

- #strong[Purpose]: Admin Roster & Dispatch Console view.
- #strong[Responsibility]: Renders list tables for applications, events, and hackathon teams; provides search filters, branch selection tabs, and status controls; executes backend API calls for bulk dispatches and renders log streams in a drawer.
- #strong[Dependencies]: `react`, `react-router-dom`, `lucide-react`.
- #strong[What Calls It]: Routed inside `App.tsx` (protected admin paths).
- #strong[What It Calls]: `GET /api/admin/applications`, `POST /api/admin/applications/status`, `POST /api/admin/bulk-send/offers`, `POST /api/admin/bulk-send/certificates`, `POST /api/admin/bulk-send/hackathon-certificates`.
- #strong[Required for Production]: Yes.


==== 4. [`frontend/src/pages/VerifyCertificatePage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/pages/VerifyCertificatePage.tsx)

- #strong[Purpose]: Public Certificate Authenticator.
- #strong[Responsibility]: Validates credential codes, retrieves student registration metadata from the backend API, and draws the generated certificate PDF inside a responsive 16:9 frame.
- #strong[Dependencies]: `react`, `react-router-dom`, `lucide-react`.
- #strong[What Calls It]: Routed inside `App.tsx` (public path `/verify`).
- #strong[What It Calls]: `GET /api/verify-certificate/[id]` (metadata) and `GET /api/verify-certificate/[id]/pdf` (iframe loader).
- #strong[Required for Production]: Yes.


==== 5. [`frontend/src/pages/ApplyPage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/pages/ApplyPage.tsx)

- #strong[Purpose]: Public Application Forms portal.
- #strong[Responsibility]: Renders dynamic signup screens for club recruitment, event attendance, and hackathon teams; handles real-time addition/removal of team member row profiles; filters out hackathons from the event dropdown list in the event registration form; enforces strict client-side email format validation with interactive error alerts upon submission.
- #strong[Dependencies]: `react`, `react-router-dom`.
- #strong[What Calls It]: Routed inside `App.tsx` (public path `/apply`).
- #strong[What It Calls]: `GET /api/events`, `GET /api/branches`, `POST /api/apply/club`, `POST /api/apply/event`, `POST /api/apply/hackathon`.
- #strong[Required for Production]: Yes.


==== 6. [`backend/Dockerfile`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/Dockerfile)

- #strong[Purpose]: Docker Container configuration.
- #strong[Responsibility]: Orchestrates Debian-based container packaging; installs node runtime dependencies alongside headless LibreOffice and system fonts (Dejavu, Carlito, Cardo, Bebas Neue, Calibri, Arial, Times New Roman).
- #strong[Dependencies]: `node:20-bullseye-slim` base image.
- #strong[What Calls It]: Cloud Render deployment runner.
- #strong[Required for Production]: Yes (for Docker host environments).


==== 7. [`backend/update_db_templates.js`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/update_db_templates.js)

- #strong[Purpose]: PowerPoint Template Sync script.
- #strong[Responsibility]: Reads local PowerPoint templates (`CERTIFICATE_TEMPLATE.pptx`, `CERTIFICATE_TEMPLATE - APPRECIATION.pptx`), converts them to Base64, and syncs them into the database.
- #strong[Dependencies]: `@libsql/client`, `fs`, `dotenv`.
- #strong[What Calls It]: Developer Terminal command run.
- #strong[Required for Production]: No (utility script for setup/migration).


==== 8. [`backend/clear_db.js`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/clear_db.js)

- #strong[Purpose]: Database Reset script.
- #strong[Responsibility]: Clears all candidate entries, registrations, hackathon teams, and activity logs from the database, resetting auto-increment IDs.
- #strong[Dependencies]: `@libsql/client`, `dotenv`.
- #strong[What Calls It]: Developer Terminal command run.
- #strong[Required for Production]: No (test/development utility only).


==== 9. [`frontend/src/pages/AdminMessagingPage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/pages/AdminMessagingPage.tsx)

- #strong[Purpose]: Event Messaging & Announcement Broadcast Composer.
- #strong[Responsibility]: Provides multi-audience selection (Members, Judges, Coordinators, Volunteers, Select All), live recipient count preview, locked top greeting and bottom sign-off boilerplate, middle announcement editor, live email preview modal, and batch dispatch integration.
- #strong[Dependencies]: `react`, `lucide-react`, `API_BASE_URL`.
- #strong[Required for Production]: Yes.


==== 10. [`frontend/src/pages/AdminRegDeskPage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/pages/AdminRegDeskPage.tsx)

- #strong[Purpose]: Registration Desk Coordinator Account Manager.
- #strong[Responsibility]: Manages desk user accounts, issues 6-character temporary passwords with 1-week expiry, assigns events, and toggles active status.
- #strong[Required for Production]: Yes.


==== 11. [`frontend/src/pages/RegDeskLoginPage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/pages/RegDeskLoginPage.tsx)

- #strong[Purpose]: Dedicated Registration Desk Sign-in Interface.
- #strong[Responsibility]: Provides Desk ID and 6-box OTP temporary password inputs, session storage under `reg_desk_token`, and redirection to the check-in dashboard.
- #strong[Required for Production]: Yes.


==== 12. [`frontend/src/pages/RegDeskDashboardPage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/pages/RegDeskDashboardPage.tsx)

- #strong[Purpose]: On-Site Event Check-in & Attendance Terminal.
- #strong[Responsibility]: Live attendee search, check-in validation, attendance marking with timestamp and coordinator signature, and badge/kit distribution tracking.
- #strong[Required for Production]: Yes.


==== 13. [`frontend/src/pages/AdminRoomsPage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/pages/AdminRoomsPage.tsx)

- #strong[Purpose]: Event & Hackathon Room / Lab Allocation Manager.
- #strong[Responsibility]: Allocates computer labs, presentation halls, and review venues, managing room capacities and assigned check-in desks.
- #strong[Required for Production]: Yes.


==== 14. [`backend/verify_all_features.js`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/verify_all_features.js)

- #strong[Purpose]: Automated End-to-End System & API Verification Test Suite.
- #strong[Responsibility]: Automatically executes 33 comprehensive verification checks across live target nodes:
  - Validates all 18 public and administrative frontend routes on Firebase CDN.
  - Verifies public backend REST services (`/api/events`, `/api/branches`, `/api/contact` input validation, `/api/verify-certificate` fraud prevention).
  - Authenticates Registration Desk sessions, validates attendee queries, and checks administrative role-isolation guards.
  - Validates Admin Console authentication, applications roster, audience targeting calculations, room allocations, and persistent Server-Sent Events (SSE) keep-alive streams.
- #strong[Dependencies]: Native Node.js `fetch`, `dotenv`.
- #strong[Execution Command]: `node backend/verify_all_features.js`
- #strong[Required for Production]: Continuous Quality Assurance & Integration Testing.


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)




=== B. Subsystem Components


==== 1. Frontend Subsystem



=== Entry Point

- #strong[`main.tsx`]: Boots the React app inside `index.html`.
- #strong[`App.tsx`]: Configures routes, layouts, and handles the SSE `EventSource` connection, dispatching custom `app-sync` events to update state.


=== Reusable Styling System

Styling is managed via [`frontend/src/index.css`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/index.css). Key parameters:
- #strong[Theming]: Selectors `:root` (light) and `[data-theme="dark"]` define color tokens.
- #strong[Core Variables]: Colors like `--primary-rgb`, `--accent-rgb`, `--bg-dark`, and font-families (`Outfit`, `Inter`).
- #strong[Glassmorphism]: `.glass-panel` utilizes `backdrop-filter: blur(12px)` and transparent border variables.


=== Complete Route Map & Navigation Matrix (35 Active Routes)



#figure(
  table(
  columns: (1.4fr, 0.7fr, 0.9fr, 1.3fr, 1.7fr),
  stroke: 0.5pt + luma(180),
  fill: (col, row) => if row == 0 { rgb("#e8f0fe") } else { none },
  inset: (x: 3.5pt, y: 3.5pt),
  table.header([#strong[URL Route]], [#strong[Access Guard]], [#strong[Primary Page Component]], [#strong[Associated API Endpoints]], [#strong[Operational Purpose & Workflow Description]]),
  [`/`], [Public], [HomePage (Header, Hero, About, Domains, Events, Team, FAQ, Contact, Footer)], [`GET /api/events`], [Institutional landing portal summarizing club missions, research domains, upcoming events, and registration gateways.],
  [`/about`], [Public], [AboutPage], [None], [Dedicated institutional profile, advisory council roster, objectives, and historical achievements.],
  [`/research`], [Public], [ResearchPage], [None], [Catalog of the 6 core research labs (TinyML, Cyber, VLSI, Robotics, Web3, IoT) with active student projects.],
  [`/events`], [Public], [EventsPage], [`GET /api/events`], [Interactive event calendar with categorized filters, venue details, speaker profiles, and direct registration triggers.],
  [`/benefits`], [Public], [BenefitsPage], [None], [Value proposition breakdown: industrial mentorship, project funding, letters of recommendation, and verified credentials.],
  [`/team`], [Public], [TeamPage], [None], [Complete leadership directory: Institutional Patron, Faculty In-charge, and Student Executive Core Committee.],
  [`/faqs`], [Public], [FAQPage], [None], [Searchable knowledge base addressing student eligibility, interview cycles, and hackathon guidelines.],
  [`/contact`], [Public], [ContactPage], [`POST /api/contact`], [Institutional inquiry form with client-side field validation and real-time database recording.],
  [`/apply`], [Public], [ApplyPage], [`GET /api/events`, `GET /api/branches`], [Multi-gateway registration hub presenting choice cards for Club, Event, and Hackathon team enrollment.],
  [`/apply/HackathonRegistration`], [Public], [ApplyPage], [`GET /api/events`, `POST /api/apply/hackathon`], [Dedicated hackathon team signup form (alias: `/apply/hackathon`). Collects leader profile and dynamic member rows.],
  [`/apply/ClubRegistration`], [Public], [ApplyPage], [`GET /api/branches`, `POST /api/apply/club`], [Dedicated R&D Cell membership application form (alias: `/apply/club`). Collects academic PIN, interests, and skills.],
  [`/apply/EventRegistration`], [Public], [ApplyPage], [`GET /api/events`, `GET /api/branches`, `POST /api/apply/event`], [Dedicated technical workshop/seminar registration form (alias: `/apply/event`).],
  [`/apply/Recognition`], [Public], [ApplyPage], [`POST /api/apply/recognition`], [Specialized credential registration for event evaluators, keynote speakers, and external dignitaries.],
  [`/apply/Volunteer`], [Public], [ApplyPage], [`POST /api/apply/volunteer`], [Student organizing committee and event volunteer registration form with skills profiling.],
  [`/apply/ProjectSubmission`], [Public], [ApplyPage], [`GET /api/project-submission/events`, `POST /api/project-submission/submit`], [Hackathon submission portal with team lead verification and repository/presentation asset uploads.],
  [`/apply/:registrationType`], [Public], [ApplyPage], [Dynamic `/api/apply/*`], [Case-insensitive dynamic path parameter handler supporting direct links from external invitations.],
  [`/verify`], [Public], [VerifyCertificatePage], [`GET /api/verify-certificate/*`], [Public certificate authenticator resolving certificate IDs, scanning QR codes, and streaming dynamic 16:9 PDFs.],
  [`/reg-desk/login`], [Public], [RegDeskLoginPage], [`POST /api/reg-desk/login`], [Dedicated sign-in portal for physical registration desk staff featuring 6-box temporary password / OTP inputs.],
  [`/reg-desk/forgot-password`], [Public], [RegDeskForgotPasswordPage], [`POST /api/reg-desk/forgot-password`], [Self-service password recovery interface for registration desk coordinators via email reset links.],
  [`/reg-desk/reset-password`], [Public], [RegDeskResetPasswordPage], [`POST /api/reg-desk/reset-password`], [Secure password reset form verifying SHA-256 tokens and applying new coordinator credentials.],
  [`/reg-desk`], [Public], [Navigate to `/reg-desk/dashboard`], [None], [URL redirect helper forwarding authenticated desk sessions to the operational dashboard.],
  [`/reg-desk/dashboard`], [RegDeskProtectedRoute], [RegDeskDashboardPage], [`GET /api/reg-desk/participants`, `POST /api/reg-desk/attendance`], [On-site attendee check-in console with instant PIN search, room assignments, and attendance status toggles.],
  [`/admin/login`], [Public], [AdminLoginPage], [`POST /api/admin/login`], [Administrative login terminal issuing HttpOnly JWT session cookies and Double-Submit CSRF tokens.],
  [`/admin/forgot-password`], [Public], [AdminForgotPasswordPage], [`POST /api/admin/forgot-password`], [Self-service administrator password recovery triggering email reset links via Google Apps Script.],
  [`/admin/reset-password`], [Public], [AdminResetPasswordPage], [`POST /api/admin/reset-password`], [Token-verified administrator credential reset interface with client-side strength enforcement.],
  [`/admin/dashboard`], [ProtectedRoute], [Navigate to `/admin/club`], [None], [Default admin landing redirect pointing to the primary Club Recruitment roster.],
  [`/admin/club`], [ProtectedRoute], [AdminLayout, AdminDashboardPage], [`GET /api/admin/applications`, `POST /api/admin/applications/status`, `POST /api/admin/bulk-send/offers`], [Core recruitment roster with status toggling (Approved/Rejected), branch filtering, and bulk offer letter dispatch.],
  [`/admin/events`], [ProtectedRoute], [AdminLayout, AdminDashboardPage], [`GET /api/admin/applications`, `POST /api/admin/bulk-send/certificates`], [Technical event attendees roster with action overrides (Won 1st/2nd/3rd, Coordinated) and certificate dispatches.],
  [`/admin/hackathons`], [ProtectedRoute], [AdminLayout, AdminDashboardPage], [`GET /api/admin/applications`, `POST /api/admin/bulk-send/hackathon-certificates`], [Hackathon team roster with team member drawers, award classifications, and bulk credential generation.],
  [`/admin/recognition`], [ProtectedRoute], [AdminLayout, AdminDashboardPage], [`GET /api/admin/applications`, `POST /api/admin/bulk-send/recognition-certificates`], [Evaluator and dignitary credentials roster with organization tracking and automated appreciation dispatches.],
  [`/admin/volunteers`], [ProtectedRoute], [AdminLayout, AdminDashboardPage], [`GET /api/admin/applications`, `POST /api/admin/bulk-send/volunteer-certificates`], [Student volunteer service roster with committee assignments and bulk certificate issuance.],
  [`/admin/submissions`], [ProtectedRoute], [AdminLayout, AdminDashboardPage], [`GET /api/admin/applications`], [Hackathon idea submissions and presentation slides repository inspection table.],
  [`/admin/project-submissions`], [ProtectedRoute], [AdminLayout, AdminDashboardPage], [`GET /api/admin/applications`], [Detailed technical project expos submissions roster with direct GitHub and drive preview links.],
  [`/admin/users`], [Developer / Superadmin], [AdminLayout, AdminUsersPage], [`GET /api/admin/users`, `DELETE /api/admin/users/:id`], [System administrator account management table restricted strictly to Developer and Superadmin roles.],
  [`/admin/users/create`], [Developer / Superadmin], [AdminLayout, AdminCreateUserPage], [`POST /api/admin/users`], [Secure account provisioning form generating new administrative users with assigned RBAC privileges.],
  [`/admin/events/manage`], [ProtectedRoute], [AdminLayout, AdminManageEventsPage], [`GET /api/events`, `DELETE /api/admin/events/:id`], [Institutional calendar manager with live deletion controls and participant count indicators.],
  [`/admin/events/create`], [ProtectedRoute], [AdminLayout, AdminCreateEventPage], [`POST /api/admin/events`], [Event authoring form with category pickers, venue details, speaker bio fields, and date schedules.],
  [`/admin/branches`], [ProtectedRoute], [AdminLayout, AdminBranchesPage], [`GET /api/branches`, `POST /api/admin/branches`, `DELETE /api/admin/branches/:id`], [Academic engineering branch catalog editor maintaining official department names and acronyms.],
  [`/admin/reg-desk`], [ProtectedRoute], [AdminLayout, AdminRegDeskPage], [`GET /api/admin/reg-desk-users`, `POST /api/admin/reg-desk-users`, `PUT /api/admin/reg-desk-users/:id`], [Registration desk staff account manager issuing temporary 1-week passwords and event assignments.],
  [`/admin/messaging`], [ProtectedRoute], [AdminLayout, AdminMessagingPage], [`GET /api/admin/messaging/recipients`, `POST /api/admin/messaging/send`], [Institutional Event Messaging Studio featuring audience group cards, letterhead canvas, and preview modals.],
  [`/admin/rooms`], [ProtectedRoute], [AdminLayout, AdminRoomsPage], [`GET /api/admin/rooms`, `POST /api/admin/rooms`, `DELETE /api/admin/rooms/:id`], [Presentation hall, computer lab, and review venue allocation manager with assigned check-in desks.],
),
  caption: [Complete Route Map & Navigation Matrix (35 Active Routes)],
)




#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)




==== 2. Backend Subsystem



=== Entry Point

- #strong[`backend/src/index.ts`]: Runs the Express server, configures CORS, parses JSON, connects to Turso DB, run database migrations, and exposes API routes.


=== Major Sub-systems

1. #strong[DB Setup (`setupDatabase`)]: Direct SQL compiler verifying table schemas on boot, adding columns where necessary, and seeding defaults (roles, branches, events).
2. #strong[XML Placeholder Replacer (`replacePlaceholdersInPptx`)]: Reads templates, targets slides (`ppt/slides/slide[x].xml`), parses layout segments, and modifies fonts/auto-fit settings before rebuilding zip files.
3. #strong[LibreOffice CLI (`convertPptxToPdfBatch`)]: Launches headless LibreOffice via sub-processes, converting multiple files to PDF in a single batch.
4. #strong[Google Script proxy (`postToAppsScript`)]: Encodes generated PDFs into Base64 formats and pushes JSON objects to the proxy URL bypassing SMTP limits.


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)




#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



=== C. Minor Technical & Implementation Details


To ensure complete engineering transparency and assist peer reviewers during technical viva evaluations, this section documents the granular algorithms, cryptographic primitives, protocol constants, and operational edge cases implemented across the platform:


==== 1. Global Fetch Interceptor Architecture (`frontend/src/App.tsx`)

- #strong[Monkey-Patch Mechanism]: Injected into `window.fetch` at runtime before any component mount.
- #strong[Credentials Injection]: Automatically injects `credentials = 'include'` on all outbound HTTP requests where `url.startsWith(API_BASE_URL)` or `url.startsWith('/api')`, ensuring HttpOnly session cookies are transmitted across cross-origin requests.
- #strong[CSRF Token Extraction]: Checks HTTP verb (`POST`, `PUT`, `DELETE`, `PATCH`). If mutating, reads `localStorage.getItem('csrf_token')` and injects it as the `X-CSRF-Token` HTTP header.
- #strong[Header Normalization]: Handles diverse header representations: `Headers` class instances, array of pairs (`[string, string][]`), and plain JavaScript objects (`Record<string, string>`).
- #strong[Corrupted Bearer Sanitation]: Detects and deletes corrupted client authorization strings (e.g. `Bearer null` or `Bearer undefined`) to avoid 401 parse errors on unauthenticated public routes.


==== 2. Double-Submit CSRF Defense Mechanism

- #strong[Server Issuance]: On successful authentication (`POST /api/admin/login` or `POST /api/reg-desk/login`), the server issues two distinct tokens:
  1. An `admin_token` signed with `JWT_SECRET` sent via `Set-Cookie` with flags: `HttpOnly: true`, `SameSite: Lax`, `Secure: true` (in production).
  2. A `csrfToken` signed with `CSRF_SECRET` containing `{ username, sessionToken }` returned directly in the JSON response payload.
- #strong[Validation Gate]: On mutating requests, the server extracts `req.cookies.admin_token` and the header `req.headers['x-csrf-token']`. Both are verified against their respective cryptographic secrets. The server confirms that the session identifier inside the CSRF token matches the authenticated identity in the session cookie.


==== 3. Stateful Password Recovery & Token Lifecycle

- #strong[Generation]: Generates a 32-byte cryptographically secure random buffer:
  `const rawToken = crypto.randomBytes(32).toString('hex');`
- #strong[Salt Hashing]: A unique per-token cryptographic salt is generated, and the token hash is computed:
  `const tokenHash = crypto.createHash('sha256').update(rawToken + salt).digest('hex');`
- #strong[Expiration Guard]: Stored in `password_reset_tokens` with an exact 1-hour expiration timestamp (`new Date(Date.now() + 60 * 60 * 1000).toISOString()`).
- #strong[Single-Use Invalidation]: When submitted to `POST /api/admin/reset-password`, the database query filters `WHERE expires_at > CURRENT_TIMESTAMP AND used = 0`. Once matched, the record is immediately updated to `used = 1` within the same transaction to prevent replay attacks.


==== 4. Registration Desk Temporary Credentials (1-Week Expiry)

- #strong[Auto-Generated Passwords]: Administrative creation of registration desk staff generates an alphanumeric 6-character temporary code (e.g. `K9X2B4`).
- #strong[Storage]: Stored in `registration_desk_users` with `is_temporary_password = 1`, `temp_password = <plainCode>`, and `temp_password_expires_at = NOW + 7 days`.
- #strong[OTP Input Behavior]: The login portal (`/reg-desk/login`) renders a 6-cell digit/character input box with auto-focus, paste handling, backspace navigation, and Enter key submission.


==== 5. Multi-Tier Rate Limiting Windows (`express-rate-limit`)

- #strong[General API Limiter]:
  - Window: 15 minutes (`15 * 60 * 1000 ms`).
  - Max requests: 100 per IP address.
  - Exceeded response: `429 Too Many Requests` with retry headers.
- #strong[Authentication Limiter]:
  - Window: 15 minutes.
  - Max attempts: 5 per IP address.
  - Prevents brute-force dictionary attacks against admin and registration desk accounts.
- #strong[Application Submission Limiter]:
  - Window: 1 hour.
  - Max submissions: 10 per IP address.
  - Protects database capacity against automated script flooding.


==== 6. Server-Sent Events (SSE) Protocol Details (`/api/sync-stream`)

- #strong[Connection Headers]:

```text
  Content-Type: text/event-stream
  Cache-Control: no-cache, no-transform
  Connection: keep-alive
  X-Accel-Buffering: no
```

- #strong[Heartbeat Ping]: Implements a 25-second interval timer sending `: ping\n\n` comments across the open TCP socket. This prevents intermediate cloud load balancers (such as Render's reverse proxy) from prematurely terminating idle HTTP connections.
- #strong[Broadcast Pool]: Maintains an in-memory array of active response objects `clients: Response[]`. Upon any administrative data mutation, the server broadcasts:
  `res.write(`data: \${JSON.stringify({ type: signalType })}\n\n`);`
- #strong[Client Auto-Reconnect]: If the network connection drops, the browser's native `EventSource` API automatically re-initiates the handshake with exponential backoff.


==== 7. Low-Level PPTX XML Node Manipulation Engine

- #strong[Zip File Extraction]: The PowerPoint presentation (.pptx) is treated as a compressed OpenXML zip archive, read into memory using `PizZip`.
- #strong[Target Node]: Uncompresses and accesses `ppt/slides/slide1.xml` (and `slide2.xml` for merit certificates).
- #strong[Text Auto-Fit Disabling]: To prevent PowerPoint from shrinking candidate names when character lengths exceed standard boundaries, the engine strips existing auto-fit properties and injects explicit non-autofit directives:

```xml
  <a:spPr>
      <a:noAutofit/>
  </a:spPr>
```

- #strong[Casing Normalization (`toProperCase`)]: Capitalizes names dynamically while strictly preserving standard engineering acronyms:
  `['CSE', 'ECE', 'EEE', 'ME', 'CE', 'AI&ML', 'IT', 'MBA', 'MCA', 'SIH', 'TCEK', 'R&D', 'IoT', 'VLSI']`


==== 8. Headless LibreOffice CLI Execution Profile Sandboxing

- #strong[Execution Command]:

```text
  soffice --headless --convert-to pdf --outdir /tmp/job-123 -env:UserInstallation=file:///tmp/soffice-profile-job-123 /tmp/job-123/slide.pptx
```

- #strong[Profile Isolation]: Passing `-env:UserInstallation=file:///tmp/soffice-profile-*` creates a distinct ephemeral configuration workspace for each batch job. This eliminates write-lock collisions on the default `~/.config/libreoffice` directory when multiple concurrent conversion subprocesses execute simultaneously.
- #strong[Deterministic Cleanup]: All transient files (`.pptx`, `.pdf`, and custom user profile trees) are unlinked inside a `finally { ... }` block, guaranteeing zero disk leakage on ephemeral container nodes.


==== 9. Concurrency Pool Controller (`runWithConcurrency`)

- #strong[Batch Slicing]: Converts large participant arrays (e.g. 100+ candidates) into discrete concurrency chunks:

```typescript
  async function runWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]>
```

- #strong[Threshold]: Fixed at `limit = 10`. This ensures that peak memory consumption remains under 350 MB on Render's 512 MB free container tier while maintaining throughput of ~8 certificates per second.


==== 10. HTTPS Email Proxy Protocol (Google Apps Script)

- #strong[Port Configuration]: Connects exclusively over TCP Port 443 (HTTPS) to the published Google Apps Script Web App exec URL.
- #strong[Payload Structure]:

```json
  {
    "to": "participant@gmail.com",
    "subject": "Your Official Certificate — SIH 2026",
    "htmlBody": "<div style='...'>...</div>",
    "attachments": [
      {
        "filename": "Certificate_Jane_Doe.pdf",
        "mimeType": "application/pdf",
        "base64": "JVBERi0xLjQK..."
      }
    ]
  }
```

- #strong[Egress Bypass]: Completely bypasses cloud provider SMTP port blocking (ports 25, 465, and 587) by routing through Google's native internal API infrastructure.


==== 11. Responsive 16:9 Dynamic PDF Streamer (`/verify`)

- #strong[Direct Binary Streaming]: When accessing `GET /api/verify-certificate/:id/pdf`, the backend sets:

```text
  Content-Type: application/pdf
  Content-Disposition: inline; filename="verified-certificate.pdf"
```

- #strong[Client Iframe Framing]: The React frontend embeds the binary stream inside a container styled with:

```css
  .certificate-frame {
      width: 100%;
      aspect-ratio: 16 / 9;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }
```

- #strong[Cross-Browser Compatibility]: Enables native high-resolution PDF rendering on desktop and mobile browsers without requiring third-party PDF.js libraries or browser extensions.


==== 12. Institutional Light Theme Design Tokens

- #strong[Color Hierarchy]:
  - `--bg-main: #ffffff` (Pure White card canvases)
  - `--bg-alt: #f8fafc` (Slate 50 subtle contrast background)
  - `--color-primary: #059669` (Emerald 600 institutional accent)
  - `--color-primary-hover: #047857` (Emerald 700 interactive state)
  - `--border-color: #e2e8f0` (Slate 200 clean hairline borders)
  - `--text-heading: #0f172a` (Slate 900 high-contrast title typography)
  - `--text-body: #334155` (Slate 700 readable narrative text)
  - `--text-muted: #64748b` (Slate 500 secondary labels & captions)
- #strong[Typography Hierarchy]:
  - UI Primary: `Inter, system-ui, -apple-system, sans-serif`
  - Display Headings: `Outfit, Inter, sans-serif`
  - Official Certificate Serif: `Cardo, Georgia, serif`
  - Official Certificate Monospace/Display: `Bebas Neue, sans-serif`


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



==== 3. API Endpoints Reference



=== Public Endpoints



==== `POST /api/apply/club`

- #strong[Purpose]: Submits a club membership application.
- #strong[Request Body]:

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

- #strong[Success Response (201 Created)]:

```json
  {
    "success": true,
    "message": "Application recorded successfully.",
    "id": 4
  }
```



==== `POST /api/apply/event`

- #strong[Purpose]: Submits a technical event attendance registration.
- #strong[Request Body]:

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

- #strong[Success Response (201 Created)]:

```json
  {
    "success": true,
    "message": "Event registration recorded successfully.",
    "id": 12
  }
```



==== `POST /api/apply/hackathon`

- #strong[Purpose]: Registers a hackathon team.
- #strong[Request Body]:

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

  > #strong[Note]: `projectTitle`, `projectDescription`, and `problemStatement` are optional (defaulting to empty string when not provided) to accommodate streamlined team registrations.
- #strong[Success Response (201 Created)]:

```json
  {
    "success": true,
    "message": "Hackathon team registration recorded successfully.",
    "id": 3
  }
```



==== `GET /api/verify-certificate/[certificateId]`

- #strong[Purpose]: Resolves certificate validation details.
- #strong[Success Response (200 OK)]:

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
      "certificateId": "TCEK/RD/2026-A9B2E3F4",
      "eventDate": "July 12, 2026",
      "issuedAt": "2026-08-16 08:30:00"
    }
  }
```



==== `GET /api/verify-certificate/[certificateId]/pdf`

- #strong[Purpose]: Compiles PPTX, converts to PDF, and streams the PDF buffer directly.
- #strong[Headers returned]:
  - `Content-Type: application/pdf`
  - `Content-Disposition: inline; filename="Certificate_JohnDoe.pdf"`


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



=== Authenticated Endpoints (Requires `Authorization: Bearer <token>`)



==== `GET /api/admin/applications`

- #strong[Purpose]: Retrieves all rosters (Club applications, Event registrations, Hackathon applications).
- #strong[Success Response (200 OK)]:

```json
  {
    "clubApplications": [...],
    "eventRegistrations": [...],
    "hackathonRegistrations": [...]
  }
```



==== `POST /api/admin/applications/status`

- #strong[Purpose]: Changes registration status or updates certificate actions.
- #strong[Request Body]:

```json
  {
    "type": "event",
    "id": 1,
    "status": "Won Second Place"
  }
```

- #strong[Success Response (200 OK)]:

```json
  {
    "success": true,
    "message": "Successfully updated application status to Won Second Place."
  }
```



==== `POST /api/admin/bulk-send/certificates`

- #strong[Purpose]: Batch compiles event certificates and dispatches emails.
- #strong[Headers]: `Content-Type: text/event-stream` (SSE stream logs).
- #strong[Request Body]:

```json
  {
    "eventTitle": "Edge AI: Deploying TinyML on Microcontrollers"
  }
```

- #strong[Success Stream Outputs]:

```text
  data: {"message":"Initializing email service...","progress":5,"isDone":false}
  data: {"message":"Converting templates to PDF...","progress":30,"isDone":false}
  ...
  data: {"message":"Process completed successfully.","progress":100,"isDone":true}
```



#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)




==== 4. Important Code Files


- #strong[`replacePlaceholdersInPptx()`] ([`backend/src/index.ts:L1134-1222`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts#L1134-1222)):
  Low-level XML parser. Opens the PPTX file structure, targets slide layouts, updates placeholders dynamically, and disables text-box wrapping configurations to maintain certificate margins.
- #strong[`convertPptxToPdfBatch()`] ([`backend/src/index.ts:L1291-1324`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts#L1291-1324)):
  Handles batch conversions using LibreOffice CLI (`soffice`), converting all PPTX templates to PDF in a single call to save resources.
- #strong[`setupDatabase()`] ([`backend/src/index.ts:L80-484`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts#L80-484)):
  Runs database setup on start, verifying tables exist and seeding initial values (branches, users, default events).
- #strong[`AdminDashboardPage`] ([`AdminDashboardPage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/pages/AdminDashboardPage.tsx)):
  Admin panel featuring a real-time event-log console drawer, attendee table filtering, and action status updates.
- #strong[`VerifyCertificatePage`] ([`VerifyCertificatePage.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/pages/VerifyCertificatePage.tsx)):
  Renders the public verification view, drawing certificate details dynamically inside a 16:9 widescreen frame.


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)




=== C. Configuration and Deployment


==== 1. Environment Variables


Below are the environment variables defined within [`backend/src/index.ts`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts):


#figure(
  table(
  columns: (1.5fr, 0.6fr, 1fr, 1.3fr, 1.6fr),
  stroke: 0.5pt + luma(180),
  fill: (col, row) => if row == 0 { rgb("#e8f0fe") } else { none },
  inset: (x: 3.5pt, y: 3.5pt),
  table.header([#strong[Variable]], [#strong[Purpose]], [#strong[Required]], [#strong[Example]], [#strong[Used By]]),
  [`PORT`], [Local and cloud server port binding.], [No (defaults to 5000)], [`5000`], [Express Server Startup],
  [`TURSO_URL`], [Cloud Turso edge SQLite endpoint.], [#strong[Yes]], [`https://rd-saicharan.aws-ap.turso.io`], [`@libsql/client`],
  [`TURSO_TOKEN`], [Auth credential for database endpoints.], [#strong[Yes]], [`eyJhbGciOiJFUzI1NiIsImt...`], [`@libsql/client`],
  [`JWT_SECRET`], [Secret key used to sign session cookies.], [No (defaults fallback)], [`rdcell_secret_key_2026`], [JWT Sign / Verification],
  [`SENDER_EMAIL`], [Primary sender address used for email dispatches.], [No (defaults fallback)], [`tcekrdcell@gmail.com`], [Nodemailer & Apps Script payload],
  [`SENDER_PASSWORD`], [Gmail app password for direct SMTP fallback.], [No (defaults fallback)], [`qtpt qryw kyct ekzo`], [Nodemailer client auth],
  [`DRIVE_UPLOAD_PROXY_URL`], [Dedicated Google Apps Script proxy strictly bound to `tcekrdcell@gmail.com` Google Drive. Uploads and organizes all student presentations (PPT/PDF).], [#strong[Yes (for Submissions)]], [`https://script.google.com/macros/s/AKfycbzo...`], [Google Drive Submission Dispatcher],
  [`GMAIL_HTTP_PROXY_URL`], [Comma-separated list of Google Apps Script proxy URLs. Automatic multi-account rotation and 24h quota exhaustion failover pool (100 emails/day per account).], [#strong[Yes (in Cloud)]], [`https://script.google.com/macros/s/AKfyc...,https://...`], [Email Dispatch Failover Pool],
  [`BREVO_API_KEY`], [Optional Brevo (Sendinblue) API key for automatic secondary failover when all Google proxies exhaust daily quotas (300 emails/day free).], [No], [`xkeysib-...`], [Secondary Email Failover],
  [`FRONTEND_URL`], [The public URL of the deployed frontend web app. Used as the recovery link origin fallback.], [No (defaults to `https://tcek-rd.web.app`)], [`https://tcek-rd.web.app`], [Forgot Password link origin],
  [`GROQ_MODELS`], [Optional models check used in health checks.], [No], [`["llama3-8b"]`], [`GET /api/health`],
),
  caption: [Backend & Frontend Environment Variables Specification],
)



#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)




==== 2. Third-Party Integrations


The system integrates with the following providers:

- #strong[Turso DB]: Edge database provider using SQLite. Handles fast SQL querying. If unavailable, API endpoints throw 500 errors.
- #strong[Render]: Cloud application host. Automatically runs backend Docker builds. If unavailable, APIs will fail.
- #strong[Firebase Hosting]: Serves built React frontend code. If unavailable, users cannot access the frontend portal.
- #strong[Google Apps Script Proxy]: Custom Apps Script API that forwards payload requests to Google mail APIs on port 443, bypassing SMTP restrictions.
- #strong[Google Fonts]: Docker builds request `Cardo` and `Bebas Neue` font files directly from Google Fonts repositories, caching them in Linux system paths.


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)




==== 3. Production Deployment



=== A. Backend Hosting (Render Docker Containers)

The backend API server requires a Linux container to execute headless LibreOffice and manage dynamic PPTX-to-PDF certificate compilation. Render uses a custom #strong[Docker-based deployment] to build and run the backend.

- #strong[Service Type]: Web Service (Docker-based).
- #strong[Repository & Branch]: Master/main branch of the connected GitHub/GitLab repository.
- #strong[Docker Image]: Builds on `node:20-bullseye-slim` (defined in the [`backend/Dockerfile`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/Dockerfile)).
- #strong[Build Command]: Custom commands are handled by the Docker file, which executes `npm install` and `npm run build` (compiles TypeScript to JS under the `/app/dist` folder) automatically inside the container.
- #strong[Start Command]: `npm start` (runs `node dist/index.js`).
- #strong[Root Directory]: `backend` (configured in the Render settings page).
- #strong[Port Configuration]: Exposes internal container port `5000` (Render dynamically maps incoming HTTPS requests on public port 443 to the container's port).
- #strong[Health Check Endpoint]: `/api/health` (publicly accessible, no authentication required, returns standard JSON status metadata).
- #strong[Auto-Deployment]: Render automatically pulls, rebuilds the Docker container, and performs a zero-downtime rolling restart whenever a commit is pushed to the tracked Git branch.
- #strong[Restart Behavior]: If the container crashes or encounters memory faults, Render automatically spins up a fresh container instance.
- #strong[Custom Domain & DNS Configuration]:
  1. Add a custom domain in Render's settings tab.
  2. Point a CNAME record from your DNS registrar (e.g. Cloudflare) to the Render sub-domain (e.g. `rd-backend.onrender.com`), or set up an A record targeting Render's public IPs for root apex domains.
  3. Render handles SSL/TLS certificate issuing and automatic renewal via Let's Encrypt.
- #strong[Common Deployment Failures]:
  - *Build Timeouts*: Pulling Node modules, installing LibreOffice (`apt-get install -y libreoffice`), and downloading custom fonts can take several minutes. Ensure the service build timeout allows for these installations.
  - *OutOfMemory (OOM) Errors*: Headless LibreOffice requires considerable RAM during batch operations. The codebase implements `runWithConcurrency` (throttled to a maximum limit of `10`) to limit concurrent executions and prevent container OOM restarts.
  - *Cold Start Delays*: Render's free tier spins down the web service after 15 minutes of inactivity. The first request after a sleep period will take up to 50 seconds to complete while the Docker container boots up.


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



=== B. Google Apps Script Email Proxy

Render's free tier blocks outgoing SMTP ports (25, 465, 587) to prevent spam, which prevents standard Nodemailer configurations from sending certificate emails. To resolve this, the system is designed to bypass SMTP blocks entirely by sending Base64-encoded PDF attachments via standard HTTPS POST request over port 443 to a custom Google Apps Script Web App.

- #strong[Purpose]: Bypasses cloud host SMTP locks (port 587/465) and eliminates cloud storage costs by leveraging Google Drive for student presentations and Gmail MailApp for reliable delivery.
- #strong[Source Script]: See [`backend/google_drive_proxy.gs`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/google_drive_proxy.gs) for the complete production Apps Script implementation.


==== Dual-Function Architecture:


1. #strong[Centralized Google Drive Submission Vault (`DRIVE_UPLOAD_PROXY_URL`)]:
   - #strong[Strictly Bound Account]: `tcekrdcell@gmail.com`
   - #strong[Workflow]: When students submit hackathon pitch presentations (PPTX/PDF), the backend encodes the buffer to Base64 and transmits it via HTTPS POST to the dedicated `tcekrdcell@gmail.com` Apps Script Web App.
   - #strong[Drive Structure]: Automatically maintains the hierarchical folder tree:

```
     📁 R&D Cell - Project Submissions/
     └── 📁 [Event Name]/               (e.g., SIH 2026 Internal Hackathon)
         └── 📁 [Team Folder Name]/      (e.g., Team 01 – Miaow Trinity)
             └── 📄 Presentation.pdf
```

   - #strong[Access Control]: Programmatically sets `ANYONE_WITH_LINK` (view-only) permissions and returns persistent Drive file and folder URLs stored in Turso DB.

2. #strong[Multi-Account Email Dispatch Pool (`GMAIL_HTTP_PROXY_URL`)]:
   - #strong[Failover Cluster]: Comma-separated list of Web App URLs deployed across multiple institutional and department Google accounts (`tcekrdcell@gmail.com`, `team.tcekrdcell@gmail.com`, `trinityrd39@gmail.com`, etc.).
   - #strong[Daily Quota Management]: Google limits free accounts to 100 emails/day. If any proxy hits quota exhaustion (`Service invoked too many times`), the backend marks it exhausted for 24 hours and instantly fails over to the next proxy in the cluster.
   - #strong[Fallback Chain]: `Apps Script Proxy #1` \$\rightarrow\$ `Proxy #2` \$\rightarrow\$ `...` \$\rightarrow\$ `Brevo API (300/day)` \$\rightarrow\$ `Direct SMTP`.

- #strong[Deployment Steps]:
  1. Open #link("https://script.google.com/")[script.google.com] under the target Google account.
  2. Paste code from [`backend/google_drive_proxy.gs`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/google_drive_proxy.gs).
  3. Run `authorizeAll()` once in the top toolbar to grant MailApp and DriveApp scopes.
  4. Click #strong[Deploy > New Deployment] \$\rightarrow\$ #strong[Web App].
     - #strong[Execute as]: *Me*
     - #strong[Who has access]: *Anyone*
  5. Copy Web App URL:
     - For `tcekrdcell@gmail.com`: Configure as `DRIVE_UPLOAD_PROXY_URL` and add to `GMAIL_HTTP_PROXY_URL`.
     - For auxiliary accounts: Append to `GMAIL_HTTP_PROXY_URL` separated by commas.


==== Institutional Google Accounts & Role Mapping


The platform orchestrates multiple Google accounts, each serving a distinct, strictly isolated operational role:


#figure(
  table(
  columns: (1.5fr, 0.6fr, 1fr, 1.3fr, 1.6fr),
  stroke: 0.5pt + luma(180),
  fill: (col, row) => if row == 0 { rgb("#e8f0fe") } else { none },
  inset: (x: 3.5pt, y: 3.5pt),
  table.header([#strong[Google Account ID]], [#strong[Assigned Role]], [#strong[Configuration Variable]], [#strong[Deployment Web App URL]], [#strong[Storage / Quota Scope]]),
  [#strong[`tcekrdcell@gmail.com`]], [#strong[Official Google Drive Submission Vault] & Primary Sender], [`DRIVE_UPLOAD_PROXY_URL` \ `SENDER_EMAIL` \ (also in `GMAIL_HTTP_PROXY_URL`)], [`https://script.google.com/macros/s/AKfycbzo4grUGKumfJ1CJpWXaD3IOjUooel7msY-yAN7sVmeOtH_QJ9dnX4gwGiGwwB_KMFX/exec`], [#strong[Exclusively stores all student pitch decks & presentations (PPT/PDF)] in institutional Drive (`R&D Cell - Project Submissions`). Also provides 100 emails/day to the dispatch pool.],
  [#strong[`team.tcekrdcell@gmail.com`]], [#strong[Auxiliary Email Dispatch Proxy]], [Listed in `GMAIL_HTTP_PROXY_URL`], [`https://script.google.com/macros/s/AKfycbygAq0eTP3EPLzc4mRNJWleiQO7AIftKRQYaRTMZkYwlrym175XxDq6n2VgFBtEjjrBQQ/exec`], [Provides an additional 100 emails/day quota for bulk certificates and notification broadcasts.],
  [#strong[`trinityrd39@gmail.com`]], [#strong[Auxiliary Email Dispatch Proxy]], [Listed in `GMAIL_HTTP_PROXY_URL`], [`https://script.google.com/macros/s/AKfycbyISD6l0jyrjADV_lO7IyrVL-F_eX5uCqNpVQMsJ-r4mAMLBgh05pMqE13DIXrdv_5uwA/exec`], [Provides an additional 100 emails/day quota in the failover pool.],
  [*(Additional Failover Proxies)*], [#strong[Secondary Rotation Proxies]], [Listed in `GMAIL_HTTP_PROXY_URL`], [`..._RAAO-QnOg/exec` \ `...a0TattqJ/exec`], [Tertiary proxies in the cluster ensuring combined capacity of 400–500+ emails/day.],
),
  caption: [Institutional Google Accounts & Strategic Role Mapping],
)



==== Headless & Unattended Server Execution (Does it work if you are not on the website?)


#strong[YES, 100%. The system operates completely independently of the administrator's active browser session:]

1. #strong[Student Project Submissions (PPT/PDF Uploads)]:
   - When students upload their project presentations on `https://tcek-rd.web.app/apply`, the request is handled directly between the student's browser and the cloud backend on Render (`https://rd-backend-kbsm.onrender.com`).
   - The backend streams the file to `tcekrdcell@gmail.com`'s Google Drive and updates the Turso database immediately.
   - #strong[The admin does NOT need to be on the website or have their computer running.]

2. #strong[Bulk Certificate Generation & Email Dispatches]:
   - Heavy batch operations are managed by the #strong[Background Task Manager (`taskManager.ts`)].
   - Once triggered from the Admin Dashboard, the job executes asynchronously inside the Docker container on Render.
   - #strong[You can close your browser tab, shut down your laptop, or navigate away without interrupting the task.]
   - Task state, item counts, and step-by-step logs are persisted in Turso DB (`task_records`).
   - When you log back in at any time, click #strong["Task History"] on the Admin Dashboard to review real-time status, completed items, or historical logs.


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



=== C. UptimeRobot Monitoring

To prevent Render instances from going into sleep mode (avoiding the 50-second cold start lag) and to receive instant down-state notifications, UptimeRobot should be configured to ping the backend server.

- #strong[Target Monitored Endpoint]: `https://your-backend-name.onrender.com/api/health`
- #strong[Monitor Type]: HTTPS health check.
- #strong[Expected Response HTTP Status]: `200 OK` (checks if the server responds with a valid `{"status":"online"}` payload).
- #strong[Monitoring Interval]: Configured to run every #strong[5 minutes] (this prevents the Render container from spinning down due to inactivity).
- #strong[Downtime Definiton]: Downtime is recorded if the endpoint returns a non-2xx status code (e.g. 500 Database Error, 503 Service Unavailable) or if requests timeout after #strong[30 seconds].
- #strong[Alert Configurations]: Set up notifications to send emails or triggers when a down status is confirmed.
- #strong[Troubleshooting False Alerts]: Render free tier cold-starts take about 50 seconds to complete. If the server is in a sleep state when UptimeRobot checks it, the first check will exceed the standard 30-second timeout and trigger a false down notification. If this occurs, increase the response timeout limit inside UptimeRobot to 60 seconds.


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



=== D. Frontend hosting (Firebase Hosting)

Frontend React assets are built and deployed directly to Firebase Hosting.


==== Firebase Deployment Steps:

1. Update `VITE_API_URL` inside [`frontend/.env.production`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/.env.production) with the Render API URL.
2. Build the optimized static assets:

```text
   cd frontend
   npm run build
```

3. Authenticate with Firebase and deploy:

```text
   firebase login
   npx firebase deploy --only hosting
```



#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)




==== 4. Development Workflow


Follow these steps to run the application locally:


=== Step 1: Install Dependencies

Open a terminal in the root workspace folder:

```text
# Setup backend libraries
cd backend
npm install

# Setup frontend libraries
cd ../frontend
npm install
```



=== Step 2: Configure Environment Variables

Create a `.env` file in the `backend/` folder:

```text
PORT=5000
TURSO_URL=your_turso_database_url
TURSO_TOKEN=your_turso_auth_token
JWT_SECRET=your_jwt_signing_key
SENDER_EMAIL=tcekrdcell@gmail.com
SENDER_PASSWORD=your_gmail_app_password
# Dedicated Drive Upload Proxy (tcekrdcell@gmail.com ONLY)
DRIVE_UPLOAD_PROXY_URL=https://script.google.com/macros/s/AKfycbzo4grUGKumfJ1CJpWXaD3IOjUooel7msY-yAN7sVmeOtH_QJ9dnX4gwGiGwwB_KMFX/exec
# Comma-separated rotation pool of Google Apps Script proxies for email
GMAIL_HTTP_PROXY_URL=https://script.google.com/macros/s/AKfycbzo...,https://script.google.com/macros/s/AKfycbyg...,https://script.google.com/macros/s/AKfycbyI...
```



=== Step 3: Run Setup Scripts

1. Run the template synchronization script to load PowerPoint template buffers into the Turso database:

```text
   cd backend
   node update_db_templates.js
```

2. Download and install custom fonts so local LibreOffice installs match templates:
   - #strong[Windows]: Right-click and execute the PowerShell script [`download_fonts.ps1`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/download_fonts.ps1) with Admin privileges. Select all files in the explorer window, right-click, and click #strong[Install].
   - #strong[Linux/Ubuntu]: Copy the TTF files from the `fonts` folder to `/usr/share/fonts/truetype/` and update font cache: `fc-cache -fv`.


=== Step 4: Run Development Servers

- Run the backend API server:

```text
  cd backend
  npm run dev
```

- In a new terminal, start the frontend developer server:

```text
  cd frontend
  npm run dev
```

- Open your browser to `http://localhost:5173/`.


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)





==== 5. Common Commands


Run these command arrays inside the respective directories:


=== Backend Commands (`backend/`)


```text
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



=== Frontend Commands (`frontend/`)


```text
# Install frontend modules
npm install

# Start local Vite development server
npm run dev

# Lint files
npm run lint

# Compile and package static assets for deployment
npm run build
```



#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)




==== 6. Deployment Checklist


Before deploying changes, verify the following:

- [ ] Check that `TURSO_URL` and `TURSO_TOKEN` environment variables are set correctly.
- [ ] Verify that `GMAIL_HTTP_PROXY_URL` is set to bypass Render SMTP port blocks.
- [ ] Run the template synchronization script (`node update_db_templates.js`) to sync PowerPoint templates into the DB.
- [ ] Download and install the custom fonts (Cardo and Bebas Neue) on the local host or verify they are in the Docker image.
- [ ] Update the production API endpoint `VITE_API_URL` inside [`frontend/.env.production`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/.env.production).
- [ ] Run `npm run build` inside the `frontend` folder and verify it builds without errors.
- [ ] Deploy the backend to Render and verify the deployment status is "Live".
- [ ] Deploy the frontend to Firebase and confirm the site loads over HTTPS.


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)




==== 7. Maintenance Guide


Follow these steps to update or add features:


=== A. Adding a New Frontend Page

1. Create a page component in [`frontend/src/pages/`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/pages).
2. Configure the route mapping inside [`frontend/src/App.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/App.tsx).
3. If public, register the navigation path in [`Header.tsx`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/frontend/src/components/Header.tsx).


=== B. Adding a New Backend Endpoint

1. Open [`backend/src/index.ts`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts).
2. Add the endpoint route and configure permissions (e.g. `authenticateToken` middleware for authenticated routes).
3. Update the API reference table in this documentation.


=== C. Updating the Database Schema

1. Open [`backend/src/index.ts`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/src/index.ts).
2. Locate the database initialization script `setupDatabase()`.
3. Add the new table query or execute `ALTER TABLE` schema changes.
4. If necessary, update the clearing utility [`clear_db.js`](file:///c:/Users/bhuth/OneDrive/Desktop/CER/backend/clear_db.js) to clear the new table during resets.


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)




==== 8. Developer Quick Start


Get the project running locally in 5 commands:


```text
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



#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)




==== 9. Production Quick Reference



#figure(
  table(
  columns: (1.2fr, 1.2fr, 1.1fr, 1.1fr, 1.4fr),
  stroke: 0.5pt + luma(180),
  fill: (col, row) => if row == 0 { rgb("#e8f0fe") } else { none },
  inset: (x: 3.5pt, y: 3.5pt),
  table.header([#strong[System Area]], [#strong[Cloud Service Provider]], [#strong[Purpose]], [#strong[Console / Dashboard Link]], [#strong[Configuration Details]]),
  [#strong[Frontend]], [Firebase Hosting], [Hosting built static assets.], [\#link("https://console.firebase.google.com/")[Firebase Console]], [Deployed to `https://tcek-rd.web.app` (configured in `firebase.json`).],
  [#strong[Backend]], [Render], [Docker Web Service API hosting.], [\#link("https://dashboard.render.com/")[Render Dashboard]], [Docker Bullseye Slim container running Express and LibreOffice.],
  [#strong[Database]], [Turso Cloud], [libSQL SQLite server.], [\#link("https://turso.tech/")[Turso Dashboard]], [Multi-region edge database.],
  [#strong[Email Proxy]], [Google Script Proxy], [Bypasses SMTP blocks.], [\#link("https://script.google.com/")[Google Apps Script]], [Deployed Google Apps Script forwarding Gmail API payloads.],
  [#strong[Uptime Monitoring]], [UptimeRobot], [Pings API to prevent sleep.], [\#link("https://uptimerobot.com/dashboard")[UptimeRobot Dashboard]], [Configured HTTP check targeting `/api/health`.],
  [#strong[Credentials & OAuth]], [Google Cloud Console], [Manages Gmail APIs & credentials.], [\#link("https://console.cloud.google.com/")[Google Cloud Console]], [OAuth client setups and API library activation.],
  [#strong[Analytics (Tracking)]], [Google Analytics], [Tracks user sessions & actions.], [\#link("https://analytics.google.com/")[Google Analytics Console]], [Tracks page visits and button clicks.],
  [#strong[Tag Management]], [Google Tag Manager], [Inject analytics scripts dynamically.], [\#link("https://tagmanager.google.com/")[Google Tag Manager]], [Standard container configuration.],
),
  caption: [Production Quick Reference & Operational Specifications],
)



#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)




#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



== Security Implementation


=== A. Authentication and Role-Based Access Controls



=== Hashing & Credentials

- Passwords are encrypted using a unique, cryptographically secure 16-byte random salt generated per-user, prepended to the password, and hashed using `bcryptjs` with a work factor of 10.
- Seeding logic inserts defaults on startup if they do not exist, and migrates existing legacy/un-salted default seeded accounts to the new salted schema.


=== Default Admin Accounts (Configured via secure setup)

- #strong[Developer Access]:
  - Username: `charan`
- #strong[Superadmin Access]:
  - Username: `akhya`


=== Role-Based Access Control (RBAC)

- #strong[`developer`]: Superuser access. Can perform any dashboard action and create or delete other developers, superadmins, or admins.
- #strong[`superadmin`]: Administrative supervisor. Can access all data, manage branches/events, and create/delete `admin` accounts only. Cannot create developers or delete other superadmins.
- #strong[`admin`]: Operations manager. Full access to dashboard rosters, event messaging, room allocations, registration desk coordinators, and bulk dispatch engines. Cannot manage other admin user accounts.
- #strong[`reg_desk`]: Registration Desk coordinator. Isolated strictly to event check-in operations (`/api/reg-desk/*`). Blocked by middleware from accessing administrative controllers, user tables, or certificate generation pipelines.


=== Authentication Flow

The system utilizes a dual-authentication mechanism to support both local development (same-site cookies) and cross-site production deployments (Firebase and Render hosted on separate domains):

1. #strong[Token Delivery]: On login, the backend issues an HttpOnly `admin_token` cookie and returns the signed JWT `token` and a `csrfToken` in the JSON response body.
2. #strong[Persistence]: The frontend stores the JWT token under `admin_token` and the CSRF token under `csrf_token` in `localStorage`.
3. #strong[Authorization Header (Cross-Site)]: All API requests attach the token to the `Authorization: Bearer <token>` header, bypassing cross-site cookie restrictions.
4. #strong[Cookie Fallback & CSRF Protection (Same-Site)]: If cookies are accepted, mutating requests (`POST`, `PUT`, `DELETE`) are verified against the `X-CSRF-Token` header.


```text
Admin  ---> Submit Credentials  --->  Verify via bcrypt  ---> Set-Cookie: admin_token (HttpOnly) & Return JSON { token, csrfToken }
                                                                                              |
Admin Request  <---  Attach Bearer Token to "Authorization" & CSRF Token to "X-CSRF-Token" <--+
```



#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)




=== B. Applied Vulnerability Mitigation Rules



=== Implemented Protections

- #strong[Password Hashing]: Uses a unique, cryptographically secure random salt generated per-user, prepended to the password, and hashed using `bcryptjs` with a work factor of 10 to securely hash admin passwords, preventing dictionary attacks and plain-text exposures in database breaches.
- #strong[Session Validation]: Protects backend routes using JWT tokens with a standard HMAC-SHA256 signature and a default 8-hour expiry limit.
- #strong[Database Security]: Turso DB interactions use parameterized SQL statements (`db.execute({ sql, args })`) instead of raw string concatenations, protecting the application against SQL injection attacks.
- #strong[Input Sanitization]: Replaces special XML/HTML characters (`&` \$\rightarrow\$ `&amp;`, `<` \$\rightarrow\$ `&lt;`, `>` \$\rightarrow\$ `&gt;`) in PPTX replacement placeholders to prevent layout breaks and XML injection.
- #strong[Casing Normalization]: Sanitizes achievement status strings against lowercase participation tags to restrict arbitrary text injections.
- #strong[CORS Configuration]: Configures CORS middleware on the backend to allow client integrations, restricting endpoints to recognized cross-domain request pathways.


=== Implemented Security Enhancements & Protections

- #strong[Rate Limiting]: Enforces rate limiting on all API routes using `express-rate-limit`, with strict thresholds on sensitive pathways (e.g., login, forgot password, registration/application submissions, and certificate verification).
- #strong[Certificate ID Obfuscation]: Appends a unique, cryptographically secure 4-byte random hex suffix to certificate verification IDs (e.g. `TCEK/RD/2026-A9B2E3F4`). The public verification endpoint checks and blocks brute-force sequential scanning by requiring the exact suffixed ID.
- #strong[Dual Auth & CSRF Protection]: For same-origin deployments, session tokens are stored in secure HTTP-only cookies (`admin_token`) to prevent XSS-based token theft. For cross-origin production deployments, session tokens are stored in local storage and sent via the `Authorization` header due to cross-site cookie boundaries, protected against CSRF via double-submit header checks.
- #strong[Automated Account Recovery]: Added a secure, stateful, one-time password reset flow. Reset tokens are salted and hashed (using SHA-256) inside the database to protect against database read compromises and ensure one-time usage via signed JWT links.
- #strong[Environment-Configured Credentials]: Seeding default developer and superadmin passwords from environment variables in `.env` rather than hardcoding them in the startup source code.
- #strong[Restricted Debug Endpoints]: Font debug endpoints require token authentication and are completely disabled in production mode.


==== Figure 19: Security Enforcement Architecture Flowchart




#figure(
  image("../media/figures/readme_fig19.svg", width: 95%),
  caption: [Security Enforcement Architecture Flowchart],
  kind: image,
)




#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)




#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)




=== Security Threat Model



#figure(
  table(
  columns: (1.2fr, 2fr),
  stroke: 0.5pt + luma(180),
  fill: (col, row) => if row == 0 { rgb("#e8f0fe") } else { none },
  inset: (x: 3.5pt, y: 3.5pt),
  table.header([#strong[Threat]], [#strong[Protection Mechanism]]),
  [#strong[XSS token theft]], [Store JWT token in secure, HttpOnly cookies for same-origin fallback; cross-site uses local storage with CSRF validation.],
  [#strong[CSRF attacks]], [Enforce header-based Double-Submit CSRF checks (`X-CSRF-Token` validation).],
  [#strong[Brute-force logins]], [Apply API rate limiting gate limiters on sensitive auth path endpoints.],
  [#strong[Password compromise]], [Enforce salt generation (16-byte cryptographically secure) and `bcryptjs` hashing.],
  [#strong[Reset-token theft]], [Store recovery tokens as secure SHA-256 hashes, with 15-minute expirations and used state indicators.],
  [#strong[Unauthorized admin operations]], [Apply Role-Based Access Control (RBAC) middleware verifying roles on REST routes.],
  [#strong[Certificate forgery]], [Implement public validation lookup page (`/verify`) to authenticate credentials.],
  [#strong[Malicious cross-origin calls]], [Restrict backend access origins via strict CORS configurations.],
  [#strong[Debug endpoint abuse]], [Restrict font debug routes to dev mode and require token authorization.],
),
  caption: [Security Threat Model & Risk Mitigation Matrix],
)

