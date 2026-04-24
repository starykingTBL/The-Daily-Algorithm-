export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Missing authorization code.');
  }

  try {
    const tokenRes = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id:     process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      }
    );

    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      return res.status(400).send(
        `GitHub OAuth error: ${tokenData.error_description || 'No token returned.'}`
      );
    }

    const token    = tokenData.access_token;
    const provider = 'github';
    const siteUrl  = process.env.SITE_URL;

    // Store token in localStorage then redirect to /admin/
    const html = `<!doctype html>
<html>
<head><title>Authenticating…</title></head>
<body>
<p style="font-family:system-ui;font-size:14px;text-align:center;margin-top:4rem;color:#666">
  Logging you in…
</p>
<script>
  (function() {
    try {
      localStorage.setItem('decap-cms-auth', JSON.stringify({
        token:    '${token}',
        provider: '${provider}',
        ts:       ${Date.now()}
      }));
      window.location.replace('${siteUrl}/admin/');
    } catch(e) {
      document.body.innerHTML =
        '<p style="font-family:system-ui;text-align:center;margin-top:4rem;color:red">' +
        'Storage blocked. Please enable cookies/storage for this site.</p>';
    }
  })();
<\/script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);

  } catch (err) {
    return res.status(500).send(`Server error: ${err.message}`);
  }
}