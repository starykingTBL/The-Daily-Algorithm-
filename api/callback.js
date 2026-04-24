export default async function handler(req, res) {
  const code     = req.query && req.query.code;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const secret   = process.env.GITHUB_CLIENT_SECRET;
  const siteUrl  = process.env.SITE_URL;

  if (!code) {
    res.status(400).send('Missing code');
    return;
  }

  if (!clientId || !secret) {
    res.status(500).send('Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET in Vercel env vars');
    return;
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept':       'application/json',
      },
      body: JSON.stringify({
        client_id:     clientId,
        client_secret: secret,
        code:          code,
      }),
    });

    const data = await response.json();

    if (!data.access_token) {
      res.status(400).send('No token returned: ' + JSON.stringify(data));
      return;
    }

    res.redirect(302,
      siteUrl + '/admin/#access_token=' + data.access_token + '&token_type=bearer&provider=github'
    );

  } catch (err) {
    res.status(500).send('Fetch error: ' + err.message);
  }
}