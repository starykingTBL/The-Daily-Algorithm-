const https = require('https');

module.exports = function handler(req, res) {
  const code     = req.query && req.query.code;
  const siteUrl  = process.env.SITE_URL  || 'https://the-daily-algorithm.vercel.app';
  const clientId = process.env.GITHUB_CLIENT_ID;
  const secret   = process.env.GITHUB_CLIENT_SECRET;

  if (!code) {
    res.status(400).send('Missing code');
    return;
  }

  if (!clientId || !secret) {
    res.status(500).send('Missing env vars: GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET');
    return;
  }

  const body = JSON.stringify({ client_id: clientId, client_secret: secret, code: code });

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

  const request = https.request(options, function (response) {
    let data = '';
    response.on('data', function (chunk) { data += chunk; });
    response.on('end', function () {
      let parsed;
      try { parsed = JSON.parse(data); } catch (e) {
        res.status(500).send('Bad response from GitHub: ' + data);
        return;
      }

      if (!parsed.access_token) {
        res.status(400).send('No token: ' + JSON.stringify(parsed));
        return;
      }

      res.redirect(302,
        siteUrl + '/admin/#access_token=' + parsed.access_token + '&token_type=bearer&provider=github'
      );
    });
  });

  request.on('error', function (err) {
    res.status(500).send('Request error: ' + err.message);
  });

  request.write(body);
  request.end();
};