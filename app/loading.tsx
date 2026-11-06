export default function Loading() {
  return (
    <div className="container page-space" aria-label="Loading page">
      <div className="skeleton skeleton-title" />
      <div className="product-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </div>
    </div>
  );
}
