export default function handler(req, res) {
  const params = new URLSearchParams({
    client_id: process.env.Ov23lih2FcpzGEUAFncb,
    redirect_uri: `${process.env.SITE_URL}/api/callback`,
    scope: 'repo,user',
    state: Math.random().toString(36).slice(2),
  });

  res.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );
}