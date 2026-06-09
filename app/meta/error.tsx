"use client";

export default function MetaError({ reset }: { reset: () => void }) {
  return (
    <section className="mx-auto flex min-h-[65vh] max-w-3xl flex-col justify-center px-5 py-20">
      <p className="eyebrow">Meta unavailable</p>
      <h1 className="mt-5 font-display text-5xl font-black uppercase tracking-[-0.05em]">
        The dashboard could not load.
      </h1>
      <p className="mt-5 max-w-xl leading-7 text-[var(--muted)]">
        Patch or Riot service data is temporarily unavailable.
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
