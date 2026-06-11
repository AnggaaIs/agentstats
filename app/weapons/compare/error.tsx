"use client";

export default function WeaponComparisonError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <section className="mx-auto flex min-h-[45vh] max-w-3xl flex-col justify-center px-4 py-10 sm:px-6">
      <p className="eyebrow">Weapon lab unavailable</p>
      <h1 className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.05em]">
        The comparison could not load.
      </h1>
      <p className="mt-5 max-w-xl leading-7 text-[var(--muted)]">
        Weapon statistics are temporarily unavailable.
      </p>
      <button
        type="button"
        onClick={reset}
        className="valorant-action mt-8 min-h-12 w-fit border border-[var(--accent)] bg-[var(--accent)] px-6 text-sm font-black uppercase tracking-widest"
      >
        Try again
      </button>
    </section>
  );
}
