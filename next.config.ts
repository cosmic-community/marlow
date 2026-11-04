import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  serverExternalPackages: ['@conciergeprotocol/server'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'Link', value: '</agent.txt>; rel="agent"' }],
      },
    ]
  },
}

export default nextConfig
