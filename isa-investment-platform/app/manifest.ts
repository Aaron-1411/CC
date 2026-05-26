import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ISA Fund Manager',
    short_name: 'ISA Platform',
    description: 'UK Stocks & Shares ISA investment management platform',
    start_url: '/',
    display: 'standalone',
    background_color: '#080c14',
    theme_color: '#080c14',
    icons: [
      { src: '/favicon.ico', sizes: '256x256', type: 'image/x-icon' },
    ],
  };
}
