'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container empty page-space">
      <h1>A small pause.</h1>
      <p>We couldn’t load this page. Please try again.</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
