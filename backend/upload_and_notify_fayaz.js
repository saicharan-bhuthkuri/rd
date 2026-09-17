const fs = require('fs');
const path = require('path');
const { createClient } = require('@libsql/client');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const turso = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_TOKEN
});

const PROXY_URL = process.env.DRIVE_UPLOAD_PROXY_URL || 'https://script.google.com/macros/s/AKfycbzo4grUGKumfJ1CJpWXaD3IOjUooel7msY-yAN7sVmeOtH_QJ9dnX4gwGiGwwB_KMFX/exec';

async function main() {
  console.log("1. Finding submission 1 / TCEK/SUB/2026/0001 in Turso DB...");
  const subRes = await turso.execute({
    sql: `SELECT * FROM project_submissions ORDER BY id ASC LIMIT 5`
  });
  console.log("Current submissions in DB:", subRes.rows.map(r => ({ id: r.id, team: r.team_name, event: r.event_name, drive_url: r.drive_file_url })));

  const submission = subRes.rows.find(r => r.id === 1 || r.team_name === 'Miaow Trinity');
  if (!submission) {
    console.error("Submission not found!");
    return;
  }

  console.log("Found submission:", submission.id, submission.team_name, submission.event_name);

  // 2. Read local PDF
  const localFilePath = path.join(__dirname, 'uploads', 'submissions', 'Aarogya_Sentinel_SIH2026_Idea_Presentation_Updated (1).pptx.pdf');
  if (!fs.existsSync(localFilePath)) {
    console.error("Local file does not exist:", localFilePath);
    return;
  }

  const fileBytes = fs.readFileSync(localFilePath);
  const fileBase64 = fileBytes.toString('base64');
  console.log(`Read ${fileBytes.length} bytes from local file. Base64 length: ${fileBase64.length}`);

  // 3. Upload to Google Drive via Apps Script proxy
  console.log("Uploading presentation to Google Drive via Apps Script...");
  const uploadRes = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'upload_presentation',
      eventName: submission.event_name || 'SIH 2026 Internal Hackathon',
      teamFolderName: `Team ${submission.team_name}`,
      fileName: 'Aarogya_Sentinel_SIH2026_Idea_Presentation.pdf',
      fileBase64: fileBase64,
      mimeType: 'application/pdf'
    }),
    redirect: 'follow'
  });

  const uploadResult = await uploadRes.json();
  console.log("Drive upload result:", uploadResult);

  if (!uploadResult.success || !uploadResult.fileUrl) {
    console.error("Drive upload failed:", uploadResult);
    return;
  }

  // 4. Update DB with real Drive file and folder URLs
  console.log("Updating Turso DB with real Google Drive URLs...");
  await turso.execute({
    sql: `UPDATE project_submissions 
          SET drive_file_id = ?, drive_file_url = ?, drive_folder_id = ?, drive_folder_url = ?, file_name = ?
          WHERE id = ?`,
    args: [
      uploadResult.fileId,
      uploadResult.fileUrl,
      uploadResult.folderId,
      uploadResult.folderUrl,
      'Aarogya_Sentinel_SIH2026_Idea_Presentation.pdf',
      submission.id
    ]
  });
  console.log("Database updated successfully!");

  // 5. Send confirmation email to Fayaz
  console.log("Sending confirmation email with Drive link to mdfayaz9963@gmail.com...");
  const emailPayload = {
    action: 'send_email',
    to: 'mdfayaz9963@gmail.com',
    subject: `Project Submission Confirmed: Team ${submission.team_name} – ${submission.event_name}`,
    body: `Dear Mohammed Fayaz,

Your project submission for "${submission.event_name}" at Trinity College of Engineering & Technology has been received and confirmed.

Registration Summary:
- Reference ID: TCEK/SUB/2026/0001
- Event Name: ${submission.event_name}
- Registered Team Name: ${submission.team_name}
- Team Leader: Mohammed Fayaz (9963098528)
- Institution: Trinity College of Engineering & Technology
- Project Title: ${submission.project_title || 'Aarogya Sentinel'}
- Uploaded Presentation: Aarogya_Sentinel_SIH2026_Idea_Presentation.pdf (Saved to Google Drive)
- Google Drive Repository: ${uploadResult.fileUrl}

Official Google Drive Repository:
Your presentation has been uploaded and registered directly into the event Google Drive repository. The evaluation panel will review your submission based on the official guidelines.

Google Drive Link:
${uploadResult.fileUrl}

With best wishes,
Research & Development (R&D) Cell
Trinity College of Engineering & Technology (Autonomous), Peddapalli`,
    htmlBody: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #059669; margin: 0; font-size: 22px; font-weight: 700;">Trinity College of Engineering & Technology</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">(An Autonomous Institution) • Research & Development (R&D) Cell</p>
        </div>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <div style="font-size: 16px; font-weight: 700; color: #15803d; margin-bottom: 4px;">✓ Project Submission Confirmed</div>
          <div style="font-size: 13px; color: #166534;">Reference ID: <strong>TCEK/SUB/2026/0001</strong></div>
        </div>

        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
          Dear <strong>Mohammed Fayaz</strong>,<br/>
          Thank you for submitting your project. Your presentation has been successfully stored directly into the event's official <strong>Google Drive repository</strong>.
        </p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tbody>
            <tr>
              <td style="padding: 8px 12px; font-weight: 600; color: #475569; width: 35%; border-bottom: 1px solid #f1f5f9;">Event Name</td>
              <td style="padding: 8px 12px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${submission.event_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Registered Team</td>
              <td style="padding: 8px 12px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${submission.team_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Team Leader</td>
              <td style="padding: 8px 12px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">Mohammed Fayaz (9963098528)</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Project Title</td>
              <td style="padding: 8px 12px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${submission.project_title || 'Aarogya Sentinel'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Presentation File</td>
              <td style="padding: 8px 12px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">Aarogya_Sentinel_SIH2026_Idea_Presentation.pdf (Saved to Google Drive)</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Drive Repository</td>
              <td style="padding: 8px 12px; color: #059669; font-weight: 600; border-bottom: 1px solid #f1f5f9;"><a href="${uploadResult.fileUrl}" target="_blank" style="color: #059669;">Open File in Google Drive</a></td>
            </tr>
          </tbody>
        </table>

        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 16px; margin: 20px 0;">
          <div style="font-weight: 700; color: #1e40af; font-size: 13px; margin-bottom: 4px;">Official Google Drive Repository</div>
          <div style="font-size: 13px; color: #1e3a8a; line-height: 1.5;">Your presentation is now archived in your team's dedicated Google Drive folder for the evaluation committee.</div>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${uploadResult.fileUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
            View Presentation in Google Drive
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

        <div style="color: #64748b; font-size: 12px; line-height: 1.5;">
          <p style="margin: 0 0 4px 0;"><strong>Research & Development (R&D) Cell</strong></p>
          <p style="margin: 0 0 4px 0;">Trinity College of Engineering & Technology (Autonomous), Peddapalli</p>
          <p style="margin: 0;">Official Portal: <a href="https://tcek-rd.web.app" style="color: #059669;">https://tcek-rd.web.app</a></p>
        </div>
      </div>
    `
  };

  const mailRes = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emailPayload),
    redirect: 'follow'
  });

  const mailData = await mailRes.json();
  console.log("Email dispatch result:", mailData);
  console.log("\nALL TASKS COMPLETED FOR SUBMISSION 1!");
}

main().catch(err => console.error("Error in sync script:", err));
