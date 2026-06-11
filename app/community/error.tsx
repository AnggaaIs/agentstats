"use client";

interface CommunityErrorProps {
  reset: () => void;
}

export default function CommunityError({ reset }: CommunityErrorProps) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6">
      <p className="eyebrow justify-center">Community unavailable</p>
      <h1 className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.05em]">
        The rankings could not load
      </h1>
      <p className="mt-5 text-[var(--muted)]">
        The community board is temporarily unavailable. Your existing choice
        has not been changed.
      </p>
      <button
        type="button"
        onClick={reset}
        className="valorant-action mt-8 min-h-12 border border-[var(--accent)] px-6 text-xs font-black uppercase tracking-[0.14em]"
      >
        Try again
      </button>
    </section>
  );
}
