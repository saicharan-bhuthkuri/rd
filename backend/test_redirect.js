async function testRedirectBehavior() {
  const url = process.env.GMAIL_HTTP_PROXY_URL ? process.env.GMAIL_HTTP_PROXY_URL.split(',')[0].trim() : 'https://script.google.com/macros/s/AKfycbygAq0eTP3EPLzc4mRNJWleiQO7AIftKRQYaRTMZkYwlrym175XxDq6n2VgFBtEjjrBQQ/exec';

  console.log("=== Testing with redirect: 'follow' ===");
  try {
    const res1 = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'mdfayaz9963@gmail.com',
        subject: 'Test Redirect 1',
        text: 'Test redirect follow'
      }),
      redirect: 'follow'
    });
    console.log("Status with follow:", res1.status, "URL:", res1.url);
    const t1 = await res1.text();
    console.log("Response 1 (first 200 chars):", t1.slice(0, 200));
  } catch (e) {
    console.error("Error 1:", e.message);
  }

  console.log("\n=== Testing with manual redirect handling ===");
  try {
    const res2 = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'mdfayaz9963@gmail.com',
        subject: 'Test Redirect 2',
        text: 'Test manual redirect'
      }),
      redirect: 'manual'
    });
    console.log("Manual status:", res2.status);
    console.log("Location header:", res2.headers.get('location'));
  } catch (e) {
    console.error("Error 2:", e.message);
  }
}

testRedirectBehavior();
