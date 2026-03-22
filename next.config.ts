const nextConfig = {
  async headers() {
    return [
      {
        source: '/map/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ]
  },
}
export default nextConfig
