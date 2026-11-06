import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { publicSetting } from '@/lib/storefront';
import { launchState } from '@/lib/commerce';
import { site, addressLine, telHref } from '@/lib/site';
import { About } from '@/components/about';
import { Home, Catalog, Categories, ProductDetail } from '@/components/catalog';
import { Cart, Checkout, Contact, AuthForm, Account, OrderTracking } from '@/components/customer';
import { Heading, ButtonLink } from '@/components/ui';
import type { Product, Category } from '@/lib/types';
export const dynamic = 'force-dynamic';
type Props = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | undefined>>;
};
const titles: Record<string, string> = {
  shop: 'Shop Ghee',
  about: 'About Us',
  categories: 'Our Categories',
  search: 'Search',
  wishlist: 'Wishlist',
  cart: 'Your Bag',
  checkout: 'Checkout',
  'order-confirmation': 'Order Confirmation',
  'track-order': 'Track Your Order',
  login: 'Sign In',
  register: 'Create Account',
  'forgot-password': 'Password Recovery',
  'reset-password': 'Reset Password',
  account: 'Your Account',
  'our-story': 'Our Story',
  contact: 'Contact Us',
  faq: 'Frequently Asked Questions',
  'shipping-policy': 'Shipping Policy',
  'return-refund-policy': 'Return & Refund Policy',
  'privacy-policy': 'Privacy Policy',
  'terms-and-conditions': 'Terms and Conditions',
  journal: 'The Maithilok Journal',
  'coming-soon': 'Coming Soon',
};
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug || [],
    route = slug.join('/');
  let title = titles[slug[0]] || 'Cow & Buffalo Ghee from Darbhanga',
    description =
      slug[0] === 'about' || slug[0] === 'our-story'
        ? 'The story of Maithilok: a ghee brand from Darbhanga, Bihar, rooted in the food traditions of Mithila.'
        : 'Shop Maithilok cow ghee and buffalo ghee from Darbhanga, Mithila. Delivered across India.';
  if (slug[0] === 'products') {
    const p = await db.product.findUnique({ where: { slug: slug[1] } });
    if (p) {
      title = p.seoTitle || p.name;
      description = p.seoDescription || p.shortDescription;
    }
  }
  const privatePage = [
    'account',
    'checkout',
    'cart',
    'wishlist',
    'order-confirmation',
    'track-order',
    'login',
    'register',
    'reset-password',
    'forgot-password',
    'search',
  ].includes(slug[0]);
  return {
    title,
    description,
    alternates: { canonical: slug[0] === 'our-story' ? '/about' : `/${route}` },
    openGraph: { title, description },
    ...(privatePage ? { robots: { index: false, follow: false } } : {}),
  };
}
const articles = [
  {
    slug: 'a-place-at-the-table',
    title: 'A place at the Mithila table',
    category: 'OUR ROOTS',
    intro: 'Food is one of the ways a place stays with us.',
    body: [
      'The foods we grow up with become part of our everyday language. A familiar ingredient, a shared plate, a recipe remembered: each can bring us back to a place and the people around its table.',
      'Maithilok begins with that connection. Our collection starts with cow and buffalo ghee, with plans to introduce more regional favourites over time.',
      'We are building a pantry that leaves room for those traditions in contemporary homes. This is the beginning of that journey.',
    ],
  },
  {
    slug: 'our-first-chapter-ghee',
    title: 'Our first chapter: ghee',
    category: 'THE PANTRY',
    intro: 'Why we are starting with an everyday kitchen staple.',
    body: [
      'Ghee has a familiar place in many Indian kitchens. It can be part of a shared meal, a family recipe, or a small finishing touch.',
      'The Maithilok collection begins with cow ghee and buffalo ghee, each in 500g and 1kg options. Product disclosures will be verified before commercial sales begin.',
      'Explore the collection, try the demo shopping experience, and let us know what you would like to see in our pantry next.',
    ],
  },
  {
    slug: 'a-growing-regional-pantry',
    title: 'A growing regional pantry',
    category: 'LOOKING AHEAD',
    intro: 'Makhana, thekua, sattu, and more. A taste of what we are planning.',
    body: [
      'Our next chapter looks beyond ghee. We are planning a collection that includes makhana, thekua, sattu, pickles, snacks, sweets and gift hampers.',
      'These products are still coming soon. We have not announced prices or launch dates.',
      'Join the newsletter or send us a note to share what you are looking forward to.',
    ],
  },
];
export default async function Page({ params, searchParams }: Props) {
  const slug = (await params).slug || [],
    query = await searchParams,
    root = slug[0] || '',
    sub = slug[1] || '';
  const needsProducts =
    ['', 'shop', 'search', 'wishlist', 'coming-soon', 'products'].includes(root) ||
    (root === 'categories' && !!sub);
  const needsCategories = ['', 'shop', 'search', 'wishlist', 'coming-soon', 'categories'].includes(
    root,
  );
  const needsContent = ['', 'about', 'our-story'].includes(root);
  const needsPolicies = [
    'shipping-policy',
    'return-refund-policy',
    'privacy-policy',
    'terms-and-conditions',
  ].includes(root);
  const [rawProducts, categories, content, policies, launch] = await Promise.all([
    needsProducts
      ? db.product.findMany({
          where: { status: { in: ['ACTIVE', 'COMING_SOON'] } },
          include: { variants: true, category: true },
          orderBy: { createdAt: 'asc' },
        })
      : Promise.resolve([]),
    needsCategories ? db.category.findMany({ orderBy: { sortOrder: 'asc' } }) : Promise.resolve([]),
    needsContent ? publicSetting('content') : Promise.resolve<Record<string, string>>({}),
    needsPolicies ? publicSetting('policies') : Promise.resolve<Record<string, string>>({}),
    launchState(),
  ]);
  const products = JSON.parse(
      JSON.stringify(
        rawProducts.map((p) => ({
          ...p,
          details:
            (p.details as Record<string, unknown>).verified === true
              ? p.details
              : { verified: false },
        })),
      ),
    ) as Product[],
    cats = categories as Category[];
  let page: React.ReactNode;
  if (!root) page = <Home products={products} categories={cats} content={content} />;
  else if (root === 'shop' || root === 'search' || root === 'wishlist' || root === 'coming-soon')
    page = (
      <Catalog
        products={products}
        categories={cats}
        initialQuery={query.q || ''}
        title={
          root === 'wishlist'
            ? 'Your favourites.'
            : root === 'search'
              ? 'Find something familiar.'
              : root === 'coming-soon'
                ? 'The best is still to come.'
                : 'The Maithilok collection.'
        }
        comingOnly={root === 'coming-soon'}
        wishlist={root === 'wishlist'}
      />
    );
  else if (root === 'categories') {
    if (sub) {
      const category = cats.find((c) => c.slug === sub);
      if (!category) notFound();
      page = (
        <Catalog
          products={products}
          categories={cats}
          title={category.name}
          initialCategory={sub}
        />
      );
    } else page = <Categories categories={cats} />;
  } else if (root === 'products') {
    const p = products.find((p) => p.slug === sub);
    if (!p) notFound();
    page = (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: p.name,
              description: p.shortDescription,
              image: p.images.map((i) => site.url + i),
              brand: { '@type': 'Brand', name: 'Maithilok' },
              ...(p.variants.length
                ? {
                    offers: p.variants.map((v) => ({
                      '@type': 'Offer',
                      sku: v.sku,
                      name: `${p.name} ${v.label}`,
                      price: (v.price / 100).toFixed(2),
                      priceCurrency: 'INR',
                      availability:
                        launch.ready && v.stock > 0
                          ? 'https://schema.org/InStock'
                          : 'https://schema.org/PreOrder',
                      url: `${site.url}/products/${p.slug}`,
                    })),
                  }
                : {}),
            }).replaceAll('<', '\\u003c'),
          }}
        />
        <ProductDetail key={p.id} product={p} products={products} />
      </>
    );
  } else if (root === 'cart') page = <Cart />;
  else if (root === 'checkout') page = <Checkout liveReady={launch.ready} />;
  else if (root === 'contact') page = <Contact />;
  else if (['login', 'register', 'forgot-password', 'reset-password'].includes(root))
    page = (
      <AuthForm
        mode={root === 'forgot-password' ? 'forgot' : root === 'reset-password' ? 'reset' : root}
      />
    );
  else if (root === 'account') {
    if (!['', 'orders', 'addresses'].includes(sub)) notFound();
    page = <Account key={sub} section={sub || 'overview'} />;
  } else if (root === 'track-order' || root === 'order-confirmation')
    page = <OrderTracking confirmation={root === 'order-confirmation'} />;
  else if (root === 'about' || root === 'our-story') page = <About story={content?.story || ''} />;
  else if (root === 'faq')
    page = (
      <div className="container page-space narrow">
        <Heading eyebrow="HERE TO HELP" title="A few things you might wonder." />
        {[
          [
            'Where is Maithilok based?',
            `We are based in ${addressLine()}, in the heart of the Mithila region. Orders are packed and dispatched from Darbhanga.`,
          ],
          [
            'Which products can I buy right now?',
            'We currently sell Cow Ghee and Buffalo Ghee, each in 500g and 1kg jars. Makhana, thekua, sattu, pickles and more are coming soon.',
          ],
          [
            'What is the difference between cow ghee and buffalo ghee?',
            'Cow ghee is usually lighter and more golden in colour. Buffalo ghee is generally whiter, thicker and richer in texture. Both are used in everyday Indian cooking; choose the one your family prefers.',
          ],
          [
            'How do I pay?',
            launch.ready
              ? 'We accept UPI, debit and credit cards, net banking and wallets through Razorpay. Your payment is verified on our server before the order is confirmed.'
              : 'Online payment through Razorpay (UPI, cards, net banking and wallets) opens at launch. Until then, checkout runs in preview mode and no money is charged.',
          ],
          [
            'Do you deliver across India?',
            'Yes, we plan to deliver to most PIN codes in India. Enter your PIN code at checkout to see whether we deliver there and what shipping costs.',
          ],
          [
            'Do I need an account to order?',
            'No. You can check out as a guest. Creating an account lets you save addresses and see all your orders in one place.',
          ],
          [
            'How do I track my order?',
            'Use the private tracking link shown after checkout, or sign in and open My Orders. Courier details appear once your order is shipped.',
          ],
          [
            'Where can I find ingredients, FSSAI and shelf-life details?',
            'Each product page lists verified label information under “Product information” once it is published. Please check the jar label for batch, MRP and best-before details.',
          ],
          [
            'How can I contact you?',
            `Call or WhatsApp ${site.phone}, email ${site.email}, or send a message through our contact page. We usually reply within one working day.`,
          ],
        ].map(([q, a]) => (
          <details className="faq-item" key={q}>
            <summary>
              {q}
              <span>+</span>
            </summary>
            <p>{a}</p>
          </details>
        ))}
        <ButtonLink href="/contact" secondary>
          Still have a question?
        </ButtonLink>
      </div>
    );
  else if (
    ['shipping-policy', 'return-refund-policy', 'privacy-policy', 'terms-and-conditions'].includes(
      root,
    )
  ) {
    const key = {
      'shipping-policy': 'shipping',
      'return-refund-policy': 'returns',
      'privacy-policy': 'privacy',
      'terms-and-conditions': 'terms',
    }[root]!;
    page = (
      <div className="container page-space narrow">
        <Heading eyebrow="TRANSPARENCY MATTERS" title={titles[root]} />
        {!launch.ready && (
          <div className="notice">Draft policy · will be finalized before ordering opens</div>
        )}
        <article className="prose">
          {String(policies?.[key] || '')
            .split(/\n\s*\n/)
            .map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          {!launch.ready && (
            <>
              <h2>Preview status</h2>
              <p>
                Ordering is not open yet. Preview orders do not charge money or create a shipment.
              </p>
            </>
          )}
          <h2>Questions and requests</h2>
          <p>
            Contact Maithilok at <a href={`mailto:${site.email}`}>{site.email}</a> or{' '}
            <a href={telHref()}>{site.phone}</a>. Registered business location: {addressLine()}.
          </p>
        </article>
      </div>
    );
  } else if (root === 'journal') {
    if (sub) {
      const article = articles.find((a) => a.slug === sub);
      if (!article) notFound();
      page = (
        <article className="container page-space narrow">
          <Link className="text-link" href="/journal">
            ← The journal
          </Link>
          <Heading eyebrow={article.category} title={article.title}>
            {article.intro}
          </Heading>
          <div className="prose">
            {article.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <ButtonLink href="/shop">Explore Maithilok</ButtonLink>
        </article>
      );
    } else
      page = (
        <div className="container page-space">
          <Heading eyebrow="NOTES FROM OUR TABLE" title="The Maithilok journal.">
            A few thoughts on food, place, and the traditions we carry forward.
          </Heading>
          <div className="journal-grid">
            {articles.map((a, i) => (
              <Link href={`/journal/${a.slug}`} key={a.slug}>
                <div className="journal-image">
                  <Image
                    src={
                      i === 0
                        ? '/banners/ghee-hero.webp'
                        : i === 1
                          ? '/products/cow-ghee-500g.webp'
                          : '/categories/makhana.webp'
                    }
                    alt="Illustrative food concept"
                    fill
                    sizes="(max-width:640px) 90vw,30vw"
                  />
                </div>
                <span className="eyebrow">{a.category}</span>
                <h2>{a.title}</h2>
                <p>{a.intro}</p>
                <span className="text-link">Read the story →</span>
              </Link>
            ))}
          </div>
        </div>
      );
  } else notFound();
  return (
    <Suspense
      fallback={<div className="container page-space">Preparing your Maithilok experience…</div>}
    >
      {page}
    </Suspense>
  );
}
