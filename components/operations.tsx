'use client';
import Link from 'next/link';
import { Activity, CreditCard, Database, ExternalLink, Mail, Terminal } from 'lucide-react';

export type ServiceStatus = {
  environment: string;
  database: string;
  keyMode: 'missing' | 'test' | 'live' | 'unknown';
  keySecret: boolean;
  webhookSecret: boolean;
  commerceEnabled: boolean;
  emailConfigured: boolean;
  webhookUrl: string;
};

export function Operations({ services }: { services: ServiceStatus }) {
  return (
    <div className="operations">
      <div className="operations-banner">
        <div>
          <span className="eyebrow">YOUR STORE, AT A GLANCE</span>
          <h2>Check your store configuration.</h2>
          <p>
            These checks show saved configuration. A successful test is still needed to verify
            payment and email delivery.
          </p>
        </div>
        <span className="status-pill">{services.environment}</span>
      </div>
      <div className="operations-grid">
        <section className="admin-panel service-card">
          <CreditCard size={25} />
          <h2>Razorpay payments</h2>
          <dl>
            <dt>Store switch</dt>
            <dd>
              {services.commerceEnabled
                ? 'Enabled · readiness checks still apply'
                : 'Off · demo checkout only'}
            </dd>
            <dt>API key mode</dt>
            <dd>{services.keyMode}</dd>
            <dt>API secret</dt>
            <dd>{services.keySecret ? 'Present' : 'Missing'}</dd>
            <dt>Webhook secret</dt>
            <dd>{services.webhookSecret ? 'Present' : 'Missing'}</dd>
          </dl>
          <p>
            Demo checkout does not contact Razorpay or move money. Razorpay Test Mode is a separate
            gateway simulation; it is not enabled by the demo button.
          </p>
          <a
            className="text-link"
            href="https://dashboard.razorpay.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Razorpay <ExternalLink size={14} />
          </a>
        </section>
        <section className="admin-panel service-card">
          <Mail size={25} />
          <h2>Email notifications</h2>
          <span className="status-pill">
            {services.emailConfigured ? 'Configured · delivery not verified' : 'Not configured'}
          </span>
          <p>
            Sign-up, order and enquiry notifications use Gmail or SMTP. Enquiries are saved to the
            database even if email is unavailable.
          </p>
          <p>
            For Gmail, add <code>GMAIL_USER</code> and <code>GMAIL_APP_PASSWORD</code> to the
            deployment environment. Use <code>OWNER_NOTIFY_EMAIL</code> to choose the inbox for
            owner alerts.
          </p>
          <Link className="text-link" href="/admin/messages">
            View saved messages →
          </Link>
        </section>
      </div>
      <section className="admin-panel">
        <span className="eyebrow">WHERE TO FIND YOUR DATA</span>
        <h2>Where your logs are stored</h2>
        <div className="log-destinations">
          <div>
            <Activity />
            <h3>Customer activity</h3>
            <p>
              Sign-ups, logins, orders and enquiries live in the database, visible in your private
              admin. Use the activity page to filter and download records.
            </p>
            <Link className="text-link" href="/admin/activity">
              Activity log →
            </Link>
          </div>
          <div>
            <Database />
            <h3>Database records</h3>
            <p>
              Current database: <strong>{services.database}</strong>. Production uses Neon; the
              local default is a separate SQLite file. Local test records do not appear on the live
              site.
            </p>
            <a
              className="text-link"
              href="https://console.neon.tech/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Neon console <ExternalLink size={14} />
            </a>
          </div>
          <div>
            <Terminal />
            <h3>Errors & deployments</h3>
            <p>
              On Vercel, open your project’s Logs for runtime errors and a deployment’s build log
              for build failures. Locally, use the terminal running the server and browser developer
              tools.
            </p>
            <a
              className="text-link"
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vercel dashboard <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>
      <section className="admin-panel payment-guide">
        <span className="eyebrow">WHEN YOU ARE READY TO LAUNCH</span>
        <h2>Connect payments safely.</h2>
        <ol>
          <li>
            Complete Razorpay business onboarding and website verification. Test the integration in
            an isolated staging environment before accepting real payments.
          </li>
          <li>
            Add <code>RAZORPAY_KEY_ID</code>, <code>RAZORPAY_KEY_SECRET</code> and{' '}
            <code>RAZORPAY_WEBHOOK_SECRET</code> in Vercel environment variables. Never paste
            secrets into website content or commit them to GitHub.
          </li>
          <li>
            Configure the webhook below in Razorpay for <code>payment.captured</code>,{' '}
            <code>order.paid</code>, <code>payment.failed</code> and <code>refund.processed</code>.
            The webhook secret must match the deployment.
          </li>
          <li>
            Finalize product disclosures, FSSAI information, shipping and policies in admin. Enable
            the store approvals and <code>LIVE_COMMERCE_ENABLED=true</code> only after verification,
            then redeploy.
          </li>
        </ol>
        <div className="webhook-address">
          <span>Webhook endpoint</span>
          <code>{services.webhookUrl}</code>
        </div>
        <p>
          Keys being present does not confirm account approval, successful delivery of a webhook, or
          payment capture. Review those in Razorpay.
        </p>
        <Link className="text-link" href="/admin">
          View launch readiness →
        </Link>
      </section>
    </div>
  );
}
