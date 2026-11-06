import Image from 'next/image';
import { MapPin, Phone, Mail, Flame, HandHeart, ShieldCheck, Truck } from 'lucide-react';
import { ButtonLink } from './ui';
import { site, addressLine, telHref } from '@/lib/site';

const steps = [
  ['01', 'Sourced near home', 'Milk and cream come from dairy households in and around Darbhanga.'],
  [
    '02',
    'Slow-cooked in small batches',
    'Cream is churned and simmered slowly until the ghee turns clear and aromatic.',
  ],
  [
    '03',
    'Filtered and sealed',
    'Each batch is filtered, cooled and filled into sealed glass jars.',
  ],
  [
    '04',
    'Packed in Darbhanga',
    'Orders are packed carefully and handed to trusted courier partners.',
  ],
] as const;

const values = [
  [
    Flame,
    'Made the familiar way',
    'The way ghee has been made in Mithila kitchens for generations.',
  ],
  [HandHeart, 'Local livelihoods', 'Every jar supports dairy families and workers in our region.'],
  [ShieldCheck, 'Honest labels', 'Batch, MRP, FSSAI and best-before details printed on every jar.'],
  [Truck, 'Across India', 'From Darbhanga to your doorstep, packed to travel safely.'],
] as const;

export function About({ story }: { story: string }) {
  return (
    <div className="about-page">
      <section className="about-hero container">
        <div>
          <span className="eyebrow">ABOUT MAITHILOK · मैथिल लोक</span>
          <h1>
            Ghee from Darbhanga,
            <br />
            <em>the heart of Mithila.</em>
          </h1>
          <p>
            {story ||
              'Maithilok is a food brand from Darbhanga, Bihar. We started with the one thing every Mithila kitchen keeps close: a jar of good ghee.'}
          </p>
          <div className="hero-buttons">
            <ButtonLink href="/shop">Shop our ghee</ButtonLink>
            <ButtonLink href="/contact" secondary>
              Talk to us
            </ButtonLink>
          </div>
        </div>
        <div className="about-hero-image">
          <Image
            src="/banners/ghee-hero.webp"
            alt="A jar of Maithilok ghee with a brass bowl"
            fill
            priority
            sizes="(max-width:800px) 100vw,48vw"
          />
        </div>
      </section>

      <section className="about-story container">
        <div>
          <span className="eyebrow">OUR NAME</span>
          <h2>Maithil + Lok: the people of Mithila.</h2>
        </div>
        <div className="prose">
          <p>
            Mithila is the land of Maithili, of Vidyapati’s songs, of Madhubani paintings and of
            ponds full of makhana and fish. Darbhanga sits at its centre. Food here is never just
            food: it is the thekua made for Chhath, the dahi-chura on Makar Sankranti and the spoon
            of ghee on a plate of hot rice and dal.
          </p>
          <p>
            Maithilok was started in Darbhanga to carry that table to homes across India, whether
            you grew up in Mithila and miss the taste of home, or you simply want honest food made
            with care.
          </p>
          <p>
            We are beginning with ghee, cow and buffalo, in 500g and 1kg jars. Makhana, thekua,
            sattu, pickles and festival hampers will follow, one carefully chosen product at a time.
          </p>
        </div>
      </section>

      <section className="about-process">
        <div className="container">
          <span className="eyebrow">HOW OUR GHEE IS MADE</span>
          <h2>From a Darbhanga kitchen to yours.</h2>
          <div className="how-grid about-steps">
            {steps.map(([n, t, d]) => (
              <div key={n}>
                <span>{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section container">
        <span className="eyebrow">WHAT WE STAND FOR</span>
        <h2>Small promises we keep.</h2>
        <div className="about-values">
          {values.map(([Icon, t, d]) => (
            <div key={t}>
              <Icon size={26} />
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-visit container">
        <div>
          <span className="eyebrow">FIND US</span>
          <h2>Rooted in Darbhanga, Bihar.</h2>
          <p>
            Questions about a product, a bulk order for a wedding or puja, or just want to say
            hello? We would love to hear from you.
          </p>
        </div>
        <div className="about-contact">
          <span>
            <MapPin size={18} />
            {addressLine()}
          </span>
          <a href={telHref()}>
            <Phone size={18} />
            {site.phone}
          </a>
          <a href={`mailto:${site.email}`}>
            <Mail size={18} />
            {site.email}
          </a>
          <ButtonLink href="/contact">Send us a message</ButtonLink>
        </div>
      </section>
    </div>
  );
}
