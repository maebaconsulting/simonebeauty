import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development warnings
  reactStrictMode: true,

  // Optimize image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Optimize package imports to reduce bundle size
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      skipDefaultConversion: true,
    },
  },

  // Development optimizations
  ...(process.env.NODE_ENV === 'development' && {
    // Optimize file watching for better performance and cache stability
    webpack: (config) => {
      config.watchOptions = {
        poll: 3000, // Increased from 1000ms to reduce file system load
        aggregateTimeout: 600, // Increased from 300ms to batch changes better
        ignored: [
          '**/node_modules',
          '**/.git',
          '**/.next',
          '**/public',
          '**/.specify',
          '**/specs',
          '**/docs',
          '**/__tests__',
          '**/supabase/functions',
          '**/.claude',
          '**/legacy',
          '**/*.md',
          '**/.bin',
        ],
      }
      return config
    },

    // Reduce memory usage in development
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
  }),
}

export default withNextIntl(nextConfig)
