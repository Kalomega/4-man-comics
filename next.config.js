module.exports = {
  async rewrites() {
    return [
      { source: '/', destination: '/index.html' },
      { source: '/play/:token', destination: '/play.html' },
      { source: '/comic/:id', destination: '/comic.html' },
      { source: '/dashboard', destination: '/dashboard.html' },
    ];
  },
};
