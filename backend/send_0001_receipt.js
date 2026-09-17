async function sendSubmissionReceipt() {
  const url = process.env.GMAIL_HTTP_PROXY_URL ? process.env.GMAIL_HTTP_PROXY_URL.split(',')[0].trim() : 'https://script.google.com/macros/s/AKfycbygAq0eTP3EPLzc4mRNJWleiQO7AIftKRQYaRTMZkYwlrym175XxDq6n2VgFBtEjjrBQQ/exec';
  const to = 'mdfayaz9963@gmail.com';
  const subject = 'Project Submission Confirmation | Team Miaow Trinity – SIH 2026 Internal Hackathon';
  
  const text = `Dear Mohammad Fayaz,

Thank you for submitting your project documentation and presentation for SIH 2026 Internal Hackathon.

Submission Summary:
- Submission ID: TCEK/SUB/2026/0001
- Team Name: Miaow Trinity
- Project Title: Offline Edge-AI Personal Health Companion
- File Uploaded: Aarogya_Sentinel_SIH2026_Idea_Presentation_Updated (1).pptx.pdf

Your submission has been officially registered with the R&D Cell.

With best wishes,
Research & Development (R&D) Cell
Trinity College of Engineering & Technology (Autonomous), Peddapalli`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #059669; margin: 0; font-size: 22px; font-weight: 700;">Trinity College of Engineering & Technology</h2>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">(An Autonomous Institution) • Research & Development (R&D) Cell</p>
      </div>

      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <div style="font-size: 16px; font-weight: 700; color: #15803d; margin-bottom: 4px;">✓ Project Submission Confirmed</div>
        <div style="font-size: 13px; color: #166534;">Submission Reference ID: <strong>TCEK/SUB/2026/0001</strong></div>
      </div>

      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
        Dear <strong>Mohammad Fayaz</strong>,<br/>
        Thank you for submitting your project presentation and technical documentation for <strong>SIH 2026 Internal Hackathon</strong>. Your submission has been officially received.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
        <tbody>
          <tr>
            <td style="padding: 8px 12px; font-weight: 600; color: #475569; width: 35%; border-bottom: 1px solid #f1f5f9;">Event Name</td>
            <td style="padding: 8px 12px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">SIH 2026 Internal Hackathon</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Registered Team Name</td>
            <td style="padding: 8px 12px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">Miaow Trinity</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Team Leader</td>
            <td style="padding: 8px 12px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">Mohammad Fayaz (+91 93477 38882)</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Project Title</td>
            <td style="padding: 8px 12px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">Offline Edge-AI Personal Health Companion</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Presentation File</td>
            <td style="padding: 8px 12px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">Aarogya_Sentinel_SIH2026_Idea_Presentation_Updated (1).pptx.pdf</td>
          </tr>
        </tbody>
      </table>

      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 16px; margin: 20px 0;">
        <div style="font-weight: 700; color: #1e40af; font-size: 13px; margin-bottom: 4px;">Evaluation Process Notice</div>
        <div style="color: #1e3a8a; font-size: 13px; line-height: 1.5;">Your presentation has been registered with the evaluation committee. The jury panel will review the technical architecture, problem statement, and solution feasibility according to institutional guidelines.</div>
      </div>

      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0; line-height: 1.4;">
        Research & Development (R&D) Cell<br/>
        Trinity College of Engineering & Technology, Peddapalli, Telangana 505172<br/>
        © 2026 R&D Cell TCEK. All rights reserved.
      </p>
    </div>
  `;

  console.log("Sending submission confirmation email to:", to);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to,
      subject,
      text,
      html
    })
  });
  console.log("Status:", res.status);
  const result = await res.text();
  console.log("Response:", result);
}

sendSubmissionReceipt();
