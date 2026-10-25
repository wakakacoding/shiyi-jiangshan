import type { NextConfig } from "next";

const repoName = "shiyi-jiangshan";
const isPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    unoptimized: isPages,
  },
  ...(isPages ? { output: "export" as const, basePath: `/${repoName}`, assetPrefix: `/${repoName}` } : {}),
};

export default nextConfig;
