/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
      },
    ],
    unoptimized: true,
  },
  serverExternalPackages: ['better-sqlite3'],
  turbopack: {},
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      // Ignore React Native packages
      '@react-native-async-storage/async-storage': false,
      'react-native': false,
    };

    // Suppress specific warnings and errors
    config.ignoreWarnings = [
      { module: /node_modules\/@metamask\/sdk/ },
      { message: /Can't resolve 'busboy'/ },
      { message: /Can't resolve '@react-native-async-storage\/async-storage'/ },
      { message: /Caching failed for pack/ },
      { message: /Module not found.*test\.js/ },
      { message: /Can't resolve 'tap'/ },
      { message: /Can't resolve 'tape'/ },
      { message: /Can't resolve 'why-is-node-running'/ },
    ];

    return config;
  },
  // Allow cross-origin requests for development
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
