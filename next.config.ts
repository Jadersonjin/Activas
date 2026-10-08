import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Garante que o logo vá junto no bundle da rota que gera o PDF de avarias (Vercel)
  outputFileTracingIncludes: {
    "/api/avarias/export-pdf": ["./public/logo-brasmeg.png"],
  },
};

export default nextConfig;
