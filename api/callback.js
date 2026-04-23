export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Missing code');
  }

  const response = await fetch(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id:     process.env.Ov23lih2FcpzGEUAFncb,
        client_secret: process.env.4ecc3dc460c0cc6ebbdc53a3739626d223662226,
        code,
      }),
    }
  );

  const data = await response.json();

  if (data.error) {
    return res.status(400).send(`GitHub error: ${data.error_description}`);
  }

  // Post the token back to Decap CMS via postMessage
  const script = `
    <script>
      (function() {
        function receiveMessage(e) {
          console.log("receiveMessage %o", e);
          window.opener.postMessage(
            'authorization:github:success:${JSON.stringify({ token: data.access_token, provider: 'github' })}',
            e.origin
          );
        }
        window.addEventListener("message", receiveMessage, false);
        window.opener.postMessage("authorizing:github", "*");
      })()
    <\/script>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(`<!doctype html><html><body>${script}</body></html>`);
}