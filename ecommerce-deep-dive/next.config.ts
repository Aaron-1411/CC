import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['docx', 'pptxgenjs', '@google/generative-ai'],
};

export default nextConfig;
