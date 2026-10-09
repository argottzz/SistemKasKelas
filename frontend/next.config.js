/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Batasi worker build agar hemat RAM di laptop spek pas-pasan
    cpus: 1,
  },
};
module.exports = nextConfig;
