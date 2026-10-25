module.exports = {
  async rewrites() {
    return [
      { source: '/', destination: '/index.html' },
      { source: '/play/:token', destination: '/play.html' },
      { source: '/comic/:id', destination: '/comic.html' },
      { source: '/privacy', destination: '/privacy.html' },
      { source: '/terms', destination: '/terms.html' },
      { source: '/dashboard', destination: '/dashboard.html' },
    ];
  },
};
