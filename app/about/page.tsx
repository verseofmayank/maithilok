import type { Metadata } from 'next';
import { About } from '@/components/about';
import { publicSetting } from '@/lib/storefront';

export const revalidate = 300;
const title = 'About Us';
const description =
  'The story of Maithilok: a ghee brand from Darbhanga, Bihar, rooted in the food traditions of Mithila.';
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/about' },
  openGraph: { title, description },
};

export default async function AboutPage() {
  const content = await publicSetting('content');
  return <About story={content.story || ''} />;
}
