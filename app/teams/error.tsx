"use client";

export default function TeamsError({ reset }: { reset: () => void }) {
  return (
    <section className="mx-auto min-h-[60vh] max-w-[52rem] px-4 py-20 sm:px-6">
      <p className="eyebrow">Workspace unavailable</p>
      <h1 className="mt-4 font-display text-5xl font-black uppercase tracking-[-0.06em]">
        Team data could not be loaded
      </h1>
      <button
        type="button"
        onClick={reset}
        className="valorant-action mt-7 min-h-11 border border-[var(--accent)] px-5 text-xs font-black uppercase tracking-[0.14em]"
      >
        Retry
      </button>
    </section>
  );
}
