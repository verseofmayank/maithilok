'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Search,
  UserRound,
  Heart,
  ShoppingBag,
  Menu,
  X,
  ArrowUpRight,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useStore } from './store-provider';
import { api, Button } from './ui';
import { site, addressLine, telHref } from '@/lib/site';
export function Logo() {
  return (
    <Link href="/" className="brand" aria-label="Maithilok — home">
      <Image src="/branding/symbol-v2.svg" width={48} height={48} alt="" priority />
      <span>
        <span className="wordmark">
          <span className="word-en">Maithilok</span>
          <span className="word-hi" lang="hi">
            मैथिल लोक
          </span>
        </span>
        <span className="brand-tagline">From Mithila, To Your Home</span>
      </span>
    </Link>
  );
}
const navigation = [
  ['Home', '/'],
  ['Shop Ghee', '/shop'],
  ['About Us', '/about'],
  ['Track Order', '/track-order'],
  ['Contact', '/contact'],
];
export function Shell({
  children,
  announcement,
}: {
  children: React.ReactNode;
  announcement: string;
}) {
  const path = usePathname(),
    store = useStore();
  const [mobile, setMobile] = useState(false),
    [search, setSearch] = useState(false),
    [query, setQuery] = useState(''),
    [suggestions, setSuggestions] = useState<{ name: string; slug: string }[]>([]);
  useEffect(() => {
    setMobile(false);
    setSearch(false);
  }, [path]);
  useEffect(() => {
    if (!search) return;
    let active = true;
    api('catalog').then((d) => {
      if (active)
        setSuggestions(
          d.products
            .filter((p: { name: string }) => p.name.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 5),
        );
    });
    return () => {
      active = false;
    };
  }, [query, search]);
  if (path.startsWith('/admin')) return <>{children}</>;
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="announcement">
        <span>{announcement}</span>
        <Link href="/shop">
          Shop ghee <ArrowUpRight size={13} />
        </Link>
      </div>
      <header className="site-header">
        <div className="header-inner">
          <Logo />
          <nav aria-label="Main navigation">
            {navigation.map(([label, href]) => (
              <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className="icon-button"
              aria-label="Search products"
              onClick={() => setSearch(true)}
            >
              <Search size={21} />
            </button>
            <Link className="icon-button account-icon" href="/account" aria-label="Your account">
              <UserRound size={21} />
            </Link>
            <Link className="icon-button wish-icon" href="/wishlist" aria-label="Wishlist">
              <Heart size={21} />
            </Link>
            <button
              className="icon-button bag-icon"
              aria-label="Open shopping bag"
              onClick={store.open}
            >
              <ShoppingBag size={21} />
              {store.items.length > 0 && (
                <span className="count">{store.items.reduce((s, i) => s + i.quantity, 0)}</span>
              )}
            </button>
            <button
              className="icon-button mobile-toggle"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>
      <Dialog.Root open={mobile} onOpenChange={setMobile}>
        <Dialog.Portal>
          <Dialog.Overlay className="drawer-overlay" />
          <Dialog.Content className="mobile-nav">
            <div className="drawer-head">
              <Dialog.Title>Maithilok</Dialog.Title>
              <Dialog.Close aria-label="Close navigation" className="icon-button">
                <X />
              </Dialog.Close>
            </div>
            <Dialog.Description>Explore our collection</Dialog.Description>
            {[
              ...navigation,
              ['Journal', '/journal'],
              ['FAQs', '/faq'],
              ['Account', '/account'],
              ['Wishlist', '/wishlist'],
            ].map(([name, href]) => (
              <Link key={href} href={href}>
                {name}
                <ArrowRight size={18} />
              </Link>
            ))}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={search} onOpenChange={setSearch}>
        <Dialog.Portal>
          <Dialog.Overlay className="drawer-overlay" />
          <Dialog.Content className="search-dialog">
            <div className="drawer-head">
              <Dialog.Title>Find your next favourite</Dialog.Title>
              <Dialog.Close className="icon-button" aria-label="Close search">
                <X />
              </Dialog.Close>
            </div>
            <Dialog.Description>Search cow ghee, buffalo ghee and more.</Dialog.Description>
            <form action="/search" className="search-form">
              <Search size={20} />
              <input
                autoFocus
                name="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Maithilok…"
                aria-label="Search term"
              />
              <Button type="submit">Search</Button>
            </form>
            <div className="suggestions">
              {suggestions.map((p) => (
                <Link key={p.slug} href={`/products/${p.slug}`}>
                  {p.name}
                  <ArrowUpRight size={16} />
                </Link>
              ))}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <main id="main-content">{children}</main>
      <Newsletter />
      <footer>
        <div className="footer-main container">
          <div className="footer-brand">
            <Logo />
            <p>
              Cow and buffalo ghee from Darbhanga, Mithila.
              <br />
              Packed with care, delivered across India.
            </p>
            <p lang="hi" className="hindi-line">
              मिथिला की परंपरा, आपके घर तक
            </p>
          </div>
          <div>
            <h3>Explore</h3>
            <Link href="/shop">Shop the collection</Link>
            <Link href="/categories">Our categories</Link>
            <Link href="/about">About Maithilok</Link>
            <Link href="/journal">The Maithilok journal</Link>
            <Link href="/coming-soon">Coming soon</Link>
          </div>
          <div>
            <h3>Here to help</h3>
            <Link href="/contact">Contact us</Link>
            <Link href="/track-order">Track an order</Link>
            <Link href="/faq">FAQs</Link>
            <Link href="/shipping-policy">Shipping policy</Link>
            <Link href="/return-refund-policy">Returns & refunds</Link>
          </div>
          <div>
            <h3>Let’s stay connected</h3>
            <a href={telHref()}>
              <Phone size={14} />
              {site.phone}
            </a>
            <a href={`mailto:${site.email}`}>
              <Mail size={14} />
              {site.email}
            </a>
            <span>
              <MapPin size={14} />
              {addressLine()}
            </span>
            <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noreferrer">
              Chat on WhatsApp <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
        <div className="footer-bottom container">
          <span>© {new Date().getFullYear()} Maithilok. All rights reserved.</span>
          <div>
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/terms-and-conditions">Terms</Link>
            <Link href="/shipping-policy">Shipping</Link>
          </div>
          <span className="demo-label">
            {store.live ? 'Secure payments by Razorpay' : 'Preview store · ordering opens soon'}
          </span>
        </div>
      </footer>
    </>
  );
}
function Newsletter() {
  const [email, setEmail] = useState(''),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  return (
    <section className="newsletter">
      <div className="container newsletter-inner">
        <div>
          <span className="eyebrow">A LETTER FROM MITHILA</span>
          <h2>Good things are worth waiting for.</h2>
          <p>New arrivals, regional food stories, and a little taste of home.</p>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const d = await api('newsletter', { email, consent });
              setMessage(d.message);
              setEmail('');
            } catch (e) {
              setMessage((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="newsletter-field">
            <input
              type="email"
              aria-label="Email for newsletter"
              placeholder="Your email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" disabled={busy} aria-label="Subscribe">
              <ArrowRight />
            </button>
          </div>
          <label className="check-label">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            I agree to receive updates and accept the{' '}
            <Link href="/privacy-policy">privacy policy</Link>.
          </label>
          {message && (
            <p role="status" className="small">
              {message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
