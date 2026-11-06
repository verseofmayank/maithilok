'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Star } from 'lucide-react';
import { api, Button } from './ui';

type Review = {
  id: string;
  name: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
};
export function ProductReviews({ productId }: { productId: string }) {
  const [data, setData] = useState<{
    reviews: Review[];
    signedIn: boolean;
    eligible: boolean;
  } | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => {
    setError('');
    api(`reviews?productId=${encodeURIComponent(productId)}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [productId]);
  useEffect(load, [load]);
  return (
    <section id="reviews" className="product-reviews">
      <div className="section-heading">
        <div>
          <span className="eyebrow">FROM YOUR KITCHEN</span>
          <h2>Customer reviews</h2>
        </div>
        {data && data.reviews.length > 0 && (
          <span className="review-average">
            <Star size={20} />
            {(
              data.reviews.reduce((sum, review) => sum + review.rating, 0) / data.reviews.length
            ).toFixed(1)}{' '}
            / 5 · {data.reviews.length} published reviews
          </span>
        )}
      </div>
      {!data && !error && <p role="status">Loading reviews…</p>}
      {error && (
        <div role="alert">
          <p className="error">{error}</p>
          {!data && (
            <Button className="secondary" onClick={load}>
              Try again
            </Button>
          )}
        </div>
      )}
      {data && (
        <>
          {data.reviews.length ? (
            <div className="review-list">
              {data.reviews.map((review) => (
                <article key={review.id}>
                  <div className="review-meta">
                    <strong>{review.name}</strong>
                    <span>Verified purchase</span>
                    <time dateTime={review.createdAt}>
                      {new Date(review.createdAt).toLocaleDateString('en-IN')}
                    </time>
                  </div>
                  <p className="review-stars" aria-label={`${review.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} size={16} fill={i < review.rating ? 'currentColor' : 'none'} />
                    ))}
                  </p>
                  <h3>{review.title}</h3>
                  <p>{review.body}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="review-empty">
              <MessageSquare size={28} />
              <div>
                <h3>No reviews yet</h3>
                <p>
                  Reviews will appear here after customers receive their orders. We only accept
                  reviews from verified purchases.
                </p>
              </div>
            </div>
          )}
          {data.eligible ? (
            <form
              className="review-form"
              onSubmit={async (event) => {
                event.preventDefault();
                setError('');
                setMessage('');
                setBusy(true);
                const form = new FormData(event.currentTarget);
                try {
                  const result = await api('reviews', {
                    productId,
                    rating: Number(form.get('rating')),
                    title: form.get('title'),
                    body: form.get('body'),
                  });
                  setMessage(result.message);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <h3>How was your order?</h3>
              <label>
                Rating
                <select name="rating" defaultValue="5">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option value={rating} key={rating}>
                      {rating} out of 5
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Review title
                <input name="title" required minLength={3} maxLength={100} />
              </label>
              <label>
                Your review
                <textarea name="body" required minLength={20} maxLength={2000} rows={4} />
              </label>
              <p className="small">
                Your first name and review will be public after moderation. Please leave out
                personal contact details.
              </p>
              <Button loading={busy}>Send review</Button>
            </form>
          ) : (
            <p className="review-guidance">
              {data.signedIn ? (
                'You can review this product once your paid order is delivered. Demo orders are not eligible.'
              ) : (
                <>
                  <Link className="text-link" href="/login">
                    Sign in
                  </Link>{' '}
                  to review a delivered order.
                </>
              )}
            </p>
          )}
        </>
      )}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
