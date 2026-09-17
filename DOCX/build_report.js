const fs = require('fs');
const path = require('path');

const mainTypBak = path.join(__dirname, 'main.typ.bak');
const originalContent = fs.readFileSync(mainTypBak, 'utf8');

// 1. Locate abstract insertion point
const abstractAnchor = '= ABSTRACT\n]\n#v(1em)\n';
const abstractPos = originalContent.indexOf(abstractAnchor);
if (abstractPos === -1) {
  console.error("Could not find abstract anchor in main.typ.bak");
  process.exit(1);
}

const beforeAbstract = originalContent.substring(0, abstractPos + abstractAnchor.length);

// 2. Locate after abstract (pagebreak before list of figures)
const postAbstractAnchor = '#pagebreak()\n#set page(numbering: "1.")\n\n#set heading(numbering: "1.")';
const postAbstractPos = originalContent.indexOf(postAbstractAnchor);
if (postAbstractPos === -1) {
  console.error("Could not find post-abstract anchor");
  process.exit(1);
}

// 3. Locate intro anchor
const introAnchor = '#pagebreak()\n= INTRODUCTION';
const introPos = originalContent.indexOf(introAnchor);
if (introPos === -1) {
  console.error("Could not find intro anchor");
  process.exit(1);
}

const middlePart = originalContent.substring(postAbstractPos, introPos);

// Abstract body text without inner parbreak warnings
const abstractBody = `
#set par(justify: true)

The Research & Development (R&D) Cell at Trinity College of Engineering & Technology requires an enterprise-grade digital infrastructure to manage the complete student innovation and academic event lifecycle. In conventional educational institutions, managing student applications, organizing hackathons, conducting on-site physical event registrations, and issuing authenticated credentials suffers from severe operational bottlenecks: spreadsheet fragmentation, paper-based check-in queues, manual certificate formatting prone to text auto-fit distortion, SMTP port blocking on cloud container hosts, and rampant academic credential forgery.

To address these systemic challenges, this project presents a *Secure Cloud-Based Institutional Application & Automated Credential Management Platform*. The system unifies a modern single-page application built with React 19 and TypeScript, an Express 4.19 application gateway running on Node.js 20, and a distributed edge relational database powered by Turso Edge SQLite across 16 normalized relational tables. 

The primary technical contribution is an end-to-end automated credential processing pipeline. The pipeline dynamically maps student profile registers to PowerPoint OpenXML templates (\`.pptx\`), decompresses XML slide nodes in memory via PizZip, and automatically injects \`<a:noAutofit/>\` formatting tags to preserve typography layouts and certificate margins for long student names. Concurrency-controlled headless LibreOffice CLI processes run inside sandboxed Debian Docker containers with isolated configuration profiles to compile batches of high-resolution PDF certificates in seconds. To bypass cloud host firewall egress blocks on SMTP ports 25, 465, and 587, compiled PDF buffers are Base64-encoded and dispatched over secure HTTPS (port 443) through an authorized Google Apps Script proxy communicating directly with the Google Mail API.

Furthermore, the platform features a dedicated on-site Registration Desk terminal with 6-box temporary password authentication and real-time roll number search, an executive Event Messaging Studio with multi-group audience targeting and locked institutional letterhead branding, a public dynamic credential verification portal (\`/verify\`) that renders certificates on the fly in responsive 16:9 widescreen frames, and persistent Server-Sent Events (SSE) keep-alive channels for real-time dashboard state synchronization. Defense-in-depth security is enforced through HttpOnly SameSite=Lax JWT session cookies, Double-Submit CSRF header verification (\`X-CSRF-Token\`), multi-window rate limiting, and strict Role-Based Access Control (RBAC). Automated integration testing across production nodes achieves a 100% pass rate across 33 integration assertions, confirming Technology Readiness Level 6 (TRL 6) and Implementation Readiness 6 (IR 6).
`;

// Chapters inclusion
const chaptersPart = `
#pagebreak()
#include "chapters/ch1_introduction.typ"

#pagebreak()
#include "chapters/ch2_literature_survey.typ"

#pagebreak()
#include "chapters/ch3_system_requirements.typ"

#pagebreak()
#include "chapters/ch4_system_design.typ"

#pagebreak()
#include "chapters/ch5_algorithms.typ"

#pagebreak()
#include "chapters/ch6_implementation_security.typ"

#pagebreak()
#include "chapters/ch7_testing_qa.typ"

#pagebreak()
#include "chapters/ch8_results_performance.typ"

#pagebreak()
#include "chapters/ch9_conclusion.typ"

#pagebreak()
#include "chapters/references.typ"
`;

// Combine into final main.typ
const finalContent = beforeAbstract + abstractBody + '\n' + middlePart + chaptersPart;

fs.writeFileSync(path.join(__dirname, 'main.typ'), finalContent, 'utf8');
console.log("main.typ successfully generated with clean formatting.");
