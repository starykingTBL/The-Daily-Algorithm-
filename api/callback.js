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

    // Redirect to /admin/ with token in the URL hash
    // Decap reads window.location.hash natively
    const siteUrl = process.env.SITE_URL;
    const token   = tokenData.access_token;

    return res.redirect(302,
      `${siteUrl}/admin/#access_token=${token}&token_type=bearer&provider=github`
    );

  } catch (err) {
    return res.status(500).send(`Server error: ${err.message}`);
  }