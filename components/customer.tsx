'use client';
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LockKeyhole,
  ArrowRight,
  Minus,
  Plus,
  Trash2,
  Package,
  UserRound,
  MapPin,
  LogOut,
  Mail,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { useStore } from './store-provider';
import { api, Button, ButtonLink, Heading, Empty } from './ui';
import { money, states } from '@/lib/utils';
import type { Quote } from '@/lib/types';
import { site, addressLine, telHref } from '@/lib/site';
const addressFields = [
  ['name', 'Full name', 'text'],
  ['phone', 'Mobile number', 'tel'],
  ['email', 'Email address', 'email'],
  ['house', 'House / building', 'text'],
  ['street', 'Street / locality', 'text'],
  ['city', 'City', 'text'],
  ['pin', 'PIN code', 'text'],
  ['landmark', 'Landmark (optional)', 'text'],
];
function Fields({ register, errors, fields }: { register: any; errors: any; fields: string[][] }) {
  return (
    <>
      {fields.map(([key, label, type]) => (
        <label key={key}>
          {label}
          <input
            {...register(key, {
              required: !label.includes('optional'),
              ...(key === 'pin'
                ? { pattern: /^[1-9]\d{5}$/ }
                : key === 'phone'
                  ? { pattern: /^[6-9]\d{9}$/ }
                  : {}),
            })}
            type={type}
            autoComplete={
              key === 'email'
                ? 'email'
                : key === 'name'
                  ? 'name'
                  : key === 'phone'
                    ? 'tel'
                    : undefined
            }
            maxLength={key === 'phone' ? 10 : key === 'pin' ? 6 : undefined}
          />
          {errors[key] && (
            <span className="field-error">Please enter a valid {label.toLowerCase()}.</span>
          )}
        </label>
      ))}
    </>
  );
}
function Summary({ quote }: { quote: Quote | null }) {
  return (
    <>
      {quote?.items.map((i) => (
        <div className="checkout-item" key={i.variantId}>
          <Image src={i.image} alt={i.name} width={58} height={65} />
          <div>
            <strong>{i.name}</strong>
            <span>
              {i.label} × {i.quantity}
            </span>
          </div>
          <strong>{money(i.total)}</strong>
        </div>
      ))}
      <div className="summary-lines">
        <div>
          <span>Subtotal</span>
          <span>{quote ? money(quote.subtotal) : '—'}</span>
        </div>
        <div>
          <span>Discount</span>
          <span>{quote ? `− ${money(quote.discount)}` : '—'}</span>
        </div>
        <div>
          <span>Shipping</span>
          <span>{quote ? money(quote.shipping) : '—'}</span>
        </div>
        <p>{quote?.shippingLabel}</p>
        <div className="grand-total">
          <strong>Total</strong>
          <strong>{quote ? money(quote.total) : '—'}</strong>
        </div>
      </div>
    </>
  );
}
export function Cart() {
  const store = useStore(),
    [quote, setQuote] = useState<Quote | null>(null),
    [error, setError] = useState(''),
    [coupon, setCoupon] = useState(''),
    [applied, setApplied] = useState('');
  useEffect(() => {
    if (!store.items.length) {
      setQuote(null);
      return;
    }
    let active = true;
    setError('');
    api('cart/quote', { items: store.items, coupon: applied, mode: store.live ? 'LIVE' : 'DEMO' })
      .then((d) => {
        if (active) setQuote(d);
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setQuote(null);
        }
      });
    return () => {
      active = false;
    };
  }, [store.items, applied, store.live]);
  if (!store.ready) return <div className="container page-space">Loading your bag…</div>;
  return (
    <div className="container page-space">
      <Heading eyebrow="SOMETHING GOOD IS IN THE BAG" title="Your shopping bag.">
        A few favourites, ready for your table.
      </Heading>
      {!store.items.length ? (
        <Empty title="Your bag is waiting">
          Explore our ghee collection and find your favourites.
        </Empty>
      ) : (
        <div className="checkout-layout">
          <div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {quote?.items.map((i) => (
              <div className="cart-line" key={i.variantId}>
                <Image src={i.image} alt={i.name} width={120} height={135} />
                <div>
                  <h3>
                    <Link href={`/products/${i.slug}`}>{i.name}</Link>
                  </h3>
                  <p>
                    {i.label} · {money(i.price)}
                  </p>
                  <div className="quantity">
                    <button
                      aria-label={`Decrease ${i.name}`}
                      onClick={() => store.update(i.variantId, i.quantity - 1)}
                    >
                      <Minus size={14} />
                    </button>
                    <span>{i.quantity}</span>
                    <button
                      aria-label={`Increase ${i.name}`}
                      onClick={() => store.update(i.variantId, i.quantity + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div>
                  <strong>{money(i.total)}</strong>
                  <button
                    className="icon-button"
                    aria-label={`Remove ${i.name}`}
                    onClick={() => store.update(i.variantId, 0)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {error &&
              store.items.map((i) => (
                <p key={i.variantId}>
                  Item ending {i.variantId.slice(-6)}{' '}
                  <button onClick={() => store.update(i.variantId, 0)} className="text-link">
                    Remove
                  </button>
                </p>
              ))}
            <Link href="/shop" className="text-link">
              ← Continue exploring
            </Link>
          </div>
          <aside className="summary-card">
            <h2>Order summary</h2>
            <Summary quote={quote} />
            <form
              className="coupon-form"
              onSubmit={(e) => {
                e.preventDefault();
                setApplied(coupon);
                sessionStorage.setItem('maithilok-coupon', coupon);
              }}
            >
              <input
                aria-label="Coupon code"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Coupon code"
              />
              <Button className="secondary" type="submit">
                Apply
              </Button>
            </form>
            {applied && (
              <button
                className="text-link"
                onClick={() => {
                  setApplied('');
                  setCoupon('');
                  sessionStorage.removeItem('maithilok-coupon');
                }}
              >
                Remove coupon
              </button>
            )}
            <ButtonLink href="/checkout">Proceed to checkout</ButtonLink>
            <p className="small muted">
              <LockKeyhole size={14} />
              {store.live
                ? 'Secure payment by Razorpay · UPI, cards, net banking'
                : 'Preview store · no payment will be taken'}
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
export function Checkout({ liveReady }: { liveReady: boolean }) {
  const store = useStore(),
    router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<any>({ defaultValues: { state: 'Bihar' } });
  const [quote, setQuote] = useState<Quote | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [mode, setMode] = useState<'DEMO' | 'LIVE'>(liveReady ? 'LIVE' : 'DEMO'),
    [addresses, setAddresses] = useState<any[]>([]),
    [idempotency, setIdempotency] = useState(() => crypto.randomUUID()),
    [coupon, setCoupon] = useState('');
  const state = watch('state'),
    pin = watch('pin');
  useEffect(() => {
    setCoupon(sessionStorage.getItem('maithilok-coupon') || '');
    api('account')
      .then((d) => {
        setAddresses(d.addresses);
        if (d.addresses[0]) reset(d.addresses[0].data);
        else reset({ state: 'Bihar', name: d.user.name, email: d.user.email, phone: d.user.phone });
      })
      .catch(() => {});
  }, [reset]);
  useEffect(() => {
    if (!store.items.length) return;
    let active = true;
    api('cart/quote', { items: store.items, coupon, state, pin, mode })
      .then((d) => {
        if (active) {
          setQuote(d);
          setError('');
        }
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setQuote(null);
        }
      });
    return () => {
      active = false;
    };
  }, [store.items, coupon, state, pin, mode]);
  const submit = async (address: any) => {
    setBusy(true);
    setError('');
    try {
      const d = await api('checkout', {
        items: store.items,
        coupon,
        address,
        mode,
        idempotencyKey: idempotency,
      });
      if (d.mode === 'DEMO') {
        sessionStorage.setItem(`maithilok-order-${d.orderNumber}`, d.token);
        store.clear();
        sessionStorage.removeItem('maithilok-coupon');
        router.push(`/order-confirmation?number=${d.orderNumber}&token=${d.token}`);
      } else {
        sessionStorage.setItem(`maithilok-order-${d.orderNumber}`, d.token);
        await new Promise<void>((resolve, reject) => {
          if ((window as any).Razorpay) return resolve();
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Unable to load payment provider'));
          document.body.appendChild(script);
        });
        const Razorpay = (window as any).Razorpay;
        const checkout = new Razorpay({
          key: d.key,
          amount: d.amount,
          currency: 'INR',
          name: 'Maithilok',
          description: 'Ghee from Darbhanga, Mithila',
          image: `${window.location.origin}/icons/icon-512.png`,
          theme: { color: '#173f35' },
          order_id: d.gatewayOrderId,
          prefill: { name: address.name, email: address.email, contact: address.phone },
          handler: async (result: any) => {
            try {
              await api('payments/verify', { ...result, token: d.token });
            } catch {}
            store.clear();
            sessionStorage.removeItem('maithilok-coupon');
            router.push(`/order-confirmation?number=${d.orderNumber}&token=${d.token}`);
          },
          modal: {
            ondismiss: () => {
              setIdempotency(crypto.randomUUID());
              setError('Payment was not completed. You can try again; you have not been charged.');
            },
          },
        });
        checkout.open();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (store.ready && !store.items.length)
    return (
      <div className="container page-space">
        <Empty title="Let’s start with your bag">Add a product before trying checkout.</Empty>
      </div>
    );
  return (
    <div className="container page-space">
      <Heading eyebrow="SECURE CHECKOUT" title="Almost there.">
        Enter your delivery details. No account needed.
      </Heading>
      <div className="notice">
        <LockKeyhole size={22} />
        <div>
          <strong>
            {mode === 'DEMO'
              ? 'Preview checkout · no payment or delivery'
              : 'Secure online payment · Razorpay'}
          </strong>
          <p>
            {mode === 'DEMO'
              ? 'Ordering opens soon. This places a preview order so you can see how it works; nothing is charged.'
              : 'Pay with UPI, debit/credit card, net banking or wallet. Your payment is verified on our server before the order is confirmed.'}
          </p>
        </div>
      </div>
      <div className="checkout-layout">
        <form id="checkout-form" className="form-card" onSubmit={handleSubmit(submit)}>
          <h2>Delivery details</h2>
          {addresses.length > 0 && (
            <label>
              Use a saved address
              <select
                onChange={(e) => {
                  const a = addresses.find((a) => a.id === e.target.value);
                  if (a) reset(a.data);
                }}
              >
                <option value="">Enter a new address</option>
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.data.house}, {a.data.city}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="form-grid">
            <Fields register={register} errors={errors} fields={addressFields} />
            <label>
              State / union territory
              <select {...register('state', { required: true })}>
                {states.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="check-label">
            <input type="checkbox" required />I agree to the{' '}
            <Link href="/terms-and-conditions">terms</Link> and{' '}
            <Link href="/return-refund-policy">refund policy</Link>
            {mode === 'DEMO' ? ' and understand this is a preview order' : ''}.
          </label>
          {liveReady && process.env.NEXT_PUBLIC_ALLOW_TEST_CHECKOUT === 'true' && (
            <label>
              Checkout mode
              <select value={mode} onChange={(e) => setMode(e.target.value as 'DEMO' | 'LIVE')}>
                <option value="LIVE">Online payment</option>
                <option value="DEMO">Preview (no payment)</option>
              </select>
            </label>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </form>
        <aside className="summary-card">
          <h2>Your order</h2>
          <Summary quote={quote} />
          <Button form="checkout-form" type="submit" loading={busy} disabled={!quote}>
            {mode === 'DEMO'
              ? 'Place preview order'
              : `Pay ${quote ? money(quote.total) : ''} securely`}
            <ArrowRight size={18} />
          </Button>
          <p className="small muted">
            {mode === 'DEMO'
              ? 'Preview only. ₹0 will be charged.'
              : 'Prepaid orders only. Cash on delivery is not available yet.'}
          </p>
        </aside>
      </div>
    </div>
  );
}
export function AuthForm({ mode = 'login', admin = false }: { mode?: string; admin?: boolean }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<any>();
  const [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [preview, setPreview] = useState(''),
    [busy, setBusy] = useState(false);
  const router = useRouter(),
    params = useSearchParams();
  const title =
    mode === 'register'
      ? 'A little closer to home.'
      : mode === 'forgot'
        ? 'Let’s get you back in.'
        : mode === 'reset'
          ? 'A fresh start.'
          : admin
            ? 'Welcome, store owner.'
            : 'Welcome back.';
  return (
    <div className="auth-page container">
      <div className="auth-story">
        <span className="eyebrow">MAITHILOK · मैथिल लोक</span>
        <h2>
          Familiar flavours.
          <br />
          New traditions.
          <br />
          <em>Your own little corner.</em>
        </h2>
        <p>Keep your favourite foods, addresses and orders together.</p>
        <Image src="/banners/ghee-hero.webp" width={600} height={340} alt="Maithilok ghee" />
      </div>
      <form
        className="form-card auth-form"
        onSubmit={handleSubmit(async (data) => {
          setBusy(true);
          setError('');
          try {
            const result = await api(`auth/${mode}`, {
              ...data,
              admin,
              token: params.get('token'),
            });
            if (mode === 'login' || mode === 'register') {
              router.push(admin ? '/admin' : '/account');
              router.refresh();
            } else {
              setMessage(result.message);
              setPreview(result.previewUrl || '');
            }
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        })}
      >
        <span className="eyebrow">
          {admin ? 'PRIVATE ADMINISTRATION' : 'YOUR MAITHILOK ACCOUNT'}
        </span>
        <h1>{title}</h1>
        <p>
          {mode === 'register'
            ? 'Create an account to save your addresses and follow your orders.'
            : mode === 'forgot'
              ? 'Enter your email and we’ll send you a link to reset your password.'
              : 'Good to have you here.'}
        </p>
        <Fields
          register={register}
          errors={errors}
          fields={[
            ...(mode === 'register' ? [['name', 'Full name', 'text']] : []),
            ...(mode !== 'reset' ? [['email', 'Email address', 'email']] : []),
            ...(!['forgot'].includes(mode)
              ? [
                  [
                    'password',
                    mode === 'register' || mode === 'reset'
                      ? 'Password (12+ characters)'
                      : 'Password',
                    'password',
                  ],
                ]
              : []),
          ]}
        />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
        {preview && (
          <p className="notice">
            Local development only: <Link href={preview}>Open reset link</Link>
          </p>
        )}
        <Button type="submit" loading={busy}>
          {mode === 'register'
            ? 'Create account'
            : mode === 'forgot'
              ? 'Request reset link'
              : mode === 'reset'
                ? 'Update password'
                : 'Sign in'}
          <ArrowRight size={17} />
        </Button>
        {mode === 'login' && (
          <>
            <Link className="text-link" href="/forgot-password">
              Forgot password?
            </Link>
            {!admin && (
              <p>
                New here? <Link href="/register">Create an account</Link>
              </p>
            )}
          </>
        )}
        {mode !== 'login' && (
          <Link className="text-link" href="/login">
            Back to sign in
          </Link>
        )}
        {admin && (
          <p className="small muted">
            Admin accounts are created with the setup command. There are no public credentials.
          </p>
        )}
      </form>
    </div>
  );
}
export function Contact() {
  const {
      register,
      handleSubmit,
      reset,
      formState: { errors },
    } = useForm<any>({ defaultValues: { type: 'General enquiry' } }),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <div className="container page-space">
      <Heading eyebrow="A CONVERSATION AWAY" title="We’re here to listen.">
        A product question, an order enquiry, or just a hello. Get in touch.
      </Heading>
      <div className="contact-layout">
        <div className="contact-details">
          <h2>Let’s talk Maithilok.</h2>
          <a href={telHref()}>
            <Phone />
            <span>
              Give us a call<strong>{site.phone}</strong>
            </span>
          </a>
          <a href={`mailto:${site.email}`}>
            <Mail />
            <span>
              Write to us<strong>{site.email}</strong>
            </span>
          </a>
          <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noreferrer">
            <MessageCircle />
            <span>
              A quick conversation<strong>Chat on WhatsApp ↗</strong>
            </span>
          </a>
          <div>
            <MapPin />
            <span>
              Our address<strong>{addressLine()}</strong>
            </span>
          </div>
          <p>Monday to Saturday, 10am – 7pm. We usually reply within one working day.</p>
        </div>
        <form
          className="form-card"
          onSubmit={handleSubmit(async (data) => {
            setBusy(true);
            setError('');
            try {
              const d = await api('enquiries', data);
              setMessage(d.message);
              reset();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          })}
        >
          <h2>Send a little note.</h2>
          <div className="form-grid">
            <Fields
              register={register}
              errors={errors}
              fields={[
                ['name', 'Full name', 'text'],
                ['email', 'Email address', 'email'],
                ['mobile', 'Mobile (optional)', 'tel'],
                ['subject', 'Subject', 'text'],
              ]}
            />
          </div>
          <label>
            How can we help?
            <select {...register('type')}>
              <option>General enquiry</option>
              <option>Product enquiry</option>
              <option>Order support</option>
            </select>
          </label>
          <label>
            Your message
            <textarea {...register('message', { required: true, minLength: 10 })} rows={5} />
            {errors.message && (
              <span className="field-error">Please write at least 10 characters.</span>
            )}
          </label>
          <p className="small muted">
            We use your details only to reply to you.{' '}
            <Link href="/privacy-policy">Privacy policy</Link>.
          </p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="notice">
              {message}
            </p>
          )}
          <Button loading={busy} type="submit">
            Send enquiry
            <ArrowRight size={17} />
          </Button>
        </form>
      </div>
    </div>
  );
}
export function Account({ section = 'overview' }: { section?: string }) {
  const [data, setData] = useState<any>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [adding, setAdding] = useState(false);
  const store = useStore(),
    router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({ defaultValues: { state: 'Bihar' } });
  const refresh = useCallback(
    () =>
      api('account')
        .then((d) => {
          setData(d);
          if (section === 'overview') reset({ name: d.user.name, phone: d.user.phone });
        })
        .catch((e) => setError(e.message)),
    [section, reset],
  );
  useEffect(() => {
    refresh();
  }, [refresh]);
  if (error && !data)
    return (
      <div className="container page-space">
        <Empty title="Your home at Maithilok" href="/login" action="Sign in">
          Sign in to view your profile, addresses and orders.
        </Empty>
      </div>
    );
  if (!data) return <div className="container page-space">Loading your account…</div>;
  return (
    <div className="container page-space">
      <Heading eyebrow="YOUR MAITHILOK" title={`Hello, ${data.user.name.split(' ')[0]}.`}>
        Your favourites, details and orders, together.
      </Heading>
      <div className="account-layout">
        <aside className="account-nav">
          {[
            ['overview', '/account', UserRound, 'Profile'],
            ['orders', '/account/orders', Package, 'My orders'],
            ['addresses', '/account/addresses', MapPin, 'Saved addresses'],
          ].map(([key, href, Icon, label]: any) => (
            <Link className={section === key ? 'active' : ''} key={key} href={href}>
              <Icon size={18} />
              {label}
            </Link>
          ))}
          <Link href="/wishlist">♡ Wishlist</Link>
          <button
            onClick={async () => {
              await api('auth/logout', {});
              router.push('/login');
              router.refresh();
            }}
          >
            <LogOut size={18} />
            Sign out
          </button>
        </aside>
        <div>
          {section === 'overview' && (
            <form
              className="form-card"
              onSubmit={handleSubmit(async (d) => {
                setBusy(true);
                try {
                  await api('account', { action: 'profile', ...d });
                  store.notify('Profile updated');
                  await refresh();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              })}
            >
              <h2>Your profile</h2>
              <p>{data.user.email}</p>
              <Fields
                register={register}
                errors={errors}
                fields={[
                  ['name', 'Full name', 'text'],
                  ['phone', 'Mobile (optional)', 'tel'],
                ]}
              />
              <Button loading={busy}>Save profile</Button>
            </form>
          )}
          {section === 'orders' &&
            (data.orders.length ? (
              <div className="order-list">
                {data.orders.map((o: any) => (
                  <Link href={`/track-order?number=${o.number}`} key={o.id} className="order-card">
                    <div>
                      <strong>{o.number}</strong>
                      <span>
                        {new Date(o.createdAt).toLocaleDateString('en-IN')} ·{' '}
                        {o.mode === 'DEMO' ? 'Preview order' : o.paymentStatus}
                      </span>
                    </div>
                    <span className="status-pill">{o.status}</span>
                    <strong>{money(o.total)}</strong>
                    <ArrowRight size={18} />
                  </Link>
                ))}
              </div>
            ) : (
              <Empty title="Your first chapter is waiting">
                You haven’t placed an order yet. Your ghee is waiting.
              </Empty>
            ))}
          {section === 'addresses' && (
            <>
              <div className="section-heading">
                <h2>Saved addresses</h2>
                <Button
                  onClick={() => {
                    reset({ state: 'Bihar', email: data.user.email, name: data.user.name });
                    setAdding(!adding);
                  }}
                >
                  {adding ? 'Close form' : 'Add address'}
                </Button>
              </div>
              {adding && (
                <form
                  className="form-card"
                  onSubmit={handleSubmit(async (address) => {
                    try {
                      await api('account', { action: 'address', address });
                      setAdding(false);
                      await refresh();
                      store.notify('Address saved');
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  })}
                >
                  <div className="form-grid">
                    <Fields register={register} errors={errors} fields={addressFields} />
                    <label>
                      State
                      <select {...register('state')}>
                        {states.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <Button>Save address</Button>
                </form>
              )}
              <div className="address-grid">
                {data.addresses.map((a: any) => (
                  <div className="form-card" key={a.id}>
                    <h3>{a.data.name}</h3>
                    <p>
                      {a.data.house}, {a.data.street}
                      <br />
                      {a.data.city}, {a.data.state} {a.data.pin}
                      <br />
                      {a.data.phone}
                    </p>
                    <button
                      className="text-link"
                      onClick={async () => {
                        await api('account', { action: 'deleteAddress', id: a.id });
                        refresh();
                      }}
                    >
                      Remove address
                    </button>
                  </div>
                ))}
              </div>
              {!data.addresses.length && !adding && (
                <p className="notice">
                  No addresses saved yet. Add one to make your next checkout easier.
                </p>
              )}
            </>
          )}
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    </div>
  );
}
export function OrderTracking({ confirmation = false }: { confirmation?: boolean }) {
  const params = useSearchParams();
  const [number, setNumber] = useState(params.get('number') || ''),
    [token, setToken] = useState(params.get('token') || ''),
    [order, setOrder] = useState<any>(null),
    [error, setError] = useState('');
  const track = useCallback(async (n: string, t: string) => {
    setError('');
    try {
      const d = await api(
        `orders/track?number=${encodeURIComponent(n)}&token=${encodeURIComponent(t)}`,
      );
      setOrder(d.order);
    } catch (e) {
      setError((e as Error).message);
      setOrder(null);
    }
  }, []);
  useEffect(() => {
    const n = params.get('number');
    if (n) track(n, params.get('token') || sessionStorage.getItem(`maithilok-order-${n}`) || '');
  }, [params, track]);
  return (
    <div className="container page-space narrow">
      <Heading
        eyebrow={confirmation ? 'YOUR MAITHILOK ORDER' : 'FOLLOW YOUR ORDER'}
        title={confirmation ? 'A little goodness, noted.' : 'Let’s find your order.'}
      >
        {confirmation
          ? 'Your order details are below. Keep your private tracking link safe.'
          : 'Use your order number and private tracking token, or sign in to your account.'}
      </Heading>
      {!confirmation && (
        <form
          className="form-card"
          onSubmit={(e) => {
            e.preventDefault();
            track(number, token);
          }}
        >
          <label>
            Order number
            <input required value={number} onChange={(e) => setNumber(e.target.value)} />
          </label>
          <label>
            Private tracking token (optional when signed in)
            <input value={token} onChange={(e) => setToken(e.target.value)} />
          </label>
          <Button>Find order</Button>
        </form>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {order && (
        <div className="form-card">
          <span className="status-pill">
            {order.mode === 'DEMO' ? 'PREVIEW ORDER · NO PAYMENT TAKEN' : order.paymentStatus}
          </span>
          <h2>{order.number}</h2>
          <p>
            {order.mode === 'DEMO'
              ? 'This is a preview order. No money has been charged and nothing will be shipped.'
              : order.paymentStatus === 'PAID'
                ? 'Thank you! Your payment is confirmed. We will email you when your order ships.'
                : 'We are waiting for payment confirmation. This usually takes a few seconds.'}
          </p>
          <div className="order-progress">
            {['PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((s, i) => (
              <div
                key={s}
                className={
                  ['PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].indexOf(order.status) >= i
                    ? 'complete'
                    : ''
                }
              >
                <span>{i + 1}</span>
                {s.toLowerCase()}
              </div>
            ))}
          </div>
          <p>
            Fulfillment: <strong>{order.status}</strong>
          </p>
          <p>
            Payment: <strong>{order.paymentStatus}</strong>
          </p>
          <Summary
            quote={{
              ...order,
              shippingLabel: order.mode === 'DEMO' ? 'Preview order' : '',
            }}
          />
          {order.courier && (
            <p>
              Courier: {order.courier} · {order.trackingCode}
            </p>
          )}
          {order.trackingUrl && (
            <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="text-link">
              Open courier tracking ↗
            </a>
          )}
          <p className="small">
            Keep this page URL private. It grants access to your order details.
          </p>
          <ButtonLink href="/shop">Continue exploring</ButtonLink>
        </div>
      )}
    </div>
  );
}
