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
          client_id:     process.env.Ov23lih2FcpzGEUAFncb,
          client_secret: process.env.9a4782fee1e66daa921c139a9a979fb7ffc04c61,
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

    // This page sends the token back to Decap CMS via postMessage
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
    // Send token to the opener (Decap CMS window)
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

    // Decap sends a "ping" first, we reply with the token
    window.addEventListener("message", function (e) {
      if (e.data === "authorizing:${provider}") {
        sendToken();
      }
    }, false);

    // Also try immediately in case the ping already came
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