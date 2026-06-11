"use client";

export default function StatusError({ reset }: { reset: () => void }) {
  return (
    <section className="mx-auto flex min-h-[45vh] max-w-3xl flex-col justify-center px-4 py-10 sm:px-6">
      <p className="eyebrow">Status unavailable</p>
      <h1 className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.05em]">
        The service monitor could not load.
      </h1>
      <p className="mt-5 max-w-xl leading-7 text-[var(--muted)]">
        Riot status data is temporarily unavailable. You can retry without
        leaving this page.
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
