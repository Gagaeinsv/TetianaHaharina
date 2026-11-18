/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    '/api/**/*': ['./prisma/dev.db'],
    '/*': ['./prisma/dev.db'],
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
