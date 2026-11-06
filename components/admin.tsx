'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import {
  LayoutDashboard,
  Package,
  Tags,
  Layers,
  Boxes,
  ShoppingBag,
  Users,
  MessageSquare,
  Mail,
  Ticket,
  Truck,
  PanelTop,
  ImageIcon,
  BarChart3,
  Settings,
  ArrowUpRight,
  LogOut,
  Plus,
  X,
  Download,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { Logo } from './shell';
import { api, Button } from './ui';
import { useStore } from './store-provider';
import { money, states } from '@/lib/utils';
const sections = [
  ['dashboard', 'Dashboard', LayoutDashboard],
  ['products', 'Products', Package],
  ['categories', 'Categories', Tags],
  ['subcategories', 'Subcategories', Layers],
  ['inventory', 'Inventory', Boxes],
  ['orders', 'Orders', ShoppingBag],
  ['customers', 'Customers', Users],
  ['activity', 'Activity log', Activity],
  ['enquiries', 'Customer queries', MessageSquare],
  ['messages', 'Contact messages', Mail],
  ['promotions', 'Promotions', Ticket],
  ['shipping', 'Shipping settings', Truck],
  ['content', 'Website content', PanelTop],
  ['images', 'Product images', ImageIcon],
  ['analytics', 'Sales analytics', BarChart3],
  ['settings', 'Store settings', Settings],
] as const;
const entities: Record<string, string> = {
  products: 'products',
  inventory: 'products',
  images: 'products',
  categories: 'categories',
  subcategories: 'categories',
  orders: 'orders',
  analytics: 'orders',
  customers: 'customers',
  activity: 'activity',
  enquiries: 'enquiries',
  messages: 'enquiries',
  promotions: 'coupons',
  shipping: 'shipping',
  content: 'settings',
  settings: 'settings',
};
const blankProduct = {
  name: '',
  hindiName: '',
  slug: '',
  categoryId: '',
  subcategory: '',
  shortDescription: '',
  description: '',
  status: 'DRAFT',
  featured: false,
  images: [],
  details: {
    ingredients: '',
    nutrition: '',
    storage: '',
    shelfLife: '',
    manufacturer: '',
    marketer: '',
    fssai: '',
    batch: '',
    mrp: '',
    netQuantity: '',
    regulatory: '',
    verified: false,
  },
  seoTitle: '',
  seoDescription: '',
  variants: [],
};
export function Admin({ section, name }: { section: string; name: string }) {
  const [data, setData] = useState<any[]>([]),
    [overview, setOverview] = useState<any>(null),
    [categories, setCategories] = useState<any[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [edit, setEdit] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState(''),
    [status, setStatus] = useState('');
  const store = useStore(),
    router = useRouter();
  const title = sections.find((s) => s[0] === section)?.[1] || 'Dashboard';
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, stats, cats] = await Promise.all([
        section === 'dashboard' ? Promise.resolve([]) : api(`admin/${entities[section]}`),
        api('admin/overview'),
        api('admin/categories'),
      ]);
      setData(rows);
      setOverview(stats);
      setCategories(cats);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [section]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api(`admin/${entities[section]}`, edit);
      setEdit(null);
      store.notify('Changes saved');
      await refresh();
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const patch = (key: string, value: any) => setEdit((old: any) => ({ ...old, [key]: value }));
  const newRecord = () => {
    if (['products', 'images', 'inventory'].includes(section))
      setEdit({ ...blankProduct, categoryId: categories.find((c) => !c.parentId)?.id || '' });
    else if (['categories', 'subcategories'].includes(section))
      setEdit({
        name: '',
        slug: '',
        description: '',
        image: '',
        sortOrder: 0,
        parentId:
          section === 'subcategories' ? categories.find((c) => !c.parentId)?.id || null : null,
      });
    else if (section === 'promotions')
      setEdit({ code: '', percent: 10, minimum: 0, active: true, expiresAt: null });
    else if (section === 'shipping')
      setEdit({
        name: '',
        states: [],
        pincodes: [],
        base: 0,
        perKg: 0,
        freeAbove: null,
        active: false,
      });
  };
  const rows = data
    .filter(
      (row) =>
        (!filter || JSON.stringify(row).toLowerCase().includes(filter.toLowerCase())) &&
        (!status || row.status === status || row.mode === status),
    )
    .filter((row) =>
      section === 'categories'
        ? !row.parentId
        : section === 'subcategories'
          ? Boolean(row.parentId)
          : section === 'enquiries'
            ? row.type !== 'General enquiry'
            : section === 'messages'
              ? row.type === 'General enquiry'
              : true,
    );
  const upload = async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const response = await fetch('/api/admin/upload', { method: 'POST', body: form });
    const d = await response.json();
    if (!response.ok) throw new Error(d.error);
    return d.url;
  };
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Logo />
        <div className="admin-caption">STORE MANAGEMENT</div>
        <nav aria-label="Admin navigation">
          {sections.map(([key, label, Icon]) => (
            <Link
              href={key === 'dashboard' ? '/admin' : `/admin/${key}`}
              className={section === key ? 'active' : ''}
              key={key}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="admin-content">
        <div className="admin-topbar">
          <span>Maithilok / {title}</span>
          <div>
            <span className="status-pill">
              {overview?.launch.ready ? 'LIVE · TAKING ORDERS' : 'PREVIEW MODE'}
            </span>
            <Link href="/" target="_blank">
              View storefront <ArrowUpRight size={12} style={{ display: 'inline' }} />
            </Link>
            <button
              onClick={async () => {
                await api('auth/logout', {});
                router.push('/admin/login');
                router.refresh();
              }}
              aria-label="Sign out of admin"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
        <div className="admin-heading">
          <div>
            <h1>{section === 'dashboard' ? `Welcome back, ${name}.` : title}</h1>
            <p>
              {section === 'dashboard'
                ? 'A clear view of your store, and what’s next.'
                : section === 'activity'
                  ? 'Every sign-up, sign-in, order, payment and message, newest first.'
                  : 'Manage your Maithilok store.'}
            </p>
          </div>
          {['products', 'categories', 'subcategories', 'promotions', 'shipping'].includes(
            section,
          ) && (
            <Button onClick={newRecord}>
              <Plus size={16} />
              Add{' '}
              {section === 'promotions'
                ? 'coupon'
                : section === 'shipping'
                  ? 'rule'
                  : section === 'subcategories'
                    ? 'subcategory'
                    : section.slice(0, -1)}
            </Button>
          )}
          {section === 'orders' && (
            <Button
              className="secondary"
              onClick={() => window.location.assign('/api/admin/export')}
            >
              <Download size={16} />
              Export CSV
            </Button>
          )}
        </div>
        {error && !edit && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <p>Loading store data…</p>
        ) : (
          <>
            {section === 'dashboard' && overview && (
              <>
                <div className="stat-grid">
                  {[
                    ['Products', overview.products],
                    ['Orders', overview.orders],
                    ['Live revenue', money(overview.revenue)],
                    ['Open enquiries', overview.enquiries],
                    ['Pending orders', overview.pending],
                    ['Customers', overview.customers],
                    ['Sign-ups (24h)', overview.signupsToday],
                    ['Demo orders', overview.demoOrders],
                    ['Stock alerts', overview.lowStock.length],
                  ].map(([label, value]) => (
                    <div className="stat-card" key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
                <div className="admin-grid">
                  <div className="admin-panel">
                    <div className="section-heading">
                      <h2>Recent activity</h2>
                      <Link className="text-link" href="/admin/activity">
                        View all →
                      </Link>
                    </div>
                    {overview.recentActivity.length ? (
                      <ul className="activity-feed">
                        {overview.recentActivity.map((a: any) => (
                          <li key={a.id}>
                            <span className={`activity-type t-${a.type.toLowerCase()}`}>
                              {human(a.type.toLowerCase().replaceAll('_', ' '))}
                            </span>
                            <span>{a.message}</span>
                            <time>
                              {new Date(a.createdAt).toLocaleString('en-IN', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </time>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="small">Sign-ups, orders and messages will appear here.</p>
                    )}
                  </div>
                  <div className="admin-panel">
                    <span className="eyebrow">BEFORE YOUR FIRST REAL SALE</span>
                    <h2>Launch readiness</h2>
                    <p className="small">
                      Real checkout stays blocked until all checks pass. Database approvals require
                      verified owner information.
                    </p>
                    <ul className="readiness-list">
                      {overview.launch.missing.map((m: string) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                    {overview.launch.ready && (
                      <p>
                        <ShieldCheck size={18} /> Configuration checks passed.
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="admin-panel">
                      <h2>Your next steps</h2>
                      <p className="small">
                        Finalize food disclosures, replace concept packaging with approved
                        photography, configure delivery, review policies and complete payment
                        onboarding.
                      </p>
                      <Link className="text-link" href="/admin/settings">
                        Open store settings →
                      </Link>
                    </div>
                    <div className="admin-panel">
                      <h2>Connected services</h2>
                      <p className="small">
                        Email:{' '}
                        <strong>
                          {overview.mailConfigured
                            ? 'Gmail connected · alerts go to your inbox'
                            : 'Not configured · set GMAIL_USER and GMAIL_APP_PASSWORD'}
                        </strong>
                      </p>
                      <p className="small">
                        Set real stock in Inventory. Paid orders reduce stock automatically; unpaid
                        orders release their stock after 30 minutes.
                      </p>
                      <Link className="text-link" href="/admin/inventory">
                        Review inventory →
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
            {['products', 'images', 'inventory'].includes(section) && (
              <>
                <Filters
                  filter={filter}
                  setFilter={setFilter}
                  status={status}
                  setStatus={setStatus}
                  choices={['ACTIVE', 'COMING_SOON', 'DRAFT']}
                />
                <Table
                  headers={
                    section === 'inventory'
                      ? ['Product / SKU', 'Variant', 'Stock', 'Price', 'Action']
                      : ['Product', 'Category', 'Status', 'Variants', 'Action']
                  }
                  rows={
                    section === 'inventory'
                      ? rows.flatMap((p) =>
                          p.variants.map((v: any) => (
                            <tr key={v.id}>
                              <td>
                                {p.name}
                                <small>{v.sku}</small>
                              </td>
                              <td>{v.label}</td>
                              <td>
                                <span className="status-pill">{v.stock} units</span>
                              </td>
                              <td>{money(v.price)}</td>
                              <td>
                                <button
                                  className="text-link"
                                  onClick={() => setEdit(structuredClone(p))}
                                >
                                  Update stock
                                </button>
                              </td>
                            </tr>
                          )),
                        )
                      : rows.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <div className="table-product">
                                <Image
                                  src={p.images[0] || '/branding/symbol.svg'}
                                  width={40}
                                  height={45}
                                  alt=""
                                />
                                <div>
                                  {p.name}
                                  <small>{p.slug}</small>
                                </div>
                              </div>
                            </td>
                            <td>{p.category.name}</td>
                            <td>
                              <span className="status-pill">{p.status.replaceAll('_', ' ')}</span>
                            </td>
                            <td>
                              {p.variants.length
                                ? p.variants
                                    .map((v: any) => `${v.label}: ${money(v.price)}`)
                                    .join(' · ')
                                : 'No purchasable variants'}
                            </td>
                            <td>
                              <button
                                className="text-link"
                                onClick={() => setEdit(structuredClone(p))}
                              >
                                {section === 'images' ? 'Manage images' : 'Edit product'}
                              </button>
                            </td>
                          </tr>
                        ))
                  }
                />
              </>
            )}
            {['categories', 'subcategories'].includes(section) && (
              <Table
                headers={['Name', 'Slug', 'Parent', 'Order', 'Action']}
                rows={rows.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.slug}</td>
                    <td>{categories.find((p) => p.id === c.parentId)?.name || 'Top level'}</td>
                    <td>{c.sortOrder}</td>
                    <td>
                      <button className="text-link" onClick={() => setEdit(c)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              />
            )}
            {section === 'orders' && (
              <>
                <Filters
                  filter={filter}
                  setFilter={setFilter}
                  status={status}
                  setStatus={setStatus}
                  choices={[
                    'DEMO',
                    'LIVE',
                    'PLACED',
                    'PROCESSING',
                    'SHIPPED',
                    'DELIVERED',
                    'CANCELLED',
                    'REFUND_REQUESTED',
                  ]}
                />
                <Table
                  headers={['Order', 'Customer', 'Total', 'Payment', 'Fulfillment', 'Action']}
                  rows={rows.map((o) => (
                    <tr key={o.id}>
                      <td>
                        {o.number}
                        <small>
                          {new Date(o.createdAt).toLocaleDateString('en-IN')} · {o.mode}
                        </small>
                      </td>
                      <td>
                        {o.address.name}
                        <small>{o.email}</small>
                      </td>
                      <td>{money(o.total)}</td>
                      <td>{o.paymentStatus}</td>
                      <td>
                        <span className="status-pill">{o.status}</span>
                      </td>
                      <td>
                        <button className="text-link" onClick={() => setEdit(o)}>
                          View order
                        </button>
                      </td>
                    </tr>
                  ))}
                />
              </>
            )}
            {section === 'customers' && (
              <>
                <Filters filter={filter} setFilter={setFilter} />
                <Table
                  headers={['Customer', 'Email', 'Mobile', 'Orders', 'Joined']}
                  rows={rows.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.email}</td>
                      <td>{c.phone || '—'}</td>
                      <td>{c._count.orders}</td>
                      <td>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                />
              </>
            )}
            {section === 'activity' && (
              <>
                <Filters
                  filter={filter}
                  setFilter={setFilter}
                  status={status}
                  setStatus={setStatus}
                  choices={[
                    'SIGNUP',
                    'LOGIN',
                    'LOGIN_FAILED',
                    'ADMIN_LOGIN',
                    'ORDER_PLACED',
                    'PAYMENT_CAPTURED',
                    'PAYMENT_FAILED',
                    'REFUND',
                    'ENQUIRY',
                    'NEWSLETTER',
                    'PASSWORD_RESET',
                  ]}
                />
                <Table
                  headers={['Time', 'Event', 'Details', 'Email', 'IP']}
                  rows={data
                    .filter(
                      (a) =>
                        (!filter ||
                          JSON.stringify(a).toLowerCase().includes(filter.toLowerCase())) &&
                        (!status || a.type === status),
                    )
                    .map((a) => (
                      <tr key={a.id}>
                        <td>
                          {new Date(a.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td>
                          <span className={`activity-type t-${a.type.toLowerCase()}`}>
                            {a.type.replaceAll('_', ' ')}
                          </span>
                        </td>
                        <td>{a.message}</td>
                        <td>{a.email || '—'}</td>
                        <td>{a.ip || '—'}</td>
                      </tr>
                    ))}
                />
              </>
            )}
            {['enquiries', 'messages'].includes(section) && (
              <>
                <Filters
                  filter={filter}
                  setFilter={setFilter}
                  status={status}
                  setStatus={setStatus}
                  choices={['OPEN', 'RESOLVED']}
                />
                <Table
                  headers={['From', 'Subject', 'Type', 'Status', 'Action']}
                  rows={rows.map((e) => (
                    <tr key={e.id}>
                      <td>
                        {e.name}
                        <small>{e.email}</small>
                      </td>
                      <td>{e.subject}</td>
                      <td>{e.type}</td>
                      <td>
                        <span className="status-pill">{e.status}</span>
                      </td>
                      <td>
                        <button className="text-link" onClick={() => setEdit(e)}>
                          Open enquiry
                        </button>
                      </td>
                    </tr>
                  ))}
                />
              </>
            )}
            {section === 'promotions' && (
              <Table
                headers={['Code', 'Discount', 'Minimum', 'Status', 'Action']}
                rows={rows.map((c) => (
                  <tr key={c.id}>
                    <td>{c.code}</td>
                    <td>{c.percent}%</td>
                    <td>{money(c.minimum)}</td>
                    <td>{c.active ? 'Active' : 'Disabled'}</td>
                    <td>
                      <button className="text-link" onClick={() => setEdit(c)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              />
            )}
            {section === 'shipping' && (
              <>
                <p className="notice">
                  No shipping charges are invented. Add owner-approved rules here. An empty state or
                  PIN list matches all destinations; order-specific rules are evaluated in creation
                  order. Rates are in paise.
                </p>
                <Table
                  headers={['Zone', 'States / PINs', 'Base', 'Per kg', 'Status', 'Action']}
                  rows={rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>
                        {r.states.length ? r.states.join(', ') : 'All states'}
                        <small>
                          {r.pincodes.length ? `${r.pincodes.length} PIN codes` : 'All PIN codes'}
                        </small>
                      </td>
                      <td>{money(r.base)}</td>
                      <td>{money(r.perKg)}</td>
                      <td>{r.active ? 'Active' : 'Disabled'}</td>
                      <td>
                        <button className="text-link" onClick={() => setEdit(r)}>
                          Edit rule
                        </button>
                      </td>
                    </tr>
                  ))}
                />
              </>
            )}
            {['settings', 'content'].includes(section) && (
              <>
                {data
                  .filter((s) =>
                    section === 'settings'
                      ? ['store', 'policies'].includes(s.key)
                      : s.key === 'content',
                  )
                  .map((s) => (
                    <div className="admin-panel" key={s.key}>
                      <div className="section-heading">
                        <h2>
                          {s.key === 'store'
                            ? 'Business & launch settings'
                            : s.key === 'policies'
                              ? 'Policy drafts'
                              : 'Homepage & brand story'}
                        </h2>
                        <Button className="secondary" onClick={() => setEdit(structuredClone(s))}>
                          Edit settings
                        </Button>
                      </div>
                      {Object.entries(s.value).map(([k, v]) => (
                        <p className="small" key={k}>
                          <strong>{human(k)}:</strong>{' '}
                          {typeof v === 'boolean'
                            ? v
                              ? 'Enabled'
                              : 'Not approved'
                            : String(v) || 'Awaiting owner information'}
                        </p>
                      ))}
                    </div>
                  ))}
              </>
            )}
            {section === 'analytics' && (
              <>
                <div className="stat-grid">
                  {[
                    ['Verified live revenue', money(overview.revenue)],
                    [
                      'Live paid orders',
                      data.filter((o) => o.mode === 'LIVE' && o.paymentStatus === 'PAID').length,
                    ],
                    ['Demo simulations', overview.demoOrders],
                    ['Total customers', overview.customers],
                  ].map(([k, v]) => (
                    <div className="stat-card" key={k}>
                      <span>{k}</span>
                      <strong>{v}</strong>
                    </div>
                  ))}
                </div>
                <div className="admin-panel">
                  <h2>Live sales by month</h2>
                  <p className="small">
                    Only captured, server-verified live payments count. No demo sales are included.
                  </p>
                  <div className="admin-chart">
                    {Array.from({ length: 6 }, (_, i) => {
                      const date = new Date();
                      date.setMonth(date.getMonth() - 5 + i);
                      const total = data
                        .filter(
                          (o) =>
                            o.mode === 'LIVE' &&
                            o.paymentStatus === 'PAID' &&
                            new Date(o.createdAt).getMonth() === date.getMonth() &&
                            new Date(o.createdAt).getFullYear() === date.getFullYear(),
                        )
                        .reduce((s, o) => s + o.total, 0);
                      return (
                        <div
                          className="chart-bar"
                          key={i}
                          style={{ height: Math.max(4, Math.min(150, total / 1000)) }}
                        >
                          <strong>{money(total)}</strong>
                          <span>{date.toLocaleDateString('en-IN', { month: 'short' })}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ height: 20 }} />
                </div>
              </>
            )}
          </>
        )}
        <Dialog.Root
          open={Boolean(edit)}
          onOpenChange={(open) => {
            if (!open) {
              setEdit(null);
              setError('');
            }
          }}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="drawer-overlay" />
            <Dialog.Content className="admin-modal">
              <div className="drawer-head">
                <Dialog.Title>
                  {edit?.id ? 'Edit' : 'Manage'} {title.toLowerCase()}
                </Dialog.Title>
                <Dialog.Close className="icon-button" aria-label="Close editor">
                  <X />
                </Dialog.Close>
              </div>
              <Dialog.Description>
                Save changes to the Maithilok database. All amounts are in paise (₹1 = 100 paise).
              </Dialog.Description>
              {edit && (
                <form className="admin-form" onSubmit={save}>
                  {['products', 'inventory', 'images'].includes(section) && (
                    <>
                      <div className="admin-form-grid">
                        {[
                          'name',
                          'hindiName',
                          'slug',
                          'shortDescription',
                          'seoTitle',
                          'seoDescription',
                        ].map((k) => (
                          <Field
                            key={k}
                            name={human(k)}
                            value={edit[k]}
                            onChange={(v) => patch(k, v)}
                            required={['name', 'slug', 'shortDescription'].includes(k)}
                          />
                        ))}
                        <label>
                          Category
                          <select
                            value={edit.categoryId}
                            onChange={(e) => patch('categoryId', e.target.value)}
                          >
                            {categories
                              .filter((c) => !c.parentId)
                              .map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                          </select>
                        </label>
                        <label>
                          Subcategory
                          <select
                            value={edit.subcategory}
                            onChange={(e) => patch('subcategory', e.target.value)}
                          >
                            <option value="">None</option>
                            {categories
                              .filter((c) => c.parentId === edit.categoryId)
                              .map((c) => (
                                <option key={c.id}>{c.name}</option>
                              ))}
                          </select>
                        </label>
                        <label>
                          Status
                          <select
                            value={edit.status}
                            onChange={(e) => patch('status', e.target.value)}
                          >
                            <option>DRAFT</option>
                            <option>ACTIVE</option>
                            <option>COMING_SOON</option>
                          </select>
                        </label>
                        <label className="check-label">
                          <input
                            type="checkbox"
                            checked={edit.featured}
                            onChange={(e) => patch('featured', e.target.checked)}
                          />
                          Featured on homepage
                        </label>
                        <label className="wide">
                          Description
                          <textarea
                            required
                            value={edit.description}
                            onChange={(e) => patch('description', e.target.value)}
                          />
                        </label>
                      </div>
                      <h3>Images</h3>
                      <p className="small">
                        Upload JPEG, PNG or WebP up to 5 MB. The first image is the catalogue cover.
                        Existing files are preserved when removed from the gallery.
                      </p>
                      <div className="image-manager">
                        {edit.images.map((src: string, i: number) => (
                          <div key={src + i}>
                            <Image src={src} width={90} height={100} alt={`Image ${i + 1}`} />
                            <button
                              type="button"
                              aria-label={`Remove image ${i + 1}`}
                              onClick={() =>
                                patch(
                                  'images',
                                  edit.images.filter((_: string, j: number) => i !== j),
                                )
                              }
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <label className="upload-field">
                        Upload a product image
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={async (e) => {
                            if (!e.target.files?.[0]) return;
                            setBusy(true);
                            try {
                              patch('images', [...edit.images, await upload(e.target.files[0])]);
                            } catch (e) {
                              setError((e as Error).message);
                            } finally {
                              setBusy(false);
                            }
                          }}
                        />
                      </label>
                      <h3>Variants & stock</h3>
                      <p className="small">
                        Coming-soon products must have no priced variants. Stock in the seeded
                        catalogue is for demo testing.
                      </p>
                      {edit.variants.map((v: any, i: number) => (
                        <div className="variant-editor" key={v.id || i}>
                          {[
                            ['label', 'Size'],
                            ['sku', 'SKU'],
                            ['weight', 'Weight (grams)'],
                            ['price', 'Price (paise)'],
                            ['compareAt', 'Compare-at (optional paise)'],
                            ['stock', 'Stock quantity'],
                          ].map(([key, label]) => (
                            <Field
                              key={key}
                              name={label}
                              type={
                                ['weight', 'price', 'stock', 'compareAt'].includes(key)
                                  ? 'number'
                                  : 'text'
                              }
                              value={v[key] ?? ''}
                              onChange={(value) =>
                                patch(
                                  'variants',
                                  edit.variants.map((a: any, j: number) =>
                                    j === i
                                      ? {
                                          ...a,
                                          [key]: ['weight', 'price', 'stock', 'compareAt'].includes(
                                            key,
                                          )
                                            ? value === '' && key === 'compareAt'
                                              ? null
                                              : Number(value)
                                            : value,
                                        }
                                      : a,
                                  ),
                                )
                              }
                            />
                          ))}
                          <label>
                            Variant image
                            <select
                              value={v.image || ''}
                              onChange={(e) =>
                                patch(
                                  'variants',
                                  edit.variants.map((a: any, j: number) =>
                                    j === i ? { ...a, image: e.target.value } : a,
                                  ),
                                )
                              }
                            >
                              <option value="">Use cover image</option>
                              {edit.images.map((src: string, j: number) => (
                                <option key={src} value={src}>
                                  Gallery image {j + 1}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button
                            className="text-link"
                            type="button"
                            onClick={() =>
                              patch(
                                'variants',
                                edit.variants.filter((_: any, j: number) => i !== j),
                              )
                            }
                          >
                            Remove variant from draft
                          </button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        className="secondary"
                        onClick={() =>
                          patch('variants', [
                            ...edit.variants,
                            { label: '', sku: '', weight: 500, price: 0, stock: 0, image: '' },
                          ])
                        }
                      >
                        <Plus size={15} />
                        Add variant
                      </Button>
                      <h3>Food disclosures · unpublished until verified</h3>
                      <div className="admin-form-grid">
                        {[
                          'ingredients',
                          'nutrition',
                          'storage',
                          'shelfLife',
                          'manufacturer',
                          'marketer',
                          'fssai',
                          'batch',
                          'mrp',
                          'netQuantity',
                          'regulatory',
                        ].map((k) => (
                          <Field
                            key={k}
                            name={human(k)}
                            value={edit.details[k] || ''}
                            onChange={(v) => patch('details', { ...edit.details, [k]: v })}
                          />
                        ))}
                        <label className="check-label wide">
                          <input
                            type="checkbox"
                            checked={edit.details.verified === true}
                            onChange={(e) =>
                              patch('details', { ...edit.details, verified: e.target.checked })
                            }
                          />
                          Owner has verified these disclosures for publication
                        </label>
                      </div>
                    </>
                  )}
                  {['categories', 'subcategories'].includes(section) && (
                    <div className="admin-form-grid">
                      {['name', 'slug', 'description', 'image'].map((k) => (
                        <Field
                          key={k}
                          name={human(k)}
                          value={edit[k]}
                          onChange={(v) => patch(k, v)}
                          required={['name', 'slug'].includes(k)}
                        />
                      ))}
                      <Field
                        name="Display order"
                        type="number"
                        value={edit.sortOrder}
                        onChange={(v) => patch('sortOrder', Number(v))}
                      />
                      <label>
                        Parent category
                        <select
                          value={edit.parentId || ''}
                          onChange={(e) => patch('parentId', e.target.value || null)}
                        >
                          <option value="">Top-level category</option>
                          {categories
                            .filter((c) => !c.parentId && c.id !== edit.id)
                            .map((c) => (
                              <option value={c.id} key={c.id}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label className="upload-field">
                        Category image
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={async (e) => {
                            if (e.target.files?.[0])
                              try {
                                patch('image', await upload(e.target.files[0]));
                              } catch (e) {
                                setError((e as Error).message);
                              }
                          }}
                        />
                      </label>
                    </div>
                  )}
                  {section === 'orders' && (
                    <>
                      <div className="notice">
                        {edit.mode === 'DEMO'
                          ? 'Demo simulation: no payment or shipment exists.'
                          : 'Live order: only verified captured payments can ship. Refund requests must be processed in the payment provider; this dashboard never falsely marks a refund complete.'}
                      </div>
                      <h3>{edit.number}</h3>
                      <p>
                        {edit.address.name} · {edit.email} · {edit.address.phone}
                        <br />
                        {edit.address.house}, {edit.address.street}, {edit.address.city},{' '}
                        {edit.address.state} {edit.address.pin}
                      </p>
                      <Table
                        headers={['Product', 'Quantity', 'Total']}
                        rows={edit.items.map((i: any) => (
                          <tr key={i.variantId}>
                            <td>
                              {i.name} · {i.label}
                            </td>
                            <td>{i.quantity}</td>
                            <td>{money(i.total)}</td>
                          </tr>
                        ))}
                      />
                      <p>
                        Total: <strong>{money(edit.total)}</strong> · Payment:{' '}
                        <strong>{edit.paymentStatus}</strong>
                      </p>
                      <div className="admin-form-grid">
                        <label>
                          Fulfillment status
                          <select
                            value={edit.status}
                            onChange={(e) => patch('status', e.target.value)}
                          >
                            {[
                              'PLACED',
                              'PROCESSING',
                              'SHIPPED',
                              'DELIVERED',
                              'CANCELLED',
                              'REFUND_REQUESTED',
                            ].map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </label>
                        {['courier', 'trackingCode', 'trackingUrl'].map((k) => (
                          <Field
                            key={k}
                            name={human(k)}
                            value={edit[k]}
                            onChange={(v) => patch(k, v)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  {['enquiries', 'messages'].includes(section) && (
                    <>
                      <h3>{edit.subject}</h3>
                      <p className="small">
                        {edit.name} · {edit.email} · {edit.mobile || 'No mobile supplied'} ·{' '}
                        {edit.type}
                      </p>
                      <div className="notice" style={{ whiteSpace: 'pre-wrap' }}>
                        {edit.message}
                      </div>
                      <label>
                        Status
                        <select
                          value={edit.status}
                          onChange={(e) => patch('status', e.target.value)}
                        >
                          <option>OPEN</option>
                          <option>RESOLVED</option>
                        </select>
                      </label>
                      <label>
                        Response draft
                        <textarea
                          value={edit.reply}
                          onChange={(e) => patch('reply', e.target.value)}
                        />
                      </label>
                      <label className="check-label">
                        <input
                          type="checkbox"
                          checked={edit.send || false}
                          onChange={(e) => patch('send', e.target.checked)}
                          disabled={!overview?.mailConfigured}
                        />
                        Send response by configured email when saving
                      </label>
                      {!overview?.mailConfigured && (
                        <p className="small">
                          SMTP is not configured. You can save a response draft; nothing will be
                          sent.
                        </p>
                      )}
                    </>
                  )}
                  {section === 'promotions' && (
                    <div className="admin-form-grid">
                      <Field
                        name="Coupon code"
                        value={edit.code}
                        onChange={(v) => patch('code', v.toUpperCase())}
                        required
                      />
                      <Field
                        name="Percentage discount (1–90)"
                        type="number"
                        value={edit.percent}
                        onChange={(v) => patch('percent', Number(v))}
                      />
                      <Field
                        name="Minimum subtotal (paise)"
                        type="number"
                        value={edit.minimum}
                        onChange={(v) => patch('minimum', Number(v))}
                      />
                      <Field
                        name="Expiry date (optional)"
                        type="date"
                        value={edit.expiresAt ? edit.expiresAt.slice(0, 10) : ''}
                        onChange={(v) =>
                          patch('expiresAt', v ? new Date(v + 'T23:59:59Z').toISOString() : null)
                        }
                      />
                      <label className="check-label">
                        <input
                          type="checkbox"
                          checked={edit.active}
                          onChange={(e) => patch('active', e.target.checked)}
                        />
                        Active
                      </label>
                    </div>
                  )}
                  {section === 'shipping' && (
                    <div className="admin-form-grid">
                      <Field
                        name="Zone / rule name"
                        value={edit.name}
                        onChange={(v) => patch('name', v)}
                        required
                      />
                      <Field
                        name="Base charge (paise)"
                        type="number"
                        value={edit.base}
                        onChange={(v) => patch('base', Number(v))}
                      />
                      <Field
                        name="Charge per rounded-up kg (paise)"
                        type="number"
                        value={edit.perKg}
                        onChange={(v) => patch('perKg', Number(v))}
                      />
                      <Field
                        name="Free-shipping subtotal (optional paise)"
                        type="number"
                        value={edit.freeAbove ?? ''}
                        onChange={(v) => patch('freeAbove', v === '' ? null : Number(v))}
                      />
                      <label>
                        States (Ctrl / Cmd to select several; none means all)
                        <select
                          multiple
                          size={6}
                          value={edit.states}
                          onChange={(e) =>
                            patch(
                              'states',
                              Array.from(e.target.selectedOptions, (o) => o.value),
                            )
                          }
                        >
                          {states.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        PIN codes (one per line, blank means all)
                        <textarea
                          value={edit.pincodes.join('\n')}
                          onChange={(e) =>
                            patch('pincodes', e.target.value.split('\n').filter(Boolean))
                          }
                        />
                      </label>
                      <label className="check-label">
                        <input
                          type="checkbox"
                          checked={edit.active}
                          onChange={(e) => patch('active', e.target.checked)}
                        />
                        Enable this shipping rule
                      </label>
                    </div>
                  )}
                  {['content', 'settings'].includes(section) && (
                    <>
                      <p className="notice">
                        Only approve legal and regulatory fields when the actual business
                        information has been verified. Live commerce also requires server
                        environment configuration.
                      </p>
                      <div className="admin-form-grid">
                        {Object.entries(edit.value).map(([k, v]) =>
                          typeof v === 'boolean' ? (
                            <label className="check-label" key={k}>
                              <input
                                type="checkbox"
                                checked={v}
                                onChange={(e) =>
                                  patch('value', { ...edit.value, [k]: e.target.checked })
                                }
                              />
                              {human(k)}
                            </label>
                          ) : [
                              'story',
                              'heroDescription',
                              'heroTitle',
                              'privacy',
                              'terms',
                              'shipping',
                              'returns',
                            ].includes(k) ? (
                            <label key={k} className="wide">
                              {human(k)}
                              <textarea
                                value={String(v)}
                                onChange={(e) =>
                                  patch('value', { ...edit.value, [k]: e.target.value })
                                }
                              />
                            </label>
                          ) : (
                            <Field
                              key={k}
                              name={human(k)}
                              value={String(v)}
                              disabled={['name', 'hindiName'].includes(k)}
                              onChange={(value) => patch('value', { ...edit.value, [k]: value })}
                            />
                          ),
                        )}
                      </div>
                      {edit.key === 'content' && (
                        <label className="upload-field">
                          Upload homepage banner
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={async (e) => {
                              if (e.target.files?.[0])
                                try {
                                  patch('value', {
                                    ...edit.value,
                                    heroImage: await upload(e.target.files[0]),
                                  });
                                } catch (e) {
                                  setError((e as Error).message);
                                }
                            }}
                          />
                        </label>
                      )}
                    </>
                  )}
                  {error && (
                    <p className="error" role="alert">
                      {error}
                    </p>
                  )}
                  <div className="admin-actions">
                    {edit.id && ['products', 'images', 'inventory'].includes(section) && (
                      <Button
                        type="button"
                        className="secondary"
                        onClick={async () => {
                          setBusy(true);
                          try {
                            await api('admin/archive', { id: edit.id });
                            setEdit(null);
                            await refresh();
                            store.notify('Product unpublished. All data is preserved.');
                            router.refresh();
                          } catch (e) {
                            setError((e as Error).message);
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        Unpublish / archive
                      </Button>
                    )}
                    <Button type="button" className="secondary" onClick={() => setEdit(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={busy}>
                      Save changes
                    </Button>
                  </div>
                </form>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
}
function human(s: string) {
  return s.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}
function Field({
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  disabled = false,
}: {
  name: string;
  value: any;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label>
      {name}
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        min={type === 'number' ? 0 : undefined}
      />
    </label>
  );
}
function Filters({
  filter,
  setFilter,
  status,
  setStatus,
  choices = [],
}: {
  filter: string;
  setFilter: (s: string) => void;
  status?: string;
  setStatus?: (s: string) => void;
  choices?: string[];
}) {
  return (
    <div className="admin-filter">
      <input
        aria-label="Filter records"
        placeholder="Search records…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      {setStatus && (
        <select
          aria-label="Filter status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {choices.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      )}
    </div>
  );
}
function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[] }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
      {!rows.length && (
        <div className="admin-empty">No records yet. New activity will appear here.</div>
      )}
    </div>
  );
}
