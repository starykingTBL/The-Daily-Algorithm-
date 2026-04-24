module.exports = function handler(req, res) {
  const state = Math.random().toString(36).substring(2, 15);

  const params = new URLSearchParams({
    client_id:    process.env.GITHUB_CLIENT_ID,
    redirect_uri: `${process.env.SITE_URL}/api/callback`,
    scope:        'repo,user',
    state:        state,
  });

  res.redirect(302,
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );
};