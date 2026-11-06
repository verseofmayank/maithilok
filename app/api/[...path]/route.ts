import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import {
  checkOrigin,
  clientIp,
  createSession,
  currentUser,
  hash,
  rateLimit,
  requireAdmin,
} from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { orderText, paymentNotifications } from '@/lib/notifications';
import { site } from '@/lib/site';
import { addressSchema, cartSchema, email, enquirySchema, passwordSchema } from '@/lib/validation';
import { markPaid, quote, readiness, releaseStaleOrders } from '@/lib/commerce';
import { sendMail, mailConfigured, ownerEmail } from '@/lib/mail';
import { z, ZodError } from 'zod';
import bcrypt from 'bcryptjs';
import { randomBytes, randomUUID, createHmac, timingSafeEqual } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Prisma } from '@prisma/client';
export const runtime = 'nodejs';
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const profile = (u: {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  wishlist: unknown;
}) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  phone: u.phone,
  wishlist: u.wishlist,
});
type Context = { params: Promise<{ path: string[] }> };
export async function GET(request: NextRequest, context: Context) {
  try {
    const route = (await context.params).path.join('/');
    const user = await currentUser();
    if (route === 'catalog') {
      const [products, categories] = await Promise.all([
        db.product.findMany({
          where: { status: { in: ['ACTIVE', 'COMING_SOON'] } },
          include: { variants: true, category: true },
        }),
        db.category.findMany({ orderBy: { sortOrder: 'asc' } }),
      ]);
      return json({
        products: products.map((p) => ({
          ...p,
          details:
            (p.details as Record<string, unknown>).verified === true
              ? p.details
              : { verified: false },
        })),
        categories,
      });
    }
    if (route === 'auth/me') return json({ user: user ? profile(user) : null });
    if (route === 'account') {
      if (!user) return json({ error: 'Please sign in' }, 401);
      return json({
        user: profile(user),
        addresses: await db.address.findMany({ where: { userId: user.id } }),
        orders: await db.order.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            number: true,
            total: true,
            status: true,
            paymentStatus: true,
            mode: true,
            createdAt: true,
            items: true,
          },
        }),
      });
    }
    if (route === 'orders/track') {
      const number = request.nextUrl.searchParams.get('number') || '';
      const token = request.nextUrl.searchParams.get('token') || '';
      await rateLimit(`track-ip:${hash(clientIp(request))}`, 60);
      await rateLimit(`track:${hash(number)}`, 30);
      const order = await db.order.findUnique({ where: { number } });
      if (
        !order ||
        !((token && hash(token) === order.accessHash) || (user && order.userId === user.id))
      )
        return json(
          {
            error:
              'Order not found. Use the private tracking link from your order confirmation, or sign in.',
          },
          404,
        );
      const { accessHash, idempotencyKey, ...safe } = order;
      void accessHash;
      void idempotencyKey;
      return json({ order: safe });
    }
    if (route.startsWith('admin/')) {
      await requireAdmin();
      const entity = route.slice(6);
      if (entity === 'overview') {
        await releaseStaleOrders().catch(() => 0);
        const since = new Date(Date.now() - 86400000);
        const [products, orders, enquiries, customers, lowStock, launch] = await Promise.all([
          db.product.count(),
          db.order.findMany(),
          db.enquiry.count({ where: { status: 'OPEN' } }),
          db.user.count({ where: { role: 'CUSTOMER' } }),
          db.variant.findMany({ where: { stock: { lt: 5 } }, include: { product: true } }),
          readiness(),
        ]);
        const [signupsToday, recentActivity] = await Promise.all([
          db.activityLog.count({ where: { type: 'SIGNUP', createdAt: { gte: since } } }),
          db.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
        ]);
        return json({
          products,
          orders: orders.length,
          pending: orders.filter((o) => o.status === 'PLACED').length,
          revenue: orders
            .filter((o) => o.mode === 'LIVE' && o.paymentStatus === 'PAID')
            .reduce((s, o) => s + o.total, 0),
          demoOrders: orders.filter((o) => o.mode === 'DEMO').length,
          enquiries,
          customers,
          lowStock,
          launch,
          mailConfigured: mailConfigured(),
          signupsToday,
          recentActivity,
        });
      }
      if (entity === 'products')
        return json(
          await db.product.findMany({
            include: { variants: true, category: true },
            orderBy: { createdAt: 'desc' },
          }),
        );
      if (entity === 'categories')
        return json(await db.category.findMany({ orderBy: { sortOrder: 'asc' } }));
      if (entity === 'orders')
        return json(await db.order.findMany({ orderBy: { createdAt: 'desc' } }));
      if (entity === 'customers')
        return json(
          await db.user.findMany({
            where: { role: 'CUSTOMER' },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              createdAt: true,
              _count: { select: { orders: true } },
            },
          }),
        );
      if (entity === 'enquiries')
        return json(await db.enquiry.findMany({ orderBy: { createdAt: 'desc' } }));
      if (entity === 'coupons') return json(await db.coupon.findMany());
      if (entity === 'shipping') return json(await db.shippingRule.findMany());
      if (entity === 'settings') return json(await db.setting.findMany());
      if (entity === 'subscribers') return json(await db.subscriber.findMany());
      if (entity === 'activity')
        return json(
          await db.activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: Math.min(Number(request.nextUrl.searchParams.get('take')) || 300, 1000),
          }),
        );
      if (entity === 'export') {
        const orders = await db.order.findMany({ orderBy: { createdAt: 'desc' } });
        const escape = (v: unknown) =>
          '"' +
          String(v)
            .replace(/^([=+@\-\t\r])/, "'$1")
            .replaceAll('"', '""') +
          '"';
        const csv = [
          [
            'Order',
            'Email',
            'Name',
            'Phone',
            'City',
            'PIN',
            'Mode',
            'Payment',
            'Fulfillment',
            'Total INR',
            'Created',
          ],
          ...orders.map((o) => [
            o.number,
            o.email,
            (o.address as Record<string, string>).name,
            (o.address as Record<string, string>).phone,
            (o.address as Record<string, string>).city,
            (o.address as Record<string, string>).pin,
            o.mode,
            o.paymentStatus,
            o.status,
            o.total / 100,
            o.createdAt.toISOString(),
          ]),
        ]
          .map((row) => row.map(escape).join(','))
          .join('\n');
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="maithilok-orders.csv"',
            'Cache-Control': 'no-store',
          },
        });
      }
    }
    return json({ error: 'Not found' }, 404);
  } catch (error) {
    return fail(error);
  }
}
export async function POST(request: NextRequest, context: Context) {
  try {
    const route = (await context.params).path.join('/');
    checkOrigin(request);
    const ip = clientIp(request);
    if (route === 'admin/upload') {
      const admin = await requireAdmin();
      await rateLimit(`upload:${admin.id}`, 50);
      if (process.env.VERCEL)
        throw new Error(
          'Uploads are not stored permanently on Vercel. Put images in public/products and redeploy, or connect object storage.',
        );
      const form = await request.formData();
      const file = form.get('file');
      if (!(file instanceof File) || file.size > 5 * 1024 * 1024)
        throw new Error('Choose a JPEG, PNG or WebP image under 5 MB');
      const data = Buffer.from(await file.arrayBuffer());
      const ext = data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        ? 'png'
        : data[0] === 255 && data[1] === 216 && data[2] === 255
          ? 'jpg'
          : data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP'
            ? 'webp'
            : null;
      if (!ext) throw new Error('Unsupported image content');
      const filename = `${randomUUID()}.${ext}`;
      await mkdir(path.join(process.cwd(), 'public/uploads'), { recursive: true });
      await writeFile(path.join(process.cwd(), 'public/uploads', filename), data, { flag: 'wx' });
      return json({ url: `/uploads/${filename}` });
    }
    if (Number(request.headers.get('content-length') || 0) > 100000)
      throw new Error('Request is too large');
    const body = await request.json();
    if (route.startsWith('auth/')) {
      const action = route.slice(5);
      await rateLimit(`auth-ip:${hash(ip)}`, 40);
      if (body.email)
        await rateLimit(`auth:${hash(String(body.email).toLowerCase())}:${hash(ip)}`, 10);
      if (action === 'register') {
        const data = z
          .object({ name: z.string().trim().min(2).max(100), email, password: passwordSchema })
          .parse(body);
        if (await db.user.findUnique({ where: { email: data.email } }))
          throw new Error('Unable to register this email. Try signing in or password recovery.');
        const user = await db.user.create({
          data: {
            name: data.name,
            email: data.email,
            passwordHash: await bcrypt.hash(data.password, 12),
          },
        });
        await createSession(user.id);
        await logActivity('SIGNUP', `New customer account: ${user.name}`, {
          email: user.email,
          ip,
          notify: {
            subject: `New sign-up: ${user.name}`,
            text: `A new customer created an account.\n\nName: ${user.name}\nEmail: ${user.email}\nTime: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
          },
        });
        return json({ user: profile(user) });
      }
      if (action === 'login') {
        const data = z.object({ email, password: z.string().min(1).max(128) }).parse(body);
        const user = await db.user.findUnique({ where: { email: data.email } });
        const valid = await bcrypt.compare(
          data.password,
          user?.passwordHash || '$2b$12$kAjuBShxodPZLx1ig5vxjeM2IUDxXtT0YFx4iB9iY.nCaY6LH5nWC',
        );
        if (!user || !valid) {
          await logActivity('LOGIN_FAILED', 'Failed sign-in attempt', {
            email: data.email,
            ip,
            meta: { admin: body.admin === true },
          });
          throw new Error('Email or password is incorrect');
        }
        if (body.admin === true && user.role !== 'ADMIN')
          throw new Error('Administrator access required');
        await createSession(user.id);
        await logActivity(
          user.role === 'ADMIN' ? 'ADMIN_LOGIN' : 'LOGIN',
          `${user.role === 'ADMIN' ? 'Admin' : 'Customer'} signed in: ${user.name}`,
          {
            email: user.email,
            ip,
            ...(user.role === 'ADMIN'
              ? {
                  notify: {
                    subject: 'Admin sign-in',
                    text: `Admin ${user.email} signed in from IP ${ip}. If this was not you, reset the password immediately.`,
                  },
                }
              : {}),
          },
        );
        return json({ user: profile(user) });
      }
      if (action === 'logout') {
        const jar = await cookies();
        const token = jar.get('maithilok_session')?.value;
        if (token) await db.session.deleteMany({ where: { id: hash(token) } });
        jar.delete('maithilok_session');
        return json({ ok: true });
      }
      if (action === 'forgot') {
        const address = email.parse(body.email);
        const user = await db.user.findUnique({ where: { email: address } });
        let previewUrl: string | undefined;
        if (user) {
          const token = randomBytes(32).toString('hex');
          await db.passwordReset.create({
            data: {
              id: hash(token),
              userId: user.id,
              expiresAt: new Date(Date.now() + 30 * 60000),
            },
          });
          const url = `${site.url}/reset-password?token=${token}`;
          if (mailConfigured())
            await sendMail(
              address,
              'Reset your Maithilok password',
              `This link expires in 30 minutes: ${url}`,
            );
          else if (
            process.env.NODE_ENV === 'development' &&
            process.env.ALLOW_LOCAL_RESET_PREVIEW === 'true'
          )
            previewUrl = url;
        }
        return json({
          message:
            'If an account exists and email delivery is configured, a reset link will be sent.',
          previewUrl,
        });
      }
      if (action === 'reset') {
        const password = passwordSchema.parse(body.password);
        const token = z.string().min(32).parse(body.token);
        const reset = await db.passwordReset.findUnique({ where: { id: hash(token) } });
        if (!reset || reset.expiresAt < new Date())
          throw new Error('This reset link is invalid or expired');
        await db.$transaction([
          db.user.update({
            where: { id: reset.userId },
            data: { passwordHash: await bcrypt.hash(password, 12) },
          }),
          db.passwordReset.deleteMany({ where: { userId: reset.userId } }),
          db.session.deleteMany({ where: { userId: reset.userId } }),
        ]);
        await logActivity('PASSWORD_RESET', 'Password reset completed', {
          ip,
          meta: { userId: reset.userId },
        });
        return json({ message: 'Password updated. Please sign in.' });
      }
    }
    if (route === 'enquiries') {
      await rateLimit(`enquiry-ip:${hash(ip)}`, 10);
      const data = enquirySchema.parse(body);
      await rateLimit(`enquiry:${hash(data.email)}`, 3);
      await db.enquiry.create({ data });
      let notificationSent = false;
      try {
        notificationSent = await sendMail(
          ownerEmail(),
          `[Maithilok] ${data.type}: ${data.subject}`,
          `${data.type} from the website\n\nName: ${data.name}\nEmail: ${data.email}\nMobile: ${data.mobile || '-'}\nSubject: ${data.subject}\n\n${data.message}\n\nReply to this email to answer the customer directly.`,
          { replyTo: data.email },
        );
        if (notificationSent)
          await sendMail(
            data.email,
            'We received your message',
            `Namaste,\n\nThank you for writing to Maithilok. We have received your message and will reply within one working day.\n\nFor anything urgent, call or WhatsApp us at ${site.phone}.\n\nTeam Maithilok\nDarbhanga, Bihar`,
          );
      } catch (error) {
        console.error('Enquiry email failed', error);
      }
      await logActivity('ENQUIRY', `${data.type} from ${data.name}: ${data.subject}`, {
        email: data.email,
        ip,
        meta: { emailed: notificationSent },
      });
      return json({
        message: 'Thank you! Your message has reached us. We will reply within one working day.',
        notificationSent,
      });
    }
    if (route === 'newsletter') {
      await rateLimit(`newsletter-ip:${hash(ip)}`, 10);
      const data = z.object({ email, consent: z.literal(true) }).parse(body);
      await db.subscriber.upsert({
        where: { email: data.email },
        create: { email: data.email },
        update: { consentAt: new Date() },
      });
      await logActivity('NEWSLETTER', 'Newsletter subscription', { email: data.email, ip });
      return json({
        message: 'You are on the list! We will write when there is something new from Mithila.',
      });
    }
    if (route === 'cart/quote') {
      await rateLimit(`quote-ip:${hash(ip)}`, 300);
      return json(await quote(body));
    }
    if (route === 'checkout') {
      await rateLimit(`checkout-ip:${hash(ip)}`, 30);
      const data = cartSchema
        .extend({ address: addressSchema, idempotencyKey: z.string().uuid() })
        .parse(body);
      await rateLimit(`checkout:${hash(data.address.email)}`, 15);
      const user = await currentUser();
      const launch = await readiness();
      if (data.mode === 'LIVE' && !launch.ready)
        throw new Error('Online ordering is not open yet. Please try again soon.');
      if (
        data.mode === 'DEMO' &&
        launch.ready &&
        process.env.NEXT_PUBLIC_ALLOW_TEST_CHECKOUT !== 'true'
      )
        throw new Error('Please refresh the page to complete your order with online payment.');
      if (data.mode === 'LIVE') await releaseStaleOrders().catch(() => 0);
      const token = randomBytes(32).toString('hex');
      const order = await db.$transaction(async (tx) => {
        const existing = await tx.order.findUnique({
          where: { idempotencyKey: data.idempotencyKey },
        });
        if (existing)
          throw new Error('This checkout was already submitted. Check your order history.');
        const q = await quote({ ...data, state: data.address.state, pin: data.address.pin }, tx);
        if (data.mode === 'LIVE')
          for (const item of q.items) {
            const changed = await tx.variant.updateMany({
              where: { id: item.variantId, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            });
            if (changed.count !== 1) throw new Error('Stock changed. Please review your cart.');
          }
        return tx.order.create({
          data: {
            number: `ML-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`,
            userId: user?.id,
            email: data.address.email,
            address: data.address,
            items: q.items,
            subtotal: q.subtotal,
            discount: q.discount,
            shipping: q.shipping,
            total: q.total,
            coupon: q.coupon,
            mode: data.mode,
            paymentStatus: data.mode === 'DEMO' ? 'DEMO_SIMULATED' : 'PENDING',
            accessHash: hash(token),
            idempotencyKey: data.idempotencyKey,
          },
        });
      });
      if (data.mode === 'LIVE') {
        try {
          const response = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            signal: AbortSignal.timeout(15000),
            headers: {
              Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: order.total,
              currency: 'INR',
              receipt: order.number,
              notes: { order: order.number, email: order.email },
            }),
          });
          if (!response.ok) throw new Error('Payment provider could not create an order');
          const gateway = await response.json();
          await db.order.update({ where: { id: order.id }, data: { gatewayOrderId: gateway.id } });
          await logActivity('ORDER_PLACED', `Order ${order.number} awaiting payment`, {
            email: order.email,
            ip,
            meta: { order: order.number, total: order.total, mode: 'LIVE' },
          });
          return json({
            orderNumber: order.number,
            token,
            gatewayOrderId: gateway.id,
            key: process.env.RAZORPAY_KEY_ID,
            amount: order.total,
            mode: 'LIVE',
          });
        } catch (error) {
          await db.$transaction(async (tx) => {
            await tx.order.update({
              where: { id: order.id },
              data: { status: 'CANCELLED', paymentStatus: 'FAILED' },
            });
            console.error('Razorpay order creation failed', order.number, error);
            for (const item of order.items as { variantId: string; quantity: number }[])
              await tx.variant.update({
                where: { id: item.variantId },
                data: { stock: { increment: item.quantity } },
              });
          });
          throw error;
        }
      }
      await logActivity('ORDER_PLACED', `Preview order ${order.number}`, {
        email: order.email,
        ip,
        meta: { order: order.number, total: order.total, mode: 'DEMO' },
        notify: { subject: `Preview order ${order.number}`, text: orderText(order) },
      });
      return json({
        orderNumber: order.number,
        token,
        mode: 'DEMO',
        paymentStatus: 'DEMO_SIMULATED',
      });
    }
    if (route === 'payments/verify') {
      const data = z
        .object({
          razorpay_order_id: z.string(),
          razorpay_payment_id: z.string(),
          razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/),
          token: z.string(),
        })
        .parse(body);
      const order = await db.order.findUnique({
        where: { gatewayOrderId: data.razorpay_order_id },
      });
      if (!order || order.mode !== 'LIVE' || hash(data.token) !== order.accessHash)
        throw new Error('Order not found');
      if (!process.env.RAZORPAY_KEY_SECRET) throw new Error('Payments unavailable');
      const expected = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
        .digest();
      if (!timingSafeEqual(expected, Buffer.from(data.razorpay_signature, 'hex')))
        throw new Error('Payment signature verification failed');
      const response = await fetch(
        `https://api.razorpay.com/v1/payments/${encodeURIComponent(data.razorpay_payment_id)}`,
        {
          signal: AbortSignal.timeout(15000),
          headers: {
            Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')}`,
          },
        },
      );
      if (!response.ok) throw new Error('Cannot verify payment');
      const payment = await response.json();
      if (
        payment.status !== 'captured' ||
        payment.amount !== order.total ||
        payment.currency !== 'INR' ||
        payment.order_id !== order.gatewayOrderId
      )
        throw new Error('Payment is not captured or does not match this order');
      const { order: paid, transitioned } = await markPaid(order.id, data.razorpay_payment_id);
      if (transitioned) await paymentNotifications(paid, ip);
      return json({ message: 'Payment verified', orderNumber: order.number });
    }
    if (route === 'account') {
      const user = await currentUser();
      if (!user) return json({ error: 'Please sign in' }, 401);
      if (body.action === 'profile') {
        const data = z
          .object({
            name: z.string().trim().min(2).max(100),
            phone: z.string().regex(/^$|^[6-9]\d{9}$/),
          })
          .parse(body);
        await db.user.update({ where: { id: user.id }, data });
      } else if (body.action === 'wishlist') {
        const ids = z.array(z.string()).max(100).parse(body.ids);
        await db.user.update({ where: { id: user.id }, data: { wishlist: ids } });
      } else if (body.action === 'address') {
        await db.address.create({
          data: { userId: user.id, data: addressSchema.parse(body.address) },
        });
      } else if (body.action === 'deleteAddress') {
        await db.address.deleteMany({ where: { id: String(body.id), userId: user.id } });
      } else throw new Error('Unknown account action');
      return json({ ok: true });
    }
    if (route.startsWith('admin/')) {
      const admin = await requireAdmin();
      const entity = route.slice(6);
      let result: unknown;
      if (entity === 'products') {
        const image = z
          .string()
          .regex(/^\/(products|categories|banners|uploads)\/[a-zA-Z0-9_.-]+$/);
        const schema = z.object({
          id: z.string().optional(),
          name: z.string().min(2).max(100),
          hindiName: z.string().max(100).default(''),
          slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
          categoryId: z.string(),
          subcategory: z.string().default(''),
          description: z.string().min(10).max(10000),
          shortDescription: z.string().min(5).max(250),
          images: z.array(image).min(1).max(12),
          status: z.enum(['DRAFT', 'ACTIVE', 'COMING_SOON']),
          featured: z.boolean(),
          details: z.record(z.string(), z.union([z.string(), z.boolean()])),
          seoTitle: z.string().max(100).default(''),
          seoDescription: z.string().max(200).default(''),
          variants: z.array(
            z.object({
              id: z.string().optional(),
              label: z.string().min(1),
              sku: z.string().min(1),
              weight: z.number().int().positive(),
              price: z.number().int().positive(),
              compareAt: z.number().int().positive().nullable().optional(),
              stock: z.number().int().nonnegative(),
              image: image.or(z.literal('')).default(''),
            }),
          ),
        });
        const data = schema.parse(body);
        if (data.status === 'ACTIVE' && !data.variants.length)
          throw new Error('Active products need a variant');
        if (data.status === 'COMING_SOON' && data.variants.length)
          throw new Error('Coming soon products must have no priced variants');
        const { id, variants, ...product } = data;
        result = await db.$transaction(async (tx) => {
          const p = id
            ? await tx.product.update({ where: { id }, data: product })
            : await tx.product.create({ data: product });
          const retained = variants.flatMap((v) => (v.id ? [v.id] : []));
          await tx.variant.deleteMany({ where: { productId: p.id, id: { notIn: retained } } });
          for (const { id: variantId, ...v } of variants) {
            if (variantId) {
              const belongs = await tx.variant.findFirst({
                where: { id: variantId, productId: p.id },
              });
              if (!belongs) throw new Error('Variant does not belong to product');
              await tx.variant.update({ where: { id: variantId }, data: v });
            } else await tx.variant.create({ data: { ...v, productId: p.id } });
          }
          return p;
        });
      } else if (entity === 'archive') {
        result = await db.product.update({
          where: { id: z.string().parse(body.id) },
          data: { status: 'DRAFT', featured: false },
        });
      } else if (entity === 'categories') {
        const { id, ...data } = z
          .object({
            id: z.string().optional(),
            name: z.string().min(2),
            slug: z.string().regex(/^[a-z0-9-]+$/),
            description: z.string().default(''),
            image: z.string().default(''),
            parentId: z.string().nullable().default(null),
            sortOrder: z.number().int().default(0),
          })
          .parse(body);
        if (id && data.parentId === id) throw new Error('A category cannot be its own parent');
        if (data.parentId) {
          const parent = await db.category.findUnique({ where: { id: data.parentId } });
          if (!parent || parent.parentId) throw new Error('Choose a top-level parent category');
          if (id && (await db.category.count({ where: { parentId: id } })))
            throw new Error('A category with children cannot become a subcategory');
        }
        result = id
          ? await db.category.update({ where: { id }, data })
          : await db.category.create({ data });
      } else if (entity === 'orders') {
        const data = z
          .object({
            id: z.string(),
            status: z.enum([
              'PLACED',
              'PROCESSING',
              'SHIPPED',
              'DELIVERED',
              'CANCELLED',
              'REFUND_REQUESTED',
            ]),
            courier: z.string().max(100).default(''),
            trackingCode: z.string().max(100).default(''),
            trackingUrl: z
              .union([z.literal(''), z.string().url().startsWith('https://')])
              .default(''),
          })
          .parse(body);
        const { id, ...update } = data;
        const order = await db.order.findUniqueOrThrow({ where: { id } });
        if (
          order.mode === 'LIVE' &&
          ['SHIPPED', 'DELIVERED'].includes(data.status) &&
          order.paymentStatus !== 'PAID'
        )
          throw new Error('Only verified paid orders may ship');
        if (order.status === 'CANCELLED' && data.status !== 'CANCELLED')
          throw new Error('Cancelled orders cannot be reopened');
        result = await db.$transaction(async (tx) => {
          if (data.status === 'CANCELLED' && order.status !== 'CANCELLED' && order.mode === 'LIVE')
            for (const item of order.items as { variantId: string; quantity: number }[])
              await tx.variant.updateMany({
                where: { id: item.variantId },
                data: { stock: { increment: item.quantity } },
              });
          return tx.order.update({ where: { id }, data: update });
        });
        if (
          order.mode === 'LIVE' &&
          order.status !== data.status &&
          ['SHIPPED', 'DELIVERED'].includes(data.status)
        )
          try {
            await sendMail(
              order.email,
              data.status === 'SHIPPED'
                ? `Your order ${order.number} has shipped`
                : `Your order ${order.number} was delivered`,
              data.status === 'SHIPPED'
                ? `Good news! Your Maithilok order ${order.number} is on its way from Darbhanga.\n\nCourier: ${data.courier || '-'}\nTracking number: ${data.trackingCode || '-'}${data.trackingUrl ? `\nTrack here: ${data.trackingUrl}` : ''}\n\nTeam Maithilok`
                : `Your Maithilok order ${order.number} has been delivered. We hope you enjoy it!\n\nIf anything is wrong with your order, reply to this email within 48 hours.\n\nTeam Maithilok`,
            );
          } catch (error) {
            console.error('Shipping email failed', error);
          }
      } else if (entity === 'enquiries') {
        const data = z
          .object({
            id: z.string(),
            status: z.enum(['OPEN', 'RESOLVED']),
            reply: z.string().max(5000).default(''),
            send: z.boolean().optional(),
          })
          .parse(body);
        if (data.send) {
          const enquiry = await db.enquiry.findUniqueOrThrow({ where: { id: data.id } });
          if (!data.reply.trim()) throw new Error('Write a reply first');
          if (!(await sendMail(enquiry.email, `Re: ${enquiry.subject}`, data.reply)))
            throw new Error('Email integration is not configured. The reply has not been sent.');
        }
        result = await db.enquiry.update({
          where: { id: data.id },
          data: { status: data.status, reply: data.reply },
        });
      } else if (entity === 'coupons') {
        const { id, ...data } = z
          .object({
            id: z.string().optional(),
            code: z
              .string()
              .trim()
              .toUpperCase()
              .regex(/^[A-Z0-9_-]{3,30}$/),
            percent: z.number().int().min(1).max(90),
            minimum: z.number().int().nonnegative(),
            active: z.boolean(),
            expiresAt: z.coerce.date().nullable().optional(),
          })
          .parse(body);
        result = id
          ? await db.coupon.update({ where: { id }, data })
          : await db.coupon.create({ data });
      } else if (entity === 'shipping') {
        const { id, ...data } = z
          .object({
            id: z.string().optional(),
            name: z.string().min(2),
            states: z.array(z.string()),
            pincodes: z.array(z.string().regex(/^[1-9]\d{5}$/)),
            base: z.number().int().nonnegative(),
            perKg: z.number().int().nonnegative(),
            freeAbove: z.number().int().nonnegative().nullable(),
            active: z.boolean(),
          })
          .parse(body);
        result = id
          ? await db.shippingRule.update({ where: { id }, data })
          : await db.shippingRule.create({ data });
      } else if (entity === 'settings') {
        const data = z
          .object({
            key: z.enum(['store', 'content', 'policies']),
            value: z.record(
              z.string(),
              z.union([z.string().max(20000), z.boolean(), z.array(z.string())]),
            ),
          })
          .parse(body);
        if (data.key === 'store') {
          data.value.name = 'Maithilok';
          data.value.hindiName = 'मैथिल लोक';
        }
        result = await db.setting.upsert({
          where: { key: data.key },
          create: { key: data.key, value: data.value },
          update: { value: data.value },
        });
      } else throw new Error('Unknown administration action');
      await db.auditLog.create({
        data: {
          actorId: admin.id,
          action: entity,
          entityId: String((result as { id?: string })?.id || body.key || ''),
        },
      });
      return json({ ok: true, result });
    }
    return json({ error: 'Not found' }, 404);
  } catch (error) {
    return fail(error);
  }
}
function fail(error: unknown) {
  if (error instanceof ZodError)
    return json(
      { error: error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') },
      400,
    );
  if (error instanceof Prisma.PrismaClientKnownRequestError)
    return json(
      {
        error:
          error.code === 'P2002'
            ? 'This value is already in use.'
            : 'The record could not be saved. Please check related records.',
      },
      400,
    );
  const message = error instanceof Error ? error.message : 'Unable to complete request';
  return json(
    { error: message },
    message === 'Unauthorized' ? 401 : message.startsWith('Too many') ? 429 : 400,
  );
}
