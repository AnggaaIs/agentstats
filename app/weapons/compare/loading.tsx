export default function WeaponComparisonLoading() {
  return (
    <section
      aria-label="Loading weapon comparison"
      className="mx-auto min-h-[45vh] max-w-[86rem] px-4 py-9 sm:px-6 lg:px-8"
    >
      <p className="eyebrow">Loading weapon lab</p>
      <div className="mt-8 skeleton-sweep h-10 max-w-2xl" />
      <div className="mt-4 skeleton-sweep h-3 max-w-xl opacity-60" />
      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="skeleton-sweep h-12 opacity-70" />
          <div className="skeleton-sweep h-48" />
          <div className="skeleton-sweep h-8 w-1/2 opacity-75" />
        </div>
        <div className="space-y-5">
          <div className="skeleton-sweep h-12 opacity-70" />
          <div className="skeleton-sweep h-48" />
          <div className="skeleton-sweep h-8 w-1/2 opacity-75" />
        </div>
      </div>
    </section>
  );
}
