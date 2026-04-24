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
    const siteUrl  = process.env.SITE_URL;

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
    var token    = "${token}";
    var provider = "${provider}";
    var siteUrl  = "${siteUrl}";

    var message = "authorization:" + provider + ":success:"
      + JSON.stringify({ token: token, provider: provider });

    // Method 1: postMessage to opener (desktop browsers)
    function tryOpener() {
      if (window.opener) {
        window.opener.postMessage("authorizing:" + provider, "*");
        setTimeout(function () {
          window.opener.postMessage(message, siteUrl);
          setTimeout(function () { window.close(); }, 500);
        }, 300);
        return true;
      }
      return false;
    }

    // Method 2: localStorage + redirect (mobile browsers)
    function tryLocalStorage() {
      try {
        localStorage.setItem("decap-cms-auth", JSON.stringify({
          token:    token,
          provider: provider,
          ts:       Date.now()
        }));
        window.location.href = siteUrl + "/admin/";
      } catch (e) {
        document.body.innerHTML =
          "<p style='font-family:system-ui;text-align:center;margin-top:4rem;color:red'>" +
          "Auth failed. Please try again.</p>";
      }
    }

    if (!tryOpener()) {
      tryLocalStorage();
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