import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Maithilok · मैथिल लोक',
    short_name: 'Maithilok',
    description: 'Cow and buffalo ghee from Darbhanga, Mithila.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fbf9f3',
    theme_color: '#173f35',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
