export default function CommunityLoading() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
      <div className="skeleton-sweep h-3 w-40" />
      <div className="skeleton-sweep mt-7 h-16 max-w-3xl" />
      <div className="skeleton-sweep mt-5 h-7 max-w-2xl" />
      <div className="mt-12 grid gap-3">
        <div className="skeleton-sweep h-14" />
        <div className="skeleton-sweep h-28" />
        <div className="skeleton-sweep h-28" />
        <div className="skeleton-sweep h-28" />
      </div>
    </section>
  );
}
