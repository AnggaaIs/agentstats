export default function Loading() {
  return (
    <section
      aria-label="Loading page"
      className="mx-auto min-h-[45vh] max-w-[86rem] px-4 py-10 sm:px-6 lg:px-8"
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
      <div className="mt-10 skeleton-sweep h-10 max-w-2xl" />
      <div className="mt-4 skeleton-sweep h-3 max-w-xl opacity-75" />
      <div className="mt-3 skeleton-sweep h-3 max-w-md opacity-55" />
      <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-4">
            <div className="skeleton-sweep h-36 opacity-80" />
            <div className="skeleton-sweep h-3 w-20 opacity-60" />
            <div className="skeleton-sweep h-6 w-3/4" />
          </div>
        ))}
      </div>
    </section>
  );
}
