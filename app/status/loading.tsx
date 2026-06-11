export default function StatusLoading() {
  return (
    <section
      aria-label="Loading Riot platform status"
      className="mx-auto min-h-[45vh] max-w-[86rem] px-4 py-9 sm:px-6 lg:px-8"
    >
      <p className="eyebrow">Loading service monitor</p>
      <div className="mt-8 skeleton-sweep h-14 max-w-2xl" />
      <div className="mt-5 skeleton-sweep h-5 max-w-xl opacity-65" />
      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="border border-white/10 bg-[var(--panel)] p-6"
          >
            <div className="skeleton-sweep h-4 w-28" />
            <div className="skeleton-sweep mt-4 h-8 w-48" />
            <div className="skeleton-sweep mt-8 h-4 w-full opacity-60" />
          </div>
        ))}
      </div>
    </section>
  );
}
