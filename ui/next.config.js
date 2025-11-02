/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['ipfs.io', 'gateway.pinata.cloud'],
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      // Ignore React Native packages
      '@react-native-async-storage/async-storage': false,
      'react-native': false,
    };

    // Suppress specific warnings
    config.ignoreWarnings = [
      { module: /node_modules\/@metamask\/sdk/ },
      { message: /Can't resolve 'busboy'/ },
      { message: /Can't resolve '@react-native-async-storage\/async-storage'/ },
      { message: /Caching failed for pack/ },
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
