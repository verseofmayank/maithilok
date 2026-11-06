import { NextResponse } from 'next/server';
import { releaseStaleOrders } from '@/lib/commerce';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'Cron not configured' }, { status: 503 });
  const auth = request.headers.get('authorization') || '';
  const expected = `Bearer ${secret}`;
  // Constant-time-ish comparison
  const a = Buffer.from(auth);
  const b = Buffer.from(expected);
  let ok = a.length === b.length;
  if (ok) {
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    ok = diff === 0;
  }
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const released = await releaseStaleOrders(30);
    return NextResponse.json({ ok: true, released });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to release stale orders' }, { status: 500 });
  }
}
