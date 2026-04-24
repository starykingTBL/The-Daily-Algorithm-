export default function handler(req, res) {
  const state    = Math.random().toString(36).substring(2, 15);
  const clientId = process.env.GITHUB_CLIENT_ID;
  const siteUrl  = process.env.SITE_URL;

  if (!clientId) {
    res.status(500).send('Missing GITHUB_CLIENT_ID env var');
    return;
  }

  const params = new URLSearchParams({
    client_id:    clientId,
    redirect_uri: siteUrl + '/api/callback',
    scope:        'repo,user',
    state:        state,
  });

  res.redirect(302, 'https://github.com/login/oauth/authorize?' + params.toString());
}