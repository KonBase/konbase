/** @type {import('next').NextConfig} */
const nextConfig = {  
  // Enable React Strict Mode for development
  reactStrictMode: true,

  // ESLint configuration
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
  
  // TypeScript configuration
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false,
  },

  // Enable experimental features for better compatibility
  experimental: {
    // Server actions are enabled by default in Next.js 15
  },
  
  // Asset optimization
  images: {
    domains: ['localhost'],
    // Add your Supabase storage domain here
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Headers for security and cache control
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Add cache control headers to prevent stale chunks
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
      // Add specific cache control for JavaScript chunks
      {
        source: '/_next/static/chunks/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Webpack configuration for compatibility
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add any custom webpack configuration here
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };
    
    // Suppress critical dependency warnings from Supabase realtime client
    config.module.exprContextCritical = false;
    config.module.unknownContextCritical = false;
    
    // Add specific rules to ignore warnings from Supabase realtime
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
      /Module not found: Can't resolve 'bufferutil'/,
      /Module not found: Can't resolve 'utf-8-validate'/,
    ];
    
    // Fix for WebSocket mask function error in Supabase realtime
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'ws': false,
        'bufferutil': false,
        'utf-8-validate': false,
      };
      
      // Ignore problematic modules that cause mask function errors
      config.externals = config.externals || [];
      config.externals.push({
        'bufferutil': 'bufferutil',
        'utf-8-validate': 'utf-8-validate',
      });
    }
    
    // Add version query parameter to chunk loading URLs in production
    if (!dev) {
      // Use buildId as version to ensure uniqueness with each build
      config.output.chunkLoadingGlobal = `webpackChunk_${buildId}`;
      
      // Increase chunk loading timeout to prevent ChunkLoadError
      config.output.chunkLoadTimeout = 60000; // 60 seconds instead of default 120s
    }
    
    return config;
  },
  
  // Output configuration for deployment
  output: 'standalone',
  
  // Redirects for migration compatibility
  async redirects() {
    return [
      // Add any URL redirects needed during migration
    ];
  },
  

};

export default nextConfig;
