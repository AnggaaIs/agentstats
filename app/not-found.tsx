import { RouteLink } from "@/components/route-link";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center px-5 py-20">
      <p className="eyebrow">Not found</p>
      <h1 className="mt-5 font-display text-7xl font-black uppercase tracking-[-0.07em]">
        Nothing here.
      </h1>
      <p className="mt-5 text-[var(--muted)]">
        The player, match, or page you requested could not be found.
      </p>
      <RouteLink
        href="/"
        className="valorant-action mt-8 w-fit border border-white/20 px-6 py-4 text-sm font-black uppercase tracking-widest hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      >
        Go home
      </RouteLink>
    </section>
  );
}
