import type { Metadata, Viewport } from 'next';
import { db } from '@/lib/db';
import { launchState } from '@/lib/commerce';
import { site } from '@/lib/site';
import { StoreProvider } from '@/components/store-provider';
import { Shell } from '@/components/shell';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: 'Maithilok | Cow & Buffalo Ghee from Darbhanga, Mithila',
    template: '%s | Maithilok',
  },
  description:
    'Maithilok brings cow ghee and buffalo ghee from Darbhanga, Bihar to homes across India. Shop 500g and 1kg jars online with secure payment.',
  keywords: ['ghee', 'cow ghee', 'buffalo ghee', 'Darbhanga', 'Mithila', 'Bihar', 'Maithilok'],
  openGraph: {
    type: 'website',
    siteName: 'Maithilok',
    locale: 'en_IN',
    images: [{ url: '/banners/og-image.jpg', width: 1200, height: 630, alt: 'Maithilok ghee' }],
  },
  twitter: { card: 'summary_large_image', images: ['/banners/og-image.jpg'] },
  icons: {
    icon: [{ url: '/icons/favicon.svg', type: 'image/svg+xml' }, { url: '/icons/icon-192.png' }],
    apple: '/icons/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
  robots: { index: !site.url.includes('localhost'), follow: true },
};
export const viewport: Viewport = { themeColor: '#173f35' };
const organization = {
  '@context': 'https://schema.org',
  '@type': 'OnlineStore',
  name: site.name,
  url: site.url,
  logo: `${site.url}/icons/icon-512.png`,
  email: site.email,
  telephone: site.phone,
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.address.line1,
    addressLocality: site.address.city,
    addressRegion: site.address.state,
    postalCode: site.address.pin,
    addressCountry: 'IN',
  },
};
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [setting, launch] = await Promise.all([
    db.setting.findUnique({ where: { key: 'content' } }),
    launchState().catch(() => ({ ready: false })),
  ]);
  const content = (setting?.value as Record<string, string>) || {};
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organization).replaceAll('<', '\\u003c'),
          }}
        />
        <StoreProvider live={launch.ready}>
          <Shell
            announcement={
              content.announcement || 'From Darbhanga, Mithila · Delivering across India'
            }
          >
            {children}
          </Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
