/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export -> 100% client-side, perfect for a localStorage-only demo
  // and trivially deployable on Netlify (publish dir: "out").
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
