"use client";

export default function ImproveError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto min-h-[65vh] max-w-[52rem] px-4 py-20 sm:px-6">
      <p className="eyebrow">Review unavailable</p>
      <h1 className="mt-4 font-display text-5xl font-black uppercase tracking-[-0.06em]">
        Riot data could not be loaded
      </h1>
      <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
        The review room needs the latest match window. Try the request again
        without changing your saved plans or notes.
      </p>
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
