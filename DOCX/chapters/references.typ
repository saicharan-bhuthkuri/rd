= REFERENCES


== References


=== Core Project Dependencies



=== Frontend Dependencies (`frontend/package.json`)

- `react` & `react-dom` (v19.2.8): Core library.
- `react-router-dom` (v7.18.2): Handles routing.
- `lucide-react` (v1.29.0): Icon library.
- `vite` (v8.2.0): Build tool and dev server.


=== Backend Dependencies (`backend/package.json`)

- `@libsql/client` (v0.17.4): Turso edge SQLite driver.
- `bcryptjs` (v3.0.3): Password hashing.
- `cors` (v2.8.5): Handles Cross-Origin Resource Sharing.
- `dotenv` (v16.4.5): Loads environment configurations.
- `express` (v4.19.2): Web framework.
- `jsonwebtoken` (v9.0.3): Signs and verifies session tokens.
- `nodemailer` (v9.0.5): Handles email sending (SMTP fallback).
- `pizzip` (v3.2.0): Zip extractor for editing XML in PPTX templates.


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)




=== Standard Literature, RFCs & Official Specifications

1. #strong[Office Open XML File Formats]: ECMA International. (2016). *Standard ECMA-376: Office Open XML File Formats*. 5th edition. #link("https://www.ecma-international.org/publications-and-standards/standards/ecma-376/")[ECMA-376 Specification]
2. #strong[LibreOffice Headless Compiler]: The Document Foundation. (2026). *LibreOffice Command-Line Parameters and Headless Conversion Documentation*. #link("https://help.libreoffice.org/latest/en-US/text/shared/guide/start_parameters.html")[LibreOffice CLI Documentation]
3. #strong[JSON Web Tokens (JWT)]: Jones, M., Bradley, J., & Sakimura, N. (2015). *RFC 7519: JSON Web Token (JWT)*. Internet Engineering Task Force (IETF). #link("https://datatracker.ietf.org/doc/html/rfc7519")[RFC 7519 Specification]
4. #strong[Cross-Site Request Forgery (CSRF) Mitigation]: OWASP Foundation. (2025). *Cross-Site Request Forgery Prevention Cheat Sheet*. #link("https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html")[OWASP CSRF Cheat Sheet]
5. #strong[Secure Password Hashing & Storage]: OWASP Foundation. (2025). *Password Hashing Cheat Sheet*. #link("https://cheatsheetseries.owasp.org/cheatsheets/Password_Hashing_Cheat_Sheet.html")[OWASP Password Hashing Cheat Sheet]
6. #strong[Server-Sent Events (SSE)]: World Wide Web Consortium (W3C). (2015). *Server-Sent Events: W3C Recommendation*. #link("https://www.w3.org/TR/eventsource/")[W3C SSE Specification]
7. #strong[Turso & libSQL Database Driver]: Turso DB. (2026). *libSQL Client SDK for JavaScript and TypeScript*. #link("https://docs.turso.tech/")[Turso libSQL Docs]
8. #strong[Google Apps Script Web App Services]: Google Developers. (2026). *Apps Script Web Apps and Gmail API Services integration guide*. #link("https://developers.google.com/apps-script/guides/web")[Google Apps Script Reference]
9. #strong[React Framework]: Meta Platforms, Inc. (2025). *React 19 Documentation and API Reference*. #link("https://react.dev")[React 19 Docs]
10. #strong[TypeScript Compiler & Language Reference]: Microsoft Corp. (2026). *TypeScript Language Specification and Compiler Reference*. #link("https://www.typescriptlang.org/docs/")[TypeScript Docs]
11. #strong[Express Web Application Framework]: StrongLoop. (2025). *Express 4.x API Reference and Routing Guide*. #link("https://expressjs.com")[Express.js Docs]


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



== Appendix: Visual Diagrams Directory


This directory provides a consolidated index of all project-specific visual representations embedded across the documentation. It serves as a textual index linking to each visual and its corresponding section where it is placed directly below the relevant explanations.


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



=== A. PART I: PROJECT OVERVIEW & ARCHITECTURE


1. #strong[System Architecture Diagram (Figure 1)]
   - #strong[Location Reference]: [Section 5: Application Architecture](\#5-application-architecture)
   - #strong[Description]: Shows the client-server boundaries, database queries, and third-party integrations (Turso DB, Apps Script Proxy, LibreOffice PDF conversions, PizZip PPTX XML parsing).
   - #strong[Link]: [View System Architecture Diagram](\#5-application-architecture)

2. #strong[End-to-End Application Workflow Diagram (Figure 2)]
   - #strong[Location Reference]: [Section 5: Application Architecture](\#5-application-architecture)
   - #strong[Description]: Visualizes the workflow process for candidate application submission, status approval, and bulk certificate dispatch.
   - #strong[Link]: [View Workflow Diagram](\#5-application-architecture)

3. #strong[Level-0 Context DFD (Figure 3)]
   - #strong[Location Reference]: [Section 5: Application Architecture](\#5-application-architecture)
   - #strong[Description]: Visualizes Level-0 context boundaries of data movement across system entry points.
   - #strong[Link]: [View Data Flow Diagram](\#5-application-architecture)

4. #strong[System Use Case Diagram (Figure 4)]
   - #strong[Location Reference]: [Section 5: Application Architecture](\#5-application-architecture)
   - #strong[Description]: Maps out actors (Public Candidates, Club Administrators, Developers) and their system boundary use case interactions.
   - #strong[Link]: [View Use Case Diagram](\#5-application-architecture)

5. #strong[Bulk Certificate Dispatch Sequence Diagram (Figure 5)]
   - #strong[Location Reference]: [Section 5: Application Architecture](\#5-application-architecture)
   - #strong[Description]: Detailed workflows for applicant registration, credential lookups, and bulk email deliveries.
   - #strong[Link]: [View Sequence Diagrams](\#5-application-architecture)


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



=== B. PART II: SYSTEM CORE COMPONENT DOCUMENTATION


6. #strong[Database ER Diagram (Figure 6)]
   - #strong[Location Reference]: [Section 10: Database Documentation](\#10-database-documentation)
   - #strong[Description]: Illustrates table schemas, primary keys, foreign keys, and relationships.
   - #strong[Link]: [View Database ER Diagram](\#10-database-documentation)

7. #strong[Frontend–Backend–Database Relationship Diagram (Figure 16)]
   - #strong[Location Reference]: [Section 25: Database/API/Frontend Relationship](\#25-databaseapifrontend-relationship)
   - #strong[Description]: Visually maps communications between the browser user interface, Node service controller routers, and Turso Edge LibSQL.
   - #strong[Link]: [View Relationship Diagram](\#25-databaseapifrontend-relationship)


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



=== C. PART III: PLATFORM CONFIGURATION & DEVELOPMENT ENVIRONMENT


8. #strong[Production/Deployment Architecture Diagram (Figure 7)]
   - #strong[Location Reference]: [Section 14: Production Architecture](\#14-production-architecture)
   - #strong[Description]: Shows the production deployment nodes (Firebase static CDN, Render Docker containers, Turso edge sqlite nodes, and Apps Script HTTP proxy gateways).
   - #strong[Link]: [View Deployment Architecture Diagram](\#14-production-architecture)

9. #strong[External Service Dependency Diagram (Figure 17)]
   - #strong[Location Reference]: [Section 33: External Service Dependency Map](\#33-external-service-dependency-map)
   - #strong[Description]: Details all external third-party integrations and dependencies.
   - #strong[Link]: [View Service Dependency Diagram](\#33-external-service-dependency-map)


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



=== D. PART IV: QUALITY ASSURANCE & SYSTEM TESTING


10. #strong[Testing Architecture & Verification Flow Diagram (Figure 8)]
    - #strong[Location Reference]: [Section 16: Testing](\#16-testing)
    - #strong[Description]: Visualizes compilation checks, linter runs, local integration test runners, and production deployment hooks.
    - #strong[Link]: [View Testing Flow Diagram](\#16-testing)

11. #strong[Unit Testing Diagram (Figure 9)]
    - #strong[Location Reference]: [Section 16.A: Unit Testing Results](\#16-testing)
    - #strong[Description]: Process flow of isolated logic helpers verification.
    - #strong[Link]: [View Unit Testing Diagram](\#16-testing)

12. #strong[Black-Box Testing Diagram (Figure 10)]
    - #strong[Location Reference]: [Section 16.B: Black-Box Testing Results](\#16-testing)
    - #strong[Description]: Sequence diagram showing public API boundary integrations.
    - #strong[Link]: [View Black-Box Testing Diagram](\#16-testing)

13. #strong[White-Box Testing Diagram (Figure 11)]
    - #strong[Location Reference]: [Section 16.C: White-Box Testing Results](\#16-testing)
    - #strong[Description]: Diagram showing internal branch coverage and exception handling paths.
    - #strong[Link]: [View White-Box Testing Diagram](\#16-testing)

14. #strong[Gray-Box/Green-Box Testing Diagram (Figure 12)]
    - #strong[Location Reference]: [Section 16.D: Gray-Box & Integration Testing Results](\#16-testing)
    - #strong[Description]: Visualizes SSE sync channels and Google Apps Script proxy relays.
    - #strong[Link]: [View Gray-Box Testing Diagram](\#16-testing)

15. #strong[SMTP Mail Block Debugging Flow Diagram (Figure 13)]
    - #strong[Location Reference]: [Section 16.F: Detailed Testing & Bug-Fix Report](\#16-testing)
    - #strong[Description]: Visual workflow mapping port block timeouts debugging to Apps Script HTTPS proxy relays.
    - #strong[Link]: [View SMTP Debugging Diagram](\#16-testing)

16. #strong[Hook setState Loop Debugging Flow Diagram (Figure 14)]
    - #strong[Location Reference]: [Section 16.F: Detailed Testing & Bug-Fix Report](\#16-testing)
    - #strong[Description]: Visual workflow mapping React render cycle loops debugging to setTimeout macro-task schedules.
    - #strong[Link]: [View Hook Loop Debugging Diagram](\#16-testing)


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



=== E. PART V: BUILD & CI/CD CONFIGURATION


17. #strong[CI/CD Pipeline Diagram (Figure 15)]
    - #strong[Location Reference]: [Section 18: CI/CD](\#18-cicd)
    - #strong[Description]: CI/CD automation workflow diagram showing type checks, linters, bundling compilers, and hosting deployments.
    - #strong[Link]: [View CI/CD Pipeline Diagram](\#18-cicd)


#v(0.5em)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5em)



=== F. PART VII: SYSTEM READINESS & VISUAL DIRECTORY


18. #strong[TRL & Implementation Readiness Diagram (Figure 18)]
    - #strong[Location Reference]: [Section 35: Technology Readiness Level (TRL) & Implementation Readiness (IR) Assessment](\#35-technology-readiness-level-trl--implementation-readiness-ir-assessment)
    - #strong[Description]: Progression flowchart mapping current validation proofs to operational transition parameters.
    - #strong[Link]: [View TRL & IR Maturity Diagram](\#35-technology-readiness-level-trl--implementation-readiness-ir-assessment)



