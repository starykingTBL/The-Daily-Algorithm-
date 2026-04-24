const https = require('https');

module.exports = async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Missing authorization code.');
  }

  try {
    const token = await getToken(code);

    const siteUrl = process.env.SITE_URL;

    return res.redirect(302,
      `${siteUrl}/admin/#access_token=${token}&token_type=bearer&provider=github`
    );

  } catch (err) {
    return res.status(500).send(`Error: ${err.message}`);
  }
};

function getToken(code) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      client_id:     process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    });

    const options = {
      hostname: 'github.com',
      path:     '/login/oauth/access_token',
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Accept':         'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error || !parsed.access_token) {
            reject(new Error(parsed.error_description || 'No token returned'));
          } else {
            resolve(parsed.access_token);
          }
        } catch (e) {
          reject(new Error('Failed to parse GitHub response'));
        }
      });
    });

    request.on('error', reject);
    request.write(body);
    request.end();
  });
}