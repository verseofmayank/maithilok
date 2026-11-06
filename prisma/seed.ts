import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const categories: [string, string, string[]][] = [
    ['Ghee', 'ghee', ['Cow Ghee', 'Buffalo Ghee']],
    ['Makhana', 'makhana', ['Plain Makhana', 'Roasted Makhana', 'Flavoured Makhana']],
    ['Traditional Snacks', 'traditional-snacks', ['Thekua', 'Chura', 'Lai', 'Khaja', 'Papad']],
    ['Flours & Staples', 'flours-staples', ['Sattu', 'Regional Grains']],
    ['Pickles', 'pickles', ['Mango Pickle', 'Mixed Pickle', 'Other Regional Pickles']],
    ['Traditional Sweets', 'traditional-sweets', ['Tilkut', 'Seasonal Sweets']],
    ['Gift Collections', 'gift-collections', ['Festival Hampers', 'Assorted Food Boxes']],
    ['Spices', 'spices', []],
  ];
  for (const [name, slug, subs] of categories) {
    const category = await db.category.upsert({
      where: { slug },
      create: {
        name,
        slug,
        image:
          (
            {
              ghee: '/products/cow-ghee-500g.webp',
              makhana: '/categories/makhana.webp',
              'traditional-snacks': '/categories/thekua.webp',
              'flours-staples': '/categories/sattu.webp',
              pickles: '/categories/pickles.webp',
              'traditional-sweets': '/categories/traditional-sweets.webp',
              'gift-collections': '/categories/gift-hampers.webp',
            } as Record<string, string>
          )[slug] || `/categories/${slug}.svg`,
        description: `Explore ${name.toLowerCase()} in the Maithilok collection.`,
        sortOrder: categories.findIndex((c) => c[1] === slug),
      },
      update: {},
    });
    for (const name of subs) {
      const subslug = name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-');
      await db.category.upsert({
        where: { slug: subslug },
        create: { name, slug: subslug, parentId: category.id },
        update: {},
      });
    }
  }
  const ghee = await db.category.findUniqueOrThrow({ where: { slug: 'ghee' } });
  for (const [name, hindi, slug, prices] of [
    ['Cow Ghee', 'गाय का घी', 'cow-ghee', [79900, 149900]],
    ['Buffalo Ghee', 'भैंस का घी', 'buffalo-ghee', [69900, 139900]],
  ] as const) {
    const copy = {
      description:
        slug === 'cow-ghee'
          ? 'Golden, aromatic cow ghee from Darbhanga, Mithila. Made the familiar way in small batches and sealed in glass jars. Use it for tadka, rotis, dal-chawal, sweets and festive cooking.'
          : 'Rich, creamy buffalo ghee from Darbhanga, Mithila. Thicker and whiter than cow ghee, it is a favourite for halwa, laddoo, parathas and everyday cooking.',
      shortDescription:
        slug === 'cow-ghee'
          ? 'Golden and aromatic, for everyday cooking.'
          : 'Rich and creamy, for sweets and festive cooking.',
    };
    const existing = await db.product.findUnique({ where: { slug } });
    if (existing?.description.startsWith('A familiar place in the Indian kitchen'))
      await db.product.update({ where: { slug }, data: copy });
    await db.product.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        hindiName: hindi,
        slug,
        categoryId: ghee.id,
        subcategory: name,
        ...copy,
        images: [`/products/${slug}-500g.webp`, `/products/${slug}-1kg.webp`],
        status: 'ACTIVE',
        featured: true,
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
        variants: {
          create: [
            {
              label: '500g',
              sku: `ML-${slug.toUpperCase()}-500`,
              weight: 500,
              price: prices[0],
              stock: 30,
              image: `/products/${slug}-500g.webp`,
            },
            {
              label: '1kg',
              sku: `ML-${slug.toUpperCase()}-1000`,
              weight: 1000,
              price: prices[1],
              stock: 20,
              image: `/products/${slug}-1kg.webp`,
            },
          ],
        },
      },
    });
  }
  for (const [name, categorySlug] of [
    ['Makhana', 'makhana'],
    ['Thekua', 'traditional-snacks'],
    ['Sattu', 'flours-staples'],
    ['Pickles', 'pickles'],
    ['Papad', 'traditional-snacks'],
    ['Chura', 'traditional-snacks'],
    ['Tilkut', 'traditional-sweets'],
    ['Lai', 'traditional-snacks'],
    ['Khaja', 'traditional-snacks'],
    ['Traditional Sweets', 'traditional-sweets'],
    ['Traditional Snacks', 'traditional-snacks'],
    ['Gift Hampers', 'gift-collections'],
  ] as const) {
    const cat = await db.category.findUniqueOrThrow({ where: { slug: categorySlug } });
    const slug = name.toLowerCase().replaceAll(' ', '-');
    await db.product.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        slug,
        categoryId: cat.id,
        subcategory: name,
        description: `A new chapter in our collection. ${name} is being planned for Maithilok. Join our newsletter to hear when it arrives.`,
        shortDescription: 'More from Mithila, coming to your table soon.',
        images: [`/categories/${slug}.webp`],
        status: 'COMING_SOON',
        details: { verified: false },
      },
    });
  }
  const settings: Record<string, Record<string, string | boolean>> = {
    store: {
      name: 'Maithilok',
      hindiName: 'मैथिल लोक',
      phone: '+91 7667213605',
      email: 'karnmayank07@gmail.com',
      region: 'Darbhanga, Bihar 846004, India',
      address: 'Darbhanga, Bihar 846004, India',
      gstin: '',
      fssai: '',
      legalReviewed: false,
      shippingReady: false,
      paymentsReady: false,
      commerceEnabled: false,
    },
    content: {
      announcement: 'From Darbhanga, Mithila · Delivering across India',
      heroTitle: 'Ghee from Mithila,\nTo Your Home.',
      heroDescription:
        'Cow and buffalo ghee from Darbhanga, Bihar. Slow-cooked in small batches, sealed in glass jars and delivered across India.',
      story:
        'Maithilok is a food brand from Darbhanga, Bihar. We started with the one thing every Mithila kitchen keeps close: a jar of good ghee. Our cow and buffalo ghee is made the familiar way and packed with care for homes across India.',
      marquee:
        'Festive discounts coming soon | Special launch price on 1kg jars, coming soon | Free shipping offers on the way | Fresh batches from Darbhanga, Mithila | Secure UPI, card & net banking payments',
      heroImage: '/banners/ghee-hero.webp',
    },
    policies: {
      privacy: `Maithilok ("we") collects your name, email, phone number, delivery address and order details only to process orders, provide support and, if you opt in, send updates. Payments are processed by Razorpay; we never see or store your card or UPI credentials.

We do not sell your personal data. We share it only with payment and courier partners as needed to complete your order, or when required by law.

You can ask us to correct or delete your account data at any time by writing to karnmayank07@gmail.com. Grievance officer: Maithilok, Darbhanga, Bihar 846004.`,
      terms: `These terms apply to purchases on this website, operated by Maithilok, Darbhanga, Bihar 846004, India.

Prices are in Indian Rupees and include applicable taxes unless stated otherwise. An order is confirmed only after successful payment verification. We may cancel an order if a product is out of stock or a pricing error occurs; any amount paid will be refunded in full.

Product images are for representation; actual packaging may vary. Please read the label for ingredients, storage and best-before information.

These terms are governed by the laws of India. Courts at Darbhanga, Bihar have jurisdiction.`,
      shipping: `Orders are packed in Darbhanga, Bihar and usually dispatched within 1–2 working days of payment confirmation.

Delivery normally takes 3–8 working days depending on your location. Shipping charges, if any, are shown at checkout before you pay. Tracking details are shared by email and on your order page once the order ships.

If your PIN code is not serviceable, checkout will tell you before payment.`,
      returns: `Because ghee is a food product, we cannot accept returns of opened jars.

If your order arrives damaged, leaking or incorrect, email karnmayank07@gmail.com within 48 hours of delivery with your order number and photos of the package. We will send a replacement or a full refund.

Orders can be cancelled before dispatch for a full refund. Approved refunds are processed to the original payment method within 5–7 working days.`,
    },
  };
  for (const [key, value] of Object.entries(settings)) {
    const existing = await db.setting.findUnique({ where: { key } });
    if (!existing) {
      await db.setting.create({ data: { key, value } });
      continue;
    }
    const current = { ...(existing.value as Record<string, unknown>) };
    let changed = false;
    for (const [field, next] of Object.entries(value)) {
      const old = current[field];
      const stale =
        old === undefined ||
        (typeof old === 'string' &&
          (/owner review required|demo|Rooted in Mithila\. Made for homes|Mithila, Bihar, India$/i.test(
            old,
          ) ||
            /\.png$/.test(old)));
      if (stale && typeof next === 'string') {
        current[field] = next;
        changed = true;
      }
      if (old === undefined && typeof next === 'boolean') {
        current[field] = next;
        changed = true;
      }
    }
    if (changed) await db.setting.update({ where: { key }, data: { value: current as never } });
  }
  const png = (v: string) =>
    v.replace(/^(\/(?:products|categories|banners)\/[\w.-]+)\.png$/, '$1.webp');
  for (const p of await db.product.findMany({ include: { variants: true } })) {
    const images = (p.images as string[]).map(png);
    if (JSON.stringify(images) !== JSON.stringify(p.images))
      await db.product.update({ where: { id: p.id }, data: { images } });
    for (const v of p.variants)
      if (v.image !== png(v.image))
        await db.variant.update({ where: { id: v.id }, data: { image: png(v.image) } });
  }
  for (const c of await db.category.findMany())
    if (c.image !== png(c.image))
      await db.category.update({ where: { id: c.id }, data: { image: png(c.image) } });
  console.log('Seed complete. Catalogue, settings and image paths are up to date.');
}
main().finally(() => db.$disconnect());
