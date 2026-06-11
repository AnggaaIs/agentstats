import { RouteLink } from "@/components/route-link";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[45vh] max-w-3xl flex-col justify-center px-4 py-10 sm:px-6">
      <p className="eyebrow">Not found</p>
      <h1 className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.055em] sm:text-5xl">
        Nothing here.
      </h1>
      <p className="mt-5 text-[var(--muted)]">
        The player, match, or page you requested could not be found.
      </p>
      <RouteLink
        href="/"
        className="valorant-action mt-6 flex min-h-11 w-fit items-center border border-white/20 px-5 text-xs font-black uppercase tracking-widest hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      >
        Go home
      </RouteLink>
    </section>
  );
}
