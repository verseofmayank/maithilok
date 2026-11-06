import type { Metadata } from 'next';
import { Contact } from '@/components/customer';

export const revalidate = 300;
export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Contact Maithilok in Darbhanga, Bihar for product, order and general enquiries.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return <Contact />;
}
