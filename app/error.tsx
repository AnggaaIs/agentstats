"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center px-5 py-20">
      <p className="eyebrow">Unable to continue</p>
      <h1 className="mt-5 font-display text-6xl font-black uppercase tracking-[-0.06em]">
        Something went wrong.
      </h1>
      <p className="mt-5 max-w-xl text-[var(--muted)]">
        This page could not be opened. The rest of AgentStats is still
        available.
      </p>
      <button
        type="button"
        onClick={reset}
        className="valorant-action mt-8 min-h-12 w-fit border border-[var(--accent)] bg-[var(--accent)] px-6 text-sm font-black uppercase tracking-widest focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        Try again
      </button>
    </section>
  );
}
