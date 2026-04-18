/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // jsPDF uses fflate which spawns Node.js workers — prevent it from being
  // bundled for the server context (it's browser-only at runtime anyway).
  serverExternalPackages: ['jspdf', 'jspdf-autotable', 'fflate'],
}

export default nextConfig
