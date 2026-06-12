export default function ImproveLoading() {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-[86rem] gap-5 px-4 py-10 sm:px-6 lg:px-8">
      <div className="skeleton-sweep h-40 border border-white/8" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="skeleton-sweep h-72 border border-white/8" />
        <div className="skeleton-sweep h-72 border border-white/8" />
        <div className="skeleton-sweep h-72 border border-white/8" />
      </div>
      <div className="skeleton-sweep h-64 border border-white/8" />
    </div>
  );
}
