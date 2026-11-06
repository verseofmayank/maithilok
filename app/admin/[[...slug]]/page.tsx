import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { Admin } from '@/components/admin';
import { AuthForm } from '@/components/customer';
import { Logo } from '@/components/shell';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Private Store Administration | Maithilok',
  robots: { index: false, follow: false },
};
export default async function AdminPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const slug = (await params).slug || [],
    section = slug[0] || 'dashboard';
  const user = await currentUser();
  if (section === 'login') {
    if (user?.role === 'ADMIN') redirect('/admin');
    return (
      <div className="admin-login">
        <Logo />
        <Suspense fallback={<p>Loading sign in…</p>}>
          <AuthForm admin />
        </Suspense>
      </div>
    );
  }
  if (!user || user.role !== 'ADMIN') redirect('/admin/login');
  if (
    ![
      'dashboard',
      'products',
      'categories',
      'subcategories',
      'inventory',
      'orders',
      'customers',
      'activity',
      'enquiries',
      'messages',
      'promotions',
      'shipping',
      'content',
      'images',
      'analytics',
      'settings',
    ].includes(section)
  )
    notFound();
  return <Admin section={section} name={user.name} />;
}
