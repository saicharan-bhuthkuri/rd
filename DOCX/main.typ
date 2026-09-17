#set text(font: "Times New Roman", size: 14pt, hyphenate: false)
#align(center)[
  #text(size: 16pt)[
    #strong[
      // #text(size: 12pt)[Appendix1 ]\ \
      A \ MINI PROJECT REPORT  \
      ON  \
      "SECURE CLOUD-BASED INSTITUTIONAL MANAGEMENT SYSTEM FOR STUDENT APPLICATIONS, EVENT MANAGEMENT AND AUTOMATED CERTIFICATE GENERATION & VERIFICATION"
    ] \
    #text(size: 12pt)[
      #emph[#strong[In partial fulfilment for the award of the degree]] \
      #emph[#strong[Of]] \
    ]
    #strong[
      BACHELOR OF TECHNOLOGY \
      IN \
      ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING
    ]
  ]

  #box(image("./media/image1.png", width: 2.1in))

  #text(size: 11pt, weight: "bold")[SUBMITTED BY]

  #text(size: 10pt, weight:"bold")[
    BHUTHKURI SAI CHARAN (23UD1A7307) \
  ]

  Under the Esteemed Guidance of

  #text(size: 13pt)[#strong[Mrs. GADDAM LAKSHMI]] \
  #text(size: 13pt)[#strong[Associate Professor & HOD of AIML]]

  #text(size: 13pt, weight: "bold", fill: rgb("#538135"))[DEPARTMENT OF ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING]

  #line(length: 60%)

  #text(size: 13pt, weight: "bold", fill: red)[TRINITY COLLEGE OF ENGINEERING AND TECHNOLOGY]

  #text(size: 13pt, weight: "bold", fill: rgb("#538135"))[
    (AN AUTONOMOUS INSTITUTION) \
    PEDDAPALLI-505172 \
    2023-2027
  ]
]

#pagebreak()
#set page(numbering: "I.")
#counter(page).update(1)


#align(right)[
  #text(size: 13pt, weight: "bold", fill: rgb("#538135"))[
  COLLEGE CODE: UD
  ]
]

#align(center)[
  #text(size: 13pt, weight: "bold", fill: red)[TRINITY COLLEGE OF ENGINEERING AND TECHNOLOGY]
  #text(size: 13pt, weight: "bold", fill: rgb("#538135"))[ \
    (AN AUTONOMOUS INSTITUTION) \
    PEDDAPALLI-505172 \
    2023-2027 \
  ]
  #line(length: 60%)
  #align(right)[#text(size: 13pt, weight: "bold", fill: rgb("#538135"))[
    Date: #h(3em)
  ]]
  = CERTIFICATE
]

#align(center)[
  #box(image("./media/image1.png", width: 2.08333in))
]

#par(justify:true)[
Certified that this project report entitled, #strong["Secure Cloud-Based Institutional Management System for Student Applications, Event Management and Automated Certificate Generation & Verification"] is the Bona fide work of
#strong[BHUTHKURI SAI CHARAN (23UD1A7307)
] of B.Tech III Year, AIML in the
year 2026 in partial fulfilment of the requirements to award the Degree
of Bachelor of Technology in Artificial Intelligence & Machine Learning
branch of Trinity College of Engineering and Technology.
]

#align(bottom)[
  #align(center)[#text(weight: "bold")[
    INTERNAL GUIDE #h(1fr) HEAD OF THE DEPARTMENT \
    #v(4em)
    EXTERNAL EXAMINER #h(1fr) PRINCIPAL #h(0.2fr)
    #v(2em)
  ]]
]

#pagebreak()

#set page(
  paper: "a4",
  margin: (
    top: 1in,
    bottom: 1in,
    left: 1.5in,
    right: 1in
  ),
  number-align: center,
)

#align(center)[
  = DECLARATION
]
#set text(size: 12pt)

#v(3em)

#par(justify:true)[
I hereby declare that the work which is being presented in this report
entitled #strong["Secure Cloud-Based Institutional Management System for Student Applications, Event Management and Automated Certificate Generation & Verification"]
submitted towards the partial fulfilment of the requirements for the
award of the degree of Bachelor of Technology in Artificial Intelligence
& Machine Learning, Trinity College of Engineering and Technology,
Peddapalli is an authentic record of our own work carried out under the
supervision of #strong[Mrs. GADDAM LAKSHMI, Associate Professor,] Department of
AIML, Trinity College of Engineering and Technology, Peddapalli. To
the best of our knowledge and belief, this project bears no resemblance
with any report submitted to Trinity College of Engineering and
Technology or any other University for the award of any degree.
]
#v(3em)

#align(right)[#text(weight: "bold")[
  #text(size: 12pt)[BHUTHKURI SAI CHARAN (23UD1A7307)] 
]]
#pagebreak()


#align(center)[
= ACKNOWLEDGEMENT
]
#v(3em)

#set par(
  first-line-indent: 1.2em,
  spacing: 1.4em,
  leading: 1em,
  justify: true,
)
#text(baseline: 1em)[
#h(1em) I wish to acknowledge with gratitude to the College Authority for the
opportunity and support given us to do the project without which I
could not have made this project successful.

I wish to place on our record our deep sense of gratitude to our
project guide, #strong[Mrs. GADDAM LAKSHMI], Associate Professor of AIML for her
constant motivation and valuable help throughout the project work.

I highly obliged to #strong[Mrs. G. Lakshmi, Associate Professor & Head of the
Department of AIML] for her motivation and encouragement during the
period of this project.

I feel privileged to thank to Academic Director #strong[Dr. V. ASHOK KUMAR] for
his encouragement during the progress of the work.

I highly indebted to our Principal, #strong[Dr. MANI GANESH] support using the
period of this project work.

I express our utmost thanks to #strong[Sri. D. PRASHANTH REDDY Chairman],
Trinity Group of Institutions.

I express our utmost thanks to #strong[Sri. D. MANOHAR REDDY] Founder of
Trinity Group of Institutions, for his continuous care towards my
achievements.

I would like to thank the teaching and non-teaching staff of AIML
Department for sharing their knowledge with us.

Finally, special thanks to our parents, sisters and brothers for their
support and encouragement throughout our life and this course. Thanks
to all our friends and well-wishers for their constant support.
]
#pagebreak()

#align(center)[
  #text(size: 14pt, weight: "bold")[CONTENTS]
]

#outline(
  title: none,
  depth: 2,
)

#pagebreak()
#set page(numbering: "1.")
#counter(page).update(1)

#align(center)[
= ABSTRACT
]
#v(1em)

#set par(justify: true)

The Research & Development (R&D) Cell at Trinity College of Engineering & Technology requires an enterprise-grade digital infrastructure to manage the complete student innovation and academic event lifecycle. In conventional educational institutions, managing student applications, organizing hackathons, conducting on-site physical event registrations, and issuing authenticated credentials suffers from severe operational bottlenecks: spreadsheet fragmentation, paper-based check-in queues, manual certificate formatting prone to text auto-fit distortion, SMTP port blocking on cloud container hosts, and rampant academic credential forgery.

To address these systemic challenges, this project presents a *Secure Cloud-Based Institutional Application & Automated Credential Management Platform*. The system unifies a modern single-page application built with React 19 and TypeScript, an Express 4.19 application gateway running on Node.js 20, and a distributed edge relational database powered by Turso Edge SQLite across 16 normalized relational tables. 

The primary technical contribution is an end-to-end automated credential processing pipeline. The pipeline dynamically maps student profile registers to PowerPoint OpenXML templates (`.pptx`), decompresses XML slide nodes in memory via PizZip, and automatically injects `<a:noAutofit/>` formatting tags to preserve typography layouts and certificate margins for long student names. Concurrency-controlled headless LibreOffice CLI processes run inside sandboxed Debian Docker containers with isolated configuration profiles to compile batches of high-resolution PDF certificates in seconds. To bypass cloud host firewall egress blocks on SMTP ports 25, 465, and 587, compiled PDF buffers are Base64-encoded and dispatched over secure HTTPS (port 443) through an authorized Google Apps Script proxy communicating directly with the Google Mail API.

Furthermore, the platform features a dedicated on-site Registration Desk terminal with 6-box temporary password authentication and real-time roll number search, an executive Event Messaging Studio with multi-group audience targeting and locked institutional letterhead branding, a public dynamic credential verification portal (`/verify`) that renders certificates on the fly in responsive 16:9 widescreen frames, and persistent Server-Sent Events (SSE) keep-alive channels for real-time dashboard state synchronization. Defense-in-depth security is enforced through HttpOnly SameSite=Lax JWT session cookies, Double-Submit CSRF header verification (`X-CSRF-Token`), multi-window rate limiting, and strict Role-Based Access Control (RBAC). Automated integration testing across production nodes achieves a 100% pass rate across 33 integration assertions, confirming Technology Readiness Level 6 (TRL 6) and Implementation Readiness 6 (IR 6).

#pagebreak()
#set page(numbering: "1.")

#set heading(numbering: "1.")
#show heading: it => {
  if it.level == 1 and it.numbering != none {
    align(center)[
      #text(size: 14pt, weight: "bold")[
        CHAPTER #counter(heading).get().first() \ #it.body
      ]
    ]
  } else if it.level == 1 {
    align(center)[
      #text(size: 14pt, weight: "bold")[
        #it.body
      ]
    ]
  } else if it.level >= 4 {
    text(weight: "bold", size: 12pt)[#it.body]
  } else {
    it
  }
}

#show figure: set block(breakable: true)
#show figure.where(kind: table): it => {
  set text(size: 8pt, hyphenate: true)
  set par(leading: 0.45em, justify: false)
  it
}

#align(center)[
  #text(size: 14pt, weight: "bold")[LIST OF FIGURES]
]
#v(1em)

#context {
  let entries = query(figure.where(kind: image))
  
  table(
    columns: (15%, 1fr, 12%),
    align: (center, left, center),
    table.header([*Figure*], [*Title*], [*Page*]),
    
    ..entries.map(it => {
      let body_text = if it.has("caption") { it.caption.body } else [Untitled Figure]
      
      (
        link(it.location(), [#counter(figure.where(kind: image)).at(it.location()).at(0)]), 
        link(it.location(), body_text),
        link(it.location(), [#counter(page).at(it.location()).at(0)]),
      )
    }).flatten()
  )
}

#pagebreak()
#align(center)[
  #text(size: 14pt, weight: "bold")[LIST OF TABLES]
]
#v(1em)

#context {
  let entries = query(figure.where(kind: table))
  
  table(
    columns: (15%, 1fr, 12%),
    align: (center, left, center),
    table.header([*Table No.*], [*Description*], [*Page*]),
    
    ..entries.map(it => {
      let body_text = if it.has("caption") { it.caption.body } else [Untitled Table]
      let label_num = counter(figure.where(kind: table)).at(it.location()).at(0)
      
      (
        link(it.location(), [#label_num]), 
        link(it.location(), body_text),
        link(it.location(), [#counter(page).at(it.location()).at(0)]),
      )
    }).flatten()
  )
}

#pagebreak()
#set page(numbering: "1")
#counter(page).update(1)

#set heading(numbering: "1.")

#include "chapters/ch1_introduction.typ"

#pagebreak()
#include "chapters/ch2_literature_survey.typ"

#pagebreak()
#include "chapters/ch3_dataset_analysis.typ"

#pagebreak()
#include "chapters/ch4_system_design.typ"

#pagebreak()
#include "chapters/ch5_implementation.typ"

#pagebreak()
#include "chapters/ch6_mvp.typ"

#pagebreak()
#include "chapters/ch7_testing.typ"

#pagebreak()
#include "chapters/ch8_results.typ"

#pagebreak()
#include "chapters/ch9_trl_validation.typ"

#pagebreak()
#set heading(numbering: none)

#include "chapters/conclusion.typ"

#pagebreak()
#include "chapters/future_work.typ"

#pagebreak()
#include "chapters/references.typ"

#pagebreak()
#include "chapters/annexure.typ"

