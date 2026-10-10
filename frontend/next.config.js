/** @type {import('next').NextConfig} */
const nextConfig = {
  // KasSave versi frontend-saja: hasil build berupa file statis (frontend/out)
  // yang bisa langsung ditayangkan Netlify tanpa server.
  output: 'export',
  experimental: {
    // Batasi worker build agar hemat RAM di laptop spek pas-pasan
    cpus: 1,
  },
};
module.exports = nextConfig;
