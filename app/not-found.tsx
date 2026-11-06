import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="container empty page-space">
      <span className="eyebrow">A LITTLE OFF THE PATH</span>
      <h1>This page isn’t on the menu.</h1>
      <p>Let’s find your way back to something familiar.</p>
      <Link className="button" href="/shop">
        Explore the collection →
      </Link>
    </div>
  );
}
