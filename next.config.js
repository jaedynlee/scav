/** @type {import('next').NextConfig} */
const nextConfig = {
    // Only static export in CI (e.g. GitHub Pages). Local dev can use proxy.
    ...(process.env.ENABLE_STATIC_EXPORT === "true" ? { output: "export" } : {}),
    // Use /scav basePath only when building for deployment (e.g. GitHub Pages). Local dev serves at root.
    ...(process.env.ENABLE_STATIC_EXPORT === "true" ? { basePath: "/scav" } : {}),
    images: {
        unoptimized: true,
    },
};

export default nextConfig;
