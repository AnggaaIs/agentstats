export default function Loading() {
  return (
    <section
      aria-label="Loading page"
      className="grid-noise mx-auto min-h-[70vh] max-w-7xl px-5 py-20 lg:px-8"
    >
      <div className="flex items-center gap-4">
        <span className="size-3 rotate-45 bg-[var(--accent)]" />
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--accent)]">
          Loading
        </p>
      </div>
      <div className="mt-8 h-1 max-w-xl overflow-hidden bg-white/8">
        <div className="h-full w-1/2 origin-left bg-[var(--accent)] route-wait" />
      </div>
      <div className="mt-10 skeleton-sweep h-16 max-w-3xl" />
      <div className="mt-5 skeleton-sweep h-5 max-w-xl" />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="skeleton-sweep aspect-[4/5]"
          />
        ))}
      </div>
    </section>
  );
}
