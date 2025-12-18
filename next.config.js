/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.NEXT_PUBLIC_APP_BASE_URL_PATH,
  productionBrowserSourceMaps: false, // enable browser source map generation during the production build
  // Configure pageExtensions to include md and mdx
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  experimental: {
    // appDir: true,
  },
  // fix all before production. Now it slow the develop speed.
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // https://nextjs.org/docs/api-reference/next.config.js/ignoring-typescript-errors
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
