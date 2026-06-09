export default function MetaLoading() {
  return (
    <section
      aria-label="Loading agent meta"
      className="mx-auto min-h-[75vh] max-w-7xl px-5 py-20 lg:px-8"
    >
      <p className="eyebrow">Loading meta</p>
      <div className="mt-8 skeleton-sweep h-10 max-w-2xl" />
      <div className="mt-4 skeleton-sweep h-3 max-w-xl opacity-65" />
      <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-4">
            <div className="skeleton-sweep h-3 w-24 opacity-60" />
            <div className="skeleton-sweep h-9 w-28" />
            <div className="skeleton-sweep h-1 w-full opacity-45" />
          </div>
        ))}
      </div>
    </section>
  );
}
