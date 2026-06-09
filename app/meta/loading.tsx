export default function MetaLoading() {
  return (
    <section
      aria-label="Loading agent meta"
      className="grid-noise mx-auto min-h-[75vh] max-w-7xl px-5 py-20 lg:px-8"
    >
      <p className="eyebrow">Loading meta</p>
      <div className="mt-8 skeleton-sweep h-20 max-w-3xl" />
      <div className="mt-5 skeleton-sweep h-6 max-w-xl" />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="skeleton-sweep h-32" />
        ))}
      </div>
    </section>
  );
}
