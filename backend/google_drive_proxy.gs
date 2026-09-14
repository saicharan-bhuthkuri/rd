/**
 * Google Apps Script Proxy for TCEK R&D Cell
 * 
 * Supports:
 * 1. Email delivery via MailApp with attachments (bypassing Render SMTP port locks)
 * 2. Automatic Google Drive organization and file upload for Project Submissions
 * 
 * Deployment:
 * 1. Open https://script.google.com/
 * 2. Paste this code into Code.gs
 * 3. Deploy > New Deployment (or Manage Deployments > Edit > New Version)
 *    - Type: Web App
 *    - Execute as: Me (tcekrdcell@gmail.com)
 *    - Who has access: Anyone
 * 4. Copy the Web App URL and set as GMAIL_HTTP_PROXY_URL in .env
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Empty request payload' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);

    // ==========================================
    // ACTION: UPLOAD PRESENTATION TO GOOGLE DRIVE
    // ==========================================
    if (data.action === 'upload_presentation' || data.action === 'upload_to_drive') {
      var eventName = data.eventName || 'R&D Cell Hackathons';
      var teamFolderName = data.teamFolderName || 'Team Submission';
      var fileName = data.fileName || 'Presentation.pdf';
      var fileBase64 = data.fileBase64;
      var mimeType = data.mimeType || 'application/pdf';

      if (!fileBase64) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'fileBase64 is required for upload' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      // 1. Root folder for all R&D submissions
      var rootFolderName = 'R&D Cell - Project Submissions';
      var rootFolders = DriveApp.getFoldersByName(rootFolderName);
      var rootFolder;
      if (rootFolders.hasNext()) {
        rootFolder = rootFolders.next();
      } else {
        rootFolder = DriveApp.createFolder(rootFolderName);
      }

      // 2. Event folder inside Root folder
      var eventFolders = rootFolder.getFoldersByName(eventName);
      var eventFolder;
      if (eventFolders.hasNext()) {
        eventFolder = eventFolders.next();
      } else {
        eventFolder = rootFolder.createFolder(eventName);
      }

      // 3. Team folder inside Event folder (e.g., "Team 01 – Tech Twins")
      var teamFolders = eventFolder.getFoldersByName(teamFolderName);
      var teamFolder;
      if (teamFolders.hasNext()) {
        teamFolder = teamFolders.next();
      } else {
        teamFolder = eventFolder.createFolder(teamFolderName);
      }

      // 4. Create presentation file inside Team folder
      var rawBase64 = fileBase64.indexOf('base64,') > -1 ? fileBase64.split('base64,')[1] : fileBase64;
      var fileBytes = Utilities.base64Decode(rawBase64);
      var fileBlob = Utilities.newBlob(fileBytes, mimeType, fileName);
      var createdFile = teamFolder.createFile(fileBlob);

      // 5. Set sharing permission to anyone with link (view only)
      try {
        createdFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        teamFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        eventFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        rootFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (permErr) {
        Logger.log('Sharing permission notice: ' + permErr.message);
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        fileId: createdFile.getId(),
        fileUrl: createdFile.getUrl(),
        folderId: teamFolder.getId(),
        folderUrl: teamFolder.getUrl(),
        eventFolderUrl: eventFolder.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // DEFAULT ACTION: EMAIL DISPATCH VIA MAILAPP
    // ==========================================
    var attachments = (data.attachments || []).map(function(att) {
      return Utilities.newBlob(
        Utilities.base64Decode(att.base64), 
        att.mimeType || 'application/pdf', 
        att.filename || 'attachment.pdf'
      );
    });

    MailApp.sendEmail({
      to: data.to,
      subject: data.subject,
      body: data.text || "",
      htmlBody: data.html,
      attachments: attachments
    });

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
