'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  Plus,
  Minus,
  ArrowRight,
  SlidersHorizontal,
  Package,
  MapPin,
  ChevronDown,
  Leaf,
  ShoppingBag,
  Zap,
  Sparkles,
  BadgePercent,
  Truck,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { Product, Category } from '@/lib/types';
import { money } from '@/lib/utils';
import { useStore } from './store-provider';
import { Button, ButtonLink, Empty, Heading, api } from './ui';
import { ProductReviews } from './reviews';
function off(price: number, compareAt?: number | null) {
  return compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;
}
export function ProductCard({ product }: { product: Product }) {
  const [variantId, setVariantId] = useState(product.variants[0]?.id);
  const store = useStore(),
    v = product.variants.find((variant) => variant.id === variantId) || product.variants[0],
    soon = product.status === 'COMING_SOON',
    discount = v ? off(v.price, v.compareAt) : 0;
  return (
    <article className="product-card">
      <div className="product-photo">
        <Link href={`/products/${product.slug}`}>
          <Image
            src={v?.image || product.images[0]}
            alt={`Maithilok ${product.name}`}
            fill
            sizes="(max-width:640px) 46vw,(max-width:1000px) 45vw,28vw"
          />
        </Link>
        <span className="product-badge">
          {soon
            ? 'Coming soon'
            : !v?.stock
              ? 'Out of stock'
              : discount
                ? `${discount}% off`
                : 'Ghee collection'}
        </span>
        <button
          className={`wish-button ${store.wishlist.includes(product.id) ? 'saved' : ''}`}
          aria-label={`Save ${product.name} to wishlist`}
          aria-pressed={store.wishlist.includes(product.id)}
          onClick={() => store.toggleWish(product.id)}
        >
          <Heart size={18} />
        </button>
        {!soon && v && (
          <button
            className="quick-add"
            onClick={() => store.add(v.id)}
            disabled={!v.stock}
            aria-label={`Add ${product.name} ${v.label} to bag`}
          >
            <Plus size={18} />
            <span>Add to bag</span>
          </button>
        )}
      </div>
      <div className="product-card-copy">
        <div>
          <span className="product-hindi" lang="hi">
            {product.hindiName || 'A taste of what’s next'}
          </span>
          <h3>
            <Link href={`/products/${product.slug}`}>{product.name}</Link>
          </h3>
        </div>
        <div className="product-card-price">
          {v ? (
            <>
              <strong>
                {money(v.price)}
                {discount > 0 && <del>{money(v.compareAt!)}</del>}
              </strong>
              <span>{v.label} jar</span>
            </>
          ) : (
            <span>In the making</span>
          )}
        </div>
      </div>
      <p>{product.shortDescription}</p>
      {!soon && product.variants.length > 1 && (
        <div className="card-variants" role="group" aria-label={`Choose ${product.name} size`}>
          {product.variants.map((variant) => (
            <button
              key={variant.id}
              type="button"
              aria-pressed={v?.id === variant.id}
              onClick={() => setVariantId(variant.id)}
            >
              {variant.label}
              {!variant.stock && <span> · sold out</span>}
            </button>
          ))}
        </div>
      )}
      {!soon && v && (
        <div className="card-actions">
          <button
            className="button secondary"
            onClick={() => store.add(v.id)}
            disabled={!v.stock}
            aria-label={`Add ${product.name} ${v.label} to bag`}
          >
            <ShoppingBag size={16} />
            Add to bag
          </button>
          <button className="button" onClick={() => store.buyNow(v.id)} disabled={!v.stock}>
            <Zap size={16} />
            Buy now
          </button>
        </div>
      )}
    </article>
  );
}
const defaultOffers = [
  'Festive discounts coming soon',
  'Special launch price on 1kg jars, coming soon',
  'Free shipping offers on the way',
  'Fresh batches from Darbhanga, Mithila',
  'Secure UPI, card & net banking payments',
];
export function OfferMarquee({ text }: { text?: string }) {
  const items = (text || '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
  const list = items.length ? items : defaultOffers;
  const row = (hidden: boolean) => (
    <div className="marquee-row" aria-hidden={hidden || undefined}>
      {list.map((item, i) => (
        <span key={i}>
          {i % 2 ? <Sparkles size={16} /> : <BadgePercent size={16} />}
          {item}
        </span>
      ))}
    </div>
  );
  return (
    <section className="offer-marquee" aria-label="Offers">
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}
export function Home({
  products,
  categories,
  content,
}: {
  products: Product[];
  categories: Category[];
  content: Record<string, string>;
}) {
  const reduce = useReducedMotion();
  const featured = products.filter((p) => p.status === 'ACTIVE' && p.featured);
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="hero-eyebrow">
              <span />
              ROOTED IN TRADITION. SHARED WITH LOVE.
            </div>
            <h1>
              {(content.heroTitle || 'From Mithila,\nTo Your Home.').split('\n').map((s, i) => (
                <span key={s} className={i ? 'serif-italic' : ''}>
                  {s}
                </span>
              ))}
            </h1>
            <p>{content.heroDescription}</p>
            <div className="hero-buttons">
              <ButtonLink href="/shop">Shop Ghee</ButtonLink>
              <ButtonLink href="/about" secondary>
                Our Story
              </ButtonLink>
            </div>
            <div className="hero-footnote">
              <span className="line" />
              <span>Darbhanga · Mithila · Bihar</span>
            </div>
          </motion.div>
        </div>
        <div className="hero-image">
          <Image
            src={content.heroImage || '/banners/ghee-hero.webp'}
            alt="A jar of Maithilok cow ghee on a stone surface"
            fill
            priority
            sizes="(max-width:760px) 100vw,55vw"
          />
          <span className="hero-image-caption">THE EVERYDAY, MADE SPECIAL.</span>
          <div className="hero-stamp">
            <Leaf size={23} />
            <span>
              MITHILA
              <br />
              AT HEART
            </span>
          </div>
        </div>
      </section>
      <div className="values-strip">
        <span>
          <Leaf size={19} />
          Made in Darbhanga
        </span>
        <span>
          <Package size={19} />
          Sealed glass jars
        </span>
        <span>
          <Truck size={19} />
          Delivery across India
        </span>
        <span>
          <ShieldCheck size={19} />
          Secure payments
        </span>
      </div>
      <section className="section collection-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">SHOP THE COLLECTION</span>
              <h2>Ghee from Darbhanga.</h2>
              <p>Cow and buffalo ghee in 500g and 1kg jars. Order in a few taps.</p>
            </div>
            <Link className="text-link" href="/shop">
              Shop the collection <ArrowRight size={17} />
            </Link>
          </div>
          <div className="featured-grid">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
            <div className="collection-note">
              <span className="eyebrow">THE MAITHILOK TABLE</span>
              <h3>
                Every meal.
                <br />A little closer
                <br />
                <em>to home.</em>
              </h3>
              <span className="ornament">✳</span>
              <p>
                From a spoonful on warm rice to the recipes you grew up with, make room for the
                familiar.
              </p>
              <Link href="/about">
                Meet Maithilok <ArrowUpRightIcon />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <OfferMarquee text={content.marquee} />
      <section className="story-section container">
        <div className="story-art">
          <Image
            src="/banners/ghee-hero.webp"
            alt="Maithilok ghee served at the table"
            fill
            sizes="(max-width:760px) 100vw,45vw"
          />
          <div className="story-art-label">
            <span lang="hi">मिथिला की परंपरा</span>
            <span>A story that feels like home.</span>
          </div>
        </div>
        <div className="story-copy">
          <span className="eyebrow">OUR NAME. OUR ROOTS.</span>
          <h2>
            From a place
            <br />
            rich in culture.
            <br />
            <em>To a table full of warmth.</em>
          </h2>
          <p>{content.story}</p>
          <p>Not just the foods we remember. The traditions we carry forward.</p>
          <ButtonLink href="/about" secondary>
            Discover our story
          </ButtonLink>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THERE’S MORE TO COME</span>
            <h2>Next from our Mithila pantry.</h2>
            <p>Ghee is our first chapter. Here’s what we’re preparing next.</p>
          </div>
          <Link className="text-link" href="/categories">
            All categories <ArrowRight size={17} />
          </Link>
        </div>
        <div className="category-strip">
          {categories
            .filter((c) => !c.parentId)
            .slice(0, 7)
            .map((c) => (
              <Link href={`/categories/${c.slug}`} key={c.id} className="category-circle">
                <div>
                  <Image src={c.image} width={160} height={160} alt={c.name} />
                </div>
                <h3>{c.name}</h3>
                <span>{c.slug === 'ghee' ? 'Explore collection' : 'Coming soon'}</span>
              </Link>
            ))}
        </div>
      </section>
      <section className="how-section">
        <div className="container">
          <span className="eyebrow">FROM OUR COLLECTION TO YOUR KITCHEN</span>
          <h2>Three steps to your table.</h2>
          <div className="how-grid">
            {[
              [
                '01',
                'Pick your ghee',
                'Choose cow or buffalo ghee and the jar size that suits your home.',
              ],
              [
                '02',
                'Pay securely',
                'Check out as a guest or with your account. Pay by UPI, card or net banking.',
              ],
              [
                '03',
                'Track your order',
                'We pack it in Darbhanga and share courier tracking until it reaches you.',
              ],
            ].map(([n, t, d]) => (
              <div key={n}>
                <span>{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="support-band container">
        <div>
          <span className="eyebrow">A CONVERSATION AWAY</span>
          <h2>Something on your mind?</h2>
          <p>We’d love to hear from you.</p>
        </div>
        <ButtonLink href="/contact" secondary>
          Let’s talk
        </ButtonLink>
      </section>
    </>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={17} style={{ transform: 'rotate(-40deg)' }} />;
}
export function Catalog({
  products,
  categories,
  title = 'The Maithilok collection',
  initialCategory = '',
  initialQuery = '',
  comingOnly = false,
  wishlist = false,
}: {
  products: Product[];
  categories: Category[];
  title?: string;
  initialCategory?: string;
  initialQuery?: string;
  comingOnly?: boolean;
  wishlist?: boolean;
}) {
  const store = useStore();
  const [category, setCategory] = useState(initialCategory),
    [subcategory, setSubcategory] = useState(''),
    [query, setQuery] = useState(initialQuery),
    [sort, setSort] = useState('featured'),
    [maxPrice, setMaxPrice] = useState(''),
    [available, setAvailable] = useState(false);
  const filtered = useMemo(() => {
    const selected = categories.find((c) => c.slug === category);
    let list = products.filter(
      (p) =>
        (!comingOnly || p.status === 'COMING_SOON') &&
        (!wishlist || store.wishlist.includes(p.id)) &&
        (!selected || p.categoryId === selected.id || p.subcategory === selected.name) &&
        (!subcategory || p.subcategory === subcategory) &&
        (!available || p.status === 'ACTIVE') &&
        (!query ||
          `${p.name} ${p.hindiName} ${p.description}`
            .toLowerCase()
            .includes(query.toLowerCase())) &&
        (!maxPrice || p.variants.some((v) => v.price <= Number(maxPrice) * 100)),
    );
    if (sort === 'price-low')
      list = list.sort(
        (a, b) => (a.variants[0]?.price ?? Infinity) - (b.variants[0]?.price ?? Infinity),
      );
    if (sort === 'price-high')
      list = list.sort((a, b) => (b.variants[0]?.price ?? -1) - (a.variants[0]?.price ?? -1));
    if (sort === 'name') list = list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [
    products,
    categories,
    category,
    subcategory,
    query,
    sort,
    maxPrice,
    available,
    comingOnly,
    wishlist,
    store.wishlist,
  ]);
  return (
    <div className="container page-space">
      <Heading eyebrow={comingOnly ? 'THE NEXT CHAPTER' : 'FROM DARBHANGA, MITHILA'} title={title}>
        {comingOnly
          ? 'A growing collection of regional favourites. Join our newsletter for launch updates.'
          : 'Thoughtfully chosen for your pantry, and the people around your table.'}
      </Heading>
      <div className="catalog-toolbar">
        <div className="search-inline">
          <SlidersHorizontal size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the collection"
            aria-label="Search collection"
          />
        </div>
        <label>
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="featured">Featured</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="name">Name: A to Z</option>
          </select>
        </label>
      </div>
      <div className="catalog-layout">
        <aside className="filters">
          <h3>Categories</h3>
          <button
            className={!category ? 'active' : ''}
            onClick={() => {
              setCategory('');
              setSubcategory('');
            }}
          >
            All products
          </button>
          {categories
            .filter((c) => !c.parentId)
            .map((c) => (
              <button
                key={c.id}
                className={category === c.slug ? 'active' : ''}
                onClick={() => {
                  setCategory(c.slug);
                  setSubcategory('');
                }}
              >
                {c.name}
              </button>
            ))}
          {category && (
            <label>
              Subcategory
              <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)}>
                <option value="">All</option>
                {categories
                  .filter((c) => c.parentId === categories.find((c) => c.slug === category)?.id)
                  .map((c) => (
                    <option key={c.id}>{c.name}</option>
                  ))}
              </select>
            </label>
          )}
          <label>
            Maximum price (₹)
            <input
              type="number"
              min="0"
              placeholder="No limit"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
            />
            Available now
          </label>
          <button
            className="text-link"
            onClick={() => {
              setCategory('');
              setSubcategory('');
              setQuery('');
              setMaxPrice('');
              setAvailable(false);
            }}
          >
            Clear filters
          </button>
        </aside>
        <div>
          <p className="result-count">
            {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
          </p>
          {filtered.length ? (
            <div className="product-grid">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <Empty title={wishlist ? 'Your favourites, all in one place' : 'Nothing here just yet'}>
              {wishlist
                ? 'Tap the heart on a product to save it for later.'
                : 'Try a different search or clear your filters.'}
            </Empty>
          )}
        </div>
      </div>
    </div>
  );
}
export function Categories({ categories }: { categories: Category[] }) {
  return (
    <div className="container page-space">
      <Heading eyebrow="EXPLORE OUR ROOTS" title="A pantry full of possibilities.">
        Start with ghee. Look forward to more from Mithila.
      </Heading>
      <div className="categories-grid">
        {categories
          .filter((c) => !c.parentId)
          .map((c) => (
            <Link href={`/categories/${c.slug}`} key={c.id}>
              <div>
                <Image src={c.image} alt={c.name} fill sizes="(max-width:640px) 90vw,30vw" />
              </div>
              <span className="eyebrow">
                {c.slug === 'ghee' ? 'AVAILABLE TO EXPLORE' : 'COMING SOON'}
              </span>
              <h2>
                {c.name}
                <ArrowRight size={22} />
              </h2>
              <p>
                {categories
                  .filter((s) => s.parentId === c.id)
                  .map((s) => s.name)
                  .join(' · ') || 'A new addition to our pantry.'}
              </p>
            </Link>
          ))}
      </div>
    </div>
  );
}
export function ProductDetail({ product, products }: { product: Product; products: Product[] }) {
  const store = useStore(),
    [variantId, setVariantId] = useState(product.variants[0]?.id || ''),
    [quantity, setQuantity] = useState(1),
    [imageIndex, setImageIndex] = useState(0),
    [pin, setPin] = useState(''),
    [pinMessage, setPinMessage] = useState(''),
    [recent, setRecent] = useState<string[]>([]);
  const variant = product.variants.find((v) => v.id === variantId),
    soon = product.status === 'COMING_SOON';
  useEffect(() => {
    try {
      const old = JSON.parse(localStorage.getItem('maithilok-recent') || '[]') as string[];
      setRecent(old.filter((id) => id !== product.id));
      localStorage.setItem(
        'maithilok-recent',
        JSON.stringify([product.id, ...old.filter((id) => id !== product.id)].slice(0, 6)),
      );
    } catch {}
  }, [product.id]);
  const images = product.images;
  return (
    <div className="container page-space">
      <div className="breadcrumbs">
        <Link href="/shop">Shop</Link>
        <span>/</span>
        <Link href={`/categories/${product.category?.slug || 'ghee'}`}>
          {product.category?.name}
        </Link>
        <span>/</span>
        {product.name}
      </div>
      <div className="product-detail">
        <div>
          <div className="detail-image">
            <Image
              src={images[imageIndex] || images[0]}
              alt={`Maithilok ${product.name}`}
              fill
              priority
              sizes="(max-width:760px) 100vw,48vw"
            />
            <span className="product-badge">
              {soon
                ? 'Coming soon'
                : variant && off(variant.price, variant.compareAt)
                  ? `${off(variant.price, variant.compareAt)}% off`
                  : 'Maithilok Ghee'}
            </span>
          </div>
          <div className="thumbnails">
            {images.map((src, i) => (
              <button
                key={src}
                aria-label={`View ${product.name} image ${i + 1}`}
                aria-pressed={imageIndex === i}
                className={imageIndex === i ? 'selected' : ''}
                onClick={() => setImageIndex(i)}
              >
                <Image src={src} width={80} height={90} alt="" />
              </button>
            ))}
          </div>
          <p className="image-note">Illustrative product concepts. Final packaging may vary.</p>
        </div>
        <div className="detail-copy">
          <span className="eyebrow">{product.category?.name || 'MAITHILOK COLLECTION'}</span>
          <h1>{product.name}</h1>
          <p className="detail-hindi" lang="hi">
            {product.hindiName}
          </p>
          <p>{product.shortDescription}</p>
          {variant && (
            <div className="detail-price">
              {money(variant.price)}
              {variant.compareAt && variant.compareAt > variant.price ? (
                <del>{money(variant.compareAt)}</del>
              ) : null}
              <span>{store.live ? 'Inclusive of all taxes' : 'Launch price · INR'}</span>
            </div>
          )}
          {!soon && (
            <>
              <label className="field-label">Choose your size</label>
              <div className="variant-options">
                {product.variants.map((v, i) => (
                  <button
                    className={variantId === v.id ? 'selected' : ''}
                    key={v.id}
                    onClick={() => {
                      setVariantId(v.id);
                      setImageIndex(Math.min(i, images.length - 1));
                      setQuantity(1);
                    }}
                  >
                    {v.label}
                    <span>{money(v.price)}</span>
                  </button>
                ))}
              </div>
              <p className="stock-state">
                {variant?.stock
                  ? variant.stock < 5
                    ? `● Only ${variant.stock} left`
                    : '● In stock'
                  : 'Currently out of stock'}
              </p>
              <div className="purchase-row">
                <div className="quantity">
                  <button
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus size={15} />
                  </button>
                  <span>{quantity}</span>
                  <button
                    aria-label="Increase quantity"
                    onClick={() => setQuantity(Math.min(20, variant?.stock || 1, quantity + 1))}
                  >
                    <Plus size={15} />
                  </button>
                </div>
                <Button
                  disabled={!variant?.stock}
                  onClick={() => variant && store.add(variant.id, quantity)}
                >
                  <ShoppingBag size={18} />
                  Add to bag
                </Button>
                <Button
                  className="buy-now"
                  disabled={!variant?.stock}
                  onClick={() => variant && store.buyNow(variant.id, quantity)}
                >
                  <Zap size={18} />
                  Buy now
                </Button>
                <button
                  className="wishlist-detail"
                  aria-label="Save to wishlist"
                  aria-pressed={store.wishlist.includes(product.id)}
                  onClick={() => store.toggleWish(product.id)}
                >
                  <Heart
                    size={20}
                    fill={store.wishlist.includes(product.id) ? 'currentColor' : 'none'}
                  />
                </button>
              </div>
              <form
                className="pin-check"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!/^[1-9]\d{5}$/.test(pin)) {
                    setPinMessage('Enter a valid six-digit Indian PIN code.');
                    return;
                  }
                  try {
                    await api('cart/quote', {
                      items: [{ variantId, quantity: 1 }],
                      mode: 'LIVE',
                      pin,
                    });
                    setPinMessage('Good news! We deliver to this PIN code.');
                  } catch {
                    setPinMessage(
                      'We may not deliver here yet. Contact us and we will try to arrange it.',
                    );
                  }
                }}
              >
                <label htmlFor="delivery-pin">
                  <MapPin size={17} />
                  Check delivery
                </label>
                <div>
                  <input
                    id="delivery-pin"
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter PIN code"
                  />
                  <button type="submit">Check</button>
                </div>
                {pinMessage && <p role="status">{pinMessage}</p>}
              </form>
            </>
          )}
          {soon && (
            <div className="coming-notice">
              <h3>This product is coming soon.</h3>
              <p>This product is not available to purchase yet. Subscribe below for updates.</p>
              <ButtonLink href="/contact">Enquire about this product</ButtonLink>
            </div>
          )}
          <div className="product-accordions">
            <details open>
              <summary>
                About this product
                <ChevronDown size={17} />
              </summary>
              <p>{product.description}</p>
            </details>
            <details>
              <summary>
                Product information
                <ChevronDown size={17} />
              </summary>
              {product.details.verified === true ? (
                Object.entries(product.details)
                  .filter(([k, v]) => k !== 'verified' && v)
                  .map(([k, v]) => (
                    <p key={k}>
                      <strong>
                        {k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}:{' '}
                      </strong>
                      {String(v)}
                    </p>
                  ))
              ) : (
                <p>
                  Ingredients, nutrition, storage, shelf life, FSSAI and manufacturer details are
                  being finalized. Verified information will be published before sales begin.
                </p>
              )}
            </details>
            <details>
              <summary>
                Shipping & returns
                <ChevronDown size={17} />
              </summary>
              <p>
                Dispatched from Darbhanga, Bihar. Shipping charges are shown at checkout.{' '}
                <Link href="/shipping-policy">Shipping policy</Link> ·{' '}
                <Link href="/return-refund-policy">Returns & refunds</Link>.
              </p>
            </details>
          </div>
        </div>
      </div>
      {variant && !soon && (
        <div className="mobile-purchase">
          <div>
            <strong>{product.name}</strong>
            <span>
              {variant.label} · {money(variant.price)}
            </span>
          </div>
          <Button
            className="secondary"
            disabled={!variant.stock}
            onClick={() => store.add(variant.id, quantity)}
          >
            Add
          </Button>
          <Button disabled={!variant.stock} onClick={() => store.buyNow(variant.id, quantity)}>
            Buy now
          </Button>
        </div>
      )}
      {!soon && (
        <>
          <section className="product-facts" aria-label="Product and ordering details">
            <div>
              <Package size={24} />
              <h3>Choose your jar</h3>
              <p>
                {product.variants.map((v) => v.label).join(' or ')}. Select a size to see its price
                and availability.
              </p>
            </div>
            <div>
              <Truck size={24} />
              <h3>Delivery details</h3>
              <p>
                Shipping charges and serviceability are confirmed at checkout once delivery opens.
              </p>
              <Link href="/shipping-policy" className="text-link">
                Shipping policy →
              </Link>
            </div>
            <div>
              <MessageSquare size={24} />
              <h3>Ask us about it</h3>
              <p>Need help choosing a product or checking an order? Contact the Maithilok team.</p>
              <Link href="/contact" className="text-link">
                Contact us →
              </Link>
            </div>
          </section>
          <ProductReviews productId={product.id} />
        </>
      )}
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">A LITTLE MORE TO EXPLORE</span>
            <h2>You might also like.</h2>
          </div>
          <Link href="/shop" className="text-link">
            View the collection →
          </Link>
        </div>
        <div className="product-grid">
          {[...products]
            .filter((p) => p.id !== product.id)
            .sort((a, b) => Number(b.status === 'ACTIVE') - Number(a.status === 'ACTIVE'))
            .slice(0, 3)
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
      </section>
      {recent.length > 0 && (
        <section className="section">
          <h2>Recently viewed</h2>
          <div className="product-grid">
            {products
              .filter((p) => recent.includes(p.id))
              .slice(0, 3)
              .map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
