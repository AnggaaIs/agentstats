export default function ReportLoading() {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-[76rem] gap-5 px-4 py-10 sm:px-6 lg:px-8">
      <div className="skeleton-sweep h-52 border border-white/8" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="skeleton-sweep h-32 border border-white/8"
          />
        ))}
      </div>
    </div>
  );
}
