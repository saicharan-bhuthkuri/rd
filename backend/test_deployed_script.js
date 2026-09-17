async function testDeployedProxy() {
  const url = process.env.DRIVE_UPLOAD_PROXY_URL || 'https://script.google.com/macros/s/AKfycbzo4grUGKumfJ1CJpWXaD3IOjUooel7msY-yAN7sVmeOtH_QJ9dnX4gwGiGwwB_KMFX/exec';
  
  console.log("1. Testing GET on deployed proxy...");
  try {
    const getRes = await fetch(url, { redirect: 'follow' });
    console.log("GET status:", getRes.status);
    const getText = await getRes.text();
    console.log("GET response:", getText);
  } catch (err) {
    console.error("GET error:", err.message);
  }

  console.log("\n2. Testing Drive upload action on deployed proxy...");
  try {
    const dummyBase64 = Buffer.from('Testing Google Drive Folder Creation and File Upload for TCEK R&D Cell').toString('base64');
    const driveRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'upload_presentation',
        eventName: 'SIH 2026 Internal Hackathon',
        teamFolderName: 'Team 01 – Miaow Trinity',
        fileName: 'Aarogya_Sentinel_Presentation_Verified.pdf',
        fileBase64: dummyBase64,
        mimeType: 'application/pdf'
      }),
      redirect: 'follow'
    });
    console.log("Drive upload status:", driveRes.status);
    const driveData = await driveRes.text();
    console.log("Drive upload response:", driveData);
  } catch (err) {
    console.error("Drive upload error:", err.message);
  }
}

testDeployedProxy();
