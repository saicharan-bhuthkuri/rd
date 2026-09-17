async function testEmail() {
  const url = process.env.GMAIL_HTTP_PROXY_URL ? process.env.GMAIL_HTTP_PROXY_URL.split(',')[0].trim() : 'https://script.google.com/macros/s/AKfycbygAq0eTP3EPLzc4mRNJWleiQO7AIftKRQYaRTMZkYwlrym175XxDq6n2VgFBtEjjrBQQ/exec';
  const target = 'mdfayaz9963@gmail.com';
  console.log(`Testing email dispatch to ${target}...`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: target,
        subject: 'Test TCEK R&D Confirmation Delivery',
        text: 'This is a test to verify delivery to registered address.',
        html: '<p>This is a test to verify delivery to registered address.</p>'
      })
    });
    console.log("Status:", res.status);
    const body = await res.text();
    console.log("Response body:", body);
  } catch (err) {
    console.error("Error:", err);
  }
}
testEmail();
