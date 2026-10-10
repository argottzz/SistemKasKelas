/** @type {import('next').NextConfig} */
const nextConfig = {
  // KasSave fullstack ala ReBites: halaman + API routes dalam satu deploy Netlify
  // (via @netlify/plugin-nextjs). BUKAN static export lagi.
  experimental: {
    // Batasi worker build agar hemat RAM di laptop spek pas-pasan
    cpus: 1,
  },
};
module.exports = nextConfig;
