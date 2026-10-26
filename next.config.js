const fresh = ['shell.js', 'studio.js', 'home.js', 'comic.js', 'dash.js', 'friends.js', 'studio.css'];
module.exports = {
  async headers() {
    return fresh.map((f) => ({ source: '/' + f, headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }] }));
  },
  async rewrites() {
    return [
      { source: '/', destination: '/index.html' },
      { source: '/play/:token', destination: '/play.html' },
      { source: '/comic/:id', destination: '/comic.html' },
      { source: '/privacy', destination: '/privacy.html' },
      { source: '/terms', destination: '/terms.html' },
      { source: '/friends', destination: '/friends.html' },
      { source: '/dashboard', destination: '/dashboard.html' },
    ];
  },
};
