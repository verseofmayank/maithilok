'use client';
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Plus, Minus, Trash2, ShoppingBag, Check } from 'lucide-react';
import { api, ButtonLink } from './ui';
import { money } from '@/lib/utils';
import type { CartItem, Quote } from '@/lib/types';
type Store = {
  items: CartItem[];
  wishlist: string[];
  add: (id: string, qty?: number) => void;
  buyNow: (id: string, qty?: number) => void;
  live: boolean;
  update: (id: string, qty: number) => void;
  clear: () => void;
  toggleWish: (id: string) => void;
  open: () => void;
  notify: (message: string) => void;
  ready: boolean;
};
const Context = createContext<Store | null>(null);
export const useStore = () => useContext(Context)!;
export function StoreProvider({ children, live = false }: { children: ReactNode; live?: boolean }) {
  const [items, setItems] = useState<CartItem[]>([]),
    [wishlist, setWishlist] = useState<string[]>([]),
    [ready, setReady] = useState(false),
    [opened, setOpened] = useState(false),
    [message, setMessage] = useState(''),
    [quote, setQuote] = useState<Quote | null>(null),
    [error, setError] = useState('');
  const reduce = useReducedMotion();
  const pathname = usePathname(),
    router = useRouter();
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('maithilok-cart') || '[]');
      if (Array.isArray(saved))
        setItems(
          saved
            .filter(
              (i) =>
                typeof i.variantId === 'string' &&
                Number.isInteger(i.quantity) &&
                i.quantity > 0 &&
                i.quantity <= 20,
            )
            .slice(0, 40),
        );
      const wish = JSON.parse(localStorage.getItem('maithilok-wishlist') || '[]');
      if (Array.isArray(wish)) setWishlist(wish.filter((i) => typeof i === 'string'));
    } catch {}
    setReady(true);
    api('auth/me')
      .then((d) => {
        if (d.user?.wishlist?.length) setWishlist(d.user.wishlist);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (ready) {
      localStorage.setItem('maithilok-cart', JSON.stringify(items));
      localStorage.setItem('maithilok-wishlist', JSON.stringify(wishlist));
    }
  }, [items, wishlist, ready]);
  useEffect(() => {
    setOpened(false);
  }, [pathname]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 3200);
    return () => clearTimeout(timer);
  }, [message]);
  useEffect(() => {
    if (!opened || !items.length) {
      setQuote(null);
      return;
    }
    let active = true;
    setError('');
    api('cart/quote', { items, mode: live ? 'LIVE' : 'DEMO' })
      .then((q) => {
        if (active) setQuote(q);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [items, opened, live]);
  const update = useCallback(
    (id: string, quantity: number) =>
      setItems((old) =>
        quantity <= 0
          ? old.filter((i) => i.variantId !== id)
          : old.map((i) => (i.variantId === id ? { ...i, quantity: Math.min(20, quantity) } : i)),
      ),
    [],
  );
  const put = (id: string, quantity: number) =>
    setItems((old) => {
      const match = old.find((i) => i.variantId === id);
      return match
        ? old.map((i) =>
            i.variantId === id ? { ...i, quantity: Math.min(20, i.quantity + quantity) } : i,
          )
        : [...old, { variantId: id, quantity }];
    });
  const add = (id: string, quantity = 1) => {
    put(id, quantity);
    setMessage('Added to your bag');
    setOpened(true);
  };
  const buyNow = (id: string, quantity = 1) => {
    if (!items.some((i) => i.variantId === id)) put(id, quantity);
    router.push('/checkout');
  };
  const toggleWish = (id: string) => {
    const next = wishlist.includes(id) ? wishlist.filter((i) => i !== id) : [...wishlist, id];
    setWishlist(next);
    api('account', { action: 'wishlist', ids: next }).catch(() => {});
    setMessage(next.includes(id) ? 'Saved to your wishlist' : 'Removed from your wishlist');
  };
  return (
    <Context.Provider
      value={{
        items,
        wishlist,
        add,
        buyNow,
        live,
        update,
        clear: () => setItems([]),
        toggleWish,
        open: () => setOpened(true),
        notify: setMessage,
        ready,
      }}
    >
      {children}
      <Dialog.Root open={opened} onOpenChange={setOpened}>
        <Dialog.Portal>
          <Dialog.Overlay className="drawer-overlay" />
          <Dialog.Content className="cart-drawer">
            <div className="drawer-head">
              <Dialog.Title>
                Your bag <span>({items.reduce((s, i) => s + i.quantity, 0)})</span>
              </Dialog.Title>
              <Dialog.Close aria-label="Close bag" className="icon-button">
                <X />
              </Dialog.Close>
            </div>
            <Dialog.Description className="muted">
              A little Mithila, on its way to your table.
            </Dialog.Description>
            {!items.length ? (
              <div className="empty">
                <ShoppingBag size={40} />
                <h3>Your bag is waiting</h3>
                <p>Find something familiar in our collection.</p>
                <Dialog.Close asChild>
                  <Link className="button" href="/shop">
                    Explore ghee
                  </Link>
                </Dialog.Close>
              </div>
            ) : (
              <>
                {error && <p className="error">{error}</p>}
                <div className="drawer-items">
                  {quote?.items.map((item) => (
                    <div className="bag-item" key={item.variantId}>
                      <Image src={item.image} alt={item.name} width={80} height={90} />
                      <div>
                        <Link href={`/products/${item.slug}`}>
                          <strong>{item.name}</strong>
                        </Link>
                        <p>{item.label}</p>
                        <div className="quantity">
                          <button
                            aria-label={`Decrease ${item.name}`}
                            onClick={() => update(item.variantId, item.quantity - 1)}
                          >
                            <Minus size={13} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            aria-label={`Increase ${item.name}`}
                            onClick={() => update(item.variantId, item.quantity + 1)}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="bag-price">
                        {money(item.total)}
                        <button
                          className="icon-button"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => update(item.variantId, 0)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {!quote && !error && <p>Calculating your bag…</p>}
                  {error &&
                    items.map((i) => (
                      <button
                        className="text-link"
                        key={i.variantId}
                        onClick={() => update(i.variantId, 0)}
                      >
                        Remove unavailable item
                      </button>
                    ))}
                </div>
                <div className="drawer-bottom">
                  <div className="total-line">
                    <span>Subtotal</span>
                    <strong>{quote ? money(quote.subtotal) : '—'}</strong>
                  </div>
                  <p className="muted small">
                    {live
                      ? 'Shipping and taxes are calculated at checkout.'
                      : 'Preview store. No payment is taken yet.'}
                  </p>
                  <ButtonLink href="/checkout">Checkout securely</ButtonLink>
                  <Link href="/cart" className="text-link">
                    View full bag →
                  </Link>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <AnimatePresence>
        {message && (
          <motion.div
            role="status"
            className="toast"
            initial={{ opacity: 0, y: reduce ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Check size={18} />
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </Context.Provider>
  );
}
