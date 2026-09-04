import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // El contenedor de dependencias y Prisma solo deben vivir en el servidor.
    serverActions: { bodySizeLimit: '2mb' },
  },
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
