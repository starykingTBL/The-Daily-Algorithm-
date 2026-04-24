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
          'Accept':       'application/json',
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

    const html = `
<!doctype html>
<html>
<head><title>Authenticating…</title></head>
<body>
<p style="font-family:system-ui;text-align:center;margin-top:4rem;color:#555">
  Completing login, please wait…
</p>
<script>
  (function () {
    function sendToken() {
      var message = JSON.stringify({
        token:    "${token}",
        provider: "${provider}"
      });
      if (window.opener) {
        window.opener.postMessage(
          "authorization:${provider}:success:" + message,
          "${process.env.SITE_URL}"
        );
      }
    }

    window.addEventListener("message", function (e) {
      if (e.data === "authorizing:${provider}") {
        sendToken();
      }
    }, false);

    if (window.opener) {
      window.opener.postMessage("authorizing:${provider}", "*");
      setTimeout(sendToken, 500);
    } else {
      document.body.innerHTML =
        "<p style='font-family:system-ui;text-align:center;margin-top:4rem'>"+
        "Auth complete. You can close this tab and return to the CMS.</p>";
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